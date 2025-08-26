/**
 * DOGLC Security Worker - Complete Implementation
 * Advanced security management, monitoring, and threat detection
 * Includes: Slip Verification System with OCR and Gmail API integration
 */

import { OCRTemplatesManager } from './ocr_commission_systems.js';

// --- Internationalization Support (6 languages) ---
const SUPPORTED_LANGS = ['th','en','zh','km','ko','id']; // Thai, English, Chinese, Khmer, Korean, Indonesian
const DEFAULT_LANG = 'en';

const I18N = {
  slip_received: {
    en: 'Slip received and is being processed.',
    th: 'รับสลิปแล้ว กำลังประมวลผล',
    zh: '已收到转账凭证，正在处理。',
    km: 'បានទទួលស្លិប ហើយកំពុងដំណើរការ។',
    ko: '영수증을 받았으며 처리 중입니다.',
    id: 'Slip diterima dan sedang diproses.'
  },
  missing_fields: {
    en: 'User ID, Deposit ID, and Slip Image are required.',
    th: 'ต้องระบุ User ID, Deposit ID และรูปสลิป',
    zh: '需要提供用户ID、存款ID和转账凭证图片。',
    km: 'ត្រូវការអ្នកប្រើ ID, Deposit ID និងរូបភាពស្លិប។',
    ko: '사용자 ID, 입금 ID 및 영수증 이미지가 필요합니다.',
    id: 'User ID, Deposit ID, dan gambar slip wajib.'
  },
  slip_failed: {
    en: 'Slip processing failed',
    th: 'ประมวลผลสลิปไม่สำเร็จ',
    zh: '凭证处理失败',
    km: 'ដំណើរការស្លិបបរាជ័យ',
    ko: '영수증 처리 실패',
    id: 'Proses slip gagal'
  }
};


