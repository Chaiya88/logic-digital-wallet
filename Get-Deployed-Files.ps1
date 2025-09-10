# Get Deployed Files Script
# สคริปต์สำหรับดูและส่งออกไฟล์ของโปรเจ็คที่ Deploy
# Script to view and export deployed project files

param(
    [string]$Action = "info",           # "info", "manifest", "export", "all"
    [string]$OutputDir = "deployed-files-export",
    [switch]$OpenReport = $false
)

# Color functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Cyan
    Write-Host ("=" * $Message.Length) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if Node.js is available
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js detected: $nodeVersion"
            return $true
        }
    } catch {}
    
    Write-Warning "Node.js not found. Some features may be limited."
    return $false
}

# Show basic deployment information
function Show-DeploymentInfo {
    Write-Header "🚀 DGWALL - ข้อมูลการ Deploy"
    
    Write-Info "Project: DGWALL - Digital Wallet Logic System"
    Write-Info "Repository: Chaiya88/logic-digital-wallet"
    Write-Info "Domain: teenoi96.org"
    
    Write-Host ""
    Write-Host "📁 Worker Files:" -ForegroundColor Yellow
    
    $workerFiles = @(
        "api_worker_complete.js",
        "banking_worker_complete.js", 
        "frontend_worker.js",
        "main_bot_worker_complete.js",
        "security_worker_complete.js",
        "ocr_commission_systems.js"
    )
    
    foreach ($file in $workerFiles) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length
            $sizeKB = [math]::Round($size / 1KB, 2)
            Write-Host "  ✅ $file ($sizeKB KB)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file (Missing)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "⚙️  Configuration Files:" -ForegroundColor Yellow
    
    $configFiles = @(
        "wrangler.toml",
        "api/wrangler.toml"
    )
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file (Missing)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🔄 Deployment History:" -ForegroundColor Yellow
    
    if (Test-Path "api/current_deployments.txt") {
        $deployments = Get-Content "api/current_deployments.txt" | Where-Object { $_ -match "Created:" } | Select-Object -First 3
        foreach ($deployment in $deployments) {
            $created = $deployment -replace "Created:\s*", ""
            Write-Host "  📅 $created" -ForegroundColor Cyan
        }
    } else {
        Write-Warning "Deployment history not found"
    }
}

# Generate deployment manifest
function New-DeploymentManifest {
    Write-Header "📋 Creating Deployment Manifest"
    
    if (Test-NodeJS) {
        Write-Info "Running Node.js deployment manifest generator..."
        try {
            node deployment-manifest.js
            Write-Success "Manifest generated successfully"
            
            if (Test-Path "deployment-manifest.html") {
                Write-Success "HTML report: deployment-manifest.html"
            }
            if (Test-Path "deployment-manifest.json") {
                Write-Success "JSON manifest: deployment-manifest.json"
            }
        } catch {
            Write-Error "Failed to run Node.js generator: $_"
            New-PowerShellManifest
        }
    } else {
        New-PowerShellManifest
    }
}

# Fallback PowerShell manifest generation
function New-PowerShellManifest {
    Write-Info "Creating manifest using PowerShell..."
    
    $manifest = @{
        generated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        project = "DGWALL - Digital Wallet Logic System"
        components = @{
            workers = @{
                description = "Cloudflare Workers - Core application logic"
                files = @()
            }
            configurations = @{
                description = "Wrangler configuration files"
                files = @()
            }
        }
        summary = @{
            totalFiles = 0
            lastGenerated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }
    }
    
    # Check worker files
    $workerFiles = @(
        "api_worker_complete.js",
        "banking_worker_complete.js", 
        "frontend_worker.js",
        "main_bot_worker_complete.js",
        "security_worker_complete.js",
        "ocr_commission_systems.js"
    )
    
    foreach ($file in $workerFiles) {
        if (Test-Path $file) {
            $fileInfo = Get-Item $file
            $manifest.components.workers.files += @{
                path = $file
                size = $fileInfo.Length
                modified = $fileInfo.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                exists = $true
            }
            $manifest.summary.totalFiles++
        }
    }
    
    # Save manifest
    $manifestJson = $manifest | ConvertTo-Json -Depth 10
    $manifestJson | Out-File "deployment-manifest.json" -Encoding UTF8
    Write-Success "PowerShell manifest saved to deployment-manifest.json"
}

