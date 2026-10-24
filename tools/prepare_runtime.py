"""Copy the pinned runtime assets required by both CPU and WebGPU entrypoints."""
from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1]
package=root/'node_modules/onnxruntime-web'
if json.loads((package/'package.json').read_text())['version']!='1.30.0':raise SystemExit('Unexpected ONNX Runtime version')
files=['ort.wasm.min.mjs','ort.webgpu.min.mjs',
 'ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm',
 'ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm',
 'ort-wasm-simd-threaded.asyncify.mjs','ort-wasm-simd-threaded.asyncify.wasm']
for name in files:
    source=package/'dist'/name
    if not source.is_file():raise SystemExit('Missing runtime asset: '+name)
for name in files:
    (root/'extension/vendor').mkdir(exist_ok=True)
    shutil.copy2(package/'dist'/name,root/'extension/vendor'/name)
print('Pinned CPU/WebGPU runtime assets prepared; retain vendor/ONNX-RUNTIME-LICENSE.txt.')
