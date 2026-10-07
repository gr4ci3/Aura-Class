@echo off
start "AuraClass-Backend" "C:\Users\HP\.nodejs\node.exe" "C:\Users\HP\.gemini\antigravity\scratch\assignment-portal\backend\server.js"
cd /d "C:\Users\HP\.gemini\antigravity\scratch\assignment-portal\frontend"
start "AuraClass-Frontend" "C:\Users\HP\.nodejs\node.exe" "node_modules\vite\bin\vite.js" --host --port 5173
