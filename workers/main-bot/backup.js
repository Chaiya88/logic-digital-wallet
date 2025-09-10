/**
 * DOGLC Main Bot Worker - Complete Implementation
 * Advanced Telegram bot with multi-language support and comprehensive features
 */

export default {
  async fetch(request, env, ctx) {
    console.error('=== MAIN BOT WORKER FETCH STARTED ===');
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    console.error(`Request: ${method} ${path}`);
    console.error('URL:', request.url);

    try {
      // Bot API routing - support both formats
      if (path === '/webhook/telegram' || path.includes('/webhook')) {
        if (method === 'POST') return await handleTelegramWebhook(request, env);
      }
      
      switch (path) {
        case '/bot/send-message':
          if (method === 'POST') return await sendMessage(request, env);
          break;
          
        case '/bot/broadcast':
          if (method === 'POST') return await broadcastMessage(request, env);
          break;
          
        case '/notifications/send':
          if (method === 'POST') return await sendNotification(request, env);
          break;
          
        case '/bot/set-commands':
          if (method === 'POST') return await setBotCommands(request, env);
          break;
          
        case '/bot/status':
          if (method === 'GET') return await getBotStatus(env);
          break;
          
        case '/bot/setup-webhook':
          if (method === 'POST') return await setupWebhook(request, env);
          break;
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            message: 'Bot API endpoint not found'
          }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      console.error('Main Bot Worker Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'Bot operation failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Telegram Webhook Handler
async function handleTelegramWebhook(request, env) {
  console.error('=== WEBHOOK HANDLER STARTED ===');
  try {
    const update = await request.json();
    console.error('=== RECEIVED UPDATE ===');
    console.error('Update data:', JSON.stringify(update, null, 2));
    
    if (update.message) {
      console.log('=== PROCESSING MESSAGE ===');
      console.log('Message text:', update.message.text);
      await handleMessage(update.message, env);
      console.log('=== MESSAGE PROCESSED ===');
    } else if (update.callback_query) {
      console.log('=== PROCESSING CALLBACK QUERY ===');
      await handleCallbackQuery(update.callback_query, env);
    } else if (update.inline_query) {
      console.log('=== PROCESSING INLINE QUERY ===');
      await handleInlineQuery(update.inline_query, env);
    }
    
    console.error('=== WEBHOOK HANDLER COMPLETED ===');
    return new Response(`OK - Processed: ${JSON.stringify({message: !!update.message, callback: !!update.callback_query, inline: !!update.inline_query})}`);
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===', error);
    return new Response('Error', { status: 500 });
  }
}

// Message Handling
async function handleMessage(message, env) {
  console.log('=== HANDLE MESSAGE STARTED ===');
  try {
    const chatId = message.chat.id;
    const userId = message.from.id.toString();
    const text = message.text || '';
    const username = message.from.username;
    
    console.log(`=== PROCESSING MESSAGE ===`);
    console.log(`Chat ID: ${chatId}`);
    console.log(`User ID: ${userId}`);
    console.log(`Text: ${text}`);
    console.log(`Username: ${username}`);
    
    // Get user language preference
    const userLang = await getUserLanguage(userId, env);
    console.log(`User language: ${userLang}`);
    
    // Log user activity
    await logUserActivity(userId, 'message', { text: text.substring(0, 100) }, env);
    
    // Handle commands
    if (text.startsWith('/')) {
      console.log(`Handling command: ${text}`);
      await handleCommand(message, userLang, env);
    } else {
      console.log('Handling text message');
      await handleTextMessage(message, userLang, env);
    }
    
    console.log('Message handling completed');
  } catch (error) {
    console.error('Message handling error:', error);
  }
}

/**
 * Handles Telegram bot commands.
 *
 * @param {Object} message - The Telegram message object.
 * @param {string} userLang - The user's language code.
 * @param {Object} env - Environment variables and bindings.
 *
 * @param {Array<string>} args - Arguments for the command, parsed from message text.
 *   Format: message.text.split(' ').slice(1)
 *   Example: For "/send @username 100 note", args = ["@username", "100", "note"]
 *
 * Supported commands:
 *   /start, /help, /balance, /send, /receive, /history, /price, /stake, /unstake,
 *   /deposit_thb, /withdraw_usdt, /settings, /language, /support, /admin
 */
async function handleCommand(message, userLang, env) {
  const command = message.text.split(' ')[0].toLowerCase();
  const args = message.text.split(' ').slice(1);
  const chatId = message.chat.id;
  const userId = message.from.id.toString();
  
  try {
    switch (command) {
      case '/start':
        await handleStartCommand(chatId, userId, userLang, env);
        break;
        
      case '/help':
        await handleHelpCommand(chatId, userLang, env);
        break;
        
      case '/balance':
        await handleBalanceCommand(chatId, userId, userLang, env);
        break;
        
      case '/send':
        await handleSendCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/receive':
        await handleReceiveCommand(chatId, userId, userLang, env);
        break;
        
      case '/history':
        await handleHistoryCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/price':
        await handlePriceCommand(chatId, userLang, env);
        break;
        
      case '/stake':
        await handleStakeCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/unstake':
        await handleUnstakeCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/deposit_thb':
        await handleDepositThbCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/withdraw_usdt':
        await handleWithdrawUsdtCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/settings':
        await handleSettingsCommand(chatId, userId, userLang, env);
        break;
        
      case '/language':
        await handleLanguageCommand(chatId, userId, args, userLang, env);
        break;
        
      case '/support':
        await handleSupportCommand(chatId, userId, userLang, env);
        break;
      
      case '/admin':
        await handleAdminCommand(chatId, userId, args, userLang, env);
        break;
        
      default:
        await sendTelegramMessage(chatId, getText('unknown_command', userLang), env);
    }
  } catch (error) {
    console.error(`Command ${command} error:`, error);
    await sendTelegramMessage(chatId, getText('command_error', userLang), env);
  }
}

// Command Handlers
async function handleStartCommand(chatId, telegramUserId, userLang, env) {
  try {
    console.error('=== HANDLE START COMMAND STARTED ===');
    console.error(`ChatId: ${chatId}, UserId: ${telegramUserId}`);
    
    // Check if user exists and create if needed
    let user = await getUserData(telegramUserId, env);
    console.error('User data:', user);
    
    if (!user) {
      console.error('Creating new user...');
      user = await createNewUser(telegramUserId, chatId, env);
      console.error('New user created:', user);
    }
    
    // Create main menu keyboard
    const keyboard = {
      inline_keyboard: [
        [
          { text: "💰 ตรวจสอบยอดเงิน", callback_data: 'balance' },
          { text: "💸 ส่งเงิน", callback_data: 'send' }
        ],
        [
          { text: "📥 รับเงิน", callback_data: 'receive' },
          { text: "📊 ประวัติ", callback_data: 'history' }
        ],
        [
          { text: "🏦 ฝากเงิน THB", callback_data: 'deposit_thb' },
          { text: "💎 ถอน USDT", callback_data: 'withdraw_usdt' }
        ],
        [
          { text: "⚙️ ตั้งค่า", callback_data: 'settings' }
        ]
      ]
    };
    
    // Send welcome message with menu buttons
    const welcomeMessage = `🚀 ยินดีต้อนรับสู่ DOGLC Wallet Bot!
    
🎉 สวัสดี ${user.username || 'ผู้ใช้ใหม่'}!

คุณสามารถใช้งานฟีเจอร์ต่างๆ ผ่านปุ่มด้านล่าง`;
    
    await sendTelegramMessage(chatId, welcomeMessage, env, { reply_markup: keyboard });
    
    console.error('=== START COMMAND COMPLETED ===');
    
  } catch (error) {
    console.error('Start command error:', error);
    await sendTelegramMessage(chatId, "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", env);
  }
}

async function handleBalanceCommand(chatId, telegramUserId, userLang, env) {
  try {
    const user = await getUserData(telegramUserId, env);
    if (!user) {
      await sendTelegramMessage(chatId, getText('no_wallet', userLang), env);
      return;
    }
    
    // Get wallet, create if doesn't exist
    let wallet = await getUserWallet(user.user_id, env);
    if (!wallet) {
      console.log(`Creating wallet for balance check: ${user.user_id}`);
      wallet = await createUserWallet(user.user_id, env);
    }
    
    if (!wallet) {
      await sendTelegramMessage(chatId, getText('no_wallet', userLang), env);
      return;
    }
    
    const balanceInfo = getText('balance_info', userLang, {
      total: formatNumber(wallet.balance),
      available: formatNumber(wallet.available || wallet.balance),
      frozen: formatNumber(wallet.frozen_balance || 0),
      currency: wallet.currency,
      address: wallet.wallet_address
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('send_money', userLang), callback_data: 'send' },
          { text: getText('receive_money', userLang), callback_data: 'receive' }
        ],
        [
          { text: getText('deposit_thb', userLang), callback_data: 'deposit_thb' },
          { text: getText('withdraw_usdt', userLang), callback_data: 'withdraw_usdt' }
        ],
        [
          { text: getText('refresh_balance', userLang), callback_data: 'refresh_balance' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, balanceInfo, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Balance command error:', error);
    await sendTelegramMessage(chatId, getText('balance_error', userLang), env);
  }
}

async function handleSendCommand(chatId, telegramUserId, args, userLang, env) {
  try {
    if (args.length < 2) {
      const usage = getText('send_usage', userLang);
      await sendTelegramMessage(chatId, usage, env);
      return;
    }
    
    const recipient = args[0];
    const amount = parseFloat(args[1]);
    const note = args.slice(2).join(' ');
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(chatId, getText('invalid_amount', userLang), env);
      return;
    }
    
    // Check balance
    const user = await getUserData(telegramUserId, env);
    if (!user) {
      await sendTelegramMessage(chatId, getText('insufficient_balance', userLang), env);
      return;
    }
    const wallet = await getUserWallet(user.user_id, env);
    if (!wallet || wallet.available < amount) {
      await sendTelegramMessage(chatId, getText('insufficient_balance', userLang), env);
      return;
    }
    
    // Confirm transaction
    const confirmText = getText('confirm_send', userLang, {
      amount: formatNumber(amount),
      recipient: recipient,
      currency: wallet.currency
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('confirm', userLang), callback_data: `confirm_send_${recipient}_${amount}_${encodeURIComponent(note)}` },
          { text: getText('cancel', userLang), callback_data: 'cancel' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, confirmText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Send command error:', error);
    await sendTelegramMessage(chatId, getText('send_error', userLang), env);
  }
}

async function handleReceiveCommand(chatId, telegramUserId, userLang, env) {
  try {
    const user = await getUserData(telegramUserId, env);
    if (!user) {
      await sendTelegramMessage(chatId, getText('no_wallet', userLang), env);
      return;
    }
    const wallet = await getUserWallet(user.user_id, env);
    
    if (!wallet) {
      await sendTelegramMessage(chatId, getText('no_wallet', userLang), env);
      return;
    }
    
    const receiveText = getText('receive_info', userLang, {
      address: wallet.wallet_address,
      currency: wallet.currency
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('copy_address', userLang), callback_data: 'copy_address' },
          { text: getText('show_qr', userLang), callback_data: 'show_qr' }
        ],
        [
          { text: getText('check_balance', userLang), callback_data: 'balance' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, receiveText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Receive command error:', error);
    await sendTelegramMessage(chatId, getText('receive_error', userLang), env);
  }
}

// New Deposit THB Command Handler
async function handleDepositThbCommand(chatId, userId, args, userLang, env) {
  try {
    const amount = parseFloat(args[0]);
    
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(chatId, "❌ กรุณาระบุจำนวนเงิน\nตัวอย่าง: /deposit_thb 1000", env);
      return;
    }
    
    if (amount < 100) {
      await sendTelegramMessage(chatId, "❌ จำนวนเงินขั้นต่ำ 100 บาท", env);
      return;
    }

    if (amount > 50000) {
      await sendTelegramMessage(chatId, "❌ จำนวนเงินสูงสุด 50,000 บาท/วัน", env);
      return;
    }
    
    const user = await getUserData(userId, env);
    if (!user) {
      await sendTelegramMessage(chatId, "❌ ไม่พบข้อมูลผู้ใช้ กรุณาใช้ /start", env);
      return;
    }
    
    // Call banking worker to initiate deposit
    const response = await env.BANKING.fetch('https://banking.internal/fiat/deposit/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: user.user_id,
        amount: amount,
        currency: 'THB'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const text = `🏦 ฝากเงิน ${formatNumber(amount)} บาท\n\n` +
        `📋 *รายละเอียดการโอน:*\n` +
        `🏪 ธนาคาร: ${result.account.bankName}\n` +
        `🔢 เลขบัญชี: ${result.account.accountNumber}\n` +
        `👤 ชื่อบัญชี: ${result.account.accountName}\n\n` +
        `💰 *จำนวนที่ต้องโอน:* ฿${formatNumber(amount)}\n` +
        `🆔 *รหัสการฝาก:* ${result.depositId}\n\n` +
        `⏰ *ระยะเวลา:* 30 นาที\n` +
        `🔄 *สถานะ:* รอการโอนเงิน\n\n` +
        `💡 *คำแนะนำ:*\n` +
        `• โอนเงินตามจำนวนที่ระบุ\n` +
        `• ระบบจะยืนยันอัตโนมัติภายใน 5 นาที\n` +
        `• กดตรวจสอบสถานะเพื่อดูความคืบหน้า`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔍 ตรวจสอบสถานะ", callback_data: `deposit_status_${result.depositId}` },
            { text: "📋 คัดลอกเลขบัญชี", callback_data: `copy_account_${result.depositId}` }
          ],
          [
            { text: "🏦 ฝากเงินใหม่", callback_data: "deposit_thb" },
            { text: "🏠 เมนูหลัก", callback_data: "main_menu" }
          ]
        ]
      };
      
      await sendTelegramMessage(chatId, text, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } else {
      await sendTelegramMessage(chatId, `❌ เกิดข้อผิดพลาด: ${result.error}`, env);
    }
    
  } catch (error) {
    console.error('Deposit THB command error:', error);
    await sendTelegramMessage(chatId, "❌ เกิดข้อผิดพลาดในการสร้างรายการฝากเงิน", env);
  }
}

async function handleWithdrawUsdtCommand(chatId, userId, args, userLang, env) {
  try {
    const amount = parseFloat(args[0]);
    const usdtAddress = args[1];
    
    if (isNaN(amount) || amount <= 0 || !usdtAddress) {
      await sendTelegramMessage(chatId, "❌ กรุณาระบุจำนวนเงินและที่อยู่ USDT\nตัวอย่าง: /withdraw_usdt 50 TRxxx...abc123", env);
      return;
    }
    
    if (amount < 10) {
      await sendTelegramMessage(chatId, "❌ จำนวนเงินขั้นต่ำ 10 USDT", env);
      return;
    }

    if (!usdtAddress.startsWith('T')) {
      await sendTelegramMessage(chatId, "❌ ที่อยู่ USDT ไม่ถูกต้อง (ต้องเป็น TRC20)", env);
      return;
    }
    
    const user = await getUserData(userId, env);
    if (!user) {
      await sendTelegramMessage(chatId, "❌ ไม่พบข้อมูลผู้ใช้ กรุณาใช้ /start", env);
      return;
    }

    // Check balance
    const wallet = await getUserWallet(user.user_id, env);
    if (!wallet || wallet.available < amount) {
      await sendTelegramMessage(chatId, "❌ ยอดเงินไม่เพียงพอ", env);
      return;
    }
    
    const withdrawalFee = 2.0; // 2 USDT fee
    const finalAmount = amount - withdrawalFee;
    
    if (finalAmount <= 0) {
      await sendTelegramMessage(chatId, "❌ จำนวนเงินไม่เพียงพอสำหรับค่าธรรมเนียม (2 USDT)", env);
      return;
    }
    
    // Call banking worker to initiate withdrawal
    const response = await env.BANKING.fetch('https://banking.internal/crypto/withdraw/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: user.user_id,
        amount: amount,
        address: usdtAddress,
        currency: 'USDT',
        network: 'TRC20'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const text = `💎 ถอน USDT สำเร็จ\n\n` +
        `💰 *จำนวนถอน:* ${formatNumber(amount)} USDT\n` +
        `💸 *จำนวนที่ได้รับ:* ${formatNumber(finalAmount)} USDT\n` +
        `🔸 *ค่าธรรมเนียม:* ${formatNumber(withdrawalFee)} USDT\n` +
        `📍 *ที่อยู่:* \`${usdtAddress}\`\n` +
        `🆔 *รหัสการถอน:* ${result.withdrawId}\n\n` +
        `⏰ *เวลาประมวลผล:* 5-30 นาที\n` +
        `🔄 *สถานะ:* กำลังประมวลผล\n\n` +
        `📝 *หมายเหตุ:*\n` +
        `• จะได้รับ USDT ในกระเป๋าภายใน 30 นาที\n` +
        `• ตรวจสอบสถานะได้ตลอดเวลา\n` +
        `• ติดต่อสนับสนุนหากมีปัญหา`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔍 ตรวจสอบสถานะ", callback_data: `withdraw_status_${result.withdrawId}` },
            { text: "📊 ดูยอดเงิน", callback_data: "balance" }
          ],
          [
            { text: "💎 ถอนเงินใหม่", callback_data: "withdraw_usdt" },
            { text: "🏠 เมนูหลัก", callback_data: "main_menu" }
          ]
        ]
      };
      
      await sendTelegramMessage(chatId, text, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } else {
      await sendTelegramMessage(chatId, `❌ เกิดข้อผิดพลาด: ${result.error}`, env);
    }
    
  } catch (error) {
    console.error('Withdraw USDT command error:', error);
    await sendTelegramMessage(chatId, "❌ เกิดข้อผิดพลาดในการสร้างรายการถอนเงิน", env);
  }
}

async function handleHistoryCommand(chatId, userId, args, userLang, env) {
  try {
    const limit = parseInt(args[0]) || 10;
    const type = args[1] || 'all';
    
    // Get transaction history
    const transactions = await getUserTransactionHistory(userId, limit, type, env);
    
    if (!transactions || transactions.length === 0) {
      await sendTelegramMessage(chatId, getText('no_transactions', userLang), env);
      return;
    }
    
    let historyText = getText('transaction_history_header', userLang) + '\n\n';
    
    for (const tx of transactions) {
      const txText = formatTransactionForDisplay(tx, userId, userLang);
      historyText += txText + '\n';
    }
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('export_history', userLang), callback_data: 'export_history' },
          { text: getText('refresh_history', userLang), callback_data: 'refresh_history' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, historyText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('History command error:', error);
    await sendTelegramMessage(chatId, getText('history_error', userLang), env);
  }
}

async function handlePriceCommand(chatId, userLang, env) {
  try {
    // Get current price data
    const priceData = await getCurrentDoglcPrice(env);
    
    const priceText = getText('price_info', userLang, {
      price_usd: formatPrice(priceData.doglc_usd),
      price_btc: formatPrice(priceData.doglc_btc, 8),
      change_24h: formatPercentage(priceData.change_24h),
      volume_24h: formatNumber(priceData.volume_24h),
      market_cap: formatNumber(priceData.market_cap)
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('refresh_price', userLang), callback_data: 'refresh_price' },
          { text: getText('price_alerts', userLang), callback_data: 'price_alerts' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, priceText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Price command error:', error);
    await sendTelegramMessage(chatId, getText('price_error', userLang), env);
  }
}

async function handleStakeCommand(chatId, userId, args, userLang, env) {
  try {
    if (args.length < 1) {
      const usage = getText('stake_usage', userLang);
      await sendTelegramMessage(chatId, usage, env);
      return;
    }
    
    const amount = parseFloat(args[0]);
    const duration = parseInt(args[1]) || 30; // Default 30 days
    
    if (isNaN(amount) || amount < 100) {
      await sendTelegramMessage(chatId, getText('stake_minimum', userLang), env);
      return;
    }
    
    // Check balance
    const wallet = await getUserWallet(userId, env);
    if (!wallet || wallet.available < amount) {
      await sendTelegramMessage(chatId, getText('insufficient_balance', userLang), env);
      return;
    }
    
    // Calculate staking rewards
    const apy = await getStakingAPY(duration);
    const estimatedRewards = (amount * apy * duration) / (365 * 100);
    
    const confirmText = getText('confirm_stake', userLang, {
      amount: formatNumber(amount),
      duration: duration,
      apy: apy,
      estimated_rewards: formatNumber(estimatedRewards),
      currency: wallet.currency
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('confirm', userLang), callback_data: `confirm_stake_${amount}_${duration}` },
          { text: getText('cancel', userLang), callback_data: 'cancel' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, confirmText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Stake command error:', error);
    await sendTelegramMessage(chatId, getText('stake_error', userLang), env);
  }
}

// Callback Query Handler
async function handleCallbackQuery(callbackQuery, env) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id.toString();
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    const userLang = await getUserLanguage(userId, env);
    
    console.log(`Processing callback query: ${data} for user: ${userId}`);
    
    // Answer callback query first
    await answerCallbackQuery(callbackQuery.id, env);
    
    // Handle different callback data
    if (data === 'balance') {
      await showBalanceInline(chatId, userId, userLang, env, messageId);
    } else if (data === 'send') {
      await showSendOptions(chatId, userId, userLang, env, messageId);
    } else if (data === 'receive') {
      await showReceiveInfo(chatId, userId, userLang, env, messageId);
    } else if (data === 'deposit_thb') {
      console.log('Handling deposit_thb callback');
      await showDepositThbOptions(chatId, userId, userLang, env, messageId);
    } else if (data === 'withdraw_usdt') {
      console.log('Handling withdraw_usdt callback');
      await showWithdrawUsdtOptions(chatId, userId, userLang, env, messageId);
    } else if (data === 'history') {
      await showTransactionHistory(chatId, userId, userLang, env, messageId);
    } else if (data === 'price') {
      await showPriceInfo(chatId, userLang, env, messageId);
    } else if (data === 'settings') {
      await showSettingsMenu(chatId, userId, userLang, env, messageId);
    } else if (data === 'main_menu') {
      await showMainMenu(chatId, userId, userLang, env, messageId);
    } else if (data.startsWith('confirm_send_')) {
      await processConfirmedSend(chatId, userId, data, userLang, env);
    } else if (data.startsWith('confirm_stake_')) {
      await processConfirmedStake(chatId, userId, data, userLang, env);
    } else if (data.startsWith('confirm_withdraw_')) {
      await processConfirmedWithdraw(chatId, userId, data, userLang, env);
    } else if (data.startsWith('deposit_status_')) {
      await showDepositStatus(chatId, userId, data, userLang, env);
    } else if (data.startsWith('lang_')) {
      await changeLanguage(chatId, userId, data, env);
    } else if (data.startsWith('settings_')) {
      const action = data.replace('settings_', '');
      await handleSettingsCallback(chatId, userId, action, env, messageId);
    } else if (data.startsWith('send_')) {
      const action = data.replace('send_', '');
      await handleSendCallback(chatId, userId, action, env, messageId);
    } else if (data.startsWith('set_lang_')) {
      const lang = data.replace('set_lang_', '');
      await setUserLanguage(chatId, userId, lang, env, messageId);
    } else if (data.startsWith('quick_deposit_')) {
      const amount = data.replace('quick_deposit_', '');
      await handleQuickDeposit(chatId, userId, amount, env, messageId);
    } else if (data.startsWith('quick_withdraw_')) {
      const amount = data.replace('quick_withdraw_', '');
      await handleQuickWithdraw(chatId, userId, amount, env, messageId);
    } else if (data === 'custom_deposit') {
      await showCustomDepositInstructions(chatId, userId, env, messageId);
    } else if (data === 'custom_withdraw') {
      await showCustomWithdrawInstructions(chatId, userId, env, messageId);
    } else if (data === 'withdraw_all_usdt') {
      await handleWithdrawAll(chatId, userId, env, messageId);
    } else if (data === 'deposit_history') {
      await showDepositHistory(chatId, userId, env, messageId);
    } else if (data === 'withdraw_history') {
      await showWithdrawHistory(chatId, userId, env, messageId);
    } else if (data === 'check_rates') {
      await showExchangeRates(chatId, userId, env, messageId);
    } else if (data.startsWith('copy_account_')) {
      const depositId = data.replace('copy_account_', '');
      await handleCopyAccount(chatId, userId, depositId, env, messageId);
    }
    
  } catch (error) {
    console.error('Callback query error:', error);
  }
}

// New Inline Handlers for Deposit/Withdraw
async function showDepositThbOptions(chatId, userId, userLang, env, messageId = null) {
  try {
    console.log('showDepositThbOptions called for user:', userId);
    
    // Show loading message first
    if (messageId) {
      try {
        await editTelegramMessage(chatId, messageId, "⏳ กำลังโหลดตัวเลือกการฝากเงิน...", env);
      } catch (editError) {
        console.log('Could not edit message, continuing...');
      }
    }
    
    // Simplified user check
    let user;
    try {
      user = await getUserData(userId, env);
      console.log('User data retrieved:', user ? 'success' : 'failed');
    } catch (userError) {
      console.error('Error getting user data:', userError);
      user = null;
    }
    
    // Continue even if user data fails - create basic deposit menu
    const depositText = `🏦 ฝากเงิน THB\n\n` +
      `💰 *ฝากเงินผ่านโอนธนาคาร*\n` +
      `• ฝากขั้นต่ำ 100 บาท\n` +
      `• ฝากสูงสุด 50,000 บาท/วัน\n` +
      `• ระบบประมวลผลอัตโนมัติ\n\n` +
      `📝 *วิธีการฝากเงิน:*\n` +
      `1. เลือกจำนวนเงินที่ต้องการฝาก\n` +
      `2. โอนเงินตามรายละเอียดที่ระบบให้\n` +
      `3. รอระบบยืนยันอัตโนมัติ (1-5 นาที)\n\n` +
      `💡 *คำแนะนำ:*\n` +
      `• เลือกจำนวนเงินด้านล่าง\n` +
      `• หรือใช้คำสั่ง /deposit_thb จำนวน\n\n` +
      `👤 *User Status:* ${user ? 'ผู้ใช้ลงทะเบียนแล้ว' : 'กรุณาใช้ /start ก่อน'}`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '฿ 500', callback_data: 'quick_deposit_500' },
          { text: '฿ 1,000', callback_data: 'quick_deposit_1000' }
        ],
        [
          { text: '฿ 2,000', callback_data: 'quick_deposit_2000' },
          { text: '฿ 5,000', callback_data: 'quick_deposit_5000' }
        ],
        [
          { text: '฿ 10,000', callback_data: 'quick_deposit_10000' },
          { text: '💰 จำนวนอื่นๆ', callback_data: 'custom_deposit' }
        ],
        [
          { text: '📊 ประวัติการฝาก', callback_data: 'deposit_history' },
          { text: '🏠 เมนูหลัก', callback_data: 'main_menu' }
        ]
      ]
    };
    
    console.log('Sending deposit options message');
    
    if (messageId) {
      await editTelegramMessage(chatId, messageId, depositText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } else {
      await sendTelegramMessage(chatId, depositText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    }
    
    console.log('Deposit options message sent successfully');
    
  } catch (err) {
    console.error('showDepositThbOptions error:', err);
    const errorText = `❌ เกิดข้อผิดพลาดในการโหลดตัวเลือกการฝากเงิน\n\nรายละเอียดข้อผิดพลาด:\n${err.message}\n\nกรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ`;
    
    try {
      if (messageId) {
        await editTelegramMessage(chatId, messageId, errorText, env);
      } else {
        await sendTelegramMessage(chatId, errorText, env);
      }
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

async function showWithdrawUsdtOptions(chatId, userId, userLang, env, messageId = null) {
  try {
    console.log('showWithdrawUsdtOptions called for user:', userId);
    
    // Show loading message first
    if (messageId) {
      try {
        await editTelegramMessage(chatId, messageId, "⏳ กำลังโหลดตัวเลือกการถอนเงิน...", env);
      } catch (editError) {
        console.log('Could not edit message, continuing...');
      }
    }
    
    // Simplified user check
    let user;
    try {
      user = await getUserData(userId, env);
      console.log('User data retrieved:', user ? 'success' : 'failed');
    } catch (userError) {
      console.error('Error getting user data:', userError);
      user = null;
    }

    // Get wallet balance with error handling
    let balance = 'ไม่สามารถโหลดได้';
    let walletStatus = 'ไม่สามารถตรวจสอบได้';
    
    if (user) {
      try {
        const wallet = await getUserWallet(user.user_id, env);
        balance = wallet ? formatNumber(wallet.available || 0) : '0';
        walletStatus = 'โหลดสำเร็จ';
        console.log('Wallet balance retrieved:', balance);
      } catch (walletError) {
        console.error('Error getting wallet balance:', walletError);
        balance = 'ข้อผิดพลาด';
        walletStatus = 'เกิดข้อผิดพลาด';
      }
    }
    
    const withdrawText = `💎 ถอน USDT\n\n` +
      `💰 *ยอดเงินปัจจุบัน:* ${balance} DOGLC\n` +
      `📊 *สถานะกระเป๋า:* ${walletStatus}\n\n` +
      `📤 *ถอนเป็น USDT*\n` +
      `• ถอนขั้นต่ำ 10 USDT\n` +
      `• ถอนสูงสุด 10,000 USDT/วัน\n` +
      `• ค่าธรรมเนียม 2 USDT/รายการ\n` +
      `• ใช้เวลาประมวลผล 5-30 นาที\n\n` +
      `📝 *วิธีการถอน:*\n` +
      `1. ระบุที่อยู่ USDT Wallet (TRC20)\n` +
      `2. ระบุจำนวนที่ต้องการถอน\n` +
      `3. รอระบบประมวลผลและส่ง USDT\n\n` +
      `💡 *คำแนะนำ:*\n` +
      `• ตรวจสอบที่อยู่ให้ถูกต้อง\n` +
      `• ใช้คำสั่ง /withdraw_usdt จำนวน ที่อยู่\n\n` +
      `👤 *User Status:* ${user ? 'ผู้ใช้ลงทะเบียนแล้ว' : 'กรุณาใช้ /start ก่อน'}`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '💎 ถอนทั้งหมด', callback_data: 'withdraw_all_usdt' },
          { text: '💰 ถอนจำนวนกำหนด', callback_data: 'custom_withdraw' }
        ],
        [
          { text: '📊 ประวัติการถอน', callback_data: 'withdraw_history' },
          { text: '💱 ตรวจสอบอัตรา', callback_data: 'check_rates' }
        ],
        [
          { text: '🏠 เมนูหลัก', callback_data: 'main_menu' }
        ]
      ]
    };
    
    console.log('Sending withdraw options message');
    
    if (messageId) {
      await editTelegramMessage(chatId, messageId, withdrawText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } else {
      await sendTelegramMessage(chatId, withdrawText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    }
    
    console.log('Withdraw options message sent successfully');
    
  } catch (err) {
    console.error('showWithdrawUsdtOptions error:', err);
    const errorText = `❌ เกิดข้อผิดพลาดในการโหลดตัวเลือกการถอนเงิน\n\nรายละเอียดข้อผิดพลาด:\n${err.message}\n\nกรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ`;
    
    try {
      if (messageId) {
        await editTelegramMessage(chatId, messageId, errorText, env);
      } else {
        await sendTelegramMessage(chatId, errorText, env);
      }
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

// New Confirmation Processors
async function processConfirmedWithdraw(chatId, userId, callbackData, userLang, env) {
  try {
    const parts = callbackData.replace('confirm_withdraw_', '').split('_');
    const doglcAmount = parseFloat(parts[0]);
    const usdtAddress = decodeURIComponent(parts.slice(1).join('_'));
    
    // Get internal user token
    const internalToken = await getInternalUserToken(userId, env);
    if (!internalToken) {
      await sendTelegramMessage(chatId, getText('auth_error', userLang), env);
      return;
    }
    
    // Process withdrawal through banking worker
    const response = await env.BANKING.fetch(new Request('https://banking-worker/crypto/withdraw/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalToken}`,
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        doglcAmount: doglcAmount,
        usdtAddress: usdtAddress,
        network: 'TRC20'
      })
    }));
    
    const result = await response.json();
    
    if (result.success) {
      const successText = getText('withdraw_success', userLang, {
        doglcAmount: formatNumber(doglcAmount),
        withdrawId: result.withdrawId
      });
      
      await sendTelegramMessage(chatId, successText, env);
      
      // Send updated balance
      await showBalanceInline(chatId, userId, userLang, env);
    } else {
      await sendTelegramMessage(chatId, getText('withdraw_failed', userLang) + ': ' + result.error, env);
    }
    
  } catch (error) {
    console.error('Confirmed withdraw error:', error);
    await sendTelegramMessage(chatId, getText('withdraw_error', userLang), env);
  }
}

async function showDepositStatus(chatId, userId, callbackData, userLang, env) {
  try {
    const depositId = callbackData.replace('deposit_status_', '');
    
    // Get deposit status from banking worker
    const response = await env.BANKING.fetch(new Request(`https://banking-worker/fiat/deposit/status/${depositId}`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    }));
    
    const result = await response.json();
    
    if (result.success) {
      const statusText = getText('deposit_status', userLang, {
        depositId: depositId,
        status: getStatusText(result.deposit.status, userLang),
        amount: formatNumber(result.deposit.amount),
        createdAt: new Date(result.deposit.created_at).toLocaleString('th-TH')
      });
      
      await sendTelegramMessage(chatId, statusText, env);
    } else {
      await sendTelegramMessage(chatId, getText('deposit_not_found', userLang), env);
    }
    
  } catch (error) {
    console.error('Deposit status error:', error);
    await sendTelegramMessage(chatId, getText('status_error', userLang), env);
  }
}

// Inline Handlers
async function showBalanceInline(chatId, telegramUserId, userLang, env, messageId = null) {
  try {
    console.error('=== SHOW BALANCE INLINE STARTED ===');
    
    const user = await getUserData(telegramUserId, env);
    console.error('User data for balance:', user);
    
    if (!user) {
      const errorText = "❌ ไม่พบข้อมูลผู้ใช้ กรุณาเริ่มต้นใหม่ด้วย /start";
      if (messageId) {
        await editTelegramMessage(chatId, messageId, errorText, env);
      } else {
        await sendTelegramMessage(chatId, errorText, env);
      }
      return;
    }
    
    // Get wallet, create if doesn't exist
    let wallet = await getUserWallet(user.user_id, env);
    console.error('Wallet data:', wallet);
    
    if (!wallet) {
      console.error(`Creating wallet for balance inline: ${user.user_id}`);
      const creatingText = "⏳ กำลังสร้างกระเป๋าเงินใหม่...";
      if (messageId) {
        await editTelegramMessage(chatId, messageId, creatingText, env);
      } else {
        await sendTelegramMessage(chatId, creatingText, env);
      }
      
      wallet = await createUserWallet(user.user_id, env);
      console.error('Created wallet:', wallet);
    }
    
    if (!wallet) {
      const errorText = "❌ ไม่สามารถสร้างกระเป๋าเงินได้ กรุณาติดต่อผู้ดูแลระบบ";
      if (messageId) {
        await editTelegramMessage(chatId, messageId, errorText, env);
      } else {
        await sendTelegramMessage(chatId, errorText, env);
      }
      return;
    }
    
    const balanceText = `💰 ยอดเงินของคุณ\n\n` +
      `💎 ยอดรวม: ${formatNumber(wallet.balance || 0)} ${wallet.currency || 'DOGLC'}\n` +
      `✅ ใช้ได้: ${formatNumber(wallet.available || wallet.balance || 0)} ${wallet.currency || 'DOGLC'}\n` +
      `🔒 ยอดกักเก็บ: ${formatNumber(wallet.frozen_balance || 0)} ${wallet.currency || 'DOGLC'}\n\n` +
      `📍 ที่อยู่กระเป๋า: \`${wallet.wallet_address || 'N/A'}\`\n\n` +
      `💡 *คำแนะนำ:*\n` +
      `• กดปุ่ม "💸 ส่งเงิน" เพื่อโอนเงิน\n` +
      `• กดปุ่ม "📥 รับเงิน" เพื่อดูที่อยู่รับเงิน\n` +
      `• กดปุ่ม "🔄 รีเฟรช" เพื่ออัปเดตยอดเงิน`;

    // Create inline keyboard with action buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: "💸 ส่งเงิน", callback_data: "send" },
          { text: "📥 รับเงิน", callback_data: "receive" }
        ],
        [
          { text: "📊 ประวัติ", callback_data: "history" },
          { text: "🔄 รีเฟรช", callback_data: "balance" }
        ],
        [
          { text: "⚙️ ตั้งค่า", callback_data: "settings" },
          { text: "🏠 เมนูหลัก", callback_data: "main_menu" }
        ]
      ]
    };
    
    if (messageId) {
      await editTelegramMessage(chatId, messageId, balanceText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } else {
      await sendTelegramMessage(chatId, balanceText, env, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    }
    
    console.error('=== SHOW BALANCE INLINE COMPLETED ===');
    
  } catch (error) {
    console.error('Show balance inline error:', error);
    const errorText = "❌ เกิดข้อผิดพลาดในการดึงข้อมูลยอดเงิน";
    if (messageId) {
      await editTelegramMessage(chatId, messageId, errorText, env);
    } else {
      await sendTelegramMessage(chatId, errorText, env);
    }
  }
}

async function showSendOptions(chatId, userId, userLang, env, messageId = null) {
	try {
		const user = await getUserData(userId, env);
		if (!user) {
			const errorText = "❌ ไม่พบข้อมูลผู้ใช้ กรุณาเริ่มต้นใหม่ด้วย /start";
			if (messageId) {
				await editTelegramMessage(chatId, messageId, errorText, env);
			} else {
				await sendTelegramMessage(chatId, errorText, env);
			}
			return;
		}

		// Get wallet balance
		const wallet = await getUserWallet(user.user_id, env);
		const balance = wallet ? formatNumber(wallet.available || 0) : '0';
		
		const sendText = `💸 ส่งเงิน\n\n` +
			`💰 *ยอดเงินปัจจุบัน:* ${balance} ${wallet?.currency || 'DOGLC'}\n\n` +
			`📝 *วิธีการส่งเงิน:*\n` +
			`• เลือกประเภทการส่งด้านล่าง\n` +
			`• ระบุผู้รับและจำนวนเงิน\n` +
			`• ยืนยันการทำรายการ\n\n` +
			`💡 *คำแนะนำ:*\n` +
			`• ส่งผ่าน Username ง่ายที่สุด\n` +
			`• ตรวจสอบยอดเงินก่อนส่งเสมอ`;
		
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "👤 ส่งผ่าน Username", callback_data: "send_username" },
					{ text: "📱 ส่งผ่าน User ID", callback_data: "send_userid" }
				],
				[
					{ text: "🔗 ส่งผ่าน Address", callback_data: "send_address" },
					{ text: "📞 ส่งผ่าน Phone", callback_data: "send_phone" }
				],
				[
					{ text: "💰 ดูยอดเงิน", callback_data: "balance" },
					{ text: "📊 ประวัติ", callback_data: "history" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};
		
		if (messageId) {
			await editTelegramMessage(chatId, messageId, sendText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await sendTelegramMessage(chatId, sendText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		}
	} catch (err) {
		console.error('showSendOptions error:', err);
		const errorText = "❌ เกิดข้อผิดพลาดในการโหลดตัวเลือกการส่งเงิน";
		if (messageId) {
			await editTelegramMessage(chatId, messageId, errorText, env);
		} else {
			await sendTelegramMessage(chatId, errorText, env);
		}
	}
}

async function showMainMenu(chatId, userId, userLang, env, messageId = null) {
  const welcomeMessage = "🎉 สวัสดี!\n\nคุณสามารถใช้งานฟีเจอร์ต่างๆ ผ่านปุ่มด้านล่าง\n\n💡 *คำแนะนำ:*\n" +
    "• กด 💰 เพื่อดูยอดเงิน\n" +
    "• กด 💸 เพื่อส่งเงิน\n" +
    "• กด 📥 เพื่อรับเงิน\n" +
    "• กด 🏦 เพื่อฝากเงิน THB\n" +
    "• กด � เพื่อถอน USDT\n" +
    "• กด �📊 เพื่อดูประวัติการทำรายการ";

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💰 ตรวจสอบยอดเงิน", callback_data: "balance" },
        { text: "💸 ส่งเงิน", callback_data: "send" }
      ],
      [
        { text: "📥 รับเงิน", callback_data: "receive" },
        { text: "📊 ประวัติ", callback_data: "history" }
      ],
      [
        { text: "🏦 ฝากเงิน THB", callback_data: "deposit_thb" },
        { text: "💎 ถอน USDT", callback_data: "withdraw_usdt" }
      ],
      [
        { text: "⚙️ ตั้งค่า", callback_data: "settings" }
      ]
    ]
  };

  if (messageId) {
    await editTelegramMessage(chatId, messageId, welcomeMessage, env, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    });
  } else {
    await sendTelegramMessage(chatId, welcomeMessage, env, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    });
  }
}

