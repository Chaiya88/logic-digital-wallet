# Cloudflare Workers Cleanup Script
# Checks current workers and helps clean up old/unused ones

Write-Host "🧹 CLOUDFLARE WORKERS CLEANUP TOOL" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Define current active workers
$activeWorkers = @(
    "main-bot-worker",
    "api-worker", 
    "banking-worker",
    "security-worker",
    "frontend-worker"
)

Write-Host "`n1. 📊 CHECKING CURRENT ACTIVE WORKERS:" -ForegroundColor Yellow

foreach ($worker in $activeWorkers) {
    Write-Host "`n- Checking $worker..." -ForegroundColor Green
    try {
        $deployments = npx wrangler deployments list --name $worker 2>$null
        if ($deployments) {
            $latestDeployment = $deployments | Select-Object -First 3
            Write-Host "  ✅ Active - Latest deployment:" -ForegroundColor Green
            Write-Host "  $($latestDeployment[0])" -ForegroundColor White
        } else {
            Write-Host "  ❌ No deployments found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Worker not found or error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n2. 🔍 SCANNING FOR POTENTIAL OLD WORKERS:" -ForegroundColor Yellow

# Common old worker names to check
$potentialOldWorkers = @(
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

$foundOldWorkers = @()

foreach ($worker in $potentialOldWorkers) {
    try {
        $deployments = npx wrangler deployments list --name $worker 2>$null
        if ($deployments) {
            Write-Host "  ⚠️ Found old worker: $worker" -ForegroundColor Yellow
            $foundOldWorkers += $worker
        }
    } catch {
        # Worker doesn't exist, which is good
    }
}

if ($foundOldWorkers.Count -eq 0) {
    Write-Host "  ✅ No old workers found!" -ForegroundColor Green
} else {
    Write-Host "  📋 Found $($foundOldWorkers.Count) old workers:" -ForegroundColor Yellow
    foreach ($oldWorker in $foundOldWorkers) {
        Write-Host "    - $oldWorker" -ForegroundColor Red
    }
}

Write-Host "`n3. 🗄️ CHECKING KV NAMESPACES:" -ForegroundColor Yellow
try {
    $kvNamespaces = npx wrangler kv namespace list 2>$null
    if ($kvNamespaces) {
        Write-Host "  📊 KV Namespaces found:" -ForegroundColor Green
        $kvNamespaces | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
    } else {
        Write-Host "  ✅ No KV namespaces (or none accessible)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Cannot access KV namespaces: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n4. 🗃️ CHECKING D1 DATABASES:" -ForegroundColor Yellow
try {
    $d1Databases = npx wrangler d1 list 2>$null
    if ($d1Databases) {
        Write-Host "  📊 D1 Databases found:" -ForegroundColor Green
        $d1Databases | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
    } else {
        Write-Host "  ✅ No D1 databases (or none accessible)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Cannot access D1 databases: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n5. 🗂️ CHECKING R2 BUCKETS:" -ForegroundColor Yellow
try {
    $r2Buckets = npx wrangler r2 bucket list 2>$null
    if ($r2Buckets) {
        Write-Host "  📊 R2 Buckets found:" -ForegroundColor Green
        $r2Buckets | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
    } else {
        Write-Host "  ✅ No R2 buckets (or none accessible)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Cannot access R2 buckets: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n6. 🎯 CLEANUP RECOMMENDATIONS:" -ForegroundColor Cyan

if ($foundOldWorkers.Count -gt 0) {
    Write-Host "`n⚠️ OLD WORKERS FOUND - CLEANUP REQUIRED:" -ForegroundColor Yellow
    Write-Host "The following workers appear to be old/unused:" -ForegroundColor White
    foreach ($oldWorker in $foundOldWorkers) {
        Write-Host "  - $oldWorker" -ForegroundColor Red
    }
    
    Write-Host "`n🗑️ TO DELETE OLD WORKERS:" -ForegroundColor Red
    Write-Host "Run these commands to delete old workers:" -ForegroundColor White
    foreach ($oldWorker in $foundOldWorkers) {
        Write-Host "  npx wrangler delete $oldWorker" -ForegroundColor Yellow
    }
    
    Write-Host "`n⚠️ WARNING: Make sure these workers are truly unused before deleting!" -ForegroundColor Red
} else {
    Write-Host "✅ NO CLEANUP NEEDED!" -ForegroundColor Green
    Write-Host "All workers appear to be current and active." -ForegroundColor White
}

Write-Host "`n7. 📊 CURRENT SYSTEM STATUS:" -ForegroundColor Cyan
Write-Host "Active Workers: $($activeWorkers.Count)" -ForegroundColor Green
Write-Host "Old Workers Found: $($foundOldWorkers.Count)" -ForegroundColor $(if ($foundOldWorkers.Count -gt 0) { "Red" } else { "Green" })

Write-Host "`n8. 🔧 USEFUL MANAGEMENT COMMANDS:" -ForegroundColor Cyan
Write-Host "View worker details: npx wrangler deployments list --name <worker-name>" -ForegroundColor White
Write-Host "Delete a worker: npx wrangler delete <worker-name>" -ForegroundColor White
Write-Host "View all secrets: npx wrangler secret list --name <worker-name>" -ForegroundColor White
Write-Host "Check account info: npx wrangler whoami" -ForegroundColor White

Write-Host "`n🏁 CLEANUP SCAN COMPLETED!" -ForegroundColor Green
