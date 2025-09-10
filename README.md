# 🪙 DIGITAL WALLET PLATFORM - PRODUCTION READY
**Status**: ✅ **PRODUCTION READY** | **Success Rate**: 100% (18/18 tests passed)
**Last Updated**: September 11, 2025

## 🚀 Production Endpoints
- 🌐 **Main Site**: https://teenoi96.org/
- 📱 **Telegram Bot**: https://teenoi96.org/bot/
- 💻 **Web Application**: https://teenoi96.org/app/
- � **API Documentation**: https://teenoi96.org/api/docs

## 🏗️ System Architecture
- **Platform**: Cloudflare Workers Edge Computing
- **Workers**: 5 specialized microservices (335.4 KB total)
- **Database**: 2 D1 SQLite databases
- **Storage**: 7 KV Namespaces + 2 R2 Buckets
- **Performance**: <150ms average response time
- **Security**: End-to-end encryption with SSL/TLS

## ⚙️ Worker Services
1. 🤖 **Main Bot Worker** (40.1 KB) - Telegram integration
2. 🔌 **API Worker** (65.3 KB) - RESTful API services  
3. 🏦 **Banking Worker** (89.4 KB) - Financial operations
4. 🔒 **Security Worker** (64.4 KB) - Authentication & OCR
5. 🎨 **Frontend Worker** (76.2 KB) - Web interface

## ✨ Core Features
- 💰 Digital Wallet (DOGLC Token)
- 🔄 Multi-currency Exchange (THB/USDT/DOGLC)
- 🏧 Thai Banking Integration
- 🤖 Telegram Bot Interface
- � Progressive Web App
- 🔐 Multi-factor Authentication
- 📊 Real-time Analytics
- 🌍 Multi-language Support

## 📁 Project Structure
```
logic-digital-wallet/
├── 🚀 production-ready/     # Deployment package (ready for production)
├── ⚙️  workers/             # Source code for all 5 workers
├── 📝 utils/               # Utility scripts and tools
├── � reports/             # Test reports and analytics
├── 📦 archive/             # Development files archive
├── 📄 package.json         # Node.js dependencies
└── 📄 README.md           # This file
```

## � Technical Specifications
- **Runtime**: Cloudflare Workers (V8 JavaScript)
- **Databases**: `doglc-wallet-main`, `doglc-banking-system`
- **Authentication**: JWT + Session management
- **Rate Limiting**: 100 requests/minute per user
- **File Storage**: R2 buckets for receipts and images

## 🔧 Deployment Information
- **Account**: Doglc BBJ (85bcd386f06541844632ecb984afa9fb)
- **Environment**: Production
- **Domain**: teenoi96.org (SSL certificate active)
- **CDN**: Global edge locations
- **Monitoring**: Real-time health checks

## 🏆 Test Results
- **Total Tests**: 18 comprehensive tests
- **Success Rate**: 100% (18/18 passed)
- **Domain Tests**: ✅ All endpoints responding
- **Performance**: ✅ <150ms response times
- **Security**: ✅ SSL/HTTPS working
- **Workers**: ✅ All 5 deployed successfully

## 📋 Quick Start
1. **Users**: Visit https://teenoi96.org/app/
2. **Telegram**: Start bot at https://teenoi96.org/bot/
3. **Developers**: Check API docs at https://teenoi96.org/api/docs
4. **Admin**: Use production-ready/ package for deployment

---
**🎉 System Status**: FULLY OPERATIONAL | **� Ready for Users**
- **KV Namespaces**: User sessions, webhooks, notifications
- **D1 Databases**: Main wallet DB (`doglc-wallet-main`)
- **Service Bindings**: Inter-worker communication

## 🚀 Quick Start

### Prerequisites
```bash
npm install -g wrangler
npm install
```

### Deploy All Workers
```bash
# Deploy all workers at once
./deploy-all-workers.ps1

# Or deploy individually:
cd workers/main-bot && npx wrangler deploy
cd workers/api && npx wrangler deploy  
cd workers/banking && npx wrangler deploy
cd workers/security && npx wrangler deploy
cd workers/frontend && npx wrangler deploy
```

### Test the Bot
🔗 **Telegram Bot**: https://t.me/DoglcWallet_Bot

### Features
✅ **USDT Transfers** - Send USDT to TRC-20 addresses  
✅ **THB Deposits** - Deposit Thai Baht with exchange rates  
✅ **Wallet Addresses** - Generate receiving addresses  
✅ **Transaction History** - View transaction records  
✅ **Balance Checking** - Check THB and USDT balances  

## 🧪 Testing

### Run Tests
```bash
# Basic functionality test
./scripts/tests/test-updated-features.ps1

# Manual testing guide
See docs/testing/TESTING-GUIDE-NEW.md
```

# Deploy orchestrator (optional)
npx wrangler deploy --config wrangler.toml
```

## Configuration

Set required secrets for each worker:
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN --name main-bot-worker
npx wrangler secret put INTERNAL_API_KEY --name main-bot-worker
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET --name api-worker
```

## Service Bindings

Workers communicate via service bindings instead of HTTP calls:
- `env.BANKING.fetch()` - Call banking worker
- `env.SECURITY.fetch()` - Call security worker  
- `env.MAIN_BOT.fetch()` - Call bot worker
- `env.API_WORKER.fetch()` - Call API worker

## Routes

- `teenoi96.org/api/*` → API Worker
- `teenoi96.org/bot/*` → Main Bot Worker
- `teenoi96.org/app/*` → Frontend Worker
- `teenoi96.org/wallet/*` → Frontend Worker

```pwsh
npm install -g wrangler   # if not installed
wrangler dev security_worker_complete.js --local
```