async function processConfirmedSend(chatId, userId, callbackData, userLang, env) {
  try {
    const parts = callbackData.replace('confirm_send_', '').split('_');
    const recipient = parts[0];
    const amount = parseFloat(parts[1]);
    const note = parts.length > 2 ? decodeURIComponent(parts.slice(2).join('_')) : '';
    
    // Process transaction through banking worker
    const response = await env.BANKING.fetch(new Request('https://banking-worker/transactions/send', {
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
    }));
    
    const result = await response.json();
    
    if (result.success) {
      const successText = getText('send_success', userLang, {
        amount: formatNumber(amount),
        recipient: recipient,
        transaction_id: result.transaction.id
      });
      
      await sendTelegramMessage(chatId, successText, env);
      
      // Send updated balance
      await showBalanceInline(chatId, userId, userLang, env);
    } else {
      await sendTelegramMessage(chatId, getText('send_failed', userLang) + ': ' + result.error, env);
    }
    
  } catch (error) {
    console.error('Confirmed send error:', error);
    await sendTelegramMessage(chatId, getText('send_error', userLang), env);
  }
}

// User Management Functions
async function createNewUser(telegramUserId, chatId, env) {
  try {
    // Build user object
    const userData = {
      user_id: generateUserId(),
      username: null,
      telegram_id: telegramUserId,
      chat_id: chatId,
      kyc_status: 'unverified',
      account_status: 'active',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    
    // Insert into users table - using only existing columns
    await env.DB.prepare(`
      INSERT INTO users (user_id, username, telegram_id, chat_id, kyc_status, account_status, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.user_id,
      userData.username,
      userData.telegram_id,
      userData.chat_id,
      userData.kyc_status,
      userData.account_status,
      userData.last_login
    ).run();
    
    // Create user preferences with simple structure - using existing columns
    await env.DB.prepare(`
      INSERT INTO user_preferences (user_id, language, notifications)
      VALUES (?, ?, ?)
    `).bind(
      userData.user_id,
      'th',
      true
    ).run();
    
    // Create wallet via banking service
    try {
      const walletResponse = await env.BANKING.fetch('https://banking.internal/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API': env.INTERNAL_API_KEY
        },
        body: JSON.stringify({
          userId: userData.user_id,
          currency: 'DOGLC'
        })
      });
      
      if (walletResponse.ok) {
        console.log('Wallet created successfully');
      } else {
        console.error('Failed to create wallet:', await walletResponse.text());
      }
    } catch (walletError) {
      console.error('Wallet creation error:', walletError);
    }
    
    return userData;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

async function getUserData(telegramId, env) {
  try {
    // Check cache first
    const cachedUser = await env.USER_SESSIONS.get(`telegram_user_${telegramId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    
    // Query database
    const user = await env.DB.prepare(`
      SELECT * FROM users WHERE telegram_id = ?
    `).bind(telegramId).first();
    
    if (user) {
      // Cache for future use
      await env.USER_SESSIONS.put(
        `telegram_user_${telegramId}`,
        JSON.stringify(user),
        { expirationTtl: 86400 * 7 }
      );
      
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
}

async function getUserWallet(userId, env) {
  try {
    // Resolve to internal user id if a Telegram id was passed
    const internalId = await resolveToInternalUserId(userId, env) || userId;

    // Get wallet from banking worker
    const response = await env.BANKING.fetch(new Request(`https://banking-worker/wallet/balance?userId=${internalId}`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    }));
    
    const result = await response.json();
    
    if (result.success) {
      return result.wallet;
    }
    
    return null;
  } catch (error) {
    console.error('Get user wallet error:', error);
    return null;
  }
}

async function createUserWallet(userId, env) {
  try {
    console.log(`Creating wallet for user: ${userId}`);
    const response = await env.BANKING.fetch(new Request('https://banking-worker/wallet/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: userId,
        currency: 'DOGLC'
      })
    }));
    
    const result = await response.json();
    console.log('Create wallet result:', result);
    
    if (result.success && result.wallet) {
      return result.wallet;
    }
    
    console.error('Failed to create wallet:', result);
    return null;
    
  } catch (error) {
    console.error('Create wallet error:', error);
    return null;
  }
}

// Helper: resolve input (telegram id or internal user_id) to internal user_id
async function resolveToInternalUserId(id, env) {
	// If already internal id style, return as-is
	if (!id) return null;
	if (typeof id === 'string' && id.startsWith('user_')) return id;

	// If numeric string likely Telegram id -> lookup user
	try {
		// Try cache first (USER_SESSIONS stores telegram keyed objects)
		const cached = await env.USER_SESSIONS.get(`telegram_user_${id}`);
		if (cached) {
			const u = JSON.parse(cached);
			if (u.user_id) return u.user_id;
		}

		// Query DB by telegram_id
		const user = await env.DB.prepare(`
			SELECT user_id FROM users WHERE telegram_id = ?
		`).bind(id).first();

		if (user && user.user_id) return user.user_id;
		return null;
	} catch (err) {
		console.error('resolveToInternalUserId error:', err);
		return null;
	}
}

// Helper function to get internal user token
async function getInternalUserToken(telegramOrInternalUserId, env) {
  try {
    // Resolve to internal user id if needed
    const internalId = await resolveToInternalUserId(telegramOrInternalUserId, env);
    if (!internalId) return null;
    
    // Generate internal token for API calls
    const response = await env.BANKING.fetch(new Request('https://banking-worker/auth/internal-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        userId: internalId,
        source: 'telegram_bot'
      })
    }));
    
    const result = await response.json();
    return result.success ? result.token : null;
    
  } catch (error) {
    console.error('Get internal token error:', error);
    return null;
  }
}

