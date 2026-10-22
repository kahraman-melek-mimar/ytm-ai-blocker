import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('left and right RMS are measured separately, independent of AI sample collection', async () => {
  const messages = []; let Collector;
  class AudioWorkletProcessor { constructor() { this.port = {postMessage: m => messages.push(m)}; } }
  const scope = vm.createContext({AudioWorkletProcessor, Float32Array, Math,
    registerProcessor: (_, value) => { Collector = value; }});
  vm.runInContext(await readFile(new URL('../extension/pcm-worklet.js', import.meta.url), 'utf8'), scope);
  const p = new Collector();
  // Even with auto-skip analysis off, captured audio levels must keep working.
  const left = new Float32Array(128).fill(.5), right = new Float32Array(128).fill(.1);
  for (let i = 0; i < 35; i++) p.process([[left, right]]);
  const levels = messages.find(m => m.type === 'LEVELS');
  assert.ok(Math.abs(levels.left - .5) < 1e-6); assert.ok(Math.abs(levels.right - .1) < 1e-6);
  assert.equal(messages.some(m => m.samples), false);
});
