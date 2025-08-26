/**
 * OCRTemplatesManager - Slip OCR & Validation Engine (Phase 1)
 * Lightweight, rule-based parser (no external OCR API) for bank slip text images.
 * Accepts Base64 image/text; attempts to extract amount, bank name, account, date.
 * NOTE: For production OCR, replace extractFromImage() with real provider (Vision API, Tesseract service, etc.).
 */

const BANK_KEYWORDS = [
  'SCB', 'KBank', 'Krungthai', 'Bangkok Bank', 'BBL', 'Krungsri', 'TTB', 'UOB', 'CIMB'
];

// Thai & English amount keywords for language heuristic
const TH_KEYWORDS = ['จำนวน', 'บาท', 'โอนไป', 'รับเงิน'];
const EN_KEYWORDS = ['amount', 'transfer', 'received'];

const AMOUNT_REGEX = /(?:THB|บาท|Amount)\s*[:]?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i;
const ALT_AMOUNT_REGEX = /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))/; // fallback
const DATE_REGEX = /(\d{2}[\/-]\d{2}[\/-]\d{4})|(\d{4}[\/-]\d{2}[\/-]\d{2})/;
const ACCOUNT_REGEX = /(\d{3}-?\d{1}-?\d{5}-?\d{1}|\d{10,12})/; // Generic TH account patterns

class OCRTemplatesManager {
  constructor(env) {
    this.env = env;
  }

  async processDocument(base64Data, type = 'bank_slip', options = {}) {
    try {
      const start = Date.now();
      if (!base64Data || typeof base64Data !== 'string') {
        return this._fail('Invalid slip data (empty).');
      }

      // Accept data URI; strip prefix
      const cleaned = base64Data.includes(',') ? base64Data.split(',').pop() : base64Data;

      // Size guard (avoid extremely large payloads > ~2MB after base64)
      if (cleaned.length > 2_800_000) {
        return this._fail('Slip image too large.');
      }

      // Pseudo OCR: decode base64 to binary, then attempt UTF-8 decode; fallback to regex on base64 for demo
      let text = await this._decodeToText(cleaned);
      if (!text || text.trim().length === 0) {
        text = this._heuristicDecodeFallback(cleaned);
      }

  // Normalize text (single spaces)
  const normalized = text.replace(/\r/g, '').replace(/\n+/g, '\n').trim();

  // Language detection (Thai / English) simple heuristic
  const lang = this._detectLanguage(normalized, options.language);

      const extracted = {};
      const errors = [];

  // Amount extraction (same for TH/EN at this phase)
  let amountMatch = normalized.match(AMOUNT_REGEX) || normalized.match(ALT_AMOUNT_REGEX);
      if (amountMatch) {
        extracted.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      } else {
        errors.push('amount_not_found');
      }

      // Bank name detection
      extracted.bank = BANK_KEYWORDS.find(k => new RegExp(k, 'i').test(normalized)) || null;
      if (!extracted.bank) errors.push('bank_not_detected');

      // Account number
      const acct = normalized.match(ACCOUNT_REGEX);
      if (acct) {
        extracted.account = acct[1].replace(/-/g, '');
      } else {
        errors.push('account_not_found');
      }

      // Date
      const dateMatch = normalized.match(DATE_REGEX);
      if (dateMatch) {
        extracted.date = dateMatch[0].replace(/-/g, '/');
      } else {
        extracted.date = new Date().toISOString(); // fallback
      }

      // Confidence scoring heuristic
      let score = 0;
      if (extracted.amount) score += 40;
      if (extracted.bank) score += 25;
      if (extracted.account) score += 20;
      if (extracted.date) score += 15;

      const valid = score >= 60 && errors.filter(e => e !== 'account_not_found').length === 0; // allow missing account sometimes

      if (!valid) {
        return {
          success: true,
          result: {
            validation: { valid: false, errors },
            extracted_data: { ...extracted, language: lang },
            confidence_score: +(score / 100).toFixed(2),
            processing_ms: Date.now() - start
          }
        };
      }

      return {
        success: true,
        result: {
          validation: { valid: true, errors: [] },
            extracted_data: { ...extracted, language: lang },
            confidence_score: +(score / 100).toFixed(2),
            processing_ms: Date.now() - start
        }
      };
    } catch (err) {
      return this._fail(err.message || 'OCR processing failure.');
    }
  }

  async _decodeToText(cleaned) {
    try {
      const binary = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
      // Heuristic: try decode as UTF-8 text slip (some systems embed text in base64 for testing)
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(binary);
      // If contains many non-printable chars treat as image and bail
      const nonPrintableRatio = (text.match(/[^\x09\x0A\x0D\x20-\x7Eก-๙]/g) || []).length / text.length;
      if (nonPrintableRatio > 0.4) return ''; // likely binary image – can't OCR here
      return text;
    } catch {
      return '';
    }
  }

  _heuristicDecodeFallback(cleaned) {
    // Attempt crude extraction from base64 string itself (demo only)
    const b64Portion = cleaned.slice(0, 500); // limit
    return atob(b64Portion.replace(/[^A-Za-z0-9+/=]/g, '')) || '';
  }

  _fail(message) {
    return {
      success: false,
      error: message,
      result: {
        validation: { valid: false, errors: [message] },
        extracted_data: {},
        confidence_score: 0
      }
    };
  }

  _detectLanguage(text, forced) {
    if (forced && ['th','en'].includes(forced)) return forced;
    const thaiChars = (text.match(/[ก-๙]/g) || []).length;
    const latinChars = (text.match(/[A-Za-z]/g) || []).length;
    const thHits = TH_KEYWORDS.reduce((c,k)=> c + (new RegExp(k,'i').test(text)?1:0),0);
    const enHits = EN_KEYWORDS.reduce((c,k)=> c + (new RegExp(k,'i').test(text)?1:0),0);
    if (thaiChars + thHits*3 > latinChars + enHits*2) return 'th';
    return 'en';
  }
}

export { OCRTemplatesManager };