// Small safe stubs/wrappers for referenced but missing functions
async function showTransactionHistory(chatId, userId, userLang, env, messageId = null) {
	try {
		// Get user data first
		const user = await getUserData(userId, env);
		if (!user) {
			const errorText = "❌ ไม่พบข้อมูลผู้ใช้ กรุณาเริ่มต้นใหม่ด้วย /start";
			if (messageId) {
				await editTelegramMessage(chatId, messageId, errorText, env);
			} else {
				await sendTelegramMessage(chatId, errorText, env);
			}
			return;
		}

		// Get recent transactions from database
		const transactions = await env.DB.prepare(`
			SELECT * FROM transactions 
			WHERE from_user = ? OR to_user = ? 
			ORDER BY created_at DESC 
			LIMIT 10
		`).bind(user.user_id, user.user_id).all();

		let historyText = "📊 ประวัติการทำธุรกรรม\n\n";
		
		if (!transactions.results || transactions.results.length === 0) {
			historyText += "📭 ยังไม่มีธุรกรรม\n\n💡 *คำแนะนำ:*\n• กด 💰 เพื่อดูยอดเงิน\n• กด 💸 เพื่อส่งเงิน\n• กด 📥 เพื่อรับเงิน";
		} else {
			transactions.results.forEach((tx, index) => {
				const isReceive = tx.to_user === user.user_id;
				const emoji = isReceive ? "📥" : "📤";
				const action = isReceive ? "รับ" : "ส่ง";
				const amount = formatNumber(tx.amount || 0);
				const date = new Date(tx.created_at).toLocaleDateString('th-TH');
				const status = tx.status === 'completed' ? '✅' : '⏳';
				
				historyText += `${emoji} ${action} ${amount} ${tx.currency || 'DOGLC'} ${status}\n`;
				historyText += `📅 ${date}`;
				if (tx.note) historyText += ` • ${tx.note}`;
				historyText += "\n\n";
			});
			
			historyText += "💡 *คำแนะนำ:*\n• กด 🔄 เพื่ออัปเดตประวัติ\n• กด 💰 เพื่อดูยอดเงิน";
		}

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "🔄 รีเฟรช", callback_data: "history" },
					{ text: "💰 ดูยอดเงิน", callback_data: "balance" }
				],
				[
					{ text: "💸 ส่งเงิน", callback_data: "send" },
					{ text: "📥 รับเงิน", callback_data: "receive" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		if (messageId) {
			await editTelegramMessage(chatId, messageId, historyText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await sendTelegramMessage(chatId, historyText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		}
	} catch (err) {
		console.error('showTransactionHistory error:', err);
		const errorText = "❌ เกิดข้อผิดพลาดในการดึงประวัติ";
		if (messageId) {
			await editTelegramMessage(chatId, messageId, errorText, env);
		} else {
			await sendTelegramMessage(chatId, errorText, env);
		}
	}
}

async function showReceiveInfo(chatId, userId, userLang, env, messageId = null) {
	try {
		// Get user data and wallet
		const user = await getUserData(userId, env);
		if (!user) {
			const errorText = "❌ ไม่พบข้อมูลผู้ใช้ กรุณาเริ่มต้นใหม่ด้วย /start";
			if (messageId) {
				await editTelegramMessage(chatId, messageId, errorText, env);
			} else {
				await sendTelegramMessage(chatId, errorText, env);
			}
			return;
		}

		const wallet = await getUserWallet(user.user_id, env);
		if (!wallet) {
			const errorText = "❌ ไม่พบกระเป๋าเงิน กรุณาสร้างกระเป๋าเงินก่อน";
			if (messageId) {
				await editTelegramMessage(chatId, messageId, errorText, env);
			} else {
				await sendTelegramMessage(chatId, errorText, env);
			}
			return;
		}

		const receiveText = `📥 รับเงิน DOGLC\n\n` +
			`📍 ที่อยู่กระเป๋าของคุณ:\n\`${wallet.wallet_address}\`\n\n` +
			`💡 *คำแนะนำสำหรับการรับเงิน:*\n` +
			`• คัดลอกที่อยู่กระเป๋าด้านบน\n` +
			`• ส่งให้ผู้ที่จะโอนเงินให้คุณ\n` +
			`• เงินจะเข้าบัญชีอัตโนมัติ\n` +
			`• ตรวจสอบยอดเงินเพื่อดูการอัปเดต`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "📋 คัดลอกที่อยู่", callback_data: `copy_address_${wallet.wallet_address}` }
				],
				[
					{ text: "💰 ตรวจสอบยอดเงิน", callback_data: "balance" },
					{ text: "📊 ประวัติ", callback_data: "history" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		if (messageId) {
			await editTelegramMessage(chatId, messageId, receiveText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await sendTelegramMessage(chatId, receiveText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		}
	} catch (err) {
		console.error('showReceiveInfo error:', err);
		const errorText = "❌ เกิดข้อผิดพลาดในการแสดงข้อมูลการรับเงิน";
		if (messageId) {
			await editTelegramMessage(chatId, messageId, errorText, env);
		} else {
			await sendTelegramMessage(chatId, errorText, env);
		}
	}
}

async function handleUnstakeCommand(chatId, userId, args, userLang, env) {
	// Placeholder: respond with simple message (expand as needed)
	await sendTelegramMessage(chatId, getText('unstake_not_supported', userLang) || 'Unstake not supported yet', env);
}

async function handleInlineQuery(inlineQuery, env) {
	// Basic placeholder: no inline responses implemented
	console.warn('handleInlineQuery not implemented', inlineQuery);
	// Telegram inline queries require specific responses via answerInlineQuery; leaving as no-op to avoid crashes.
}

// Multi-language Support
async function getUserLanguage(userId, env) {
  try {
	// Resolve to internal user id if needed
	const internalId = await resolveToInternalUserId(userId, env) || userId;

    const preferences = await env.DB.prepare(`
      SELECT language FROM user_preferences WHERE user_id = ?
    `).bind(internalId).first();
    
    return preferences?.language || 'th';
  } catch (error) {
    return 'th'; // Default to Thai
  }
}

function getText(key, lang, params = {}) {
  const texts = {
    th: {
      welcome: `สวัสดี ${params.username}! 🐕\n\nยินดีต้อนรับสู่ DOGLC Digital Wallet\nกระเป๋าเงินดิจิทัลที่ปลอดภัยและง่ายต่อการใช้งาน`,
      check_balance: '💰 ตรวจสอบยอดเงิน',
      send_money: '📤 ส่งเงิน',
      receive_money: '📥 รับเงิน',
      deposit_thb: '🏦 ฝากเงินบาท',
      withdraw_usdt: '💸 ถอน USDT',
      transaction_history: '📊 ประวัติธุรกรรม',
      price_info_simple: '📈 ราคา DOGLC',
      settings: '⚙️ ตั้งค่า',
      current_balance: `💰 ยอดคงเหลือปัจจุบัน: ${params.balance} ${params.currency}`,
      balance_info: `💰 *ข้อมูลกระเป๋าเงิน*\n\n🏦 ยอดรวม: ${params.total} ${params.currency}\n✅ ใช้ได้: ${params.available} ${params.currency}\n🧊 ถูกอายัด: ${params.frozen} ${params.currency}\n\n📍 ที่อยู่: \`${params.address}\``,
      no_wallet: '❌ ไม่พบกระเป๋าเงิน กรุณาติดต่อผู้ดูแลระบบ',
      unknown_command: '❓ ไม่รู้จักคำสั่งนี้ พิมพ์ /help เพื่อดูคำสั่งที่ใช้ได้',
      command_error: '❌ เกิดข้อผิดพลาดในการประมวลผลคำสั่ง',
      error_occurred: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      send_usage: '📤 *วิธีใช้งาน:* /send <ที่อยู่หรือชื่อผู้ใช้> <จำนวน> [หมายเหตุ]\n\n*ตัวอย่าง:*\n/send @username 100\n/send doglc1abc... 50.5 ค่าอาหาร',
      invalid_amount: '❌ จำนวนเงินไม่ถูกต้อง',
      insufficient_balance: '❌ ยอดเงินไม่เพียงพอ',
      confirm_send: `💸 *ยืนยันการส่งเงิน*\n\n📤 ส่งถึง: ${params.recipient}\n💰 จำนวน: ${params.amount} ${params.currency}\n\n❓ ต้องการดำเนินการหรือไม่?`,
      confirm: '✅ ยืนยัน',
      cancel: '❌ ยกเลิก',
      send_success: `✅ *ส่งเงินสำเร็จ!*\n\n💰 จำนวน: ${params.amount} DOGLC\n📤 ผู้รับ: ${params.recipient}\n🆔 รหัสธุรกรรม: ${params.transaction_id}`,
      send_failed: '❌ การส่งเงินล้มเหลว',
      send_error: '❌ เกิดข้อผิดพลาดในการส่งเงิน',
      receive_info: `📥 *รับเงิน DOGLC*\n\n📍 ที่อยู่กระเป๋าเงิน:\n\`${params.address}\`\n\n💡 แชร์ที่อยู่นี้เพื่อรับเงิน ${params.currency}`,
      copy_address: '📋 คัดลอกที่อยู่',
      show_qr: '📱 แสดง QR Code',
      receive_error: '❌ เกิดข้อผิดพลาดในการแสดงข้อมูลการรับเงิน',
      // New Deposit/Withdraw texts
      deposit_usage: '💰 *วิธีฝากเงินบาท:* /deposit_thb <จำนวนเงิน>\n\n*ตัวอย่าง:* /deposit_thb 1000',
      withdraw_usage: '💸 *วิธีถอน USDT:* /withdraw_usdt <จำนวน DOGLC> <ที่อยู่ USDT>\n\n*ตัวอย่าง:* /withdraw_usdt 5000 Txxxxxxxxx...',
      deposit_minimum: '❌ การฝากเงินขั้นต่ำ 100 บาท',
      withdraw_minimum: '❌ การถอนขั้นต่ำ 1,000 DOGLC',
      invalid_usdt_address: '❌ ที่อยู่ USDT ไม่ถูกต้อง (ต้องขึ้นต้นด้วย T)',
      withdrawal_too_small: '❌ จำนวนการถอนน้อยเกินไป หลังหักค่าธรรมเนียมแล้ว',
      deposit_details: `✅ *กรุณาโอนเงินเพื่อเติม Wallet*\n\n*จำนวน:* ${params.amount} บาท\n*ธนาคาร:* ${params.bankName}\n*เลขบัญชี:* \`${params.accountNumber}\`\n*ชื่อบัญชี:* ${params.accountName}\n*รหัสรายการ:* \`${params.depositId}\`\n\n‼️ *สำคัญมาก:* หลังจากโอนเงินแล้ว กรุณาไปที่หน้าเว็บเพื่อ *อัปโหลดสลิป* และยืนยันรายการฝากเงินครับ`,
      confirm_withdraw: `💸 *ยืนยันการถอน USDT*\n\n💰 จำนวน DOGLC: ${params.doglcAmount}\n💵 จะได้รับ USDT: ${params.usdtAmount}\n💸 ค่าธรรมเนียม: ${params.fee} USDT\n📍 ที่อยู่: \`${params.address}\`\n\n❓ ต้องการดำเนินการหรือไม่?`,
      withdraw_success: `✅ *ส่งคำขอถอนเงินสำเร็จ!*\n\n💰 จำนวน: ${params.doglcAmount} DOGLC\n🆔 รหัสการถอน: ${params.withdrawId}\n\n⏳ ระบบกำลังดำเนินการ จะได้รับเงินภายใน 24 ชั่วโมง`,
      withdraw_failed: '❌ การถอนล้มเหลว',
      withdraw_error: '❌ เกิดข้อผิดพลาดในการถอนเงิน',
      deposit_error: '❌ เกิดข้อผิดพลาดในการฝากเงิน',
      auth_error: '❌ ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่',
      upload_slip_web: '📱 อัปโหลดสลิปที่เว็บ',
      check_status: '🔍 ตรวจสอบสถานะ',
      deposit_instructions: '🏦 *ฝากเงินบาท (THB)*\n\nเลือกจำนวนเงินที่ต้องการฝาก:',
      withdraw_instructions: '💸 *ถอน USDT*\n\nเลือกวิธีการถอน:',
      custom_amount: '💰 จำนวนกำหนดเอง',
      withdraw_all: '💸 ถอนทั้งหมด',
      custom_withdraw: '✏️ กำหนดจำนวน',
      back_to_menu: '🏠 กลับเมนูหลัก',
      deposit_status: `📋 *สถานะการฝากเงิน*\n\n🆔 รหัส: ${params.depositId}\n📊 สถานะ: ${params.status}\n💰 จำนวน: ${params.amount} บาท\n📅 วันที่: ${params.createdAt}`,
      deposit_not_found: '❌ ไม่พบรายการฝากเงิน',
      status_error: '❌ เกิดข้อผิดพลาดในการตรวจสอบสถานะ',
      no_transactions: '📭 ยังไม่มีธุรกรรม',
      transaction_history_header: '📊 *ประวัติธุรกรรม*',
      export_history: '📊 ส่งออกประวัติ',
      refresh_history: '🔄 รีเฟรช',
      history_error: '❌ เกิดข้อผิดพลาดในการโหลดประวัติ',
      price_info: `📈 *ราคา DOGLC*\n\n💵 USD: ${params.price_usd}\n₿ BTC: ${params.price_btc}\n📊 เปลี่ยนแปลง 24 ชม.: ${params.change_24h}%\n📈 ปริมาณ 24 ชม.: ${params.volume_24h}\n💎 มูลค่าตลาด: ${params.market_cap}`,
      refresh_price: '🔄 รีเฟรชราคา',
      price_alerts: '🔔 ตั้งการแจ้งเตือนราคา',
      price_error: '❌ เกิดข้อผิดพลาดในการโหลดราคา',
      stake_usage: '🎯 *วิธีใช้งาน Stake:* /stake <จำนวน> [ระยะเวลา(วัน)]\n\n*ตัวอย่าง:*\n/stake 1000 30\n/stake 500 90',
      stake_minimum: '❌ จำนวน Stake ขั้นต่ำ 100 DOGLC',
      confirm_stake: `🎯 *ยืนยัน Stake DOGLC*\n\n💰 จำนวน: ${params.amount} ${params.currency}\n⏱️ ระยะเวลา: ${params.duration} วัน\n📈 APY: ${params.apy}%\n💎 ผลตอบแทนคาดการณ์: ${params.estimated_rewards} ${params.currency}\n\n❓ ต้องการ Stake หรือไม่?`,
      stake_error: '❌ เกิดข้อผิดพลาดในการ Stake',
      inline_balance: `💰 *ยอดคงเหลือ*\n\n🏦 รวม: ${params.balance} ${params.currency}\n✅ ใช้ได้: ${params.available} ${params.currency}\n🧊 อายัด: ${params.frozen} ${params.currency}`,
      send_instructions: '📤 *ส่งเงิน DOGLC*\n\nเลือกวิธีการส่ง:',
      send_to_username: '👤 ส่งให้ @username',
      send_to_address: '📍 ส่งไปที่อยู่',
      refresh_balance: '🔄 รีเฟรชยอดเงิน',
	  received: 'ได้รับ',
	  sent: 'ส่งแล้ว',
	  current_price: `📈 *ราคา DOGLC*\n\n💵 USD: ${params.price_usd}\n📊 เปลี่ยนแปลง 24 ชม.: ${params.change_24h}%\n📈 ปริมาณ: ${params.volume}`,
    },
    en: {
      welcome: `Hello ${params.username}! 🐕\n\nWelcome to DOGLC Digital Wallet\nSecure and easy-to-use digital wallet`,
      check_balance: '💰 Check Balance',
      send_money: '📤 Send Money',
      receive_money: '📥 Receive Money',
      deposit_thb: '🏦 Deposit THB',
      withdraw_usdt: '💸 Withdraw USDT',
      transaction_history: '📊 Transaction History',
      price_info: '📈 DOGLC Price',
      settings: '⚙️ Settings',
      current_balance: `💰 Current Balance: ${params.balance} ${params.currency}`,
      balance_info: `💰 *Wallet Information*\n\n🏦 Total: ${params.total} ${params.currency}\n✅ Available: ${params.available} ${params.currency}\n🧊 Frozen: ${params.frozen} ${params.currency}\n\n📍 Address: \`${params.address}\``,
      no_wallet: '❌ No wallet found. Please contact support.',
      unknown_command: '❓ Unknown command. Type /help for available commands',
      command_error: '❌ Error processing command',
      error_occurred: '❌ An error occurred. Please try again',
      send_usage: '📤 *Usage:* /send <address or username> <amount> [note]\n\n*Examples:*\n/send @username 100\n/send doglc1abc... 50.5 food payment',
      invalid_amount: '❌ Invalid amount',
      insufficient_balance: '❌ Insufficient balance',
      confirm_send: `💸 *Confirm Transfer*\n\n📤 To: ${params.recipient}\n💰 Amount: ${params.amount} ${params.currency}\n\n❓ Proceed with transaction?`,
      confirm: '✅ Confirm',
      cancel: '❌ Cancel',
      send_success: `✅ *Transfer Successful!*\n\n💰 Amount: ${params.amount} DOGLC\n📤 Recipient: ${params.recipient}\n🆔 Transaction ID: ${params.transaction_id}`,
      send_failed: '❌ Transfer failed',
      send_error: '❌ Error sending money',
      // English versions of new texts
      deposit_usage: '💰 *THB Deposit Usage:* /deposit_thb <amount>\n\n*Example:* /deposit_thb 1000',
      withdraw_usage: '💸 *USDT Withdraw Usage:* /withdraw_usdt <DOGLC amount> <USDT address>\n\n*Example:* /withdraw_usdt 5000 Txxxxxxxxx...',
      deposit_minimum: '❌ Minimum deposit: 100 THB',
      withdraw_minimum: '❌ Minimum withdrawal: 1,000 DOGLC',
      invalid_usdt_address: '❌ Invalid USDT address (must start with T)',
      withdrawal_too_small: '❌ Withdrawal amount too small after fees',
      deposit_details: `✅ *Please transfer money to deposit*\n\n*Amount:* ${params.amount} THB\n*Bank:* ${params.bankName}\n*Account Number:* \`${params.accountNumber}\`\n*Account Name:* ${params.accountName}\n*Deposit ID:* \`${params.depositId}\`\n\n‼️ *Important:* After transfer, please upload slip on website to confirm deposit`,
      confirm_withdraw: `💸 *Confirm USDT Withdrawal*\n\n💰 DOGLC Amount: ${params.doglcAmount}\n💵 USDT to Receive: ${params.usdtAmount}\n💸 Fee: ${params.fee} USDT\n📍 Address: \`${params.address}\`\n\n❓ Proceed with withdrawal?`,
      withdraw_success: `✅ *Withdrawal Request Successful!*\n\n💰 Amount: ${params.doglcAmount} DOGLC\n🆔 Withdrawal ID: ${params.withdrawId}\n\n⏳ Processing... You'll receive funds within 24 hours`,
	  received: 'Received',
	  sent: 'Sent',
	  current_price: `📈 *DOGLC Price*\n\n💵 USD: ${params.price_usd}\n📊 24h Change: ${params.change_24h}%\n📈 Volume: ${params.volume}`,
    }
  };
  
  return texts[lang]?.[key] || texts['th'][key] || key;
}

// Helper function to get status text in appropriate language
function getStatusText(status, lang) {
  const statusTexts = {
    th: {
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      completed: 'เสร็จสิ้น',
      failed: 'ล้มเหลว',
      cancelled: 'ยกเลิก'
    },
    en: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled'
    }
  };
  
  return statusTexts[lang]?.[status] || statusTexts['th'][status] || status;
}

// Utility Functions
function formatNumber(num) {
  if (num === null || num === undefined) return '0.00';
  return parseFloat(num).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  });
}

function formatPrice(price, decimals = 6) {
  return parseFloat(price).toFixed(decimals);
}

function formatPercentage(percent) {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}`;
}

function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

async function getCurrentDoglcPrice(env) {
  try {
    // Get cached price
    const cachedPrice = await env.PRICE_DATA_CACHE.get('current_price');
    
    if (cachedPrice) {
      const priceData = JSON.parse(cachedPrice);
      return priceData.price;
    }
    
    // Default price data if cache miss
    return {
      doglc_usd: 0.001,
      doglc_btc: 0.000000023,
      change_24h: 2.5,
      volume_24h: 50000,
      market_cap: 1000000
    };
  } catch (error) {
    return {
      doglc_usd: 0.001,
      doglc_btc: 0.000000023,
      change_24h: 0,
      volume_24h: 0,
      market_cap: 0
    };
  }
}

async function getStakingAPY(duration) {
  if (duration >= 365) return 12;
  if (duration >= 180) return 10;
  if (duration >= 90) return 8;
  if (duration >= 30) return 6;
  return 4;
}

async function getUserTransactionHistory(userId, limit, type, env) {
  try {
	// Resolve to internal user id
	const internalId = await resolveToInternalUserId(userId, env) || userId;

    let query = `
      SELECT * FROM transactions 
      WHERE (from_user = ? OR to_user = ?)
    `;
    
    const params = [internalId, internalId];
    
    if (type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await env.DB.prepare(query).bind(...params).all();
    return result.results || [];
  } catch (error) {
    console.error('Get transaction history error:', error);
    return [];
  }
}

// Notification Functions
async function sendNotification(request, env) {
  try {
    const data = await request.json();
    const { userId, type, message, data: notificationData } = data;
    
    // Get user's Telegram chat ID
    const user = await getUserData(userId, env);
    if (!user || !user.chat_id) {
      return errorResponse('User not found or no chat ID', 404);
    }
    
    const userLang = await getUserLanguage(userId, env);
    
    // Format notification message
    let notificationText = '';
    
    switch (type) {
      case 'transaction_confirmed':
        notificationText = getText('notification_tx_confirmed', userLang, {
          amount: formatNumber(notificationData.amount),
          hash: notificationData.transactionHash
        });
        break;
        
      case 'payment_received':
        notificationText = getText('notification_payment_received', userLang, {
          amount: formatNumber(notificationData.amount),
          from: notificationData.from || 'Unknown'
        });
        break;
        
      case 'deposit_confirmed':
        notificationText = getText('notification_deposit_confirmed', userLang, {
          amount: formatNumber(notificationData.amount),
          doglcReceived: formatNumber(notificationData.doglcReceived)
        });
        break;
        
      case 'withdrawal_completed':
        notificationText = getText('notification_withdrawal_completed', userLang, {
          amount: formatNumber(notificationData.usdtAmount),
          txHash: notificationData.transactionHash
        });
        break;
        
      case 'staking_reward':
        notificationText = getText('notification_staking_reward', userLang, {
          reward: formatNumber(notificationData.reward)
        });
        break;
        
      default:
        notificationText = message || 'New notification';
    }
    
    // Send notification
    await sendTelegramMessage(user.chat_id, notificationText, env);
    
    // Store notification history
    await env.NOTIFICATION_HISTORY.put(
      `notification_${Date.now()}_${userId}`,
      JSON.stringify({
        user_id: userId,
        type: type,
        message: notificationText,
        sent_at: new Date().toISOString()
      }),
      { expirationTtl: 86400 * 30 }
    );
    
    return successResponse({
      message: 'Notification sent successfully'
    });
    
  } catch (error) {
    return errorResponse('Notification failed: ' + error.message, 500);
  }
}

async function broadcastMessage(request, env) {
  try {
    const data = await request.json();
    const { message, targetGroups = ['all'], language } = data;
    
    if (!message) {
      return errorResponse('Message is required', 400);
    }
    
    // Get target users
    let targetUsers = [];
    
    if (targetGroups.includes('all')) {
      const allUsers = await env.DB.prepare(`
        SELECT user_id, telegram_id FROM users 
        WHERE account_status = 'active'
      `).all();
      targetUsers = allUsers.results || [];
    }
    
    let sentCount = 0;
    let errorCount = 0;
    
    // Send to each user
    for (const user of targetUsers) {
      try {
        const userLang = language || await getUserLanguage(user.user_id, env);
        const userData = await getUserData(user.telegram_id, env);
        
        if (userData && userData.chat_id) {
          await sendTelegramMessage(userData.chat_id, message, env);
          sentCount++;
        }
        
        // Rate limiting - don't spam Telegram API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (sendError) {
        console.error(`Broadcast error for user ${user.user_id}:`, sendError);
        errorCount++;
      }
    }
    
    // Log broadcast
    await logUserActivity('system', 'broadcast', {
      message_length: message.length,
      target_count: targetUsers.length,
      sent_count: sentCount,
      error_count: errorCount
    }, env);
    
    return successResponse({
      target_users: targetUsers.length,
      sent_count: sentCount,
      error_count: errorCount,
      message: 'Broadcast completed'
    });
    
  } catch (error) {
    return errorResponse('Broadcast failed: ' + error.message, 500);
  }
}

// Bot Configuration
async function setBotCommands(request, env) {
  try {
    const data = await request.json();
    const { language = 'th' } = data;
    
    const commands = getCommands(language);
    
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: commands,
        language_code: language
      })
    });
    
    const result = await response.json();
    
    return successResponse({
      commands_set: result.ok,
      language: language,
      commands: commands
    });
    
  } catch (error) {
    return errorResponse('Failed to set bot commands: ' + error.message, 500);
  }
}

function getCommands(language) {
  const commands = {
    th: [
      { command: 'start', description: '🚀 เริ่มใช้งาน DOGLC Wallet' },
      { command: 'help', description: '❓ ความช่วยเหลือ' },
      { command: 'balance', description: '💰 ตรวจสอบยอดเงิน' },
      { command: 'send', description: '📤 ส่งเงิน DOGLC' },
      { command: 'receive', description: '📥 รับเงิน DOGLC' },
      { command: 'deposit_thb', description: '🏦 ฝากเงินบาท' },
      { command: 'withdraw_usdt', description: '💸 ถอน USDT' },
      { command: 'history', description: '📊 ประวัติธุรกรรม' },
      { command: 'price', description: '📈 ราคา DOGLC' },
      { command: 'stake', description: '🎯 Stake DOGLC' },
      { command: 'unstake', description: '🎯 Unstake DOGLC' },
      { command: 'settings', description: '⚙️ ตั้งค่า' },
      { command: 'language', description: '🌐 เปลี่ยนภาษา' },
      { command: 'support', description: '🆘 ติดต่อฝ่ายสนับสนุน' }
    ],
    en: [
      { command: 'start', description: '🚀 Start using DOGLC Wallet' },
      { command: 'help', description: '❓ Help' },
      { command: 'balance', description: '💰 Check Balance' },
      { command: 'send', description: '📤 Send DOGLC' },
      { command: 'receive', description: '📥 Receive DOGLC' },
      { command: 'deposit_thb', description: '🏦 Deposit THB' },
      { command: 'withdraw_usdt', description: '💸 Withdraw USDT' },
      { command: 'history', description: '📊 Transaction History' },
      { command: 'price', description: '📈 DOGLC Price' },
      { command: 'stake', description: '🎯 Stake DOGLC' },
      { command: 'unstake', description: '🎯 Unstake DOGLC' },
      { command: 'settings', description: '⚙️ Settings' },
      { command: 'language', description: '🌐 Change Language' },
      { command: 'support', description: '🆘 Contact Support' }
    ]
  };
  
  return commands[language] || commands['th'];
}

async function getBotStatus(env) {
  try {
    // Check bot API connectivity
    const botInfo = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const botData = await botInfo.json();
    
    // Get user statistics
    const userStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN account_status = 'active' THEN 1 END) as active_users
      FROM users
    `).first();
    
    // Get recent activity
    const recentActivity = await getRecentBotActivity(env);
    
    const status = {
      bot_info: botData.ok ? botData.result : null,
      bot_online: botData.ok,
      total_users: userStats?.total_users || 0,
      active_users: userStats?.active_users || 0,
      recent_activity: recentActivity,
      last_check: new Date().toISOString()
    };
    
    return successResponse({
      bot_status: status
    });
    
  } catch (error) {
    return errorResponse('Failed to get bot status: ' + error.message, 500);
  }
}

