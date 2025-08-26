# DGWALL Cloudflare Workers

ชุดสคริปต์ Cloudflare Worker สำหรับระบบกระเป๋าเงินดิจิทัล (Digital Wallet) ประกอบด้วยโมดูลด้าน API, Banking, Bot, Frontend และ Security

## Workers
| File | Description |
|------|-------------|
| `api_worker_complete.js` | API core / business endpoints |
| `banking_worker_complete.js` | จัดการธุรกรรมธนาคาร / สลิป |
| `frontend_worker.js` | เสิร์ฟ frontend / static content |
| `main_bot_worker_complete.js` | Bot / automation logic |
| `security_worker_complete.js` | ความปลอดภัย, ตรวจจับภัยคุกคาม, Slip OCR |

## เริ่มพัฒนา (Dev)
ต้องมี Node.js และติดตั้ง Wrangler (Cloudflare)

```pwsh
npm install -g wrangler # ถ้ายังไม่ได้ติดตั้ง
wrangler dev security_worker_complete.js --local
```

## Deploy (ตัวอย่าง)
```pwsh
wrangler deploy security_worker_complete.js
```

## โครงสร้างอนาคต (Ideas)
- เพิ่ม CI/CD workflow (GitHub Actions)
- เพิ่ม Unit Tests
- แยกโค้ดเป็น TypeScript

## License
Private
