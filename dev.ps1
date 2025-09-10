# DOGLC Digital Wallet - Development Helper Script
# Quick commands for common development tasks

param(
    [Parameter(Position = 0)]
    [ValidateSet("setup", "lint", "format", "test", "deploy", "dev", "clean", "help")]
    [string]$Action = "help",

    [Parameter(Position = 1)]
    [ValidateSet("frontend", "api", "bot", "banking", "security", "all")]
    [string]$Worker = "all"
)

function Show-Help {
    Write-Host "🚀 DOGLC Digital Wallet - Development Helper" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 <action> [worker]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  setup     - Install dependencies and configure environment"
    Write-Host "  lint      - Run ESLint to check and fix code issues"
    Write-Host "  format    - Format code with Prettier"
    Write-Host "  test      - Run tests for specified worker(s)"
    Write-Host "  deploy    - Deploy worker(s) to Cloudflare"
    Write-Host "  dev       - Start development server for worker(s)"
    Write-Host "  clean     - Clean up temporary files and cache"
    Write-Host "  help      - Show this help message"
    Write-Host ""
    Write-Host "Workers:" -ForegroundColor Green
    Write-Host "  frontend  - Frontend Worker"
    Write-Host "  api       - API Worker"
    Write-Host "  bot       - Bot Worker"
    Write-Host "  banking   - Banking Worker"
    Write-Host "  security  - Security Worker"
    Write-Host "  all       - All Workers (default)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 setup"
    Write-Host "  .\dev.ps1 lint"
    Write-Host "  .\dev.ps1 deploy frontend"
    Write-Host "  .\dev.ps1 dev api"
    Write-Host "  .\dev.ps1 test all"
}

function Invoke-Setup {
    Write-Host "🔧 Setting up development environment..." -ForegroundColor Cyan

    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

        Write-Host "🎨 Formatting code..." -ForegroundColor Yellow
        npm run format

        Write-Host "🔍 Running linter..." -ForegroundColor Yellow
        npm run lint

        Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

function Invoke-Lint {
    Write-Host "🔍 Running ESLint..." -ForegroundColor Cyan
    npm run lint

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Linting completed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Linting found issues that need attention" -ForegroundColor Yellow
    }
}

function Invoke-Format {
    Write-Host "🎨 Formatting code with Prettier..." -ForegroundColor Cyan
    npm run format

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Code formatting completed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Code formatting failed" -ForegroundColor Red
        exit 1
    }
}

function Invoke-Test {
    param([string]$TargetWorker)

    Write-Host "🧪 Running tests for $TargetWorker..." -ForegroundColor Cyan

    switch ($TargetWorker) {
        "all" {
            Write-Host "Running all tests..."
            .\test-workers.ps1
        }
        "bot" {
            Write-Host "Testing Bot Worker..."
            .\test-simple-bot.ps1
        }
        default {
            Write-Host "Running comprehensive test suite..."
            .\health-check.ps1
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests completed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Some tests failed or need attention" -ForegroundColor Yellow
    }
}

function Invoke-Deploy {
    param([string]$TargetWorker)

    Write-Host "🚀 Deploying $TargetWorker worker(s)..." -ForegroundColor Cyan

    # Run linting and formatting before deployment
    Write-Host "🔍 Pre-deployment checks..." -ForegroundColor Yellow
    npm run lint
    npm run format

    if ($LASTEXITCODE -eq 0) {
        switch ($TargetWorker) {
            "all" { npm run deploy:all }
            "frontend" { npm run deploy:frontend }
            "api" { npm run deploy:api }
            "bot" { npm run deploy:bot }
            "banking" { npm run deploy:banking }
            "security" { npm run deploy:security }
            default { npm run deploy:all }
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment completed successfully" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Deployment failed" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Pre-deployment checks failed. Please fix issues before deploying." -ForegroundColor Red
        exit 1
    }
}

function Invoke-Dev {
    param([string]$TargetWorker)

    Write-Host "🔧 Starting development server for $TargetWorker..." -ForegroundColor Cyan

    switch ($TargetWorker) {
        "frontend" { npm run dev:frontend }
        "api" { npm run dev:api }
        "bot" { npm run dev:bot }
        "banking" { npm run dev:banking }
        "security" { npm run dev:security }
        "all" {
            Write-Host "Starting all development servers..."
            Write-Host "Use Ctrl+C to stop all servers"
            npm run dev:frontend &
            npm run dev:api &
            npm run dev:bot &
            npm run dev:banking &
            npm run dev:security
        }
        default { npm run dev:frontend }
    }
}

function Invoke-Clean {
    Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Cyan

    # Clean npm cache
    npm cache clean --force

    # Remove node_modules and reinstall
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
        Write-Host "📦 Removed node_modules directory" -ForegroundColor Yellow
    }

    # Clean temporary files
    Get-ChildItem -Path . -Name "temp*" | Remove-Item -Force -ErrorAction SilentlyContinue
    Get-ChildItem -Path . -Name "*.log" | Remove-Item -Force -ErrorAction SilentlyContinue

    # Reinstall dependencies
    Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
    npm install

    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "setup" { Invoke-Setup }
    "lint" { Invoke-Lint }
    "format" { Invoke-Format }
    "test" { Invoke-Test -TargetWorker $Worker }
    "deploy" { Invoke-Deploy -TargetWorker $Worker }
    "dev" { Invoke-Dev -TargetWorker $Worker }
    "clean" { Invoke-Clean }
    "help" { Show-Help }
    default { Show-Help }
}