// Additional Command Handlers
async function handleHelpCommand(chatId, userLang, env) {
  try {
    const helpText = getText('help_text', userLang);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('check_balance', userLang), callback_data: 'balance' },
          { text: getText('send_money', userLang), callback_data: 'send' }
        ],
        [
          { text: getText('deposit_thb', userLang), callback_data: 'deposit_thb' },
          { text: getText('withdraw_usdt', userLang), callback_data: 'withdraw_usdt' }
        ],
        [
          { text: getText('price_info', userLang), callback_data: 'price' },
          { text: getText('settings', userLang), callback_data: 'settings' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, helpText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Help command error:', error);
  }
}

async function handleLanguageCommand(chatId, userId, args, userLang, env) {
  try {
    if (args.length === 0) {
      // Show language selection
      const languageText = getText('select_language', userLang);
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🇹🇭 ไทย', callback_data: 'lang_th' },
            { text: '🇺🇸 English', callback_data: 'lang_en' }
          ]
        ]
      };
      
      await sendTelegramMessage(chatId, languageText, env, { reply_markup: keyboard });
    } else {
      const newLang = args[0];
      await changeUserLanguage(userId, newLang, env);
      await sendTelegramMessage(chatId, getText('language_changed', newLang), env);
    }
    
  } catch (error) {
    console.error('Language command error:', error);
    await sendTelegramMessage(chatId, getText('language_error', userLang), env);
  }
}

