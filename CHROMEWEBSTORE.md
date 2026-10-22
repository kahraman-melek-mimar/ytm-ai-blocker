# Chrome Web Store Listing — YTM AI Blocker

Last Updated: 2026-10-23. Draft; not submitted.

## Store Listing

Extension Name: YTM AI Blocker by Kahraman MELEK®

Short Description: YouTube Music’te yerel ses analiziyle YZ skorunu görün, istemediğiniz şarkıları ve kanalları engelleyin.

Detailed Description: YouTube Music dinlerken yapay zekâ üretimi müziklere ilişkin bir model skoru gösterir. Şarkı ve kanal engelleme, izin listesi ve Sürekli analizde %80 üzerinde başlayıp 5 saniye eşik altına düşmeyen skorda otomatik atlama sunar. Skor kesin kanıt değildir. Bu deneysel sürüm ayrıca Mac üzerinde çalışan yerel analiz uygulamasının kurulmasını gerektirir. Ses yakalama kullanıcı eklenti simgesine tıklayınca başlar; tekrar tıklayınca durur. Ses analizi cihaz üzerinde yapılır. Destek adresi yayın öncesinde belirlenecek.

Category: Productivity (draft)
Single Purpose: YouTube Music dinlemesinde YZ müzik skorunu gösterip kullanıcının seçtiği kurallarla parçaları atlamak.
Primary Language: Turkish

## Graphics & Assets

128×128 mağaza ikonu ve 1280×800 veya 640×400 ekran görüntüsü henüz hazır değil. Manifest ikon belirtmez. v3.0.2 skor/örnek süresi ayrımını gösteren ekran görüntüsü hazırlanmalı.

## Permissions Justification

| Permission | Type | Justification |
|---|---|---|
| storage | permissions | Kişisel engel, izin listeleri ve açma/kapama tercihini cihazda saklar. |
| tabCapture | permissions | Kullanıcının seçtiği YTM sekmesindeki sesi analiz etmek için yakalar. |
| offscreen | permissions | Sekme sesi yakalama ve analiz iletişimini görünmeyen yardımcı belgede yürütür. |
| activeTab | permissions | Eklenti simgesine tıklanan sekmeye geçici erişim sağlar. |
| https://music.youtube.com/* | host_permissions | Çalan şarkıyı ve oynatıcı durumunu okuyup kullanıcı panelini ve atlamayı çalıştırır. |
| http://127.0.0.1:5050/* | host_permissions | Ses örneklerini yalnızca aynı cihazdaki analiz sunucusuna iletir. |

## Privacy & Data Use

Yerel işlem için veri işlenir; dış sunucuya dinleme verisi gönderilmez.

| Data Type | Collected/processed? | Transmitted off-device? | Purpose | Third parties? |
|---|---|---|---|---|
| Website content: audio, song title, artist/channel/video IDs | Yes, local processing | No | Audio score and matching personal blocks | No |
| User activity: playback position/state, settings and personal lists | Yes, local processing | No | Reset analysis on track/seek/pause; persist preferences | No |
| Identity, health, finance, authentication, communications, location, general web history | No | No | None | No |

Audio is transient in memory and sent to loopback; not saved to disk. Personal block/allow lists persist in local extension storage. Model files and dependencies download during setup from their providers; runtime listening data is not sent to those providers. No analytics.

- [x] Data not sold.
- [x] Data not used beyond the core purpose.
- [x] Data not used for creditworthiness or lending.

## Privacy Policy

Public privacy policy URL: not yet published. Required before submission. Dashboard data disclosures must be reviewed against final release.

## Distribution

Visibility and regions: not selected. No release has been published.

## Developer Info

Publisher Name: Kahraman MELEK® (confirm publisher account before submission).
Contact Email, Support URL, Homepage URL: not supplied.

## Version History

| Version | Date | Changes | Status |
|---|---|---|---|
| 3.1.0 | 2026-10-23 | Movable bilingual panel; stereo RMS meters and central AI gauge; track-only blocking; single production-label line. | Draft |
| 3.0.5 | 2026-10-23 | Üretim beyanı ve sağlayıcı ismi ipuçları; dijital kimlik kontrolünün sınırları açıkça gösterilir. | Draft |
| 3.0.4 | 2026-10-22 | Saniyede bir kayan pencere skoru; düşüşte sıfırlanan 5 saniyelik süre. | Draft |
| 3.0.3 | 2026-10-22 | Tek 4 saniyelik ses örneğinde %80 üzerinde doğrudan atlama; ek geri sayım kaldırıldı. | Draft |
| 3.0.2 | 2026-10-22 | Separate stable model score from four-second sample progress; show cumulative analyzed audio. | Draft |
| 3.0.1 | 2026-10-22 | New player support and capture diagnostics. | Draft |
| 3.0.0 | 2026-10-22 | Initial extension and local model server. | Draft |

## Review Notes

Not ready for submission: real-song detection accuracy unmeasured; model license restricts commercial use; live privacy policy, contact details and store images missing. Local helper setup is currently manual. Capture ownership and decision state are backed by session storage; mocked worker-restart recovery is tested. Fresh live Chrome regression remains required. User-facing model score must never be described as verified provenance.

Üretim bilgisi katmanı açıklama ve sınırlı oynatıcı beyan metnini yalnızca cihazda işler. Suno API’sine veya SynthID portalına otomatik istek yapılmaz. Ek izin istenmez. Yeni panel görseli güncellenmelidir.

## v3.1.0 update

TR/EN panel and native locale metadata; saved draggable position; true stereo RMS levels in dBFS; no track title in main panel; allow/revoke controls and video-ID-only blocks. Preferences now include UI language and panel position. No new permissions or external destinations. Permission/host justifications remain unchanged. New panel images in docs are simulated UI previews, not final Web Store screenshots. Not submitted.
