@echo off
cd /d "%~dp0\.."
if not exist "node_modules\" (npm install)
start "" cmd /c "npm run dev"
timeout /t 12 /nobreak >nul
start http://localhost:3000
