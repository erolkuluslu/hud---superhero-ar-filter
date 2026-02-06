# Sergi Dökümanı – AR Oyun Açıklamaları

Bu döküman, **Dinozor Dünyası**, **Pençe Oyunu** ve **Müzik Stüdyosu** oyunlarını sergi formu sorularına göre açıklar. Sergide sunulacak **2 oyun** bu üçünden seçilebilir; her biri aşağıdaki sorulara göre doldurulmuştur.

---

## Genel Açıklama (Tüm Oyunlar)

Bu oyunlar, **web tabanlı artırılmış gerçeklik (AR)** deneyimleridir. Kullanıcı webcam ile kameraya görünür; **Google MediaPipe** ile el, yüz ve vücut takibi yapılır. **React Three Fiber (Three.js)** ile 3D nesneler kameranın üzerine çizilir. Klavye veya oyun kolu gerekmez; tüm kontrol **el hareketleri ve vücut hareketleri** ile yapılır.

---

# OYUN 1: DİNOZOR DÜNYASI (DinosaurGame)

## Oyunun adı
**Dinozor Dünyası** (Dinosaur Game)

## Oyunun amacı
Kullanıcının el hareketleriyle ekrandaki 3D dinozoru **sürüklemesi**, **döndürmesi**, **büyütüp küçültmesi**, **yürütmesi** ve **sevmesi**; böylece el takibini ve jest tanımayı eğlenceli bir şekilde deneyimlemesi.

## Hedef kitle
Çocuklar ve aileler; el–göz koordinasyonu ve jest tabanlı etkileşimle tanışmak isteyen her yaştan kullanıcı.

## Nasıl oynanır?
- **Sürükleme:** Tek el ile **başparmak ve işaret parmağını birleştir (pinch)**; dinozoru sürükleyin.
- **Boyutlandırma:** İki el ile **her iki elde pinch** yapıp elleri birbirinden uzaklaştırın / yaklaştırın.
- **Döndürme:** İki el ile pinch yapıp elleri **direksiyon gibi çevirin**.
- **Yürütme:** **Açık avuç** ile ekranda bir noktaya **işaret edin**; dinozor o yöne yürür.
- **Sevme:** **Yumruk** yapıp dinozora yaklaşın; dinozor sevildiğinde tepki verir (animasyon).
- Üç dinozor türü seçilebilir: **T-Rex**, **Brontosaurus**, **Triceratops**.

## Kullanılan teknoloji
- **El takibi:** MediaPipe Hand Landmarks (21 nokta).
- **Görselleştirme:** React Three Fiber, Three.js, Bloom efektleri.
- **Kamera:** Webcam (1280×720 önerilir).

## Oyun süresi
Süre sınırı yoktur; serbest etkileşim.

## Donanım / yazılım gereksinimleri
- Webcam (tercihen 1280×720).
- WebGL 2 destekleyen tarayıcı (Chrome, Edge önerilir).
- Modern bilgisayar (el takibi ve 3D için yeterli işlemci).

## Özet (tek cümle)
El hareketleriyle (sürükle, döndür, büyüt/küçült, yürüt, sev) 3D dinozoru kontrol ettiğiniz AR deneyimidir.

---

# OYUN 2: PENÇE OYUNU (TheClawGame)

## Oyunun adı
**Pençe Oyunu** (The Claw Game) – “Uzaylıları Yakala”

## Oyunun amacı
Belirli süre içinde (60 saniye) **el ile pinch (tutma) hareketi** kullanarak ekrandaki **uzaylı** karakterleri **yakalayıp** ortadaki **yeşil deliğe (portal)** bırakarak **puan** toplamak.

## Hedef kitle
Her yaş; refleks ve el–göz koordinasyonu gerektiren kısa süreli bir beceri oyunu.

## Nasıl oynanır?
1. **“Oyunu Başlat”** ile 60 saniyelik süre başlar.
2. **Elinizi kameraya** gösterin.
3. **Parmakları birleştirerek (pinch)** bir uzaylıya yaklaşın → uzaylı **tutulur** ve elinizi takip eder.
4. Uzaylıyı **ortadaki yeşil deliğe** sürükleyin.
5. **Parmakları açarak** deliğin üzerinde bırakın → **100 puan**.
6. Delik dışında bırakırsanız uzaylı geri döner; tekrar deneyin.
7. 60 saniye içinde **en yüksek puan** hedeflenir.

