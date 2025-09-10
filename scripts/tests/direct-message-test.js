// ทดสอบการส่งข้อความโดยตรง
export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      try {
        const data = await request.json();
        const chatId = data.chat_id || '123456789'; // ใส่ chat ID ของคุณ
        
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
        
        const payload = {
          chat_id: chatId,
          text: '🚀 ทดสอบข้อความพร้อมปุ่มเมนู\\n\\nหากคุณเห็นข้อความนี้ แสดงว่าบอทใช้งานได้แล้ว!',
          parse_mode: 'HTML',
          reply_markup: keyboard
        };
        
        console.log('Sending to Telegram:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(\https://api.telegram.org/bot\/sendMessage\, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        return new Response(JSON.stringify({
          success: response.ok,
          telegram_response: result
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), { status: 500 });
      }
    }
    
    return new Response('Direct message test worker ready');
  }
};
