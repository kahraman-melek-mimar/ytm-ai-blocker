import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const scope=vm.createContext({Date,Promise,setTimeout});
vm.runInContext(await readFile(new URL('../extension/skip-controller.js',import.meta.url),'utf8'),scope);
const Controller=scope.YTMSkipController;
function setup(change=false){let id='old',clock=0,clicks=0;
 const button={click(){clicks++;if(change)id='new';},getAttribute(){return null;}};
 const c=new Controller({readTrack:()=>({id,playing:true}),nextButton:()=>button,now:()=>clock,delay:async ms=>{clock+=ms;}});
 return {c,button,clicks:()=>clicks,setId:v=>id=v};}
test('a click without track change fails and allows a later retry',async()=>{
 const s=setup();assert.equal((await s.c.attempt('old')).reason,'unchanged');
 assert.equal(s.c.busy,false);await s.c.attempt('old');assert.equal(s.clicks(),2);
});
test('success requires an observed nonempty different track ID',async()=>{
 const s=setup(true);assert.equal((await s.c.attempt('old')).ok,true);assert.equal(s.clicks(),1);
});
test('missing or disabled next button never reports success',async()=>{
 const s=setup();s.button.disabled=true;assert.equal((await s.c.attempt('old')).reason,'unavailable');assert.equal(s.clicks(),0);
});
test('a stale skip cannot click a different track',async()=>{
 const s=setup();s.setId('new');assert.equal((await s.c.attempt('old')).reason,'ineligible');assert.equal(s.clicks(),0);
});
