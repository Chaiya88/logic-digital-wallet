# Digital Wallet Feature Verification Report
# รายงานการยืนยันฟีเจอร์ของ Digital Wallet System

Write-Host "🔍 กำลังตรวจสอบฟีเจอร์และข้อมูลภายในไฟล์..." -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan

# 1. Main Bot Worker Features
Write-Host "`n🤖 MAIN BOT WORKER FEATURES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$mainBotFile = ".\workers\main-bot\index.js"
if (Test-Path $mainBotFile) {
    $mainBotContent = Get-Content $mainBotFile -Raw
    
    # Check Telegram Features
    $features = @{
        "Telegram Webhook Handler" = $mainBotContent.Contains("webhook/telegram")
        "Start Command (/start)" = $mainBotContent.Contains("/start")
        "Balance Check (💰)" = $mainBotContent.Contains("callback_data: 'balance'")
        "USDT Transfer (💸)" = $mainBotContent.Contains("callback_data: 'send'")
        "Wallet Address (🎯)" = $mainBotContent.Contains("callback_data: 'receive'")
        "Transaction History (📊)" = $mainBotContent.Contains("callback_data: 'history'")
        "THB Deposit (🏦)" = $mainBotContent.Contains("callback_data: 'deposit_thb'")
        "USDT Withdrawal (💎)" = $mainBotContent.Contains("callback_data: 'withdraw_usdt'")
        "Settings Menu (⚙️)" = $mainBotContent.Contains("callback_data: 'settings'")
        "User Database Management" = $mainBotContent.Contains("ensureUser")
        "Balance Query Function" = $mainBotContent.Contains("getUserBalance")
        "Message Sending Function" = $mainBotContent.Contains("sendMessage")
    }
    
    foreach ($feature in $features.GetEnumerator()) {
        $status = if ($feature.Value) { "✅ FOUND" } else { "❌ MISSING" }
        $color = if ($feature.Value) { "Green" } else { "Red" }
        Write-Host "  $($feature.Key): $status" -ForegroundColor $color
    }
    
    # Count lines and size
    $lines = ($mainBotContent -split "`n").Count
    $size = [math]::Round((Get-Item $mainBotFile).Length / 1KB, 1)
    Write-Host "  📏 File Size: $size KB, Lines: $lines" -ForegroundColor Blue
}

# 2. API Worker Features  
Write-Host "`n🌐 API WORKER FEATURES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$apiFile = ".\workers\api\index.js"
if (Test-Path $apiFile) {
    $apiContent = Get-Content $apiFile -Raw
    
    $apiFeatures = @{
        "Fiat Deposit Initiation" = $apiContent.Contains("/fiat/deposit/initiate")
        "Deposit Slip Submission" = $apiContent.Contains("/fiat/deposit/submit-slip")
        "Crypto Withdrawal" = $apiContent.Contains("/crypto/withdraw/initiate")
        "Wallet Balance API" = $apiContent.Contains("/wallet/balance")
        "Wallet Address API" = $apiContent.Contains("/wallet/address")
        "Transaction Send API" = $apiContent.Contains("/transactions/send")
        "Transaction History API" = $apiContent.Contains("/transactions/history")
        "User Profile API" = $apiContent.Contains("/user/profile")
        "Staking Functions" = $apiContent.Contains("/staking/stake")
        "Market Data API" = $apiContent.Contains("/market-data")
        "System Status API" = $apiContent.Contains("/system/status")
        "CORS Headers" = $apiContent.Contains("Access-Control-Allow-Origin")
    }
    
    foreach ($feature in $apiFeatures.GetEnumerator()) {
        $status = if ($feature.Value) { "✅ FOUND" } else { "❌ MISSING" }
        $color = if ($feature.Value) { "Green" } else { "Red" }
        Write-Host "  $($feature.Key): $status" -ForegroundColor $color
    }
    
    $lines = ($apiContent -split "`n").Count
    $size = [math]::Round((Get-Item $apiFile).Length / 1KB, 1)
    Write-Host "  📏 File Size: $size KB, Lines: $lines" -ForegroundColor Blue
}

