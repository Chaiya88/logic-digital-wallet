# Missing Secrets Setup Guide

## Essential Secrets (Required for basic functionality):

### 1. INTERNAL_API_KEY (All workers)
# Generate a secure random key for inter-worker communication
npx wrangler secret put INTERNAL_API_KEY --name main-bot-worker
npx wrangler secret put INTERNAL_API_KEY --name api-worker  
npx wrangler secret put INTERNAL_API_KEY --name banking-worker
npx wrangler secret put INTERNAL_API_KEY --name security-worker

### 2. TELEGRAM_WEBHOOK_SECRET (api-worker)
# Generate a secure webhook secret for Telegram
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET --name api-worker

### 3. GMAIL_WEBHOOK_SECRET (security-worker)
# For Gmail webhook verification
npx wrangler secret put GMAIL_WEBHOOK_SECRET --name security-worker

## Additional Infrastructure Needed:

### 4. SECURITY_TOKENS KV Namespace (Missing!)
# Security worker uses env.SECURITY_TOKENS but it's not in our KV list
# Need to create this namespace:
npx wrangler kv namespace create "SECURITY_TOKENS"
# Then add to wrangler-security-worker.toml

### 5. API Key Storage (api-worker)
# Used for API key validation in api_worker_complete.js
# Already uses env.SECURITY_TOKENS - same as above

## Optional/Advanced Secrets:

### 6. Admin/Management Keys
npx wrangler secret put MASTER_ADMIN_ID --name main-bot-worker
npx wrangler secret put ADMIN_API_KEY --name api-worker

### 7. External API Keys (if needed)
npx wrangler secret put TRONSCAN_API_KEY --name banking-worker
npx wrangler secret put TRON_WALLET_ADDRESS --name banking-worker

## Generate Secure Random Keys:
# Use PowerShell to generate secure keys:
# [System.Web.Security.Membership]::GeneratePassword(32, 8)
# or online: https://www.random.org/strings/

## Priority Order:
1. INTERNAL_API_KEY (Critical - all workers)
2. SECURITY_TOKENS KV namespace (Critical - security/api)  
3. TELEGRAM_WEBHOOK_SECRET (Important - webhooks)
4. GMAIL_WEBHOOK_SECRET (Important - email processing)
5. Admin keys (Optional - management)
6. External API keys (Optional - blockchain features)