// ---------------- Webhook Signature Verification -----------------
async function verifyWebhookSignature(request, env, signature, timestamp) {
  try {
    if (!env.GMAIL_WEBHOOK_SECRET) return false;
    // Replay protection: reject if timestamp older than 5 minutes
    const now = Date.now();
    const tsNum = parseInt(timestamp, 10);
    if (!tsNum || Math.abs(now - tsNum) > 5 * 60 * 1000) return false;
    const body = await request.clone().text();
    const data = `${timestamp}.${body}`;
    const enc = new TextEncoder().encode(data);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.GMAIL_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc);
    const digest = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
    // Constant time compare
    if (digest.length !== signature.length) return false;
    let diff = 0;
    for (let i=0;i<digest.length;i++) diff |= digest.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0;
  } catch (e) {
    console.error('verifyWebhookSignature error', e);
    return false;
  }
}
function t(key, lang) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  return (I18N[key] && I18N[key][l]) || (I18N[key] ? I18N[key][DEFAULT_LANG] : key);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Authentication logic:
    // 1) Default: require INTERNAL_API_KEY header
    // 2) Exception: /webhook/bank-email may alternatively use HMAC signature
    let authenticated = false;
    const internalApiKey = request.headers.get('X-Internal-API');
    if (internalApiKey && internalApiKey === env.INTERNAL_API_KEY) {
      authenticated = true;
    } else if (path === '/webhook/bank-email') {
      // Allow HMAC signature based auth for external webhook source
      const sigHeader = request.headers.get('X-Email-Signature');
      const ts = request.headers.get('X-Email-Timestamp');
      if (sigHeader && ts && await verifyWebhookSignature(request, env, sigHeader, ts)) {
        authenticated = true;
      }
    }
    if (!authenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Auth failed' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      // Security API routing
      switch (path) {
        // --- NEW ROUTES: Slip Verification System ---
        case '/verification/submit-slip':
          if (method === 'POST') return await handleSlipVerification(request, env);
          break;

        case '/webhook/bank-email':
          if (method === 'POST') return await handleBankEmailNotification(request, env);
          break;

        // Authentication & Authorization
        case '/auth/validate':
          if (method === 'POST') return await validateAuthentication(request, env);
          break;
          
        case '/auth/create-session':
          if (method === 'POST') return await createUserSession(request, env);
          break;
          
        case '/auth/revoke-session':
          if (method === 'POST') return await revokeUserSession(request, env);
          break;
          
        case '/auth/check-permissions':
          if (method === 'POST') return await checkUserPermissions(request, env);
          break;
          
        // Security Monitoring
        case '/monitor/login-attempt':
          if (method === 'POST') return await monitorLoginAttempt(request, env);
          break;
          
        case '/monitor/transaction':
          if (method === 'POST') return await monitorTransaction(request, env);
          break;
          
        case '/monitor/api-usage':
          if (method === 'POST') return await monitorAPIUsage(request, env);
          break;
          
        // Threat Detection
        case '/detect/fraud':
          if (method === 'POST') return await detectFraud(request, env);
          break;
          
        case '/detect/anomaly':
          if (method === 'POST') return await detectAnomaly(request, env);
          break;
          
        case '/detect/bot-activity':
          if (method === 'POST') return await detectBotActivity(request, env);
          break;
          
        // Security Management
        case '/security/block-ip':
          if (method === 'POST') return await blockIP(request, env);
          break;
          
        case '/security/unblock-ip':
          if (method === 'POST') return await unblockIP(request, env);
          break;
          
        case '/security/block-user':
          if (method === 'POST') return await blockUser(request, env);
          break;
          
        case '/security/audit-log':
          if (method === 'POST') return await createAuditLog(request, env);
          break;
          
        case '/security/incident':
          if (method === 'POST') return await createSecurityIncident(request, env);
          break;
          
        // Security Reports
        case '/reports/security-summary':
          if (method === 'GET') return await getSecuritySummary(env);
          break;
          
        case '/reports/threat-analysis':
          if (method === 'GET') return await getThreatAnalysis(env);
          break;
          
        case '/reports/audit-trail':
          if (method === 'GET') return await getAuditTrail(request, env);
          break;
          
        // Two-Factor Authentication
        case '/2fa/generate':
          if (method === 'POST') return await generate2FA(request, env);
          break;
          
        case '/2fa/verify':
          if (method === 'POST') return await verify2FA(request, env);
          break;
          
        case '/2fa/disable':
          if (method === 'POST') return await disable2FA(request, env);
          break;
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            message: 'Security API endpoint not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error('Security Worker Error:', error);
      
      // Log security error
      await logSecurityError(error, request, env);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Security operation failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// --- NEW FEATURE: AUTOMATED SLIP VERIFICATION SYSTEM ---

async function handleSlipVerification(request, env) {
  try {
    const { userId, depositId, slipImageData, lang, forceLanguage } = await request.json();
    const useLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    
    if (!userId || !depositId || !slipImageData) {
      return errorResponse(t('missing_fields', useLang), 400, useLang);
    }

    // Initialize OCR processing
    const ocrManager = new OCRTemplatesManager(env);
    const ocrResult = await ocrManager.processDocument(slipImageData, 'bank_slip', { language: forceLanguage });

  if (!ocrResult.success || !ocrResult.result.validation.valid) {
      await updateDepositStatus(depositId, 'verification_failed', 'Invalid slip data.', env);
      
      // Log verification failure
      await logSecurityEvent('slip_verification_failed', userId, {
        depositId: depositId,
        error: ocrResult.error || ocrResult.result.validation.errors.join(', '),
        ip: request.headers.get('CF-Connecting-IP')
      }, env);
      
  return errorResponse(`${t('slip_failed', useLang)}: ${ocrResult.error || ocrResult.result.validation.errors.join(', ')}`, 400, useLang);
    }

    // Store pending verification data
    const pendingData = {
      userId: userId,
      depositId: depositId,
      slipData: ocrResult.result.extracted_data,
      status: 'pending_email_confirmation',
      createdAt: new Date().toISOString(),
      extractedAmount: ocrResult.result.extracted_data.amount,
      verificationScore: ocrResult.result.confidence_score
    };
    
  const pendingKV = env.SLIP_VERIFICATION || env.PENDING_VERIFICATIONS;
  await pendingKV.put(
      `slip_${depositId}`, 
      JSON.stringify(pendingData), 
      { expirationTtl: 86400 }
    );
    
    await updateDepositStatus(depositId, 'pending_verification', 'Waiting for bank confirmation.', env);

    // Log successful slip submission
    await logSecurityEvent('slip_verification_submitted', userId, {
      depositId: depositId,
      extractedAmount: ocrResult.result.extracted_data.amount,
      confidenceScore: ocrResult.result.confidence_score
    }, env);

    return successResponse({ 
      message: t('slip_received', useLang),
      verification_id: `slip_${depositId}`,
      extracted_data: {
        amount: ocrResult.result.extracted_data.amount,
        confidence_score: ocrResult.result.confidence_score
      }
    }, useLang);
    
  } catch (error) {
    console.error('Slip Verification Error:', error);
    
    // Log critical error
    await logSecurityError(error, request, env);
    
  return errorResponse('Failed to handle slip verification.', 500, DEFAULT_LANG);
  }
}

async function handleBankEmailNotification(request, env) {
  try {
    const { message } = await request.json();
    
    if (!message || !message.data) {
      console.log('Invalid bank email webhook payload');
      return successResponse({ message: "Invalid payload" });
    }

    const emailDataB64 = message.data;
    const emailContent = atob(emailDataB64);
    
    // Parse bank email for transaction details
    const emailDetails = parseBankEmail(emailContent);
    
    if (!emailDetails.success) {
      console.log('Email parsing failed:', emailDetails.error);
      return successResponse({ message: "Email ignored - parsing failed" });
    }

    // Find matching pending slip verification
  const { depositId, userId } = await findMatchingSlip(emailDetails.data, env);

    if (depositId && userId) {
      try {
        // Confirm deposit through banking worker
        const bankingResponse = await fetch(`${env.BANKING_WORKER_URL}/fiat/deposit/confirm`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'X-Internal-API': env.INTERNAL_API_KEY 
          },
          body: JSON.stringify({ 
            userId: userId, 
            depositId: depositId, 
            amount: emailDetails.data.amount,
            verificationSource: 'bank_email'
          })
        });

        if (bankingResponse.ok) {
          // Clean up pending verification
          const pendingKV = env.SLIP_VERIFICATION || env.PENDING_VERIFICATIONS;
          await pendingKV.delete(`slip_${depositId}`);
          
          // Log successful verification
          await logSecurityEvent('deposit_verified_via_email', userId, {
            depositId: depositId,
            amount: emailDetails.data.amount,
            bankNotificationTime: new Date().toISOString()
          }, env);
          
          console.log(`Successfully verified and confirmed deposit ${depositId}`);
        } else {
          const error = await bankingResponse.json();
          throw new Error(`Banking worker failed to confirm deposit ${depositId}: ${error.error}`);
        }
      } catch (confirmError) {
        console.error('Deposit confirmation error:', confirmError);
        
        // Update deposit status to failed
        await updateDepositStatus(depositId, 'verification_failed', confirmError.message, env);
        
        // Log the error
        await logSecurityEvent('deposit_confirmation_failed', userId, {
          depositId: depositId,
          error: confirmError.message
        }, env);
      }
    } else {
      // Store unmatched email for manual review
  const pendingKV2 = env.SLIP_VERIFICATION || env.PENDING_VERIFICATIONS;
  await pendingKV2.put(
        `unmatched_email_${Date.now()}`, 
        JSON.stringify({
          emailData: emailDetails.data,
          receivedAt: new Date().toISOString(),
          status: 'unmatched'
        }), 
        { expirationTtl: 86400 * 7 } // Keep for 7 days
      );
      
      console.log('No matching slip found for email amount:', emailDetails.data.amount);
    }

    return successResponse({ message: "Bank email webhook processed successfully" });
    
  } catch (error) {
    console.error("Bank Email Webhook Error:", error);
    await logSecurityError(error, request, env);
    return successResponse({ message: "Error processing webhook - logged for investigation" });
  }
}

