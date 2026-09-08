@echo off
chcp 65001 >nul
title KaoJai (เข้าใจ) - Full Stack Launcher
color 0B

echo ========================================================
echo         🚀 กำลังเริ่มต้นระบบ KaoJai (เข้าใจ)
echo ========================================================
echo.
echo [1/3] กำลังตรวจสอบ Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] ไม่พบ Node.js ในเครื่อง! กรุณาติดตั้ง Node.js ก่อนเริ่มใช้งาน
    echo ดาวน์โหลดได้ที่: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] กำลังเปิด Backend Server (Port: 4000)...
start "KaoJai - Backend Server (Port: 4000)" cmd /k "cd /d %~dp0server && echo ======================================== && echo  [KaoJai Server] Starting on port 4000... && echo ======================================== && npm start"

timeout /t 2 /nobreak >nul

echo [3/3] กำลังเปิด Frontend Client (Port: 3000)...
start "KaoJai - Frontend Client (Port: 3000)" cmd /k "cd /d %~dp0client && echo ======================================== && echo  [KaoJai Client] Starting Vite Dev Server... && echo ======================================== && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo    ✅ เริ่มต้นระบบเรียบร้อยแล้ว!
echo.
echo    🌐 Client URL : http://localhost:3000
echo    🔌 Server URL : http://localhost:4000
echo ========================================================
echo.
echo กำลังเปิดเว็บเบราว์เซอร์ไปยัง http://localhost:3000 ...
start http://localhost:3000

exit /b 0
