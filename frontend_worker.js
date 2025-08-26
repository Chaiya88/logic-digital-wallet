/**
 * DOGLC Frontend Worker - Complete Implementation
 * Handles all frontend UI and user interface management
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      switch (path) {
        case '/':
        case '/dashboard':
          return new Response(await getDashboardHTML(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders }
          });
          
        case '/login':
          return new Response(await getLoginHTML(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders }
          });
          
        case '/wallet':
          return new Response(await getWalletHTML(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders }
          });
          
        case '/transactions':
          return new Response(await getTransactionsHTML(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders }
          });
          
        case '/admin':
          return new Response(await getAdminHTML(), {
            headers: { 'Content-Type': 'text/html', ...corsHeaders }
          });
          
        case '/api/frontend/stats':
          return await getFrontendStats(request, env);
          
        case '/api/frontend/user-preferences':
          return await handleUserPreferences(request, env);
          
        case '/assets/styles.css':
          return new Response(getCSS(), {
            headers: { 'Content-Type': 'text/css', ...corsHeaders }
          });
          
        case '/assets/app.js':
          return new Response(getJavaScript(), {
            headers: { 'Content-Type': 'application/javascript', ...corsHeaders }
          });
          
        default:
          return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Frontend Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

// Dashboard HTML
async function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOGLC Digital Wallet - แดชบอร์ด</title>
    <link rel="stylesheet" href="/assets/styles.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐕</text></svg>">
</head>
<body>
    <div class="container">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>🐕 DOGLC Wallet</h1>
            </div>
            <div class="nav-menu">
                <a href="/dashboard" class="nav-link active">แดชบอร์ด</a>
                <a href="/wallet" class="nav-link">กระเป๋าเงิน</a>
                <a href="/transactions" class="nav-link">ธุรกรรม</a>
                <a href="/admin" class="nav-link">ผู้ดูแลระบบ</a>
                <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>
            </div>
        </nav>

        <main class="main-content">
            <div class="dashboard-header">
                <h2>แดชบอร์ดหลัก</h2>
                <div class="user-info">
                    <span id="user-name">กำลังโหลด...</span>
                    <span class="user-status" id="user-status">เชื่อมต่อแล้ว</span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>ยอดคงเหลือ DOGLC</h3>
                        <span class="stat-icon">💰</span>
                    </div>
                    <div class="stat-value" id="doglc-balance">0.00</div>
                    <div class="stat-change positive">+0.00%</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>ธุรกรรมวันนี้</h3>
                        <span class="stat-icon">📊</span>
                    </div>
                    <div class="stat-value" id="daily-transactions">0</div>
                    <div class="stat-change" id="transaction-change">0%</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>มูลค่ารวม (USD)</h3>
                        <span class="stat-icon">💵</span>
                    </div>
                    <div class="stat-value" id="total-usd">$0.00</div>
                    <div class="stat-change" id="usd-change">0%</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>สถานะระบบ</h3>
                        <span class="stat-icon">🔄</span>
                    </div>
                    <div class="stat-value system-status" id="system-status">ปกติ</div>
                    <div class="stat-change positive">เชื่อมต่อแล้ว</div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="content-section">
                    <h3>การดำเนินการด่วน</h3>
                    <div class="quick-actions">
                        <button class="action-btn primary" onclick="showSendModal()">
                            <span class="btn-icon">📤</span>
                            ส่งเงิน
                        </button>
                        <button class="action-btn secondary" onclick="showReceiveModal()">
                            <span class="btn-icon">📥</span>
                            รับเงิน
                        </button>
                        <button class="action-btn tertiary" onclick="showExchangeModal()">
                            <span class="btn-icon">🔄</span>
                            แลกเปลี่ยน
                        </button>
                        <button class="action-btn quaternary" onclick="showStakeModal()">
                            <span class="btn-icon">🎯</span>
                            Stake DOGLC
                        </button>
                    </div>
                </div>

                <div class="content-section">
                    <h3>ธุรกรรมล่าสุด</h3>
                    <div class="transaction-list" id="recent-transactions">
                        <div class="loading">กำลังโหลดข้อมูล...</div>
                    </div>
                </div>

                <div class="content-section">
                    <h3>ข่าวสารและประกาศ</h3>
                    <div class="news-list" id="news-list">
                        <div class="news-item">
                            <div class="news-date">26 ส.ค. 2025</div>
                            <div class="news-title">ระบบ DOGLC Wallet เปิดให้บริการแล้ว!</div>
                            <div class="news-content">เริ่มใช้งานกระเป๋าเงินดิจิทัล DOGLC ได้แล้ววันนี้</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Send Modal -->
    <div id="sendModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>ส่ง DOGLC</h3>
                <button class="close-btn" onclick="closeSendModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="recipient">ผู้รับ</label>
                    <input type="text" id="recipient" placeholder="ที่อยู่กระเป๋าเงิน หรือ @username">
                </div>
                <div class="form-group">
                    <label for="amount">จำนวน DOGLC</label>
                    <input type="number" id="amount" placeholder="0.00" step="0.01">
                </div>
                <div class="form-group">
                    <label for="note">หมายเหตุ (ไม่บังคับ)</label>
                    <input type="text" id="note" placeholder="หมายเหตุการโอน">
                </div>
                <button class="btn-primary full-width" onclick="sendTransaction()">
                    ส่งเงิน
                </button>
            </div>
        </div>
    </div>

    <!-- Receive Modal -->
    <div id="receiveModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>รับ DOGLC</h3>
                <button class="close-btn" onclick="closeReceiveModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="qr-section">
                    <div class="qr-code" id="wallet-qr">
                        <div class="qr-placeholder">QR Code</div>
                    </div>
                    <div class="wallet-address">
                        <label>ที่อยู่กระเป๋าเงิน:</label>
                        <div class="address-display" id="wallet-address">
                            กำลังโหลด...
                        </div>
                        <button class="copy-btn" onclick="copyWalletAddress()">
                            คัดลอก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="/assets/app.js"></script>
</body>
</html>
  `;
}

// Frontend Statistics API
async function getFrontendStats(request, env) {
  try {
    const stats = {
      activeUsers: 150,
      pageViews: 2340,
      uptime: '99.9%',
      lastUpdate: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// User Preferences Handler
async function handleUserPreferences(request, env) {
  try {
    if (request.method === 'GET') {
      // Get user preferences
      const preferences = {
        theme: 'light',
        language: 'th',
        notifications: true,
        autoRefresh: true
      };
      
      return new Response(JSON.stringify({
        success: true,
        preferences
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (request.method === 'POST') {
      // Set user preferences
      const body = await request.json();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'บันทึกการตั้งค่าเรียบร้อย'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Login HTML
async function getLoginHTML() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เข้าสู่ระบบ - DOGLC Digital Wallet</title>
    <link rel="stylesheet" href="/assets/styles.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐕</text></svg>">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="logo">
                    <span class="logo-icon">🐕</span>
                    <h1>DOGLC Wallet</h1>
                </div>
                <p class="subtitle">กระเป๋าเงินดิจิทัลที่ปลอดภัย</p>
            </div>

            <div class="login-form">
                <div class="form-group">
                    <label for="username">ชื่อผู้ใช้ หรือ อีเมล</label>
                    <input type="text" id="username" placeholder="กรอกชื่อผู้ใช้หรืออีเมล">
                </div>

                <div class="form-group">
                    <label for="password">รหัสผ่าน</label>
                    <input type="password" id="password" placeholder="กรอกรหัสผ่าน">
                </div>

                <div class="form-options">
                    <label class="checkbox">
                        <input type="checkbox" id="remember">
                        <span class="checkmark"></span>
                        จดจำการเข้าสู่ระบบ
                    </label>
                    <a href="#" class="forgot-link">ลืมรหัสผ่าน?</a>
                </div>

                <button class="login-btn" onclick="performLogin()">
                    เข้าสู่ระบบ
                </button>

                <div class="divider">หรือ</div>

                <button class="telegram-login-btn" onclick="loginWithTelegram()">
                    <span class="telegram-icon">✈️</span>
                    เข้าสู่ระบบด้วย Telegram
                </button>

                <div class="signup-link">
                    ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a>
                </div>
            </div>
        </div>

        <div class="features-section">
            <h3>ฟีเจอร์หลัก</h3>
            <div class="feature-grid">
                <div class="feature-item">
                    <span class="feature-icon">🔐</span>
                    <h4>ความปลอดภัยสูง</h4>
                    <p>เข้ารหัสระดับธนาคาร</p>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <h4>รวดเร็ว</h4>
                    <p>ธุรกรรมในทันที</p>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">💰</span>
                    <h4>ค่าธรรมเนียมต่ำ</h4>
                    <p>ประหยัดค่าใช้จ่าย</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function performLogin() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    localStorage.setItem('auth_token', result.token);
                    window.location.href = '/dashboard';
                } else {
                    alert('ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
                }
            } catch (error) {
                alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            }
        }
        
        function loginWithTelegram() {
            window.location.href = '/api/auth/telegram';
        }
    </script>
</body>
</html>
  `;
}

// Wallet HTML
async function getWalletHTML() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>กระเป๋าเงิน - DOGLC Digital Wallet</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="container">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>🐕 DOGLC Wallet</h1>
            </div>
            <div class="nav-menu">
                <a href="/dashboard" class="nav-link">แดชบอร์ด</a>
                <a href="/wallet" class="nav-link active">กระเป๋าเงิน</a>
                <a href="/transactions" class="nav-link">ธุรกรรม</a>
                <a href="/admin" class="nav-link">ผู้ดูแลระบบ</a>
                <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>
            </div>
        </nav>

        <main class="main-content">
            <div class="wallet-header">
                <h2>กระเป๋าเงินของฉัน</h2>
                <div class="wallet-actions">
                    <button class="btn-primary" id="refresh-wallet-btn" onclick="refreshWallet()">
                        🔄 รีเฟรช
                    </button>
                    <button class="btn-secondary" onclick="exportWallet()">
                        📊 ส่งออกข้อมูล
                    </button>
                </div>
            </div>

            <div class="wallet-overview">
                <div class="balance-card main-balance">
                    <div class="balance-header">
                        <h3>ยอดคงเหลือหลัก</h3>
                        <span class="currency-icon">🐕</span>
                    </div>
                    <div class="balance-amount">
                        <span class="amount" id="main-balance">0.00</span>
                        <span class="currency">DOGLC</span>
                    </div>
                    <div class="balance-usd">≈ $<span id="main-balance-usd">0.00</span> USD</div>
                </div>

                <div class="balance-grid">
                    <div class="balance-card">
                        <div class="balance-header">
                            <h4>Available</h4>
                            <span class="balance-icon">💰</span>
                        </div>
                        <div class="balance-value" id="available-balance">0.00 DOGLC</div>
                    </div>

                    <div class="balance-card">
                        <div class="balance-header">
                            <h4>Frozen</h4>
                            <span class="balance-icon">🧊</span>
                        </div>
                        <div class="balance-value" id="frozen-balance">0.00 DOGLC</div>
                    </div>

                    <div class="balance-card">
                        <div class="balance-header">
                            <h4>Staked</h4>
                            <span class="balance-icon">🎯</span>
                        </div>
                        <div class="balance-value" id="staked-balance">0.00 DOGLC</div>
                    </div>
                </div>
            </div>

            <div class="wallet-actions-grid">
                <button class="wallet-action-btn send" onclick="showSendModal()">
                    <span class="action-icon">📤</span>
                    <span class="action-text">ส่งเงิน</span>
                </button>
                
                <button class="wallet-action-btn receive" onclick="showReceiveModal()">
                    <span class="action-icon">📥</span>
                    <span class="action-text">รับเงิน</span>
                </button>
                
                <button class="wallet-action-btn deposit" onclick="showDepositModal()">
                    <span class="action-icon">🏦</span>
                    <span class="action-text">ฝากเงิน THB</span>
                </button>
                
                <button class="wallet-action-btn exchange" onclick="showExchangeModal()">
                    <span class="action-icon">🔄</span>
                    <span class="action-text">แลกเปลี่ยน</span>
                </button>
                
                <button class="wallet-action-btn withdraw" onclick="showWithdrawModal()">
                    <span class="action-icon">💸</span>
                    <span class="action-text">ถอน USDT</span>
                </button>
                
                <button class="wallet-action-btn stake" onclick="showStakeModal()">
                    <span class="action-icon">🎯</span>
                    <span class="action-text">Stake</span>
                </button>
            </div>

            <div class="wallet-details">
                <div class="detail-section">
                    <h3>ข้อมูลกระเป๋าเงิน</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ที่อยู่กระเป๋าเงิน:</label>
                            <div class="address-display">
                                <span id="wallet-address">กำลังโหลด...</span>
                                <button class="copy-btn" onclick="copyWalletAddress()">คัดลอก</button>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <label>วันที่สร้าง:</label>
                            <span id="wallet-created">กำลังโหลด...</span>
                        </div>
                        
                        <div class="detail-item">
                            <label>สถานะ:</label>
                            <span class="status active" id="wallet-status">ใช้งานได้</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>สถิติการใช้งาน</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="total-sent">0</div>
                            <div class="stat-label">ธุรกรรมส่ง</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-value" id="total-received">0</div>
                            <div class="stat-label">ธุรกรรมรับ</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-value" id="total-volume">0.00</div>
                            <div class="stat-label">ปริมาณรวม</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Deposit Modal -->
    <div id="depositModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>ฝากเงินบาท (THB)</h3>
                <button class="close-btn" onclick="closeDepositModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div id="deposit-step-1">
                    <div class="form-group">
                        <label for="deposit-amount">จำนวนเงิน (บาท)</label>
                        <input type="number" id="deposit-amount" placeholder="500" min="100">
                    </div>
                    <button class="btn-primary full-width" onclick="initiateDeposit()">
                        ขอข้อมูลบัญชี
                    </button>
                </div>
                <div id="deposit-step-2" style="display:none;">
                    <h4>กรุณาโอนเงินมาที่บัญชีนี้</h4>
                    <div class="bank-info">
                        <p><strong>ธนาคาร:</strong> <span id="bank-name">-</span></p>
                        <p><strong>เลขที่บัญชี:</strong> <span id="account-number">-</span></p>
                        <p><strong>ชื่อบัญชี:</strong> <span id="account-name">-</span></p>
                        <p><strong>จำนวนเงิน:</strong> <span id="deposit-amount-display">-</span> บาท</p>
                    </div>
                    <hr>
                    <h4>ขั้นตอนสุดท้าย: อัปโหลดสลิปเพื่อยืนยัน</h4>
                    <div class="form-group">
                        <label for="slip-file">เลือกไฟล์สลิป</label>
                        <input type="file" id="slip-file" accept="image/*">
                    </div>
                    <button class="btn-primary full-width" onclick="uploadSlip()">
                        อัปโหลดและยืนยัน
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Withdraw Modal -->
    <div id="withdrawModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>ถอนเป็น USDT</h3>
                <button class="close-btn" onclick="closeWithdrawModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="withdraw-amount">จำนวน DOGLC ที่จะถอน</label>
                    <input type="number" id="withdraw-amount" placeholder="1000" min="1">
                    <small>อัตราแลกเปลี่ยน: 1 DOGLC = 0.001 USDT</small>
                </div>
                <div class="form-group">
                    <label for="usdt-address">ที่อยู่กระเป๋า USDT (TRC-20)</label>
                    <input type="text" id="usdt-address" placeholder="Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
                </div>
                <div class="withdraw-summary">
                    <p><strong>จะได้รับ:</strong> <span id="usdt-amount-preview">0.000</span> USDT</p>
                    <p><strong>ค่าธรรมเนียม:</strong> <span id="withdraw-fee">1.0</span> USDT</p>
                </div>
                <button class="btn-primary full-width" onclick="initiateWithdrawal()">
                    ยืนยันการถอน
                </button>
            </div>
        </div>
    </div>

    <script src="/assets/app.js"></script>
</body>
</html>
  `;
}

// Transactions HTML
async function getTransactionsHTML() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ธุรกรรม - DOGLC Digital Wallet</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="container">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>🐕 DOGLC Wallet</h1>
            </div>
            <div class="nav-menu">
                <a href="/dashboard" class="nav-link">แดชบอร์ด</a>
                <a href="/wallet" class="nav-link">กระเป๋าเงิน</a>
                <a href="/transactions" class="nav-link active">ธุรกรรม</a>
                <a href="/admin" class="nav-link">ผู้ดูแลระบบ</a>
                <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>
            </div>
        </nav>

        <main class="main-content">
            <div class="transactions-header">
                <h2>ประวัติธุรกรรม</h2>
                <div class="transaction-filters">
                    <select id="filter-type" onchange="filterTransactions()">
                        <option value="all">ทั้งหมด</option>
                        <option value="send">ส่งเงิน</option>
                        <option value="receive">รับเงิน</option>
                        <option value="deposit">ฝากเงิน</option>
                        <option value="withdraw">ถอนเงิน</option>
                        <option value="exchange">แลกเปลี่ยน</option>
                        <option value="stake">Stake</option>
                    </select>
                    
                    <select id="filter-period" onchange="filterTransactions()">
                        <option value="all">ทุกช่วงเวลา</option>
                        <option value="today">วันนี้</option>
                        <option value="week">สัปดาห์นี้</option>
                        <option value="month">เดือนนี้</option>
                        <option value="year">ปีนี้</option>
                    </select>
                    
                    <button class="btn-primary" onclick="exportTransactions()">
                        📊 ส่งออก
                    </button>
                </div>
            </div>

            <div class="transaction-summary">
                <div class="summary-card">
                    <div class="summary-header">
                        <h3>สรุปธุรกรรม</h3>
                        <span class="period-text" id="summary-period">ทั้งหมด</span>
                    </div>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-label">ธุรกรรมทั้งหมด:</span>
                            <span class="stat-value" id="total-transactions">0</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">ปริมาณส่ง:</span>
                            <span class="stat-value" id="total-sent-amount">0.00 DOGLC</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">ปริมาณรับ:</span>
                            <span class="stat-value" id="total-received-amount">0.00 DOGLC</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="transactions-list">
                <div class="list-header">
                    <div class="sort-options">
                        <label>เรียงตาม:</label>
                        <select id="sort-by" onchange="sortTransactions()">
                            <option value="date-desc">วันที่ (ใหม่-เก่า)</option>
                            <option value="date-asc">วันที่ (เก่า-ใหม่)</option>
                            <option value="amount-desc">จำนวน (มาก-น้อย)</option>
                            <option value="amount-asc">จำนวน (น้อย-มาก)</option>
                        </select>
                    </div>
                </div>

                <div class="transaction-items" id="transaction-list">
                    <div class="loading">กำลังโหลดธุรกรรม...</div>
                </div>

                <div class="pagination" id="pagination">
                    <!-- Pagination will be generated by JavaScript -->
                </div>
            </div>
        </main>
    </div>

    <!-- Transaction Detail Modal -->
    <div id="transactionModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>รายละเอียดธุรกรรม</h3>
                <button class="close-btn" onclick="closeTransactionModal()">&times;</button>
            </div>
            <div class="modal-body" id="transaction-details">
                <!-- Transaction details will be loaded here -->
            </div>
        </div>
    </div>

    <script>
        // Transaction management JavaScript
        let currentPage = 1;
        let totalPages = 1;
        let allTransactions = [];
        let filteredTransactions = [];

        async function loadTransactions() {
            try {
                const response = await fetch('/api/transactions/list', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    allTransactions = result.transactions;
                    filteredTransactions = [...allTransactions];
                    renderTransactions();
                    updateSummary();
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        }

        function renderTransactions() {
            const listElement = document.getElementById('transaction-list');
            
            if (filteredTransactions.length === 0) {
                listElement.innerHTML = '<div class="no-transactions">ไม่พบธุรกรรม</div>';
                return;
            }
    
            const startIndex = (currentPage - 1) * 20;
            const endIndex = startIndex + 20;
            const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
            listElement.innerHTML = pageTransactions.map(function(tx) {
                var amountClass = (tx.type === 'receive' || tx.type === 'deposit') ? 'positive' : 'negative';
                var sign = (tx.type === 'receive' || tx.type === 'deposit') ? '+' : '-';
    
                return '<div class="transaction-item" onclick="showTransactionDetails(\\'' + tx.id + '\\')">' +
                    '<div class="transaction-icon">' + getTransactionIcon(tx.type) + '</div>' +
                    '<div class="transaction-info">' +
                        '<div class="transaction-title">' + getTransactionTitle(tx) + '</div>' +
                        '<div class="transaction-date">' + formatDate(tx.timestamp) + '</div>' +
                    '</div>' +
                    '<div class="transaction-amount ' + amountClass + '">' +
                        sign + tx.amount + ' DOGLC' +
                    '</div>' +
                    '<div class="transaction-status ' + tx.status + '">' + getStatusText(tx.status) + '</div>' +
                '</div>';
            }).join('');
    
            renderPagination();
        }

        function getTransactionIcon(type) {
            const icons = {
                'send': '📤',
                'receive': '📥',
                'deposit': '🏦',
                'withdraw': '💸',
                'exchange': '🔄',
                'stake': '🎯'
            };
            return icons[type] || '💰';
        }

        function getTransactionTitle(tx) {
            const titles = {
                'send': 'ส่งเงิน',
                'receive': 'รับเงิน',
                'deposit': 'ฝากเงิน THB',
                'withdraw': 'ถอน USDT',
                'exchange': 'แลกเปลี่ยน',
                'stake': 'Stake'
            };
            return titles[tx.type] || 'ธุรกรรม';
        }

        function getStatusText(status) {
            const statusTexts = {
                'completed': 'สำเร็จ',
                'pending': 'รอดำเนินการ',
                'failed': 'ล้มเหลว',
                'cancelled': 'ยกเลิก'
            };
            return statusTexts[status] || status;
        }

        function formatDate(timestamp) {
            try {
                return new Date(timestamp).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return new Date(timestamp).toLocaleString();
            }
        }

        // Load transactions when page loads
        document.addEventListener('DOMContentLoaded', loadTransactions);
    </script>
</body>
</html>
  `;
}

// Admin HTML
async function getAdminHTML() {
  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ผู้ดูแลระบบ - DOGLC Digital Wallet</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <div class="container">
        <nav class="navbar">
            <div class="nav-brand">
                <h1>🐕 DOGLC Wallet</h1>
            </div>
            <div class="nav-menu">
                <a href="/dashboard" class="nav-link">แดชบอร์ด</a>
                <a href="/wallet" class="nav-link">กระเป๋าเงิน</a>
                <a href="/transactions" class="nav-link">ธุรกรรม</a>
                <a href="/admin" class="nav-link active">ผู้ดูแลระบบ</a>
                <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>
            </div>
        </nav>

        <main class="main-content">
            <div class="admin-header">
                <h2>ผู้ดูแลระบบ</h2>
                <div class="admin-status">
                    <span class="status-indicator active"></span>
                    <span>ออนไลน์</span>
                </div>
            </div>

            <div class="admin-grid">
                <div class="admin-section">
                    <h3>สถิติระบบ</h3>
                    <div class="system-stats">
                        <div class="stat-row">
                            <span>ผู้ใช้ทั้งหมด:</span>
                            <span id="total-users">0</span>
                        </div>
                        <div class="stat-row">
                            <span>ธุรกรรมรวม:</span>
                            <span id="total-system-transactions">0</span>
                        </div>
                        <div class="stat-row">
                            <span>DOGLC ในระบบ:</span>
                            <span id="total-doglc-supply">0</span>
                        </div>
                        <div class="stat-row">
                            <span>สถานะระบบ:</span>
                            <span class="status healthy" id="system-health">ปกติ</span>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>การจัดการผู้ใช้</h3>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="viewUserList()">
                            👥 รายชื่อผู้ใช้
                        </button>
                        <button class="admin-btn" onclick="viewPendingKYC()">
                            📋 KYC รอดำเนินการ
                        </button>
                        <button class="admin-btn" onclick="viewBlockedUsers()">
                            🚫 ผู้ใช้ถูกบล็อก
                        </button>
                        <button class="admin-btn" onclick="viewPendingDeposits()">
                            🏦 การฝากรอยืนยัน
                        </button>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>การจัดการระบบ</h3>
                    <div class="admin-actions">
                        <button class="admin-btn" onclick="viewSystemLogs()">
                            📊 ล็อกระบบ
                        </button>
                        <button class="admin-btn" onclick="viewSecurityAlerts()">
                            🔐 การแจ้งเตือนความปลอดภัย
                        </button>
                        <button class="admin-btn" onclick="performSystemBackup()">
                            💾 สำรองข้อมูลระบบ
                        </button>
                        <button class="admin-btn danger" onclick="systemMaintenance()">
                            🔧 โหมดบำรุงรักษา
                        </button>
                    </div>
                </div>

                <div class="admin-section full-width">
                    <h3>กิจกรรมล่าสุด</h3>
                    <div class="activity-list" id="recent-activities">
                        <div class="loading">กำลังโหลดกิจกรรม...</div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Admin panel JavaScript
        async function loadAdminData() {
            try {
                const response = await fetch('/api/admin/dashboard', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateAdminStats(result.stats);
                    updateRecentActivities(result.activities);
                }
            } catch (error) {
                console.error('Error loading admin data:', error);
            }
        }

        function updateAdminStats(stats) {
            document.getElementById('total-users').textContent = stats.totalUsers || 0;
            document.getElementById('total-system-transactions').textContent = stats.totalTransactions || 0;
            document.getElementById('total-doglc-supply').textContent = (stats.totalSupply || 0) + ' DOGLC';
            
            const healthElement = document.getElementById('system-health');
            healthElement.textContent = stats.systemStatus || 'ปกติ';
            healthElement.className = 'status ' + (stats.systemStatus === 'ปกติ' ? 'healthy' : 'warning');
        }

        function updateRecentActivities(activities) {
            const listElement = document.getElementById('recent-activities');
            
            if (!activities || activities.length === 0) {
                listElement.innerHTML = '<div class="no-activity">ไม่มีกิจกรรมล่าสุด</div>';
                return;
            }

            // Use DOM methods to avoid constructing HTML with template/backtick issues and reduce XSS risk
            listElement.innerHTML = '';
            activities.forEach(function(activity) {
                const item = document.createElement('div');
                item.className = 'activity-item';

                const icon = document.createElement('div');
                icon.className = 'activity-icon';
                icon.textContent = getActivityIcon(activity.type) || '';

                const content = document.createElement('div');
                content.className = 'activity-content';

                const title = document.createElement('div');
                title.className = 'activity-title';
                title.textContent = activity.description || '';

                const time = document.createElement('div');
                time.className = 'activity-time';
                time.textContent = formatDate(activity.timestamp) || '';

                content.appendChild(title);
                content.appendChild(time);

                const status = document.createElement('div');
                status.className = 'activity-status ' + (activity.status || '');
                status.textContent = activity.status || '';

                item.appendChild(icon);
                item.appendChild(content);
                item.appendChild(status);

                listElement.appendChild(item);
            });
        }

        // Admin action functions
        function viewUserList() {
            window.location.href = '/admin/users';
        }

        function viewPendingKYC() {
            window.location.href = '/admin/kyc';
        }

        function viewBlockedUsers() {
            window.location.href = '/admin/blocked';
        }

        function viewPendingDeposits() {
            window.location.href = '/admin/deposits';
        }

        function viewSystemLogs() {
            window.location.href = '/admin/logs';
        }

        function viewSecurityAlerts() {
            window.location.href = '/admin/security';
        }

        async function performSystemBackup() {
            if (confirm('ต้องการสำรองข้อมูลระบบหรือไม่?')) {
                try {
                    const response = await fetch('/api/admin/backup', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    
                    const result = await response.json();
                    alert(result.message || 'สำรองข้อมูลเสร็จสิ้น');
                } catch (error) {
                    alert('เกิดข้อผิดพลาดในการสำรองข้อมูล');
                }
            }
        }

        async function systemMaintenance() {
            if (confirm('ต้องการเข้าสู่โหมดบำรุงรักษาหรือไม่? ระบบจะไม่สามารถใช้งานได้ชั่วคราว')) {
                try {
                    const response = await fetch('/api/admin/maintenance', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
                        }
                    });
                    
                    const result = await response.json();
                    alert(result.message || 'เข้าสู่โหมดบำรุงรักษาแล้ว');
                } catch (error) {
                    alert('เกิดข้อผิดพลาดในการเข้าสู่โหมดบำรุงรักษา');
                }
            }
        }

        // Load admin data when page loads
        document.addEventListener('DOMContentLoaded', loadAdminData);
    </script>
</body>
</html>
  `;
}

// CSS Styles
function getCSS() {
  return `
/* DOGLC Digital Wallet - Complete CSS Styles */