function parseBankEmail(emailContent) {
  try {
    // Multiple patterns for different bank email formats
    const patterns = [
      /จำนวน\s+([\d,]+\.\d{2})\s+บาท/i,
      /Amount\s+THB\s+([\d,]+\.\d{2})/i,
      /เงินเข้า\s+([\d,]+\.\d{2})/i,
      /รับเงิน\s+([\d,]+\.\d{2})/i,
      /Transfer\s+Amount\s+([\d,]+\.\d{2})/i
    ];
    
    for (const pattern of patterns) {
      const amountMatch = emailContent.match(pattern);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        
        // Extract additional information if available
        const timeMatch = emailContent.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        const referenceMatch = emailContent.match(/Ref[:\s]+([A-Z0-9]+)/i);
        
        return { 
          success: true, 
          data: { 
            amount: amount,
            timestamp: timeMatch ? timeMatch[1] : null,
            reference: referenceMatch ? referenceMatch[1] : null,
            rawContent: emailContent.substring(0, 500) // First 500 chars for logging
          }
        };
      }
    }
    
    return { success: false, error: 'Could not find amount in email.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findMatchingSlip(emailData, env) {
  try {
  const pendingKV = env.SLIP_VERIFICATION || env.PENDING_VERIFICATIONS;
  const list = await pendingKV.list({ prefix: 'slip_' });
    const now = new Date();
    const matchingCandidates = [];

    for (const key of list.keys) {
  const pendingDataStr = await pendingKV.get(key.name);
      if (pendingDataStr) {
        const pendingData = JSON.parse(pendingDataStr);
        const slipAmount = parseFloat(pendingData.slipData.amount);
        const slipDate = new Date(pendingData.createdAt);
        const timeDiffHours = (now - slipDate) / (1000 * 60 * 60);
        
        // Check for exact amount match within reasonable time window
        if (Math.abs(slipAmount - emailData.amount) < 0.01 && timeDiffHours < 24) {
          matchingCandidates.push({
            depositId: pendingData.depositId,
            userId: pendingData.userId,
            timeDiff: timeDiffHours,
            amountMatch: Math.abs(slipAmount - emailData.amount)
          });
        }
      }
    }

    // Return the best match (closest time, exact amount)
    if (matchingCandidates.length > 0) {
      const bestMatch = matchingCandidates.sort((a, b) => a.timeDiff - b.timeDiff)[0];
      return { depositId: bestMatch.depositId, userId: bestMatch.userId };
    }

    return {};
  } catch (error) {
    console.error('Error finding matching slip:', error);
    return {};
  }
}

async function updateDepositStatus(depositId, status, note, env) {
  try {
    // Update transaction status in database via banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/transactions/update-status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Internal-API': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify({ 
        transactionId: depositId, 
        status: status, 
        note: note,
        updatedBy: 'security_worker'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to update deposit status:', error);
    }
  } catch (error) {
    console.error('Error updating deposit status:', error);
  }
}

// Authentication Functions
async function validateAuthentication(request, env) {
  try {
    const data = await request.json();
    const { token, userId } = data;
    
    if (!token) {
      return errorResponse('Token is required', 400);
    }
    
    // Check session validity
    const sessionData = await env.USER_SESSIONS.get(`session_${token}`);
    
    if (!sessionData) {
      return errorResponse('Invalid or expired session', 401);
    }
    
    const session = JSON.parse(sessionData);
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      await env.USER_SESSIONS.delete(`session_${token}`);
      return errorResponse('Session expired', 401);
    }
    
    // Check user ID match
    if (userId && session.userId !== userId) {
      return errorResponse('User ID mismatch', 401);
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    await env.USER_SESSIONS.put(
      `session_${token}`,
      JSON.stringify(session),
      { expirationTtl: 86400 * 7 } // 7 days
    );
    
    // Log authentication check
    await logSecurityEvent('auth_validated', session.userId, {
      token_hash: await hashString(token),
      ip: request.headers.get('CF-Connecting-IP')
    }, env);
    
    return successResponse({
      valid: true,
      user: {
        userId: session.userId,
        username: session.username,
        permissions: session.permissions || [],
        lastActivity: session.lastActivity
      }
    });
    
  } catch (error) {
    return errorResponse('Authentication validation failed: ' + error.message, 500);
  }
}

async function createUserSession(request, env) {
  try {
    const data = await request.json();
    const { userId, username, permissions = [], deviceInfo } = data;
    
    if (!userId || !username) {
      return errorResponse('User ID and username are required', 400);
    }
    
    // Generate secure session token
    const sessionToken = await generateSecureToken();
    
    const sessionData = {
      userId: userId,
      username: username,
      permissions: permissions,
      deviceInfo: deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + (86400 * 7 * 1000), // 7 days
      ip: request.headers.get('CF-Connecting-IP'),
      userAgent: request.headers.get('User-Agent')
    };
    
    // Store session
    await env.USER_SESSIONS.put(
      `session_${sessionToken}`,
      JSON.stringify(sessionData),
      { expirationTtl: 86400 * 7 }
    );
    
    // Log session creation
    await logSecurityEvent('session_created', userId, {
      token_hash: await hashString(sessionToken),
      device_info: deviceInfo,
      ip: sessionData.ip
    }, env);
    
    return successResponse({
      session_token: sessionToken,
      expires_at: sessionData.expiresAt,
      message: 'Session created successfully'
    });
    
  } catch (error) {
    return errorResponse('Session creation failed: ' + error.message, 500);
  }
}

async function revokeUserSession(request, env) {
  try {
    const data = await request.json();
    const { token, userId } = data;
    
    if (!token) {
      return errorResponse('Token is required', 400);
    }
    
    // Get session data before deletion
    const sessionData = await env.USER_SESSIONS.get(`session_${token}`);
    
    // Delete session
    await env.USER_SESSIONS.delete(`session_${token}`);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      
      // Log session revocation
      await logSecurityEvent('session_revoked', session.userId, {
        token_hash: await hashString(token),
        revoked_by: userId || 'system'
      }, env);
    }
    
    return successResponse({
      message: 'Session revoked successfully'
    });
    
  } catch (error) {
    return errorResponse('Session revocation failed: ' + error.message, 500);
  }
}

async function checkUserPermissions(request, env) {
  try {
    const data = await request.json();
    const { userId, requiredPermissions } = data;
    
    if (!userId || !requiredPermissions) {
      return errorResponse('User ID and required permissions are required', 400);
    }
    
    // Get user permissions from database
    const userPermissions = await getUserPermissions(userId, env);
    
    const hasPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('admin')
    );
    
    return successResponse({
      has_permissions: hasPermissions,
      user_permissions: userPermissions,
      required_permissions: requiredPermissions
    });
    
  } catch (error) {
    return errorResponse('Permission check failed: ' + error.message, 500);
  }
}

