# YTM AI Blocker

**v3.1.1 · by Kahraman MELEK®**

[English](README.md) · [Türkçe](README.tr.md)

YouTube Music için yerel YZ ses skoru, stereo seviye göstergeleri ve kişisel parça engelleme sunan Chrome eklentisi. **Birlikte verilen yerel Python yardımcısını gerektirir.** Deneysel kişisel kullanım sürümüdür; her YZ parçasını güvenilir biçimde tanıdığı iddia edilmez.

![Türkçe panel önizlemesi, simüle edilmiş giriş](docs/panel-preview-tr.jpg)

*Görseldeki ses seviyeleri ve skor önizleme için simüledir; doğruluk testi değildir.*

## Yeni panel

- Üst kısmından sürüklenebilir; başlık odaktayken ok tuşlarıyla da taşınabilir. Konumu kaydedilir, ekran dışına çıkması engellenir.
- Panel ve eklenti bilgileri TR/EN destekler. Dil tercihi kaydedilir.
- Sol ve sağ VU tarzı göstergeler bağımsız gerçek RMS ses seviyelerini dBFS olarak yaklaşık saniyede 10 kez gösterir. Yayın standardına kalibre edilmiş VU cihazı değildir. Mono giriş iki kanalda aynı gösterilir.
- Ortadaki YZ metre model skorunu yaklaşık saniyede bir gösterir; ses yüksekliğiyle karıştırılmaz ve yapay skor animasyonu kullanılmaz.
- Ana panelde parça adı bulunmaz.
- **Bu parçayı engelle ve geç** yalnızca o parçayı engeller. **Bu parçaya izin ver** anında koruma sağlar ve aynı düğmeden geri alınabilir. Kayıtları **Listeler** üzerinden yönetebilirsin.
- Üretim bilgisi tek satırdır. **Üretim etiketi: Yok**, okunabilir etiket bulunmadığı anlamına gelir; insan üretimi veya filigransız olduğu anlamına gelmez.

## Kurulum (macOS)

1. Python 3.10+ ve Chrome 116+ gerekir. Kaynak paketini bir klasöre aç; dosyaları birlikte tut.
2. `Kurulum.command` dosyasını aç. Ayrı `.venv` ortamını ve gerekli model/paketleri indirir. İlk kurulum internet ister.
3. `Başlat.command` dosyasını aç ve Terminal penceresini açık bırak. Durdurmak için **Control+C** kullan. **Control+Z sunucuyu askıya alır ve analizi durdurur.**
4. Chrome’da `chrome://extensions` adresini aç. Geliştirici modunu etkinleştir, **Paketlenmemiş öğe yükle** ile `extension` klasörünü seç. Eski sürümleri devre dışı bırak.
5. YouTube Music’i aç/yenile, bir parça çal ve Chrome’un yapboz menüsündeki **YTM AI Blocker** simgesine tıkla. Aynı simgeye tekrar tıklamak ses yakalamayı durdurur. Yerel sunucunun açılması tek başına tarayıcı ses yakalamasını başlatmaz.
6. Panelden TR veya EN seç. İngilizce kullanıcılar `Install.command` ve `Start.command` dosyalarını kullanabilir.

macOS dosyayı açmazsa bu klasörde Terminal açıp `zsh Kurulum.command`, ardından `zsh Başlat.command` çalıştırabilirsin. Chrome uygulama penceresinde eklenti simgesi görünmüyorsa aynı profilde normal bir YouTube Music sekmesi kullan. Safari ve bağımsız Electron müzik uygulamaları desteklenmez.

## Atlama kuralı

Ses sürekli yakalanır; kayan dört saniyelik pencere saniyede bir analiz edilir. Kısa yanlış alarmları azaltmak için karar sinyali birbiriyle **örtüşmeyen** üç ses bölümünün medyanı ve güncel ham skorla sınırlanır. Üç geçerli bölüm oluşana kadar gösterge belirsiz kalır (yaklaşık 12 saniye). Bu değer korumalı sinyaldir; kalibre edilmiş YZ olasılığı değildir.

