## OYUN: DİNOZOR DÜNYASI (DinosaurGame)

### 1. Oyunun adı
**Dinozor Dünyası** (Dinosaur Game)

### 2. Oyunun konusu
Oyun, **kameranın önünde** gerçek dünyanızla **aynı ekranda** bir arada görünen **3D dinozorlar** dünyasında geçer. Arka planda gökyüzü ve yeşil arazi teması vardır; dinozorlar bu ortamda canlı gibi hareket eder: yürüyebilir, kuyruk sallayabilir, sevildiğinde mutluluk animasyonu (yanaklarda pembe noktalar, hafif sallanma) gösterir. Konu, **dokunmadan**, yalnızca **el hareketleriyle** bu sanal dinozorlarla etkileşim kurmaktır: onları taşımak, döndürmek, büyütüp küçültmek, bir noktaya yürütmek ve yumrukla “sevme” jestiyle tepki aldırmak. Üç farklı dinozor kişiliği vardır — **T-Rex** (güçlü ve cesur), **Brontosaurus** (nazik dev), **Triceratops** (boynuzlu kahraman) — ve kullanıcı istediği karakteri seçerek deneyimi kişiselleştirir. Temel fikir: **artırılmış gerçeklik** ile el ve jest kontrolünü öğrenirken eğlenmek.

### 3. Oyunun amacı
Kullanıcının el hareketleriyle ekrandaki 3D dinozoru **sürüklemesi**, **döndürmesi**, **büyütüp küçültmesi**, **yürütmesi** ve **sevmesi**; böylece el takibini ve jest tanımayı eğlenceli bir şekilde deneyimlemesi.

### 4. Hedef kitle
Çocuklar ve aileler; el–göz koordinasyonu ve jest tabanlı etkileşimle tanışmak isteyen her yaştan kullanıcı.

### 5. Nasıl oynanır?
- **Sürükleme:** Tek el ile **başparmak ve işaret parmağını birleştir (pinch)**; dinozoru sürükleyin.
- **Boyutlandırma:** İki el ile **her iki elde pinch** yapıp elleri birbirinden uzaklaştırın / yaklaştırın.
- **Döndürme:** İki el ile pinch yapıp elleri **direksiyon gibi çevirin**.
- **Yürütme:** **Açık avuç** ile ekranda bir noktaya **işaret edin**; dinozor o yöne yürür.
- **Sevme:** **Yumruk** yapıp dinozora yaklaşın; dinozor sevildiğinde tepki verir (animasyon).
- Üç dinozor türü seçilebilir: **T-Rex**, **Brontosaurus**, **Triceratops**.

### 6. Kullanılan teknoloji
- **El takibi:** MediaPipe Hand Landmarks (21 nokta).
- **Görselleştirme:** React, React Three Fiber, Three.js, Bloom efektleri.
- **Kamera:** Webcam (1280×720 önerilir).

### 7. Oyun süresi
Süre sınırı yoktur; serbest etkileşim.

### 8. Kullanılacak malzemeler
- **Kamera (webcam):** Bilgisayara takılı veya dahili webcam; en az 720p (1280×720) çözünürlük önerilir. El ve parmak hareketlerinin net algılanması için kameranın kullanıcıyı karşıdan görmesi gerekir.
- **Bilgisayar:** Oyunu çalıştıran ve webcam’i bağlayan masaüstü veya dizüstü bilgisayar. WebGL 2 ve gerçek zamanlı el takibi için yeterli işlemci (örn. Intel i5 6. nesil veya eşdeğeri) ve donanım hızlandırmalı grafik kartı gerekir.
- **Monitör:** Oyun arayüzünü ve kameranın canlı görüntüsünü göstermek için ekran. Kullanıcının hem kendini hem 3D sahneyi rahatça görebilmesi için yeterli boyut (tercihen 15" ve üzeri) önerilir.

### 9. Donanım / yazılım gereksinimleri
- Webcam (tercihen 1280×720).
- WebGL 2 destekleyen modern tarayıcı (Chrome, Edge önerilir).
- Modern bilgisayar (el takibi ve 3D için yeterli işlemci ve GPU).

### 10. Detaylı özet
**Dinozor Dünyası**, webcam ile çalışan, **artırılmış gerçeklik** tabanlı bir **el ve jest kontrol** deneyimidir. Ekranda, kameranın canlı görüntüsü üzerinde **üç farklı 3D dinozor** (T-Rex, Brontosaurus, Triceratops) görünür; klavye veya fare kullanılmaz, tüm etkileşim **tek veya iki el** ile yapılır. **Sürükleme** (parmakları birleştirip dinozoru taşıma), **döndürme** (iki el ile direksiyon hareketi), **boyutlandırma** (iki eli açıp kapatma), **yürütme** (açık avuçla bir noktaya işaret etme) ve **sevme** (yumruk yapıp dinozora yaklaşma) gibi beş farklı jest tanınır; ekranda hangi hareketin algılandığı anlık olarak gösterilir. Dinozorlar yürürken bacak animasyonu, sevildiğinde yanak ve kuyruk tepkisi gibi detaylarla canlandırılır. Amaç, kullanıcının **el–göz koordinasyonu** ve **jest tabanlı arayüz** kavramını eğlenceli bir şekilde deneyimlemesidir; süre sınırı yoktur, serbest keşif ve etkileşim esas alınır.

