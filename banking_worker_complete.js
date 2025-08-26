/**
 * DOGLC Banking Worker - Complete Implementation with Advanced Validation
 * Handles all banking operations, validations, and financial logic
 * Includes: THB Deposit & USDT Withdrawal with Automated Account Switching
 *
 * Key API Endpoints:
 *   - /fiat/deposit/initiate   (Initiate a THB fiat deposit)
 *   - /fiat/deposit/confirm    (Confirm a THB fiat deposit)
 *   - /crypto/withdraw/initiate (Initiate a USDT crypto withdrawal)
 *   - ... (see routing switch for full list)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Security check for internal API (allow cron triggers to bypass)
    const internalApiKey = request.headers.get('X-Internal-API');
    const isCron = request.headers.get('CF-Cron') === 'true';
    
    if (!isCron && internalApiKey !== env.INTERNAL_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid internal API key'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // --- Basic per-endpoint rate limiting (assumes KV binding RATE_LIMITS) ---
      // Map endpoint prefix to limit (requests per window) & window seconds
      const ratePolicies = [
        { match: /^\/fiat\/deposit/, limit: 20, window: 60 },
        { match: /^\/crypto\/withdraw/, limit: 15, window: 60 },
        { match: /^\/wallet\//, limit: 60, window: 60 },
        { match: /^\/transactions\//, limit: 40, window: 60 },
        { match: /^\/admin\//, limit: 30, window: 300 },
      ];
      const policy = ratePolicies.find(p => p.match.test(path));
      if (policy && env.RATE_LIMITS) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rlKey = `rl:${ip}:${policy.match}`; // coarse key
        const limited = await applyRateLimit(env, rlKey, policy.limit, policy.window);
        if (limited.blocked) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Too Many Requests',
            retry_after: limited.retryAfter,
            limit: policy.limit,
            window_seconds: policy.window
          }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }
      }
      // Banking API routing
      switch (path) {
        // --- NEW ROUTES: Fiat, Crypto, and Cron ---
        case '/fiat/deposit/initiate':
          if (method === 'POST') return await initiateTHBDeposit(request, env);
          break;
        
        case '/fiat/deposit/confirm':
          if (method === 'POST') return await confirmTHBDeposit(request, env);
          break;
        
        case '/crypto/withdraw/initiate':
          if (method === 'POST') return await initiateUSDTWithdrawal(request, env, ctx);
          break;

        case '/cron/daily-reset':
          return await handleDailyReset(env);
          break;

        // Wallet Management
        case '/wallet/create':
          if (method === 'POST') return await createWallet(request, env);
          break;
          
        case '/wallet/balance':
          if (method === 'GET') return await getWalletBalance(request, env);
          break;
          
        case '/wallet/deposit':
          if (method === 'POST') return await processDeposit(request, env);
          break;
          
        case '/wallet/withdraw':
          if (method === 'POST') return await processWithdrawal(request, env, ctx);
          break;
          
        case '/wallet/freeze':
          if (method === 'POST') return await freezeWallet(request, env);
          break;
          
        case '/wallet/unfreeze':
          if (method === 'POST') return await unfreezeWallet(request, env);
          break;
          
        // Transaction Management
        case '/transactions/send':
          if (method === 'POST') return await processTransfer(request, env, ctx);
          break;
          
        case '/transactions/batch':
          if (method === 'POST') return await processBatchTransactions(request, env, ctx);
          break;
          
        case '/transactions/confirm':
          if (method === 'POST') return await confirmTransaction(request, env);
          break;

        case '/transactions/update-status':
          if (method === 'POST') return await updateTransactionStatus(request, env);
          break;  

        case '/transactions/cancel':
          if (method === 'POST') return await cancelTransaction(request, env);
          break;
          
        // Staking Management
        case '/staking/stake':
          if (method === 'POST') return await processStaking(request, env);
          break;
          
        case '/staking/unstake':
          if (method === 'POST') return await processUnstaking(request, env);
          break;
          
        case '/staking/rewards':
          if (method === 'GET') return await calculateStakingRewards(request, env);
          break;
          
        case '/staking/claim':
          if (method === 'POST') return await claimStakingRewards(request, env);
          break;
          
        // Commission Management
        case '/commission/calculate':
          if (method === 'POST') return await calculateCommission(request, env);
          break;
          
        case '/commission/distribute':
          if (method === 'POST') return await distributeCommission(request, env);
          break;
          
        // Banking Analytics
        case '/analytics/user':
          if (method === 'GET') return await getUserAnalytics(request, env);
          break;
          
        case '/analytics/system':
          if (method === 'GET') return await getSystemAnalytics(env);
          break;
          
        // Validation Endpoints
        case '/validate/transaction':
          if (method === 'POST') return await validateTransaction(request, env);
          break;
          
        case '/validate/address':
          if (method === 'POST') return await validateAddress(request, env);
          break;

        // --- Admin & Config Management ---
        case '/admin/config/get':
          if (method === 'GET') return await getFullConfig(env);
          break;
        case '/admin/rates/update':
          if (method === 'POST') return await updateRates(request, env);
          break;
        case '/admin/bank-accounts/add':
          if (method === 'POST') return await adminAddBankAccount(request, env);
          break;
        case '/admin/bank-accounts/update-status':
          if (method === 'POST') return await adminUpdateBankAccountStatus(request, env);
          break;
        case '/admin/bank-accounts/remove':
          if (method === 'POST') return await adminRemoveBankAccount(request, env);
          break;
        case '/admin/dashboard':
          if (method === 'GET') return await getAdminDashboard(env);
          break;
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            message: 'Banking API endpoint not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error('Banking Worker Error:', error);
      
      // Log error for investigation
      await logBankingError(error, request, env);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Banking operation failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async scheduled(env, ctx) {
    ctx.waitUntil(
      handleDailyReset(env).catch(error => {
        console.error('Scheduled daily reset failed:', error);
      })
    );
  }
};

// --- NEW FEATURE: THB DEPOSIT & USDT WITHDRAWAL ---

async function initiateTHBDeposit(request, env) {
  try {
    const { userId, amount } = await request.json();
    if (!userId || !amount || amount <= 0) {
      return errorResponse('User ID and a valid amount are required.', 400);
    }

  // Enforce THB only (explicit)
  // Future: may allow specifying currency but reject non-THB

    const selectedAccount = await selectReceivingAccount(parseFloat(amount), env);
    if (!selectedAccount.success) {
      return errorResponse(selectedAccount.error, 503);
    }

    const depositId = `dep_${generateUUID()}`;
    const pendingTx = {
      id: depositId,
      to_user: userId,
      amount: parseFloat(amount),
      currency: 'THB',
      status: 'pending_payment',
      type: 'fiat_deposit',
      created_at: new Date().toISOString(),
      note: `Pending deposit to ${selectedAccount.account.bankName} - ${selectedAccount.account.accountNumber}`
    };
    
    await env.DB.prepare(
      `INSERT INTO transactions (id, to_user, amount, status, type, note, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(pendingTx.id, pendingTx.to_user, pendingTx.amount, pendingTx.status, pendingTx.type, pendingTx.note, pendingTx.currency, pendingTx.created_at).run();

    return successResponse({
      depositId: depositId,
      amount: pendingTx.amount,
      paymentDetails: {
        bankName: selectedAccount.account.bankName,
        accountName: selectedAccount.account.accountName,
        accountNumber: selectedAccount.account.accountNumber,
        qrCodeData: `|${selectedAccount.account.accountNumber}|${pendingTx.amount}`
      }
    });

  } catch (error) {
    console.error("Initiate Deposit Error:", error);
    return errorResponse('Failed to initiate deposit.', 500);
  }
}

async function confirmTHBDeposit(request, env) {
  try {
    const { userId, depositId, amount } = await request.json();
    const exchangeRate = await getExchangeRate('THB', 'DOGLC', env);

    const tx = await env.DB.prepare(`SELECT * FROM transactions WHERE id = ? AND to_user = ? AND (status = 'pending_payment' OR status = 'pending_verification')`).bind(depositId, userId).first();
    if (!tx) {
      return errorResponse('Pending deposit not found or already processed.', 404);
    }
    
    // Apply commission (deposit) if configured
    const configStr = await (env.DOGLC_CONFIG ? env.DOGLC_CONFIG.get('SYSTEM_CONFIG') : null);
    let commissionPct = 0;
    if (configStr) {
      try { const cfg = JSON.parse(configStr); commissionPct = cfg?.commission?.deposit || 0; } catch {}
    }
    const grossDoglc = amount / exchangeRate;
    const feeDoglc = grossDoglc * commissionPct;
    const doglcAmount = grossDoglc - feeDoglc;

    await env.DB.prepare('BEGIN TRANSACTION').run();
    try {
      await env.DB.prepare(`UPDATE wallets SET balance = balance + ? WHERE user_id = ?`).bind(doglcAmount, userId).run();
      if (feeDoglc > 0.0001) {
        // Record fee transaction (internal)
        const feeId = `fee_${generateUUID()}`;
        await env.DB.prepare(`INSERT INTO transactions (id, from_user, amount, status, type, note, currency, created_at) VALUES (?, ?, ?, 'completed', 'fee', ?, 'DOGLC', ? )`)
          .bind(feeId, userId, feeDoglc, 'Deposit commission fee', new Date().toISOString()).run();
      }
      
      await env.DB.prepare(`UPDATE transactions SET status = 'completed', confirmed_at = ?, note = ? WHERE id = ?`)
        .bind(new Date().toISOString(), `Completed THB Deposit. Received ${doglcAmount.toFixed(4)} DOGLC.`, depositId).run();
            
      await env.DB.prepare('COMMIT').run();
      
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);

  return successResponse({ message: 'Deposit confirmed and wallet credited.', credited: doglcAmount, fee: feeDoglc });
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
  } catch (error) {
      console.error("Confirm Deposit Error:", error);
      return errorResponse('Failed to confirm deposit.', 500);
  }
}

async function initiateUSDTWithdrawal(request, env, ctx) {
  try {
    const { userId, doglcAmount, usdtAddress } = await request.json();
    const exchangeRate = await getExchangeRate('DOGLC', 'USDT', env);
    
    if (!userId || !doglcAmount || !usdtAddress || doglcAmount <= 0) {
      return errorResponse('User ID, DOGLC amount, and USDT address are required.', 400);
    }

  // Enforce USDT withdrawal only (currency fixed)

    const wallet = await getWalletData(userId, env);
    if (!wallet || wallet.available < doglcAmount) {
      return errorResponse('Insufficient DOGLC balance.', 400);
    }
    
  const withdrawalId = `wdr_${generateUUID()}`;
  const configStr = await (env.DOGLC_CONFIG ? env.DOGLC_CONFIG.get('SYSTEM_CONFIG') : null);
  let withdrawCommissionPct = 0;
  if (configStr) { try { const cfg = JSON.parse(configStr); withdrawCommissionPct = cfg?.commission?.withdraw || 0; } catch {} }
  const grossUsdt = doglcAmount * exchangeRate;
  const feeUsdt = grossUsdt * withdrawCommissionPct;
  const usdtAmount = grossUsdt - feeUsdt;

    await env.DB.prepare('BEGIN TRANSACTION').run();
    try {
      await env.DB.prepare(`UPDATE wallets SET balance = balance - ?, frozen_balance = frozen_balance + ? WHERE user_id = ?`)
        .bind(doglcAmount, doglcAmount, userId).run();

      await env.DB.prepare(`INSERT INTO transactions (id, from_user, amount, status, type, note, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(withdrawalId, userId, doglcAmount, 'pending_withdrawal', 'crypto_withdrawal', `Withdraw ${usdtAmount.toFixed(4)} USDT (fee ${feeUsdt.toFixed(4)}) to ${usdtAddress}`, 'USDT', new Date().toISOString()).run();
      if (feeUsdt > 0.0000001) {
        const feeId = `fee_${generateUUID()}`;
        await env.DB.prepare(`INSERT INTO transactions (id, from_user, amount, status, type, note, currency, created_at) VALUES (?, ?, ?, 'completed', 'fee', ?, 'USDT', ?)`)
          .bind(feeId, userId, feeUsdt, 'Withdrawal commission fee', new Date().toISOString()).run();
      }

      await env.DB.prepare('COMMIT').run();

      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);

      ctx.waitUntil(processCryptoPayout(withdrawalId, usdtAddress, usdtAmount, env));

  return successResponse({ withdrawalId, message: 'Withdrawal initiated. It may take a few minutes to process.', net_usdt: usdtAmount, fee_usdt: feeUsdt });

    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
  } catch (error) {
    console.error("Initiate Withdrawal Error:", error);
    return errorResponse('Failed to initiate withdrawal.', 500);
  }
}

async function selectReceivingAccount(amount, env) {
  try {
    const bankAccountsStr = await env.DOGLC_CONFIG.get('BANK_ACCOUNTS');
    if (!bankAccountsStr) throw new Error('Bank account configuration not found.');
    let bankAccounts = JSON.parse(bankAccountsStr);
    const candidates = bankAccounts.filter(acc => acc.status === 'active' && (acc.currentDailyTotal + amount) <= acc.dailyLimit);
    if (candidates.length === 0) {
      return { success: false, error: 'All receiving accounts are temporarily unavailable. Please try again later.' };
    }
    const maxPriority = Math.max(...candidates.map(a => a.priority || 1), 1);
    const scored = candidates.map(acc => {
      const remaining = Math.max(0, acc.dailyLimit - acc.currentDailyTotal);
      const capacityRatio = remaining / (acc.dailyLimit || 1);
      const utilization = acc.currentDailyTotal / (acc.dailyLimit || 1);
      const priorityNorm = (acc.priority || 1) / maxPriority;
      const totalOps = (acc.successCount || 0) + (acc.failureCount || 0);
      const reliability = totalOps === 0 ? 1 : (acc.successCount || 0) / totalOps;
      const score = (capacityRatio * 0.45) + ((1 - utilization) * 0.15) + (priorityNorm * 0.25) + (reliability * 0.15);
      return { acc, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].acc;
    const updatedAccounts = bankAccounts.map(a => a.accountId === selected.accountId ? { ...a, currentDailyTotal: a.currentDailyTotal + amount } : a);
    await env.DOGLC_CONFIG.put('BANK_ACCOUNTS', JSON.stringify(updatedAccounts));
    return { success: true, account: selected };
  } catch (error) {
    console.error('Account Selection Error:', error);
    return { success: false, error: 'An internal error occurred while selecting a payment account.' };
  }
}

async function handleDailyReset(env) {
  try {
    const bankAccountsStr = await env.DOGLC_CONFIG.get('BANK_ACCOUNTS');
    if (!bankAccountsStr) {
      return new Response("No accounts to reset.", { status: 200 });
    }

    let bankAccounts = JSON.parse(bankAccountsStr);
    const resetAccounts = bankAccounts.map(acc => ({ ...acc, currentDailyTotal: 0 }));

    await env.DOGLC_CONFIG.put('BANK_ACCOUNTS', JSON.stringify(resetAccounts));
    
    console.log(`Daily Reset Successful: Reset daily totals for ${resetAccounts.length} accounts.`);
    return new Response(`Reset daily totals for ${resetAccounts.length} accounts.`, { status: 200 });
  } catch (error) {
    console.error("Daily Reset Cron Job Error:", error);
    return new Response("Daily reset failed.", { status: 500 });
  }
}

async function processCryptoPayout(withdrawalId, usdtAddress, usdtAmount, env) {
  try {
    console.log(`Processing payout of ${usdtAmount} USDT to ${usdtAddress} for withdrawal ${withdrawalId}`);
    // Simulate network/chain delay
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const isSuccess = Math.random() > 0.1; // simulated success rate
    const tx = await env.DB.prepare(`SELECT * FROM transactions WHERE id = ?`).bind(withdrawalId).first();
    if (!tx) {
      console.warn(`Transaction ${withdrawalId} not found during payout processing.`);
      return;
    }

    // Use DB transaction to update statuses and wallets atomically
    await env.DB.prepare('BEGIN TRANSACTION').run();
    try {
      if (isSuccess) {
        // mark transaction completed and unfreeze frozen amount (amount was previously deducted/frozen)
        await env.DB.prepare(`
          UPDATE transactions 
          SET status = 'completed', note = ?, confirmed_at = ?
          WHERE id = ?
        `).bind(`Sent ${usdtAmount.toFixed(4)} USDT to ${usdtAddress}`, new Date().toISOString(), withdrawalId).run();

        // Reduce frozen balance (amount already deducted from balance earlier)
        await env.DB.prepare(`
          UPDATE wallets 
          SET frozen_balance = frozen_balance - ?, updated_at = ?
          WHERE user_id = ?
        `).bind(tx.amount, new Date().toISOString(), tx.from_user).run();

        console.log(`Withdrawal ${withdrawalId} completed.`);
      } else {
        // mark as failed and refund user (restore balance and remove frozen)
        await env.DB.prepare(`
          UPDATE transactions 
          SET status = 'failed', note = ?, confirmed_at = ?
          WHERE id = ?
        `).bind('Crypto payout failed. Funds have been returned.', new Date().toISOString(), withdrawalId).run();

        await env.DB.prepare(`
          UPDATE wallets 
          SET balance = balance + ?, frozen_balance = frozen_balance - ?, updated_at = ?
          WHERE user_id = ?
        `).bind(tx.amount, tx.amount, new Date().toISOString(), tx.from_user).run();

        console.log(`Withdrawal ${withdrawalId} failed. User has been refunded.`);
      }
      await env.DB.prepare('COMMIT').run();
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }

    // Clear wallet cache and send notification
    await env.DOGLC_WALLET_CACHE.delete(`wallet_${tx.from_user}`);
    await sendTransactionNotification(tx, isSuccess ? 'completed' : 'failed', env);

  } catch (error) {
    console.error('processCryptoPayout error:', error);
    await logBankingError(error, { withdrawalId, usdtAddress, usdtAmount }, env);
  }
}

/**
 * Get exchange rate between currencies.
 * Rates are loaded from configuration (KV), with documented fallback values.
 * Fallbacks: THB->DOGLC = 0.1, DOGLC->USDT = 0.03, otherwise 1.
 */