Sinyal ilk kez **%80’i geçince** beş saniyelik sayaç başlar. Yeni değer **%80’in altına düşerse** sıfırlanır. Tam %80 var olan süreyi sürdürür, yeni süre başlatmaz. Güncel sonuçlar kesintisiz beş saniyeyi kapsamalıdır. Eksik/geçersiz analiz, duraklatma, sarma ve parça değişimi kanıtları sıfırlar. En erken atlama yaklaşık 12 saniye hazırlık + beş saniye ve model gecikmesidir. Bazı gerçek YZ parçaları daha geç yakalanabilir veya kaçabilir. [Sınırlı yanlış pozitif incelemesi](docs/FALSE-POSITIVE-INVESTIGATION.md).

İzin butonu kararı kaydetmeyi beklemeden yerel olarak uygular; sıradaki otomatik atlama mesajı o parça için reddedilir. Otomatik atla anahtarı genel durdurma kontrolüdür. Eski sürümden kalmış kanal engelleri Listeler’de kaldırılabilir, ancak artık kanalın diğer parçalarını atlatmaz.

## Gizlilik ve dijital kimlik sınırı

Ses yalnızca aynı bilgisayardaki `127.0.0.1:5050` sunucusuna gider. Bellekte işlenir; diske kaydedilmez, dış analiz servisine gönderilmez. Tercihler ve kişisel listeler yerel saklanır. Kurulumdaki paket/model indirmeleri dışında dinleme için dış bağlantı veya analitik yoktur.

Üretim etiketi satırı erişilebilen metin beyanlarını okur. Suno/Udio adının geçmesi tek başına üretim kanıtı değildir. **C2PA dosya kimliği ve özel ses filigranı doğrulaması yapılmaz.** Ses modeli istatistiksel sınıflandırıcıdır; Suno veya SynthID imza çözücüsü değildir. Ayrıntılar: [dijital kimlik araştırması](PROVENANCE-ARASTIRMA.md).

## Model ve sınırlar

Yanlış atlama ve kaçırma olabilir. Kullanıcının gayriresmî denemelerinde bazı Türkçe YZ parçaları düşük skor aldı; dil bazında doğruluk ölçülmedi. İzin ve otomatik atlama kontrollerini kullan.

Üçüncü taraf model **intrect ArtifactNet v9.4**, **CC BY-NC 4.0** lisanslıdır. Model dosyaları depoya veya kaynak ZIP’e eklenmez; kurulumda sabit sürüm indirilir. Ticari kullanım için model sahibinden uygun izin gerekir. Kaynak kodunun GitHub’da görünmesi uygulama koduna otomatik olarak serbest kullanım lisansı vermez. [Üçüncü taraf bildirimleri](THIRD_PARTY_NOTICES.md).

## Geliştirme

```sh
node --test tests/*.test.mjs
python3 -m pip install 'numpy>=1.26,<3'
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tools/build_release.py
```

Panel stillerini `extension/panel.css` içinde düzenle; paketleyici gömülü stil dosyasını yeniler. Otomatik testlerde Chrome araçları taklit edilir; güncelleme sonrasında gerçek tarayıcıda ses yakalama ve atlama ayrıca denenmelidir. `tools/preview.html` yalnızca simüle geliştirme önizlemesidir ve dağıtım paketine girmez.

Eklenti ZIP’i yalnızca tarayıcı dosyalarını içerir; gerekli yerel yardımcıyı kurmaz. GitHub’dan dağıtım geliştirici moduyla kurulumdur. Chrome Web Store yayını ayrı bir adımdır.

## v3.1.1

Bağımsız ses bölümleriyle kısa skor sıçraması denetimi; geçersiz sonuçta eski skoru temizleme. Dil seçimine uygun yüzde/ondalık biçimi: TR %72,4; EN 72.4%.