async function handleSupportCommand(chatId, userId, userLang, env) {
  try {
    const supportText = getText('support_info', userLang);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('contact_admin', userLang), callback_data: 'contact_admin' },
          { text: getText('faq', userLang), callback_data: 'faq' }
        ],
        [
          { text: getText('report_issue', userLang), callback_data: 'report_issue' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, supportText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Support command error:', error);
  }
}

async function handleAdminCommand(chatId, userId, args, userLang, env) {
  try {
    // Check if user is admin
    const isAdmin = await checkAdminPermissions(userId, env);
    
    if (!isAdmin) {
      await sendTelegramMessage(chatId, getText('access_denied', userLang), env);
      return;
    }
    
    const adminText = getText('admin_panel', userLang);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '👥 จัดการผู้ใช้', callback_data: 'admin_users' },
          { text: '💰 จัดการกระเป๋าเงิน', callback_data: 'admin_wallets' }
        ],
        [
          { text: '📊 สถิติระบบ', callback_data: 'admin_stats' },
          { text: '🔐 ความปลอดภัย', callback_data: 'admin_security' }
        ],
        [
          { text: '💾 สำรองข้อมูล', callback_data: 'admin_backup' },
          { text: '📢 ประกาศ', callback_data: 'admin_broadcast' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, adminText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Admin command error:', error);
  }
}