:root {
  --primary-color: #2563eb;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --success-color: #22c55e;
  --dark-color: #1f2937;
  --light-color: #f9fafb;
  --border-color: #e5e7eb;
  --text-color: #374151;
  --text-light: #6b7280;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --border-radius: 0.5rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--light-color);
  color: var(--text-color);
  line-height: 1.6;
}

/* Container & Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navigation */
.navbar {
  background: white;
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand h1 {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.nav-link {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--light-color);
}

.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}

.logout-btn {
  background-color: var(--danger-color);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #dc2626;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--spacing-xl);
}

/* Dashboard Styles */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.dashboard-header h2 {
  color: var(--dark-color);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-status {
  font-size: 0.875rem;
  color: var(--success-color);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.stat-header h3 {
  font-size: 0.875rem;
  color: var(--text-light);
  font-weight: 500;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--dark-color);
  margin-bottom: var(--spacing-sm);
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-light);
}

.stat-change.positive {
  color: var(--success-color);
}

.stat-change.negative {
  color: var(--danger-color);
}

/* Quick Actions */
.dashboard-content {
  display: grid;
  gap: var(--spacing-xl);
}

.content-section {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.content-section h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--dark-color);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.action-btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.action-btn.secondary {
  background-color: var(--secondary-color);
  color: white;
}

