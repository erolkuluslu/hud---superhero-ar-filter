# Windows Otomatik Başlatma Kılavuzu

Windows açılışında Pençe Oyunu'nu otomatik başlatmak için 3 farklı yöntem.

---

## 📋 Gereksinimler

✅ **Node.js yüklü olmalı**: https://nodejs.org (LTS sürümü önerilir)
✅ **Git Bash veya Terminal** (bağımlılıklar için)
✅ **Windows 10/11**

---

## 🚀 YÖNTEM 1: Startup Klasörü (EN KOLAY)

### Adım 1: Startup Klasörünü Aç
1. `Win + R` tuşlarına bas
2. Şunu yaz: `shell:startup`
3. Enter'a bas → Startup klasörü açılacak

### Adım 2: Kısayol Oluştur
1. `start-game-silent.vbs` dosyasına sağ tıkla
2. "Kısayol oluştur" seç
3. Oluşan kısayolu **Startup klasörüne** taşı

### Adım 3: Test Et
1. Bilgisayarı yeniden başlat
2. Açılışta 10-15 saniye bekle
3. Oyun otomatik açılacak

**Avantajları:**
- ✅ Çok kolay
- ✅ Hızlı kurulum
- ✅ Kolayca devre dışı bırakılabilir

**Dezavantajları:**
- ⚠️ Kullanıcı giriş yaptıktan sonra çalışır

---

## ⚙️ YÖNTEM 2: Task Scheduler (GELİŞMİŞ)

### Adım 1: Task Scheduler'ı Aç
1. `Win + R` → `taskschd.msc` yaz → Enter
2. Sağ tarafta "Create Task" tıkla

### Adım 2: Genel Ayarlar
**General** sekmesinde:
- Name: `Pençe Oyunu Otomatik`
- Description: `Windows açılışında oyunu başlat`
- ✅ "Run only when user is logged on" seç
- ❌ "Run with highest privileges" (gerek yok)

### Adım 3: Tetikleyici (Trigger)
**Triggers** sekmesinde:
1. "New" tıkla
2. Begin the task: **"At log on"** seç
3. Specific user: Kendi kullanıcı adın
4. Delay task for: **30 seconds** (Windows tam açılsın)
5. OK

### Adım 4: Eylem (Action)
**Actions** sekmesinde:
1. "New" tıkla
2. Action: **"Start a program"**
3. Program/script: `wscript.exe`
4. Add arguments: `"C:\TAM\YOL\start-game-silent.vbs"`
   - ⚠️ **TAM YOL** yazmalısın! Örnek:
   - `"C:\Users\Erol\Desktop\proje\start-game-silent.vbs"`
5. Start in: `C:\TAM\YOL` (vbs dosyasının klasörü)
6. OK

### Adım 5: Koşullar (Conditions)
**Conditions** sekmesinde:
- ❌ "Start the task only if the computer is on AC power" kaldır
- ❌ "Stop if the computer switches to battery power" kaldır

### Adım 6: Ayarlar (Settings)
**Settings** sekmesinde:
- ✅ "Allow task to be run on demand"
- ✅ "Run task as soon as possible after a scheduled start is missed"
- ❌ "Stop the task if it runs longer than" kaldır

### Adım 7: Kaydet ve Test
1. OK tıkla
2. Task listesinde bulup sağ tıkla → "Run" seç
3. Çalışıyor mu test et
4. Sonra bilgisayarı yeniden başlat

**Avantajları:**
- ✅ Daha güvenilir
- ✅ Gecikme ayarlanabilir
- ✅ Merkezi yönetim

**Dezavantajları:**
- ⚠️ Kurulum biraz karmaşık

---

## 🎯 YÖNTEM 3: Registry (UZMAN)

⚠️ **DİKKAT: Registry düzenlemesi risklidir. Yedek alın!**

### Adım 1: Registry Editor Aç
1. `Win + R` → `regedit` → Enter
2. Şu yolu bul:
```
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
```

### Adım 2: Yeni Değer Ekle
1. Sağ tarafta boş alana sağ tıkla
2. New → String Value
3. İsim: `PenceOyunu`
4. Değer: `"C:\TAM\YOL\start-game-silent.vbs"`

### Adım 3: Kaydet ve Test
1. Registry Editor'ü kapat
2. Bilgisayarı yeniden başlat

**Avantajları:**
- ✅ Sistem seviyesinde
- ✅ En hızlı başlatma

**Dezavantajları:**
- ⚠️ Registry düzenleme riski
- ⚠️ Teknik bilgi gerektirir

---

## 🛠️ SORUN GİDERME

### Oyun Açılmıyor
**Çözüm 1:** Bağımlılıkları yükle
```bash
cd C:\proje\klasoru
npm install
```

**Çözüm 2:** Node.js yüklü mü kontrol et
```bash
node --version
npm --version
```

**Çözüm 3:** Port kullanımda mı kontrol et
```bash
netstat -ano | findstr :3000
```
Port kullanımdaysa: `taskkill /PID [PID_NUMARASI] /F`

### Tarayıcı Açılmıyor
**Çözüm:** `start-game.bat` dosyasında bekleme süresini artır:
```batch
timeout /t 15 /nobreak >nul
```

### Hata Mesajları Görüyorum
**Çözüm:** Sessiz modu kapat ve normal bat dosyasını çalıştır:
```
start-game.bat
```
Hata mesajlarını oku ve düzelt.

---

## ⏹️ OTOMASYONu DEVRE DIŞI BIRAKMA

### Yöntem 1 için:
1. `Win + R` → `shell:startup`
2. Kısayolu sil

### Yöntem 2 için:
1. Task Scheduler aç
2. Görevi bul → Sağ tıkla → Disable/Delete

### Yöntem 3 için:
1. Registry Editor aç
2. `PenceOyunu` değerini sil

---

## 📝 NOTLAR

- 🔄 İlk açılışta 15-20 saniye sürebilir
- 🌐 Internet bağlantısı gerekmez (localhost)
- 🖥️ Arka planda node.exe çalışır (normal)
- 🔌 Kapatmak için Task Manager'dan node.exe'yi sonlandır

---

## 📞 DESTEK

Sorun yaşıyorsan:
1. `game-startup.log` dosyasını kontrol et
2. Task Manager'da node.exe çalışıyor mu bak
3. Manuel olarak `start-game.bat` çalıştır ve hatayı oku

---

## ✨ BONUS: ÖZELLEŞTİRME

### Başlatma Gecikmesi Ayarla
`start-game.bat` dosyasında:
```batch
timeout /t 15 /nobreak >nul  REM 15 saniye bekle
```

### Farklı Port Kullan
`package.json` dosyasında:
```json
"dev": "next dev -p 3001"
```

### Tarayıcı Seçimi
`start-game.bat` dosyasında:
```batch
REM Chrome
start chrome http://localhost:3000

REM Edge
start msedge http://localhost:3000

REM Firefox
start firefox http://localhost:3000
```

---

✅ **Kurulum tamamlandı!** Artık Windows açılışında oyun otomatik başlayacak.