// Monitoring Functions
async function monitorLoginAttempt(request, env) {
  try {
    const data = await request.json();
    const { userId, username, success, ip, userAgent, failureReason } = data;
    
    const attemptData = {
      user_id: userId,
      username: username,
      success: success,
      ip: ip,
      user_agent: userAgent,
      failure_reason: failureReason,
      timestamp: new Date().toISOString(),
      country: request.cf?.country,
      asn: request.cf?.asn
    };
    
    // Store login attempt
    await env.ENHANCED_AUDIT_LOGS.put(
      `login_attempt_${Date.now()}_${ip}`,
      JSON.stringify(attemptData),
      { expirationTtl: 86400 * 30 } // Keep for 30 days
    );
    
    // Check for brute force attacks
    if (!success) {
      const recentFailures = await getRecentLoginFailures(ip, username, env);
      
      if (recentFailures >= 5) {
        // Block IP temporarily
        await blockIPTemporarily(ip, 3600, 'brute_force_attempt', env);
        
        // Create security incident
        await createSecurityIncident(new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({
            type: 'brute_force_attack',
            severity: 'high',
            description: `Brute force attack detected from IP ${ip}`,
            affected_users: [userId].filter(Boolean),
            ip_address: ip,
            user_agent: userAgent
          })
        }), env);
      }
    }
    
    return successResponse({
      message: 'Login attempt monitored',
      risk_level: await calculateLoginRisk(attemptData, env)
    });
    
  } catch (error) {
    return errorResponse('Login monitoring failed: ' + error.message, 500);
  }
}

async function monitorTransaction(request, env) {
  try {
    const data = await request.json();
    const { transactionId, userId, amount, recipient, type } = data;
    
    // Enhanced risk assessment for new transaction types
    const riskAssessment = await assessTransactionRisk(data, env);
    
    const monitoringData = {
      transaction_id: transactionId,
      user_id: userId,
      amount: amount,
      recipient: recipient,
      type: type,
      risk_score: riskAssessment.score,
      risk_factors: riskAssessment.factors,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP')
    };
    
    // Store monitoring data
    await env.ENHANCED_AUDIT_LOGS.put(
      `tx_monitor_${transactionId}`,
      JSON.stringify(monitoringData),
      { expirationTtl: 86400 * 90 } // Keep for 90 days
    );
    
    // High-risk transaction handling
    if (riskAssessment.score > 80) {
      await handleHighRiskTransaction(monitoringData, env);
    }
    
    return successResponse({
      risk_assessment: riskAssessment,
      monitoring_id: `tx_monitor_${transactionId}`
    });
    
  } catch (error) {
    return errorResponse('Transaction monitoring failed: ' + error.message, 500);
  }
}

async function monitorAPIUsage(request, env) {
  try {
    const data = await request.json();
    const { userId, endpoint, ip, userAgent, responseTime, statusCode } = data;
    
    const usageData = {
      user_id: userId,
      endpoint: endpoint,
      ip: ip,
      user_agent: userAgent,
      response_time: responseTime,
      status_code: statusCode,
      timestamp: new Date().toISOString()
    };
    
    // Store API usage data
    await env.ENHANCED_AUDIT_LOGS.put(
      `api_usage_${Date.now()}_${userId || ip}`,
      JSON.stringify(usageData),
      { expirationTtl: 86400 * 7 } // Keep for 7 days
    );
    
    // Check for suspicious API usage patterns
    const suspiciousPattern = await detectSuspiciousAPIPattern(userId, ip, env);
    
    if (suspiciousPattern.suspicious) {
      await logSecurityEvent('suspicious_api_usage', userId, {
        pattern: suspiciousPattern.pattern,
        ip: ip,
        endpoint: endpoint
      }, env);
    }
    
    return successResponse({
      message: 'API usage monitored',
      suspicious_pattern: suspiciousPattern
    });
    
  } catch (error) {
    return errorResponse('API usage monitoring failed: ' + error.message, 500);
  }
}

// Fraud Detection Functions
async function detectFraud(request, env) {
  try {
    const data = await request.json();
    const { userId, transactionData, userBehavior } = data;
    
    let fraudScore = 0;
    const fraudFactors = [];
    
    // Velocity analysis
    const velocityCheck = await analyzeTransactionVelocity(userId, transactionData, env);
    if (velocityCheck.suspicious) {
      fraudScore += 30;
      fraudFactors.push('high_transaction_velocity');
    }
    
    // Pattern analysis
    const patternCheck = await analyzeTransactionPatterns(userId, transactionData, env);
    if (patternCheck.suspicious) {
      fraudScore += 25;
      fraudFactors.push('suspicious_transaction_pattern');
    }
    
    // Geographic analysis
    const geoCheck = await analyzeGeographicRisk(request, userId, env);
    if (geoCheck.suspicious) {
      fraudScore += 20;
      fraudFactors.push('geographic_anomaly');
    }
    
    // Device fingerprinting
    const deviceCheck = await analyzeDeviceFingerprint(request, userId, env);
    if (deviceCheck.suspicious) {
      fraudScore += 25;
      fraudFactors.push('device_anomaly');
    }
    
    // Behavioral analysis
    const behaviorCheck = await analyzeBehaviorPattern(userBehavior, userId, env);
    if (behaviorCheck.suspicious) {
      fraudScore += 20;
      fraudFactors.push('behavioral_anomaly');
    }
    
    const result = {
      fraud_score: Math.min(fraudScore, 100),
      fraud_factors: fraudFactors,
      risk_level: getFraudRiskLevel(fraudScore),
      recommended_action: getRecommendedAction(fraudScore),
      analysis_timestamp: new Date().toISOString()
    };
    
    // Store fraud analysis
    await env.ENHANCED_AUDIT_LOGS.put(
      `fraud_analysis_${Date.now()}_${userId}`,
      JSON.stringify({ userId, ...result }),
      { expirationTtl: 86400 * 30 }
    );
    
    return successResponse({
      fraud_detection: result
    });
    
  } catch (error) {
    return errorResponse('Fraud detection failed: ' + error.message, 500);
  }
}

async function detectAnomaly(request, env) {
  try {
    const data = await request.json();
    const { userId, dataPoints, context } = data;
    
    const anomalies = [];
    
    // Statistical anomaly detection
    if (dataPoints && Array.isArray(dataPoints)) {
      const stats = calculateStatistics(dataPoints);
      
      for (let i = 0; i < dataPoints.length; i++) {
        const point = dataPoints[i];
        const zScore = Math.abs((point.value - stats.mean) / stats.standardDeviation);
        
        if (zScore > 3) // More than 3 standard deviations
          anomalies.push({
            index: i,
            value: point.value,
            z_score: zScore,
            type: 'statistical_outlier',
            timestamp: point.timestamp
          });
      }
    }
    
    // Time-based anomaly detection
    const timeAnomalies = await detectTimeBasedAnomalies(userId, env);
    anomalies.push(...timeAnomalies);
    
    // Volume anomaly detection
    const volumeAnomalies = await detectVolumeAnomalies(userId, env);
    anomalies.push(...volumeAnomalies);
    
    const result = {
      total_anomalies: anomalies.length,
      anomalies: anomalies,
      context: context,
      analysis_timestamp: new Date().toISOString()
    };
    
    // Store anomaly analysis
    await env.ENHANCED_AUDIT_LOGS.put(
      `anomaly_detection_${Date.now()}_${userId}`,
      JSON.stringify({ userId, ...result }),
      { expirationTtl: 86400 * 30 }
    );
    
    return successResponse({
      anomaly_detection: result
    });
    
  } catch (error) {
    return errorResponse('Anomaly detection failed: ' + error.message, 500);
  }
}