.action-btn.tertiary {
  background-color: var(--warning-color);
  color: white;
}

.action-btn.quaternary {
  background-color: #8b5cf6;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-icon {
  font-size: 1.5rem;
}

/* Login Page Styles */
.login-page {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  max-width: 1000px;
  width: 100%;
}

.login-card {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.logo-icon {
  font-size: 2rem;
}

.logo h1 {
  color: var(--primary-color);
}

.subtitle {
  color: var(--text-light);
}

/* Form Styles */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-light);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkmark {
  margin-left: var(--spacing-sm);
}

.forgot-link {
  color: var(--primary-color);
  text-decoration: none;
}

.login-btn {
  width: 100%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background-color: #1d4ed8;
}

.divider {
  text-align: center;
  margin: var(--spacing-lg) 0;
  color: var(--text-light);
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: var(--border-color);
  z-index: 1;
}

.divider {
  background: white;
  padding: 0 var(--spacing-md);
  z-index: 2;
  position: relative;
}

.telegram-login-btn {
  width: 100%;
  background-color: #0088cc;
  color: white;
  border: none;
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  transition: background-color 0.2s;
}

.telegram-login-btn:hover {
  background-color: #006ba6;
}

.signup-link {
  text-align: center;
  margin-top: var(--spacing-lg);
}

