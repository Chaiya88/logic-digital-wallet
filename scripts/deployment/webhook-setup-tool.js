// Telegram Webhook Setup Tool
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/setup-webhook') {
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
        
        // Get webhook info
        const getWebhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const getResult = await getWebhookResponse.json();
        
        return new Response(JSON.stringify({
          setWebhook: setResult,
          webhookInfo: getResult
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Webhook setup tool ready. Visit /setup-webhook to configure.');
  }
};
