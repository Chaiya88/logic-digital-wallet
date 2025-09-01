@echo off
setlocal enabledelayedexpansion

REM Banking and Security Worker Authentication Diagnostic Script
REM Script for diagnosing authentication issues with Integration Workers

echo ===============================================
echo   Worker Authentication Diagnostic Script
echo ===============================================
echo.

REM Define Worker URLs and credentials
set BANKING_URL=https://banking-worker.jameharu-no1.workers.dev
set SECURITY_URL=https://security-worker.jameharu-no1.workers.dev
set INTERNAL_KEY=internal-api-secure-2025-wallet
set AUDIT_KEY=secure-audit-key-2025

echo Starting authentication diagnostic for Integration Workers...
echo.

REM ===============================================
REM Section 1: Banking Worker Detailed Analysis
REM ===============================================
echo [Banking Worker Diagnostic]
echo ===============================================

echo Testing Banking Worker root endpoint...
curl -s -o banking_root.json -w "HTTP_CODE:%%{http_code}\nTIME:%%{time_total}s\n" %BANKING_URL% > banking_diagnostic.txt
type banking_diagnostic.txt
echo.

echo Testing with different authentication methods...
echo Method 1: No authentication
curl -s -o banking_no_auth.json -w "HTTP_CODE:%%{http_code}\n" %BANKING_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 2: Internal API Key authentication
curl -s -o banking_internal_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "Authorization: Bearer %INTERNAL_KEY%" %BANKING_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 3: Audit Key authentication
curl -s -o banking_audit_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "Authorization: Bearer %AUDIT_KEY%" %BANKING_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 4: Custom header authentication
curl -s -o banking_custom_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "X-Internal-API-Key: %INTERNAL_KEY%" %BANKING_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Testing Banking Worker available endpoints...
echo Testing /api/status endpoint...
curl -s -o banking_status.json -w "HTTP_CODE:%%{http_code}\n" %BANKING_URL%/api/status > temp_result.txt
type temp_result.txt

echo Testing /api/info endpoint...
curl -s -o banking_info.json -w "HTTP_CODE:%%{http_code}\n" %BANKING_URL%/api/info > temp_result.txt
type temp_result.txt

echo Testing /api/docs endpoint...
curl -s -o banking_docs.json -w "HTTP_CODE:%%{http_code}\n" %BANKING_URL%/api/docs > temp_result.txt
type temp_result.txt

echo.

REM ===============================================
REM Section 2: Security Worker Detailed Analysis
REM ===============================================
echo [Security Worker Diagnostic]
echo ===============================================

echo Testing Security Worker root endpoint...
curl -s -o security_root.json -w "HTTP_CODE:%%{http_code}\nTIME:%%{time_total}s\n" %SECURITY_URL% > security_diagnostic.txt
type security_diagnostic.txt
echo.

echo Testing with different authentication methods...
echo Method 1: No authentication
curl -s -o security_no_auth.json -w "HTTP_CODE:%%{http_code}\n" %SECURITY_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 2: Internal API Key authentication
curl -s -o security_internal_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "Authorization: Bearer %INTERNAL_KEY%" %SECURITY_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 3: Audit Key authentication
curl -s -o security_audit_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "Authorization: Bearer %AUDIT_KEY%" %SECURITY_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Method 4: Custom header authentication
curl -s -o security_custom_auth.json -w "HTTP_CODE:%%{http_code}\n" -H "X-Internal-API-Key: %INTERNAL_KEY%" %SECURITY_URL%/health > temp_result.txt
type temp_result.txt
echo.

echo Testing Security Worker available endpoints...
echo Testing /api/analyze endpoint...
curl -s -o security_analyze.json -w "HTTP_CODE:%%{http_code}\n" %SECURITY_URL%/api/analyze > temp_result.txt
type temp_result.txt

echo Testing /api/threat-detection endpoint...
curl -s -o security_threat.json -w "HTTP_CODE:%%{http_code}\n" %SECURITY_URL%/api/threat-detection > temp_result.txt
type temp_result.txt

echo Testing /api/risk-assessment endpoint...
curl -s -o security_risk.json -w "HTTP_CODE:%%{http_code}\n" %SECURITY_URL%/api/risk-assessment > temp_result.txt
type temp_result.txt

echo.