async function detectBotActivity(request, env) {
  try {
    const data = await request.json();
    const { ip, userAgent, requestPattern, timing } = data;
    
    let botScore = 0;
    const botIndicators = [];
    
    // User agent analysis
    const uaAnalysis = analyzeUserAgent(userAgent);
    if (uaAnalysis.suspicious) {
      botScore += 40;
      botIndicators.push('suspicious_user_agent');
    }
    
    // Request timing analysis
    if (timing && timing.length > 1) {
      const timingAnalysis = analyzeRequestTiming(timing);
      if (timingAnalysis.tooRegular) {
        botScore += 30;
        botIndicators.push('regular_timing_pattern');
      }
    }
    
    // Request pattern analysis
    if (requestPattern) {
      const patternAnalysis = analyzeRequestPattern(requestPattern);
      if (patternAnalysis.suspicious) {
        botScore += 30;
        botIndicators.push('suspicious_request_pattern');
      }
    }
    
    // IP reputation check
    const ipReputationCheck = await checkIPReputation(ip, env);
    if (ipReputationCheck.suspicious) {
      botScore += 25;
      botIndicators.push('bad_ip_reputation');
    }
    
    const result = {
      bot_score: Math.min(botScore, 100),
      bot_indicators: botIndicators,
      is_likely_bot: botScore > 60,
      recommended_action: botScore > 80 ? 'block' : botScore > 60 ? 'challenge' : 'allow',
      analysis_timestamp: new Date().toISOString()
    };
    
    // Store bot analysis
    await env.ENHANCED_AUDIT_LOGS.put(
      `bot_detection_${Date.now()}_${ip}`,
      JSON.stringify({ ip, ...result }),
      { expirationTtl: 86400 * 7 }
    );
    
    // Auto-block if high bot score
    if (botScore > 90) {
      await blockIPTemporarily(ip, 7200, 'automated_bot_detection', env);
    }
    
    return successResponse({
      bot_detection: result
    });
    
  } catch (error) {
    return errorResponse('Bot detection failed: ' + error.message, 500);
  }
}

// Security Management Functions
async function blockIP(request, env) {
  try {
    const data = await request.json();
    const { ip, reason, duration, blockedBy } = data;
    
    if (!ip || !reason) {
      return errorResponse('IP and reason are required', 400);
    }
    
    const blockData = {
      ip: ip,
      reason: reason,
      blocked_by: blockedBy || 'system',
      blocked_at: new Date().toISOString(),
      expires_at: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
      permanent: !duration
    };
    
    // Store block record
    await env.BLOCKED_IPS_KV.put(
      ip,
      JSON.stringify(blockData),
      duration ? { expirationTtl: duration } : undefined
    );
    
    // Log IP block
    await logSecurityEvent('ip_blocked', 'system', blockData, env);
    
    return successResponse({
      message: 'IP blocked successfully',
      block_data: blockData
    });
    
  } catch (error) {
    return errorResponse('IP blocking failed: ' + error.message, 500);
  }
}

async function unblockIP(request, env) {
  try {
    const data = await request.json();
    const { ip, unblockedBy } = data;
    
    if (!ip) {
      return errorResponse('IP is required', 400);
    }
    
    // Get existing block data
    const blockData = await env.BLOCKED_IPS_KV.get(ip);
    
    // Remove block
    await env.BLOCKED_IPS_KV.delete(ip);
    
    // Log IP unblock
    await logSecurityEvent('ip_unblocked', 'system', {
      ip: ip,
      unblocked_by: unblockedBy || 'system',
      previous_block: blockData ? JSON.parse(blockData) : null
    }, env);
    
    return successResponse({
      message: 'IP unblocked successfully'
    });
    
  } catch (error) {
    return errorResponse('IP unblocking failed: ' + error.message, 500);
  }
}

async function blockUser(request, env) {
  try {
    const data = await request.json();
    const { userId, reason, duration, blockedBy } = data;
    
    if (!userId || !reason) {
      return errorResponse('User ID and reason are required', 400);
    }
    
    // Update user status in database
    await env.DB.prepare(`
      UPDATE users 
      SET account_status = 'blocked', updated_at = ?
      WHERE user_id = ?
    `).bind(new Date().toISOString(), userId).run();
    
    // Revoke all user sessions
    await revokeAllUserSessions(userId, env);
    
    // Freeze wallet
    await env.DB.prepare(`
      UPDATE wallets 
      SET is_active = false, updated_at = ?
      WHERE user_id = ?
    `).bind(new Date().toISOString(), userId).run();
    
    // Log user block
    await logSecurityEvent('user_blocked', userId, {
      reason: reason,
      blocked_by: blockedBy || 'system',
      duration: duration
    }, env);
    
    return successResponse({
      message: 'User blocked successfully'
    });
    
  } catch (error) {
    return errorResponse('User blocking failed: ' + error.message, 500);
  }
}

async function createAuditLog(request, env) {
  try {
    const data = await request.json();
    const { event, userId, details, severity = 'info' } = data;
    
    if (!event) {
      return errorResponse('Event type is required', 400);
    }
    
    const auditData = {
      event: event,
      user_id: userId,
      details: details,
      severity: severity,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP'),
      user_agent: request.headers.get('User-Agent')
    };
    
    // Store audit log
    await env.ENHANCED_AUDIT_LOGS.put(
      `audit_log_${Date.now()}_${userId || 'system'}`,
      JSON.stringify(auditData),
      { expirationTtl: 86400 * 365 } // Keep for 1 year
    );
    
    return successResponse({
      message: 'Audit log created successfully',
      log_id: `audit_log_${Date.now()}_${userId || 'system'}`
    });
    
  } catch (error) {
    return errorResponse('Audit log creation failed: ' + error.message, 500);
  }
}

