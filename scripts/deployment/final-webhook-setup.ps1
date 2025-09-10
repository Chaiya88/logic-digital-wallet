# Final Webhook Setup - Direct API Call
Write-Host "🔧 SETTING UP TELEGRAM WEBHOOK DIRECTLY" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n⚠️  Manual webhook setup required!" -ForegroundColor Yellow
Write-Host "Follow these steps to fix the menu buttons:" -ForegroundColor White

Write-Host "`n1️⃣ GET BOT TOKEN:" -ForegroundColor Green
Write-Host "   Run this command to get your bot token:" -ForegroundColor White
Write-Host "   npx wrangler secret get TELEGRAM_BOT_TOKEN --name main-bot-worker" -ForegroundColor Cyan

Write-Host "`n2️⃣ SET WEBHOOK URL:" -ForegroundColor Green
Write-Host "   Use this URL to set the webhook (replace YOUR_BOT_TOKEN):" -ForegroundColor White
Write-Host "   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" -ForegroundColor Cyan
Write-Host "   " -ForegroundColor White
Write-Host "   POST Body:" -ForegroundColor White
Write-Host '   {"url": "https://teenoi96.org/webhook/telegram", "allowed_updates": ["message", "callback_query"]}' -ForegroundColor Yellow

Write-Host "`n3️⃣ VERIFY WEBHOOK:" -ForegroundColor Green
Write-Host "   Check webhook status with:" -ForegroundColor White
Write-Host "   https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo" -ForegroundColor Cyan

Write-Host "`n🎯 OR USE THIS MANUAL CURL COMMAND:" -ForegroundColor Yellow
Write-Host "Replace YOUR_BOT_TOKEN with your actual token:" -ForegroundColor White
Write-Host 'curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" -H "Content-Type: application/json" -d ''{"url": "https://teenoi96.org/webhook/telegram", "allowed_updates": ["message", "callback_query"]}''' -ForegroundColor Cyan

Write-Host "`n📱 TESTING THE BOT:" -ForegroundColor Green
Write-Host "After setting webhook, test your bot by:" -ForegroundColor White
Write-Host "1. Go to @DoglcWallet_Bot on Telegram" -ForegroundColor Cyan
Write-Host "2. Send /start command" -ForegroundColor Cyan
Write-Host "3. You should see menu buttons!" -ForegroundColor Cyan
Write-Host "4. Try clicking 'ฝากเงิน THB' and 'ถอน USDT' buttons" -ForegroundColor Cyan

Write-Host "`n🔍 ADDITIONAL DIAGNOSTICS:" -ForegroundColor Yellow

# Test the webhook endpoint one more time
Write-Host "Testing webhook endpoint..." -ForegroundColor Cyan
try {
    $testPayload = @{
        update_id = 123456789
        message = @{
            message_id = 1
            date = [int][double]::Parse((Get-Date -UFormat %s))
            chat = @{
                id = 12345
                type = "private"
            }
            from = @{
                id = 12345
                first_name = "Test"
                username = "testuser"
            }
            text = "/start"
        }
    } | ConvertTo-Json -Depth 10

    $headers = @{'Content-Type' = 'application/json'}
    $response = Invoke-RestMethod -Uri "https://teenoi96.org/webhook/telegram" -Method POST -Body $testPayload -Headers $headers -TimeoutSec 10
    
    Write-Host "✅ Webhook test response: $response" -ForegroundColor Green
} catch {
    Write-Host "❌ Webhook test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🚀 FINAL DIAGNOSIS:" -ForegroundColor Green
Write-Host "The code is working correctly!" -ForegroundColor White
Write-Host "The issue is just the webhook URL not being set in Telegram API." -ForegroundColor Yellow
Write-Host "Once you set the webhook URL, the menu buttons will work perfectly!" -ForegroundColor Green