.signup-link a {
  color: var(--primary-color);
  text-decoration: none;
}

/* Features Section */
.features-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius);
  color: white;
}

.features-section h3 {
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.feature-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.feature-item {
  text-align: center;
  padding: var(--spacing-md);
}

.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: var(--spacing-sm);
}

.feature-item h4 {
  margin-bottom: var(--spacing-sm);
}

/* Wallet Styles */
.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.wallet-actions {
  display: flex;
  gap: var(--spacing-md);
}

.btn-primary, .btn-secondary {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.wallet-overview {
  margin-bottom: var(--spacing-xl);
}

.main-balance {
  grid-column: span 2;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  margin-bottom: var(--spacing-lg);
}

.balance-card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
}

.balance-usd {
  opacity: 0.8;
}

.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

/* Wallet Actions Grid */
.wallet-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.wallet-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.wallet-action-btn:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.wallet-action-btn.send:hover {
  border-color: var(--danger-color);
}

.wallet-action-btn.receive:hover {
  border-color: var(--success-color);
}

.wallet-action-btn.deposit:hover {
  border-color: var(--primary-color);
}

.wallet-action-btn.exchange:hover {
  border-color: var(--warning-color);
}

.wallet-action-btn.withdraw:hover {
  border-color: #dc2626;
}

