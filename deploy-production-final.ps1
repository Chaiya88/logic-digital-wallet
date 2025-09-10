# Logic Digital Wallet - Production Deployment Script
# ดำเนินการ deploy ทุก workers ไปยัง Cloudflare

Write-Host "🚀 เริ่มต้นการ Deploy Logic Digital Wallet" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# ตรวจสอบ Wrangler CLI
Write-Host "📋 ตรวจสอบ Wrangler CLI..." -ForegroundColor Cyan
try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ Wrangler พร้อมใช้งาน: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI ไม่พบ กรุณาติดตั้งด้วยคำสั่ง: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

# Deploy Production Workers
$workers = @("api", "banking", "security", "main-bot", "frontend")
$deploySuccess = 0
$deployFailed = 0

Write-Host "`n🔨 เริ่มต้น Deploy Production Workers..." -ForegroundColor Cyan

foreach ($worker in $workers) {
    Write-Host "`n📦 กำลัง Deploy $worker worker..." -ForegroundColor Yellow
    
    $workerPath = "production-ready\workers\$worker"
    
    if (Test-Path $workerPath) {
        Push-Location $workerPath
        
        try {
            Write-Host "   🔄 กำลัง deploy $worker..." -ForegroundColor Cyan
            $result = wrangler deploy 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ $worker worker deployed สำเร็จ!" -ForegroundColor Green
                $deploySuccess++
            } else {
                Write-Host "   ❌ $worker worker deploy ล้มเหลว!" -ForegroundColor Red
                Write-Host "   Error: $result" -ForegroundColor Red
                $deployFailed++
            }
        } catch {
            Write-Host "   ❌ เกิดข้อผิดพลาดใน $worker worker: $($_.Exception.Message)" -ForegroundColor Red
            $deployFailed++
        }
        
        Pop-Location
    } else {
        Write-Host "   ❌ ไม่พบโฟลเดอร์ $workerPath" -ForegroundColor Red
        $deployFailed++
    }
}

# สรุปผลการ Deploy
Write-Host "`n=================================================" -ForegroundColor Yellow
Write-Host "📊 สรุปผลการ Deploy:" -ForegroundColor Cyan
Write-Host "✅ สำเร็จ: $deploySuccess workers" -ForegroundColor Green
Write-Host "❌ ล้มเหลว: $deployFailed workers" -ForegroundColor Red

if ($deployFailed -eq 0) {
    Write-Host "`n🎉 Deploy ทุก workers สำเร็จแล้ว!" -ForegroundColor Green
    Write-Host "🔗 Logic Digital Wallet พร้อมใช้งานบน Cloudflare Workers!" -ForegroundColor Green
    
    Write-Host "`n📋 ขั้นตอนถัดไป:" -ForegroundColor Cyan
    Write-Host "1. ตั้งค่า secrets ด้วยคำสั่ง wrangler secret put" -ForegroundColor White
    Write-Host "2. ตรวจสอบ worker URLs ใน Cloudflare Dashboard" -ForegroundColor White
    Write-Host "3. ทดสอบการทำงานของ API endpoints" -ForegroundColor White
    Write-Host "4. ตั้งค่า Telegram webhook" -ForegroundColor White
} else {
    Write-Host "`n⚠️  มี workers บางตัวที่ deploy ไม่สำเร็จ" -ForegroundColor Yellow
    Write-Host "กรุณาตรวจสอบ error messages และแก้ไขปัญหา" -ForegroundColor Yellow
}

Write-Host "`n🏁 Deployment Script เสร็จสิ้น" -ForegroundColor Green
