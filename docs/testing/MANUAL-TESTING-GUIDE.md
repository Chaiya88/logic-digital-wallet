# MANUAL TESTING GUIDE
# Digital Wallet System - Live Testing Instructions

## 🤖 Telegram Bot Testing
**Bot Username: @DoglcWallet_Bot**

### Essential Commands to Test:
1. `/start` - Initialize user account
2. `/help` - Show available commands  
3. `/balance` - Check wallet balance
4. `/deposit` - Deposit funds
5. `/withdraw` - Withdraw funds
6. `/history` - Transaction history
7. `/settings` - User settings
8. `/referral` - Referral system

### Testing Steps:
1. Open Telegram and search for: @DoglcWallet_Bot
2. Send `/start` command
3. Follow bot prompts
4. Test each command above
5. Report any errors or unexpected behavior

---

## 🌐 Web Interface Testing  
**URL: https://teenoi96.org/app/**

### Pages to Test:
1. Dashboard: https://teenoi96.org/app/
2. Wallet: https://teenoi96.org/wallet/
3. Transactions: https://teenoi96.org/app/transactions
4. Admin: https://teenoi96.org/app/admin

### Test Cases:
- [ ] Page loads without errors
- [ ] UI elements display correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Mobile responsiveness

---

## 🔧 API Testing
**Base URL: https://teenoi96.org/api/**

### Public Endpoints:
```bash
# Health Check
curl "https://teenoi96.org/api/public/network/health"

# System Stats  
curl "https://teenoi96.org/api/public/stats"

# Market Data
curl "https://teenoi96.org/api/public/market-data"

# Price Info
curl "https://teenoi96.org/api/public/price"
```

### Expected Results:
- All endpoints return JSON responses
- Status codes are 200 for success
- No 500 internal server errors

---

## 📋 Test Results Checklist

### ✅ Bot Testing Results:
- [ ] Bot responds to /start
- [ ] Commands work as expected
- [ ] User registration successful  
- [ ] Database updates correctly
- [ ] Multi-language support works

### ✅ Web Interface Results:
- [ ] All pages accessible
- [ ] No JavaScript errors
- [ ] Mobile-friendly design
- [ ] Fast loading times

### ✅ API Results:
- [ ] All public endpoints work
- [ ] Rate limiting functions
- [ ] Error handling proper
- [ ] Response times < 1000ms

### ✅ Security Results:
- [ ] HTTPS enforced
- [ ] CORS headers present
- [ ] No sensitive data exposed
- [ ] Rate limiting active

---

## 🚨 Issue Reporting
If you find any issues, please note:
1. **What you were testing**
2. **What you expected**
3. **What actually happened**
4. **Error messages (if any)**
5. **Browser/device used**

---

## 📊 Performance Benchmarks
- Bot response time: < 2 seconds
- Web page load time: < 3 seconds  
- API response time: < 1 second
- Uptime target: 99.9%
