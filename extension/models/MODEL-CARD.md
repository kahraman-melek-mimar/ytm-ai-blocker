---
license: cc-by-nc-4.0
tags:
  - audio-classification
  - ai-music-detection
  - forensic
  - onnx
language:
  - en
pipeline_tag: audio-classification
---

# ArtifactNet v9.4 — AI-Generated Music Forensic Detection

ArtifactNet detects AI-generated music by extracting forensic residual artifacts via a task-specific UNet, rather than learning generator-specific patterns. This approach generalizes across 22 AI music generators with only 4.2M parameters.

**Try it without installing anything:** [analyze a track in the live ArtifactNet demo](https://demo.intrect.io/?utm_source=huggingface&utm_medium=referral&utm_campaign=artifactnet_hub_2026q3&utm_content=model_card). For the production API, batch workflow, limitations, and current plans, see the [ArtifactNet product page](https://intrect.io/artifactnet/?utm_source=huggingface&utm_medium=referral&utm_campaign=artifactnet_hub_2026q3&utm_content=model_card).

> ⚠️ **License: CC BY-NC 4.0 — Non-Commercial Only**
> This ONNX inference build may not be used for any commercial product, service, API, or
> revenue-generating activity. Research, academic, and personal evaluation use are welcome.
> For commercial licensing, contact: **contact@intrect.io**

> 🛡️ **Patent Pending (KR + PCT)**
> The bounded-mask residual extraction and codec-invariant training methods used in
> ArtifactNet are covered by pending patent applications. Use of the ONNX build under
> CC BY-NC 4.0 grants no patent license; commercial deployment requires both a
> commercial license and a patent license (contact above for both).

> ℹ️ **What is released**
> A pre-compiled, end-to-end **ONNX inference build** of the full pipeline (STFT → UNet →
> HPSS → 7-channel CNN → sigmoid). Raw PyTorch weights, training code, and training data
> are **not** publicly released. This is a deliberate scope limitation — the released
> binary is sufficient to reproduce inference numbers reported in our paper, but does
> not enable fine-tuning or weight extraction.

## Model Description

- **Architecture**: ArtifactUNet (3.6M) + 7ch HPSS Forensic CNN (424K) = 4.2M total
- **Input**: 44.1kHz mono audio, 4-second segments
- **Output**: P(AI) ∈ [0, 1] per segment, song-level median verdict
- **Format**: Single ONNX file (entire pipeline: STFT → UNet → HPSS → 7ch → CNN → sigmoid)

## Performance — ArtifactBench v0.9 (test-only fair eval, all models unseen)

| Metric | ArtifactNet (4.2M) | CLAM (194M) | SpecTTTra (19M) |
|---|---|---|---|
| **F1** | **0.9829** | 0.7576 | 0.7713 |
| **Precision** | 0.9905 | 0.6674 | 0.8519 |
| **Recall (TPR)** | 0.9755 | 0.8761 | 0.7046 |
| **FPR** | 0.0149 | 0.6926 | 0.1943 |
| **AUC** | **0.9974** | 0.7031 | 0.8460 |
| @FPR≤5% TPR | **99.1%** | - | - |

Evaluated on 2,263 tracks (`bench_origin=test`, unseen by all three models),
threshold τ=0.5, identical preprocessing.

## Usage

```python
import onnxruntime as ort
import numpy as np
import soundfile as sf

# Load ONNX inference build
sess = ort.InferenceSession("artifactnet_v94_full.onnx")

# Load audio (44.1kHz mono, 4-second chunk)
audio, sr = sf.read("track.wav", dtype="float32")
if audio.ndim > 1:
    audio = audio.mean(axis=1)
chunk = audio[:4 * 44100].reshape(1, -1).astype(np.float32)

# Inference
prob = sess.run(None, {"audio": chunk})[0][0]
print(f"P(AI) = {prob:.4f}")  # > 0.5 → AI-generated
```

For song-level verdict, compute median over multiple chunks.

## Benchmark

Evaluate with [ArtifactBench v1](https://huggingface.co/datasets/intrect/artifactbench).

If you want to compare the public ONNX build with the production detector on your own audio, use the [live demo](https://demo.intrect.io/?utm_source=huggingface&utm_medium=referral&utm_campaign=artifactnet_hub_2026q3&utm_content=model_benchmark).

## Citation

```bibtex
@article{oh2026artifactnet,
  title        = {ArtifactNet: Detecting AI-Generated Music via Forensic Residual Physics},
  author       = {Oh, Heewon},
  journal      = {arXiv preprint arXiv:2604.16254},
  year         = {2026},
  eprint       = {2604.16254},
  archivePrefix= {arXiv},
  primaryClass = {cs.SD},
  doi          = {10.48550/arXiv.2604.16254},
  url          = {https://arxiv.org/abs/2604.16254}
}
```

**arXiv**: [2604.16254](https://arxiv.org/abs/2604.16254) · **DOI**: [10.48550/arXiv.2604.16254](https://doi.org/10.48550/arXiv.2604.16254)

## License

**CC BY-NC 4.0** — Free for academic, research, and personal use. **Commercial use is
prohibited** without prior written permission. This includes (but is not limited to):

- Selling access to the ONNX build or its outputs
- Integrating into commercial products, SaaS, or APIs
- Using the model to generate revenue, directly or indirectly
- Attempting to extract weights for derivative commercial models

For commercial licensing inquiries: **contact@intrect.io**

### Patent Notice

Patent applications covering the core methods of ArtifactNet are pending in Korea (KR)
and via the Patent Cooperation Treaty (PCT). The CC BY-NC 4.0 license on this ONNX
inference build does **not** convey any patent rights. Commercial use, even under a
commercial copyright license, requires a separate patent license. Academic and
research use within the scope of CC BY-NC 4.0 is permitted without separate patent
license, consistent with standard research-use exemptions.
