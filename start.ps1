$Host.UI.RawUI.WindowTitle = "e-Commerce Manager"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "    e-Commerce Operations & Warehouse Mgr" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Check frontend deps
if (-not (Test-Path "node_modules")) {
    Write-Host " [1/3] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host " Frontend deps install failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check backend deps
if (-not (Test-Path "server\node_modules")) {
    Write-Host " [2/3] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location server
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host " Backend deps install failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start services
Write-Host " [3/3] Starting services..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  Account:  admin / admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Close this window to stop all services." -ForegroundColor Gray
Write-Host ""

npx concurrently "cd server && node index.js" "npx vite"
