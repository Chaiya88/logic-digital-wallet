#!/usr/bin/env pwsh
# Health Check Script for Digital Wallet System

Write-Host "🔍 Digital Wallet System Health Check" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# 1. Bot Status Check
Write-Host "🤖 Checking Telegram Bot..." -ForegroundColor Yellow
try {
    $botStatus = curl -s "https://teenoi96.org/bot/status" | ConvertFrom-Json
    if ($botStatus.success -and $botStatus.bot_status.bot_online) {
        Write-Host "✅ Bot is ONLINE - Users: $($botStatus.bot_status.total_users)" -ForegroundColor Green
    } else {
        Write-Host "❌ Bot is OFFLINE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Bot check FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. API Health Check  
Write-Host "🌐 Checking API Health..." -ForegroundColor Yellow
try {
    $apiHealth = curl -s "https://teenoi96.org/api/public/network/health" | ConvertFrom-Json
    if ($apiHealth.success -and $apiHealth.health.status -eq "healthy") {
        Write-Host "✅ API is HEALTHY" -ForegroundColor Green
    } else {
        Write-Host "❌ API is UNHEALTHY" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API check FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Frontend Check
Write-Host "💻 Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://teenoi96.org/app/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is ACCESSIBLE" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend returned: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend check FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Database Connectivity (via Bot Status)
Write-Host "🗄️ Checking Database..." -ForegroundColor Yellow
if ($botStatus.success) {
    Write-Host "✅ Database is CONNECTED" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "- Bot Status: $(if($botStatus.bot_status.bot_online){'ONLINE'}else{'OFFLINE'})"
Write-Host "- Total Users: $($botStatus.bot_status.total_users)"
Write-Host "- Active Users: $($botStatus.bot_status.active_users)"
Write-Host "- Last Check: $(Get-Date)"