# Export deployed files
function Export-DeployedFiles {
    Write-Header "📦 Exporting Deployed Files to $OutputDir"
    
    if (Test-NodeJS) {
        Write-Info "Running Node.js export script..."
        try {
            node export-deployed-files.js $OutputDir
            Write-Success "Export completed using Node.js"
        } catch {
            Write-Error "Node.js export failed: $_"
            Export-PowerShellFiles
        }
    } else {
        Export-PowerShellFiles
    }
}

# Fallback PowerShell export
function Export-PowerShellFiles {
    Write-Info "Exporting files using PowerShell..."
    
    # Create output directory
    if (Test-Path $OutputDir) {
        Remove-Item $OutputDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    
    # Create subdirectories
    @("workers", "config", "docs", "deployment") | ForEach-Object {
        New-Item -ItemType Directory -Path "$OutputDir/$_" -Force | Out-Null
    }
    
    Write-Info "Created export directory structure"
    
    # Copy worker files
    $workerFiles = @(
        "api_worker_complete.js",
        "banking_worker_complete.js", 
        "frontend_worker.js",
        "main_bot_worker_complete.js",
        "security_worker_complete.js",
        "ocr_commission_systems.js"
    )
    
    foreach ($file in $workerFiles) {
        if (Test-Path $file) {
            Copy-Item $file "$OutputDir/workers/" -Force
            Write-Success "Copied $file"
        }
    }
    
    # Copy config files
    if (Test-Path "wrangler.toml") {
        Copy-Item "wrangler.toml" "$OutputDir/config/" -Force
        Write-Success "Copied wrangler.toml"
    }
    
    if (Test-Path "api/wrangler.toml") {
        Copy-Item "api/wrangler.toml" "$OutputDir/config/api-wrangler.toml" -Force
        Write-Success "Copied api/wrangler.toml"
    }
    
    # Copy documentation
    if (Test-Path "README.md") {
        Copy-Item "README.md" "$OutputDir/docs/" -Force
        Write-Success "Copied README.md"
    }
    
    # Copy deployment files
    if (Test-Path ".github/workflows") {
        Copy-Item ".github/workflows/*" "$OutputDir/deployment/" -Force -Recurse
        Write-Success "Copied GitHub workflows"
    }
    
    # Create export summary
    $summary = @"
# DGWALL - Exported Files Summary
สรุปไฟล์ที่ส่งออก

## Export Information
- Generated: $(Get-Date)
- Output Directory: $OutputDir
- Method: PowerShell Export

## Directories
- workers/    - Cloudflare Worker files
- config/     - Configuration files  
- docs/       - Documentation
- deployment/ - Deployment workflows

## Usage
1. Review files in each directory
2. Use worker files for deployment
3. Check config files for environment setup
4. Follow deployment guides in docs/

Generated by Get-Deployed-Files.ps1
"@
    
    $summary | Out-File "$OutputDir/README.md" -Encoding UTF8
    Write-Success "Created export summary"
    Write-Success "Export completed to: $OutputDir"
}

# Open HTML report if available
function Open-Report {
    if (Test-Path "deployment-manifest.html") {
        Write-Info "Opening deployment report..."
        Start-Process "deployment-manifest.html"
    } else {
        Write-Warning "HTML report not found"
    }
}

# Main execution
Write-Host ""
Write-Host "🚀 DGWALL - Get Deployed Files" -ForegroundColor Cyan
Write-Host "สคริปต์สำหรับดูและส่งออกไฟล์ของโปรเจ็คที่ Deploy" -ForegroundColor Cyan
Write-Host ""

switch ($Action.ToLower()) {
    "info" {
        Show-DeploymentInfo
    }
    "manifest" {
        New-DeploymentManifest
        if ($OpenReport) { Open-Report }
    }
    "export" {
        Export-DeployedFiles
    }
    "all" {
        Show-DeploymentInfo
        Write-Host ""
        New-DeploymentManifest
        Write-Host ""
        Export-DeployedFiles
        if ($OpenReport) { Open-Report }
    }
    default {
        Write-Error "Invalid action. Use: info, manifest, export, or all"
        Write-Host ""
        Write-Host "Usage Examples:" -ForegroundColor Yellow
        Write-Host "  .\Get-Deployed-Files.ps1 info                    # Show deployment info"
        Write-Host "  .\Get-Deployed-Files.ps1 manifest               # Generate manifest"  
        Write-Host "  .\Get-Deployed-Files.ps1 export                 # Export files"
        Write-Host "  .\Get-Deployed-Files.ps1 all -OpenReport        # Do everything & open report"
        exit 1
    }
}

Write-Host ""
Write-Success "Operation completed successfully!"