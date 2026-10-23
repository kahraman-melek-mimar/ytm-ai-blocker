import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('capture averages stereo, emits exact windows and drops old track samples', async () => {
  let Processor;
  const chunks = [];
  class AudioWorkletProcessor {
    constructor() { this.port = {postMessage: data => data.samples && chunks.push(data)}; }
  }
  const scope = vm.createContext({AudioWorkletProcessor, Float32Array,
    registerProcessor: (name, implementation) => { Processor = implementation; }});
  vm.runInContext(await readFile(new URL('../extension/pcm-worklet.js', import.meta.url), 'utf8'), scope);
  const p = new Processor();
  const input = [[new Float32Array(128).fill(.4), new Float32Array(128).fill(.2)]];
  for (let i = 0; i < 2000; i++) p.process(input);
  assert.equal(chunks.length, 0);
  p.port.onmessage({data: {active: true, epoch: 'first'}});
  for (let i = 0; i < 100; i++) p.process(input);
  p.port.onmessage({data: {active: true, epoch: 'second'}});
  for (let i = 0; i < 1378; i++) p.process(input);
  assert.equal(chunks.length, 0);
  p.process(input);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].epoch, 'second');
  assert.equal(chunks[0].samples.length, 176400);
  assert.ok(Math.abs(chunks[0].samples[0] - .3) < .00001);
  for (let i = 0; i < 345; i++) p.process(input);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[1].sampleTime - chunks[0].sampleTime, 1000);
  assert.equal(chunks[1].seconds, 1);
  assert.equal(chunks[0].seconds, 4);
});

