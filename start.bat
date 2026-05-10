@echo off
title e-Commerce Manager
cd /d "%~dp0"

echo.
echo   ========================================
echo     e-Commerce Operations ^& Warehouse Mgr
echo   ========================================
echo.

REM Check frontend deps
if not exist "node_modules" (
    echo  [1/3] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo  Frontend deps install failed!
        pause
        exit /b 1
    )
)

REM Check backend deps
if not exist "server\node_modules" (
    echo  [2/3] Installing backend dependencies...
    cd server
    call npm install
    cd ..
    if errorlevel 1 (
        echo  Backend deps install failed!
        pause
        exit /b 1
    )
)

REM Start services
echo  [3/3] Starting services...
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Account:  admin / admin123
echo.
echo   Close this window to stop all services.
echo.

npx concurrently "cd server && node index.js" "npx vite"