// Security Incident Management
async function createSecurityIncident(request, env) {
  try {
    const data = await request.json();
    const { type, severity, description, affectedUsers, ipAddress, userAgent } = data;
    
    if (!type || !severity || !description) {
      return errorResponse('Type, severity, and description are required', 400);
    }
    
    const incidentId = generateUUID();
    const incidentData = {
      incident_id: incidentId,
      incident_type: type,
      severity: severity,
      affected_users: affectedUsers || [],
      description: description,
      ip_address: ipAddress,
      user_agent: userAgent,
      status: 'open',
      created_at: new Date().toISOString(),
      investigation_notes: [],
      mitigation_actions: []
    };
    
    // Store incident
    await env.SECURITY_TOKENS.put(
      `incident_${incidentId}`,
      JSON.stringify(incidentData),
      { expirationTtl: 86400 * 365 } // Keep for 1 year
    );
    
    // Store in database for querying
    await env.DB.prepare(`
      INSERT INTO security_incidents 
      (incident_id, incident_type, severity, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      incidentId,
      type,
      severity,
      description,
      'open',
      incidentData.created_at
    ).run();
    
    // Auto-response based on severity
    if (severity === 'critical') {
      await handleCriticalIncident(incidentData, env);
    }
    
    return successResponse({
      incident: incidentData,
      message: 'Security incident created'
    });
    
  } catch (error) {
    return errorResponse('Incident creation failed: ' + error.message, 500);
  }
}

// Two-Factor Authentication
async function generate2FA(request, env) {
  try {
    const data = await request.json();
    const { userId } = data;
    
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }
    
    // Generate TOTP secret
    const secret = generateTOTPSecret();
    
    // Store secret temporarily (user must verify within 10 minutes)
    await env.SECURITY_TOKENS.put(
      `2fa_setup_${userId}`,
      JSON.stringify({
        secret: secret,
        verified: false,
        created_at: new Date().toISOString()
      }),
      { expirationTtl: 600 } // 10 minutes
    );
    
    // Generate QR code data
    const qrCodeData = `otpauth://totp/DOGLC:${userId}?secret=${secret}&issuer=DOGLC`;
    
    return successResponse({
      secret: secret,
      qr_code_data: qrCodeData,
      message: 'Please verify the setup using your authenticator app'
    });
    
  } catch (error) {
    return errorResponse('2FA generation failed: ' + error.message, 500);
  }
}

async function verify2FA(request, env) {
  try {
    const data = await request.json();
    const { userId, token, action = 'setup' } = data;
    
    if (!userId || !token) {
      return errorResponse('User ID and token are required', 400);
    }
    
    let isValid = false;
    
    if (action === 'setup') {
      // Verify setup token
      const setupData = await env.SECURITY_TOKENS.get(`2fa_setup_${userId}`);
      
      if (setupData) {
        const setup = JSON.parse(setupData);
        isValid = verifyTOTP(setup.secret, token);
        
        if (isValid) {
          // Save 2FA secret permanently
          await env.SECURITY_TOKENS.put(
            `2fa_secret_${userId}`,
            JSON.stringify({
              secret: setup.secret,
              enabled: true,
              backup_codes: generateBackupCodes(),
              created_at: new Date().toISOString()
            })
          );
          
          // Remove setup data
          await env.SECURITY_TOKENS.delete(`2fa_setup_${userId}`);
          
          // Update user record
          await env.DB.prepare(`
            UPDATE user_preferences 
            SET two_factor_enabled = true
            WHERE user_id = ?
          `).bind(userId).run();
        }
      }
    } else {
      // Verify authentication token
      const secretData = await env.SECURITY_TOKENS.get(`2fa_secret_${userId}`);
      
      if (secretData) {
        const secret = JSON.parse(secretData);
        isValid = verifyTOTP(secret.secret, token);
      }
    }
    
    // Log 2FA attempt
    await logSecurityEvent('2fa_verification', userId, {
      action: action,
      success: isValid,
      ip: request.headers.get('CF-Connecting-IP')
    }, env);
    
    return successResponse({
      valid: isValid,
      message: isValid ? '2FA verification successful' : '2FA verification failed'
    });
    
  } catch (error) {
    return errorResponse('2FA verification failed: ' + error.message, 500);
  }
}

async function disable2FA(request, env) {
  try {
    const data = await request.json();
    const { userId, currentToken } = data;
    
    if (!userId || !currentToken) {
      return errorResponse('User ID and current 2FA token are required', 400);
    }
    
    // Verify current token before disabling
    const secretData = await env.SECURITY_TOKENS.get(`2fa_secret_${userId}`);
    
    if (!secretData) {
      return errorResponse('2FA is not enabled for this user', 400);
    }
    
    const secret = JSON.parse(secretData);
    const isValidToken = verifyTOTP(secret.secret, currentToken);
    
    if (!isValidToken) {
      return errorResponse('Invalid 2FA token', 400);
    }
    
    // Remove 2FA secret
    await env.SECURITY_TOKENS.delete(`2fa_secret_${userId}`);
    
    // Update user record
    await env.DB.prepare(`
      UPDATE user_preferences 
      SET two_factor_enabled = false
      WHERE user_id = ?
    `).bind(userId).run();
    
    // Log 2FA disable
    await logSecurityEvent('2fa_disabled', userId, {
      ip: request.headers.get('CF-Connecting-IP')
    }, env);
    
    return successResponse({
      message: '2FA disabled successfully'
    });
    
  } catch (error) {
    return errorResponse('2FA disable failed: ' + error.message, 500);
  }
}

// Security Reporting Functions
async function getSecuritySummary(env) {
  try {
    const cacheKey = 'security_summary';
    const cachedSummary = await env.SECURITY_TOKENS.get(cacheKey);
    
    if (cachedSummary) {
      return successResponse({
        summary: JSON.parse(cachedSummary)
      });
    }
    
    // Generate security summary
    const summary = {
      active_sessions: await getActiveSessionCount(env),
      blocked_ips: await getBlockedIPCount(env),
      security_incidents: await getSecurityIncidentCount(env),
      failed_logins_24h: await getFailedLoginCount24h(env),
      suspicious_transactions: await getSuspiciousTransactionCount(env),
      pending_verifications: await getPendingVerificationsCount(env),
      threat_level: 'low', // This would be calculated based on various factors
      last_updated: new Date().toISOString(),
      recommendations: await getSecurityRecommendations(env)
    };
    
    // Cache for 5 minutes
    await env.SECURITY_TOKENS.put(
      cacheKey,
      JSON.stringify(summary),
      { expirationTtl: 300 }
    );
    
    return successResponse({
      summary: summary
    });
    
  } catch (error) {
    return errorResponse('Security summary failed: ' + error.message, 500);
  }
}

async function getThreatAnalysis(env) {
  try {
    const cacheKey = 'threat_analysis';
    const cachedAnalysis = await env.SECURITY_TOKENS.get(cacheKey);
    
    if (cachedAnalysis) {
      return successResponse({
        analysis: JSON.parse(cachedAnalysis)
      });
    }
    
    // Generate threat analysis
    const analysis = {
      threat_sources: await analyzeThreatSources(env),
      attack_patterns: await analyzeAttackPatterns(env),
      geographic_risks: await analyzeGeographicRisks(env),
      trending_threats: await identifyTrendingThreats(env),
      mitigation_effectiveness: await assessMitigationEffectiveness(env),
      analysis_period: '24h',
      generated_at: new Date().toISOString()
    };
    
    // Cache for 15 minutes
    await env.SECURITY_TOKENS.put(
      cacheKey,
      JSON.stringify(analysis),
      { expirationTtl: 900 }
    );
    
    return successResponse({
      analysis: analysis
    });
    
  } catch (error) {
    return errorResponse('Threat analysis failed: ' + error.message, 500);
  }
}

async function getAuditTrail(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const eventType = url.searchParams.get('eventType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 1000);
    
    // Build cache key
    const cacheKey = `audit_trail_${userId || 'all'}_${eventType || 'all'}_${startDate || 'all'}_${endDate || 'all'}_${limit}`;
    const cachedTrail = await env.ENHANCED_AUDIT_LOGS.get(cacheKey);
    
    if (cachedTrail) {
      return successResponse({
        audit_trail: JSON.parse(cachedTrail)
      });
    }
    
    // Get audit logs (simplified approach - in production, use proper database queries)
    const auditLogs = await env.ENHANCED_AUDIT_LOGS.list({
      prefix: userId ? `security_event_*_${userId}` : 'security_event_',
      limit: limit
    });
    
    const logs = [];
    for (const key of auditLogs.keys) {
      const logData = await env.ENHANCED_AUDIT_LOGS.get(key.name);
      if (logData) {
        const log = JSON.parse(logData);
        
        // Apply filters
        if (eventType && log.event !== eventType) continue;
        if (startDate && log.timestamp < startDate) continue;
        if (endDate && log.timestamp > endDate) continue;
        
        logs.push(log);
      }
    }
    
    // Sort by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const result = {
      logs: logs.slice(0, limit),
      total_count: logs.length,
      filters_applied: {
        user_id: userId,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate
      },
      generated_at: new Date().toISOString()
    };
    
    // Cache for 2 minutes
    await env.ENHANCED_AUDIT_LOGS.put(
      cacheKey,
      JSON.stringify(result),
      { expirationTtl: 120 }
    );
    
    return successResponse({
      audit_trail: result
    });
    
  } catch (error) {
    return errorResponse('Audit trail retrieval failed: ' + error.message, 500);
  }
}

