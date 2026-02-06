@echo off
REM Pençe Oyunu Otomatik Başlatıcı

REM Proje dizinine git
cd /d "%~dp0"

REM Terminal başlığını ayarla
title Pence Oyunu - Yukleniyor...

REM Node.js ve npm kurulu mu kontrol et
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Node.js yuklu degil!
    echo Lutfen https://nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)

REM Bağımlılıklar yüklü mü kontrol et
if not exist "node_modules\" (
    echo Bagimlilaklar yukleniyor...
    call npm install
)

REM Development server'ı başlat
echo Oyun baslatiliyor...
start "" cmd /c "npm run dev"

REM Tarayıcının açılması için bekle (10 saniye)
timeout /t 10 /nobreak >nul

REM Varsayılan tarayıcıda aç
start http://localhost:3000

REM Bilgilendirme
echo.
echo ========================================
echo  PENCE OYUNU BASLATILDI!
echo ========================================
echo.
echo Tarayici: http://localhost:3000
echo.
echo Oyunu kapatmak icin bu pencereyi kapatin.
echo.
pause