// Advanced Features
async function handleTextMessage(message, userLang, env) {
  try {
    const text = message.text.toLowerCase();
    const chatId = message.chat.id;
    const userId = message.from.id.toString();
    
    // Natural language processing for common queries
    if (text.includes('balance') || text.includes('ยอด')) {
      await showBalanceInline(chatId, userId, userLang, env);
    } else if (text.includes('price') || text.includes('ราคา')) {
      await showPriceInfo(chatId, userLang, env);
    } else if (text.includes('deposit') || text.includes('ฝาก')) {
      await showDepositThbOptions(chatId, userId, userLang, env);
    } else if (text.includes('withdraw') || text.includes('ถอน')) {
      await showWithdrawUsdtOptions(chatId, userId, userLang, env);
    } else if (text.includes('help') || text.includes('ช่วย')) {
      await handleHelpCommand(chatId, userLang, env);
    } else {
      // Default response with helpful suggestions
      const helpText = getText('text_help', userLang);
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: getText('check_balance', userLang), callback_data: 'balance' },
            { text: getText('send_money', userLang), callback_data: 'send' }
          ],
          [
            { text: getText('deposit_thb', userLang), callback_data: 'deposit_thb' },
            { text: getText('withdraw_usdt', userLang), callback_data: 'withdraw_usdt' }
          ]
        ]
      };
      
      await sendTelegramMessage(chatId, helpText, env, { reply_markup: keyboard });
    }
    
  } catch (error) {
    console.error('Text message handling error:', error);
  }
}

async function showPriceInfo(chatId, userLang, env) {
  try {
    const priceData = await getCurrentDoglcPrice(env);
    
    const priceText = getText('current_price', userLang, {
      price_usd: formatPrice(priceData.doglc_usd, 6),
      change_24h: formatPercentage(priceData.change_24h),
      volume: formatNumber(priceData.volume_24h)
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: getText('refresh_price', userLang), callback_data: 'refresh_price' },
          { text: getText('set_alert', userLang), callback_data: 'price_alert' }
        ]
      ]
    };
    
    await sendTelegramMessage(chatId, priceText, env, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Show price info error:', error);
  }
}

