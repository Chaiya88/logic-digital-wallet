<!-- Unified README after merge conflict resolution -->
# DGWALL / Digital Wallet Logic System

This repository contains Cloudflare Workers powering a secure digital wallet platform (API, Banking, Bot, Frontend, Security) with ChatOps-enabled deployment workflows.

---
## 🇹🇭 สรุปภาษาไทย
ชุดสคริปต์ Cloudflare Worker สำหรับระบบกระเป๋าเงินดิจิทัล ประกอบด้วยโมดูลด้าน API, Banking, Bot, Frontend และ Security รวมถึงระบบตรวจสลิป (OCR) และการปรับใช้ผ่าน GitHub Actions / ChatOps

## Workers
| File | Description |
|------|-------------|
| `api_worker_complete.js` | API core / business endpoints |
| `banking_worker_complete.js` | Bank transactions / slip handling |
| `frontend_worker.js` | Static / frontend delivery |
| `main_bot_worker_complete.js` | Bot & automation logic |
| `security_worker_complete.js` | Security, threat detection, OCR slip verification |

## ChatOps & Deployment
Comment `/deploy api-worker` (example) on Pull Requests to trigger deployment workflow (once Actions workflow is added/configured).

## API (Sample Endpoints)
- `GET /health` – Health check
- `GET /api/status` – Service status
- `POST /internal/audit` – Internal audit logging (protected)

## Local Development
Requires Node.js and Wrangler.

```pwsh
npm install -g wrangler   # if not installed
wrangler dev security_worker_complete.js --local
```

## Deploy Example
```pwsh
wrangler deploy security_worker_complete.js
```

## Database / Migrations (Example Flow)
```pwsh
npx wrangler d1 migrations apply wallet-production-db
```

## Configuration Snapshot
- Cloudflare Account ID: 85bcd386f06541844632ecb984afa9fb
- Repository: Chaiya88/logic-digital-wallet
- Initial Setup Date: 2025-08-27

## Roadmap / Next Steps
- Add CI/CD GitHub Actions workflows
- Introduce unit/integration tests
- Refactor into TypeScript modules
- Add secrets management guidelines
- Harden security auditing & anomaly detection rules

## License
Private (all rights reserved)

---
> Merge note: Content combined from both original branches; Thai + English sections retained.
