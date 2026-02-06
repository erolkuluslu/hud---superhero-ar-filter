## OYUN: MÜZİK STÜDYOSU (MusicGame)

### 1. Oyunun adı
**Müzik Stüdyosu** (Music Game) – “Hareketlerinle Müzik Yarat!”

### 2. Oyunun konusu
Oyun, **hareketle kontrol edilen sanal bir müzik stüdyosu** temasındadır. Ekranda kameranın canlı görüntüsü üzerinde **sol tarafta melodİ bölgesi**, **sağ tarafta davul bölgeleri** (hi-hat, trampet, alkış, kick) ve **merkezde yüz/vücut** ile tetiklenen sesler (arpej, pad, bas) için görsel bölgeler vardır. Konu: **hiçbir fiziksel enstrüman veya dokunmatik ekran kullanmadan**, yalnızca **el konumu**, **vücut eğimi**, **zıplama** ve **ağız açma** gibi hareketlerle **gerçek zamanlı müzik** üretmektir. Sol el solda hareket ettikçe melodi perdesi ve ses şiddeti değişir; sağ el sağda parmak kıstırıldığında elin konumuna göre farklı davullar çalar. Gövde sağa/sola eğildiğinde pad (arka plan akor) sesi, zıplama bas vuruşu tetikler; ağız açıldığında kısa arpej çalınır. Tüm sesler **Web Audio API** ile canlı sentezlenir; tema, **bedenini enstrüman gibi kullanarak** etkileşimli müzik yapmaktır.

### 3. Oyunun amacı
Kullanıcının **el konumu**, **vücut eğimi**, **zıplama** ve **ağız açma** gibi hareketleriyle gerçek zamanlı olarak **melodi, davul, bas, pad ve arpej** sesleri üretmesini sağlayan, hareket tabanlı bir müzik deneyimi sunmak.

### 4. Hedef kitle
Müziği ve teknolojiyi birleştirmek isteyen öğrenciler, çocuklar ve yetişkinler; özellikle **etkileşimli müzik**, **hareketle kontrol** ve **STEM/STEAM** projeleriyle ilgilenenler.

### 5. Nasıl oynanır?
- Arayüzde **“BAŞLA”** tuşuna basarak ses motorunu ve takibi aktif hale getirin.
- **Sol el (ekranın sol tarafında):**
  - Elinizi sol bölgede yukarı/aşağı hareket ettirmek → **melodi notasının yüksekliğini** değiştirir.
  - Sol bölgede elin yatay konumu → **ses şiddetini (volume)** etkiler.
- **Sağ el (ekranın sağ tarafında):**
  - **Parmak kıstırma (pinch)** hareketi yaptığınızda **davul sesleri** tetiklenir.
  - Sağ elin dikey konumuna göre farklı davullar çalışır:
    - Üst bölge: **Hi-hat**
    - Orta-üst: **Trampet (snare)**
    - Orta-alt: **Alkış (clap)**
    - Alt: **Kick (büyük davul)**
- **Vücut (gövde):**
  - Sağa/sola **eğilme** → **pad** (uzun, arka plan akor sesi) tonunu ve stereo konumunu değiştirir.
  - **Zıplama** (kalça yüksekliği aniden artınca) → **bas vuruşu** (bass) çalar.
- **Yüz:**
  - **Ağzı açma** hareketi → kısa bir **arpej** (sıralı nota dizisi) tetikler.
- **“DUR”** tuşu ile tüm sesler kapatılır ve oyun pasif hale gelir.

### 6. Kullanılan teknoloji
- **Görüntü işleme:**
  - MediaPipe **Hand**: Elin konumu ve pinch jesti için.
  - MediaPipe **Pose**: Omuz ve kalça noktaları ile gövde eğimi ve zıplama tespiti için.
  - MediaPipe **Face**: Dudak landmark’ları ile ağız açıklığı (ağzı aç/kapa) tespiti için.
- **Ses üretimi:**
  - **Web Audio API** ile gerçek zamanlı sentez:
    - Melodi için sine dalga oscillator,
    - Bas için sawtooth dalga ve kısa gate,
    - Davullar için noise + filtre (kick/snare/hihat/clap),
    - Pad için triangle dalga, stereo panner,
    - Arpej için kısa triangle notalar.
- **Görselleştirme:**
  - React Three Fiber ve Three.js ile:
    - El ve vücut iskeletleri (joint ve kemik çizimleri),
    - Aktif ses bölgelerini gösteren renkli alanlar,
    - Ses aktivitesine göre hareketlenen halka ve göstergeler.

### 7. Oyun süresi
Sabit süre sınırı yoktur. Kullanıcı **“BAŞLA”** ile dilediği kadar çalabilir, **“DUR”** ile sonlandırır. Sergi ortamında tipik deneyim süresi kişi başı 1–3 dakikadır.

### 8. Kullanılacak malzemeler
- **Kamera (webcam):** Bilgisayara takılı veya dahili webcam; 720p (1280×720) veya üzeri önerilir. El, vücut ve yüz takibinin birlikte çalışması için kullanıcının baş ve üst gövdesinin kamerada görünmesi gerekir.
- **Bilgisayar:** Uygulamayı ve tarayıcıyı çalıştıran, webcam’i bağlayan masaüstü veya dizüstü bilgisayar. El, pose ve yüz modelleri ile Web Audio API için yeterli işlemci ve WebGL 2 destekleyen grafik kartı gerekir.
- **Monitör:** Oyun arayüzünü, canlı kamerayı ve müzik bölgelerini (melodi, davul, pad vb.) göstermek için ekran. Kullanıcının kendini ve bölgeleri rahatça görebilmesi için yeterli boyut (tercihen 15" ve üzeri) önerilir.
- **Hoparlör veya kulaklık:** Üretilen melodİ, davul, bas, pad ve arpej seslerinin duyulması için ses çıkışı zorunludur.

### 9. Donanım / yazılım gereksinimleri
- Webcam (1280×720 çözünürlük önerilir).
- WebGL 2 ve **Web Audio API** destekleyen güncel tarayıcı (Chrome, Edge vb.).
- Hoparlör veya kulaklık (sesin duyulabilmesi için).

### 10. Detaylı özet
**Müzik Stüdyosu**, webcam ile **el**, **vücut** ve **yüz** takibini kullanarak **dokunmadan** gerçek zamanlı müzik ürettiğiniz bir **artırılmış gerçeklik** deneyimidir. “BAŞLA” ile ses motoru açılır; ekranda sol tarafta **melodi bölgesi**, sağ tarafta **davul bölgeleri** (üstten alta: hi-hat, trampet, alkış, kick) ve merkezde yüz/vücut göstergeleri görünür. **Sol el** solda hareket ettikçe melodi notasının **yüksekliği** (yukarı/aşağı) ve **ses şiddeti** (sola/sağa) değişir; **sağ el** sağda **pinch** yaptığınızda elin dikey konumuna göre farklı davul sesleri tetiklenir. **Vücut** sağa/sola eğildiğinde **pad** (uzun arka plan tonu) ve stereo pan, **zıplama** yapıldığında **bas** vuruşu çalar; **ağız açma** ile kısa **arpej** dizisi çalınır. Tüm sesler tarayıcıda **Web Audio API** ile canlı sentezlenir; el ve vücut iskeletleri ekranda çizilir, hangi bölgenin aktif olduğu renk ve ışıkla gösterilir. Amaç, **bedeni bir enstrüman gibi kullanarak** etkileşimli, süre sınırı olmayan bir müzik deneyimi sunmaktır; sergide tipik kullanım 1–3 dakikadır.

