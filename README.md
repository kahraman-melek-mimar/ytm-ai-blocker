# YTM AI Blocker

**v3.1.0 · by Kahraman MELEK®**

[English](README.md) · [Türkçe](README.tr.md)

A Chrome extension for YouTube Music with local AI-audio scoring, stereo level meters, and personal track blocking. **Requires the included local Python helper.** This is an experimental personal-use build; it does not reliably identify every AI-generated song.

![English panel preview with simulated input](docs/panel-preview-en.jpg)

*UI preview with simulated input. The screenshot is not a detection accuracy result.*

## Features

- Movable compact panel. Drag the header or focus it and use the arrow keys. Position is saved and kept within the viewport.
- Turkish and English UI, remembered independently of the browser language. Native extension name/description translations are included.
- Left/right VU-style audio meters: independent RMS levels in dBFS, updated roughly 10 times per second. These are digital level meters, not broadcast-calibrated VU instruments. Mono input is mirrored.
- Central AI score meter, updated by the model roughly once per second. It is independent of audio loudness and is not animated with invented scores.
- No song title in the main panel.
- Block **this track**, not the entire artist/channel. Allow a track immediately and revoke that allowance later. Manage saved entries from Lists.
- A single production-label line, with no expandable provenance section. “None” means no readable label was found; it does not mean human-made or watermark-free.

## Requirements and installation (macOS)

1. Install Python 3.10+ and Chrome 116+. Download/extract this repository or its source release. Keep all files together.
2. Open `Install.command`. It creates `.venv` and downloads packages and the third-party model. Internet access is needed for setup.
3. Open `Start.command`. Keep its Terminal window open. Use **Control+C** to stop; **Control+Z suspends the server and breaks analysis**.
4. Open `chrome://extensions`, enable Developer mode, choose Load unpacked and select the `extension` folder. Disable older copies of the blocker.
5. Open/reload `https://music.youtube.com`, play a track and click **YTM AI Blocker** in Chrome’s puzzle-piece extensions menu. Clicking again stops capture. The helper alone cannot start browser capture.
6. Choose TR/EN in the panel. The two .command launchers also have Turkish equivalents: `Kurulum.command` and `Başlat.command`.

If macOS will not open the launcher, open Terminal in the project folder and run `zsh Install.command`, then `zsh Start.command`.

This release targets Chrome on macOS. A Chrome-installed app window must expose the extension action; if it does not, use a regular YouTube Music tab in the same Chrome profile. Safari and independent Electron music apps are not supported by this extension.

## Automatic skipping

Audio is captured continuously. After a four-second warm-up, a rolling four-second window is analyzed at one-second intervals. When a model score first exceeds **80%**, a five-second timer starts. A subsequent score below 80% resets it. Exactly 80% maintains an existing timer but does not start one. The track is skipped only when fresh results cover all five seconds without a drop below the threshold. Missing/slow analysis, pause, seeking and track changes cancel the timer. The model’s four-second window smooths rapid changes; the score is not sample-by-sample watermark verification.

**Allow this track** updates local policy immediately, before saving it, so a queued skip for that track is rejected. Auto-skip is the broad pause switch. Saved channel blocks from older versions are listed for removal but no longer cause channel-wide skipping.

## Privacy and provenance

Playback audio goes only to `http://127.0.0.1:5050` on the same computer. It is held in memory and not saved to disk or sent to a cloud detector. Block/allow lists and panel preferences are stored locally. Setup downloads dependencies/model files; there is no runtime analytics.

The production-label line reads accessible text declarations. A Suno/Udio name mention is not proof of AI generation. C2PA file credentials and proprietary audio watermarks are **not verified** by this extension. The third-party acoustic model is a statistical classifier, not a Suno or SynthID signature decoder. See [provenance research](PROVENANCE-ARASTIRMA.md).

## Limitations and model license

False positives and missed detections are possible. Turkish AI songs have been reported to receive low scores in informal user testing; accuracy has not been benchmarked by language. Use the allowance and auto-skip controls.

The model is **ArtifactNet v9.4 by intrect**, licensed **CC BY-NC 4.0** for non-commercial use. We do not redistribute its weights in the repository or source release; setup downloads a pinned revision. Commercial deployment requires appropriate permission from its owner. Public source availability is not a grant of a permissive license to this application’s code. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Development and checks

```sh
node --test tests/*.test.mjs
python3 -m pip install 'numpy>=1.26,<3'
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tools/build_release.py
```

Edit `extension/panel.css`, then run the release builder to refresh its bundled script. Tests check the bundle matches. `tools/preview.html` is a developer-only simulated UI, excluded from releases. Tests use Chrome API mocks; a fresh live Chrome capture/skip session is still required after installing updates.

The extension ZIP contains only browser files and **does not include or install the required local helper**. GitHub distribution is a development install; Chrome Web Store publication is separate.
