@echo off
title AuraClass - Online Assignment Portal
echo ===================================================
echo   Starting AuraClass Portal (Backend + Frontend)
echo ===================================================

echo [1/2] Starting Express Backend on port 5000...
start "AuraClass Backend (Port 5000)" cmd /k "cd /d C:\Users\HP\.gemini\antigravity\scratch\assignment-portal\backend && ""C:\Users\HP\.nodejs\node.exe"" server.js"

echo [2/2] Starting Vite Frontend on port 5173...
start "AuraClass Frontend (Port 5173)" cmd /k "cd /d C:\Users\HP\.gemini\antigravity\scratch\assignment-portal\frontend && ""C:\Users\HP\.nodejs\npm.cmd"" run dev -- --host --port 5173"

echo Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening AuraClass in your browser...
start http://localhost:5173/

echo ===================================================
echo AuraClass is running!
echo Website URL: http://localhost:5173/
echo ===================================================
pause
