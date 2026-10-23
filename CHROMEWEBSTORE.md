# Chrome Web Store draft — YTM AI Blocker v3.4.0

Updated 2026-10-23. This document is preparation only; the extension has not been submitted to the Chrome Web Store.

## Listing

Name: YTM AI Blocker by Kahraman MELEK®

Short description: Local AI audio estimates, stereo meters and personal track skipping for YouTube Music. TR/EN.

Purpose: Analyze the user-invoked YouTube Music tab locally, display advisory AI scores and skip individual tracks under user-selected controls.

Explicit limitations: YTM AI Blocker can make mistakes. Not recommended for DJ or classical music. No reliable AI-origin guarantee. Live C2PA/SynthID verification is not integrated.

## Permissions

| Permission | Reason |
|---|---|
| storage | Local preferences, track blocks/allowances and last 200 automatic-skip records. |
| tabCapture | User-invoked capture of the YouTube Music tab audio. |
| offscreen | Audio capture, stereo metering and communication with the local helper. |
| activeTab | Temporary access associated with the extension toolbar action. |
| https://music.youtube.com/* | Read current player state and display the panel. |
| http://127.0.0.1:5050/* | Send transient PCM windows only to the user's local inference helper. |

## Privacy and external links

Live audio is transient and is not saved by the extension. No analytics or third-party listening-data upload. Local storage holds settings, video IDs/titles for blocks/allowances, and up to 200 automatic-skip records (track ID/title, timestamp, model score, reason). Users can remove list/history entries. Setup downloads dependencies and the separately licensed model. Runtime audio is not sent to those providers.

The author credit opens a GitHub issue form, submitted manually by the user. Track links open YouTube Music. The separate optional local-file C2PA developer tool reads explicitly provided files; remote manifests and OCSP fetching are disabled. It is not connected to live auto-skip and does not upload audio.

## Remaining store preparation

Store icons/assets, a hosted privacy-policy URL and the final Developer Dashboard disclosures still require preparation before any store submission. GitHub publication does not mean Chrome Web Store approval. The model's non-commercial license and owner notices remain applicable; see THIRD_PARTY_NOTICES.md.
