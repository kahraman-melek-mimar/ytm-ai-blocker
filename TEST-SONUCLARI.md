# v3.0.0 doğrulama — 22 Ekim 2026

- 5 JavaScript testi geçti: gerçek PCM pencere boyutu, stereo-mono dönüşümü, şarkı değişiminde ses tamponunun sıfırlanması, eski sonuçların reddi, duraklatma/sarma, eşik ve geri sayım iptali.
- 2 Python testi geçti: geçerli PCM kabulü; sessizlik, yanlış boyut, NaN ve sınır dışı verinin reddi.
- Dört eklenti JavaScript dosyasının sözdizimi kontrolü geçti.
- ArtifactNet ONNX dosyası ve harici ağırlıkları indirildi; gerçek CPU çıkarımı çalıştırıldı. Sentetik sinüs test sinyali için çıktı 0.006087; ilk ölçülen analiz süresi yaklaşık 0.55 saniye. Bu sinyal doğruluk ölçümü değildir.
- Gerçek yerel HTTP sunucusunun `/health` ve `/analyze` uçları doğrulandı. Ses isteği modelden sayısal skor döndürdü.

Henüz doğrulanmayanlar: Chrome/PWA üzerinde gerçek tabCapture oturumu, YouTube Music’in bu hesaptaki DOM yapısı, canlı atlama ve modelin bilinen insan/YZ müziklerinden oluşan temsili bir veri kümesindeki doğruluğu. Otomatik testlerde Chrome API’leri taklit edilmiştir; bunlar tarayıcı içi uçtan uca test yerine geçmez.

## v3.0.1

Canlı Chrome sayfasında eski `ytmusic-player-bar` yerine `ytmusic-track-info` ve `ytmusic-wiz-player-controls` kullanıldığı doğrulandı. Yeni ve eski oynatıcı adaptörleri, ana sayfada video kimliği ve eski köprü verisinin reddi için 3 regresyon testi eklendi. Yeni yüzde göstergesinin ve gerçek ses yakalamanın canlı doğrulaması eklentinin kullanıcı tarafından yeniden yüklenmesini gerektirir.

## v3.0.2

Canlı v3.0.1 panelinde gerçek model skoru %0 ve ses toplama %25 birlikte okundu; sıfırlanan göstergenin ses örneği olduğu doğrulandı. YZ skoru ile örnek ilerlemesini ayıran 2 yeni testle toplam 10 JavaScript testi geçti. Önceki 2 PCM testi de geçerli; sunucu değişmedi. v3.0.2 canlı panel doğrulaması kullanıcı yeniden yüklemesinden sonra yapılacak.

## v3.0.3

4 saniyelik tek yüksek skor sonucunda anında atlama, tam %80/altı ve geçersiz skorların atlamaması, duraklatma ve eski sonuç reddi test edildi. Arka plan mesaj testi de ilk yüksek sonuçta SKIP üretildiğini doğrular. Canlı atlama doğrulaması yeniden yüklemeden sonra yapılmalıdır.

## v3.0.4

11 JavaScript testi geçti. Beş saniye boyunca yenilenen yüksek skorlar, arada %80 altına düşüşte tam sıfırlama, tam %80 sınırı, eksik/tekrarlanan ses penceresi, duraklatma ve eski skor reddi doğrulandı. Ses tamponunun ilk 4 saniyeden sonra 1 saniyelik adımla yeni 4 saniyelik pencere verdiği test edildi. Canlı sürekli skor ve atlama akışı eklenti yeniden yüklendikten sonra doğrulanmalıdır.

## v3.0.5

17 JavaScript testi geçti. Sağlayıcı adı ile üretim beyanı ayrımı; olumsuz ifadeler; boş veri; platform etiketi ile ses/C2PA doğrulamasının ayrılması test edildi. Önceki şarkıya ait açıklamanın yeni parçaya taşınmaması kimlik eşleşmesi testiyle doğrulandı. Gerçek C2PA veya filigran doğrulayıcısı eklenmedi. Canlı pozitif platform beyanı örneği henüz test edilmedi.

## v3.1.0

22 JavaScript tests: TR/EN message parity, manifest asset references, style bundle consistency, independent left/right RMS with AI sampling off, track-only blocks and allowance override, worker restart restore, plus existing model decision and provenance regressions. Browser preview checks: mouse dragging, arrow-key movement, persisted position/language after reload, TR/EN controls, allowance toggle and Lists dialog. Preview values are simulated; actual stereo measurement is separately unit-tested. Live Chrome extension capture and skipping after this update remain to be verified after reload.