async function getExchangeRate(from, to, env) {
    // Try to load rates from KV config
    try {
        const ratesStr = await env.DOGLC_CONFIG.get('EXCHANGE_RATES');
        if (ratesStr) {
            const rates = JSON.parse(ratesStr);
            const key = `${from}_${to}`;
            if (rates[key] !== undefined) {
                return rates[key];
            }
        }
    } catch (error) {
        console.warn('Could not load exchange rates from config:', error);
    }
    // Fallback hardcoded rates (documented)
    if (from === 'THB' && to === 'DOGLC') return 0.1;      // Fallback: 1 THB = 0.1 DOGLC
    if (from === 'DOGLC' && to === 'USDT') return 0.03;    // Fallback: 1 DOGLC = 0.03 USDT
    return 1; // Default fallback
}

async function updateTransactionStatus(request, env) {
  try {
    const { transactionId, status, note } = await request.json();
    if (!transactionId || !status) {
      return errorResponse('Transaction ID and status are required', 400);
    }

    let queryNote = note ? `, note = ?` : '';
    const params = note ? [status, note, transactionId] : [status, transactionId];

    await env.DB.prepare(`UPDATE transactions SET status = ? ${queryNote} WHERE id = ?`)
      .bind(...params).run();
    
    return successResponse({ message: `Transaction ${transactionId} status updated to ${status}` });
  } catch (error) {
    console.error("Update Status Error:", error);
    return errorResponse('Failed to update transaction status', 500);
  }
}

