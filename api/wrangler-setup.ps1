# Wrangler Automated Setup Script
# สคริปต์สำหรับการติดตั้งและตั้งค่า Wrangler CLI อัตโนมัติ
# รองรับ Windows PowerShell

param(
    [string]$ProjectPath = ".",
    [string]$Environment = "production",
    [switch]$SkipGlobalInstall,
    [switch]$FixDatabase,
    [switch]$Verbose
)

# การตั้งค่าสี
$ErrorActionPreference = "Continue"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text)
    Write-Host "`n[STEP] " -NoNewline -ForegroundColor Green
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] " -NoNewline -ForegroundColor Green
    Write-Host $Text -ForegroundColor White
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARNING] " -NoNewline -ForegroundColor Yellow
    Write-Host $Text -ForegroundColor White
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] " -NoNewline -ForegroundColor Red
    Write-Host $Text -ForegroundColor White
}

function Test-Command {
    param([string]$Command)
    try {
        & $Command --version 2>$null | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Install-Wrangler {
    Write-Header "การติดตั้ง Wrangler CLI"
    
    Write-Step "ตรวจสอบการติดตั้ง Node.js และ npm"
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js ไม่ได้ติดตั้ง กรุณาติดตั้ง Node.js จาก https://nodejs.org/"
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm ไม่ได้ติดตั้ง กรุณาติดตั้ง npm"
        exit 1
    }
    
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Success "Node.js version: $nodeVersion"
    Write-Success "npm version: $npmVersion"
    
    # ติดตั้ง Wrangler แบบ Global
    if (-not $SkipGlobalInstall) {
        Write-Step "ติดตั้ง Wrangler แบบ Global"
        try {
            npm install -g wrangler@latest
            Write-Success "ติดตั้ง Wrangler แบบ Global สำเร็จ"
        } catch {
            Write-Warning "การติดตั้งแบบ Global ไม่สำเร็จ จะดำเนินการต่อด้วยการติดตั้งแบบ Local"
        }
    }
    
    # ติดตั้ง Wrangler แบบ Local
    Write-Step "ติดตั้ง Wrangler แบบ Local ในโปรเจกต์"
    
    if (Test-Path "package.json") {
        try {
            npm install --save-dev wrangler@4
            Write-Success "ติดตั้ง Wrangler แบบ Local สำเร็จ"
        } catch {
            Write-Error "การติดตั้ง Wrangler แบบ Local ไม่สำเร็จ"
            Write-Host "Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Warning "ไม่พบไฟล์ package.json ใน directory ปัจจุบัน"
        
        $createPackageJson = Read-Host "ต้องการสร้างไฟล์ package.json ใหม่หรือไม่? (y/N)"
        if ($createPackageJson -eq "y" -or $createPackageJson -eq "Y") {
            npm init -y
            npm install --save-dev wrangler@4
            Write-Success "สร้างไฟล์ package.json และติดตั้ง Wrangler สำเร็จ"
        }
    }
    
    Write-Step "ตรวจสอบเวอร์ชัน Wrangler"
    try {
        $wranglerVersion = npx wrangler --version
        Write-Success "Wrangler version: $wranglerVersion"
    } catch {
        Write-Error "ไม่สามารถตรวจสอบเวอร์ชัน Wrangler ได้"
    }
}

function Fix-WranglerConfig {
    Write-Header "การแก้ไขไฟล์การกำหนดค่า Wrangler"
    
    $configFiles = @("wrangler.toml", "wrangler.jsonc", "wrangler.json")
    $foundConfig = $false
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            Write-Step "พบไฟล์การกำหนดค่า: $configFile"
            $foundConfig = $true
            
            if ($configFile -eq "wrangler.toml") {
                Write-Step "แก้ไขไฟล์ wrangler.toml"
                
                # อ่านเนื้อหาไฟล์
                $content = Get-Content $configFile -Raw
                
                # แก้ไข database_id เป็น id
                $updatedContent = $content -replace 'database_id\s*=', 'id ='
                
                # สำรองไฟล์เดิม
                Copy-Item $configFile "$configFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                Write-Success "สำรองไฟล์เดิมเป็น $configFile.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                
                # บันทึกไฟล์ที่แก้ไขแล้ว
                Set-Content $configFile $updatedContent -Encoding UTF8
                Write-Success "แก้ไข database_id เป็น id ในไฟล์ $configFile สำเร็จ"
                
                # แสดงการเปลี่ยนแปลง
                Write-Step "ตรวจสอบการเปลี่ยนแปลง"
                $changes = Select-String -Path $configFile -Pattern "id\s*=" | ForEach-Object { $_.Line.Trim() }
                if ($changes) {
                    Write-Host "การกำหนดค่า D1 database ที่แก้ไขแล้ว:" -ForegroundColor Cyan
                    $changes | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
                }
            }
            
            break
        }
    }
    
    if (-not $foundConfig) {
        Write-Warning "ไม่พบไฟล์การกำหนดค่า Wrangler"
        
        $createConfig = Read-Host "ต้องการสร้างไฟล์ wrangler.toml พื้นฐานหรือไม่? (y/N)"
        if ($createConfig -eq "y" -or $createConfig -eq "Y") {
            Create-BasicWranglerConfig
        }
    }
}