// Enhanced Transaction Risk Assessment (includes new transaction types)
async function assessTransactionRisk(transactionData, env) {
  let riskScore = 0;
  const riskFactors = [];
  
  // Enhanced for new transaction types (fiat deposits, crypto withdrawals)
  if (transactionData.type === 'fiat_deposit') {
    // Fiat deposit specific risks
    if (transactionData.amount > 50000) { // Large fiat deposit
      riskScore += 25;
      riskFactors.push('large_fiat_deposit');
    }
    
    // Check deposit frequency
    const recentFiatDeposits = await getRecentFiatDeposits(transactionData.userId, env);
    if (recentFiatDeposits > 3) { // More than 3 deposits in 24h
      riskScore += 20;
      riskFactors.push('high_fiat_deposit_frequency');
    }
  } else if (transactionData.type === 'crypto_withdrawal') {
    // Crypto withdrawal specific risks
    if (transactionData.amount > 10000) { // Large crypto withdrawal
      riskScore += 30;
      riskFactors.push('large_crypto_withdrawal');
    }
    
    // Check withdrawal address reputation
    const addressRisk = await checkWithdrawalAddressRisk(transactionData.usdtAddress, env);
    if (addressRisk.high_risk) {
      riskScore += 40;
      riskFactors.push('high_risk_withdrawal_address');
    }
  } else {
    // Original transaction risk assessment for regular transfers
    if (transactionData.amount > 10000) {
      riskScore += 30;
      riskFactors.push('large_amount');
    }
    
    // Frequency-based risk
    const recentTxCount = await getRecentTransactionCount(transactionData.userId, 3600000, env);
    if (recentTxCount > 10) {
      riskScore += 25;
      riskFactors.push('high_frequency');
    }
    
    // Recipient risk
    const recipientRisk = await assessRecipientRisk(transactionData.recipient, env);
    if (recipientRisk.high_risk) {
      riskScore += 40;
      riskFactors.push('high_risk_recipient');
    }
  }
  
  // Common risk factors for all transaction types
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    riskScore += 15;
    riskFactors.push('unusual_hours');
  }
  
  // User history risk
  const userRisk = await assessUserRisk(transactionData.userId, env);
  if (userRisk.high_risk) {
    riskScore += 30;
    riskFactors.push('high_risk_user');
  }
  
  return {
    score: Math.min(riskScore, 100),
    factors: riskFactors,
    level: getRiskLevel(riskScore)
  };
}

