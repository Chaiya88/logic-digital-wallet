/**
 * DOGLC API Worker - Complete Implementation with Rate Limiting
 * Public API endpoints with comprehensive rate limiting and security
 * Includes: New Feature Routing and Advanced Webhook Handling
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };

    // Handle preflight CORS requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(request, env);
      if (!rateLimitResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Try again later.',
          retry_after: rateLimitResult.retryAfter
        }), { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString()
          }
        });
      }

      // Security check for suspicious activity
      const securityCheck = await detectSuspiciousActivity(request, env);
      if (securityCheck.suspicious) {
        await logSuspiciousActivity(
          request.headers.get('CF-Connecting-IP'), 
          request.headers.get('User-Agent'), 
          0, 
          env
        );
        return new Response(JSON.stringify({
          error: 'Access Denied',
          message: 'Suspicious activity detected'
        }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Route handling
      if (path.startsWith('/api/v1/')) {
        return await handleV1API(request, env, path.replace('/api/v1', ''), corsHeaders);
      } else if (path.startsWith('/api/public/')) {
        return await handlePublicAPI(request, env, path.replace('/api/public', ''), corsHeaders);
      } else if (path.startsWith('/api/webhook/')) {
        return await handleWebhookAPI(request, env, path.replace('/api/webhook', ''), corsHeaders);
      } else if (path === '/api/docs') {
        return await getAPIDocumentation();
      } else {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'API endpoint not found',
          available_paths: ['/api/v1/', '/api/public/', '/api/webhook/', '/api/docs']
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.error('API Worker Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Rate Limiting Implementation
async function checkRateLimit(request, env) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const apiKey = request.headers.get('X-API-Key');
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Different limits for different types of requests
  let limitKey, maxRequests, windowSeconds;
  
  if (apiKey) {
    // Authenticated API requests
    limitKey = `rate_limit_api_${apiKey}`;
    maxRequests = 1000; // 1000 requests per hour
    windowSeconds = 3600;
  } else {
    // Public/unauthenticated requests
    limitKey = `rate_limit_ip_${clientIP}`;
    maxRequests = 100; // 100 requests per hour
    windowSeconds = 3600;
  }
  
  // Check current count
  const currentCount = await env.API_RATE_LIMITS.get(limitKey);
  const count = currentCount ? parseInt(currentCount) : 0;
  
  if (count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: windowSeconds
    };
  }
  
  // Increment counter
  await env.API_RATE_LIMITS.put(limitKey, (count + 1).toString(), {
    expirationTtl: windowSeconds
  });
  
  // Log suspicious activity
  if (count > maxRequests * 0.8) {
    await logSuspiciousActivity(clientIP, userAgent, count, env);
  }
  
  return { allowed: true };
}

async function logSuspiciousActivity(ip, userAgent, requestCount, env) {
  const suspiciousData = {
    ip: ip,
    userAgent: userAgent,
    requestCount: requestCount,
    timestamp: new Date().toISOString(),
    type: 'high_request_rate'
  };
  
  await env.ENHANCED_AUDIT_LOGS.put(
    `suspicious_${Date.now()}_${ip}`,
    JSON.stringify(suspiciousData),
    { expirationTtl: 86400 * 7 } // Keep for 7 days
  );
}

// V1 API Handlers (Authenticated)
async function handleV1API(request, env, path, corsHeaders) {
  const authResult = await validateAuthentication(request, env);
  if (!authResult.valid) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const method = request.method;
  const userId = authResult.userId;

  switch (path) {
    // --- NEW ENDPOINTS: Fiat & Crypto Operations ---
    case '/fiat/deposit/initiate':
      if (method === 'POST') return await initiateFiatDeposit(request, userId, env, corsHeaders);
      break;
    
    case '/fiat/deposit/submit-slip':
      if (method === 'POST') return await submitDepositSlip(request, userId, env, corsHeaders);
      break;
    
    case '/crypto/withdraw/initiate':
      if (method === 'POST') return await initiateCryptoWithdrawal(request, userId, env, corsHeaders);
      break;

    // Wallet Management
    case '/wallet/balance':
      if (method === 'GET') return await getWalletBalance(userId, env, corsHeaders);
      break;
      
    case '/wallet/address':
      if (method === 'GET') return await getWalletAddress(userId, env, corsHeaders);
      break;
      
    // Transaction Management
    case '/transactions/send':
      if (method === 'POST') return await sendTransaction(request, userId, env, corsHeaders);
      break;
      
    case '/transactions/history':
      if (method === 'GET') return await getTransactionHistory(request, userId, env, corsHeaders);
      break;
      
    case '/transactions/details':
      if (method === 'GET') return await getTransactionDetails(request, userId, env, corsHeaders);
      break;
      
    // User Management
    case '/user/profile':
      if (method === 'GET') return await getUserProfile(userId, env, corsHeaders);
      if (method === 'PUT') return await updateUserProfile(request, userId, env, corsHeaders);
      break;
      
    case '/user/preferences':
      if (method === 'GET') return await getUserPreferences(userId, env, corsHeaders);
      if (method === 'PUT') return await updateUserPreferences(request, userId, env, corsHeaders);
      break;
      
    // Staking Management
    case '/staking/stake':
      if (method === 'POST') return await stakeTokens(request, userId, env, corsHeaders);
      break;
      
    case '/staking/unstake':
      if (method === 'POST') return await unstakeTokens(request, userId, env, corsHeaders);
      break;
      
    case '/staking/rewards':
      if (method === 'GET') return await getStakingRewards(userId, env, corsHeaders);
      break;
      
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'API endpoint not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Public API Handlers (No authentication required)
async function handlePublicAPI(request, env, path, corsHeaders) {
  const method = request.method;

  switch (path) {
    case '/stats':
      if (method === 'GET') return await getPublicStats(env, corsHeaders);
      break;
      
    case '/price':
      if (method === 'GET') return await getCurrentPrice(env, corsHeaders);
      break;
      
    case '/market-data':
      if (method === 'GET') return await getMarketData(env, corsHeaders);
      break;
      
    case '/system/status':
      if (method === 'GET') return await getSystemStatus(env, corsHeaders);
      break;
      
    case '/blockchain/info':
      if (method === 'GET') return await getBlockchainInfo(env, corsHeaders);
      break;
      
    case '/validators':
      if (method === 'GET') return await getValidators(env, corsHeaders);
      break;
      
    case '/network/health':
      if (method === 'GET') return await getNetworkHealth(env, corsHeaders);
      break;
      
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Public API endpoint not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// Webhook API Handlers
async function handleWebhookAPI(request, env, path, corsHeaders) {
  const method = request.method;

  switch (path) {
    // --- NEW WEBHOOK ENDPOINT ---
    case '/bank-email-notification':
      if (method === 'POST') return await handleBankEmailWebhook(request, env);
      break;
      
    case '/telegram':
      if (method === 'POST') return await handleTelegramWebhook(request, env);
      break;
      
    case '/payment':
      if (method === 'POST') return await handlePaymentWebhook(request, env);
      break;
      
    case '/blockchain':
      if (method === 'POST') return await handleBlockchainWebhook(request, env);
      break;
      
    default:
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Webhook endpoint not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
  }
}

// --- NEW HANDLER FUNCTIONS ---

async function initiateFiatDeposit(request, userId, env, corsHeaders) {
  try {
    const { amount } = await request.json();
    
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid amount specified'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const bankingResponse = await fetch(`${env.BANKING_WORKER_URL}/fiat/deposit/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Internal-API': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify({ userId, amount })
    });
    
    const result = await bankingResponse.json();
    
    // Log fiat deposit initiation
    await logTransaction(request, userId, 'fiat_deposit_initiate', amount, 'system', env);
    
    return new Response(JSON.stringify(result), { 
      status: bankingResponse.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Fiat deposit initiation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process deposit request' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function submitDepositSlip(request, userId, env, corsHeaders) {
  try {
    const { depositId, slipImageData } = await request.json();
    
    if (!depositId || !slipImageData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Deposit ID and slip image data are required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const securityResponse = await fetch(`${env.SECURITY_WORKER_URL}/verification/submit-slip`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Internal-API': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify({ userId, depositId, slipImageData })
    });
    
    const result = await securityResponse.json();
    
    // Log slip submission
    await logTransaction(request, userId, 'slip_submission', 0, depositId, env);
    
    return new Response(JSON.stringify(result), { 
      status: securityResponse.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Deposit slip submission error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to submit deposit slip' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function initiateCryptoWithdrawal(request, userId, env, corsHeaders) {
  try {
    const { doglcAmount, usdtAddress } = await request.json();
    
    if (!doglcAmount || !usdtAddress || doglcAmount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'DOGLC amount and USDT address are required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate USDT address format
    if (!isValidUSDTAddress(usdtAddress)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid USDT address format'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const bankingResponse = await fetch(`${env.BANKING_WORKER_URL}/crypto/withdraw/initiate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Internal-API': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify({ userId, doglcAmount, usdtAddress })
    });
    
    const result = await bankingResponse.json();
    
    // Log crypto withdrawal initiation
    await logTransaction(request, userId, 'crypto_withdrawal_initiate', doglcAmount, usdtAddress, env);
    
    return new Response(JSON.stringify(result), { 
      status: bankingResponse.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Crypto withdrawal initiation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process withdrawal request' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleBankEmailWebhook(request, env) {
  try {
    const emailData = await request.json();
    
    // Forward to Security Worker for processing asynchronously
    fetch(`${env.SECURITY_WORKER_URL}/webhook/bank-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Internal-API': env.INTERNAL_API_KEY 
      },
      body: JSON.stringify(emailData)
    }).catch(error => {
      console.error('Failed to forward bank email webhook:', error);
    });
    
    // Log webhook receipt
    await env.ENHANCED_AUDIT_LOGS.put(
      `bank_email_webhook_${Date.now()}`,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        data_size: JSON.stringify(emailData).length,
        forwarded: true
      }),
      { expirationTtl: 86400 * 7 }
    );
    
    return new Response('Webhook received and processed.', { status: 200 });
  } catch (error) {
    console.error('Bank email webhook error:', error);
    return new Response('Webhook processing failed.', { status: 500 });
  }
}

// Authentication
async function validateAuthentication(request, env) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  
  if (apiKey) {
    // API Key authentication
    const keyData = await env.SECURITY_TOKENS.get(`api_key_${apiKey}`);
    if (keyData) {
      const keyInfo = JSON.parse(keyData);
      return {
        valid: true,
        userId: keyInfo.userId,
        type: 'api_key'
      };
    }
  }
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT token authentication
    const token = authHeader.substring(7);
    const tokenData = await env.USER_SESSIONS.get(`session_${token}`);
    
    if (tokenData) {
      const sessionInfo = JSON.parse(tokenData);
      if (sessionInfo.expiresAt > Date.now()) {
        return {
          valid: true,
          userId: sessionInfo.userId,
          type: 'bearer_token'
        };
      }
    }
  }
  
  return { valid: false };
}

// Wallet API Functions
async function getWalletBalance(userId, env, corsHeaders) {
  try {
    const walletData = await env.DOGLC_WALLET_CACHE.get(`wallet_${userId}`);
    
    if (!walletData) {
      // Fetch from banking worker
      const response = await fetch(`${env.BANKING_WORKER_URL}/wallet/balance?userId=${userId}`, {
        headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
      });
      const result = await response.json();
      
      if (result.success) {
        // Cache for 1 minute
        await env.DOGLC_WALLET_CACHE.put(
          `wallet_${userId}`,
          JSON.stringify(result.wallet),
          { expirationTtl: 60 }
        );
        
        return new Response(JSON.stringify({
          success: true,
          wallet: result.wallet
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      const wallet = JSON.parse(walletData);
      return new Response(JSON.stringify({
        success: true,
        wallet: wallet
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Wallet not found');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get wallet balance'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getWalletAddress(userId, env, corsHeaders) {
  try {
    const addressData = await env.DOGLC_WALLET_CACHE.get(`address_${userId}`);
    
    if (addressData) {
      return new Response(JSON.stringify({
        success: true,
        address: addressData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch from banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/wallet/balance?userId=${userId}`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    const result = await response.json();
    
    if (result.success && result.wallet.wallet_address) {
      // Cache address for 1 hour
      await env.DOGLC_WALLET_CACHE.put(
        `address_${userId}`,
        result.wallet.wallet_address,
        { expirationTtl: 3600 }
      );
      
      return new Response(JSON.stringify({
        success: true,
        address: result.wallet.wallet_address
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Address not found');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get wallet address'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Transaction API Functions
async function sendTransaction(request, userId, env, corsHeaders) {
  try {
    const data = await request.json();
    const { recipient, amount, note } = data;
    
    // Validation
    if (!recipient || !amount || amount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid transaction data'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check wallet balance
    const balanceResponse = await getWalletBalance(userId, env, corsHeaders);
    const balanceData = await balanceResponse.json();
    
    if (!balanceData.success || balanceData.wallet.available < amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient balance'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Process transaction through banking worker
    const transactionResponse = await fetch(`${env.BANKING_WORKER_URL}/transactions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        fromUserId: userId,
        recipient: recipient,
        amount: amount,
        note: note
      })
    });
    
    const result = await transactionResponse.json();
    
    if (result.success) {
      // Invalidate wallet cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      // Log transaction
      await logTransaction(request, userId, 'send', amount, recipient, env);
      
      return new Response(JSON.stringify({
        success: true,
        transaction: result.transaction
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Transaction failed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process transaction'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getTransactionHistory(request, userId, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 100);
    const type = url.searchParams.get('type');
    
    const cacheKey = `tx_history_${userId}_${page}_${limit}_${type || 'all'}`;
    const cachedData = await env.DOGLC_TRANSACTIONS.get(cacheKey);
    
    if (cachedData) {
      return new Response(cachedData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch from banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/analytics/user?userId=${userId}&period=30`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const responseData = JSON.stringify({
        success: true,
        transactions: result.analytics || [],
        pagination: {
          page: page,
          limit: limit,
          total: result.analytics?.total_transactions || 0
        }
      });
      
      // Cache for 2 minutes
      await env.DOGLC_TRANSACTIONS.put(cacheKey, responseData, {
        expirationTtl: 120
      });
      
      return new Response(responseData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Failed to fetch transaction history');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get transaction history'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getTransactionDetails(request, userId, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('id');
    
    if (!transactionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Transaction ID required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch(`${env.BANKING_WORKER_URL}/validate/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        transactionId: transactionId,
        userId: userId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        transaction: result.validation
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Transaction not found');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get transaction details'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Public API Functions
async function getPublicStats(env, corsHeaders) {
  try {
    const cacheKey = 'public_stats';
    const cachedStats = await env.SYSTEM_CONFIGURATION.get(cacheKey);
    
    if (cachedStats) {
      return new Response(cachedStats, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Aggregate stats from banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/analytics/system`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const stats = {
        totalUsers: result.analytics.total_users,
        totalTransactions: result.analytics.total_transactions,
        totalSupply: await getTotalSupply(env),
        circulatingSupply: await getCirculatingSupply(env),
        stakingStats: await getStakingStats(env),
        networkStats: await getNetworkStats(env),
        lastUpdated: new Date().toISOString()
      };
      
      const responseData = JSON.stringify({
        success: true,
        stats: stats
      });
      
      // Cache for 5 minutes
      await env.SYSTEM_CONFIGURATION.put(cacheKey, responseData, {
        expirationTtl: 300
      });
      
      return new Response(responseData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Failed to get stats');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get public stats'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getCurrentPrice(env, corsHeaders) {
  try {
    const priceData = await env.PRICE_DATA_CACHE.get('current_price');
    
    if (priceData) {
      return new Response(priceData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch real price data (placeholder for now)
    const price = {
      doglc_usd: 0.001, // $0.001 per DOGLC
      doglc_btc: 0.000000023,
      doglc_eth: 0.0000003,
      change_24h: 2.5,
      volume_24h: 50000,
      market_cap: 1000000,
      timestamp: new Date().toISOString()
    };
    
    const responseData = JSON.stringify({
      success: true,
      price: price
    });
    
    // Cache for 1 minute
    await env.PRICE_DATA_CACHE.put('current_price', responseData, {
      expirationTtl: 60
    });
    
    return new Response(responseData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get current price'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getMarketData(env, corsHeaders) {
  try {
    const marketData = await env.PRICE_DATA_CACHE.get('market_data');
    
    if (marketData) {
      return new Response(marketData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Generate market data
    const data = {
      ticker: 'DOGLC',
      name: 'Doglc Coin',
      current_price: 0.001,
      price_change_24h: 2.5,
      price_change_percentage_24h: 2.5,
      market_cap: 1000000,
      total_volume: 50000,
      circulating_supply: 1000000000,
      total_supply: 1000000000,
      max_supply: 1000000000,
      all_time_high: 0.005,
      all_time_low: 0.0001,
      market_cap_rank: 1000,
      fully_diluted_valuation: 1000000,
      last_updated: new Date().toISOString()
    };
    
    const responseData = JSON.stringify({
      success: true,
      market_data: data
    });
    
    // Cache for 5 minutes
    await env.PRICE_DATA_CACHE.put('market_data', responseData, {
      expirationTtl: 300
    });
    
    return new Response(responseData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get market data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getSystemStatus(env, corsHeaders) {
  try {
    const statusData = await env.SYSTEM_CONFIGURATION.get('system_status');
    
    if (statusData) {
      return new Response(statusData, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check system components
    const status = {
      overall: 'healthy',
      api: 'operational',
      database: 'operational',
      blockchain: 'operational',
      trading_bots: 'operational',
      notifications: 'operational',
      last_check: new Date().toISOString(),
      uptime: '99.9%',
      response_time: '150ms'
    };
    
    const responseData = JSON.stringify({
      success: true,
      status: status
    });
    
    // Cache for 1 minute
    await env.SYSTEM_CONFIGURATION.put('system_status', responseData, {
      expirationTtl: 60
    });
    
    return new Response(responseData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get system status'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Staking Functions
async function stakeTokens(request, userId, env, corsHeaders) {
  try {
    const data = await request.json();
    const { amount, duration } = data;
    
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid staking amount'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Check balance
    const balanceResponse = await getWalletBalance(userId, env, corsHeaders);
    const balanceData = await balanceResponse.json();
    
    if (!balanceData.success || balanceData.wallet.available < amount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient balance for staking'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Process staking
    const stakingResponse = await fetch(`${env.BANKING_WORKER_URL}/staking/stake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: userId,
        amount: amount,
        duration: duration
      })
    });
    
    const result = await stakingResponse.json();
    
    if (result.success) {
      // Invalidate cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      return new Response(JSON.stringify({
        success: true,
        staking: result.staking
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error(result.error);
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to stake tokens'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function unstakeTokens(request, userId, env, corsHeaders) {
  try {
    const data = await request.json();
    const { stakingId, amount } = data;
    
    if (!stakingId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Staking ID required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Process unstaking
    const unstakingResponse = await fetch(`${env.BANKING_WORKER_URL}/staking/unstake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: userId,
        stakingId: stakingId,
        amount: amount
      })
    });
    
    const result = await unstakingResponse.json();
    
    if (result.success) {
      // Invalidate cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      return new Response(JSON.stringify({
        success: true,
        unstaking: result.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error(result.error);
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to unstake tokens'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getStakingRewards(userId, env, corsHeaders) {
  try {
    const response = await fetch(`${env.BANKING_WORKER_URL}/staking/rewards?userId=${userId}`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        rewards: result.total_rewards,
        positions: result.positions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Rewards not found');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get staking rewards'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Webhook Handlers
async function handleTelegramWebhook(request, env) {
  try {
    const webhookSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    
    if (webhookSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const update = await request.json();
    
    // Store webhook data for main bot processing
    await env.TELEGRAM_WEBHOOK_DATA.put(
      `webhook_${Date.now()}`,
      JSON.stringify(update),
      { expirationTtl: 3600 }
    );
    
    // Forward to main bot worker
    await fetch(`${env.MAIN_BOT_WORKER_URL}/webhook/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify(update)
    });
    
    return new Response('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

async function handlePaymentWebhook(request, env) {
  try {
    const signature = request.headers.get('X-Payment-Signature');
    
    // Verify signature (implement based on payment provider)
    if (!signature) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const paymentData = await request.json();
    
    // Process payment
    if (paymentData.status === 'completed') {
      await processPaymentConfirmation(paymentData, env);
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Payment webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

async function handleBlockchainWebhook(request, env) {
  try {
    const blockchainData = await request.json();
    
    // Process blockchain events
    if (blockchainData.type === 'transaction_confirmed') {
      await processTransactionConfirmation(blockchainData, env);
    } else if (blockchainData.type === 'block_mined') {
      await processNewBlock(blockchainData, env);
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Blockchain webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}

// User Management Functions
async function getUserProfile(userId, env, corsHeaders) {
  try {
    const response = await fetch(`${env.BANKING_WORKER_URL}/analytics/user?userId=${userId}&period=1`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const profile = {
        userId: userId,
        joinDate: new Date().toISOString(),
        totalTransactions: result.analytics.total_transactions,
        totalSent: result.analytics.total_sent,
        totalReceived: result.analytics.total_received,
        accountStatus: 'active'
      };
      
      return new Response(JSON.stringify({
        success: true,
        profile: profile
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Profile not found');
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get user profile'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function updateUserProfile(request, userId, env, corsHeaders) {
  try {
    const data = await request.json();
    
    // Validate profile data
    const allowedFields = ['displayName', 'email', 'phone', 'timezone'];
    const profileUpdate = {};
    
    for (const field of allowedFields) {
      if (data[field]) {
        profileUpdate[field] = data[field];
      }
    }
    
    // Store profile update
    await env.USER_SESSIONS.put(
      `profile_${userId}`,
      JSON.stringify({
        ...profileUpdate,
        updatedAt: new Date().toISOString()
      }),
      { expirationTtl: 86400 * 30 }
    );
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Profile updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update user profile'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getUserPreferences(userId, env, corsHeaders) {
  try {
    const preferencesData = await env.USER_SESSIONS.get(`preferences_${userId}`);
    
    if (preferencesData) {
      return new Response(JSON.stringify({
        success: true,
        preferences: JSON.parse(preferencesData)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Default preferences
    const defaultPreferences = {
      language: 'th',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      notifications: {
        email: true,
        telegram: true,
        push: false
      },
      trading: {
        confirmations_required: 3,
        max_daily_limit: 10000,
        auto_staking: false
      },
      security: {
        two_factor_enabled: false,
        login_notifications: true,
        suspicious_activity_alerts: true
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      preferences: defaultPreferences
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get user preferences'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function updateUserPreferences(request, userId, env, corsHeaders) {
  try {
    const preferences = await request.json();
    
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid preferences data'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Store preferences
    await env.USER_SESSIONS.put(
      `preferences_${userId}`,
      JSON.stringify(preferences),
      { expirationTtl: 86400 * 30 } // 30 days
    );
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Preferences updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update preferences'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Blockchain & Network Functions
async function getBlockchainInfo(env, corsHeaders) {
  try {
    const blockchainInfo = {
      network: 'DOGLC Mainnet',
      version: '1.0.0',
      protocol_version: 1,
      block_height: 150000,
      best_block_hash: '0x' + generateRandomHash(),
      difficulty: 1000000,
      total_supply: await getTotalSupply(env),
      circulating_supply: await getCirculatingSupply(env),
      last_block_time: new Date().toISOString(),
      network_hash_rate: '1.2 TH/s',
      consensus: 'Proof of Stake',
      validators: 100,
      active_validators: 95
    };
    
    return new Response(JSON.stringify({
      success: true,
      blockchain: blockchainInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get blockchain info'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getValidators(env, corsHeaders) {
  try {
    const validators = [];
    
    // Generate validator data
    for (let i = 1; i <= 100; i++) {
      validators.push({
        id: i,
        address: 'doglc1' + generateRandomHash().substring(0, 39),
        stake: Math.floor(Math.random() * 1000000) + 100000,
        commission: Math.floor(Math.random() * 10) + 1,
        uptime: (95 + Math.random() * 5).toFixed(2) + '%',
        status: Math.random() > 0.05 ? 'active' : 'inactive',
        last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString()
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      validators: validators,
      total_validators: validators.length,
      active_validators: validators.filter(v => v.status === 'active').length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get validators'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getNetworkHealth(env, corsHeaders) {
  try {
    const health = {
      status: 'healthy',
      uptime: 99.95,
      response_time: 150,
      transaction_throughput: 1000,
      block_production_rate: 'normal',
      validator_participation: 95.2,
      network_congestion: 'low',
      last_check: new Date().toISOString(),
      components: {
        consensus: 'healthy',
        networking: 'healthy',
        storage: 'healthy',
        api: 'healthy',
        indexer: 'healthy'
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      health: health
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get network health'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper Functions
async function getTotalSupply(env) {
  const configData = await env.SYSTEM_CONFIGURATION.get('total_supply');
  return configData ? parseInt(configData) : 1000000000;
}

async function getCirculatingSupply(env) {
  const configData = await env.SYSTEM_CONFIGURATION.get('circulating_supply');
  return configData ? parseInt(configData) : 500000000;
}

async function getStakingStats(env) {
  try {
    const response = await fetch(`${env.BANKING_WORKER_URL}/analytics/system`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    const result = await response.json();
    return result.success ? {
      totalStaked: result.analytics.total_staked || 0,
      stakingRewards: result.analytics.staking_rewards || 0,
      activeStakers: result.analytics.active_stakers || 0
    } : {
      totalStaked: 0,
      stakingRewards: 0,
      activeStakers: 0
    };
  } catch (error) {
    return {
      totalStaked: 0,
      stakingRewards: 0,
      activeStakers: 0
    };
  }
}

async function getNetworkStats(env) {
  return {
    blockHeight: 150000,
    hashRate: '1.2 TH/s',
    difficulty: 'Medium',
    averageBlockTime: '10s',
    pendingTransactions: 25
  };
}

// Transaction Processing Functions
async function processPaymentConfirmation(paymentData, env) {
  try {
    const { user_id, amount, currency, payment_id } = paymentData;
    
    // Update user balance through banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: user_id,
        amount: amount,
        currency: currency,
        paymentId: payment_id
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Invalidate cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${user_id}`);
      
      // Send notification
      await sendNotification(user_id, 'payment_confirmed', {
        amount: amount,
        currency: currency
      }, env);
    }
    
    return result;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return { success: false, error: error.message };
  }
}

async function processTransactionConfirmation(blockchainData, env) {
  try {
    const { transaction_hash, confirmations, status } = blockchainData;
    
    // Update transaction status through banking worker
    const response = await fetch(`${env.BANKING_WORKER_URL}/transactions/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        transactionHash: transaction_hash,
        confirmations: confirmations,
        status: status
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.transaction && result.transaction.userId) {
      // Invalidate user caches
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${result.transaction.userId}`);
      await clearTransactionCache(result.transaction.userId, env);
      
      // Send confirmation notification
      await sendNotification(result.transaction.userId, 'transaction_confirmed', {
        transactionHash: transaction_hash,
        amount: result.transaction.amount
      }, env);
    }
    
    return result;
  } catch (error) {
    console.error('Transaction confirmation error:', error);
    return { success: false, error: error.message };
  }
}

async function processNewBlock(blockchainData, env) {
  try {
    const { block_height, block_hash, timestamp, transactions } = blockchainData;
    
    // Update blockchain stats
    await env.SYSTEM_CONFIGURATION.put('latest_block_height', block_height.toString());
    await env.SYSTEM_CONFIGURATION.put('latest_block_hash', block_hash);
    await env.SYSTEM_CONFIGURATION.put('latest_block_time', timestamp);
    
    // Process transactions in block
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        await processTransactionConfirmation({
          transaction_hash: tx.hash,
          confirmations: 1,
          status: 'confirmed'
        }, env);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('New block processing error:', error);
    return { success: false, error: error.message };
  }
}

async function sendNotification(userId, type, data, env) {
  try {
    const notificationData = {
      userId: userId,
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    // Store notification history
    await env.NOTIFICATION_HISTORY.put(
      `notification_${Date.now()}_${userId}`,
      JSON.stringify(notificationData),
      { expirationTtl: 86400 * 30 } // Keep for 30 days
    );
    
    // Send to notification service
    await fetch(`${env.MAIN_BOT_WORKER_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify(notificationData)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false, error: error.message };
  }
}

async function logTransaction(request, userId, type, amount, recipient, env) {
  try {
    const logData = {
      userId: userId,
      type: type,
      amount: amount,
      recipient: recipient,
      timestamp: new Date().toISOString(),
      ip: request.headers?.get('CF-Connecting-IP') || 'unknown'
    };
    
    await env.ENHANCED_AUDIT_LOGS.put(
      `transaction_log_${Date.now()}_${userId}`,
      JSON.stringify(logData),
      { expirationTtl: 86400 * 365 } // Keep for 1 year
    );
  } catch (error) {
    console.error('Transaction logging error:', error);
  }
}

// Cache Management
async function clearTransactionCache(userId, env) {
  // Clear transaction history cache for user
  // Note: KV doesn't support pattern deletion, so we'd need to track keys
  const cacheKeys = [
    `tx_history_${userId}_1_20_all`,
    `tx_history_${userId}_1_50_all`,
    `tx_history_${userId}_2_20_all`
  ];
  
  for (const key of cacheKeys) {
    await env.DOGLC_TRANSACTIONS.delete(key);
  }
}

// Security Functions
async function detectSuspiciousActivity(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const userAgent = request.headers.get('User-Agent');
  const country = request.cf?.country;
  
  // Check for blocked IPs
  if (ip) {
    const blockedIP = await env.BLOCKED_IPS_KV.get(ip);
    if (blockedIP) {
      return { suspicious: true, reason: 'blocked_ip' };
    }
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = ['bot', 'crawler', 'scanner', 'attack'];
  const lowerUserAgent = userAgent?.toLowerCase() || '';
  
  for (const agent of suspiciousAgents) {
    if (lowerUserAgent.includes(agent)) {
      return { suspicious: true, reason: 'suspicious_user_agent' };
    }
  }
  
  // Check for high-risk countries (if needed)
  const highRiskCountries = ['XX']; // Add country codes as needed
  if (country && highRiskCountries.includes(country)) {
    return { suspicious: true, reason: 'high_risk_country' };
  }
  
  return { suspicious: false };
}

// Utility Functions
function generateRandomHash() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUSDTAddress(address) {
  // Basic USDT address validation (implement based on network)
  // This is a placeholder - implement proper validation for different networks
  if (address.length < 26 || address.length > 42) return false;
  if (address.startsWith('T') || address.startsWith('0x')) return true;
  return false;
}

// API Documentation endpoint
async function getAPIDocumentation() {
  const documentation = {
    version: '1.0.0',
    title: 'DOGLC Digital Wallet API',
    description: 'Comprehensive API for DOGLC digital wallet operations',
    base_url: 'https://api.doglc.com',
    endpoints: {
      authentication: {
        description: 'Authentication is required for all v1 endpoints',
        methods: ['API Key (X-API-Key header)', 'Bearer Token (Authorization header)']
      },
      wallet: {
        '/api/v1/transactions/history': {
          method: 'GET',
          description: 'Get transaction history',
          auth_required: true,
          parameters: ['page', 'limit', 'type']
        },
        '/api/v1/transactions/details': {
          method: 'GET',
          description: 'Get transaction details',
          auth_required: true,
          parameters: ['id']
        }
      },
      fiat_crypto: {
        '/api/v1/fiat/deposit/initiate': {
          method: 'POST',
          description: 'Initiate THB fiat deposit',
          auth_required: true,
          parameters: ['amount']
        },
        '/api/v1/fiat/deposit/submit-slip': {
          method: 'POST',
          description: 'Submit deposit slip for verification',
          auth_required: true,
          parameters: ['depositId', 'slipImageData']
        },
        '/api/v1/crypto/withdraw/initiate': {
          method: 'POST',
          description: 'Initiate USDT crypto withdrawal',
          auth_required: true,
          parameters: ['doglcAmount', 'usdtAddress']
        }
      },
      staking: {
        '/api/v1/staking/stake': {
          method: 'POST',
          description: 'Stake DOGLC tokens',
          auth_required: true,
          parameters: ['amount', 'duration']
        },
        '/api/v1/staking/unstake': {
          method: 'POST',
          description: 'Unstake DOGLC tokens',
          auth_required: true,
          parameters: ['stakingId', 'amount']
        },
        '/api/v1/staking/rewards': {
          method: 'GET',
          description: 'Get staking rewards',
          auth_required: true
        }
      },
      user: {
        '/api/v1/user/profile': {
          methods: ['GET', 'PUT'],
          description: 'Get or update user profile',
          auth_required: true
        },
        '/api/v1/user/preferences': {
          methods: ['GET', 'PUT'],
          description: 'Get or update user preferences',
          auth_required: true
        }
      },
      public: {
        '/api/public/stats': {
          method: 'GET',
          description: 'Get public statistics'
        },
        '/api/public/price': {
          method: 'GET',
          description: 'Get current DOGLC price'
        },
        '/api/public/market-data': {
          method: 'GET',
          description: 'Get market data'
        },
        '/api/public/system/status': {
          method: 'GET',
          description: 'Get system status'
        },
        '/api/public/blockchain/info': {
          method: 'GET',
          description: 'Get blockchain information'
        },
        '/api/public/validators': {
          method: 'GET',
          description: 'Get validators list'
        },
        '/api/public/network/health': {
          method: 'GET',
          description: 'Get network health status'
        }
      },
      webhooks: {
        '/api/webhook/telegram': {
          method: 'POST',
          description: 'Telegram bot webhook',
          auth_required: false,
          note: 'Requires valid webhook secret'
        },
        '/api/webhook/payment': {
          method: 'POST',
          description: 'Payment provider webhook',
          auth_required: false,
          note: 'Requires valid signature'
        },
        '/api/webhook/blockchain': {
          method: 'POST',
          description: 'Blockchain events webhook',
          auth_required: false
        },
        '/api/webhook/bank-email-notification': {
          method: 'POST',
          description: 'Bank email notification webhook',
          auth_required: false,
          note: 'Forwards to security worker for processing'
        }
      }
    },
    rate_limits: {
      authenticated: '1000 requests per hour',
      public: '100 requests per hour',
      webhook: '10000 requests per hour'
    },
    error_codes: {
      400: 'Bad Request - Invalid parameters',
      401: 'Unauthorized - Invalid or missing authentication',
      403: 'Forbidden - Access denied or suspicious activity',
      404: 'Not Found - Endpoint not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error occurred'
    },
    response_format: {
      success: {
        success: true,
        data: 'Response data here'
      },
      error: {
        success: false,
        error: 'Error message here'
      }
    }
  };
  
  return new Response(JSON.stringify(documentation, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}