## Deploy Example
```pwsh
wrangler deploy security_worker_complete.js
```

## Slip OCR & Bank Email Verification (Phase 1)
The security worker implements an automated deposit verification flow:
1. Client submits slip image (Base64) to `POST /verification/submit-slip` (Security Worker) with internal API key header.
2. Worker performs lightweight heuristic OCR (no external provider yet) extracting amount/bank/account/date.
3. Pending verification stored in `PENDING_VERIFICATIONS` KV.
4. Bank email webhook (e.g. Gmail push via Pub/Sub -> webhook) calls `POST /webhook/bank-email` with base64 email payload.
5. Email parser extracts amount/reference and matches a pending slip (same amount within 24h).
6. On match: confirms deposit via Banking Worker `/fiat/deposit/confirm`.
7. On failure/no match: record kept for manual review (`unmatched_email_*`).

### Language Support (i18n)
Slip verification endpoint `POST /verification/submit-slip` accepts optional field `lang` (one of: `th`, `en`, `zh`, `km`, `ko`, `id`).
Response messages adapt to the selected language. OCR extraction currently detects only Thai / English content automatically (basic heuristic) while other languages return English messages unless provided.

Example request body:
```json
{
	"userId": "u123",
	"depositId": "d789",
	"slipImageData": "data:image/png;base64,....",
	"lang": "th"
}
```

### Environment Variables (Required)
| Name | Purpose |
|------|---------|
| `INTERNAL_API_KEY` | Shared secret between workers/webhooks |
| `BANKING_WORKER_URL` | Base URL of banking worker used for status updates |
| `PENDING_VERIFICATIONS` | KV namespace binding for pending slips |
| `USER_SESSIONS` | KV for session tokens |
| `ENHANCED_AUDIT_LOGS` | KV for security/audit events |
| `BLOCKED_IPS_KV` | KV for IP block entries |

Optional future (Phase 2+): `GMAIL_WEBHOOK_SECRET`, `OCR_PROVIDER_KEY`.

### Security Notes
- Current OCR is heuristic; replace with production OCR service for accuracy.
- Validate webhook source (add HMAC or secret header) before enabling in production.
- Add rate limiting in front of `submit-slip` to prevent abuse.

## Database / Migrations (Example Flow)
```pwsh
npx wrangler d1 migrations apply wallet-production-db
```

## Configuration Snapshot
- Cloudflare Account ID: 85bcd386f06541844632ecb984afa9fb
- Repository: Chaiya88/logic-digital-wallet
- Initial Setup Date: 2025-08-27

## Deployed Files Management
### Get Deployed Files (NEW!)
สำหรับการดูและส่งออกไฟล์ของโปรเจ็คที่ Deploy

#### Using PowerShell Script
```pwsh
# Show deployment information
.\Get-Deployed-Files.ps1 info

# Generate deployment manifest
.\Get-Deployed-Files.ps1 manifest

# Export all deployed files
.\Get-Deployed-Files.ps1 export

# Do everything and open report
.\Get-Deployed-Files.ps1 all -OpenReport
```

#### Using Node.js Scripts
```bash
# Generate deployment manifest
node deployment-manifest.js

# Export deployed files
node export-deployed-files.js [output-directory]
```

#### API Endpoints
- `GET /api/public/deployment/info` - Deployment information
- `GET /api/public/deployment/manifest` - Complete deployment manifest

The deployment tools create:
- **HTML Report**: Visual deployment manifest with file details
- **JSON Manifest**: Machine-readable deployment information  
- **Exported Files**: Organized copy of all deployed components
- **Full Structure**: Complete directory structure preservation

## Roadmap / Next Steps
- Add CI/CD GitHub Actions workflows
- Introduce unit/integration tests
- Refactor into TypeScript modules
- Add secrets management guidelines
- Harden security auditing & anomaly detection rules

## Infrastructure Configuration (Wrangler Multi-Worker)
The root `wrangler.toml` now defines:
- Service bindings for cross-worker calls (`MAIN_BOT`, `API_WORKER`, `BANKING`, `SECURITY`, `FRONTEND`, `BACKUP`).
- KV namespaces for sessions, transactions, rate limits, bank usage, audit logs, commission tracking, slip verification.
- D1 databases for wallet, security audit, transaction logs, user accounts, trading bot state.
- R2 buckets for logs, assets, receipts, and user documents.

Secrets (tokens, API keys) are NOT stored in the repo. Add them via Wrangler:
```pwsh
wrangler secret put INTERNAL_API_KEY
wrangler secret put ADMIN_API_KEY
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TRONSCAN_API_KEY
wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

Reference environment template: `.env.example` (never commit the filled `.env`).

### Adding a Bank Account (Admin API)
Use the Banking Worker admin endpoint (internal call):
```
POST /admin/bank-accounts/add
Headers: X-Internal-API: <INTERNAL_API_KEY>
Body:
{
	"accountNumber": "6645769717",
	"bankName": "Krungthai",
	"holder": "ไชยา บุญทิ้ง",
	"branch": "Lotus Wonghin",
	"dailyLimit": 2000000,
	"tags": ["primary"],
	"status": "active"
}
```

### Updating Rates
```
POST /admin/rates/update
Headers: X-Internal-API: <INTERNAL_API_KEY>
Body: {
	"exchangeRates": { "THB_USDT": 33.5 },
	"commission": { "deposit": 0.005, "withdraw": 0.01 }
}
```

### Dashboard
```
GET /admin/dashboard
Headers: X-Internal-API: <INTERNAL_API_KEY>
```

Returns utilization, bank account status, pending transactions, alerts.

## License
Private (all rights reserved)

---
> Merge note: Content combined from both original branches; Thai + English sections retained.
