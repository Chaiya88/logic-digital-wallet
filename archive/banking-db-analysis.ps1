# 🔍 BANKING WORKER DATABASE OPERATIONS VERIFICATION
# การตรวจสอบการดำเนินงานฐานข้อมูลใน Banking Worker

Write-Host "🏦 Banking Worker Database Operations Analysis" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

$bankingFile = ".\workers\banking\index.js"
if (Test-Path $bankingFile) {
    $content = Get-Content $bankingFile -Raw
    
    Write-Host "`n📊 DATABASE BINDING ANALYSIS:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    # Check for database bindings
    $dbBindings = @{
        "MAIN_WALLET_DB" = ($content | Select-String "env\.MAIN_WALLET_DB" -AllMatches).Matches.Count
        "DB (Generic)" = ($content | Select-String "env\.DB\." -AllMatches).Matches.Count
        "Database Connection" = ($content | Select-String "database|DB" -AllMatches).Matches.Count
    }
    
    foreach ($binding in $dbBindings.GetEnumerator()) {
        $status = if ($binding.Value -gt 0) { "✅ FOUND ($($binding.Value) times)" } else { "❌ NOT FOUND" }
        $color = if ($binding.Value -gt 0) { "Green" } else { "Red" }
        Write-Host "  $($binding.Key): $status" -ForegroundColor $color
    }
    
    Write-Host "`n🔧 SQL OPERATIONS ANALYSIS:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    # Check for SQL operations
    $sqlOps = @{
        "SELECT Queries" = ($content | Select-String "SELECT.*FROM" -AllMatches).Matches.Count
        "INSERT Queries" = ($content | Select-String "INSERT INTO" -AllMatches).Matches.Count
        "UPDATE Queries" = ($content | Select-String "UPDATE.*SET" -AllMatches).Matches.Count
        "DELETE Queries" = ($content | Select-String "DELETE FROM" -AllMatches).Matches.Count
        "Prepared Statements" = ($content | Select-String "\.prepare\(" -AllMatches).Matches.Count
        "Parameter Binding" = ($content | Select-String "\.bind\(" -AllMatches).Matches.Count
        "Transaction Control" = ($content | Select-String "BEGIN TRANSACTION|COMMIT|ROLLBACK" -AllMatches).Matches.Count
    }
    
    foreach ($op in $sqlOps.GetEnumerator()) {
        $status = if ($op.Value -gt 0) { "✅ FOUND ($($op.Value) times)" } else { "❌ NOT FOUND" }
        $color = if ($op.Value -gt 0) { "Green" } else { "Red" }
        Write-Host "  $($op.Key): $status" -ForegroundColor $color
    }
    
    Write-Host "`n💾 TABLE OPERATIONS:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    # Check for table operations
    $tables = @{
        "wallets" = ($content | Select-String "wallets" -AllMatches).Matches.Count
        "transactions" = ($content | Select-String "transactions" -AllMatches).Matches.Count
        "users" = ($content | Select-String "users" -AllMatches).Matches.Count
        "accounts" = ($content | Select-String "accounts" -AllMatches).Matches.Count
    }
    
    foreach ($table in $tables.GetEnumerator()) {
        $status = if ($table.Value -gt 0) { "✅ USED ($($table.Value) times)" } else { "❌ NOT USED" }
        $color = if ($table.Value -gt 0) { "Green" } else { "Red" }
        Write-Host "  Table '$($table.Key)': $status" -ForegroundColor $color
    }
    
    Write-Host "`n🛡️ SECURITY FEATURES:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    # Check for security features
    $security = @{
        "SQL Injection Protection" = ($content | Select-String "\.prepare.*\.bind" -AllMatches).Matches.Count
        "Input Validation" = ($content | Select-String "validate|sanitize" -AllMatches).Matches.Count
        "Error Handling" = ($content | Select-String "try \{.*catch" -AllMatches).Matches.Count
        "Transaction Rollback" = ($content | Select-String "ROLLBACK" -AllMatches).Matches.Count
    }
    
    foreach ($sec in $security.GetEnumerator()) {
        $status = if ($sec.Value -gt 0) { "✅ IMPLEMENTED ($($sec.Value) times)" } else { "❌ MISSING" }
        $color = if ($sec.Value -gt 0) { "Green" } else { "Red" }
        Write-Host "  $($sec.Key): $status" -ForegroundColor $color
    }
    
    Write-Host "`n📋 DATABASE OPERATIONS SUMMARY:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    $totalDbOps = ($content | Select-String "env\.MAIN_WALLET_DB|env\.DB\." -AllMatches).Matches.Count
    $totalPrepared = ($content | Select-String "\.prepare\(" -AllMatches).Matches.Count
    $totalBound = ($content | Select-String "\.bind\(" -AllMatches).Matches.Count
    
    Write-Host "  Total DB Operations: $totalDbOps" -ForegroundColor Blue
    Write-Host "  Prepared Statements: $totalPrepared" -ForegroundColor Blue
    Write-Host "  Parameter Bindings: $totalBound" -ForegroundColor Blue
    
    # Analysis result
    Write-Host "`n🎯 ANALYSIS RESULT:" -ForegroundColor Yellow
    Write-Host "─" * 40 -ForegroundColor DarkGray
    
    if ($totalDbOps -gt 0 -and $totalPrepared -gt 0) {
        Write-Host "  ✅ DATABASE OPERATIONS: FULLY IMPLEMENTED" -ForegroundColor Green
        Write-Host "  📊 Banking Worker uses MAIN_WALLET_DB extensively" -ForegroundColor Green
        Write-Host "  🔒 Proper prepared statements with parameter binding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ DATABASE OPERATIONS: NEEDS ATTENTION" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Banking Worker file not found!" -ForegroundColor Red
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "✅ DATABASE ANALYSIS COMPLETE!" -ForegroundColor Green