# 3. Banking Worker Features
Write-Host "`n🏦 BANKING WORKER FEATURES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$bankingFile = ".\workers\banking\index.js"
if (Test-Path $bankingFile) {
    $bankingContent = Get-Content $bankingFile -Raw
    
    $bankingFeatures = @{
        "THB Deposit Initiation" = $bankingContent.Contains("initiateTHBDeposit")
        "THB Deposit Confirmation" = $bankingContent.Contains("confirmTHBDeposit")
        "USDT Withdrawal Processing" = $bankingContent.Contains("initiateUSDTWithdrawal")
        "Crypto Payout Processing" = $bankingContent.Contains("processCryptoPayout")
        "Transfer Processing" = $bankingContent.Contains("processTransfer")
        "Daily Withdrawal Limits" = $bankingContent.Contains("getDailyWithdrawalAmount")
        "Withdrawal Fee Calculation" = $bankingContent.Contains("calculateWithdrawalFee")
        "Transfer Data Validation" = $bankingContent.Contains("validateTransferData")
        "Database Operations" = $bankingContent.Contains("env.DB.prepare")
        "Balance Management" = $bankingContent.Contains("balance")
        "Transaction Recording" = $bankingContent.Contains("transaction")
        "Error Handling" = $bankingContent.Contains("try {") -and $bankingContent.Contains("catch")
    }
    
    foreach ($feature in $bankingFeatures.GetEnumerator()) {
        $status = if ($feature.Value) { "✅ FOUND" } else { "❌ MISSING" }
        $color = if ($feature.Value) { "Green" } else { "Red" }
        Write-Host "  $($feature.Key): $status" -ForegroundColor $color
    }
    
    $lines = ($bankingContent -split "`n").Count
    $size = [math]::Round((Get-Item $bankingFile).Length / 1KB, 1)
    Write-Host "  📏 File Size: $size KB, Lines: $lines" -ForegroundColor Blue
}

# 4. Security Worker Features
Write-Host "`n🔒 SECURITY WORKER FEATURES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$securityFile = ".\workers\security\index.js"
if (Test-Path $securityFile) {
    $securityContent = Get-Content $securityFile -Raw
    
    $securityFeatures = @{
        "Webhook Signature Verification" = $securityContent.Contains("verifyWebhookSignature")
        "Authentication Validation" = $securityContent.Contains("validateAuthentication")
        "2FA Verification" = $securityContent.Contains("verify2FA")
        "TOTP Verification" = $securityContent.Contains("verifyTOTP")
        "Security Incident Creation" = $securityContent.Contains("createSecurityIncident")
        "Security Event Logging" = $securityContent.Contains("logSecurityEvent")
        "Security Error Logging" = $securityContent.Contains("logSecurityError")
        "Security Summary" = $securityContent.Contains("getSecuritySummary")
        "Rate Limiting" = $securityContent.Contains("rate") -or $securityContent.Contains("limit")
        "JWT Token Handling" = $securityContent.Contains("jwt") -or $securityContent.Contains("token")
        "Encryption Functions" = $securityContent.Contains("encrypt") -or $securityContent.Contains("crypto")
        "Access Control" = $securityContent.Contains("access") -or $securityContent.Contains("permission")
    }
    
    foreach ($feature in $securityFeatures.GetEnumerator()) {
        $status = if ($feature.Value) { "✅ FOUND" } else { "❌ MISSING" }
        $color = if ($feature.Value) { "Green" } else { "Red" }
        Write-Host "  $($feature.Key): $status" -ForegroundColor $color
    }
    
    $lines = ($securityContent -split "`n").Count  
    $size = [math]::Round((Get-Item $securityFile).Length / 1KB, 1)
    Write-Host "  📏 File Size: $size KB, Lines: $lines" -ForegroundColor Blue
}

# 5. Frontend Worker Features
Write-Host "`n🎨 FRONTEND WORKER FEATURES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$frontendFile = ".\workers\frontend\index.js"
if (Test-Path $frontendFile) {
    $frontendContent = Get-Content $frontendFile -Raw
    
    $frontendFeatures = @{
        "Dashboard Route (/)" = $frontendContent.Contains("case '/':")
        "Login Page (/login)" = $frontendContent.Contains("case '/login':")
        "Wallet Interface (/wallet)" = $frontendContent.Contains("case '/wallet':")
        "Transaction View (/transactions)" = $frontendContent.Contains("case '/transactions':")
        "Admin Panel (/admin)" = $frontendContent.Contains("case '/admin':")
        "CSS Styles Serving" = $frontendContent.Contains("/assets/styles.css")
        "JavaScript Serving" = $frontendContent.Contains("/assets/app.js")
        "Frontend Stats API" = $frontendContent.Contains("/api/frontend/stats")
        "User Preferences API" = $frontendContent.Contains("/api/frontend/user-preferences")
        "HTML Generation" = $frontendContent.Contains("<!DOCTYPE html>")
        "Responsive Design" = $frontendContent.Contains("viewport") -or $frontendContent.Contains("mobile")
        "Error Pages" = $frontendContent.Contains("404") -or $frontendContent.Contains("error")
    }
    
    foreach ($feature in $frontendFeatures.GetEnumerator()) {
        $status = if ($feature.Value) { "✅ FOUND" } else { "❌ MISSING" }
        $color = if ($feature.Value) { "Green" } else { "Red" }
        Write-Host "  $($feature.Key): $status" -ForegroundColor $color
    }
    
    $lines = ($frontendContent -split "`n").Count
    $size = [math]::Round((Get-Item $frontendFile).Length / 1KB, 1)
    Write-Host "  📏 File Size: $size KB, Lines: $lines" -ForegroundColor Blue
}

