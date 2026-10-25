import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../extension/background.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('async function skipIfReady'),source.indexOf('async function stop()'));
function setup(result){let clock=10000,calls=0;
 const s={tabId:7,epoch:'one',track:{id:'track',enabled:true,playing:true},decision:{tick:()=>({skip:true})}};
 const scope=vm.createContext({session:s,Date:{now:()=>clock},chrome:{tabs:{sendMessage:async()=>{calls++;return typeof result==='function'?result():result;}}},persistSession:async()=>{},send:async()=>{}});
 vm.runInContext(fn,scope);
 return {s,scope,run:()=>scope.skipIfReady(s),advance:()=>clock+=4000,calls:()=>calls};
}
test('background does not mark a failed next command as skipped and retries while evidence is fresh',async()=>{
 const t=setup({ok:false,reason:'unchanged'});await t.run();assert.equal(t.s.skipped,false);
 t.advance();await t.run();assert.equal(t.calls(),2);
});
test('background stops sending after a confirmed track transition',async()=>{
 const t=setup({ok:true});await t.run();assert.equal(t.s.skipped,true);t.advance();await t.run();assert.equal(t.calls(),1);
});
test('a late acknowledgment cannot latch skip on a new song or clear its pending state',async()=>{
 let finish;const t=setup(()=>new Promise(resolve=>finish=resolve));const pending=t.run();
 assert.equal(t.s.skipped,undefined);t.s.epoch='two';t.s.track.id='new';t.s.skipPending=true;
 finish({ok:true});await pending;assert.equal(t.s.skipped,undefined);assert.equal(t.s.skipPending,true);
});
