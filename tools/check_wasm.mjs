// Development-only compatibility check. Does not start an HTTP server.
import * as ort from 'onnxruntime-web/wasm';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {BrowserModel} from '../core/browser-model.mjs';
const [graph, weights, audio] = process.argv.slice(2);
if (!graph || !weights || !audio) throw new Error('Usage: node tools/check_wasm.mjs graph.onnx weights.data audio.f32');
const bytes = await readFile(audio);
if (bytes.byteLength !== 176400 * 4) throw new Error('Expected four seconds of mono float32 PCM');
const samples = new Float32Array(176400);
for (let i = 0; i < samples.length; i++) samples[i] = bytes.readFloatLE(i * 4);
const model = new BrowserModel(ort, {modelUrl: new Uint8Array(await readFile(graph)), weightsUrl: new Uint8Array(await readFile(weights))});
const start = performance.now();
try {
 await model.load();const loaded = performance.now();
 const probability = await model.analyze(samples);
 console.log(JSON.stringify({runtime:'onnxruntime-web/wasm',version:ort.env.versions.web,host:'Node.js; Chrome still requires separate validation',loadMs:Math.round(loaded-start),inferenceMs:Math.round(performance.now()-loaded),probability},null,2));
} finally { await model.dispose(); }