// Wallet Management Functions
async function createWallet(request, env) {
  try {
    const data = await request.json();
    const { userId, currency = 'DOGLC' } = data;
    
    // Validation
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }
    
    // Check if wallet already exists
    const existingWallet = await env.DOGLC_WALLET_CACHE.get(`wallet_${userId}`);
    if (existingWallet) {
      return errorResponse('Wallet already exists', 409);
    }
    
    // Generate wallet address
    const walletAddress = await generateWalletAddress(userId, currency);
    
    // Create wallet in database
    const walletId = generateUUID();
    const walletData = {
      id: walletId,
      user_id: userId,
      currency: currency,
      balance: 0,
      frozen_balance: 0,
      wallet_address: walletAddress,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Store in database (using D1)
    const dbResult = await env.DB.prepare(`
      INSERT INTO wallets (id, user_id, currency, balance, frozen_balance, wallet_address, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      walletData.id,
      walletData.user_id,
      walletData.currency,
      walletData.balance,
      walletData.frozen_balance,
      walletData.wallet_address,
      walletData.is_active,
      walletData.created_at,
      walletData.updated_at
    ).run();
    
    if (dbResult.success) {
      // Cache wallet data
      await env.DOGLC_WALLET_CACHE.put(
        `wallet_${userId}`,
        JSON.stringify(walletData),
        { expirationTtl: 300 }
      );
      
      // Log wallet creation
      await logBankingOperation('wallet_created', userId, walletData, env);
      
      return successResponse({
        wallet: walletData,
        message: 'Wallet created successfully'
      });
    }
    
    console.error('Failed to create wallet in database');
    // Let the catch block handle the error response
    throw new Error('Failed to create wallet in database');
  } catch (error) {
    return errorResponse('Failed to create wallet: ' + error.message, 500);
  }
}

async function unfreezeWallet(request, env) {
  try {
    const data = await request.json();
    const { userId, reason } = data;
    
    if (!userId) {
      return errorResponse('User ID required', 400);
    }
    
    await env.DB.prepare(`
      UPDATE wallets 
      SET is_active = true, updated_at = ?
      WHERE user_id = ?
    `).bind(new Date().toISOString(), userId).run();
    
    // Log unfreeze action
    await logBankingOperation('wallet_unfrozen', userId, { reason }, env);
    
    // Clear cache
    await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
    
    return successResponse({
      message: 'Wallet unfrozen successfully'
    });
    
  } catch (error) {
    return errorResponse('Failed to unfreeze wallet: ' + error.message, 500);
  }
}

// Validation Functions
async function validateTransaction(request, env) {
  try {
    const data = await request.json();
    const { fromUserId, toUserId, amount, type } = data;
    
    const validationResults = {
      valid: true,
      checks: {
        amount_valid: amount > 0 && amount <= 1000000,
        sender_exists: !!(await getWalletData(fromUserId, env)),
        recipient_exists: !!(await getWalletData(toUserId, env)),
        sufficient_balance: false,
        daily_limit_ok: false,
        fraud_check_passed: false
      }
    };
    
    // Check balance
    const senderWallet = await getWalletData(fromUserId, env);
    if (senderWallet) {
      validationResults.checks.sufficient_balance = senderWallet.available >= amount;
    }
    
    // Check daily limit
    const dailyUsage = await getDailyTransactionUsage(fromUserId, env);
    const dailyLimit = await getUserDailyLimit(fromUserId, env);
    validationResults.checks.daily_limit_ok = (dailyUsage.total + amount) <= dailyLimit;
    
    // Fraud check
    const fraudCheck = await performFraudDetection(fromUserId, toUserId, amount, env);
    validationResults.checks.fraud_check_passed = !fraudCheck.suspicious;
    
    // Overall validation
    validationResults.valid = Object.values(validationResults.checks).every(check => check === true);
    
    return successResponse({
      validation: validationResults
    });
    
  } catch (error) {
    return errorResponse('Validation failed: ' + error.message, 500);
  }
}

async function validateAddress(request, env) {
  try {
    const data = await request.json();
    const { address } = data;
    
    if (!address || typeof address !== 'string') {
      return errorResponse('Address is required', 400);
    }
    
    const validation = {
      valid: false,
      format_valid: false,
      exists: false,
      active: false,
      details: {}
    };
    
    // Format validation
    if (address.startsWith('doglc1') && address.length === WALLET_ADDRESS_LENGTH) {
      validation.format_valid = true;
      
      // Check if address exists
      const walletData = await env.DB.prepare(`
        SELECT user_id, is_active, created_at FROM wallets 
        WHERE wallet_address = ?
      `).bind(address).first();
      
      if (walletData) {
        validation.exists = true;
        validation.active = walletData.is_active;
        validation.details = {
          created_at: walletData.created_at,
          user_id_hash: hashUserId(walletData.user_id) // Anonymized
        };
      }
    }
    
    validation.valid = validation.format_valid && validation.exists && validation.active;
    
    return successResponse({
      address_validation: validation
    });
    
  } catch (error) {
    return errorResponse('Address validation failed: ' + error.message, 500);
  }
}

// Utility Functions
const WALLET_ADDRESS_LENGTH = 45;

async function generateWalletAddress(userId, currency) {
  const prefix = currency === 'DOGLC' ? 'doglc1' : 'addr1';
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(userId + Date.now() + Math.random())
  );
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Ensure the address is always WALLET_ADDRESS_LENGTH characters
  return (prefix + hashHex).substring(0, WALLET_ADDRESS_LENGTH);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function calculateTransactionFee(amount, type) {
  const feeRates = {
    transfer: 0.001, // 0.1%
    exchange: 0.002, // 0.2%
    stake: 0,        // No fee for staking
    unstake: 0.0005  // 0.05%
  };
  
  const rate = feeRates[type] || 0.001;
  const fee = amount * rate;
  return Math.max(fee, 0.01); // Minimum fee 0.01 DOGLC
}

async function getStakingAPY(duration) {
  // APY based on staking duration
  if (duration >= 365) return 12; // 12% for 1 year+
  if (duration >= 180) return 10; // 10% for 6 months+
  if (duration >= 90) return 8;   // 8% for 3 months+
  if (duration >= 30) return 6;   // 6% for 1 month+
  return 4; // 4% for less than 1 month
}

async function resolveRecipient(recipient, env) {
  try {
    // Check if it's a wallet address
    if (recipient.startsWith('doglc1')) {
      const walletData = await env.DB.prepare(`
        SELECT user_id FROM wallets WHERE wallet_address = ? AND is_active = true
      `).bind(recipient).first();
      
      if (walletData) {
        return { valid: true, userId: walletData.user_id, type: 'address' };
      }
    }
    
    // Check if it's a username
    const userData = await env.DB.prepare(`
      SELECT user_id FROM users WHERE username = ? AND account_status = 'active'
    `).bind(recipient).first();
    
    if (userData) {
      return { valid: true, userId: userData.user_id, type: 'username' };
    }
    
    return { valid: false, error: 'Recipient not found' };
  } catch (error) {
    return { valid: false, error: 'Recipient resolution failed' };
  }
}

// Helper Functions
async function getWalletData(userId, env) {
  try {
    const dbResult = await env.DB.prepare(`
      SELECT * FROM wallets WHERE user_id = ? AND is_active = true
    `).bind(userId).first();
    
    if (dbResult) {
      return {
        id: dbResult.id,
        user_id: dbResult.user_id,
        balance: parseFloat(dbResult.balance),
        frozen_balance: parseFloat(dbResult.frozen_balance),
        available: parseFloat(dbResult.balance) - parseFloat(dbResult.frozen_balance),
        wallet_address: dbResult.wallet_address,
        currency: dbResult.currency
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting wallet data:', error);
    return null;
  }
}

async function getDailyTransactionUsage(userId, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await env.DB.prepare(`
      SELECT SUM(amount) as total_amount, COUNT(*) as total_count
      FROM transactions 
      WHERE from_user = ? AND DATE(created_at) = ? AND status != 'failed'
    `).bind(userId, today).first();
    
    return {
      total: result?.total_amount || 0,
      count: result?.total_count || 0
    };
  } catch (error) {
    return { total: 0, count: 0 };
  }
}

async function getUserDailyLimit(userId, env) {
  try {
    // Get user level/tier
    const userData = await env.DB.prepare(`
      SELECT tier FROM users WHERE user_id = ?
    `).bind(userId).first();
    
    const tierLimits = {
      bronze: 1000,
      silver: 5000,
      gold: 25000,
      platinum: 100000
    };
    
    return tierLimits[userData?.tier] || 1000;
  } catch (error) {
    return 1000; // Default limit
  }
}

async function getDailyWithdrawalAmount(userId, env) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE from_user = ? AND type = 'withdrawal' 
      AND DATE(created_at) = ? AND status != 'failed'
    `).bind(userId, today).first();
    
    return result?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getUserWithdrawalLimit(userId, env) {
  try {
    const userData = await env.DB.prepare(`
      SELECT tier FROM users WHERE user_id = ?
    `).bind(userId).first();
    
    const tierLimits = {
      bronze: 500,
      silver: 2000,
      gold: 10000,
      platinum: 50000
    };
    
    return tierLimits[userData?.tier] || 500;
  } catch (error) {
    return 500;
  }
}

async function calculateWithdrawalFee(amount) {
  // Progressive fee structure
  if (amount <= 100) return 1;     // 1 DOGLC for small withdrawals
  if (amount <= 1000) return 2;    // 2 DOGLC for medium withdrawals
  if (amount <= 10000) return 5;   // 5 DOGLC for large withdrawals
  return amount * 0.001;           // 0.1% for very large withdrawals
}

async function getRecentTransactions(userId, timeWindowMs, env) {
  try {
    const cutoffTime = new Date(Date.now() - timeWindowMs).toISOString();
    
    const result = await env.DB.prepare(`
      SELECT * FROM transactions 
      WHERE (from_user = ? OR to_user = ?) 
      AND created_at >= ?
      ORDER BY created_at DESC
    `).bind(userId, userId, cutoffTime).all();
    
    return result.results || [];
  } catch (error) {
    return [];
  }
}

async function checkAccountStatus(userId, env) {
  try {
    const userData = await env.DB.prepare(`
      SELECT account_status, kyc_status FROM users WHERE user_id = ?
    `).bind(userId).first();
    
    if (!userData) {
      return { canTransact: false, reason: 'Account not found' };
    }
    
    if (userData.account_status !== 'active') {
      return { canTransact: false, reason: 'Account suspended' };
    }
    
    if (userData.kyc_status === 'rejected') {
      return { canTransact: false, reason: 'KYC verification failed' };
    }
    
    return { canTransact: true };
  } catch (error) {
    return { canTransact: false, reason: 'Account status check failed' };
  }
}

async function flagSuspiciousTransaction(fromUserId, recipient, amount, reason, env) {
  try {
    const flagData = {
      from_user: fromUserId,
      recipient: recipient,
      amount: amount,
      reason: reason,
      timestamp: new Date().toISOString(),
      status: 'flagged'
    };
    
    await env.ENHANCED_AUDIT_LOGS.put(
      `suspicious_tx_${Date.now()}_${fromUserId}`,
      JSON.stringify(flagData),
      { expirationTtl: 86400 * 30 }
    );
    
    // Notify security team
    await sendSecurityAlert('suspicious_transaction', flagData, env);
    
  } catch (error) {
    console.error('Error flagging suspicious transaction:', error);
  }
}

async function sendSecurityAlert(type, data, env) {
  try {
    const alertData = {
      type: type,
      data: data,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    };
    
    // Store alert
    await env.SECURITY_TOKENS.put(
      `alert_${Date.now()}`,
      JSON.stringify(alertData),
      { expirationTtl: 86400 * 7 }
    );
    
    // In real implementation, send to security monitoring system
    console.log('Security alert:', alertData);
    
  } catch (error) {
    console.error('Security alert error:', error);
  }
}

async function sendTransactionNotification(transactionData, status, env) {
  try {
    const notificationData = {
      userId: transactionData.user_id || transactionData.from_user,
      type: 'transaction_update',
      data: {
        transactionId: transactionData.id,
        amount: transactionData.amount,
        status: status,
        type: transactionData.type
      },
      timestamp: new Date().toISOString()
    };
    
    await env.NOTIFICATION_HISTORY.put(
      `tx_notification_${Date.now()}_${notificationData.userId}`,
      JSON.stringify(notificationData),
      { expirationTtl: 86400 * 7 }
    );
    
  } catch (error) {
    console.error('Transaction notification error:', error);
  }
}

async function verifyConfirmationCode(transactionId, code, env) {
  try {
    // Implement your own verification logic here
    // This is a placeholder implementation
    const storedCode = await env.SECURITY_TOKENS.get(`confirm_${transactionId}`);
    return storedCode === code;
  } catch (error) {
    return false;
  }
}

// Analytics Helper Functions
async function getTotalUsers(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM wallets WHERE is_active = true
    `).first();
    return result?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalWallets(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM wallets WHERE is_active = true
    `).first();
    return result?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalTransactions(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'
    `).first();
    return result?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalVolume(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE status = 'completed'
    `).first();
    return result?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getActiveUsers24h(env) {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const result = await env.DB.prepare(`
      SELECT COUNT(DISTINCT COALESCE(from_user, to_user)) as count
      FROM transactions 
      WHERE created_at >= ?
    `).bind(cutoffTime).first();
    
    return result?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getAverageBalance(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT AVG(balance) as avg_balance
      FROM wallets 
      WHERE is_active = true AND balance > 0
    `).first();
    return result?.avg_balance || 0;
  } catch (error) {
    return 0;
  }
}

async function getLargestHolders(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT user_id, balance, currency
      FROM wallets 
      WHERE is_active = true 
      ORDER BY balance DESC 
      LIMIT 10
    `).all();
    
    return result.results?.map(holder => ({
      user_id: holder.user_id.substring(0, 8) + '***', // Anonymize
      balance: holder.balance,
      currency: holder.currency
    })) || [];
  } catch (error) {
    return [];
  }
}

async function getTransactionDistribution(env) {
  try {
    const result = await env.DB.prepare(`
      SELECT type, COUNT(*) as count, SUM(amount) as total_amount
      FROM transactions 
      WHERE status = 'completed'
      GROUP BY type
    `).all();
    
    const distribution = {};
    if (result.results) {
      for (const row of result.results) {
        distribution[row.type] = {
          count: row.count,
          total_amount: row.total_amount
        };
      }
    }
    
    return distribution;
  } catch (error) {
    return {};
  }
}

function hashUserId(userId) {
  // Simple hash for anonymization
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

function successResponse(data) {
    return new Response(JSON.stringify({ success: true, ...data }), { headers: { 'Content-Type': 'application/json' } });
}

function errorResponse(message, status = 400) {
    return new Response(JSON.stringify({ success: false, error: message }), { status: status, headers: { 'Content-Type': 'application/json' } });
}

// ------------------ Rate Limiting ------------------
async function applyRateLimit(env, key, limit, windowSecs) {
  try {
    const now = Date.now();
    const bucketStr = await env.RATE_LIMITS.get(key);
    let bucket;
    if (bucketStr) {
      bucket = JSON.parse(bucketStr);
      if (bucket.expiresAt <= now) {
        bucket = { count: 0, expiresAt: now + windowSecs * 1000 };
      }
    } else {
      bucket = { count: 0, expiresAt: now + windowSecs * 1000 };
    }
    bucket.count += 1;
    await env.RATE_LIMITS.put(key, JSON.stringify(bucket), { expiration: Math.floor(bucket.expiresAt / 1000) });
    if (bucket.count > limit) {
      return { blocked: true, retryAfter: Math.ceil((bucket.expiresAt - now)/1000) };
    }
    return { blocked: false, remaining: Math.max(0, limit - bucket.count) };
  } catch (e) {
    // Fail open if KV unavailable
    return { blocked: false };
  }
}

// --------------- Admin Config Management ------------
async function getFullConfig(env) {
  const base = await loadConfig(env);
  return successResponse({ config: base });
}

async function updateRates(request, env) {
  try {
    const body = await request.json();
    const { depositFeePercent, withdrawalFeePercent, commissionPercent, thbToDoglcRate, doglcToUsdtRate } = body;
    const cfg = await loadConfig(env);
    if (!cfg.RATES) cfg.RATES = {};
    if (depositFeePercent !== undefined) cfg.RATES.depositFeePercent = Number(depositFeePercent);
    if (withdrawalFeePercent !== undefined) cfg.RATES.withdrawalFeePercent = Number(withdrawalFeePercent);
    if (commissionPercent !== undefined) cfg.RATES.commissionPercent = Number(commissionPercent);
    if (!cfg.EXCHANGE) cfg.EXCHANGE = {};
    if (thbToDoglcRate !== undefined) cfg.EXCHANGE.thbToDoglc = Number(thbToDoglcRate);
    if (doglcToUsdtRate !== undefined) cfg.EXCHANGE.doglcToUsdt = Number(doglcToUsdtRate);
    await persistConfig(env, cfg);
    return successResponse({ message: 'Rates updated', rates: cfg.RATES, exchange: cfg.EXCHANGE });
  } catch (e) {
    return errorResponse('Failed to update rates: ' + e.message, 500);
  }
}

async function adminAddBankAccount(request, env) {
  try {
    const { bankName, accountName, accountNumber, dailyLimit = 100000, priority = 1, tags = [] } = await request.json();
    if (!bankName || !accountName || !accountNumber) return errorResponse('Missing bank account fields', 400);
    const cfg = await loadConfig(env);
    if (!cfg.BANK_ACCOUNTS) cfg.BANK_ACCOUNTS = [];
    const newAcc = {
      accountId: 'acc_' + crypto.randomUUID(),
      bankName,
      accountName,
      accountNumber,
      dailyLimit: Number(dailyLimit),
      currentDailyTotal: 0,
      status: 'active',
      priority: Number(priority) || 1,
      tags: Array.isArray(tags) ? tags : [],
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString()
    };
    cfg.BANK_ACCOUNTS.push(newAcc);
    await persistConfig(env, cfg);
    return successResponse({ message: 'Bank account added', account: newAcc });
  } catch (e) {
    return errorResponse('Failed to add bank account: ' + e.message, 500);
  }
}

async function adminUpdateBankAccountMeta(request, env) {
  try {
    const { accountId, priority, tags, status } = await request.json();
    if (!accountId) return errorResponse('accountId required', 400);
    const cfg = await loadConfig(env);
    const acc = (cfg.BANK_ACCOUNTS || []).find(a => a.accountId === accountId);
    if (!acc) return errorResponse('Account not found', 404);
    if (priority !== undefined) acc.priority = Number(priority);
    if (tags !== undefined) acc.tags = Array.isArray(tags) ? tags : [];
    if (status !== undefined) acc.status = status;
    await persistConfig(env, cfg);
    return successResponse({ message: 'Metadata updated', account: acc });
  } catch (e) {
    return errorResponse('Failed to update metadata: ' + e.message, 500);
  }
}

async function adminUpdateBankAccountStatus(request, env) {
  try {
    const { accountId, status } = await request.json();
    if (!accountId || !status) return errorResponse('accountId and status required', 400);
    const cfg = await loadConfig(env);
    const idx = cfg.BANK_ACCOUNTS.findIndex(a => a.accountId === accountId);
    if (idx === -1) return errorResponse('Account not found', 404);
    cfg.BANK_ACCOUNTS[idx].status = status;
    await persistConfig(env, cfg);
    return successResponse({ message: 'Status updated', account: cfg.BANK_ACCOUNTS[idx] });
  } catch (e) {
    return errorResponse('Failed to update status: ' + e.message, 500);
  }
}

async function adminRemoveBankAccount(request, env) {
  try {
    const { accountId } = await request.json();
    if (!accountId) return errorResponse('accountId required', 400);
    const cfg = await loadConfig(env);
    const before = cfg.BANK_ACCOUNTS.length;
    cfg.BANK_ACCOUNTS = cfg.BANK_ACCOUNTS.filter(a => a.accountId !== accountId);
    if (cfg.BANK_ACCOUNTS.length === before) return errorResponse('Account not found', 404);
    await persistConfig(env, cfg);
    return successResponse({ message: 'Bank account removed', remaining: cfg.BANK_ACCOUNTS.length });
  } catch (e) {
    return errorResponse('Failed to remove bank account: ' + e.message, 500);
  }
}

async function getAdminDashboard(env) {
  try {
    const cfg = await loadConfig(env);
    const accounts = cfg.BANK_ACCOUNTS || [];
    const utilization = accounts.map(a => ({
      accountId: a.accountId,
      bankName: a.bankName,
      status: a.status,
      used: a.currentDailyTotal,
      limit: a.dailyLimit,
      utilization: +(a.currentDailyTotal / (a.dailyLimit || 1) * 100).toFixed(2)
    }));
    const alerts = [];
    utilization.forEach(u => {
      if (u.utilization >= 90) alerts.push({ type: 'bank_account_capacity', accountId: u.accountId, message: `Account ${u.accountId} at ${u.utilization}% of daily limit` });
      if (u.status !== 'active') alerts.push({ type: 'bank_account_status', accountId: u.accountId, message: `Account ${u.accountId} status = ${u.status}` });
    });
    // Pending transactions
    const pendingDeposits = await env.DB.prepare(`SELECT COUNT(*) as c FROM transactions WHERE type='fiat_deposit' AND status IN ('pending_payment','pending_verification')`).first();
    const pendingWithdrawals = await env.DB.prepare(`SELECT COUNT(*) as c FROM transactions WHERE type='crypto_withdrawal' AND status='pending_withdrawal'`).first();
    const dashboard = {
      exchange: cfg.EXCHANGE || {},
      rates: cfg.RATES || {},
      accounts: utilization,
      pending: {
        deposits: pendingDeposits?.c || 0,
        withdrawals: pendingWithdrawals?.c || 0
      },
      alerts,
      generated_at: new Date().toISOString()
    };
    return successResponse({ dashboard });
  } catch (e) {
    return errorResponse('Failed to build dashboard: ' + e.message, 500);
  }
}

async function loadConfig(env) {
  let cfgStr = await env.DOGLC_CONFIG.get('SYSTEM_CONFIG');
  if (!cfgStr) {
    // initialize default config
    const defaults = {
      RATES: { depositFeePercent: 0, withdrawalFeePercent: 0.5, commissionPercent: 1.0 },
      EXCHANGE: { thbToDoglc: 10, doglcToUsdt: 0.03 },
      BANK_ACCOUNTS: []
    };
    await env.DOGLC_CONFIG.put('SYSTEM_CONFIG', JSON.stringify(defaults));
    return defaults;
  }
  const cfg = JSON.parse(cfgStr);
  if (!cfg.RATES) cfg.RATES = { depositFeePercent: 0, withdrawalFeePercent: 0.5, commissionPercent: 1.0 };
  if (!cfg.EXCHANGE) cfg.EXCHANGE = { thbToDoglc: 10, doglcToUsdt: 0.03 };
  if (!cfg.BANK_ACCOUNTS) cfg.BANK_ACCOUNTS = [];
  return cfg;
}

async function persistConfig(env, cfg) {
  await env.DOGLC_CONFIG.put('SYSTEM_CONFIG', JSON.stringify(cfg));
}

async function logBankingOperation(operation, userId, data, env) {
  try {
    const logData = {
      operation: operation,
      user_id: userId,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    await env.DOGLC_BANK_USAGE.put(
      `operation_${Date.now()}_${userId}`,
      JSON.stringify(logData),
      { expirationTtl: 86400 * 30 } // Keep for 30 days
    );
  } catch (error) {
    console.error('Banking operation logging error:', error);
  }
}

async function logBankingError(error, context, env) {
  try {
    const errorData = {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    };
    
    await env.ENHANCED_AUDIT_LOGS.put(
      `banking_error_${Date.now()}`,
      JSON.stringify(errorData),
      { expirationTtl: 86400 * 7 } // Keep for 7 days
    );
  } catch (logError) {
    console.error('Error logging banking error:', logError);
  }
}

async function getWalletBalance(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return errorResponse('User ID is required', 400);
    }
    
    // Check cache first
    const cachedWallet = await env.DOGLC_WALLET_CACHE.get(`wallet_${userId}`);
    if (cachedWallet) {
      return successResponse({
        wallet: JSON.parse(cachedWallet)
      });
    }
    
    // Fetch from database
    const dbResult = await env.DB.prepare(`
      SELECT * FROM wallets WHERE user_id = ? AND is_active = true
    `).bind(userId).first();
    
    if (dbResult) {
      const walletData = {
        id: dbResult.id,
        user_id: dbResult.user_id,
        currency: dbResult.currency,
        balance: parseFloat(dbResult.balance),
        frozen_balance: parseFloat(dbResult.frozen_balance),
        available: parseFloat(dbResult.balance) - parseFloat(dbResult.frozen_balance),
        wallet_address: dbResult.wallet_address,
        is_active: dbResult.is_active,
        created_at: dbResult.created_at,
        updated_at: dbResult.updated_at
      };
      
      // Cache for 5 minutes
      await env.DOGLC_WALLET_CACHE.put(
        `wallet_${userId}`,
        JSON.stringify(walletData),
        { expirationTtl: 300 }
      );
      
      return successResponse({ wallet: walletData });
    }
    
    return errorResponse('Wallet not found', 404);
  } catch (error) {
    return errorResponse('Failed to get wallet balance: ' + error.message, 500);
  }
}

// Transaction Processing Functions
async function processTransfer(request, env, ctx) {
  try {
    const data = await request.json();
    const { fromUserId, recipient, amount, note, type = 'transfer' } = data;
    
    // Input validation
    const validation = await validateTransferData(data);
    if (!validation.valid) {
      return errorResponse(validation.error, 400);
    }
    
    // Advanced validation
    const advancedValidation = await performAdvancedValidation(fromUserId, recipient, amount, env);
    if (!advancedValidation.valid) {
      return errorResponse(advancedValidation.error, 400);
    }
    
    // Check sender balance
    const senderWallet = await getWalletData(fromUserId, env);
    if (!senderWallet || senderWallet.available < amount) {
      return errorResponse('Insufficient balance', 400);
    }
    
    // Get or resolve recipient
    const recipientData = await resolveRecipient(recipient, env);
    if (!recipientData.valid) {
      return errorResponse('Invalid recipient', 400);
    }
    
    // Create transaction record
    const transactionId = generateUUID();
    const transactionData = {
      id: transactionId,
      from_user: fromUserId,
      to_user: recipientData.userId,
      amount: amount,
      fee: await calculateTransactionFee(amount, type),
      status: 'pending',
      type: type,
      note: note || '',
      created_at: new Date().toISOString(),
      confirmed_at: null
    };
    
    // Begin transaction
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Insert transaction record
      await env.DB.prepare(`
        INSERT INTO transactions (id, from_user, to_user, amount, fee, status, type, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transactionData.id,
        transactionData.from_user,
        transactionData.to_user,
        transactionData.amount,
        transactionData.fee,
        transactionData.status,
        transactionData.type,
        transactionData.note,
        transactionData.created_at
      ).run();
      
      // Update sender balance
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance - ?, frozen_balance = frozen_balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        transactionData.amount + transactionData.fee,
        transactionData.amount,
        new Date().toISOString(),
        fromUserId
      ).run();
      
      // Commit transaction
      await env.DB.prepare('COMMIT').run();
      
      // Process transaction asynchronously
      ctx.waitUntil(processTransactionAsync(transactionData, recipientData.userId, env));
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${fromUserId}`);
      
      return successResponse({
        transaction: transactionData,
        message: 'Transaction submitted successfully'
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Transaction failed: ' + error.message, 500);
  }
}

async function processTransactionAsync(transactionData, recipientUserId, env) {
  try {
    // Simulate blockchain confirmation (replace with real blockchain integration)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    
    // Update transaction status
    await env.DB.prepare(`
      UPDATE transactions 
      SET status = 'confirmed', confirmed_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), transactionData.id).run();
    
    // Update balances
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Complete sender transaction (unfreeze remaining amount)
      await env.DB.prepare(`
        UPDATE wallets 
        SET frozen_balance = frozen_balance - ?
        WHERE user_id = ?
      `).bind(transactionData.amount, transactionData.from_user).run();
      
      // Credit recipient
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        transactionData.amount,
        new Date().toISOString(),
        recipientUserId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear caches
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${transactionData.from_user}`);
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${recipientUserId}`);
      
      // Send notifications
      await sendTransactionNotification(transactionData, 'confirmed', env);
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      
      // Mark transaction as failed
      await env.DB.prepare(`
        UPDATE transactions 
        SET status = 'failed'
        WHERE id = ?
      `).bind(transactionData.id).run();
      
      // Unfreeze sender funds
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, frozen_balance = frozen_balance - ?
        WHERE user_id = ?
      `).bind(
        transactionData.amount + transactionData.fee,
        transactionData.amount,
        transactionData.from_user
      ).run();
      
      throw dbError;
    }
    
  } catch (error) {
    console.error('Async transaction processing error:', error);
    await logBankingError(error, { transactionId: transactionData.id }, env);
  }
}

// Advanced Validation Functions
async function validateTransferData(data) {
  const { fromUserId, recipient, amount, note } = data;
  
  // Required fields
  if (!fromUserId || !recipient || !amount) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  // Amount validation
  if (typeof amount !== 'number' || amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (amount < 0.01) {
    return { valid: false, error: 'Minimum transfer amount is 0.01 DOGLC' };
  }
  
  if (amount > 1000000) {
    return { valid: false, error: 'Maximum transfer amount is 1,000,000 DOGLC' };
  }
  
  // Note validation
  if (note && note.length > 500) {
    return { valid: false, error: 'Note too long (max 500 characters)' };
  }
  
  // Recipient validation
  if (typeof recipient !== 'string' || recipient.length < 3) {
    return { valid: false, error: 'Invalid recipient format' };
  }
  
  return { valid: true };
}

async function performAdvancedValidation(fromUserId, recipient, amount, env) {
  try {
    // Self-transfer check
    if (fromUserId === recipient) {
      return { valid: false, error: 'Cannot transfer to yourself' };
    }
    
    // Daily limit check
    const dailyUsage = await getDailyTransactionUsage(fromUserId, env);
    const dailyLimit = await getUserDailyLimit(fromUserId, env);
    
    if (dailyUsage.total + amount > dailyLimit) {
      return { 
        valid: false, 
        error: `Daily limit exceeded. Limit: ${dailyLimit}, Used: ${dailyUsage.total}` 
      };
    }
    
    // Fraud detection
    const fraudCheck = await performFraudDetection(fromUserId, recipient, amount, env);
    if (fraudCheck.suspicious) {
      await flagSuspiciousTransaction(fromUserId, recipient, amount, fraudCheck.reason, env);
      return { valid: false, error: 'Transaction flagged for review' };
    }
    
    // Account status check
    const accountStatus = await checkAccountStatus(fromUserId, env);
    if (!accountStatus.canTransact) {
      return { valid: false, error: accountStatus.reason };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Validation failed: ' + error.message };
  }
}

async function performFraudDetection(fromUserId, recipient, amount, env) {
  try {
    // Check transaction velocity
    const recentTx = await getRecentTransactions(fromUserId, 3600000, env); // Last hour
    const hourlyAmount = recentTx.reduce((sum, tx) => sum + tx.amount, 0);
    
    if (hourlyAmount + amount > 10000) { // $10k equivalent
      return { suspicious: true, reason: 'high_velocity' };
    }
    
    // Check for suspicious patterns
    if (recentTx.length > 20) { // More than 20 transactions in an hour
      return { suspicious: true, reason: 'high_frequency' };
    }
    
    // Amount pattern check
    if (amount > 50000) { // Large amount
      return { suspicious: true, reason: 'large_amount' };
    }
    
    // Recipient risk check
    const recipientRisk = await checkRecipientRisk(recipient, env);
    if (recipientRisk.high_risk) {
      return { suspicious: true, reason: 'high_risk_recipient' };
    }
    
    return { suspicious: false };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return { suspicious: false };
  }
}

async function checkRecipientRisk(recipient, env) {
  try {
    // Check blacklist
    const blacklistData = await env.BLOCKED_IPS_KV.get(`address_${recipient}`);
    if (blacklistData) {
      return { high_risk: true, reason: 'blacklisted' };
    }
    
    // Check reputation score
    const reputationData = await env.SECURITY_TOKENS.get(`reputation_${recipient}`);
    if (reputationData) {
      const reputation = JSON.parse(reputationData);
      if (reputation.score < 50) { // Below 50% reputation
        return { high_risk: true, reason: 'low_reputation' };
      }
    }
    
    return { high_risk: false };
  } catch (error) {
    return { high_risk: false };
  }
}

// Staking Functions
async function processStaking(request, env) {
  try {
    const data = await request.json();
    const { userId, amount, duration = 30 } = data; // Default 30 days
    
    // Validation
    if (!userId || !amount || amount <= 0) {
      return errorResponse('Invalid staking data', 400);
    }
    
    if (amount < 100) {
      return errorResponse('Minimum staking amount is 100 DOGLC', 400);
    }
    
    // Check balance
    const wallet = await getWalletData(userId, env);
    if (!wallet || wallet.available < amount) {
      return errorResponse('Insufficient balance for staking', 400);
    }
    
    // Calculate staking rewards
    const apy = await getStakingAPY(duration);
    const estimatedRewards = (amount * apy * duration) / (365 * 100);
    
    // Create staking record
    const stakingId = generateUUID();
    const stakingData = {
      id: stakingId,
      user_id: userId,
      amount: amount,
      duration: duration,
      apy: apy,
      estimated_rewards: estimatedRewards,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      rewards_claimed: 0
    };
    
    // Begin database transaction
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Insert staking record
      await env.DB.prepare(`
        INSERT INTO staking (id, user_id, amount, duration, apy, estimated_rewards, start_date, end_date, status, rewards_claimed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        stakingData.id,
        stakingData.user_id,
        stakingData.amount,
        stakingData.duration,
        stakingData.apy,
        stakingData.estimated_rewards,
        stakingData.start_date,
        stakingData.end_date,
        stakingData.status,
        stakingData.rewards_claimed
      ).run();
      
      // Update wallet (freeze staked amount)
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance - ?, frozen_balance = frozen_balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        amount,
        amount,
        new Date().toISOString(),
        userId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      // Log staking operation
      await logBankingOperation('staking_created', userId, stakingData, env);
      
      return successResponse({
        staking: stakingData,
        message: 'Staking successful'
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Staking failed: ' + error.message, 500);
  }
}

async function processUnstaking(request, env) {
  try {
    const data = await request.json();
    const { userId, stakingId } = data;
    
    if (!userId || !stakingId) {
      return errorResponse('User ID and staking ID are required', 400);
    }
    
    // Get staking position
    const stakingData = await env.DB.prepare(`
      SELECT * FROM staking WHERE id = ? AND user_id = ? AND status = 'active'
    `).bind(stakingId, userId).first();
    
    if (!stakingData) {
      return errorResponse('Active staking position not found', 404);
    }
    
    // Calculate current rewards
    const daysStaked = Math.floor((Date.now() - new Date(stakingData.start_date).getTime()) / (24 * 60 * 60 * 1000));
    const currentRewards = (stakingData.amount * stakingData.apy * daysStaked) / (365 * 100);
    const unclaimedRewards = Math.max(0, currentRewards - stakingData.rewards_claimed);
    
    // Check if early unstaking (before end date)
    const isEarlyUnstaking = new Date() < new Date(stakingData.end_date);
    const penalty = isEarlyUnstaking ? stakingData.amount * 0.05 : 0; // 5% early unstaking penalty
    
    const returnAmount = stakingData.amount - penalty;
    const totalReturn = returnAmount + unclaimedRewards;
    
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Update staking status
      await env.DB.prepare(`
        UPDATE staking 
        SET status = 'completed', rewards_claimed = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        currentRewards,
        new Date().toISOString(),
        stakingId
      ).run();
      
      // Update wallet balance
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, frozen_balance = frozen_balance - ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        totalReturn,
        stakingData.amount,
        new Date().toISOString(),
        userId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      return successResponse({
        message: 'Unstaking completed successfully',
        principal_returned: returnAmount,
        rewards_claimed: unclaimedRewards,
        penalty: penalty,
        total_returned: totalReturn,
        early_unstaking: isEarlyUnstaking
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Unstaking failed: ' + error.message, 500);
  }
}

async function calculateStakingRewards(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return errorResponse('User ID required', 400);
    }
    
    // Get user's staking positions
    const stakingPositions = await env.DB.prepare(`
      SELECT * FROM staking WHERE user_id = ? AND status = 'active'
    `).bind(userId).all();
    
    if (!stakingPositions.results || stakingPositions.results.length === 0) {
      return successResponse({
        total_rewards: 0,
        positions: []
      });
    }
    
    let totalRewards = 0;
    const positions = [];
    
    for (const position of stakingPositions.results) {
      const daysStaked = Math.floor((Date.now() - new Date(position.start_date).getTime()) / (24 * 60 * 60 * 1000));
      const currentRewards = (position.amount * position.apy * daysStaked) / (365 * 100);
      const claimableRewards = Math.max(0, currentRewards - position.rewards_claimed);
      
      totalRewards += claimableRewards;
      
      positions.push({
        id: position.id,
        amount: position.amount,
        apy: position.apy,
        duration: position.duration,
        days_staked: daysStaked,
        estimated_rewards: position.estimated_rewards,
        current_rewards: currentRewards,
        claimable_rewards: claimableRewards,
        rewards_claimed: position.rewards_claimed,
        start_date: position.start_date,
        end_date: position.end_date
      });
    }
    
    return successResponse({
      total_rewards: totalRewards,
      positions: positions
    });
    
  } catch (error) {
    return errorResponse('Failed to calculate rewards: ' + error.message, 500);
  }
}

async function claimStakingRewards(request, env) {
  try {
    const data = await request.json();
    const { userId, stakingId } = data;
    
    if (!userId || !stakingId) {
      return errorResponse('User ID and staking ID are required', 400);
    }
    
    // Get staking position
    const stakingData = await env.DB.prepare(`
      SELECT * FROM staking WHERE id = ? AND user_id = ? AND status = 'active'
    `).bind(stakingId, userId).first();
    
    if (!stakingData) {
      return errorResponse('Active staking position not found', 404);
    }
    
    // Calculate claimable rewards
    const daysStaked = Math.floor((Date.now() - new Date(stakingData.start_date).getTime()) / (24 * 60 * 60 * 1000));
    const currentRewards = (stakingData.amount * stakingData.apy * daysStaked) / (365 * 100);
    const claimableRewards = Math.max(0, currentRewards - stakingData.rewards_claimed);
    
    if (claimableRewards <= 0) {
      return errorResponse('No rewards available to claim', 400);
    }
    
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Update staking record
      await env.DB.prepare(`
        UPDATE staking 
        SET rewards_claimed = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        currentRewards,
        new Date().toISOString(),
        stakingId
      ).run();
      
      // Credit rewards to wallet
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        claimableRewards,
        new Date().toISOString(),
        userId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      return successResponse({
        message: 'Rewards claimed successfully',
        rewards_claimed: claimableRewards
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Failed to claim rewards: ' + error.message, 500);
  }
}

// Commission Management
async function calculateCommission(request, env) {
  try {
    const data = await request.json();
    const { transactionAmount, transactionType, userLevel = 'bronze' } = data;
    
    // Commission rates by user level
    const commissionRates = {
      bronze: { send: 0.001, receive: 0, exchange: 0.002, stake: 0 },
      silver: { send: 0.0008, receive: 0, exchange: 0.0015, stake: 0 },
      gold: { send: 0.0005, receive: 0, exchange: 0.001, stake: 0 },
      platinum: { send: 0.0003, receive: 0, exchange: 0.0008, stake: 0 }
    };
    
    const rate = commissionRates[userLevel]?.[transactionType] || 0.001;
    const commission = transactionAmount * rate;
    
    return successResponse({
      commission: commission,
      rate: rate,
      user_level: userLevel,
      transaction_type: transactionType
    });
    
  } catch (error) {
    return errorResponse('Commission calculation failed: ' + error.message, 500);
  }
}

async function distributeCommission(request, env) {
  try {
    const data = await request.json();
    const { transactionId, commission, referrerId } = data;
    
    if (!commission || commission <= 0) {
      return successResponse({ message: 'No commission to distribute' });
    }
    
    // Commission distribution logic
    const distributions = [];
    
    // Platform fee (70%)
    const platformFee = commission * 0.7;
    distributions.push({
      type: 'platform',
      amount: platformFee,
      description: 'Platform operational fee'
    });
    
    // Referrer commission (20% if exists)
    if (referrerId) {
      const referrerCommission = commission * 0.2;
      distributions.push({
        type: 'referrer',
        userId: referrerId,
        amount: referrerCommission,
        description: 'Referral commission'
      });
      
      // Credit referrer account
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        referrerCommission,
        new Date().toISOString(),
        referrerId
      ).run();
      
      // Clear referrer cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${referrerId}`);
    }
    
    // Development fund (10%)
    const devFund = commission * 0.1;
    distributions.push({
      type: 'development',
      amount: devFund,
      description: 'Development fund'
    });
    
    // Record commission distribution
    await env.COMMISSION_TRACKING.put(
      `commission_${transactionId}`,
      JSON.stringify({
        transaction_id: transactionId,
        total_commission: commission,
        distributions: distributions,
        timestamp: new Date().toISOString()
      }),
      { expirationTtl: 86400 * 365 } // Keep for 1 year
    );
    
    return successResponse({
      commission_distributed: commission,
      distributions: distributions
    });
    
  } catch (error) {
    return errorResponse('Commission distribution failed: ' + error.message, 500);
  }
}

// Analytics Functions
async function getUserAnalytics(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || '30'; // days
    
    if (!userId) {
      return errorResponse('User ID required', 400);
    }
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    // Get transaction analytics
    const transactions = await env.DB.prepare(`
      SELECT type, amount, fee, created_at, status
      FROM transactions 
      WHERE (from_user = ? OR to_user = ?) 
      AND created_at >= ? AND created_at <= ?
    `).bind(
      userId, userId,
      startDate.toISOString(),
      endDate.toISOString()
    ).all();
    
    // Calculate analytics
    const analytics = {
      period_days: parseInt(period),
      total_transactions: transactions.results?.length || 0,
      total_sent: 0,
      total_received: 0,
      total_fees: 0,
      transaction_types: {},
      daily_activity: {},
      average_transaction_size: 0
    };
    
    if (transactions.results) {
      for (const tx of transactions.results) {
        // Transaction type counting
        analytics.transaction_types[tx.type] = (analytics.transaction_types[tx.type] || 0) + 1;
        
        // Amount calculations
        if (tx.from_user === userId) {
          analytics.total_sent += tx.amount;
          analytics.total_fees += tx.fee || 0;
        } else {
          analytics.total_received += tx.amount;
        }
        
        // Daily activity
        const day = tx.created_at.split('T')[0];
        analytics.daily_activity[day] = (analytics.daily_activity[day] || 0) + 1;
      }
      
      analytics.average_transaction_size = 
        (analytics.total_sent + analytics.total_received) / analytics.total_transactions;
    }
    
    return successResponse({ analytics: analytics });
    
  } catch (error) {
    return errorResponse('Analytics calculation failed: ' + error.message, 500);
  }
}

async function getSystemAnalytics(env) {
  try {
    const cacheKey = 'system_analytics';
    const cachedAnalytics = await env.DOGLC_BANK_ANALYTICS.get(cacheKey);
    
    if (cachedAnalytics) {
      return successResponse({
        analytics: JSON.parse(cachedAnalytics)
      });
    }
    
    // Calculate system-wide analytics
    const analytics = {
      total_users: await getTotalUsers(env),
      total_wallets: await getTotalWallets(env),
      total_transactions: await getTotalTransactions(env),
      total_volume: await getTotalVolume(env),
      active_users_24h: await getActiveUsers24h(env),
      average_balance: await getAverageBalance(env),
      largest_holders: await getLargestHolders(env),
      transaction_distribution: await getTransactionDistribution(env),
      last_updated: new Date().toISOString()
    };
    
    // Cache for 10 minutes
    await env.DOGLC_BANK_ANALYTICS.put(
      cacheKey,
      JSON.stringify(analytics),
      { expirationTtl: 600 }
    );
    
    return successResponse({ analytics: analytics });
    
  } catch (error) {
    return errorResponse('System analytics failed: ' + error.message, 500);
  }
}

// Additional Banking Functions
async function processDeposit(request, env) {
  try {
    const data = await request.json();
    const { userId, amount, currency = 'DOGLC', source, reference } = data;
    
    // Validation
    if (!userId || !amount) {
      return errorResponse('Invalid deposit data', 400);
    }
    
    if (amount > 1000000) {
      return errorResponse('Deposit amount too large', 400);
    }
    
    // Check wallet exists
    const wallet = await getWalletData(userId, env);
    if (!wallet) {
      return errorResponse('Wallet not found', 404);
    }
    
    // Create deposit transaction
    const depositId = generateUUID();
    const depositData = {
      id: depositId,
      user_id: userId,
      amount: amount,
      currency: currency,
      source: source || 'external',
      reference: reference,
      status: 'pending',
      type: 'deposit',
      created_at: new Date().toISOString()
    };
    
    // Process deposit
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Insert deposit record
      await env.DB.prepare(`
        INSERT INTO transactions (id, to_user, amount, status, type, created_at, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        depositData.id,
        depositData.user_id,
        depositData.amount,
        depositData.status,
        depositData.type,
        depositData.created_at,
        `Deposit from ${depositData.source}`
      ).run();
      
      // Update wallet balance
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        amount,
        new Date().toISOString(),
        userId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      // Log deposit
      await logBankingOperation('deposit_processed', userId, depositData, env);
      
      return successResponse({
        deposit: depositData,
        message: 'Deposit processed successfully'
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Deposit failed: ' + error.message, 500);
  }
}

async function processWithdrawal(request, env, ctx) {
  try {
    const data = await request.json();
    const { userId, amount, destination, note } = data;
    
    // Validation
    if (!userId || !amount || !destination || amount <= 0) {
      return errorResponse('Invalid withdrawal data', 400);
    }
    
    // Check wallet balance
    const wallet = await getWalletData(userId, env);
    if (!wallet || wallet.available < amount) {
      return errorResponse('Insufficient balance', 400);
    }
    
    // Check daily withdrawal limit
    const dailyWithdrawals = await getDailyWithdrawalAmount(userId, env);
    const withdrawalLimit = await getUserWithdrawalLimit(userId, env);
    
    if (dailyWithdrawals + amount > withdrawalLimit) {
      return errorResponse('Daily withdrawal limit exceeded', 400);
    }
    
    // Calculate withdrawal fee
    const withdrawalFee = await calculateWithdrawalFee(amount);
    const totalDeduction = amount + withdrawalFee;
    
    if (wallet.available < totalDeduction) {
      return errorResponse('Insufficient balance including fees', 400);
    }
    
    // Create withdrawal transaction
    const withdrawalId = generateUUID();
    const withdrawalData = {
      id: withdrawalId,
      user_id: userId,
      amount: amount,
      fee: withdrawalFee,
      destination: destination,
      status: 'pending',
      type: 'withdrawal',
      note: note || '',
      created_at: new Date().toISOString()
    };
    
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Insert withdrawal record
      await env.DB.prepare(`
        INSERT INTO transactions (id, from_user, amount, fee, status, type, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        withdrawalData.id,
        withdrawalData.user_id,
        withdrawalData.amount,
        withdrawalData.fee,
        withdrawalData.status,
        withdrawalData.type,
        withdrawalData.note,
        withdrawalData.created_at
      ).run();
      
      // Freeze withdrawal amount
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance - ?, frozen_balance = frozen_balance + ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        totalDeduction,
        totalDeduction,
        new Date().toISOString(),
        userId
      ).run();
      
      await env.DB.prepare('COMMIT').run();
      
      // Clear cache
      await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
      
      // Process withdrawal asynchronously
      ctx.waitUntil(processWithdrawalAsync(withdrawalData, env));
      
      return successResponse({
        withdrawal: withdrawalData,
        message: 'Withdrawal submitted for processing'
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Withdrawal failed: ' + error.message, 500);
  }
}

async function processWithdrawalAsync(withdrawalData, env) {
  try {
    // Simulate external payment processing
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
    
    // In real implementation, integrate with external payment systems
    const success = Math.random() > 0.1; // 90% success rate for simulation
    
    if (success) {
      // Mark as completed
      await env.DB.prepare(`
        UPDATE transactions 
        SET status = 'completed', confirmed_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), withdrawalData.id).run();
      
      // Unfreeze (amount already deducted)
      await env.DB.prepare(`
        UPDATE wallets 
        SET frozen_balance = frozen_balance - ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        withdrawalData.amount + withdrawalData.fee,
        new Date().toISOString(),
        withdrawalData.user_id
      ).run();
      
    } else {
      // Mark as failed and refund
      await env.DB.prepare(`
        UPDATE transactions 
        SET status = 'failed'
        WHERE id = ?
      `).bind(withdrawalData.id).run();
      
      // Refund to user
      await env.DB.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, frozen_balance = frozen_balance - ?, updated_at = ?
        WHERE user_id = ?
      `).bind(
        withdrawalData.amount + withdrawalData.fee,
        withdrawalData.amount + withdrawalData.fee,
        new Date().toISOString(),
        withdrawalData.user_id
      ).run();
    }
    
    // Clear cache
    await env.DOGLC_WALLET_CACHE.delete(`wallet_${withdrawalData.user_id}`);
    
    // Send notification
    await sendTransactionNotification(withdrawalData, success ? 'completed' : 'failed', env);
    
  } catch (error) {
    console.error('Async withdrawal processing error:', error);
  }
}

async function confirmTransaction(request, env) {
  try {
    const data = await request.json();
    const { transactionId, confirmationCode } = data;
    
    if (!transactionId || !confirmationCode) {
      return errorResponse('Transaction ID and confirmation code required', 400);
    }
    
    // Get pending transaction
    const transaction = await env.DB.prepare(`
      SELECT * FROM transactions WHERE id = ? AND status = 'pending'
    `).bind(transactionId).first();
    
    if (!transaction) {
      return errorResponse('Pending transaction not found', 404);
    }
    
    // Verify confirmation code (implement your own logic)
    const isValidCode = await verifyConfirmationCode(transactionId, confirmationCode, env);
    if (!isValidCode) {
      return errorResponse('Invalid confirmation code', 400);
    }
    
    // Confirm transaction
    await env.DB.prepare(`
      UPDATE transactions 
      SET status = 'confirmed', confirmed_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), transactionId).run();
    
    return successResponse({
      message: 'Transaction confirmed successfully'
    });
    
  } catch (error) {
    return errorResponse('Transaction confirmation failed: ' + error.message, 500);
  }
}

async function cancelTransaction(request, env) {
  try {
    const data = await request.json();
    const { transactionId, reason } = data;
    
    if (!transactionId) {
      return errorResponse('Transaction ID required', 400);
    }
    
    // Get pending transaction
    const transaction = await env.DB.prepare(`
      SELECT * FROM transactions WHERE id = ? AND status IN ('pending', 'pending_payment')
    `).bind(transactionId).first();
    
    if (!transaction) {
      return errorResponse('Cancellable transaction not found', 404);
    }
    
    await env.DB.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Cancel transaction
      await env.DB.prepare(`
        UPDATE transactions 
        SET status = 'cancelled', note = ?
        WHERE id = ?
      `).bind(`Cancelled: ${reason || 'User requested'}`, transactionId).run();
      
      // Refund if necessary
      if (transaction.from_user) {
        const refundAmount = parseFloat(transaction.amount) + (parseFloat(transaction.fee) || 0);
        
        await env.DB.prepare(`
          UPDATE wallets 
          SET balance = balance + ?, frozen_balance = frozen_balance - ?, updated_at = ?
          WHERE user_id = ?
        `).bind(
          refundAmount,
          refundAmount,
          new Date().toISOString(),
          transaction.from_user
        ).run();
        
        // Clear cache
        await env.DOGLC_WALLET_CACHE.delete(`wallet_${transaction.from_user}`);
      }
      
      await env.DB.prepare('COMMIT').run();
      
      return successResponse({
        message: 'Transaction cancelled successfully'
      });
      
    } catch (dbError) {
      await env.DB.prepare('ROLLBACK').run();
      throw dbError;
    }
    
  } catch (error) {
    return errorResponse('Transaction cancellation failed: ' + error.message, 500);
  }
}

async function processBatchTransactions(request, env, ctx) {
  try {
    const data = await request.json();
    const { transactions, batchId } = data;
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return errorResponse('Invalid batch transactions data', 400);
    }
    
    if (transactions.length > 100) {
      return errorResponse('Batch size too large (max 100)', 400);
    }
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process each transaction
    for (const tx of transactions) {
      try {
        const txRequest = new Request(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify(tx)
        });
        
        const result = await processTransfer(txRequest, env, ctx);
        const resultData = await result.json();
        
        results.push({
          transaction: tx,
          result: resultData,
          success: resultData.success
        });
        
        if (resultData.success) {
          successCount++;
        } else {
          failureCount++;
        }
        
      } catch (txError) {
        results.push({
          transaction: tx,
          result: { success: false, error: txError.message },
          success: false
        });
        failureCount++;
      }
    }
    
    // Log batch operation
    await logBankingOperation('batch_transactions', 'system', {
      batch_id: batchId,
      total_transactions: transactions.length,
      success_count: successCount,
      failure_count: failureCount
    }, env);
    
    return successResponse({
      batch_id: batchId,
      total_transactions: transactions.length,
      success_count: successCount,
      failure_count: failureCount,
      results: results
    });
    
  } catch (error) {
    return errorResponse('Batch processing failed: ' + error.message, 500);
  }
}

async function freezeWallet(request, env) {
  try {
    const data = await request.json();
    const { userId, reason } = data;
    
    if (!userId) {
      return errorResponse('User ID required', 400);
    }
    
    await env.DB.prepare(`
      UPDATE wallets 
      SET is_active = false, updated_at = ?
      WHERE user_id = ?
    `).bind(new Date().toISOString(), userId).run();
    
    // Log freeze action
    await logBankingOperation('wallet_frozen', userId, { reason }, env);
    
    // Clear cache
    await env.DOGLC_WALLET_CACHE.delete(`wallet_${userId}`);
    
    return successResponse({
      message: 'Wallet frozen successfully'
    });
    
  } catch (error) {
    return errorResponse('Failed to freeze wallet: ' + error.message, 500);
  }
}