function Create-BasicWranglerConfig {
    Write-Step "สร้างไฟล์ wrangler.toml พื้นฐาน"
    
    $workerName = Read-Host "ระบุชื่อ Worker (เช่น my-worker)"
    if (-not $workerName) { $workerName = "my-worker" }
    
    $mainFile = Read-Host "ระบุไฟล์ entry point (เช่น src/index.js หรือ index.js)"
    if (-not $mainFile) { $mainFile = "src/index.js" }
    
    $basicConfig = @"
name = "$workerName"
main = "$mainFile"
compatibility_date = "$(Get-Date -Format 'yyyy-MM-dd')"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
SERVICE_NAME = "$workerName"

[env.development]
name = "$workerName-dev"
[env.development.vars]
ENVIRONMENT = "development"

[env.staging]
name = "$workerName-staging"
[env.staging.vars]
ENVIRONMENT = "staging"
"@
    
    Set-Content "wrangler.toml" $basicConfig -Encoding UTF8
    Write-Success "สร้างไฟล์ wrangler.toml พื้นฐานสำเร็จ"
}

function Test-WranglerAuth {
    Write-Header "การตรวจสอบการยืนยันตัวตน"
    
    Write-Step "ตรวจสอบสถานะการ login"
    try {
        $authResult = npx wrangler whoami 2>&1
        if ($authResult -match "You are logged in") {
            Write-Success "ยืนยันตัวตนสำเร็จ"
            Write-Host $authResult -ForegroundColor Green
        } else {
            Write-Warning "ยังไม่ได้ทำการ login"
            
            $doLogin = Read-Host "ต้องการทำการ login ตอนนี้หรือไม่? (y/N)"
            if ($doLogin -eq "y" -or $doLogin -eq "Y") {
                Write-Step "เริ่มกระบวนการ login"
                npx wrangler login
                
                # ตรวจสอบอีกครั้ง
                $authResultAfter = npx wrangler whoami 2>&1
                if ($authResultAfter -match "You are logged in") {
                    Write-Success "Login สำเร็จ"
                } else {
                    Write-Error "Login ไม่สำเร็จ"
                }
            } else {
                Write-Host "กรุณาทำการ login ด้วยคำสั่ง: npx wrangler login" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Error "ไม่สามารถตรวจสอบสถานะการยืนยันตัวตนได้"
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

function Deploy-Worker {
    Write-Header "การ Deploy Worker"
    
    Write-Step "ตรวจสอบไฟล์ที่จำเป็น"
    
    # ตรวจสอบไฟล์การกำหนดค่า
    $configExists = Test-Path "wrangler.toml" -or (Test-Path "wrangler.jsonc") -or (Test-Path "wrangler.json")
    if (-not $configExists) {
        Write-Error "ไม่พบไฟล์การกำหนดค่า Wrangler"
        return
    }
    
    # ตรวจสอบไฟล์ main
    if (Test-Path "wrangler.toml") {
        $mainFile = (Select-String -Path "wrangler.toml" -Pattern "main\s*=\s*`"([^`"]+)`"").Matches.Groups[1].Value
    }
    
    if ($mainFile -and -not (Test-Path $mainFile)) {
        Write-Warning "ไม่พบไฟล์ entry point: $mainFile"
        
        # ค้นหาไฟล์ที่เป็นไปได้
        $possibleFiles = @("src/index.js", "index.js", "src/worker.js", "worker.js")
        foreach ($file in $possibleFiles) {
            if (Test-Path $file) {
                Write-Success "พบไฟล์ entry point: $file"
                $mainFile = $file
                break
            }
        }
    }
    
    Write-Step "เริ่มกระบวนการ Deploy"
    
    try {
        if ($Environment -eq "production") {
            npx wrangler deploy
        } else {
            npx wrangler deploy --env $Environment
        }
        Write-Success "Deploy Worker สำเร็จ"
    } catch {
        Write-Error "การ Deploy ไม่สำเร็จ"
        Write-Host "Error: $_" -ForegroundColor Red
        
        # แสดงคำแนะนำการแก้ไข
        Write-Host "`nคำแนะนำการแก้ไข:" -ForegroundColor Yellow
        Write-Host "1. ตรวจสอบว่าไฟล์ entry point มีอยู่จริง" -ForegroundColor White
        Write-Host "2. ตรวจสอบการกำหนดค่า D1 database bindings" -ForegroundColor White
        Write-Host "3. ตรวจสอบการยืนยันตัตน (npx wrangler whoami)" -ForegroundColor White
        Write-Host "4. ลองรันคำสั่ง: npx wrangler deploy --env development" -ForegroundColor White
    }
}

function Install-Dependencies {
    Write-Header "การติดตั้ง Dependencies"
    
    if (Test-Path "package.json") {
        Write-Step "ติดตั้ง npm dependencies"
        try {
            npm install
            Write-Success "ติดตั้ง dependencies สำเร็จ"
        } catch {
            Write-Error "การติดตั้ง dependencies ไม่สำเร็จ"
        }
    } else {
        Write-Warning "ไม่พบไฟล์ package.json"
    }
}

function Setup-Environment {
    Write-Header "การตั้งค่า Environment Variables"
    
    Write-Step "ตั้งค่า Environment Variables สำหรับ Wrangler"
    
    # ตั้งค่า logging
    $env:WRANGLER_LOG = "info"
    $env:FORCE_COLOR = "1"
    
    Write-Success "ตั้งค่า WRANGLER_LOG=info"
    Write-Success "ตั้งค่า FORCE_COLOR=1"
    
    # ตรวจสอบ API Token
    if ($env:CLOUDFLARE_API_TOKEN) {
        Write-Success "พบ CLOUDFLARE_API_TOKEN ในระบบ"
    } else {
        Write-Warning "ไม่พบ CLOUDFLARE_API_TOKEN"
        Write-Host "สำหรับ CI/CD แนะนำให้ตั้งค่า API Token:" -ForegroundColor Yellow
        Write-Host '$env:CLOUDFLARE_API_TOKEN="your-api-token"' -ForegroundColor Cyan
    }
}

function Create-ComprehensiveConfig {
    Write-Header "การสร้างไฟล์การกำหนดค่าแบบครบถ้วน"
    
    $workerName = Read-Host "ระบุชื่อ Worker"
    if (-not $workerName) { $workerName = "my-worker" }
    
    $comprehensiveConfig = @"
name = "$workerName"
main = "src/index.js"
compatibility_date = "$(Get-Date -Format 'yyyy-MM-dd')"
compatibility_flags = ["nodejs_compat", "streams_enable_constructors"]
node_compat = true

# การกำหนด variables
[vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"
DEBUG_MODE = "false"
SERVICE_NAME = "$workerName"

# การกำหนดค่า build (ถ้าจำเป็น)
[build]
command = "npm run build"
watch_dir = "src"

# D1 Databases binding
[[d1_databases]]
binding = "DATABASE"
database_name = "$workerName-db"
id = "your-database-id"

# KV Namespaces binding
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# R2 Buckets binding
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "$workerName-storage"

# Routes (ถ้าใช้ custom domain)
# [[routes]]
# pattern = "api.example.com/*"
# zone_name = "example.com"

# Cron Triggers (ถ้าใช้ scheduled events)
# [triggers]
# crons = ["0 0 * * *"]

# Development environment
[env.development]
name = "$workerName-dev"
[env.development.vars]
ENVIRONMENT = "development"
API_URL = "http://localhost:3000"
DEBUG_MODE = "true"

# Staging environment
[env.staging]
name = "$workerName-staging"
[env.staging.vars]
ENVIRONMENT = "staging"
API_URL = "https://staging-api.example.com"
DEBUG_MODE = "false"

# Production environment
[env.production]
name = "$workerName-prod"
[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"
DEBUG_MODE = "false"
"@
    
    if (Test-Path "wrangler.toml") {
        $overwrite = Read-Host "พบไฟล์ wrangler.toml อยู่แล้ว ต้องการเขียนทับหรือไม่? (y/N)"
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            # สำรองไฟล์เดิม
            Copy-Item "wrangler.toml" "wrangler.toml.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Set-Content "wrangler.toml" $comprehensiveConfig -Encoding UTF8
            Write-Success "สร้างไฟล์ wrangler.toml ใหม่สำเร็จ"
        }
    } else {
        Set-Content "wrangler.toml" $comprehensiveConfig -Encoding UTF8
        Write-Success "สร้างไฟล์ wrangler.toml สำเร็จ"
    }
}

function Create-PackageJsonScripts {
    Write-Header "การตั้งค่า Package.json Scripts"
    
    if (Test-Path "package.json") {
        Write-Step "อัปเดต scripts ใน package.json"
        
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        # สร้าง scripts object ถ้าไม่มี
        if (-not $packageJson.scripts) {
            $packageJson | Add-Member -Type NoteProperty -Name "scripts" -Value @{}
        }
        
        # เพิ่ม Wrangler scripts
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "dev" -Value "wrangler dev" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "deploy" -Value "wrangler deploy" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "deploy:dev" -Value "wrangler deploy --env development" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "deploy:staging" -Value "wrangler deploy --env staging" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "deploy:prod" -Value "wrangler deploy --env production" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "tail" -Value "wrangler tail" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "list" -Value "wrangler list" -Force
        $packageJson.scripts | Add-Member -Type NoteProperty -Name "whoami" -Value "wrangler whoami" -Force
        
        # บันทึกไฟล์
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
        Write-Success "อัปเดต package.json scripts สำเร็จ"
        
        Write-Host "`nสามารถใช้คำสั่งเหล่านี้ได้:" -ForegroundColor Cyan
        Write-Host "  npm run dev          # เริ่ม development server" -ForegroundColor Green
        Write-Host "  npm run deploy       # deploy production" -ForegroundColor Green
        Write-Host "  npm run deploy:dev   # deploy development" -ForegroundColor Green
        Write-Host "  npm run deploy:staging # deploy staging" -ForegroundColor Green
        Write-Host "  npm run tail         # ดู real-time logs" -ForegroundColor Green
    }
}

function Run-Diagnostics {
    Write-Header "การตรวจสอบระบบและการทดสอบ"
    
    Write-Step "ตรวจสอบการติดตั้ง"
    
    # ตรวจสอบ Node.js และ npm
    Write-Host "Node.js: " -NoNewline -ForegroundColor Cyan
    if (Test-Command "node") {
        Write-Host "$(node --version)" -ForegroundColor Green
    } else {
        Write-Host "ไม่ได้ติดตั้ง" -ForegroundColor Red
    }
    
    Write-Host "npm: " -NoNewline -ForegroundColor Cyan
    if (Test-Command "npm") {
        Write-Host "$(npm --version)" -ForegroundColor Green
    } else {
        Write-Host "ไม่ได้ติดตั้ง" -ForegroundColor Red
    }
    
    # ตรวจสอบ Wrangler
    Write-Host "Wrangler (global): " -NoNewline -ForegroundColor Cyan
    try {
        $globalVersion = wrangler --version 2>$null
        Write-Host "$globalVersion" -ForegroundColor Green
    } catch {
        Write-Host "ไม่ได้ติดตั้ง" -ForegroundColor Yellow
    }
    
    Write-Host "Wrangler (local): " -NoNewline -ForegroundColor Cyan
    try {
        $localVersion = npx wrangler --version 2>$null
        Write-Host "$localVersion" -ForegroundColor Green
    } catch {
        Write-Host "ไม่ได้ติดตั้ง" -ForegroundColor Yellow
    }
    
    # ตรวจสอบไฟล์โปรเจกต์
    Write-Step "ตรวจสอบไฟล์โปรเจกต์"
    
    $files = @{
        "package.json" = "Package configuration"
        "wrangler.toml" = "Wrangler TOML config"
        "wrangler.jsonc" = "Wrangler JSON config"
        "src/index.js" = "Main entry point (JS)"
        "src/index.ts" = "Main entry point (TS)"
        "index.js" = "Root entry point (JS)"
        "worker.js" = "Worker script"
    }
    
    foreach ($file in $files.Keys) {
        Write-Host "$($files[$file]): " -NoNewline -ForegroundColor Cyan
        if (Test-Path $file) {
            Write-Host "พบไฟล์" -ForegroundColor Green
        } else {
            Write-Host "ไม่พบ" -ForegroundColor Yellow
        }
    }
    
    # ตรวจสอบการเชื่อมต่อ Cloudflare
    Write-Step "ทดสอบการเชื่อมต่อ Cloudflare API"
    try {
        npx wrangler list | Out-Null
        Write-Success "เชื่อมต่อ Cloudflare API สำเร็จ"
    } catch {
        Write-Error "ไม่สามารถเชื่อมต่อ Cloudflare API ได้"
        Write-Host "กรุณาตรวจสอบการยืนยันตัวตนด้วยคำสั่ง: npx wrangler whoami" -ForegroundColor Yellow
    }
}

function Show-QuickCommands {
    Write-Header "คำสั่งที่ใช้บ่อยสำหรับการจัดการ Worker"
    
    Write-Host "`nคำสั่งพื้นฐาน:" -ForegroundColor Cyan
    Write-Host "  npx wrangler dev                    # เริ่ม development server" -ForegroundColor Green
    Write-Host "  npx wrangler deploy                 # deploy production" -ForegroundColor Green
    Write-Host "  npx wrangler deploy --env staging   # deploy staging" -ForegroundColor Green
    Write-Host "  npx wrangler tail                   # ดู real-time logs" -ForegroundColor Green
    Write-Host "  npx wrangler list                   # ดูรายการ Workers" -ForegroundColor Green
    Write-Host "  npx wrangler whoami                 # ตรวจสอบสถานะ login" -ForegroundColor Green
    
    Write-Host "`nการจัดการ Secrets:" -ForegroundColor Cyan
    Write-Host "  npx wrangler secret put SECRET_NAME # เพิ่ม secret" -ForegroundColor Green
    Write-Host "  npx wrangler secret list            # ดูรายการ secrets" -ForegroundColor Green
    Write-Host "  npx wrangler secret delete NAME     # ลบ secret" -ForegroundColor Green
    
    Write-Host "`nการจัดการ D1 Database:" -ForegroundColor Cyan
    Write-Host "  npx wrangler d1 list                # ดูรายการ databases" -ForegroundColor Green
    Write-Host "  npx wrangler d1 create my-db        # สร้าง database" -ForegroundColor Green
    Write-Host "  npx wrangler d1 execute my-db --command 'SELECT * FROM users'" -ForegroundColor Green
    
    Write-Host "`nการจัดการ KV Storage:" -ForegroundColor Cyan
    Write-Host "  npx wrangler kv namespace create MY_KV # สร้าง KV namespace" -ForegroundColor Green
    Write-Host "  npx wrangler kv key put --binding MY_KV key value" -ForegroundColor Green
    Write-Host "  npx wrangler kv key get --binding MY_KV key" -ForegroundColor Green
    
    Write-Host "`nการแก้ไขปัญหา:" -ForegroundColor Cyan
    Write-Host "  npx wrangler login                  # login ใหม่" -ForegroundColor Green
    Write-Host "  npx wrangler --version              # ตรวจสอบเวอร์ชัน" -ForegroundColor Green
    Write-Host "  npm install --save-dev wrangler@4   # อัปเดต Wrangler" -ForegroundColor Green
}

function Fix-DatabaseConfig {
    Write-Header "การแก้ไขปัญหา D1 Database Configuration"
    
    if (Test-Path "wrangler.toml") {
        Write-Step "ตรวจสอบและแก้ไขการกำหนดค่า D1 database"
        
        $content = Get-Content "wrangler.toml" -Raw
        
        if ($content -match "database_id") {
            Write-Step "พบการใช้ database_id ในไฟล์ กำลังแก้ไข..."
            
            # สำรองไฟล์เดิม
            Copy-Item "wrangler.toml" "wrangler.toml.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Write-Success "สำรองไฟล์เดิมแล้ว"
            
            # แก้ไข database_id เป็น id
            $updatedContent = $content -replace 'database_id\s*=', 'id ='
            
            Set-Content "wrangler.toml" $updatedContent -Encoding UTF8
            Write-Success "แก้ไข database_id เป็น id สำเร็จ"
            
            # แสดงการเปลี่ยนแปลง
            $dbConfigs = Select-String -Path "wrangler.toml" -Pattern "id\s*=" 
            if ($dbConfigs) {
                Write-Host "`nการกำหนดค่า database ที่แก้ไขแล้ว:" -ForegroundColor Cyan
                $dbConfigs | ForEach-Object { Write-Host "  $($_.Line.Trim())" -ForegroundColor Green }
            }
        } else {
            Write-Success "การกำหนดค่า D1 database ถูกต้องแล้ว"
        }
    } else {
        Write-Warning "ไม่พบไฟล์ wrangler.toml"
    }
}

function Main {
    param(
        [string]$Action = "full"
    )
    
    Write-Header "Wrangler Automated Setup Script"
    Write-Host "สคริปต์สำหรับการติดตั้งและตั้งค่า Wrangler CLI อัตโนมัติ" -ForegroundColor White
    Write-Host "เวอร์ชัน: 1.0 | สำหรับ Wrangler 4.x" -ForegroundColor Gray
    
    # เปลี่ยนไปยัง directory ที่กำหนด
    if ($ProjectPath -ne ".") {
        if (Test-Path $ProjectPath) {
            Set-Location $ProjectPath
            Write-Success "เปลี่ยนไปยัง directory: $ProjectPath"
        } else {
            Write-Error "ไม่พบ directory: $ProjectPath"
            exit 1
        }
    }
    
    Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray
    
    switch ($Action) {
        "install" {
            Install-Wrangler
        }
        "config" {
            Fix-WranglerConfig
        }
        "auth" {
            Test-WranglerAuth
        }
        "deploy" {
            Deploy-Worker
        }
        "fix" {
            Fix-DatabaseConfig
        }
        "create" {
            Create-ComprehensiveConfig
        }
        "diag" {
            Run-Diagnostics
        }
        default {
            # รันทุกขั้นตอน
            Run-Diagnostics
            Setup-Environment
            Install-Wrangler
            Install-Dependencies
            
            if ($FixDatabase) {
                Fix-DatabaseConfig
            } else {
                Fix-WranglerConfig
            }
            
            Create-PackageJsonScripts
            Test-WranglerAuth
            
            $doDeploy = Read-Host "`nต้องการทำการ deploy ตอนนี้หรือไม่? (y/N)"
            if ($doDeploy -eq "y" -or $doDeploy -eq "Y") {
                Deploy-Worker
            }
            
            Show-QuickCommands
        }
    }
    
    Write-Header "การติดตั้งและตั้งค่าเสร็จสิ้น"
    Write-Host "สคริปต์ทำงานเสร็จสิ้นเรียบร้อยแล้ว" -ForegroundColor Green
}

# การรันสคริปต์
Write-Host "เริ่มต้นการทำงานของสคริปต์..." -ForegroundColor Yellow

# ตรวจสอบ parameters
if ($args.Count -gt 0) {
    switch ($args[0]) {
        "install" { Main -Action "install" }
        "config" { Main -Action "config" }
        "auth" { Main -Action "auth" }
        "deploy" { Main -Action "deploy" }
        "fix" { Main -Action "fix" }
        "create" { Main -Action "create" }
        "diag" { Main -Action "diag" }
        default { Main }
    }
} else {
    Main
}

# ตัวอย่างการใช้งาน:
<#
# การใช้งานสคริปต์:

# รันแบบเต็ม (ทุกขั้นตอน)
.\wrangler-setup.ps1

# รันเฉพาะการติดตั้ง
.\wrangler-setup.ps1 install

# รันเฉพาะการแก้ไขไฟล์การกำหนดค่า
.\wrangler-setup.ps1 config

# รันเฉพาะการตรวจสอบการยืนยันตัวตน
.\wrangler-setup.ps1 auth

# รันเฉพาะการ deploy
.\wrangler-setup.ps1 deploy

# รันเฉพาะการแก้ไขปัญหา database config
.\wrangler-setup.ps1 fix

# รันเฉพาะการสร้างไฟล์การกำหนดค่าใหม่
.\wrangler-setup.ps1 create

# รันเฉพาะการตรวจสอบระบบ
.\wrangler-setup.ps1 diag

# การใช้งานกับ parameters
.\wrangler-setup.ps1 -ProjectPath "C:\path\to\project" -Environment "staging" -FixDatabase -Verbose

# การใช้งานโดยไม่ติดตั้ง global
.\wrangler-setup.ps1 -SkipGlobalInstall

#>