// Utility Functions
async function generateSecureToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashString(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

function generateTOTPSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function verifyTOTP(secret, token) {
  // Simplified TOTP verification (in production, use a proper TOTP library)
  const timeStep = Math.floor(Date.now() / 30000);
  
  // Check current and previous time windows for clock skew tolerance
  for (let i = -1; i <= 1; i++) {
    const expectedToken = generateTOTP(secret, timeStep + i);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

function generateTOTP(secret, timeStep) {
  // Simplified TOTP generation (use proper implementation in production)
  const hash = timeStep.toString() + secret;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result = (result + hash.charCodeAt(i)) % 1000000;
  }
  return result.toString().padStart(6, '0');
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

// Analysis Functions
function calculateStatistics(dataPoints) {
  const values = dataPoints.map(p => p.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return { mean, variance, standardDeviation };
}

async function analyzeTransactionVelocity(userId, transactionData, env) {
  try {
    const hourlyTransactions = await getRecentTransactionCount(userId, 3600000, env);
    const dailyVolume = await getDailyTransactionVolume(userId, env);
    
    // Velocity thresholds
    const suspiciousThresholds = {
      hourly_count: 20,
      daily_volume: 50000
    };
    
    return {
      suspicious: hourlyTransactions > suspiciousThresholds.hourly_count || 
                 dailyVolume > suspiciousThresholds.daily_volume,
      hourly_count: hourlyTransactions,
      daily_volume: dailyVolume
    };
  } catch (error) {
    return { suspicious: false };
  }
}

async function analyzeTransactionPatterns(userId, transactionData, env) {
  try {
    const recentTransactions = await getRecentUserTransactions(userId, 24 * 60 * 60 * 1000, env);
    
    // Pattern analysis
    let suspicious = false;
    
    // Check for round number pattern
    const roundNumbers = recentTransactions.filter(tx => tx.amount % 100 === 0);
    if (roundNumbers.length > recentTransactions.length * 0.8) {
      suspicious = true;
    }
    
    // Check for rapid-fire transactions
    const timeDiffs = [];
    for (let i = 1; i < recentTransactions.length; i++) {
      const diff = new Date(recentTransactions[i-1].created_at) - new Date(recentTransactions[i].created_at);
      timeDiffs.push(diff);
    }
    
    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    if (avgTimeDiff < 60000 && recentTransactions.length > 5) { // Less than 1 minute average
      suspicious = true;
    }
    
    return { suspicious };
  } catch (error) {
    return { suspicious: false };
  }
}

async function analyzeGeographicRisk(request, userId, env) {
  try {
    const currentCountry = request.cf?.country;
    const currentIP = request.headers.get('CF-Connecting-IP');
    
    if (!currentCountry) {
      return { suspicious: false };
    }
    
    // Get user's recent login countries
    const recentCountries = await getUserRecentCountries(userId, env);
    
    // Check for geographic anomaly
    if (recentCountries.length > 0 && !recentCountries.includes(currentCountry)) {
      const isHighRiskCountry = await checkHighRiskCountry(currentCountry, env);
      
      return {
        suspicious: isHighRiskCountry || recentCountries.length === 1, // Sudden country change
        current_country: currentCountry,
        recent_countries: recentCountries
      };
    }
    
    return { suspicious: false };
  } catch (error) {
    return { suspicious: false };
  }
}

function analyzeUserAgent(userAgent) {
  if (!userAgent) {
    return { suspicious: true, reason: 'missing_user_agent' };
  }
  
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /python/i,
    /curl/i,
    /wget/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return { suspicious: true, reason: 'suspicious_user_agent_pattern' };
    }
  }
  
  return { suspicious: false };
}

function analyzeRequestTiming(timings) {
  if (timings.length < 3) {
    return { tooRegular: false };
  }
  
  const intervals = [];
  for (let i = 1; i < timings.length; i++) {
    intervals.push(timings[i] - timings[i-1]);
  }
  
  // Check if intervals are too regular (bot-like)
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const standardDeviation = Math.sqrt(variance);
  
  // If standard deviation is very low, it might be bot activity
  return {
    tooRegular: standardDeviation < avgInterval * 0.1 && avgInterval < 5000 // Less than 5 seconds average
  };
}

function analyzeRequestPattern(pattern) {
  // Analyze request patterns for bot-like behavior
  if (pattern.sequential_endpoints && pattern.sequential_endpoints > 0.9) {
    return { suspicious: true, reason: 'sequential_endpoint_access' };
  }
  
  if (pattern.consistent_timing && pattern.timing_variance < 0.1) {
    return { suspicious: true, reason: 'too_consistent_timing' };
  }
  
  return { suspicious: false };
}

async function logSecurityEvent(event, userId, data, env) {
  try {
    const eventData = {
      event: event,
      user_id: userId,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    await env.ENHANCED_AUDIT_LOGS.put(
      `security_event_${Date.now()}_${userId}`,
      JSON.stringify(eventData),
      { expirationTtl: 86400 * 90 } // Keep for 90 days
    );
  } catch (error) {
    console.error('Security event logging error:', error);
  }
}

async function logSecurityError(error, request, env) {
  try {
    const errorData = {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      ip: request.headers.get('CF-Connecting-IP'),
      user_agent: request.headers.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    await env.ENHANCED_AUDIT_LOGS.put(
      `security_error_${Date.now()}`,
      JSON.stringify(errorData),
      { expirationTtl: 86400 * 7 }
    );
  } catch (logError) {
    console.error('Security error logging failed:', logError);
  }
}

// Additional Helper Functions
async function getRecentLoginFailures(ip, username, env) {
  try {
    // This would typically query a time-series database
    // For now, we'll use a simplified approach with KV storage
    const failures = await env.ENHANCED_AUDIT_LOGS.list({
      prefix: `login_attempt_`,
      limit: 100
    });
    
    let count = 0;
    const cutoffTime = Date.now() - (60 * 60 * 1000); // Last hour
    
    for (const key of failures.keys) {
      const data = await env.ENHANCED_AUDIT_LOGS.get(key.name);
      if (data) {
        const attempt = JSON.parse(data);
        if (!attempt.success && 
            (attempt.ip === ip || attempt.username === username) &&
            new Date(attempt.timestamp).getTime() > cutoffTime) {
          count++;
        }
      }
    }
    
    return count;
  } catch (error) {
    return 0;
  }
}

async function blockIPTemporarily(ip, duration, reason, env) {
  const blockData = {
    ip: ip,
    reason: reason,
    blocked_by: 'system',
    blocked_at: new Date().toISOString(),
    duration: duration,
    temporary: true
  };

  try {
    // Store temporary block with TTL if duration provided
    await env.BLOCKED_IPS_KV.put(
      ip,
      JSON.stringify(blockData),
      duration ? { expirationTtl: duration } : undefined
    );

    // Log the temporary block event
    await logSecurityEvent('ip_blocked_temporary', 'system', blockData, env);

    // Return the block record for callers if needed
    return blockData;
  } catch (error) {
    console.error('Failed to temporarily block IP:', error);

    // Log failure to block the IP
    await logSecurityEvent('ip_block_failed', 'system', {
      ip,
      reason,
      error: error.message
    }, env);

    return null;
  }
}

// ocr_commission_systems.js
// Placeholder for OCRTemplatesManager used in security_worker_complete.js

// (Removed inline OCRTemplatesManager placeholder - now imported from ocr_commission_systems.js)

// -----------------------------------------------------
// Multilingual Response Helpers (added for i18n support)
// -----------------------------------------------------
function successResponse(payload, lang = DEFAULT_LANG, status = 200) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  return new Response(JSON.stringify({ success: true, lang: l, ...payload }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message, status = 400, lang = DEFAULT_LANG, extra = {}) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  return new Response(JSON.stringify({ success: false, lang: l, error: message, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export { successResponse, errorResponse };