test('background rejects old track results after navigation, pause and seek', async () => {
  const listeners = {}, sent = [], audio = [];
  const sessionData = {};
  globalThis.chrome = {
    storage: {session: {get: async () => sessionData, set: async value => Object.assign(sessionData, structuredClone(value))}},
    offscreen: {hasDocument: async () => true},
    action: {onClicked: {addListener: f => { listeners.click = f; }},
      setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {}},
    tabCapture: {getMediaStreamId: async () => 'stream'},
    tabs: {sendMessage: async (id, message) => { sent.push(message); },
      onRemoved: {addListener: () => {}}},
    runtime: {getURL: path => `chrome-extension://test/${path}`,
      sendMessage: async message => { audio.push(message); return {ok: true}; },
      onMessage: {addListener: f => { listeners.message = f; }}}
  };
  await import('../extension/background.js');
  const tab = {id: 7, url: 'https://music.youtube.com/watch?v=one'};
  await listeners.click(tab);
  const deliver = (message, sender) => new Promise(resolve => listeners.message(message, sender, resolve));
  const track = {id: 'one', playing: true, enabled: true, position: 0, seekToken: 0};
  await deliver({type: 'TRACK', track: {...track}}, {tab});
  let epoch = audio.at(-1).epoch;
  const source = {url: 'chrome-extension://test/offscreen.html'};
  await deliver({type: 'RESULT', epoch, probability: .95}, source);
  assert.ok(sent.some(m => m.type === 'SCORE' && m.probability === .95));
  assert.equal(sent.some(m => m.type === 'SKIP'), false);
  for (const change of [{id: 'two'}, {playing: false}, {playing: true, seekToken: 1}]) {
    Object.assign(track, change);
    await deliver({type: 'TRACK', track: {...track}}, {tab});
    const count = sent.length;
    await deliver({type: 'RESULT', epoch, probability: .99}, source);
    assert.equal(sent.length, count);
    epoch = audio.at(-1).epoch;
  }
  for (let sampleTime = 0; sampleTime <= 5000; sampleTime += 1000) {
    await deliver({type: 'RESULT', epoch, probability: .95, sampleTime}, source);
    assert.equal(sent.filter(m => m.type === 'SKIP').length, sampleTime >= 4000 ? 1 : 0);
  }
  assert.ok(sent.some(m => m.type === 'MODEL_VERDICT' && m.id === 'two' && m.detected));
  const priorEpoch = epoch, audioCount = audio.length;
  track.enabled = false;
  await deliver({type: 'TRACK', track: {...track}}, {tab});
  assert.equal(audio.length, audioCount); // Toggle must not reset audio or the epoch.
  await deliver({type: 'RESULT', epoch: priorEpoch, probability: .37, sampleTime: 6000}, source);
  assert.equal(sent.filter(m => m.type === 'SCORE').at(-1).probability, .37);
  assert.equal(sent.filter(m => m.type === 'MODEL_VERDICT').at(-1).detected, true);
  assert.equal(sent.filter(m => m.type === 'SKIP').length, 1);
  assert.equal(sent.find(m => m.type === 'SKIP').id, 'two');
  track.id = 'three';
  await deliver({type: 'TRACK', track: {...track}}, {tab});
  epoch = audio.at(-1).epoch;
  assert.equal(audio.at(-1).active, true);
  assert.equal(sent.filter(m => m.type === 'MODEL_VERDICT').at(-1).detected, false);
  for (let t=0;t<=5000;t+=1000) await deliver({type: 'RESULT', epoch, probability: .96, sampleTime:t},source);
  assert.equal(sent.filter(m=>m.type==='MODEL_VERDICT').at(-1).detected,true);
  assert.equal(sent.filter(m=>m.type==='SKIP').length,1);
  track.enabled = true;
  await deliver({type:'TRACK',track:{...track}}, {tab});
  assert.equal(sent.filter(m=>m.type==='SKIP').length,2);
  assert.equal(sent.filter(m=>m.type==='SKIP').at(-1).id,'three');
  await deliver({type:'RESULT',epoch,probability:.97,sampleTime:6000},source);
  assert.equal(sent.filter(m=>m.type==='SKIP').length,2);
  assert.equal(sent.filter(m=>m.type==='SCORE').at(-1).probability,.97);
  // A retained model verdict after a low sample must not skip on re-enable.
  track.id='four';track.enabled=false;
  await deliver({type:'TRACK',track:{...track}}, {tab});epoch=audio.at(-1).epoch;
  for(let t=0;t<=5000;t+=1000) await deliver({type:'RESULT',epoch,probability:.96,sampleTime:t},source);
  await deliver({type:'RESULT',epoch,probability:.2,sampleTime:6000},source);
  track.enabled=true;
  await deliver({type:'TRACK',track:{...track}}, {tab});
  assert.equal(sent.filter(m=>m.type==='SKIP').length,2);
  const beforePause = epoch;
  const paused = await deliver({type:'ANALYSIS_TOGGLE'}, {tab});
  assert.equal(paused.paused,true); assert.equal(audio.at(-1).active,false);
  const pausedEpoch=audio.at(-1).epoch, countBefore=sent.filter(m=>m.type==='SCORE').length;
  await deliver({type:'LEVELS',epoch:pausedEpoch,left:.5,right:.1},source);
  assert.equal(sent.filter(m=>m.type==='LEVELS').at(-1).left,.5);
  assert.equal(sent.filter(m=>m.type==='LEVELS').at(-1).right,.1);
  for(const old of [beforePause,pausedEpoch]) await deliver({type:'RESULT',epoch:old,probability:.99,sampleTime:7000},source);
  assert.equal(sent.filter(m=>m.type==='SCORE').length,countBefore);
  const resumedAnalysis=await deliver({type:'ANALYSIS_TOGGLE'}, {tab});
  assert.equal(resumedAnalysis.paused,false); assert.equal(audio.at(-1).active,true);
  epoch=audio.at(-1).epoch; assert.notEqual(epoch,pausedEpoch);
  await deliver({type:'RESULT',epoch,probability:.4,sampleTime:4000},source);
  assert.equal(sent.filter(m=>m.type==='SCORE').at(-1).probability,.4);
  await import('../extension/background.js?restart-test');
  const resumed = await deliver({type: 'TRACK', track: {...track}}, {tab});
  assert.equal(resumed.capturing, true);
  await listeners.click(tab);
  assert.equal(sessionData.captureSession, null);
  delete globalThis.chrome;
});
