@echo off
echo =====================================
echo   Library Management System
echo   Starting...
echo =====================================
echo.

REM Backend server start karo (background mein)
echo [1] Backend Server start ho raha hai (Port 5000)...
start "Library Backend" cmd /k "cd /d %~dp0backend && node server.js"

REM 2 second wait karo
timeout /t 2 /nobreak >nul

REM Frontend (React) start karo
echo [2] Frontend (React) start ho raha hai (Port 5173)...
start "Library Frontend" cmd /k "cd /d %~dp0 && npm run dev"

REM 3 second wait karo
timeout /t 3 /nobreak >nul

REM Browser mein open karo
echo [3] Browser mein open ho raha hai...
start http://localhost:5173

echo.
echo ✅ Library System chal raha hai!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:5000
echo.
echo Band karne ke liye dono CMD windows close karo.
