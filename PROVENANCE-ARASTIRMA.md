# Dijital müzik kimliği araştırması — 23 Ekim 2026

## Doğrulanan bulgular

Suno yeni indirilen şarkılara C2PA Content Credentials eklediğini açıkça belirtiyor. Önceden indirilmiş tüm parçaları kapsadığını söylemiyor. Ücretsiz API yalnızca Suno kimlik bilgisini kontrol ediyor; genel YZ dedektörü değil. Dosya veya doğrudan medya dosyası URL’si gerekiyor; YouTube izleme sayfası URL’si bunun yerine geçmez. Üç sonuç var: verified_suno, no_suno_provenance, inconclusive. Negatif sonuç insan üretimi kanıtı değildir.
Kaynak: https://suno.com/suno-credentials

Google Lyria ve NotebookLM kaynaklı seste SynthID filigranı kullanıyor. Bu sesin içine gömülen sinyaldir; dosya metaverisiyle aynı şey değildir. Resmî doğrulama portalı bulunur. Araştırmada eklentiye gömülebilen, yetkisiz/anahtarsız yerel bir SynthID ses çözücüsü doğrulanmadı. Mevcut ArtifactNet modeli SynthID çözmez.
Kaynak: https://deepmind.google/models/synthid/

YouTube, uygun C2PA ve üretici beyanlarından YZ açıklaması gösterebilir. Genel video YZ etiketi yalnızca müziğin YZ olduğunu tek başına kanıtlamaz; görsel de YZ olabilir. Müzik ortaklarının içerik tesliminde contains_ai = all/partly/none/unknown bilgisi vardır; bu yayıncı tarafı alanının bizim istemci oynatıcı yanıtında bulunduğu doğrulanmadı.
Kaynaklar:
https://support.google.com/youtube/answer/15447836?hl=en
https://support.google.com/youtube/answer/17124251?hl=en-93

Udio için kamuya açık ve belgelenmiş dijital filigran doğrulama API’si bu araştırmada bulunamadı. Bu, Udio’nun hiç işaret kullanmadığı anlamına gelmez.
Başlangıç kaynağı: https://help.udio.com/en/

## Mevcut girişin teknik sınırı

Sekme yakalamasından alınan mono float32 PCM paketleri ses örnekleridir; özgün MP3/WAV dosyasının ID3 veya C2PA bloklarını içermez. Dolayısıyla Suno API’sine bu PCM’den yeniden oluşturulan WAV dosyasını göndermek özgün dosya kimliğini geri getirmez. Sesteki özel filigranı kontrol etmek için ilgili sağlayıcının gerçek çözücüsü gerekir. Modelin istatistiksel skoru dijital imza doğrulaması değildir.

## Canlı uygulama (v3.4.0)

Şarkı kimliğiyle eşleşen oynatıcı açıklamasında Suno, Udio, Lyria/MusicFX üretim beyanları ve isim geçişleri ayrı gösterilir. Oynatıcı verisindeki disclosure/synthetic/provenance benzeri adlandırılmış alanlarda açık YZ beyanı varsa ayrı etiketlenir. Tüm sayfa, öneriler veya diğer şarkıların açıklamaları taranmaz. Özgün dosya C2PA doğrulanmadığı açıkça yazılır. Bu katman ses skorunu değiştirmez ve kendi başına otomatik atlatmaz; dört saniye veya üç ayrı üç saniye koşulu yalnızca ses modeline uygulanır. Platform etiketi şema/erişim koşullarına bağlıdır ve canlı pozitif örnekle doğrulama bekler.

Hiçbir ses veya URL Suno/Google/Udio’ya otomatik gönderilmez. Ek dış servis izni yoktur. Sonraki gerçek C2PA doğrulama adımı, kullanıcının sağladığı özgün medya dosyasını yerel C2PA doğrulayıcıyla veya kullanıcının seçtiği Suno API gönderimiyle incelemek olabilir. Yerel doğrulamada imza ve güven zinciri denetlenmelidir; metinde Suno aramak yeterli değildir.


Yerel dosyalar için tools/read_c2pa.py ile C2PA okuma/çıkarma aracı bulunur. Güncel güven listesi bağımsız olarak verilirse imza güveni de denetlenir; canlı PCM yoluna bağlanmamıştır.
