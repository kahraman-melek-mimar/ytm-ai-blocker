# False-positive investigation / Yanlış pozitif incelemesi

23 October / Ekim 2026 · v3.1.1

## Scope / Kapsam

Two YouTube Music links were supplied by the user as human-made references. We downloaded only their first approximately 40 seconds for **local** inference; audio is excluded from source packages and GitHub. Provenance was not independently verified. This is not a representative accuracy benchmark or model training.

Kullanıcı iki bağlantıyı insan üretimi referans olarak bildirdi. Yalnızca ilk yaklaşık 40 saniye yerelde test edildi. Ses dosyaları GitHub’a veya dağıtım paketlerine eklenmedi. Üretim geçmişi bağımsız olarak doğrulanmadı. Bu çalışma genel doğruluk ölçümü veya model eğitimi değildir.

| Reference | Peak raw score / En yüksek ham skor | Highest guarded display in replay / Korumalı gösterge tepe değeri | Old five-second skip within tested segment? |
|---|---:|---:|---|
| Never Leave · eAXmdedqEi8 | ~100% (99.5% at the opening) | ~0.01% after enough valid disjoint evidence | No / Hayır |
| Sunset In Aegean · 1Ber2pW-k4I | ~97.5% | ~10.3% | No / Hayır |

Never Leave also produced non-finite model output in several windows. The existing server rejects invalid results. The new client clears the displayed score and accumulated evidence on failure, instead of retaining an old high value. Downloaded audio and live tab capture can differ in gain, normalization and resampling, so the results do not establish what the user’s live session showed.

Never Leave’ın bazı pencerelerinde model geçersiz sayısal çıktı verdi. Sunucu bu çıktıları zaten reddediyordu. Yeni istemci hatada eski yüksek yüzdeyi ekranda tutmak yerine skoru ve biriken kanıtı temizler. İndirilen ses ile canlı sekme yakalaması ses düzeyi, normalizasyon ve yeniden örnekleme açısından farklı olabilir; bu ölçümler kullanıcının canlı oturumunu birebir yeniden üretmez.

## Change / Değişiklik

The model weights and 80% threshold were not changed. Rolling four-second windows still arrive every second. Only disjoint four-second windows enter a three-window median. Before three valid disjoint windows exist, the gauge shows unknown rather than a premature verdict. Afterwards, the displayed decision signal is **min(current raw score, median)**. It is a conservative signal, not a calibrated AI probability. A fresh drop still resets the five-second rule. Invalid output, missing audio, pause, seeking and track changes reset evidence.

Model ağırlıkları ve %80 eşiği değişmedi. Kayan dört saniyelik pencere saniyede bir analiz edilir. Medyan yalnızca birbiriyle örtüşmeyen üç ses bölümünden hesaplanır. Yeterli örnek yokken erken bir hüküm yerine belirsiz durum gösterilir. Sonra gösterge **min(güncel ham skor, medyan)** değerini kullanır. Bu korumalı sinyaldir; kalibre edilmiş YZ olasılığı değildir. Güncel skor düştüğünde beş saniyelik sayaç sıfırlanır. Hata/eksik ses/duraklatma/sarma/parça değişimi kanıtları sıfırlar.

Earliest stable-high skip: approximately **12 seconds warm-up + 5 seconds**, plus inference latency. This can reduce short false alarms but may delay or miss genuine AI music. No improvement on Turkish AI music or DJ music in general has been established.

En erken sürekli-yüksek atlama yaklaşık **12 saniye hazırlık + 5 saniye** ve model gecikmesidir. Kısa yanlış alarmları azaltabilir; gerçek YZ parçalarını daha geç yakalayabilir veya kaçırabilir. Türkçe YZ müzikleri veya tüm DJ müzikleri için genel başarı artışı kanıtlanmadı.

Regression fixtures contain **scores only**, not audio: `tests/fixtures/false-positive-traces.json`. Synthetic consistently-high and dip traces test timing, not real positive-class recall.
