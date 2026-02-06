@echo off
cd /d "%~dp0\.."

REM Bagimliliklar yoksa yukle
if not exist "node_modules\" (
    echo Bagimlilklar yukleniyor...
    npm install
)

REM Sunucuyu baslat
echo Sunucu baslatiliyor...
start "" /min cmd /c "npm run dev"

REM Sunucu hazir olana kadar bekle (localhost:3000 kontrol)
echo Sunucu bekleniyor...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo .
    goto WAIT_LOOP
)

echo Sunucu hazir!
timeout /t 1 /nobreak >nul

REM Chrome tam ekran (kiosk mode) ac
start "" chrome --kiosk --start-fullscreen "http://localhost:3000"
