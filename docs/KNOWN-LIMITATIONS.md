# V4 Beta limitations / Sınırlar

- Experimental AI-audio scoring can miss generated tracks and flag human recordings. Not recommended for DJ/classical music. / Hata yapabilir; DJ/klasik müzik için önerilmez.
- A score is not a calibrated probability, a digital signature or proof of origin. Text disclosures/provider mentions are separate evidence; None does not mean human-made. Live C2PA/SynthID verification is not implemented.
- No shared catalog, community voting, Deezer or ShazamKit integration is active in this Beta. Experimental catalog source is not an authenticated public backend.
- Target: desktop Chrome/compatible Chromium 116+ on Windows/Linux/macOS. Live audio and GPU testing was on macOS Chrome; Windows/Linux have not been live validated. Safari and Firefox are not supported by this package.
- WebGPU/model support varies with browser and hardware. CPU fallback can be too slow for continuous timing confirmation. The first GPU compilation may be slower than warm inference. A roughly 0.15-second local Chrome microbenchmark after correcting the runtime bundle is not a whole-product performance guarantee.
- The four-second / three separate three-second decision requires fresh consecutive model results. Holding the previous high score onscreen is not counted as continuous detection. Gaps and invalid results reset continuity; no missing interval is assumed high.
- YouTube playback/DOM changes, ads, unavailable next controls and capture restrictions can affect operation. First capture requires a toolbar gesture. Pause/seek/new track invalidates old results. Meters are digital RMS displays, not calibrated broadcast VU instruments.
- Track allowance/block/history storage is local to this extension installation. V3/V4 test/production folders can have different extension IDs; preferences are not migrated automatically. Disable other copies on the same music page.
- This is a GitHub ZIP loaded manually through Developer mode, not a desktop executable or Chrome Web Store installation. Keep the extracted directory. Updates are manual.
- The packaged ArtifactNet model is CC BY-NC 4.0 with additional patent notices; commercial/patent rights are not granted. Application source has no separately selected permissive license. See THIRD_PARTY_NOTICES.md.
