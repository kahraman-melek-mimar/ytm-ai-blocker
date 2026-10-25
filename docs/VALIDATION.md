# Release validation — 2026-10-25

V4 4.0.4 Beta: 52 JavaScript + 5 Python checks passed. Covers track identity/provenance scoping, meter formatting/stereo separation, evidence/timing gates, GPU failure fallback, local catalog contract, capture epochs/pause and bounded queue, packaged assets and visible Beta version.

Actual Chrome microbenchmark: packaged ONNX Runtime Web 1.30.0, WebGPU, one CPU fallback thread, isolation disabled, extension-equivalent self/wasm CSP. Warm four-second model inference 170/144/150 ms on the development Mac. This is not a whole-product/all-device accuracy or performance guarantee. User has trialed the serverless extension. No Windows/Linux live verification is claimed.

V3.4.1 server edition: 37 JavaScript + 6 Python checks passed on the separate v3-server branch. Both local helper and extension are required.

Beta model weights and classifier thresholds are unchanged from the tested V4.0.4. Numerical zero-denominator guard retained. Runtime includes the required asyncify assets; earlier GPU fallback was caused by a missing asyncify module in the local package. No private audio, credentials, raw listening records or local analysis reports are included in either release.

Local test build 4.0.5 Beta: VU readouts include dBFS in both channels, including silence. No new spectral detection rules, model weights or skip thresholds. Not published to GitHub.

Local 4.0.6 Beta adds an optional offline Python DSP tool. Synthetic 50 Hz AM recovery, stereo inversion power preservation and silence are checked by --self-test. The tool is exercised against six local recordings. The extension model and skip rules are unchanged. No Python server or live Python integration is introduced. Research recordings and trained pilot artifacts remain excluded from release archives.

Published 4.0.9 Beta preparation: 53 JavaScript + 5 Python checks passed. Windows and macOS packages include platform launchers and a bilingual local setup guide. Launchers open Chrome/guide; first Load unpacked remains manual. macOS launcher shell syntax verified; Windows execution is not live-tested. Local community-service deployments, credentials, listening data and pilot models are excluded.

4.0.11 Beta: 63 JS regression checks passed, including observed skip acknowledgment, bounded retry eligibility and actual overlapping-window coverage at a 1.9-second inference cadence. Stale or missing audio does not advance timing. Windows live testing remains in progress.
