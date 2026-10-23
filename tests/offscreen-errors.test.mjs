import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../extension/offscreen.js',import.meta.url),'utf8');
function setup(fetch) {
 const reports=[];
 const scope=vm.createContext({fetch,AbortController,crypto,setTimeout,clearTimeout,
  chrome:{runtime:{sendMessage:async m=>reports.push(m),onMessage:{addListener:()=>{}}}}});
 vm.runInContext(code+"\nactive=true;epoch='current';",scope);
 return {scope,reports,run:()=>vm.runInContext("analyze({epoch:'current',samples:new Float32Array(4),sampleTime:4000,seconds:4})",scope)};
}
test('server invalid-score, silence and busy errors remain distinct',async()=>{
 for(const [status,code] of [[422,'invalidScore'],[422,'insufficientAudio'],[429,'modelBusy']]){
  const s=setup(async()=>({ok:false,status,json:async()=>({error:'detail',code})}));
  await s.run();assert.equal(s.reports.at(-1).errorCode,code);assert.equal(s.reports.at(-1).epoch,'current');
 }
});
test('late failure from a previous track cannot reset the current track',async()=>{
 let reject;const s=setup(()=>new Promise((_,r)=>reject=r));const request=s.run();
 vm.runInContext("epoch='next'",s.scope);reject(new Error('old error'));await request;
 assert.equal(s.reports.length,0);
});
test('invalid model response is discarded, never converted to a zero score',async()=>{
 const s=setup(async()=>({ok:true,json:async()=>({probability:NaN})}));await s.run();
 assert.equal(s.reports.at(-1).errorCode,'invalidScore');assert.equal(s.reports.at(-1).probability,undefined);
});

test('older running servers report invalid scores without mislabeling execution failure',async()=>{
 for(const [error,expected] of [['Model geçerli bir skor üretmedi.','invalidScore'],['Sessizlik: analiz için yeterli ses yok.','insufficientAudio']]) {
  const s=setup(async()=>({ok:false,status:422,json:async()=>({error})}));
  await s.run();assert.equal(s.reports.at(-1).errorCode,expected);
 }
});
