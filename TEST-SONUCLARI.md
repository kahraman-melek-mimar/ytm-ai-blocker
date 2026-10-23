# Validation — v3.4.0

Local checks: 37 JavaScript tests and 6 Python tests passed before final packaging. Tests cover stereo capture, player identity, stale-track rejection, 4-second/three separate 3-second timing, analysis pause/resume, auto-skip gating, historical verdict handling, bounded history, localization, HTTP busy handling and targeted model-graph derivation.

Simulated browser preview: TR/EN warning bubble opens by button click and closes with Escape; all three warnings are localized. Dial labels read YZ Metre / AI Meter. The initial panel's right margin measured 8px and its vertical-center error measured 0px. The bubble remained inside the viewport. A fixed/manual viewport-aware popover position supports Chrome 116 without relying on newer CSS anchor positioning.

Earlier local audio checks of the numerical guard: eight formerly non-finite windows returned finite scores; eleven previously finite comparison windows were identical. This is not a detection accuracy benchmark. False positives, especially DJ/classical recordings, remain a known limitation.

Screenshots are simulated previews. Runtime model weights, private audio, C2PA input files, extracted manifests and local analysis reports are excluded from publication.
