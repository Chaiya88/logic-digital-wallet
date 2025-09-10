// Simple Bot Test - ทดสอบบอทแบบง่าย
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
          const username = update.message.from.first_name || 'ผู้ใช้';
          
          // Create inline keyboard
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
          
          const welcomeMessage = `🚀 ยินดีต้อนรับสู่ DOGLC Wallet Bot!

🎉 สวัสดี ${username}!

คุณสามารถใช้งานฟีเจอร์ต่างๆ ผ่านปุ่มด้านล่าง`;

          // Send message with keyboard
          const payload = {
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'HTML',
            reply_markup: keyboard
          };
          
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
            // Don't return error, just log it
            console.error('Failed to send message but continuing...');
          }
          
          return new Response('OK');
        }
        
        // Handle callback queries
        if (update.callback_query) {
          const callbackQuery = update.callback_query;
          const chatId = callbackQuery.message.chat.id;
          const data = callbackQuery.data;
          
          console.log('Callback query:', data);
          
          // Answer callback query
          await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQuery.id })
          });
          
          let responseText = '';
          switch (data) {
            case 'deposit_thb':
              responseText = '🏦 คุณเลือกฝากเงิน THB\n\nกรุณาระบุจำนวนเงินที่ต้องการฝาก';
              break;
            case 'withdraw_usdt':
              responseText = '💎 คุณเลือกถอน USDT\n\nกรุณาระบุจำนวนเงินและที่อยู่ USDT';
              break;
            case 'balance':
              responseText = '💰 ยอดเงินในบัญชีของคุณ\n\nTHB: 1,000.00\nUSDT: 50.00';
              break;
            default:
              responseText = `คุณเลือก: ${data}`;
          }
          
          // Send response
          const payload = {
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML'
          };
          
          const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          return new Response('OK');
        }
        
        return new Response('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Error', { status: 500 });
      }
    }
    
    return new Response('Simple Bot Test Ready');
  }
};
