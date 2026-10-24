# Privacy / Gizlilik — YTM AI Blocker V4 Beta

Updated / Güncelleme: 2026-10-25.

## English

V4 Beta captures the YouTube Music tab audio only after you click the extension toolbar action. Audio is processed in memory on your device using the bundled model. Captured audio is not saved as a file or sent to an inference server. Models and runtime files are included in the package; no background model download, telemetry, account login or voting upload is configured.

Chrome local storage holds your language, panel position, auto-skip preference, per-track block/allow entries and up to 200 automatic-skip records (track title/ID, time, reason and latest score). Temporary capture/session/decision state is held in session storage and cleared when the browser session ends. Lists and history entries can be removed in the panel; removing the extension removes its local storage. The extension does not use Chrome account sync for these records.

Available track metadata and production descriptions are read from the YouTube Music page to operate the controls and display text evidence. No listening history is transmitted by the extension. Clicking a track or feedback link opens YouTube/GitHub; those sites have their own policies. A feedback report is public only if you manually submit it. No feedback is automatically sent.

The planned shared database/voting service is not connected in this release. If that changes, the policy and controls must change before deployment. Privacy questions: https://github.com/kahraman-melek-mimar/ytm-ai-blocker/issues . Do not post private information in a public issue.

## Türkçe

V4 Beta, eklenti araç çubuğu simgesine tıkladıktan sonra YouTube Music sekmesinin sesini alır. Ses paketlenmiş modelle cihaz belleğinde işlenir; ses dosyası olarak kaydedilmez ve analiz sunucusuna gönderilmez. Model ve çalışma dosyaları pakettedir. Arka planda model indirme, telemetri, hesap girişi veya oy yükleme yapılandırılmamıştır.

Dil, panel konumu, otomatik atlama tercihi, parça bazında engel/izin ve en çok 200 otomatik geçiş kaydı (başlık/kimlik, zaman, neden ve son skor) yerel Chrome alanında saklanır. Ses oturumu ve karar durumu geçici oturum alanındadır; tarayıcı oturumu bitince temizlenir. Listeler ve geçmiş panelden kaldırılabilir; eklentiyi kaldırmak kendi yerel kayıtlarını kaldırır. Kayıtlar Chrome hesabı üzerinden eşitlenmez.

Oynatma kontrolü ve metinsel üretim bilgisi için YouTube Music sayfasındaki parça bilgileri okunur. Dinleme geçmişi eklenti tarafından dışarıya gönderilmez. Parça/öneri bağlantıları kullanıldığında YouTube/GitHub açılır; ilgili sitenin koşulları geçerlidir. Öneri ancak kullanıcı formu kendisi gönderirse yayımlanır; otomatik gönderim yapılmaz.

Planlanan ortak katalog/oylama bu sürüme bağlı değildir. Gizlilik soruları için yukarıdaki GitHub Issues bağlantısı kullanılabilir; herkese açık alana özel bilgi yazmayın.

## Server edition distinction / Sunuculu sürüm ayrımı

V3 is a separate product branch/release. It sends captured PCM only to its local helper at 127.0.0.1:5050 and downloads packages/model during setup. See the v3-server branch documentation; this V4 policy does not imply V3 is serverless.

V3 ayrı dal/yayındır. PCM sesi yalnızca yerel yardımcısına gönderir ve kurulumda paket/model indirir. V4'ün sunucusuz olması V3'ün sunucusuz olduğu anlamına gelmez.