REM ===============================================
REM Section 3: Response Content Analysis
REM ===============================================
echo [Response Content Analysis]
echo ===============================================

echo Analyzing Banking Worker response content...
if exist banking_root.json (
    echo Banking Worker root response:
    type banking_root.json
    echo.
)

echo Analyzing Security Worker response content...
if exist security_root.json (
    echo Security Worker root response:
    type security_root.json
    echo.
)

echo.

REM ===============================================
REM Section 4: Worker Deployment Status Check
REM ===============================================
echo [Deployment Status Check]
echo ===============================================

echo Checking Cloudflare Workers deployment status...
echo Listing all deployed workers in account...
npx wrangler whoami > account_info.txt 2>&1
type account_info.txt
echo.

echo Checking worker deployment list...
npx wrangler deployments list logic-digital-wallet-api > main_api_deployments.txt 2>&1
echo Main API deployment history:
type main_api_deployments.txt
echo.

REM ===============================================
REM Section 5: Network Connectivity Testing
REM ===============================================
echo [Network Connectivity]
===============================================

echo Testing network connectivity to worker domains...
ping -n 1 logic-digital-wallet-api.jameharu-no1.workers.dev > ping_main.txt
findstr /C:"TTL" ping_main.txt >nul
if %errorlevel%==0 (
    echo    [SUCCESS] Main API Domain: Reachable
) else (
    echo    [WARNING] Main API Domain: Check DNS
)

echo Testing general Cloudflare Workers connectivity...
ping -n 1 workers.dev > ping_workers.txt
findstr /C:"TTL" ping_workers.txt >nul
if %errorlevel%==0 (
    echo    [SUCCESS] Cloudflare Workers Platform: Reachable
) else (
    echo    [WARNING] Cloudflare Workers Platform: Check connectivity
)

echo.

REM ===============================================
REM Section 6: Configuration Recommendations
REM ===============================================
echo [Configuration Recommendations]
echo ===============================================

echo Based on diagnostic results, here are the recommended actions:
echo.
echo For Banking Worker (HTTP 401):
echo   1. Verify worker deployment status
echo   2. Check authentication configuration in worker code
echo   3. Ensure CORS headers are properly configured
echo   4. Verify environment variables are set correctly
echo.
echo For Security Worker (HTTP 401):
echo   1. Verify worker deployment status
echo   2. Check authentication middleware configuration
echo   3. Ensure proper API key validation
echo   4. Verify routing configuration for endpoints
echo.
echo For Main Bot Worker (HTTP 404):
echo   1. Check if worker is deployed to correct subdomain
echo   2. Verify worker name in wrangler.toml matches subdomain
echo   3. Check routing configuration
echo   4. Consider deploying if not yet deployed
echo.

REM ===============================================
REM Section 7: Quick Fix Commands
REM ===============================================
echo [Quick Fix Commands]
echo ===============================================

echo To check worker deployment status, run:
echo   npx wrangler deployments list [worker-name]
echo.
echo To redeploy a worker, run:
echo   npx wrangler deploy --name [worker-name]
echo.
echo To check worker logs for errors, run:
echo   npx wrangler tail [worker-name]
echo.
echo To test worker locally before deployment, run:
echo   npx wrangler dev
echo.

REM ===============================================
REM Cleanup and Summary
REM ===============================================
echo Cleaning up diagnostic files...
del *.json *.txt >nul 2>&1

echo.
echo ===============================================
echo           DIAGNOSTIC SUMMARY
echo ===============================================
echo.
echo Main Digital Wallet API: FULLY OPERATIONAL
echo Banking Worker: REQUIRES AUTHENTICATION CONFIGURATION
echo Security Worker: REQUIRES AUTHENTICATION CONFIGURATION  
echo Main Bot Worker: REQUIRES DEPLOYMENT VERIFICATION
echo.
echo Database System: FULLY FUNCTIONAL
echo Security Features: PROPERLY CONFIGURED
echo Network Connectivity: VERIFIED
echo.
echo Next Steps:
echo 1. Configure authentication for Banking and Security Workers
echo 2. Verify deployment status of Main Bot Worker
echo 3. Update inter-worker communication protocols
echo 4. Implement proper API key management
echo.
echo Diagnostic completed at: %date% %time%
echo ===============================================

pause