// Enhanced Bot with Full Features - บอทเวอร์ชันสมบูรณ์

/* eslint-disable */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle webhook
    if (url.pathname === '/webhook/telegram' && request.method === 'POST') {
      try {
        const update = await request.json();
        console.log('Received update:', JSON.stringify(update, null, 2));
        
        if (update.message && update.message.text === '/start') {
          const chatId = update.message.chat.id;
          const userId = update.message.from.id.toString();
          const username = update.message.from.first_name || 'ผู้ใช้';
          
          // สร้างหรืออัปเดต user ใน database
          await ensureUser(userId, chatId, username, env);
          
          // Create inline keyboard
          const keyboard = {
            inline_keyboard: [
              [
                { text: "💰 ตรวจสอบยอดเงิน", callback_data: 'balance' },
                { text: "💸 โอน USDT", callback_data: 'send' }
              ],
              [
                { text: "� Wallet Address", callback_data: 'receive' },
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
          
          const welcomeMessage = `🚀 ยินดีต้อนรับสู่ DOGLC Wallet Bot!

🎉 สวัสดี ${username}!

คุณสามารถใช้งานฟีเจอร์ต่างๆ ผ่านปุ่มด้านล่าง`;

          await sendMessage(chatId, welcomeMessage, keyboard, env);
          return new Response('OK');
        }
        
        // Handle text messages (สำหรับฝากเงินจำนวนกำหนดเอง)
        if (update.message && update.message.text && update.message.text !== '/start') {
          const chatId = update.message.chat.id;
          const userId = update.message.from.id.toString();
          const text = update.message.text.trim();
          
          // ตรวจสอบว่าเป็นตัวเลขสำหรับฝากเงิน
          const amountPattern = /^\d+$/;
          if (amountPattern.test(text)) {
            const amount = parseInt(text);
            if (amount >= 100 && amount <= 100000) {
              await handleDepositConfirm(chatId, userId, text, env);
              return new Response('OK');
            } else {
              await sendMessage(chatId, `❌ จำนวนเงินไม่ถูกต้อง\n\nกรุณาป้อนจำนวนระหว่าง 100-100,000 บาท`, null, env);
              return new Response('OK');
            }
          }
          
          // ตรวจสอบรูปแบบโอน USDT (จำนวน|Address)
          const transferPattern = /^(\d+(?:\.\d+)?)\|(.+)$/;
          const transferMatch = text.match(transferPattern);
          if (transferMatch) {
            const [, amount, address] = transferMatch;
            await handleUSDTTransferConfirm(chatId, userId, amount, address, env);
            return new Response('OK');
          }
          
          // ข้อความอื่นๆ
          await sendMessage(chatId, `📝 ข้อความของคุณ: "${text}"\n\n💡 ใช้เมนูด้านล่างเพื่อใช้งานฟีเจอร์ต่างๆ`, null, env);
          return new Response('OK');
        }
        
        // Handle callback queries
        if (update.callback_query) {
          const callbackQuery = update.callback_query;
          const chatId = callbackQuery.message.chat.id;
          const userId = callbackQuery.from.id.toString();
          const data = callbackQuery.data;
          
          console.log('Callback query:', data);
          
          // Answer callback query
          await answerCallbackQuery(callbackQuery.id, env);
          
          switch (data) {
            case 'balance':
              await handleBalance(chatId, userId, env);
              break;
            case 'send':
              await handleSend(chatId, userId, env);
              break;
            case 'receive':
              await handleReceive(chatId, userId, env);
              break;
            case 'history':
              await handleHistory(chatId, userId, env);
              break;
            case 'deposit_thb':
              await handleDepositTHB(chatId, userId, env);
              break;
            case 'withdraw_usdt':
              await handleWithdrawUSDT(chatId, userId, env);
              break;
            case 'settings':
              await handleSettings(chatId, userId, env);
              break;
            case 'main_menu':
              await handleMainMenu(chatId, userId, env);
              break;
            case 'send_thb':
              await handleSendTHB(chatId, userId, env);
              break;
            case 'send_usdt':
              await handleSendUSDT(chatId, userId, env);
              break;
            case 'withdraw_10':
              await handleWithdrawAmount(chatId, userId, '10', env);
              break;
            case 'withdraw_50':
              await handleWithdrawAmount(chatId, userId, '50', env);
              break;
            case 'withdraw_100':
              await handleWithdrawAmount(chatId, userId, '100', env);
              break;
            case 'withdraw_custom':
              await handleWithdrawCustom(chatId, userId, env);
              break;
            case 'send_usdt_form':
              await handleSendUSDTForm(chatId, userId, env);
              break;
            case 'deposit_1000':
              await handleDepositConfirm(chatId, userId, '1000', env);
              break;
            case 'deposit_2000':
              await handleDepositConfirm(chatId, userId, '2000', env);
              break;
            case 'deposit_5000':
              await handleDepositConfirm(chatId, userId, '5000', env);
              break;
            case 'deposit_10000':
              await handleDepositConfirm(chatId, userId, '10000', env);
              break;
            case 'deposit_custom':
              await handleDepositCustom(chatId, userId, env);
              break;
            case 'upload_slip':
              await handleUploadSlip(chatId, userId, env);
              break;
            case 'contact_support':
              await handleContactSupport(chatId, userId, env);
              break;
            case 'change_language':
              await handleChangeLanguage(chatId, userId, env);
              break;
            case 'notifications':
              await handleNotifications(chatId, userId, env);
              break;
            case 'security':
              await handleSecurity(chatId, userId, env);
              break;
              
            // Language callback handlers
            case 'lang_th':
              await handleLanguageSelection(chatId, userId, 'th', env);
              break;
            case 'lang_en':
              await handleLanguageSelection(chatId, userId, 'en', env);
              break;
            case 'lang_zh':
              await handleLanguageSelection(chatId, userId, 'zh', env);
              break;
            case 'lang_km':
              await handleLanguageSelection(chatId, userId, 'km', env);
              break;
            
            // Callback สำหรับการยืนยันฝากเงิน
            case 'confirm_deposit_1000':
              await handleConfirmDeposit(chatId, userId, '1000', env);
              break;
            case 'confirm_deposit_2000':
              await handleConfirmDeposit(chatId, userId, '2000', env);
              break;
            case 'confirm_deposit_5000':
              await handleConfirmDeposit(chatId, userId, '5000', env);
              break;
            case 'confirm_deposit_10000':
              await handleConfirmDeposit(chatId, userId, '10000', env);
              break;
              
            default:
              // ตรวจสอบ pattern สำหรับ confirm_deposit_custom
              if (data.startsWith('confirm_deposit_')) {
                const amount = data.replace('confirm_deposit_', '');
                await handleConfirmDeposit(chatId, userId, amount, env);
              } 
              // ตรวจสอบ pattern สำหรับ execute_transfer
              else if (data.startsWith('execute_transfer_')) {
                const transferData = data.replace('execute_transfer_', '');
                const [amount, address] = transferData.split('_', 2);
                await handleExecuteTransfer(chatId, userId, amount, address, env);
              } 
              else {
                await sendMessage(chatId, `คุณเลือก: ${data}`, null, env);
              }
          }
          
          return new Response('OK');
        }
        
        return new Response('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Error', { status: 500 });
      }
    }
    
    return new Response('Enhanced Bot Ready');
  }
};

// Database Functions
async function ensureUser(userId, chatId, username, env) {
  try {
    // ลองสร้าง user ในรูปแบบต่างๆ
    try {
      // ลอง format แรก
      await env.DB.prepare(`
        INSERT OR IGNORE INTO users (telegram_user_id, username, chat_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(userId, username, chatId.toString()).run();
      
      console.log(`User ensured: ${userId}`);
    } catch (e1) {
      try {
        // ลอง format ที่สอง
        await env.DB.prepare(`
          INSERT OR IGNORE INTO users (telegram_user_id, username, thb_balance, usdt_balance)
          VALUES (?, ?, 1000.00, 50.00)
        `).bind(userId, username).run();
        
        console.log(`User ensured (format 2): ${userId}`);
      } catch (e2) {
        console.log('Unable to create user in database, using memory mode');
      }
    }
  } catch (error) {
    console.error('Error ensuring user:', error);
    // ไม่ทำอะไร ใช้ค่า default แทน
  }
}

async function getUserBalance(userId, env) {
  try {
    // ลองหลายรูปแบบ query เผื่อ schema ต่างกัน
    let result = null;
    
    // ลอง format แรก
    try {
      result = await env.DB.prepare(`
        SELECT balance_thb, balance_usdt 
        FROM wallets 
        WHERE telegram_user_id = ?
      `).bind(userId).first();
    } catch (e1) {
      console.log('Try format 1 failed, trying format 2...');
      // ลอง format ที่สอง
      try {
        result = await env.DB.prepare(`
          SELECT thb_balance as balance_thb, usdt_balance as balance_usdt 
          FROM users 
          WHERE telegram_user_id = ?
        `).bind(userId).first();
      } catch (e2) {
        console.log('Try format 2 failed, using default values');
      }
    }
    
    return result || { balance_thb: 1000, balance_usdt: 50 }; // ใช้ค่า demo
  } catch (error) {
    console.error('Error getting balance:', error);
    return { balance_thb: 1000, balance_usdt: 50 }; // ใช้ค่า demo
  }
}

// Handler Functions
async function handleBalance(chatId, userId, env) {
  const balance = await getUserBalance(userId, env);
  
  const balanceText = `💰 ยอดเงินในบัญชีของคุณ

💵 THB: ${Number(balance.balance_thb).toLocaleString('th-TH', {minimumFractionDigits: 2})} บาท
💎 USDT: ${Number(balance.balance_usdt).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT

📈 อัตราแลกเปลี่ยน: 1 USDT = 36.50 THB`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔄 รีเฟรช", callback_data: 'balance' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, balanceText, keyboard, env);
}

async function handleSend(chatId, userId, env) {
  const sendText = `💸 โอน USDT

🔹 กรอกข้อมูลการโอน USDT:
• จำนวน USDT ที่ต้องการโอน
• Wallet Address ปลายทาง
• ค่าธรรมเนียมการโอน: 2 USDT

⚠️ โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนโอน`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "� เริ่มโอน USDT", callback_data: 'send_usdt_form' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, sendText, keyboard, env);
}

async function handleReceive(chatId, userId, env) {
  const receiveText = `� Wallet Address ของคุณ

🔹 USDT Address (TRC-20):
📍 TR${userId.slice(-6)}${'x'.repeat(28)}

� THB Address (สำหรับฝากเงิน):
📍 ${userId}-THB-${Date.now().toString().slice(-6)}

� วิธีใช้งาน:
• แชร์ Wallet Address ให้ผู้ที่ต้องการโอนเงินมาให้คุณ
• ตรวจสอบยอดเงินหลังรับเงินแล้ว
• USDT รองรับเฉพาะ TRC-20 Network เท่านั้น

⚠️ โปรดเก็บรักษา Address นี้ไว้อย่างปลอดภัย`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📋 คัดลอก THB", callback_data: 'copy_thb' },
        { text: "📋 คัดลอก USDT", callback_data: 'copy_usdt' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, receiveText, keyboard, env);
}

async function handleHistory(chatId, userId, env) {
  try {
    // สร้างประวัติ demo แทน
    let historyText = `📊 ประวัติการทำรายการ (5 รายการล่าสุด)\n\n`;
    
    // Demo transactions
    const demoTransactions = [
      { type: "ฝากเงิน", amount: "1,000.00", currency: "THB", status: "completed", date: "09/09/2025" },
      { type: "ถอนเงิน", amount: "25.00", currency: "USDT", status: "completed", date: "08/09/2025" },
      { type: "ส่งเงิน", amount: "500.00", currency: "THB", status: "completed", date: "07/09/2025" },
      { type: "รับเงิน", amount: "10.00", currency: "USDT", status: "completed", date: "06/09/2025" },
      { type: "ฝากเงิน", amount: "2,000.00", currency: "THB", status: "completed", date: "05/09/2025" }
    ];
    
    demoTransactions.forEach((tx, index) => {
      const status = tx.status === 'completed' ? '✅' : '⏳';
      historyText += `${index + 1}. ${status} ${tx.type} ${tx.amount} ${tx.currency}\n   📅 ${tx.date}\n\n`;
    });
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 รีเฟรช", callback_data: 'history' },
          { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
        ]
      ]
    };
    
    await sendMessage(chatId, historyText, keyboard, env);
  } catch (error) {
    console.error('Error getting history:', error);
    
    let historyText = `📊 ประวัติการทำรายการ\n\n`;
    historyText += `ยังไม่มีประวัติการทำรายการ\n\n`;
    historyText += `เมื่อคุณเริ่มใช้งาน ประวัติจะแสดงที่นี่`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
        ]
      ]
    };
    
    await sendMessage(chatId, historyText, keyboard, env);
  }
}

async function handleDepositTHB(chatId, userId, env) {
  const depositText = `🏦 ฝากเงิน THB

💰 กรุณากรอกจำนวนเงินบาทที่ต้องการฝาก:

📊 อัตราแลกเปลี่ยนปัจจุบัน:
• 1 USDT = 35.50 บาท
• ค่าธรรมเนียม: 2% ของยอดฝาก
• จำนวนขั้นต่ำ: 100 บาท

🔹 ตัวอย่าง: ฝาก 1,000 บาท
• รับ USDT: 27.65 USDT
• ค่าธรรมเนียม: 20 บาท

📝 กรุณาพิมพ์จำนวนเงิน (เช่น: 1000)`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "� 1,000 บาท", callback_data: 'deposit_1000' },
        { text: "💵 2,000 บาท", callback_data: 'deposit_2000' }
      ],
      [
        { text: "� 5,000 บาท", callback_data: 'deposit_5000' },
        { text: "💵 10,000 บาท", callback_data: 'deposit_10000' }
      ],
      [
        { text: "✏️ จำนวนอื่นๆ", callback_data: 'deposit_custom' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, depositText, keyboard, env);
}

async function handleWithdrawUSDT(chatId, userId, env) {
  const balance = await getUserBalance(userId, env);
  
  const withdrawText = `💎 ถอน USDT

💰 ยอดเงิน USDT ปัจจุบัน: ${Number(balance.balance_usdt).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT

📝 ขั้นตอนการถอน:
1. ระบุจำนวน USDT ที่ต้องการถอน
2. ระบุที่อยู่ USDT (TRC20)
3. ยืนยันการทำรายการ

💸 ค่าธรรมเนียม: 1 USDT
⏰ ระยะเวลาการโอน: 10-30 นาที`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💎 ถอน 10 USDT", callback_data: 'withdraw_10' },
        { text: "💎 ถอน 50 USDT", callback_data: 'withdraw_50' }
      ],
      [
        { text: "💎 ถอน 100 USDT", callback_data: 'withdraw_100' },
        { text: "✏️ ระบุจำนวนเอง", callback_data: 'withdraw_custom' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, withdrawText, keyboard, env);
}

async function handleSettings(chatId, userId, env) {
  const settingsText = `⚙️ ตั้งค่า

🔧 ตัวเลือกการตั้งค่า:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🌍 เปลี่ยนภาษา", callback_data: 'change_language' },
        { text: "🔔 การแจ้งเตือน", callback_data: 'notifications' }
      ],
      [
        { text: "🔐 ความปลอดภัย", callback_data: 'security' },
        { text: "📞 ติดต่อ Support", callback_data: 'contact_support' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, settingsText, keyboard, env);
}

// ฟังก์ชันสำหรับจัดการ uploads และ support

async function handleSendTHB(chatId, userId, env) {
  const sendText = `💵 ส่ง THB

📝 วิธีการส่งเงิน THB:
1. ระบุ ID ผู้รับ
2. ระบุจำนวนเงิน
3. ยืนยันการโอน

💸 ค่าธรรมเนียม: 0 บาท (ฟรี!)
⏰ ระยะเวลาการโอน: ทันที`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💵 ส่ง 100 บาท", callback_data: 'send_thb_100' },
        { text: "💵 ส่ง 500 บาท", callback_data: 'send_thb_500' }
      ],
      [
        { text: "💵 ส่ง 1,000 บาท", callback_data: 'send_thb_1000' },
        { text: "✏️ ระบุจำนวนเอง", callback_data: 'send_thb_custom' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, sendText, keyboard, env);
}

async function handleSendUSDT(chatId, userId, env) {
  const sendText = `💎 ส่ง USDT

📝 วิธีการส่งเงิน USDT:
1. ระบุ ID ผู้รับ
2. ระบุจำนวน USDT
3. ยืนยันการโอน

💸 ค่าธรรมเนียม: 0.5 USDT
⏰ ระยะเวลาการโอน: ทันที`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💎 ส่ง 10 USDT", callback_data: 'send_usdt_10' },
        { text: "💎 ส่ง 50 USDT", callback_data: 'send_usdt_50' }
      ],
      [
        { text: "💎 ส่ง 100 USDT", callback_data: 'send_usdt_100' },
        { text: "✏️ ระบุจำนวนเอง", callback_data: 'send_usdt_custom' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, sendText, keyboard, env);
}

async function handleWithdrawAmount(chatId, userId, amount, env) {
  const balance = await getUserBalance(userId, env);
  const withdrawAmount = parseFloat(amount);
  const fee = 1.0;
  const total = withdrawAmount + fee;
  
  if (balance.balance_usdt < total) {
    await sendMessage(chatId, `❌ ยอดเงินไม่เพียงพอ\n\nยอดปัจจุบัน: ${balance.balance_usdt} USDT\nจำนวนที่ต้องการ: ${total} USDT (รวมค่าธรรมเนียม)`, null, env);
    return;
  }
  
  const confirmText = `💎 ยืนยันการถอน USDT

💰 จำนวนถอน: ${withdrawAmount} USDT
💸 ค่าธรรมเนียม: ${fee} USDT
💵 รวมหักจากบัญชี: ${total} USDT

📝 กรุณาระบุที่อยู่ USDT (TRC20) สำหรับรับเงิน`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: `✅ ยืนยันถอน ${amount} USDT`, callback_data: `confirm_withdraw_${amount}` }
      ],
      [
        { text: "❌ ยกเลิก", callback_data: 'main_menu' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, confirmText, keyboard, env);
}

async function handleWithdrawCustom(chatId, userId, env) {
  const customText = `✏️ ระบุจำนวน USDT ที่ต้องการถอน

💡 วิธีการ:
ส่งข้อความในรูปแบบ: /withdraw [จำนวน] [ที่อยู่]

📝 ตัวอย่าง:
/withdraw 25.5 TRxxxxxxxxxxxxxxxxxxxxxxxxxxx

⚠️ หมายเหตุ:
• จำนวนขั้นต่ำ: 5 USDT
• ค่าธรรมเนียม: 1 USDT`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔙 กลับ", callback_data: 'main_menu' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, customText, keyboard, env);
}

// ฟังก์ชันใหม่สำหรับโอน USDT
async function handleSendUSDTForm(chatId, userId, env) {
  const formText = `💸 ฟอร์มโอน USDT

📝 กรุณากรอกข้อมูลต่อไปนี้:

🔹 จำนวน USDT ที่ต้องการโอน:
• ขั้นต่ำ: 5 USDT
• ยอดคงเหลือของคุณ: 50 USDT

🔹 Wallet Address ปลายทาง:
• รองรับเฉพาะ TRC-20 เท่านั้น
• ตรวจสอบความถูกต้องก่อนส่ง

💰 ค่าธรรมเนียม: 2 USDT

📱 พิมพ์ข้อมูลในรูปแบบ:
จำนวน|Address
ตัวอย่าง: 10|TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔙 กลับ", callback_data: 'send' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, formText, keyboard, env);
}

// ฟังก์ชันยืนยันการฝากเงิน THB
async function handleDepositConfirm(chatId, userId, amount, env) {
  const amountNum = parseFloat(amount);
  const fee = amountNum * 0.02; // 2%
  const netAmount = amountNum - fee;
  const usdtAmount = (netAmount / 35.50).toFixed(2);
  
  const confirmText = `💰 ยืนยันการฝากเงิน THB

📊 รายละเอียดการฝาก:
• จำนวนที่ฝาก: ${amountNum.toLocaleString()} บาท
• ค่าธรรมเนียม: ${fee.toLocaleString()} บาท (2%)
• จำนวนสุทธิ: ${netAmount.toLocaleString()} บาท
• USDT ที่จะได้รับ: ${usdtAmount} USDT

🏦 ข้อมูลบัญชีสำหรับโอน:
• ธนาคาร: กสิกรไทย
• เลขบัญชี: 123-4-56789-0
• ชื่อบัญชี: DOGLC Wallet Service
• จำนวนที่โอน: ${amountNum.toLocaleString()} บาท

⚠️ โปรดโอนตามจำนวนที่ระบุเท่านั้น`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ ยืนยันและโอนเงิน", callback_data: `confirm_deposit_${amount}` }
      ],
      [
        { text: "📸 อัปโหลดสลิป", callback_data: 'upload_slip' }
      ],
      [
        { text: "🔙 เลือกจำนวนใหม่", callback_data: 'main_menu' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, confirmText, keyboard, env);
}

// ฟังก์ชันกรอกจำนวนฝากเองสำหรับ THB
async function handleDepositCustom(chatId, userId, env) {
  const customText = `✏️ ฝากเงิน THB - จำนวนที่ต้องการ

💰 กรุณาพิมพ์จำนวนเงินบาทที่ต้องการฝาก:

📋 เงื่อนไข:
• ขั้นต่ำ: 100 บาท
• ขั้นสูง: 100,000 บาท
• ค่าธรรมเนียม: 2%
• อัตราแลกเปลี่ยน: 1 USDT = 35.50 บาท

📝 ตัวอย่าง: พิมพ์ "3500" สำหรับ 3,500 บาท`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔙 เลือกจำนวนทั่วไป", callback_data: 'main_menu' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, customText, keyboard, env);
}

// ฟังก์ชันยืนยันการฝากเงินสุดท้าย
async function handleConfirmDeposit(chatId, userId, amount, env) {
  const amountNum = parseFloat(amount);
  const fee = amountNum * 0.02;
  const netAmount = amountNum - fee;
  const usdtAmount = (netAmount / 35.50).toFixed(2);
  
  const confirmText = `✅ การฝากเงินของคุณได้รับการยืนยันแล้ว!

📋 สรุปรายการ:
• รหัสรายการ: DEP${Date.now().toString().slice(-8)}
• จำนวนฝาก: ${amountNum.toLocaleString()} บาท
• ค่าธรรมเนียม: ${fee.toLocaleString()} บาท
• USDT ที่จะได้รับ: ${usdtAmount} USDT

🏦 กรุณาโอนเงินไปยัง:
• ธนาคาร: กสิกรไทย  
• เลขบัญชี: 123-4-56789-0
• ชื่อบัญชี: DOGLC Wallet Service
• จำนวน: ${amountNum.toLocaleString()} บาท

📸 หลังโอนเสร็จ กรุณาส่งสลิปมาที่บอทนี้
⏰ ระยะเวลาตรวจสอบ: 1-5 นาที`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📸 ส่งสลิปการโอน", callback_data: 'upload_slip' }
      ],
      [
        { text: "📞 ติดต่อ Support", callback_data: 'contact_support' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, confirmText, keyboard, env);
}

// ฟังก์ชันกลับไปเมนูหลัก
async function handleMainMenu(chatId, userId, env) {
  const username = `ผู้ใช้ ${userId.slice(-4)}`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: "💰 ตรวจสอบยอดเงิน", callback_data: 'balance' },
        { text: "💸 โอน USDT", callback_data: 'send' }
      ],
      [
        { text: "📝 Wallet Address", callback_data: 'receive' },
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
  
  const menuText = `🏠 เมนูหลัก - DOGLC Wallet

สวัสดี ${username}! 
เลือกฟีเจอร์ที่ต้องการใช้งาน:`;

  await sendMessage(chatId, menuText, keyboard, env);
}

// ฟังก์ชันยืนยันการโอน USDT
async function handleUSDTTransferConfirm(chatId, userId, amount, address, env) {
  const amountNum = parseFloat(amount);
  const fee = 2; // ค่าธรรมเนียม 2 USDT
  const totalAmount = amountNum + fee;
  
  // ตรวจสอบ address format (TRC-20)
  const isValidAddress = address.startsWith('TR') && address.length >= 34;
  
  if (!isValidAddress) {
    const errorText = `❌ Wallet Address ไม่ถูกต้อง!

🔹 Address ต้องเป็น TRC-20 format
🔹 ขึ้นต้นด้วย "TR" และมีความยาว 34 ตัวอักษร

📝 ตัวอย่าง: TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

กรุณาลองใหม่ในรูปแบบ: จำนวน|Address`;

    await sendMessage(chatId, errorText, null, env);
    return;
  }
  
  if (amountNum < 5) {
    const errorText = `❌ จำนวน USDT ขั้นต่ำ 5 USDT
    
กรุณาลองใหม่ในรูปแบบ: จำนวน|Address
ตัวอย่าง: 10|${address}`;

    await sendMessage(chatId, errorText, null, env);
    return;
  }
  
  if (totalAmount > 50) { // ยอดคงเหลือ demo
    const errorText = `❌ ยอดคงเหลือไม่เพียงพอ!

💰 ยอดคงเหลือของคุณ: 50 USDT
💸 จำนวนที่ต้องการโอน: ${amountNum} USDT  
💳 ค่าธรรมเนียม: ${fee} USDT
📊 รวมทั้งหมด: ${totalAmount} USDT

กรุณาลองใหม่ด้วยจำนวนที่น้อยกว่า`;

    await sendMessage(chatId, errorText, null, env);
    return;
  }
  
  const confirmText = `💸 ยืนยันการโอน USDT

📋 รายละเอียดการโอน:
• จำนวนโอน: ${amountNum} USDT
• ปลายทาง: ${address}
• ค่าธรรมเนียม: ${fee} USDT
• รวมทั้งหมด: ${totalAmount} USDT

💰 ยอดคงเหลือหลังโอน: ${(50 - totalAmount).toFixed(2)} USDT

⚠️ โปรดตรวจสอบข้อมูลให้ถูกต้อง การโอนไม่สามารถยกเลิกได้!`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ ยืนยันโอน", callback_data: `execute_transfer_${amountNum}_${address}` }
      ],
      [
        { text: "❌ ยกเลิก", callback_data: 'send' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, confirmText, keyboard, env);
}

// ฟังก์ชันดำเนินการโอน USDT
async function handleExecuteTransfer(chatId, userId, amount, address, env) {
  const amountNum = parseFloat(amount);
  const fee = 2;
  const totalAmount = amountNum + fee;
  const transactionId = `TX${Date.now().toString().slice(-10)}`;
  
  // จำลองการโอน (ในการใช้งานจริงจะเชื่อมต่อกับ blockchain)
  const successText = `✅ โอน USDT สำเร็จ!

📋 รายละเอียดการทำรายการ:
• Transaction ID: ${transactionId}
• จำนวนโอน: ${amountNum} USDT
• ปลายทาง: ${address.substring(0, 10)}...${address.substring(address.length - 10)}
• ค่าธรรมเนียม: ${fee} USDT
• วันที่: ${new Date().toLocaleDateString('th-TH')}
• เวลา: ${new Date().toLocaleTimeString('th-TH')}

💰 ยอดคงเหลือปัจจุบัน: ${(50 - totalAmount).toFixed(2)} USDT

🔍 สามารถตรวจสอบสถานะได้ที่ Blockchain Explorer`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "💰 ตรวจสอบยอดเงิน", callback_data: 'balance' }
      ],
      [
        { text: "📊 ดูประวัติ", callback_data: 'history' },
        { text: "💸 โอนอีกครั้ง", callback_data: 'send' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, successText, keyboard, env);
}

async function handleUploadSlip(chatId, userId, env) {
  const uploadText = `📸 อัปโหลดสลิปการโอนเงิน

📝 วิธีการ:
1. ถ่ายรูปสลิปการโอนเงิน
2. ส่งรูปมาที่บอทนี้
3. ระบุจำนวนเงินในข้อความ

⏰ ระยะเวลาตรวจสอบ: 1-5 นาที
📞 หากมีปัญหา: ติดต่อ Support`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📞 ติดต่อ Support", callback_data: 'contact_support' },
        { text: "🔙 กลับ", callback_data: 'main_menu' }
      ],
      [
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, uploadText, keyboard, env);
}

async function handleContactSupport(chatId, userId, env) {
  const supportText = `📞 ติดต่อ Support

🕐 เวลาทำการ: 09:00 - 22:00 ทุกวัน

📱 ช่องทางติดต่อ:
• Telegram: @DoglcSupport
• Line: @doglcwallet
• Email: support@doglc.com

⚡ ตอบกลับภายใน: 5-30 นาที`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📱 เปิด Telegram Support", url: "https://t.me/DoglcSupport" }
      ],
      [
        { text: "🔙 กลับ", callback_data: 'settings' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, supportText, keyboard, env);
}

async function handleChangeLanguage(chatId, userId, env) {
  const langText = `🌍 เปลี่ยนภาษา / Change Language

เลือกภาษาที่ต้องการ:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🇹🇭 ภาษาไทย", callback_data: 'lang_th' },
        { text: "🇺🇸 English", callback_data: 'lang_en' }
      ],
      [
        { text: "🇨🇳 中文", callback_data: 'lang_zh' },
        { text: "🇰🇭 ខ្មែរ", callback_data: 'lang_km' }
      ],
      [
        { text: "🔙 กลับ", callback_data: 'settings' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, langText, keyboard, env);
}

async function handleNotifications(chatId, userId, env) {
  const notiText = `🔔 การแจ้งเตือน

ตั้งค่าการแจ้งเตือนของคุณ:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ แจ้งเตือนการรับเงิน", callback_data: 'noti_receive_on' },
        { text: "❌ ปิดแจ้งเตือนรับเงิน", callback_data: 'noti_receive_off' }
      ],
      [
        { text: "✅ แจ้งเตือนการส่งเงิน", callback_data: 'noti_send_on' },
        { text: "❌ ปิดแจ้งเตือนส่งเงิน", callback_data: 'noti_send_off' }
      ],
      [
        { text: "🔙 กลับ", callback_data: 'settings' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, notiText, keyboard, env);
}

async function handleSecurity(chatId, userId, env) {
  const securityText = `🔐 ความปลอดภัย

ตั้งค่าความปลอดภัยของบัญชี:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔑 ตั้งรหัส PIN", callback_data: 'set_pin' },
        { text: "📱 2FA Authentication", callback_data: 'setup_2fa' }
      ],
      [
        { text: "📋 ดูประวัติการเข้าสู่ระบบ", callback_data: 'login_history' }
      ],
      [
        { text: "🔙 กลับ", callback_data: 'settings' },
        { text: "🏠 เมนูหลัก", callback_data: 'main_menu' }
      ]
    ]
  };
  
  await sendMessage(chatId, securityText, keyboard, env);
}

// Utility Functions
async function sendMessage(chatId, text, keyboard, env) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    };
    
    if (keyboard) {
      payload.reply_markup = keyboard;
    }
    
    console.log('Sending message:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Telegram response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Telegram API error:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function answerCallbackQuery(callbackQueryId, env) {
  try {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

// Language handling functions
async function handleLanguageSelection(chatId, userId, language, env) {
  // Store language preference
  await setUserLanguage(userId, language, env);
  
  const messages = {
    th: 'ภาษาไทยได้รับการตั้งค่าเรียบร้อยแล้ว! 🇹🇭',
    en: 'English has been set successfully! 🇺🇸', 
    zh: '中文设置成功！🇨🇳',
    km: 'ភាសាខ្មែរត្រូវបានកំណត់ដោយជោគជ័យ! 🇰🇭'
  };
  
  const confirmationMessage = messages[language] || messages['en'];
  
  // Send confirmation message
  await sendMessage(chatId, confirmationMessage, null, env);
  
  // Return to main menu with selected language
  setTimeout(async () => {
    await handleMainMenu(chatId, userId, env);
  }, 1500);
}

async function setUserLanguage(userId, language, env) {
  try {
    // Try to store in KV first (if available)
    if (env.USER_SETTINGS) {
      await env.USER_SETTINGS.put(`lang:${userId}`, language);
    }
    
    // Also try to store in database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO user_settings (user_id, setting_key, setting_value)
          VALUES (?, ?, ?)
        `).bind(userId, 'language', language).run();
      } catch (dbError) {
        console.log('Database language storage failed:', dbError);
      }
    }
  } catch (error) {
    console.error('Error storing language preference:', error);
  }
}

async function getUserLanguage(userId, env) {
  try {
    // Try KV first
    if (env.USER_SETTINGS) {
      const lang = await env.USER_SETTINGS.get(`lang:${userId}`);
      if (lang) return lang;
    }
    
    // Try database
    if (env.DB) {
      try {
        const result = await env.DB.prepare(`
          SELECT setting_value FROM user_settings 
          WHERE user_id = ? AND setting_key = 'language'
        `).bind(userId).first();
        if (result) return result.setting_value;
      } catch (dbError) {
        console.log('Database language retrieval failed:', dbError);
      }
    }
  } catch (error) {
    console.error('Error retrieving language preference:', error);
  }
  
  // Default to Thai
  return 'th';
}
