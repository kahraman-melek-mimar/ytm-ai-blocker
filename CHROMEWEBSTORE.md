# Chrome Web Store metadata — V4 Beta

Last updated: 2026-10-25. Distribution: public GitHub Beta. **Not submitted to Chrome Web Store.**

## Listing draft

Name: YTM AI Blocker by Kahraman MELEK® V4 Beta (TR/EN localized messages).
Short description: Local AI audio analysis, stereo level meters and track blocking for YouTube Music.
Category: Productivity (draft). Single purpose: review and optionally skip suspected AI-generated tracks on YouTube Music. Languages: English and Turkish.
Description: README.md / README.tr.md document current behavior, setup and limits. No exact AI-origin guarantee, live watermark verification or community database is claimed.

## Graphics

Store icon and current screenshots pending. Manifest does not reference missing icons. This GitHub release is not a store submission.

## Permissions

| Permission | Justification |
|---|---|
| storage | Local preferences, per-track lists, automatic-skip history and session state |
| tabCapture | User-initiated audio capture from YouTube Music |
| offscreen | Audio context and collection while the music page plays |
| activeTab | Access to the selected music tab following the toolbar action |
| https://music.youtube.com/* | Panel, playback control and current-track text evidence |

No localhost permission in V4. Packaged JS/WASM runs with self + wasm-unsafe-eval. COOP/COEP are not enabled; one-thread CPU fallback and optional WebGPU are used.

## Privacy

PRIVACY.md describes local in-memory audio processing, local lists/history and manual external links. No telemetry, account login, remote inference, audio upload, catalog sync or voting endpoint is active. Data is not sold or used for unrelated/credit purposes. A live policy URL and final dashboard disclosures must be completed before a future store submission.

## Distribution/developer

GitHub public prerelease v4.0.4-beta.1. Publisher: Kahraman MELEK. Support: https://github.com/kahraman-melek-mimar/ytm-ai-blocker/issues . Store contact email/graphics remain pending; do not invent them.

## Version history

4.0.4 Beta — 2026-10-25 — serverless packaged model/runtime, WebGPU assets corrected, CPU fallback, preserved timing rules, separate V3 server edition. GitHub Beta, not store-published.

## Review notes

False positives/misses, DJ/classical limits and slow-CPU continuity limits remain. Live audio/GPU testing on macOS Chrome only; Windows/Linux are unverified targets. Model CC BY-NC 4.0 and owner patent notices apply. No commercial/patent rights granted. See THIRD_PARTY_NOTICES.md. No store rejection history.
