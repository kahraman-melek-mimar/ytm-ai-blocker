import test from 'node:test';
import assert from 'node:assert/strict';
import {ModelEngine} from '../core/model-engine.mjs';
import {Decision} from '../extension/core.mjs';
function makeModel({load=async()=>{},run=async()=>.9}={}){return {load,analyze:run,dispose:async()=>{}};}
test('use CPU when WebGPU is unavailable',async()=>{
 const m=new ModelEngine({hasGPU:async()=>false,createGPU:async()=>{throw new Error('should not call');},createCPU:async()=>makeModel()});
 await m.load();assert.equal(m.backend,'CPU');assert.equal(await m.analyze([]),.9);
});
test('failed GPU initialization falls back to CPU',async()=>{
 const m=new ModelEngine({hasGPU:async()=>true,createGPU:async()=>makeModel({load:async()=>{throw new Error('unsupported operator');}}),createCPU:async()=>makeModel()});
 await m.load();assert.equal(m.backend,'CPU');
});
test('GPU runtime failure retries the same input on CPU',async()=>{
 const input=[.1];let observed;
 const m=new ModelEngine({hasGPU:async()=>true,createGPU:async()=>makeModel({run:async()=>{throw new Error('device lost');}}),
  createCPU:async()=>makeModel({run:async samples=>{observed=samples;return .7;}})});
 await m.load();assert.equal(m.backend,'WebGPU');assert.equal(await m.analyze(input),.7);assert.equal(observed,input);assert.equal(m.backend,'CPU');
});
test('invalid score is rejected rather than silently changing engines',async()=>{
 const m=new ModelEngine({hasGPU:async()=>true,createGPU:async()=>makeModel({run:async()=>{throw Object.assign(new Error('bad score'),{code:'invalidScore'});}}),createCPU:async()=>{throw new Error('should not call');}});
 await m.load();await assert.rejects(m.analyze([]),{code:'invalidScore'});assert.equal(m.backend,'WebGPU');
});
test('counter needs consecutive results; holding the last high reading cannot qualify',()=>{
 const d=new Decision();d.sample(.95,0,4000);assert.equal(d.tick(2000,true).skip,false);
 assert.equal(d.tick(3000,true).skip,false);assert.equal(d.seconds,0);
});
test('fresh one-second results above 80 percent qualify after four seconds',()=>{
 const d=new Decision();for(let i=0;i<=4;i++)d.sample(.95,i*1000,4000+i*1000);
 assert.equal(d.seconds,4);assert.equal(d.qualifyingRuns,1);assert.equal(d.tick(4000,true).skip,true);
 d.sample(.8,5000,9000);assert.equal(d.tick(5000,true).skip,false);
});
test('skipped audio windows cannot be counted as verified continuous high scores',()=>{
 const d=new Decision();d.sample(.99,0,4000);d.sample(.99,4300,8000);
 assert.equal(d.seconds,0);assert.equal(d.tick(4300,true).skip,false);
});
