param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$true)]
    [string]$CloudflareAccountId,
    
    [Parameter(Mandatory=$true)]
    [string]$CloudflareGlobalApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$CloudflareEmail,
    
    [Parameter(Mandatory=$true)]
    [string]$WorkerDomain,
    
    [Parameter(Mandatory=$true)]
    [string]$RepositoryOwner,
    
    [Parameter(Mandatory=$true)]
    [string]$RepositoryName
)

# Global variables
$Script:ErrorActionPreference = "Stop"

# Utility Functions
function Write-StatusMessage {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-StepMessage {
    param([string]$Message)
    Write-Host "  -> $Message" -ForegroundColor Gray
}

function New-SecureRandomKey {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Test-Prerequisites {
    Write-StatusMessage "Checking prerequisites..." "Yellow"
    
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed or not in PATH"
    }
    Write-StepMessage "Git: Available"
    
    if (!(Test-Path ".git" -PathType Container)) {
        Write-StepMessage "Initializing Git repository..."
        & git init
        & git branch -M main
    }
    Write-StepMessage "Git repository: Confirmed"
}

function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    try {
        # Use GitHub CLI if available
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            $env:GH_TOKEN = $GitHubToken
            & gh secret set $SecretName --body $SecretValue --repo "$RepositoryOwner/$RepositoryName"
            Write-StepMessage "Secret set via GitHub CLI: $SecretName"
        } else {
            Write-StepMessage "GitHub CLI not available, will use manual setup for: $SecretName"
        }
    } catch {
        Write-Warning "Failed to set secret $SecretName"
    }
}

function New-DirectoryStructure {
    Write-StatusMessage "Creating project directory structure..." "Yellow"
    
    $directories = @(
        ".github\workflows",
        "api\src",
        "api\migrations", 
        "scripts",
        "docs"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-StepMessage "Created: $dir"
        }
    }
}

function New-WorkflowFiles {
    Write-StatusMessage "Creating GitHub Actions workflow files..." "Yellow"
    
    # Create chatops-deploy.yml using here-string that won't conflict with PowerShell
    $chatopsContent = @'
name: ChatOps Deploy

on:
  issue_comment:
    types: [created]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: >
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/deploy') &&
      (github.event.comment.author_association == 'OWNER' ||
       github.event.comment.author_association == 'MEMBER' ||
       github.event.comment.author_association == 'COLLABORATOR')
    
    steps:
      - name: Add rocket reaction
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.reactions.createForIssueComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              comment_id: context.payload.comment.id,
              content: 'rocket'
            });

      - name: Get PR details
        id: pr_details
        uses: actions/github-script@v7
        with:
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.issue.number
            });
            return {
              ref: pr.data.head.ref,
              sha: pr.data.head.sha
            };

      - name: Checkout PR branch
        uses: actions/checkout@v4
        with:
          ref: ${{ fromJson(steps.pr_details.outputs.result).ref }}
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json

      - name: Install dependencies
        working-directory: ./api
        run: npm ci

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_WORKERS_DEPLOY_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: deploy --env production
          workingDirectory: ./api

      - name: Comment deployment success
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.issue.number,
              body: `🚀 **Deployment Successful**
              
**Commit:** \`${{ fromJson(steps.pr_details.outputs.result).sha }}\`
**Triggered by:** @${{ github.event.comment.user.login }}
**Time:** ${new Date().toISOString()}`
            });

      - name: Comment deployment failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.issue.number,
              body: `❌ **Deployment Failed** - Check workflow logs for details`
            });
'@

    # Create migrate.yml
    $migrateContent = @'
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      migration_type:
        description: 'Migration operation'
        required: true
        default: 'apply'
        type: choice
        options:
          - apply
          - status
      environment:
        description: 'Target environment'
        required: true
        default: 'production'
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    name: Database Migration
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json

      - name: Install dependencies
        working-directory: ./api
        run: npm ci

      - name: Run migrations
        working-directory: ./api
        run: npx wrangler d1 migrations apply ${{ github.event.inputs.environment }}-database
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_D1_MIGRATE_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
'@

    # Write workflow files using UTF8 encoding without BOM
    [System.IO.File]::WriteAllText("$PWD\.github\workflows\chatops-deploy.yml", $chatopsContent, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText("$PWD\.github\workflows\migrate.yml", $migrateContent, [System.Text.UTF8Encoding]::new($false))
    
    Write-StepMessage "Created workflow files"
}

