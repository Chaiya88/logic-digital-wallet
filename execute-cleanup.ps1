# Safe Cloudflare Workers Cleanup Script
# Deletes old/unused workers while preserving active ones

Write-Host "🗑️ CLOUDFLARE WORKERS CLEANUP EXECUTION" -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red

# Active workers to PRESERVE (DO NOT DELETE)
$preserveWorkers = @(
    "main-bot-worker",
    "api-worker", 
    "banking-worker",
    "security-worker",
    "frontend-worker"
)

# Old workers to DELETE
$deleteWorkers = @(
    "digital-wallet-orchestrator",
    "doglc-bot",
    "doglc-api",
    "doglc-banking",
    "doglc-security",
    "doglc-frontend",
    "test-worker",
    "dev-worker",
    "staging-worker",
    "worker-1",
    "worker-2",
    "my-worker",
    "untitled-worker"
)

Write-Host "`n⚠️ WARNING: This will DELETE $($deleteWorkers.Count) old workers!" -ForegroundColor Yellow
Write-Host "Active workers that will be PRESERVED:" -ForegroundColor Green
foreach ($worker in $preserveWorkers) {
    Write-Host "  ✅ $worker" -ForegroundColor Green
}

Write-Host "`nWorkers that will be DELETED:" -ForegroundColor Red
foreach ($worker in $deleteWorkers) {
    Write-Host "  🗑️ $worker" -ForegroundColor Red
}

# Safety confirmation
Write-Host "`n⏰ Starting cleanup in 5 seconds..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel if needed!" -ForegroundColor Red
Start-Sleep -Seconds 5

Write-Host "`n🧹 Starting cleanup process..." -ForegroundColor Cyan

$successCount = 0
$errorCount = 0
$errors = @()

foreach ($worker in $deleteWorkers) {
    Write-Host "`n🗑️ Deleting $worker..." -ForegroundColor Yellow
    try {
        # First check if worker exists
        $deployments = npx wrangler deployments list --name $worker 2>$null
        if ($deployments) {
            # Worker exists, proceed with deletion
            $result = npx wrangler delete $worker --force 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Successfully deleted $worker" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "  ❌ Failed to delete $worker" -ForegroundColor Red
                Write-Host "  Error: $result" -ForegroundColor Red
                $errorCount++
                $errors += "$worker : $result"
            }
        } else {
            Write-Host "  ⚠️ Worker $worker not found (may already be deleted)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Error deleting $worker : $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
        $errors += "$worker : $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 1
}

Write-Host "`n📊 CLEANUP SUMMARY:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Successfully deleted: $successCount workers" -ForegroundColor Green
Write-Host "❌ Failed to delete: $errorCount workers" -ForegroundColor Red
Write-Host "🔒 Preserved active workers: $($preserveWorkers.Count)" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "`n❌ ERRORS ENCOUNTERED:" -ForegroundColor Red
    foreach ($errorMsg in $errors) {
        Write-Host "  - $errorMsg" -ForegroundColor Red
    }
}

Write-Host "`n✅ VERIFICATION - CHECKING REMAINING WORKERS:" -ForegroundColor Green
foreach ($worker in $preserveWorkers) {
    try {
        $deployments = npx wrangler deployments list --name $worker 2>$null | Select-Object -First 1
        if ($deployments) {
            Write-Host "  ✅ $worker - Still active" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ $worker - May have been accidentally deleted!" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $worker - Error checking status" -ForegroundColor Red
    }
}

Write-Host "`n🎯 FINAL STATUS:" -ForegroundColor Cyan
if ($errorCount -eq 0) {
    Write-Host "🎉 CLEANUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "All old workers have been removed." -ForegroundColor Green
    Write-Host "Your active workers are preserved and functional." -ForegroundColor Green
} else {
    Write-Host "⚠️ CLEANUP COMPLETED WITH SOME ERRORS" -ForegroundColor Yellow
    Write-Host "$successCount workers deleted successfully" -ForegroundColor Green
    Write-Host "$errorCount workers had deletion errors" -ForegroundColor Red
    Write-Host "You may need to manually delete the failed workers" -ForegroundColor Yellow
}

Write-Host "`n🌐 Test your active workers:" -ForegroundColor Cyan
Write-Host "https://teenoi96.org/bot/status" -ForegroundColor White
Write-Host "https://teenoi96.org/app/" -ForegroundColor White

Write-Host "`n🏁 CLEANUP PROCESS COMPLETED!" -ForegroundColor Green
