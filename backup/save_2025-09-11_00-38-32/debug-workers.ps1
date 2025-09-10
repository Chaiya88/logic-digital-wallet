# Digital Wallet Workers Debug Script
# ตรวจสอบสถานะและ debug workers ทั้งหมด

Write-Host "🔍 Digital Wallet Workers Debug Report" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# ตรวจสอบ Wrangler Authentication
Write-Host "`n1. 👤 Wrangler Authentication Status:" -ForegroundColor Yellow
try {
    npx wrangler whoami
} catch {
    Write-Host "❌ Wrangler authentication failed" -ForegroundColor Red
}

# ตรวจสอบ Deployments
Write-Host "`n2. 🚀 Recent Deployments:" -ForegroundColor Yellow
try {
    Write-Host "- Main Bot Worker deployments (latest 3):" -ForegroundColor Green
    npx wrangler deployments list --name main-bot-worker | Select-Object -First 10
    
    Write-Host "`n- API Worker deployments:" -ForegroundColor Green
    npx wrangler deployments list --name api-worker | Select-Object -First 5
    
    Write-Host "`n- Banking Worker deployments:" -ForegroundColor Green
    npx wrangler deployments list --name banking-worker | Select-Object -First 5
} catch {
    Write-Host "❌ Failed to get deployments" -ForegroundColor Red
}

# ทดสอบ Workers URLs
Write-Host "`n3. 🌐 Testing Worker Endpoints:" -ForegroundColor Yellow

$workers = @(
    @{name="main-bot-worker"; url="https://main-bot-worker.doglc-bbj.workers.dev/bot/status"}
    @{name="api-worker"; url="https://api-worker.doglc-bbj.workers.dev/health"}
    @{name="banking-worker"; url="https://banking-worker.doglc-bbj.workers.dev/health"}
    @{name="security-worker"; url="https://security-worker.doglc-bbj.workers.dev/health"}
    @{name="frontend-worker"; url="https://frontend-worker.doglc-bbj.workers.dev/"}
)

foreach ($worker in $workers) {
    Write-Host "- Testing $($worker.name):" -ForegroundColor Green
    try {
        $response = Invoke-RestMethod -Uri $worker.url -Method GET -TimeoutSec 10
        Write-Host "  ✅ Status: OK" -ForegroundColor Green
        Write-Host "  📊 Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # ลองใช้ .workers.dev domain
        $altUrl = $worker.url -replace "doglc-bbj", "chaiya88"
        Write-Host "  🔄 Trying alternative URL: $altUrl" -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri $altUrl -Method GET -TimeoutSec 10
            Write-Host "  ✅ Alternative URL works!" -ForegroundColor Green
            Write-Host "  📊 Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor White
        } catch {
            Write-Host "  ❌ Alternative URL also failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 1
}

# ตรวจสอบ Local Development
Write-Host "`n4. 🛠️ Local Development Check:" -ForegroundColor Yellow
$configFiles = @(
    "wrangler.toml",
    "api/wrangler.toml",
    "api/banking-worker/wrangler.toml"
)

foreach ($config in $configFiles) {
    if (Test-Path $config) {
        Write-Host "  ✅ Found: $config" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $config" -ForegroundColor Red
    }
}

# ตรวจสอบ Environment Variables
Write-Host "`n5. 🔐 Environment Variables:" -ForegroundColor Yellow
$envVars = @("TELEGRAM_BOT_TOKEN", "DATABASE_URL", "SECRET_KEY")
foreach ($var in $envVars) {
    if ([Environment]::GetEnvironmentVariable($var)) {
        Write-Host "  ✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $var is not set in environment" -ForegroundColor Yellow
    }
}

# ตรวจสอบ Logs Directory
Write-Host "`n6. 📝 Recent Logs:" -ForegroundColor Yellow
$logDir = "$env:APPDATA\xdg.config\.wrangler\logs"
if (Test-Path $logDir) {
    $recentLogs = Get-ChildItem $logDir -Filter "wrangler-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 3
    foreach ($log in $recentLogs) {
        Write-Host "  📄 $($log.Name) - $($log.LastWriteTime)" -ForegroundColor White
    }
} else {
    Write-Host "  ❌ Logs directory not found" -ForegroundColor Red
}

Write-Host "`n🎯 Debug Summary:" -ForegroundColor Cyan
Write-Host "1. Check workers.dev URLs above to find working endpoints" -ForegroundColor White
Write-Host "2. Use 'npx wrangler tail <worker-name>' to see live logs" -ForegroundColor White
Write-Host "3. Use 'npx wrangler dev' for local development" -ForegroundColor White
Write-Host "4. Check Cloudflare Dashboard for more details" -ForegroundColor White

Write-Host "`n✨ Debug completed!" -ForegroundColor Green
