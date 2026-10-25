import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,stat} from 'node:fs/promises';
const source=await readFile(new URL('../extension/offscreen.js',import.meta.url),'utf8');
function setup(){
 const reports=[],sent=[];
 const scope=vm.createContext({console,Promise,Error,Math,setTimeout,clearTimeout,
  chrome:{runtime:{sendMessage:async m=>reports.push(m),onMessage:{addListener:()=>{}}}}});
 vm.runInContext(source,scope);
 scope.captureRequest=m=>sent.push(m);
 vm.runInContext("active=true;epoch='first';ready=Promise.resolve(true);worker={postMessage:message=>captureRequest(message)};",scope);
 const run=(tag='first',time=4000)=>vm.runInContext(`analyze({epoch:'${tag}',samples:new Float32Array(176400).fill(.1),sampleTime:${time},seconds:1})`,scope);
 const complete=async(value=.9)=>{
  const message=sent.at(-1);scope.resultId=message.id;scope.resultValue=value;
  vm.runInContext('{const entry=requests.get(resultId);clearTimeout(entry.timer);requests.delete(resultId);entry.resolve({probability:resultValue,inferenceMs:1200});}',scope);
  await new Promise(resolve=>setImmediate(resolve));
 };
 return {scope,reports,sent,run,complete};
}
test('standalone package contains model/runtime assets and no localhost permission',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../extension/manifest.json',import.meta.url)));
 assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,'4.0.11');
 assert.ok((await readFile(new URL('../extension/content.js',import.meta.url),'utf8')).includes(`const VERSION = '${manifest.version} Beta'`));
 assert.equal(manifest.cross_origin_embedder_policy,undefined);
 assert.equal(manifest.cross_origin_opener_policy,undefined);
 assert.deepEqual(manifest.host_permissions,['https://music.youtube.com/*']);
 assert.ok(manifest.content_security_policy.extension_pages.includes('wasm-unsafe-eval'));
 for(const file of ['model-worker.mjs','browser-model.mjs','vendor/ort.wasm.min.mjs',
  'vendor/ort-wasm-simd-threaded.mjs','vendor/ort-wasm-simd-threaded.wasm',
  'vendor/ort-wasm-simd-threaded.asyncify.mjs','vendor/ort-wasm-simd-threaded.asyncify.wasm',
  'model-engine.mjs','vendor/ort.webgpu.min.mjs','vendor/ort-wasm-simd-threaded.jsep.mjs','vendor/ort-wasm-simd-threaded.jsep.wasm',
  'models/artifactnet_v94_zero_guard.onnx','models/artifactnet_v94_full.onnx.data'])
  assert.ok((await stat(new URL('../extension/'+file,import.meta.url))).size>0,file);
 assert.ok(!source.includes('fetch('));assert.ok(!source.includes('127.0.0.1'));
});
test('late inference result cannot change a new track',async()=>{
 const s=setup();const first=s.run();await new Promise(resolve=>setImmediate(resolve));
 vm.runInContext("epoch='second'",s.scope);await s.complete();await first;assert.equal(s.reports.length,0);
});
test('slow inference retains only the newest pending window and serializes calls',async()=>{
 const s=setup();const first=s.run();await new Promise(resolve=>setImmediate(resolve));
 await s.run('first',5000);await s.run('first',6000);await s.run('first',7000);
 assert.equal(s.sent.length,1);await s.complete();await first;
 assert.equal(s.sent.length,2);await s.complete();
 assert.deepEqual(s.reports.map(x=>x.sampleTime),[4000,7000]);
});
test('analysis pause discards pending scores rather than reporting them',async()=>{
 const s=setup();const first=s.run();await new Promise(resolve=>setImmediate(resolve));
 vm.runInContext('active=false;queued=null;',s.scope);await s.complete();await first;assert.equal(s.reports.length,0);
});
