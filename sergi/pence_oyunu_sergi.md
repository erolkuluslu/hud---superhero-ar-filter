## OYUN: PENÇE OYUNU (TheClawGame)

### 1. Oyunun adı
**Pençe Oyunu** (The Claw Game) – “Uzaylıları Yakala”

### 2. Oyunun konusu
Oyun, **uzay temalı** bir **pençe (claw) makinesi** simülasyonudur. Ekranda kameranın canlı görüntüsü üzerinde **renkli, ışıklı 3D uzaylı** figürleri görünür; ortada **büyük yeşil bir delik (portal)** vardır ve uzaylılar sahnenin kenarlarında (köşe ve kenar noktalarında) konumlanır. Konu: **gerçek dünyada** elinizi kameraya gösterip **pinch (parmakları birleştirme)** hareketiyle sanal uzaylıyı “tutmak”, elinizi hareket ettirdikçe uzaylının eli takip etmesi ve nihayet **yeşil deliğin üzerinde** parmakları açarak uzaylıyı bırakmak; deliğe düşen her uzaylı **100 puan** kazandırır. Süre **60 saniye** ile sınırlıdır; bu sürede mümkün olduğunca çok uzaylıyı deliğe düşürerek yüksek skor hedeflenir. Uzaylılar antenli, sevimli tasarımlı; deliğe yaklaştığınızda ışıklar ve halkalar görsel geri bildirim verir. Temel fikir: **artırılmış gerçeklik** ile klasik arcade pençe oyununu **dokunmadan**, yalnızca **el hareketi** ile oynamaktır.

### 3. Oyunun amacı
Belirli süre içinde (**60 saniye**) **el ile pinch (tutma) hareketi** kullanarak ekrandaki **uzaylı** karakterleri **yakalayıp** ortadaki **yeşil deliğe (portal)** bırakarak **puan** toplamak.

### 4. Hedef kitle  
Her yaştan kullanıcı; refleks ve el–göz koordinasyonu gerektiren kısa süreli beceri oyunu arayanlar.

### 5. Nasıl oynanır?
1. **“OYUNU BAŞLAT”** tuşuna basarak 60 saniyelik oyunu başlatın.
2. **Elinizi kameraya** gösterin.
3. **Parmakları birleştirerek (pinch)** bir uzaylıya yaklaşın → uzaylı **tutulur** ve elinizi takip eder.
4. Uzaylıyı ekrandaki **büyük yeşil deliğin** (portal) üzerine sürükleyin.
5. **Parmakları açarak** deliğin üzerinde bırakın → **100 puan** kazanırsınız ve uzaylı deliğe düşer.
6. Delik dışında bırakırsanız uzaylı eski yerine döner; tekrar deneyebilirsiniz.
7. 60 saniye içinde **olabildiğince çok uzaylıyı** deliğe düşürerek en yüksek puanı almaya çalışın.

### 6. Kullanılan teknoloji
- **El takibi:** MediaPipe Hand Landmarks (başparmak–işaret parmağı mesafesi ile pinch algılama).
- **3D sahne:** React Three Fiber ve Three.js ile:
  - Işıklı, animasyonlu **uzaylı** modelleri,
  - Ortadaki **büyük yeşil delik/portal**,
  - El iskeleti ve **pinch alanı** görselleştirmesi.
- **Oyun mantığı:** Süre sayacı (60 sn), skor sistemi, uzaylıların tutulması/bırakılması ve yeni uzaylı spawn etme.

### 7. Oyun süresi
- Tek oyun süresi: **60 saniye**.  
- Süre bittiğinde skor ekranda gösterilir, **“Tekrar Oyna”** ile yeni tur başlatılabilir.

### 8. Kullanılacak malzemeler
- **Kamera (webcam):** Bilgisayara takılı veya dahili webcam; 720p (1280×720) veya üzeri çözünürlük önerilir. Pinch hareketinin doğru algılanması için kameranın kullanıcının ellerini karşıdan görmesi gerekir.
- **Bilgisayar:** Oyunu ve tarayıcıyı çalıştıran, webcam’e ev sahipliği yapan masaüstü veya dizüstü bilgisayar. Gerçek zamanlı el takibi ve 3D sahne için yeterli işlemci ve WebGL 2 destekleyen grafik kartı gerekir.
- **Monitör:** Oyun sahnesini, canlı kamerayı ve skor/süre bilgisini göstermek için ekran. Kullanıcının uzaylıları ve yeşil deliği net görebilmesi için yeterli boyut (tercihen 15" ve üzeri) önerilir.

### 9. Donanım / yazılım gereksinimleri
- Webcam (1280×720 çözünürlük önerilir).
- WebGL 2 destekleyen modern tarayıcı (Chrome, Edge vb.).
- Orta seviye işlemci ve GPU (gerçek zamanlı el takibi ve 3D sahne için).

### 10. Detaylı özet
**Pençe Oyunu**, webcam ve **artırılmış gerçeklik** kullanarak **klasik arcade pençe makinesi** deneyimini **dokunmadan**, yalnızca **el hareketi** ile sunan bir beceri oyunudur. Ekranda canlı kameranız üzerinde **renkli 3D uzaylı** figürleri ve ortada **büyük yeşil bir portal (delik)** görünür; “Oyunu Başlat” ile **60 saniyelik** bir tur başlar. **Parmakları birleştirerek (pinch)** bir uzaylıya yaklaştığınızda uzaylı “tutulur” ve elinizi takip eder; uzaylıyı yeşil deliğin üzerine getirip **parmakları açarak** bıraktığınızda uzaylı deliğe düşer ve **100 puan** kazanırsınız. Delik dışında bırakırsanız uzaylı eski konumuna döner. Süre boyunca yeni uzaylılar sahneye eklenir; hedef **60 saniyede en yüksek skoru** toplamaktır. El iskeleti ve pinch göstergesi ekranda görünür; uzaylıya yaklaştığınızda veya deliğe yaklaştığınızda ışık ve halka animasyonları geri bildirim sağlar. Oyun, **el–göz koordinasyonu** ve **zaman baskısı altında karar verme** becerisini eğlenceli bir AR ortamında vurgular.