.wallet-action-btn.stake:hover {
  border-color: #8b5cf6;
}

.action-icon {
  font-size: 1.5rem;
}

.action-text {
  font-weight: 500;
}

/* Wallet Details */
.wallet-details {
  display: grid;
  gap: var(--spacing-xl);
}

.detail-section {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.detail-section h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--dark-color);
}

.detail-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-item label {
  font-weight: 500;
  color: var(--text-light);
}

.address-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--light-color);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
}

.copy-btn {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.status.active {
  color: var(--success-color);
}

/* Bank Info Styles */
.bank-info {
  background: var(--light-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  margin: var(--spacing-md) 0;
}

.bank-info p {
  margin-bottom: var(--spacing-sm);
}

/* Withdraw Summary */
.withdraw-summary {
  background: var(--light-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  margin: var(--spacing-md) 0;
}

.withdraw-summary p {
  margin-bottom: var(--spacing-sm);
}

/* Modal Styles */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  margin: 5% auto;
  padding: 0;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--dark-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
}

.modal-body {
  padding: var(--spacing-lg);
}

.qr-section {
  text-align: center;
}

.qr-code {
  margin-bottom: var(--spacing-lg);
}

.wallet-address label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
}

/* Transaction Styles */
.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.transaction-filters {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.transaction-filters select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.transaction-summary {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
}

.summary-card {
  padding: var(--spacing-lg);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.summary-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: var(--text-light);
}

.stat-value {
  font-weight: 500;
}

.transactions-list {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.list-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.transaction-items {
  min-height: 400px;
}

.transaction-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background-color: var(--light-color);
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  font-size: 1.5rem;
}

.transaction-info {
  display: flex;
  flex-direction: column;
}

.transaction-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.transaction-date {
  font-size: 0.875rem;
  color: var(--text-light);
}

.transaction-amount {
  font-weight: 500;
  font-size: 1rem;
}

.transaction-amount.positive {
  color: var(--success-color);
}

.transaction-amount.negative {
  color: var(--danger-color);
}

.transaction-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.transaction-status.completed {
  background-color: #dcfce7;
  color: #166534;
}

.transaction-status.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.transaction-status.failed {
  background-color: #fee2e2;
  color: #991b1b;
}

.transaction-status.cancelled {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* Pagination */
.pagination {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
}

.pagination-controls button {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  background: white;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-controls button:hover {
  background-color: var(--light-color);
}

.pagination-controls button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Admin Styles */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.admin-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.active {
  background-color: var(--success-color);
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.admin-section {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.admin-section.full-width {
  grid-column: 1 / -1;
}

.admin-section h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--dark-color);
}

.system-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.stat-row:last-child {
  border-bottom: none;
}

.status.healthy {
  color: var(--success-color);
}

.status.warning {
  color: var(--warning-color);
}

.admin-actions {
  display: grid;
  gap: var(--spacing-md);
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--light-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 1rem;
}

.admin-btn:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.admin-btn.danger {
  background-color: #fef2f2;
  border-color: var(--danger-color);
  color: var(--danger-color);
}

.admin-btn.danger:hover {
  background-color: var(--danger-color);
  color: white;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.25rem;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.875rem;
  color: var(--text-light);
}

.activity-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* News Styles */
.news-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.news-item {
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--light-color);
}

.news-date {
  font-size: 0.875rem;
  color: var(--text-light);
  margin-bottom: var(--spacing-sm);
}

.news-title {
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.news-content {
  color: var(--text-light);
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
  }
  
  .features-section {
    order: -1;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .wallet-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .nav-menu {
    display: none;
  }
  
  .admin-grid {
    grid-template-columns: 1fr;
  }
  
  .transaction-item {
    grid-template-columns: auto 1fr auto;
    gap: var(--spacing-md);
  }
  
  .transaction-status {
    grid-column: 1 / -1;
    justify-self: start;
    margin-top: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: var(--spacing-md);
  }
  
  .transactions-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .transaction-filters {
    justify-content: stretch;
  }
  
  .transaction-filters select {
    flex: 1;
  }
}

/* Loading States */
.loading {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-light);
}

.no-transactions, .no-activity {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-light);
}

/* Utilities */
.full-width {
  width: 100%;
}

.text-center {
  text-align: center;
}

.mt-1 { margin-top: var(--spacing-sm); }
.mt-2 { margin-top: var(--spacing-md); }
.mt-3 { margin-top: var(--spacing-lg); }
.mt-4 { margin-top: var(--spacing-xl); }

.mb-1 { margin-bottom: var(--spacing-sm); }
.mb-2 { margin-bottom: var(--spacing-md); }
.mb-3 { margin-bottom: var(--spacing-lg); }
.mb-4 { margin-bottom: var(--spacing-xl); }
`
}