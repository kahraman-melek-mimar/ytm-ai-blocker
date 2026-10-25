# YTM AI Blocker — V4 Beta

[TR — Türkçe](README.tr.md)

On-device audio estimates, stereo meters and optional track skipping for YouTube Music, by Kahraman MELEK®.

| Edition | Local server? | Download |
|---|---|---|
| **4.0.11 Beta — serverless** | **No** Python, terminal or helper server | [Ready-to-load ZIP](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/download/v4.0.11-beta.1/ytm-ai-blocker-4.0.11-beta.1-serverless.zip) |
| **3.4.1 — Local Server Edition** | **Yes**, keep its Python helper running | [Server edition release](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/tag/v3.4.1) · [server branch](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/tree/v3-server) |

**Beta: mistakes are possible. Not recommended for DJ or classical music.** Scores are model estimates, not calibrated probabilities or proof of AI origin. AI-generated tracks can be missed and genuine recordings can be flagged.

## Download, extract, load — no server installation

For desktop Chrome/compatible Chromium 116+. One extension package is intended for Windows, Linux and macOS. Live audio/GPU testing has been performed on macOS Chrome; Windows and Linux remain unverified Beta targets.

1. Download the **serverless ZIP** above and extract it to a permanent folder. Keep that folder after installation.
2. Open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**.
3. Select the extracted **extension** folder containing `manifest.json`, not the outer ZIP folder.
4. Disable any old V3/V4 test copy, refresh YouTube Music, and play music.
5. Click the puzzle-piece icon in Chrome's toolbar, then **YTM AI Blocker … V4 Beta**. Pin it if desired. This first click starts tab audio capture.
6. The panel should show **v4.0.11 Beta**. Auto-skip starts **off** on a fresh installation; meters and analysis still work. Enable auto-skip in the panel if desired.

The package already contains the model and required JavaScript/WebAssembly files. **No Python, npm, terminal command or local HTTP server is required by users.** It is a manually loaded Chrome extension, not a double-click desktop executable or a Chrome Web Store installation. For updates, replace the extracted folder contents with a new release, reload the extension and refresh YouTube Music. Manual loading does not provide automatic updates.

## What it does

- TR/EN panel, draggable and initially centered vertically on the right.
- Independent left/right audio meters, integer AI Meter, scale ticks and decaying peak markers.
- Four-second audio windows advance every second. WebGPU is attempted; a CPU fallback is available. The first model/GPU warm-up may take longer.
- AI timing verdict: score **strictly above 80% for four continuous seconds**, or **three separate runs of at least three seconds**, using fresh consecutive results in the same track. Missing results reset continuity; an old high reading held onscreen cannot advance the timer.
- Auto-skip off keeps analysis/meters/verdict active. Analysis pause keeps audio and stereo meters active. Track allowances override automatic skips.
- Track blocking/allowances and local automatic-skip history (up to 200 entries). No channel-wide blocking.
- The **!** warning bubble explains limitations; the author link opens a manual public GitHub suggestion form.

Slow CPUs may not sustain the result cadence needed by the timer. A local Chrome microbenchmark after the GPU packaging fix returned roughly 0.15-second warm inference, not a guarantee for every device or track. GPU-unavailable or unsupported-model paths fall back to CPU and may remain too slow for automatic skipping. See [limitations](docs/KNOWN-LIMITATIONS.md).

## Provenance and privacy

The production-label row reads available text declarations and provider mentions. **None** does not mean human-made. Digital provenance remains **Unverified**: live C2PA/SynthID verification is not integrated. A shared database and community voting service are **not connected** in this Beta.

Live audio stays in memory on the device; no inference audio, listening history or votes are uploaded. Model/runtime assets are loaded from the extension package. Preferences, track blocks/allowances and skip history remain in local Chrome storage. The only host permission is YouTube Music. Feedback/track links open third-party pages only when used. [Privacy policy](PRIVACY.md).

## Developers and licensing

Users need only the release ZIP. Developers: `npm ci`, `npm test`, `python3 -m unittest discover -s tests -p 'test_*.py'`, `npm run build`.

The `backend/` and catalog-related `core/` modules are an experimental local foundation, not a deployed or authenticated public voting API. They are not used by the packaged extension.

ArtifactNet v9.4 (intrect / Heewon Oh) is bundled under **CC BY-NC 4.0**, with its owner's additional patent notices. Model weights are unchanged; a documented zero-denominator graph guard fixes numerical errors, not classification accuracy. This application grants no commercial or patent license. ONNX Runtime Web 1.30.0 is MIT-licensed. See [third-party notices](THIRD_PARTY_NOTICES.md) and the bundled model card. No permissive license has been selected for the application source; public visibility is not an additional license grant.

GitHub distribution only. No Chrome Web Store listing is claimed.

## Optional Python analysis — local 4.0.11 Beta

See the [Python analysis guide](docs/AUDIO-ANALYSIS.md) for selected local audio files. The extension remains serverless; the Python tool runs separately and does not produce AI verdicts. The GitHub download above is the published 4.0.11 release; 4.0.11 is the current Beta.

## Windows and macOS starter packages

[Windows ZIP](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/download/v4.0.11-beta.1/ytm-ai-blocker-4.0.11-beta.1-Windows.zip) · [macOS ZIP](https://github.com/kahraman-melek-mimar/ytm-ai-blocker/releases/download/v4.0.11-beta.1/ytm-ai-blocker-4.0.11-beta.1-macOS.zip). Extract, then open START-Windows.cmd or START-macOS.command. Chrome requires a manual first Load unpacked step. If the launcher does not run, open START.html. This is a Chrome extension, not a standalone desktop application. No live Windows verification is claimed.
