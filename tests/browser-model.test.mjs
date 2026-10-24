import test from 'node:test';
import assert from 'node:assert/strict';
import {BrowserModel} from '../core/browser-model.mjs';
function setup(run=async()=>({score:{data:new Float32Array([.9])}})) {
 const session={outputNames:['score'],run,release:async()=>{}};
 const ort={env:{wasm:{}},Tensor:class {constructor(type,data,dims){Object.assign(this,{type,data,dims});}},
  InferenceSession:{create:async()=>session}};
 return new BrowserModel(ort,{modelUrl:'models/guarded.onnx',weightsUrl:'models/weights.data'});
}
test('adapter rejects missing, malformed, silent and non-finite audio',async()=>{
 const m=setup();await assert.rejects(m.analyze(new Float32Array(176400)),{code:'modelUnavailable'});
 await m.load();
 await assert.rejects(m.analyze(new Float32Array(2)),{code:'invalidAudio'});
 const bad=new Float32Array(176400);bad[1]=NaN;
 await assert.rejects(m.analyze(bad),{code:'invalidAudio'});
 await assert.rejects(m.analyze(new Float32Array(176400)),{code:'insufficientAudio'});
});
test('adapter validates scores and releases busy lock after failure',async()=>{
 let score=NaN;const m=setup(async()=>({score:{data:[score]}}));await m.load();
 const audio=new Float32Array(176400).fill(.1);
 await assert.rejects(m.analyze(audio),{code:'invalidScore'});
 score=.9;assert.equal(await m.analyze(audio),.9);
 await m.dispose();assert.equal(m.session,null);
});
test('inference serialization prevents concurrent model calls',async()=>{
 let done;const m=setup(()=>new Promise(resolve=>{done=resolve;}));await m.load();
 const audio=new Float32Array(176400).fill(.1);const pending=m.analyze(audio);
 await assert.rejects(m.analyze(audio),{code:'modelBusy'});
 done({score:{data:[.5]}});assert.equal(await pending,.5);
});