async function showSettingsMenu(chatId, userId, userLang, env, messageId = null) {
	try {
		const user = await getUserData(userId, env);
		if (!user) {
			const errorText = "❌ ไม่พบข้อมูลผู้ใช้ กรุณาเริ่มต้นใหม่ด้วย /start";
			if (messageId) {
				await editTelegramMessage(chatId, messageId, errorText, env);
			} else {
				await sendTelegramMessage(chatId, errorText, env);
			}
			return;
		}

		// Get user preferences
		let preferences = {};
		try {
			const result = await env.DB.prepare(
				"SELECT * FROM user_preferences WHERE user_id = ?"
			).bind(user.user_id).first();
			
			if (result) {
				preferences = JSON.parse(result.preferences || '{}');
			}
		} catch (err) {
			console.log('No preferences found, using defaults');
		}

		const currentLang = preferences.language || 'th';
		const notifications = preferences.notifications !== false ? '🔔' : '🔕';
		const currency = preferences.currency || 'DOGLC';
		
		const settingsText = `⚙️ การตั้งค่า\n\n` +
			`👤 *ข้อมูลบัญชี:*\n` +
			`• ชื่อ: ${user.full_name || user.username || 'ไม่ระบุ'}\n` +
			`• รหัสผู้ใช้: ${user.user_id}\n` +
			`• สร้างเมื่อ: ${new Date(user.created_at).toLocaleDateString('th-TH')}\n\n` +
			`🌐 *ภาษา:* ${currentLang === 'th' ? 'ไทย 🇹🇭' : 'English 🇺🇸'}\n` +
			`${notifications} *การแจ้งเตือน:* ${notifications === '🔔' ? 'เปิด' : 'ปิด'}\n` +
			`💱 *สกุลเงิน:* ${currency}\n\n` +
			`💡 *คำแนะนำ:*\n` +
			`• เลือกตัวเลือกด้านล่างเพื่อแก้ไข\n` +
			`• การตั้งค่าจะบันทึกอัตโนมัติ`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: `🌐 เปลี่ยนภาษา`, callback_data: "settings_language" },
					{ text: `${notifications} แจ้งเตือน`, callback_data: "settings_notifications" }
				],
				[
					{ text: "💱 เปลี่ยนสกุลเงิน", callback_data: "settings_currency" },
					{ text: "🔒 ความปลอดภัย", callback_data: "settings_security" }
				],
				[
					{ text: "📊 ข้อมูลการใช้งาน", callback_data: "settings_usage" },
					{ text: "❓ ความช่วยเหลือ", callback_data: "settings_help" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		if (messageId) {
			await editTelegramMessage(chatId, messageId, settingsText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await sendTelegramMessage(chatId, settingsText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		}
	} catch (err) {
		console.error('showSettings error:', err);
		const errorText = "❌ เกิดข้อผิดพลาดในการโหลดการตั้งค่า";
		if (messageId) {
			await editTelegramMessage(chatId, messageId, errorText, env);
		} else {
			await sendTelegramMessage(chatId, errorText, env);
		}
	}
}

async function handleSettingsCallback(chatId, userId, action, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		switch (action) {
			case 'language':
				await showLanguageSettings(chatId, userId, env, messageId);
				break;
			case 'notifications':
				await toggleNotifications(chatId, userId, env, messageId);
				break;
			case 'currency':
				await showCurrencySettings(chatId, userId, env, messageId);
				break;
			case 'security':
				await showSecuritySettings(chatId, userId, env, messageId);
				break;
			case 'usage':
				await showUsageStats(chatId, userId, env, messageId);
				break;
			case 'help':
				await showHelpInfo(chatId, userId, env, messageId);
				break;
		}
	} catch (err) {
		console.error('handleSettingsCallback error:', err);
	}
}

async function showLanguageSettings(chatId, userId, env, messageId) {
	const text = `🌐 เลือกภาษา\n\n💡 *คำแนะนำ:*\nเลือกภาษาที่คุณต้องการใช้งาน`;
	
	const keyboard = {
		inline_keyboard: [
			[
				{ text: "🇹🇭 ไทย", callback_data: "set_lang_th" },
				{ text: "🇺🇸 English", callback_data: "set_lang_en" }
			],
			[
				{ text: "⬅️ กลับ", callback_data: "settings" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function toggleNotifications(chatId, userId, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		
		// Get current preferences
		let preferences = {};
		try {
			const result = await env.DB.prepare(
				"SELECT * FROM user_preferences WHERE user_id = ?"
			).bind(user.user_id).first();
			
			if (result) {
				preferences = JSON.parse(result.preferences || '{}');
			}
		} catch (err) {
			console.log('No preferences found');
		}

		// Toggle notifications
		preferences.notifications = !preferences.notifications;
		
		// Save preferences
		await saveUserPreferences(user.user_id, preferences, env);
		
		const status = preferences.notifications ? 'เปิด 🔔' : 'ปิด 🔕';
		const text = `${preferences.notifications ? '🔔' : '🔕'} การแจ้งเตือน${status}\n\n✅ บันทึกการตั้งค่าแล้ว`;
		
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "⬅️ กลับ", callback_data: "settings" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, text, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('toggleNotifications error:', err);
	}
}

async function saveUserPreferences(userId, preferences, env) {
	try {
		await env.DB.prepare(`
			INSERT OR REPLACE INTO user_preferences (user_id, preferences, updated_at)
			VALUES (?, ?, datetime('now'))
		`).bind(userId, JSON.stringify(preferences)).run();
	} catch (err) {
		console.error('saveUserPreferences error:', err);
		throw err;
	}
}

async function handleSendCallback(chatId, userId, action, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		switch (action) {
			case 'username':
				await showSendByUsername(chatId, userId, env, messageId);
				break;
			case 'userid':
				await showSendByUserId(chatId, userId, env, messageId);
				break;
			case 'address':
				await showSendByAddress(chatId, userId, env, messageId);
				break;
			case 'phone':
				await showSendByPhone(chatId, userId, env, messageId);
				break;
		}
	} catch (err) {
		console.error('handleSendCallback error:', err);
	}
}

async function showSendByUsername(chatId, userId, env, messageId) {
	const text = `👤 ส่งเงินผ่าน Username\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/send @username จำนวน หมายเหตุ\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/send @john 100 ค่าอาหาร\`\n` +
		`\`/send @mary 50\`\n\n` +
		`💡 *คำแนะนำ:*\n` +
		`• ใส่ @ ข้างหน้า username\n` +
		`• หมายเหตุเป็นตัวเลือก\n` +
		`• ตรวจสอบ username ให้ถูกต้อง`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "📱 ส่งผ่าน User ID", callback_data: "send_userid" },
				{ text: "🔗 ส่งผ่าน Address", callback_data: "send_address" }
			],
			[
				{ text: "⬅️ กลับ", callback_data: "send" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function showSendByUserId(chatId, userId, env, messageId) {
	const text = `📱 ส่งเงินผ่าน User ID\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/send ID จำนวน หมายเหตุ\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/send 123456789 100 ค่าสินค้า\`\n` +
		`\`/send 987654321 250\`\n\n` +
		`💡 *คำแนะนำ:*\n` +
		`• User ID เป็นตัวเลข\n` +
		`• หมายเหตุเป็นตัวเลือก\n` +
		`• ตรวจสอบ ID ให้ถูกต้อง`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "👤 ส่งผ่าน Username", callback_data: "send_username" },
				{ text: "🔗 ส่งผ่าน Address", callback_data: "send_address" }
			],
			[
				{ text: "⬅️ กลับ", callback_data: "send" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function showSendByAddress(chatId, userId, env, messageId) {
	const text = `🔗 ส่งเงินผ่าน Wallet Address\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/send address จำนวน หมายเหตุ\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/send 0x123...abc 100 ค่าบริการ\`\n\n` +
		`💡 *คำแนะนำ:*\n` +
		`• Address ต้องถูกต้องตามรูปแบบ\n` +
		`• ตรวจสอบ address อย่างละเอียด\n` +
		`• หมายเหตุเป็นตัวเลือก`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "👤 ส่งผ่าน Username", callback_data: "send_username" },
				{ text: "📱 ส่งผ่าน User ID", callback_data: "send_userid" }
			],
			[
				{ text: "⬅️ กลับ", callback_data: "send" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function showSendByPhone(chatId, userId, env, messageId) {
	const text = `📞 ส่งเงินผ่าน Phone Number\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/send +66xxxxxxxxx จำนวน หมายเหตุ\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/send +66812345678 100 ค่าขนม\`\n\n` +
		`💡 *คำแนะนำ:*\n` +
		`• ใส่ +66 ข้างหน้าเบอร์โทร\n` +
		`• ตรวจสอบเบอร์ให้ถูกต้อง\n` +
		`• หมายเหตุเป็นตัวเลือก`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "👤 ส่งผ่าน Username", callback_data: "send_username" },
				{ text: "📱 ส่งผ่าน User ID", callback_data: "send_userid" }
			],
			[
				{ text: "⬅️ กลับ", callback_data: "send" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function setUserLanguage(chatId, userId, lang, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		// Get current preferences
		let preferences = {};
		try {
			const result = await env.DB.prepare(
				"SELECT * FROM user_preferences WHERE user_id = ?"
			).bind(user.user_id).first();
			
			if (result) {
				preferences = JSON.parse(result.preferences || '{}');
			}
		} catch (err) {
			console.log('No preferences found');
		}

		// Update language
		preferences.language = lang;
		
		// Save preferences
		await saveUserPreferences(user.user_id, preferences, env);
		
		const langName = lang === 'th' ? 'ไทย 🇹🇭' : 'English 🇺🇸';
		const text = `🌐 เปลี่ยนภาษาเป็น ${langName}\n\n✅ บันทึกการตั้งค่าแล้ว`;
		
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "⬅️ กลับ", callback_data: "settings" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, text, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('setUserLanguage error:', err);
	}
}

async function handleQuickDeposit(chatId, userId, amount, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		const amountNum = parseFloat(amount);
		if (isNaN(amountNum) || amountNum < 100) {
			await editTelegramMessage(chatId, messageId, "❌ จำนวนเงินไม่ถูกต้อง ขั้นต่ำ 100 บาท", env);
			return;
		}

		// Call banking worker to initiate deposit
		const response = await env.BANKING.fetch('https://banking.internal/fiat/deposit/initiate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Internal-API': env.INTERNAL_API_KEY
			},
			body: JSON.stringify({
				userId: user.user_id,
				amount: amountNum,
				currency: 'THB'
			})
		});

		const result = await response.json();
		
		if (result.success) {
			const text = `🏦 ฝากเงิน ${formatNumber(amountNum)} บาท\n\n` +
				`📋 *รายละเอียดการโอน:*\n` +
				`🏪 ธนาคาร: ${result.account.bankName}\n` +
				`🔢 เลขบัญชี: ${result.account.accountNumber}\n` +
				`👤 ชื่อบัญชี: ${result.account.accountName}\n\n` +
				`💰 *จำนวนที่ต้องโอน:* ฿${formatNumber(amountNum)}\n` +
				`🆔 *รหัสการฝาก:* ${result.depositId}\n\n` +
				`⏰ *ระยะเวลา:* 30 นาที\n` +
				`🔄 *สถานะ:* รอการโอนเงิน\n\n` +
				`💡 *คำแนะนำ:*\n` +
				`• โอนเงินตามจำนวนที่ระบุ\n` +
				`• ระบบจะยืนยันอัตโนมัติภายใน 5 นาที\n` +
				`• กดตรวจสอบสถานะเพื่อดูความคืบหน้า`;

			const keyboard = {
				inline_keyboard: [
					[
						{ text: "🔍 ตรวจสอบสถานะ", callback_data: `deposit_status_${result.depositId}` },
						{ text: "📋 คัดลอกเลขบัญชี", callback_data: `copy_account_${result.depositId}` }
					],
					[
						{ text: "🏦 ฝากเงินใหม่", callback_data: "deposit_thb" },
						{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
					]
				]
			};

			await editTelegramMessage(chatId, messageId, text, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await editTelegramMessage(chatId, messageId, `❌ เกิดข้อผิดพลาด: ${result.error}`, env);
		}
	} catch (err) {
		console.error('handleQuickDeposit error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการสร้างรายการฝากเงิน", env);
	}
}

async function handleQuickWithdraw(chatId, userId, amount, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		const amountNum = parseFloat(amount);
		if (isNaN(amountNum) || amountNum < 10) {
			await editTelegramMessage(chatId, messageId, "❌ จำนวนเงินไม่ถูกต้อง ขั้นต่ำ 10 USDT", env);
			return;
		}

		// Check wallet balance
		const wallet = await getUserWallet(user.user_id, env);
		if (!wallet || wallet.available < amountNum) {
			await editTelegramMessage(chatId, messageId, "❌ ยอดเงินไม่เพียงพอ", env);
			return;
		}

		const text = `💎 ถอน ${formatNumber(amountNum)} USDT\n\n` +
			`📝 *กรุณาระบุที่อยู่ USDT Wallet*\n` +
			`• ใช้คำสั่ง: \`/withdraw_usdt ${amountNum} ที่อยู่_wallet\`\n\n` +
			`📋 *ตัวอย่าง:*\n` +
			`\`/withdraw_usdt ${amountNum} TRxxx...abc123\`\n\n` +
			`⚠️ *ข้อควรระวัง:*\n` +
			`• ตรวจสอบที่อยู่ให้ถูกต้อง\n` +
			`• รองรับเฉพาะ USDT TRC20\n` +
			`• ค่าธรรมเนียม 2 USDT\n` +
			`• ไม่สามารถยกเลิกได้หลังส่ง`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "💰 เปลี่ยนจำนวน", callback_data: "custom_withdraw" },
					{ text: "📊 ประวัติการถอน", callback_data: "withdraw_history" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, text, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('handleQuickWithdraw error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการสร้างรายการถอนเงิน", env);
	}
}

async function showCustomDepositInstructions(chatId, userId, env, messageId) {
	const text = `💰 ฝากเงินจำนวนกำหนดเอง\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/deposit_thb จำนวน\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/deposit_thb 1500\` - ฝาก 1,500 บาท\n` +
		`\`/deposit_thb 3000\` - ฝาก 3,000 บาท\n\n` +
		`📏 *ข้อกำหนด:*\n` +
		`• ขั้นต่ำ: 100 บาท\n` +
		`• สูงสุด: 50,000 บาท/วัน\n` +
		`• จำนวนเต็มเท่านั้น`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "🏦 ฝากเงินด่วน", callback_data: "deposit_thb" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function showCustomWithdrawInstructions(chatId, userId, env, messageId) {
	const text = `💎 ถอนเงินจำนวนกำหนดเอง\n\n` +
		`📝 *วิธีการ:*\n` +
		`ใช้คำสั่ง: \`/withdraw_usdt จำนวน ที่อยู่\`\n\n` +
		`📋 *ตัวอย่าง:*\n` +
		`\`/withdraw_usdt 50 TRxxx...abc123\`\n` +
		`\`/withdraw_usdt 100 TRyyy...def456\`\n\n` +
		`📏 *ข้อกำหนด:*\n` +
		`• ขั้นต่ำ: 10 USDT\n` +
		`• สูงสุด: 10,000 USDT/วัน\n` +
		`• ค่าธรรมเนียม: 2 USDT/รายการ\n` +
		`• รองรับเฉพาะ USDT TRC20`;

	const keyboard = {
		inline_keyboard: [
			[
				{ text: "💎 ถอนเงินด่วน", callback_data: "withdraw_usdt" },
				{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
			]
		]
	};

	await editTelegramMessage(chatId, messageId, text, env, { 
		parse_mode: 'Markdown',
		reply_markup: keyboard 
	});
}

async function handleWithdrawAll(chatId, userId, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		// Get wallet balance
		const wallet = await getUserWallet(user.user_id, env);
		if (!wallet || wallet.available <= 2) {
			await editTelegramMessage(chatId, messageId, "❌ ยอดเงินไม่เพียงพอ (ต้องมีอย่างน้อย 2 USDT สำหรับค่าธรรมเนียม)", env);
			return;
		}

		const withdrawAmount = wallet.available - 2; // หักค่าธรรมเนียม
		
		const text = `💎 ถอนทั้งหมด ${formatNumber(withdrawAmount)} USDT\n\n` +
			`💰 *ยอดเงินปัจจุบัน:* ${formatNumber(wallet.available)} USDT\n` +
			`💸 *จำนวนถอน:* ${formatNumber(withdrawAmount)} USDT\n` +
			`🔸 *ค่าธรรมเนียม:* 2 USDT\n\n` +
			`📝 *กรุณาระบุที่อยู่ USDT Wallet*\n` +
			`ใช้คำสั่ง: \`/withdraw_usdt ${withdrawAmount} ที่อยู่_wallet\`\n\n` +
			`⚠️ *คำเตือน:*\n` +
			`• จะถอนเงินทั้งหมดในบัญชี\n` +
			`• ตรวจสอบที่อยู่ให้ถูกต้อง\n` +
			`• ไม่สามารถยกเลิกได้หลังส่ง`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "💰 ถอนจำนวนอื่น", callback_data: "custom_withdraw" },
					{ text: "🔍 ตรวจสอบยอดเงิน", callback_data: "balance" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, text, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('handleWithdrawAll error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการคำนวณจำนวนถอน", env);
	}
}

async function showDepositHistory(chatId, userId, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		// Get deposit transactions
		const result = await env.DB.prepare(`
			SELECT amount, status, created_at, updated_at 
			FROM transactions 
			WHERE user_id = ? AND type = 'deposit' 
			ORDER BY created_at DESC 
			LIMIT 10
		`).bind(user.user_id).all();

		let historyText = `📊 ประวัติการฝากเงิน\n\n`;
		
		if (result.results.length === 0) {
			historyText += `ไม่พบประวัติการฝากเงิน\n\n💡 เริ่มฝากเงินครั้งแรกได้เลย!`;
		} else {
			result.results.forEach((tx, index) => {
				const date = new Date(tx.created_at).toLocaleDateString('th-TH');
				const status = tx.status === 'completed' ? '✅ สำเร็จ' : 
							tx.status === 'pending' ? '⏳ รอดำเนินการ' : '❌ ล้มเหลว';
				historyText += `${index + 1}. ฿${formatNumber(tx.amount)}\n` +
							 `   ${status} | ${date}\n\n`;
			});
		}

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "🏦 ฝากเงินใหม่", callback_data: "deposit_thb" },
					{ text: "📊 ดูยอดเงิน", callback_data: "balance" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, historyText, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('showDepositHistory error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการโหลดประวัติ", env);
	}
}

async function showWithdrawHistory(chatId, userId, env, messageId) {
	try {
		const user = await getUserData(userId, env);
		if (!user) return;

		// Get withdraw transactions
		const result = await env.DB.prepare(`
			SELECT amount, status, created_at, updated_at, details
			FROM transactions 
			WHERE user_id = ? AND type = 'withdraw' 
			ORDER BY created_at DESC 
			LIMIT 10
		`).bind(user.user_id).all();

		let historyText = `📊 ประวัติการถอนเงิน\n\n`;
		
		if (result.results.length === 0) {
			historyText += `ไม่พบประวัติการถอนเงิน\n\n💡 เริ่มถอนเงินได้เมื่อมียอดเงินพอ!`;
		} else {
			result.results.forEach((tx, index) => {
				const date = new Date(tx.created_at).toLocaleDateString('th-TH');
				const status = tx.status === 'completed' ? '✅ สำเร็จ' : 
							tx.status === 'pending' ? '⏳ รอดำเนินการ' : '❌ ล้มเหลว';
				historyText += `${index + 1}. ${formatNumber(tx.amount)} USDT\n` +
							 `   ${status} | ${date}\n\n`;
			});
		}

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "💎 ถอนเงินใหม่", callback_data: "withdraw_usdt" },
					{ text: "📊 ดูยอดเงิน", callback_data: "balance" }
				],
				[
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, historyText, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('showWithdrawHistory error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการโหลดประวัติ", env);
	}
}

async function showExchangeRates(chatId, userId, env, messageId) {
	try {
		const text = `💱 อัตราแลกเปลี่ยนปัจจุบัน\n\n` +
			`🏦 *การฝากเงิน*\n` +
			`THB → DOGLC: 1:1\n` +
			`(ไม่มีค่าธรรมเนียม)\n\n` +
			`💎 *การถอนเงิน*\n` +
			`DOGLC → USDT: 1:1\n` +
			`ค่าธรรมเนียม: 2 USDT/รายการ\n\n` +
			`📈 *ข้อมูลเพิ่มเติม*\n` +
			`• อัตราคงที่ 24/7\n` +
			`• ไม่มีค่าธรรมเนียมซ่อน\n` +
			`• ประมวลผลรวดเร็ว\n\n` +
			`🕐 *อัปเดตล่าสุด:* ${new Date().toLocaleString('th-TH')}`;

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "🏦 ฝากเงิน", callback_data: "deposit_thb" },
					{ text: "💎 ถอนเงิน", callback_data: "withdraw_usdt" }
				],
				[
					{ text: "📊 ดูยอดเงิน", callback_data: "balance" },
					{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
				]
			]
		};

		await editTelegramMessage(chatId, messageId, text, env, { 
			parse_mode: 'Markdown',
			reply_markup: keyboard 
		});
	} catch (err) {
		console.error('showExchangeRates error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการโหลดอัตราแลกเปลี่ยน", env);
	}
}

async function handleCopyAccount(chatId, userId, depositId, env, messageId) {
	try {
		// Get deposit info from banking worker
		const response = await env.BANKING.fetch(`https://banking.internal/fiat/deposit/status/${depositId}`, {
			method: 'GET',
			headers: {
				'X-Internal-API': env.INTERNAL_API_KEY
			}
		});

		const result = await response.json();
		
		if (result.success && result.account) {
			const copyText = `📋 *คัดลอกข้อมูลบัญชี*\n\n` +
				`🏪 ธนาคาร: ${result.account.bankName}\n` +
				`🔢 เลขบัญชี: \`${result.account.accountNumber}\`\n` +
				`👤 ชื่อบัญชี: ${result.account.accountName}\n\n` +
				`💰 จำนวนโอน: ฿${formatNumber(result.amount)}\n` +
				`🆔 รหัสการฝาก: ${depositId}\n\n` +
				`💡 *กดเลือกเลขบัญชีเพื่อคัดลอก*`;

			const keyboard = {
				inline_keyboard: [
					[
						{ text: "🔍 ตรวจสอบสถานะ", callback_data: `deposit_status_${depositId}` },
						{ text: "🏦 ฝากเงินใหม่", callback_data: "deposit_thb" }
					],
					[
						{ text: "🏠 เมนูหลัก", callback_data: "main_menu" }
					]
				]
			};

			await editTelegramMessage(chatId, messageId, copyText, env, { 
				parse_mode: 'Markdown',
				reply_markup: keyboard 
			});
		} else {
			await editTelegramMessage(chatId, messageId, "❌ ไม่พบข้อมูลการฝากเงิน", env);
		}
	} catch (err) {
		console.error('handleCopyAccount error:', err);
		await editTelegramMessage(chatId, messageId, "❌ เกิดข้อผิดพลาดในการดึงข้อมูลบัญชี", env);
	}
}

// User Management Helper Functions
/**
 * Checks if a user has admin permissions.
 *
 * @param {string} userId - The Telegram user ID to check.
 * @param {Object} env - Environment object containing bindings.
 * @returns {Promise<boolean>} - Resolves to true if user is admin, false otherwise.
 *
 * Expected format for 'admin_telegram_ids' in SYSTEM_CONFIGURATION:
 *   A JSON stringified array of Telegram user IDs, e.g. '["123456789", "987654321"]'
 */
async function checkAdminPermissions(userId, env) {
  try {
    const adminIds = await env.SYSTEM_CONFIGURATION.get('admin_telegram_ids');
    
    if (adminIds) {
      const admins = JSON.parse(adminIds);
      return admins.includes(userId);
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

async function logUserActivity(userId, action, data, env) {
  try {
    const activityData = {
      user_id: userId,
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      ip: 'telegram'
    };
    
    // Use NOTIFICATION_HISTORY as fallback for user activity logging
    await env.NOTIFICATION_HISTORY.put(
      `user_activity_${Date.now()}_${userId}`,
      JSON.stringify(activityData),
      { expirationTtl: 86400 * 30 }
    );
  } catch (error) {
    console.error('User activity logging error:', error);
  }
}

async function getRecentBotActivity(env) {
  try {
    const activity = await env.ENHANCED_AUDIT_LOGS.list({
      prefix: 'user_activity_',
      limit: 100
    });
    
    const activityCount = {
      last_hour: 0,
      last_24h: 0,
      total_commands: 0
    };
    
    const cutoffHour = Date.now() - (60 * 60 * 1000);
    const cutoff24h = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const key of activity.keys) {
      const activityData = await env.ENHANCED_AUDIT_LOGS.get(key.name);
      if (activityData) {
        const activity = JSON.parse(activityData);
        const activityTime = new Date(activity.timestamp).getTime();
        
        if (activityTime > cutoffHour) {
          activityCount.last_hour++;
        }
        
        
        if (activityTime > cutoff24h) {
          activityCount.last_24h++;
        }
        
        activityCount.total_commands++;
      }
    }
    
    return activityCount;
  } catch (error) {
    return { last_hour: 0, last_24h: 0, total_commands: 0 };
  }
}

// Advanced Callback Handlers
async function changeLanguage(chatId, userId, callbackData, env) {
  try {
    const newLang = callbackData.replace('lang_', '');
    
    await changeUserLanguage(userId, newLang, env);
    
    const confirmText = getText('language_changed', newLang);
    await sendTelegramMessage(chatId, confirmText, env);
    
    // Show updated main menu
    await handleStartCommand(chatId, userId, newLang, env);
    
  } catch (error) {
    console.error('Language change error:', error);
  }
}

async function processConfirmedStake(chatId, userId, callbackData, userLang, env) {
  try {
    const parts = callbackData.replace('confirm_stake_', '').split('_');
    const amount = parseFloat(parts[0]);
    const duration = parseInt(parts[1]);
    
    // Process staking through banking worker
    const response = await env.BANKING.fetch(new Request('https://banking-worker/staking/stake', {
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
    }));
    
    const result = await response.json();
    
    if (result.success) {
      const successText = getText('stake_success', userLang, {
        amount: formatNumber(amount),
        duration: duration,
        staking_id: result.staking.id
      });
      
      await sendTelegramMessage(chatId, successText, env);
    } else {
      await sendTelegramMessage(chatId, getText('stake_failed', userLang) + ': ' + result.error, env);
    }
    
  } catch (error) {
    console.error('Confirmed stake error:', error);
    await sendTelegramMessage(chatId, getText('stake_error', userLang), env);
  }
}

// Helper Functions

// Telegram API Functions
async function sendTelegramMessage(chatId, text, env, options = {}) {
  try {
    console.log(`Sending message to chat ${chatId}: ${text.substring(0, 100)}...`);
    console.log('Options received:', JSON.stringify(options, null, 2));
    
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      ...options
    };

    console.log('Full Telegram API payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`Telegram API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error response:', errorData);
      throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Telegram API success:', result.ok);
    console.log('Message sent with ID:', result.result?.message_id);
    return result;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    throw error;
  }
}

async function editTelegramMessage(chatId, messageId, text, env, options = {}) {
  try {
    const payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
      ...options
    };

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to edit Telegram message:', error);
    throw error;
  }
}

async function answerCallbackQuery(callbackQueryId, env, text = null, showAlert = false) {
  try {
    const payload = {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    };

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('answerCallbackQuery error:', errorData);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to answer callback query:', error);
    throw error;
  }
}

// Webhook Setup Function
async function setupWebhook(request, env) {
  try {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = 'https://teenoi96.org/webhook/telegram';
    
    // Set webhook
    const setWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      })
    });
    
    const setResult = await setWebhookResponse.json();
    
    // Get webhook info to verify
    const getWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const getResult = await getWebhookResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      setWebhook: setResult,
      webhookInfo: getResult
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function successResponse(data) {
  return new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}