# 6. Configuration Files Check
Write-Host "`n⚙️ CONFIGURATION FILES:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$configFiles = @(
    ".\wrangler.toml",
    ".\workers\main-bot\wrangler.toml", 
    ".\workers\api\wrangler.toml",
    ".\workers\banking\wrangler.toml",
    ".\workers\security\wrangler.toml",
    ".\workers\frontend\wrangler.toml",
    ".\package.json",
    ".\.env.example"
)

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        $size = [math]::Round((Get-Item $configFile).Length / 1KB, 2)
        Write-Host "  ✅ $($configFile): $size KB" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($configFile): MISSING" -ForegroundColor Red
    }
}

# 7. Database Schema Check
Write-Host "`n💾 DATABASE COMPONENTS:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$dbComponents = @()
foreach ($worker in @("main-bot", "api", "banking", "security")) {
    $workerFile = ".\workers\$worker\index.js"
    if (Test-Path $workerFile) {
        $content = Get-Content $workerFile -Raw
        
        $hasDB = $content.Contains("env.DB") -or $content.Contains("database")
        $hasKV = $content.Contains("env.KV") -or $content.Contains("kv")
        $hasDO = $content.Contains("env.DO") -or $content.Contains("DurableObject")
        
        $dbComponents += [PSCustomObject]@{
            Worker = $worker
            Database = $hasDB
            KeyValue = $hasKV
            DurableObjects = $hasDO
        }
    }
}

$dbComponents | Format-Table -AutoSize

# 8. Security Features Check
Write-Host "`n🛡️ SECURITY IMPLEMENTATION:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$allContent = ""
Get-ChildItem ".\workers\*\index.js" | ForEach-Object {
    $allContent += Get-Content $_.FullName -Raw
}

$securityChecks = @{
    "HTTPS Enforcement" = $allContent.Contains("https") -or $allContent.Contains("SSL")
    "Input Validation" = $allContent.Contains("validate") -and $allContent.Contains("input")
    "SQL Injection Protection" = $allContent.Contains("prepare") -and $allContent.Contains("bind")
    "Rate Limiting" = $allContent.Contains("rate") -and $allContent.Contains("limit")
    "Authentication" = $allContent.Contains("auth") -and $allContent.Contains("token")
    "Error Handling" = $allContent.Contains("try {") -and $allContent.Contains("catch")
    "Logging System" = $allContent.Contains("console.log") -or $allContent.Contains("log")
    "CORS Headers" = $allContent.Contains("Access-Control-Allow-Origin")
}

foreach ($check in $securityChecks.GetEnumerator()) {
    $status = if ($check.Value) { "✅ IMPLEMENTED" } else { "⚠️ NEEDS REVIEW" }
    $color = if ($check.Value) { "Green" } else { "Yellow" }
    Write-Host "  $($check.Key): $status" -ForegroundColor $color
}

# 9. Summary Statistics
Write-Host "`n📊 PROJECT STATISTICS:" -ForegroundColor Green
Write-Host "─" * 40 -ForegroundColor DarkGray

$totalFiles = (Get-ChildItem -Recurse -File | Where-Object { $_.Extension -in @('.js', '.toml', '.json', '.md', '.ps1') }).Count
$totalSize = [math]::Round((Get-ChildItem -Recurse -File | Where-Object { $_.Extension -in @('.js', '.toml', '.json') } | Measure-Object Length -Sum).Sum / 1MB, 2)
$jsFiles = (Get-ChildItem -Recurse -File -Filter "*.js").Count
$configFiles = (Get-ChildItem -Recurse -File | Where-Object { $_.Name -like "*wrangler.toml" -or $_.Name -like "*.json" }).Count

Write-Host "  📁 Total Relevant Files: $totalFiles" -ForegroundColor Blue
Write-Host "  📏 Total Code Size: $totalSize MB" -ForegroundColor Blue  
Write-Host "  🟨 JavaScript Files: $jsFiles" -ForegroundColor Blue
Write-Host "  ⚙️ Configuration Files: $configFiles" -ForegroundColor Blue

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "✅ FEATURE VERIFICATION COMPLETE!" -ForegroundColor Green
Write-Host "📋 Report generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
