param(
  [string]$ProjectRoot = ".",
  [string]$BankingConfig = "workers/banking/wrangler.toml",
  [string]$SecurityConfig = "workers/security/wrangler.toml",
  [int]$BankingPort = 8789,
  [int]$SecurityPort = 8790,
  [switch]$SkipHealth,
  [switch]$VerboseSQL,
  [switch]$ShowTableRaw
)

$global:DIAG = [ordered]@{ Errors=@(); Warnings=@(); Info=@() }
function Add-Err($m){ $DIAG.Errors+= $m; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Add-Warn($m){ $DIAG.Warnings+= $m; Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Add-Info($m){ $DIAG.Info+= $m; Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Section($t){ Write-Host "`n========== $t ==========" -ForegroundColor Magenta }

Add-Info "Diagnostic script start: $(Get-Date -Format o)"

Section "Environment Version Checks"
$psver = $PSVersionTable.PSVersion
Add-Info "PowerShell Version: $psver"
$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue)?.Source
$npmPath  = (Get-Command npm.cmd -ErrorAction SilentlyContinue)?.Source
if(-not $nodePath){ Add-Err "ไม่พบ node" } else { Add-Info "Node Path: $nodePath" }
if(-not $npmPath){ Add-Err "ไม่พบ npm" } else { Add-Info "npm Path: $npmPath" }
if($nodePath){ Add-Info "Node Version: $(node --version 2>$null)" }
if($npmPath){ Add-Info "npm Version: $(npm --version 2>$null)" }
try{
  $wranglerVer = (npx --yes wrangler --version) 2>$null
  if($wranglerVer){ Add-Info "Wrangler Version: $wranglerVer" } else { Add-Warn "อ่าน wrangler version ไม่ได้" }
}catch{ Add-Warn "เรียก wrangler ไม่สำเร็จ: $($_.Exception.Message)" }

Section "Project Root & package.json"
if(-not (Test-Path $ProjectRoot)){ Add-Err "ProjectRoot ไม่พบ: $ProjectRoot"; goto Summary }
Set-Location $ProjectRoot
if(-not (Test-Path package.json)){ Add-Err "ไม่พบ package.json"; goto Summary }
try{ $pkg = Get-Content package.json -Raw | ConvertFrom-Json }catch{ Add-Err "parse package.json fail: $($_.Exception.Message)"; goto Summary }
if($pkg.workspaces){ Add-Info "Workspaces: $([string]::Join(', ',@($pkg.workspaces)))" } else { Add-Warn "ไม่มี workspaces" }
foreach($s in @("dev:banking","dev:security")){
  if(-not ($pkg.scripts.PSObject.Properties.Name -contains $s)){ Add-Warn "ขาด script $s" } else { Add-Info "พบ script $s => $($pkg.scripts.$s)" }
}

Section "@logic/shared"
if(-not (Test-Path packages/shared/package.json)){
  Add-Warn "ยังไม่มี shared package"
}else{
  try { $sp = Get-Content packages/shared/package.json -Raw | ConvertFrom-Json }catch{ Add-Err "อ่าน shared/package.json ไม่ได้: $($_.Exception.Message)"; goto NextTables }
  Add-Info "@logic/shared version: $($sp.version)"
  $deps = @()
  if($sp.dependencies){ $deps = $sp.dependencies | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name }
  foreach($d in @("ulid","zod")){
    if($deps -contains $d){ Add-Info "dep ok: $d" } else { Add-Warn "missing dep: $d" }
  }
  if(-not (Test-Path packages/shared/src/index.ts)){ Add-Warn "missing shared/src/index.ts" }
}

Section "Wrangler Config"
function TestCfg($p){
  if(-not (Test-Path $p)){ Add-Err "ไม่พบ $p"; return $false }
  $c = Get-Content $p -Raw
  if($c -match "DB_MAIN"){ Add-Info "Config $p มี DB_MAIN" } else { Add-Warn "Config $p ไม่มี DB_MAIN" }
  return $true
}
$bankingOk = TestCfg $BankingConfig
$securityOk = TestCfg $SecurityConfig

Section "Tables"
$expected = @("accounts","ledger_entries","pending_deposits","withdrawals","users","auth_credentials","sessions","access_logs","risk_flags")
function ParseTables($raw){
  $names=@()
  $lines=$raw -split "`r?`n"
  foreach($L in $lines){
    if($L -match "│"){
      $clean=($L -replace '│','').Trim()
      if($clean -and $clean -ne 'name' -and $clean -ne '_cf_METADATA' -and $clean -notmatch '─' -and $clean -match '^[A-Za-z0-9_]+$'){
        $names+=$clean
      }
    }
  }
  if($names.Count -eq 0){
    $maybe = [regex]::Matches($raw,'\b[A-Za-z_][A-Za-z0-9_]+\b') | ForEach-Object { $_.Value } | Select-Object -Unique
    $names = $maybe | Where-Object { $_ -in $expected }
  }
  $names | Sort-Object -Unique
}
if($bankingOk){
  try{
    $raw = wrangler d1 execute DB_MAIN --local --config $BankingConfig --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>&1
    if($ShowTableRaw){ Write-Host $raw -ForegroundColor DarkGray }
    $tables = ParseTables $raw
    if($tables.Count -gt 0){ Add-Info "Tables: $([string]::Join(', ',$tables))" } else { Add-Warn "ไม่พบตาราง" }
    $missing = @()
    foreach($t in $expected){ if(-not ($tables -contains $t)){ $missing+=$t } }
    if($missing.Count -gt 0){ Add-Warn "ยังขาด: $([string]::Join(', ',$missing))" } else { if($tables.Count -gt 0){ Add-Info "ตารางหลักครบ" } }
  }catch{ Add-Err "Query tables fail: $($_.Exception.Message)" }
}

Section "Worker Sources"
function CheckWorker($name,$file,$need){
  if(-not (Test-Path $file)){ Add-Err "$($name): ไม่มีไฟล์ $file"; return }
  $code = Get-Content $file -Raw
  if($code -notmatch "/health"){ Add-Warn "$($name): ไม่มี /health" } else { Add-Info "$($name): /health OK" }
  foreach($n in $need){
    if($code -notmatch $n){ Add-Warn "$($name): ไม่มี endpoint $n" } else { Add-Info "$($name): endpoint $n OK" }
  }
}
CheckWorker "Banking" "workers/banking/src/index.ts" @("/accounts")
CheckWorker "Security" "workers/security/src/index.ts" @("/users")

Section "Health Probe"
if($SkipHealth){
  Add-Info "SkipHealth = true ข้าม"
}else{
  function Probe($label,$script,$port){
    Write-Host "-- Start $label (port $port)" -ForegroundColor Magenta
    if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue){
      Add-Warn "$($label): พอร์ต $port ถูกใช้งานอยู่"; return
    }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    $psi.Arguments = "/c npm run $script -- --port $port --log-level=info"
    $psi.WorkingDirectory = (Get-Location).Path
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    $null = $p.Start()
    $deadline = (Get-Date).AddSeconds(35)
    $ok = $false
    while((Get-Date) -lt $deadline -and -not $ok){
      Start-Sleep -Milliseconds 900
      if($p.HasExited){
        Add-Err "$($label): process exited early"
        $stderr = $p.StandardError.ReadToEnd()
        if($stderr){ Add-Warn "$($label) stderr: $stderr" }
        break
      }
      try{
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$port/health" -UseBasicParsing -TimeoutSec 3
        if($r.StatusCode -eq 200){
          Add-Info "$($label) /health OK: $($r.Content)"
          $ok = $true
        }
      }catch{}
    }
    if(-not $ok -and -not $p.HasExited){
      Add-Warn "$($label): timeout /health"
    }
    try{ $p.Kill() }catch{}
  }
  if($pkg.scripts."dev:banking"){ Probe "BankingWorker" "dev:banking" $BankingPort } else { Add-Warn "ไม่มี script dev:banking" }
  if($pkg.scripts."dev:security"){ Probe "SecurityWorker" "dev:security" $SecurityPort } else { Add-Warn "ไม่มี script dev:security" }
}

Section "Summary"
Write-Host "Errors  : $($DIAG.Errors.Count)" -ForegroundColor Red
Write-Host "Warnings: $($DIAG.Warnings.Count)" -ForegroundColor Yellow
Write-Host "Info    : $($DIAG.Info.Count)" -ForegroundColor Cyan

if($DIAG.Errors.Count -eq 0 -and $DIAG.Warnings.Count -eq 0){
  Write-Host "STATUS: PASS" -ForegroundColor Green
  exit 0
}elseif($DIAG.Errors.Count -eq 0){
  Write-Host "STATUS: PASS with WARNINGS" -ForegroundColor Yellow
  exit 1
}else{
  Write-Host "STATUS: FAIL" -ForegroundColor Red
  exit 2
}