function New-APIWorkerFiles {
    Write-StatusMessage "Creating API Worker files..." "Yellow"
    
    # Worker source code
    $workerCode = @'
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    try {
      switch (url.pathname) {
        case '/internal/audit':
          if (request.method === 'POST') {
            return await handleAuditLog(request, env, corsHeaders);
          }
          break;
          
        case '/health':
          return await handleHealthCheck(env, corsHeaders);
          
        case '/api/status':
          return await handleStatusCheck(env, corsHeaders);
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            service: 'Digital Wallet API',
            endpoints: ['/health', '/api/status', '/internal/audit']
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleAuditLog(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== env.AUDIT_SHARED_KEY) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const { event_type, user, metadata } = body;
  
  if (!event_type || !user) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const auditRecord = {
    id: crypto.randomUUID(),
    event_type,
    user,
    metadata: JSON.stringify(metadata || {}),
    timestamp: new Date().toISOString(),
    ip_address: request.headers.get('CF-Connecting-IP') || 'unknown'
  };
  
  if (env.DATABASE) {
    const stmt = env.DATABASE.prepare(`
      INSERT INTO audit_events (id, event_type, user, metadata, timestamp, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      auditRecord.id,
      auditRecord.event_type,
      auditRecord.user,
      auditRecord.metadata,
      auditRecord.timestamp,
      auditRecord.ip_address
    ).run();
  }
  
  return new Response(JSON.stringify({
    success: true,
    audit_id: auditRecord.id
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleHealthCheck(env, corsHeaders) {
  try {
    let dbStatus = 'unknown';
    if (env.DATABASE) {
      const stmt = env.DATABASE.prepare('SELECT 1 as test');
      await stmt.first();
      dbStatus = 'connected';
    }
    
    return new Response(JSON.stringify({
      status: 'healthy',
      service: 'Digital Wallet API',
      database: dbStatus,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleStatusCheck(env, corsHeaders) {
  return new Response(JSON.stringify({
    status: 'operational',
    service: 'Digital Wallet API',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
'@

    [System.IO.File]::WriteAllText("$PWD\api\src\index.js", $workerCode, [System.Text.UTF8Encoding]::new($false))
    
    # wrangler.toml
    $wranglerConfig = @"
name = "logic-digital-wallet-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
SERVICE_NAME = "Digital Wallet API"

[[d1_databases]]
binding = "DATABASE"
database_name = "wallet-production-db"
database_id = "$CloudflareAccountId-prod-db"

[env.development]
name = "logic-digital-wallet-api-dev"

[env.development.vars]
ENVIRONMENT = "development"

[[env.development.d1_databases]]
binding = "DATABASE"
database_name = "wallet-development-db"
database_id = "$CloudflareAccountId-dev-db"

[env.staging]
name = "logic-digital-wallet-api-staging"

[env.staging.vars]
ENVIRONMENT = "staging"

[[env.staging.d1_databases]]
binding = "DATABASE"
database_name = "wallet-staging-db"
database_id = "$CloudflareAccountId-staging-db"
"@

    $wranglerConfig | Out-File -FilePath "api\wrangler.toml" -Encoding UTF8 -NoNewline
    
    # package.json
    $packageJson = @'
{
  "name": "logic-digital-wallet-api",
  "version": "1.0.0",
  "description": "Digital Wallet API with ChatOps support",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:dev": "wrangler deploy --env development"
  },
  "keywords": ["digital-wallet", "cloudflare", "workers"],
  "author": "Chatya88",
  "license": "MIT",
  "devDependencies": {
    "wrangler": "^3.78.0"
  }
}
'@

    [System.IO.File]::WriteAllText("$PWD\api\package.json", $packageJson, [System.Text.UTF8Encoding]::new($false))
    
    Write-StepMessage "Created API Worker files"
}

function New-DatabaseMigrations {
    Write-StatusMessage "Creating database migrations..." "Yellow"
    
    $auditMigration = @"
-- Digital Wallet Audit Events Table
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  timestamp TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user);

INSERT INTO audit_events (id, event_type, user, metadata, timestamp, ip_address)
VALUES ('$(New-Guid)', 'system_init', 'setup_script', '{"version": "1.0.0"}', '$(Get-Date -Format "o")', 'localhost');
"@

    $auditMigration | Out-File -FilePath "api\migrations\0001_create_audit_events.sql" -Encoding UTF8 -NoNewline
    
    $walletMigration = @"
-- Digital Wallet Core Tables  
-- Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  balance DECIMAL(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);
"@

    $walletMigration | Out-File -FilePath "api\migrations\0002_create_wallet_tables.sql" -Encoding UTF8 -NoNewline
    
    Write-StepMessage "Created migration files"
}

function New-Documentation {
    Write-StatusMessage "Creating documentation..." "Yellow"
    
    $readme = @"
# Digital Wallet Logic System

ChatOps deployment system for secure digital wallet operations.

## Setup Complete

The following components have been configured:
- GitHub Actions workflows for automated deployment
- API Worker for digital wallet operations  
- Database migrations for wallet functionality
- Audit logging for security compliance

## Usage

### ChatOps Commands
Comment `/deploy api-worker` on Pull Requests to trigger deployment.

### API Endpoints
- GET /health - System health status
- GET /api/status - Service status
- POST /internal/audit - Audit logging (internal use)

## Next Steps

1. Navigate to api directory: ``cd api``
2. Install dependencies: ``npm install``  
3. Deploy worker: ``npx wrangler deploy``
4. Run migrations: ``npx wrangler d1 migrations apply wallet-production-db``

## Configuration

- Account ID: $CloudflareAccountId
- Repository: $RepositoryOwner/$RepositoryName
- Setup Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

    $readme | Out-File -FilePath "README.md" -Encoding UTF8 -NoNewline
    
    $gitignore = @"
node_modules/
.env
.env.local
*.log
.DS_Store
.wrangler/
*.sql
"@

    $gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8 -NoNewline
    
    Write-StepMessage "Created documentation files"
}

# Main execution
try {
    Write-Host ""
    Write-Host "Digital Wallet ChatOps Setup" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    Test-Prerequisites
    
    Write-StatusMessage "Generating secure audit key..."
    $auditKey = New-SecureRandomKey
    
    Write-StatusMessage "Setting up GitHub secrets..." "Yellow"
    
    $secrets = @{
        "CF_ACCOUNT_ID" = $CloudflareAccountId
        "CF_WORKERS_DEPLOY_TOKEN" = $CloudflareGlobalApiKey
        "CF_D1_MIGRATE_TOKEN" = $CloudflareGlobalApiKey
        "CF_BACKUP_R2_TOKEN" = $CloudflareGlobalApiKey
        "AUDIT_SHARED_KEY" = $auditKey
    }
    
    foreach ($secret in $secrets.GetEnumerator()) {
        Set-GitHubSecret -SecretName $secret.Key -SecretValue $secret.Value
    }
    
    New-DirectoryStructure
    New-WorkflowFiles
    New-APIWorkerFiles
    New-DatabaseMigrations
    New-Documentation
    
    Write-StatusMessage "Committing changes..." "Yellow"
    
    & git add .
    & git commit -m "feat: Add ChatOps deployment system for Digital Wallet

- GitHub Actions workflows for deployment automation
- API Worker with audit logging capabilities
- Database migrations for wallet operations
- Comprehensive documentation

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    Write-Host ""
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "===============" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generated Components:" -ForegroundColor Cyan
    Write-Host "  • GitHub Actions Workflows" -ForegroundColor White
    Write-Host "  • Digital Wallet API Worker" -ForegroundColor White  
    Write-Host "  • Database Migration Files" -ForegroundColor White
    Write-Host "  • Security Configuration" -ForegroundColor White
    Write-Host "  • Project Documentation" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. cd api" -ForegroundColor White
    Write-Host "  2. npm install" -ForegroundColor White
    Write-Host "  3. npx wrangler secret put AUDIT_SHARED_KEY" -ForegroundColor White
    Write-Host "  4. npx wrangler deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "Audit Key: $auditKey" -ForegroundColor Magenta
    Write-Host "(Save this key - needed for step 3)" -ForegroundColor Gray
    
} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}