## Kullanılan teknoloji
- **El takibi:** MediaPipe Hand Landmarks (başparmak–işaret parmağı mesafesi ile pinch algılama).
- **3D:** React Three Fiber; uzaylı modelleri, delik (portal), pinch göstergesi, el iskeleti çizimi.
- **Oyun mantığı:** Süre sayacı (60 sn), puan, uzaylının tutulması/bırakılması ve yeni uzaylı spawn.

## Oyun süresi
**60 saniye** (tek round). “Tekrar Oyna” ile yeniden başlanır.

## Donanım / yazılım gereksinimleri
- Webcam (1280×720 önerilir).
- WebGL 2 destekleyen tarayıcı.
- Ses gerekmez; görsel odaklı.

## Özet (tek cümle)
Pinch hareketiyle uzaylıları tutup ortadaki deliğe bırakarak 60 saniyede puan topladığınız AR pençe oyunudur.

---

# OYUN 3: MÜZİK STÜDİYOSU (MusicGame)

## Oyunun adı
**Müzik Stüdyosu** (Music Game) – “Hareketlerinle Müzik Yarat!”

## Oyunun amacı
**El konumu**, **vücut eğimi**, **zıplama** ve **ağız açma** gibi hareketlerle **canlı müzik** üretmek; melodİ, davul, bas, pad ve arpej seslerini jestlerle kontrol etmek.

## Hedef kitle
Müzik ve hareketi birleştirmek isteyen her yaş; özellikle eğitim ve eğlence amaçlı etkileşimli müzik deneyimi arayanlar.

## Nasıl oynanır?
- **“BAŞLA”** ile ses sistemi açılır ve hareketler ses üretmeye başlar.
- **Sol el (ekranın solunda):** Elin konumu **melodi** (yükseklik: yukarı/aşağı, ses şiddeti: sola/sağa) kontrol eder; sürekli ton üretir.
- **Sağ el (ekranın sağında):** **Parmak kıstırma (pinch)** ile davul çalınır. Elin **dikey konumu** hangi davulu seçer:
  - **Üst:** Hi-hat  
  - **Orta-üst:** Trampet (snare)  
  - **Orta-alt:** Alkış (clap)  
  - **Alt:** Kick  
- **Vücut:** Sağa/sola **eğilme** = **pad** sesi; **zıplama** (kalça yukarı) = **bas** vuruşu.
- **Yüz:** **Ağzı açma** = **arpej** (sıralı nota) tetiklenir.
- **“DUR”** ile tüm sesler kesilir.

## Kullanılan teknoloji
- **El takibi:** MediaPipe Hand Landmarks (konum + pinch).
- **Vücut takibi:** MediaPipe Pose (omuz, kalça vb. ile eğim ve zıplama).
- **Yüz takibi:** MediaPipe Face (dudak landmark’ları ile ağız açıklığı).
- **Ses:** Web Audio API (oscillator, gain, panner; kick, snare, hi-hat, clap, melodi, bas, pad, arpej sentezlenir).

## Oyun süresi
Süre sınırı yok; kullanıcı “DUR”a basana kadar serbest çalım.

## Donanım / yazılım gereksinimleri
- Webcam (1280×720 önerilir).
- WebGL 2 ve **Web Audio API** destekleyen tarayıcı.
- Hoparlör veya kulaklık (ses çıkışı gerekli).

## Özet (tek cümle)
El, vücut ve yüz hareketleriyle melodİ, davul, bas, pad ve arpej ürettiğiniz AR müzik stüdyosu deneyimidir.

---

## Sergi İçin 2 Oyun Seçimi

| Seçenek | Oyun 1       | Oyun 2       |
|--------|--------------|--------------|
| A      | Dinozor Dünyası | Pençe Oyunu   |
| B      | Dinozor Dünyası | Müzik Stüdyosu |
| C      | Pençe Oyunu    | Müzik Stüdyosu |

Yukarıdaki sorular, seçeceğiniz 2 oyun için doğrudan sergi formuna kopyalanabilir veya kısaltılarak kullanılabilir.

---
*Proje: Superhero AR Arcade & HUD – React, Vite, MediaPipe, React Three Fiber*
