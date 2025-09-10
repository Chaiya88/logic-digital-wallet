# Individual Worker Deployment Script
# Generated: 2025-09-10 23:03:47

Write-Host "🚀 Deploying Digital Wallet Workers..." -ForegroundColor Cyan

$workers = @(    "workers\api",
    "workers\frontend",
    "workers\main-bot",
    "workers\banking",
    "workers\security"
)

foreach ($workerPath in $workers) {
    if (Test-Path $workerPath) {
        Write-Host "
🚀 Deploying $workerPath..." -ForegroundColor Yellow
        Push-Location $workerPath
        try {
            npx wrangler deploy
            Write-Host "✅ Successfully deployed $workerPath" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to deploy $workerPath" -ForegroundColor Red
        }
        Pop-Location
    }
}

Write-Host "
🎯 Deployment completed!" -ForegroundColor Green
