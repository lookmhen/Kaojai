@echo off
setlocal
title KaoJai (Server and Client Launcher)
color 0B

echo ========================================================
echo         Starting KaoJai System (Server + Client)
echo ========================================================
echo.

echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

set "APP_DIR=%~dp0"

echo [2/4] Checking and installing dependencies if needed...
if not exist "%APP_DIR%server\node_modules" (
    echo [INFO] Installing server dependencies...
    cd /d "%APP_DIR%server" && call npm install
)
if not exist "%APP_DIR%client\node_modules" (
    echo [INFO] Installing client dependencies...
    cd /d "%APP_DIR%client" && call npm install
)

echo [3/4] Launching Backend Server (Port: 4000)...
start "KaoJai - Backend Server" cmd /k "cd /d "%APP_DIR%server" && npm start"

ping 127.0.0.1 -n 3 >nul

echo [4/4] Launching Frontend Client (Port: 3000)...
start "KaoJai - Frontend Client" cmd /k "cd /d "%APP_DIR%client" && npm run dev"

ping 127.0.0.1 -n 3 >nul

echo.
echo ========================================================
echo    KaoJai System Launched Successfully!
echo.
echo    Client URL : http://localhost:3000
echo    Server URL : http://localhost:4000
echo ========================================================
echo.
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo [INFO] Server and Client are running in separate terminal windows.
echo Press any key to close this launcher window...
pause >nul
exit /b 0
