<!-- Unified README after merge conflict resolution -->
# DGWALL / Digital Wallet Logic System

This repository contains Cloudflare Workers powering a secure digital wallet platform (API, Banking, Bot, Frontend, Security) with ChatOps-enabled deployment workflows.

---
## 🇹🇭 สรุปภาษาไทย
ชุดสคริปต์ Cloudflare Worker สำหรับระบบกระเป๋าเงินดิจิทัล ประกอบด้วยโมดูลด้าน API, Banking, Bot, Frontend และ Security รวมถึงระบบตรวจสลิป (OCR) และการปรับใช้ผ่าน GitHub Actions / ChatOps

## Workers
| File | Description |
|------|-------------|
| `api_worker_complete.js` | API core / business endpoints |
| `banking_worker_complete.js` | Bank transactions / slip handling |
| `frontend_worker.js` | Static / frontend delivery |
| `main_bot_worker_complete.js` | Bot & automation logic |
| `security_worker_complete.js` | Security, threat detection, OCR slip verification |

## ChatOps & Deployment
Comment `/deploy api-worker` (example) on Pull Requests to trigger deployment workflow (once Actions workflow is added/configured).

## API (Sample Endpoints)
- `GET /health` – Health check
- `GET /api/status` – Service status
- `POST /internal/audit` – Internal audit logging (protected)

## Local Development
Requires Node.js and Wrangler.

```pwsh
npm install -g wrangler   # if not installed
wrangler dev security_worker_complete.js --local
```

## Deploy Example
```pwsh
wrangler deploy security_worker_complete.js
```

## Slip OCR & Bank Email Verification (Phase 1)
The security worker implements an automated deposit verification flow:
1. Client submits slip image (Base64) to `POST /verification/submit-slip` (Security Worker) with internal API key header.
2. Worker performs lightweight heuristic OCR (no external provider yet) extracting amount/bank/account/date.
3. Pending verification stored in `PENDING_VERIFICATIONS` KV.
4. Bank email webhook (e.g. Gmail push via Pub/Sub -> webhook) calls `POST /webhook/bank-email` with base64 email payload.
5. Email parser extracts amount/reference and matches a pending slip (same amount within 24h).
6. On match: confirms deposit via Banking Worker `/fiat/deposit/confirm`.
7. On failure/no match: record kept for manual review (`unmatched_email_*`).

### Language Support (i18n)
Slip verification endpoint `POST /verification/submit-slip` accepts optional field `lang` (one of: `th`, `en`, `zh`, `km`, `ko`, `id`).
Response messages adapt to the selected language. OCR extraction currently detects only Thai / English content automatically (basic heuristic) while other languages return English messages unless provided.

Example request body:
```json
{
	"userId": "u123",
	"depositId": "d789",
	"slipImageData": "data:image/png;base64,....",
	"lang": "th"
}
```

### Environment Variables (Required)
| Name | Purpose |
|------|---------|
| `INTERNAL_API_KEY` | Shared secret between workers/webhooks |
| `BANKING_WORKER_URL` | Base URL of banking worker used for status updates |
| `PENDING_VERIFICATIONS` | KV namespace binding for pending slips |
| `USER_SESSIONS` | KV for session tokens |
| `ENHANCED_AUDIT_LOGS` | KV for security/audit events |
| `BLOCKED_IPS_KV` | KV for IP block entries |

Optional future (Phase 2+): `GMAIL_WEBHOOK_SECRET`, `OCR_PROVIDER_KEY`.

### Security Notes
- Current OCR is heuristic; replace with production OCR service for accuracy.
- Validate webhook source (add HMAC or secret header) before enabling in production.
- Add rate limiting in front of `submit-slip` to prevent abuse.

## Database / Migrations (Example Flow)
```pwsh
npx wrangler d1 migrations apply wallet-production-db
```

## Configuration Snapshot
- Cloudflare Account ID: 85bcd386f06541844632ecb984afa9fb
- Repository: Chaiya88/logic-digital-wallet
- Initial Setup Date: 2025-08-27

## Roadmap / Next Steps
- Add CI/CD GitHub Actions workflows
- Introduce unit/integration tests
- Refactor into TypeScript modules
- Add secrets management guidelines
- Harden security auditing & anomaly detection rules

## Infrastructure Configuration (Wrangler Multi-Worker)
The root `wrangler.toml` now defines:
- Service bindings for cross-worker calls (`MAIN_BOT`, `API_WORKER`, `BANKING`, `SECURITY`, `FRONTEND`, `BACKUP`).
- KV namespaces for sessions, transactions, rate limits, bank usage, audit logs, commission tracking, slip verification.
- D1 databases for wallet, security audit, transaction logs, user accounts, trading bot state.
- R2 buckets for logs, assets, receipts, and user documents.

Secrets (tokens, API keys) are NOT stored in the repo. Add them via Wrangler:
```pwsh
wrangler secret put INTERNAL_API_KEY
wrangler secret put ADMIN_API_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TRONSCAN_API_KEY
wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Reference environment template: `.env.example` (never commit the filled `.env`).

### Adding a Bank Account (Admin API)
Use the Banking Worker admin endpoint (internal call):
```
POST /admin/bank-accounts/add
Headers: X-Internal-API: <INTERNAL_API_KEY>
Body:
{
	"accountNumber": "6645769717",
	"bankName": "Krungthai",
	"holder": "ไชยา บุญทิ้ง",
	"branch": "Lotus Wonghin",
	"dailyLimit": 2000000,
	"tags": ["primary"],
	"status": "active"
}
```

### Updating Rates
```
POST /admin/rates/update
Headers: X-Internal-API: <INTERNAL_API_KEY>
Body: {
	"exchangeRates": { "THB_USDT": 33.5 },
	"commission": { "deposit": 0.005, "withdraw": 0.01 }
}
```

### Dashboard
```
GET /admin/dashboard
Headers: X-Internal-API: <INTERNAL_API_KEY>
```

Returns utilization, bank account status, pending transactions, alerts.

## License
Private (all rights reserved)

---
> Merge note: Content combined from both original branches; Thai + English sections retained.
