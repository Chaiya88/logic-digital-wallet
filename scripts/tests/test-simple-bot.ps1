# ทดสอบบอทเวอร์ชันง่าย
Write-Host "🚀 ทดสอบบอทเวอร์ชันง่าย" -ForegroundColor Green

$testMessage = @{
    update_id = 999999
    message = @{
        message_id = 1
        date = [int][double]::Parse((Get-Date -UFormat %s))
        chat = @{
            id = 12345
            type = "private"
            first_name = "Test"
        }
        from = @{
            id = 12345
            first_name = "TestUser"
            username = "testuser"
        }
        text = "/start"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 ส่งคำสั่ง /start ไปยังบอทเวอร์ชันง่าย..." -ForegroundColor Cyan

try {
    $headers = @{'Content-Type' = 'application/json'}
    $response = Invoke-RestMethod -Uri "https://teenoi96.org/webhook/telegram" -Method POST -Body $testMessage -Headers $headers
    Write-Host "✅ Response: $response" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 ทดสอบ callback query..." -ForegroundColor Yellow

$callbackMessage = @{
    update_id = 999998
    callback_query = @{
        id = "test123"
        from = @{
            id = 12345
            first_name = "TestUser"
            username = "testuser"
        }
        message = @{
            message_id = 1
            date = [int][double]::Parse((Get-Date -UFormat %s))
            chat = @{
                id = 12345
                type = "private"
            }
            from = @{
                id = 8364296479
                is_bot = $true
                first_name = "DOGLC Wallet Bot"
                username = "DoglcWallet_Bot"
            }
            text = "ยินดีต้อนรับ"
        }
        data = "deposit_thb"
    }
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "https://teenoi96.org/webhook/telegram" -Method POST -Body $callbackMessage -Headers $headers
    Write-Host "✅ Callback Response: $response2" -ForegroundColor Green
} catch {
    Write-Host "❌ Callback Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📱 ตอนนี้ลองทดสอบบอทจริงใน Telegram:" -ForegroundColor Green
Write-Host "1. ไปที่ @DoglcWallet_Bot" -ForegroundColor White
Write-Host "2. ส่ง /start" -ForegroundColor White  
Write-Host "3. ควรเห็นปุ่มเมนูแล้ว!" -ForegroundColor Green
