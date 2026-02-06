# Pençe Oyunu - PowerShell Başlatıcı
# Daha gelişmiş hata kontrolü ve loglama

# Admin yetkisi kontrolü (isteğe bağlı)
# $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Proje dizini
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "================================" -ForegroundColor Cyan
Write-Host "   PENÇE OYUNU BAŞLATICI" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Node.js kontrolü
Write-Host "Node.js kontrol ediliyor..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js bulundu: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ HATA: Node.js bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen https://nodejs.org adresinden Node.js yükleyin." -ForegroundColor Yellow
    Read-Host "Devam etmek için Enter'a basın"
    exit 1
}

# npm kontrolü
Write-Host "npm kontrol ediliyor..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm bulundu: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ HATA: npm bulunamadı!" -ForegroundColor Red
    exit 1
}

# node_modules kontrolü
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Bağımlılıklar yükleniyor..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Bağımlılıklar yüklenemedi!" -ForegroundColor Red
        Read-Host "Devam etmek için Enter'a basın"
        exit 1
    }
    Write-Host "✓ Bağımlılıklar yüklendi" -ForegroundColor Green
}

# Eski süreçleri temizle
Write-Host ""
Write-Host "Eski süreçler kontrol ediliyor..." -ForegroundColor Yellow
$existingProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" }
if ($existingProcess) {
    Write-Host "Eski süreç bulundu, kapatılıyor..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Development server'ı başlat
Write-Host ""
Write-Host "Oyun başlatılıyor..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectDir'; npm run dev" -WindowStyle Minimized

# Tarayıcının hazır olması için bekle
Write-Host "Tarayıcı açılıyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 12

# Varsayılan tarayıcıda aç
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   OYUN BAŞLATILDI!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Oyunu kapatmak için arka planda çalışan" -ForegroundColor Yellow
Write-Host "PowerShell penceresini kapatın." -ForegroundColor Yellow
Write-Host ""

# Log dosyası oluştur
$logFile = Join-Path $projectDir "game-startup.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] Oyun başlatıldı"

Write-Host "Bu pencereyi kapatabilirsiniz." -ForegroundColor Gray
Start-Sleep -Seconds 3
