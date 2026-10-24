# YTM AI Blocker — V4 Beta

[EN — English](README.md)

YouTube Music için cihazda ses analizi, stereo metreler ve isteğe bağlı parça atlama. Kahraman MELEK®.

| Ürün | Yerel sunucu gerekir mi? | İndir |
|---|---|---|
| **4.0.4 Beta — sunucusuz** | **Hayır.** Python veya terminal gerekmez | [Yüklemeye hazır ZIP](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/download/v4.0.4-beta.1/ytm-ai-blocker-4.0.4-beta.1-serverless.zip) |
| **3.4.1 — sunuculu sürüm** | **Evet.** Python yardımcısı analiz boyunca açık kalmalıdır | [Sunuculu yayın](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/tag/v3.4.1) · [sunuculu kaynaklar](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/tree/v3-server) |

**Beta sürüm hata yapabilir. DJ ve klasik müzik için önerilmez.** Model skoru kesin YZ kararı veya üretim kanıtı değildir. İnsan yapımı kayıtlar yanlış işaretlenebilir, YZ kayıtları kaçırılabilir.

## İndir, aç ve Chrome'a yükle

Masaüstü Chrome/uyumlu Chromium 116+ içindir. Aynı paket Windows, Linux ve macOS'u hedefler. Canlı ses/GPU denemesi macOS Chrome'da yapıldı; Windows ve Linux henüz canlı doğrulanmamış Beta hedefleridir.

1. Yukarıdaki **sunucusuz ZIP'i** indirin ve kalıcı bir klasöre açın. Bu klasörü kurulumdan sonra silmeyin.
2. Chrome'da `chrome://extensions` sayfasını açın ve **Geliştirici modu** seçeneğini etkinleştirin.
3. **Paketlenmemiş öğe yükle** düğmesine basıp ZIP'ten çıkan **extension** klasörünü seçin. Seçtiğiniz klasörde `manifest.json` olmalıdır.
4. Eski V3/V4 test kopyasını kapatın. YouTube Music'i yenileyin ve müzik çalın.
5. Chrome araç çubuğundaki **yapboz** simgesine, ardından **YTM AI Blocker … V4 Beta** adına tıklayın. İsterseniz raptiyeyle sabitleyin. İlk tıklama sekme sesini yakalamayı başlatır.
6. Panelde **v4.0.4 Beta** görünmelidir. Yeni kurulumda **Otomatik atla kapalı** başlar; analiz ve metreler çalışır. İsterseniz panelden açın.

Model ve çalışma dosyaları ZIP'te hazırdır. **Kullanıcı için Python, npm, terminal veya yerel sunucu kurulumu yoktur.** Bu paket çift tıklanan bir masaüstü uygulaması veya mağazadan tek tık kurulum değildir; Chrome'a klasör olarak yüklenir. Güncellemede yeni dosyaları aynı klasöre çıkarın, eklentiyi yeniden yükleyin ve YouTube Music'i yenileyin. GitHub'dan elle kurulum otomatik güncelleme sağlamaz.

## Davranış

- TR/EN, sürüklenebilir panel, sağda dikey ortalı başlangıç konumu.
- Ayrı sağ/sol ses metreleri, tam sayılı YZ Metre, çentikler ve yavaş azalan tepe işaretleri.
- Son dört saniyelik ses her saniye yeniden değerlendirilir. Desteklenirse WebGPU, aksi halde işlemci kullanılır. İlk hazırlık sonraki analizlerden uzun sürebilir.
- Gerçek skor **%80'in üzerinde kesintisiz 4 saniye** veya **ayrı ayrı üç kez en az 3 saniye** olursa model süre kararı oluşur. Eksik/eski sonuçlar sürekliliği sıfırlar. Ekranda bekleyen eski yüksek skor sayaç süresi sayılmaz.
- Otomatik atla kapalıyken analiz ve karar görünmeye devam eder. Analizi durdurunca stereo metreler ve ses bağlantısı devam eder. Parçaya verilen izin otomatik atlamayı engeller.
- Parça engelleme/izin listeleri; en çok 200 yerel otomatik-geçiş geçmişi. Kanal bazında toplu engel yoktur.
- **!** baloncuğu kullanım uyarılarını gösterir. İsim bağlantısı GitHub öneri formunu açar; gönderim kullanıcı tarafından yapılır ve herkese açıktır.

Yavaş işlemcide model saniyelik sonuç akışına yetişmeyebilir ve otomatik atlama için süre koşulu oluşmayabilir. GPU düzeltmesinden sonra yerel Chrome mikro ölçümünde yaklaşık 0,15 saniye görüldü; bu her cihaz veya parça için garanti değildir. [Sınırlar](docs/KNOWN-LIMITATIONS.md).

## Kaynak bilgisi ve gizlilik

Üretim etiketi okunabilir beyan/sağlayıcı isimlerinden gelir. **Yok**, insan yapımı anlamına gelmez. Canlı C2PA/SynthID doğrulaması yoktur; dijital iz satırı doğrulanmadı olarak kalır. **Ortak veritabanı ve topluluk oylaması bu Beta'ya bağlı değildir.**

Ses cihaz belleğinde işlenir; analiz için dışarıya gönderilmez veya ses dosyası olarak kaydedilmez. Model ve çalışma dosyaları eklenti paketinden yüklenir. Tercihler, parça listeleri ve geçmiş yerel Chrome alanında tutulur. Dinleme geçmişi veya oylar yüklenmez. Site izni yalnızca YouTube Music içindir. Geri bildirim/parça bağlantıları kullanıldığında ilgili site açılır. [Gizlilik](PRIVACY.md).

## Geliştirici ve lisans

Kullanıcılar yalnızca ZIP'i yükler. Geliştirici kontrolleri: `npm ci`, `npm test`, `python3 -m unittest discover -s tests -p 'test_*.py'`, `npm run build`.

`backend/` ve katalog modülleri yerel geliştirme temelidir; yayımlanmış veya kimlik doğrulamalı bir oy hizmeti değildir ve eklentinin çalışması için gerekmez.

ArtifactNet v9.4 (intrect / Heewon Oh) **CC BY-NC 4.0** ve model sahibinin ek patent bildirimleriyle paketlenmiştir. Ağırlıklar değişmedi; iki sıfır payda için grafikte sayısal koruma vardır. Bu düzeltme doğruluk garantisi değildir. Ticari veya patent kullanım hakkı verilmez. ONNX Runtime Web 1.30.0 MIT lisanslıdır. [Üçüncü taraf bildirimleri](THIRD_PARTY_NOTICES.md). Uygulama kaynakları için ayrıca serbest kullanım lisansı seçilmedi; deponun açık olması ek lisans hakkı sağlamaz.

Yayın GitHub üzerindedir; Chrome Web Store yayını yapılmadı.
