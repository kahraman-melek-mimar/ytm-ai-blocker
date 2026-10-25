import test from 'node:test';
import assert from 'node:assert/strict';
import {Decision} from '../extension/core.mjs';
test('four seconds of fresh high scores required; wall time alone cannot skip', () => {
 const d=new Decision();
 for(let t=0;t<4000;t+=1000){d.sample(.9,10000+t,4000+t);assert.equal(d.tick(10000+t,true).skip,false);}
 assert.equal(d.tick(14000,true).skip,false);
 d.sample(.9,14000,8000);assert.equal(d.tick(14000,true).skip,true);
});
test('three separate three-second runs qualify without a four-second run',()=>{
 const d=new Decision();
 for(let run=0;run<3;run++){
  const start=run*5000;
  for(let t=0;t<=3000;t+=1000){d.sample(.95,start+t);assert.equal(d.tick(start+t,true).skip,run===2&&t===3000);}
  assert.equal(d.qualifyingRuns,run+1);
  if(run<2)d.sample(.7,start+4000);
 }
});
test('one long run counts once, short bursts do not count',()=>{
 const d=new Decision();
 for(let t=0;t<=12000;t+=1000)d.sample(.9,t);
 assert.equal(d.qualifyingRuns,1);
 d.reset();
 for(let run=0;run<5;run++){
  const t=run*4000;for(let dt=0;dt<=2000;dt+=1000)d.sample(.9,t+dt);
  d.sample(.2,t+3000);
 }
 assert.equal(d.qualifyingRuns,0);assert.equal(d.ready,false);
});
test('exact 80 breaks the current run; invalid, stale, paused and explicit reset clear history',()=>{
 const d=new Decision();
 for(let t=0;t<=3000;t+=1000)d.sample(.9,t);
 d.sample(.8,4000);assert.equal(d.seconds,0);assert.equal(d.qualifyingRuns,1);
 d.sample(.9,5000);assert.equal(d.seconds,0);
 d.tick(8000,true);assert.equal(d.qualifyingRuns,0);
 for(const p of [NaN,Infinity,-1,1.1]){d.sample(p,9000);assert.equal(d.since,null);}
 for(let t=10000;t<=13000;t+=1000)d.sample(.9,t);
 d.tick(13000,false);assert.equal(d.qualifyingRuns,0);
});
test('duplicate and missing samples never advance a run',()=>{
 const d=new Decision();d.sample(.9,1000,4000);d.sample(.9,2000,4000);assert.equal(d.seconds,0);
 d.sample(.9,3000,6000);assert.equal(d.seconds,0);
});
test('1.9-second inference cadence counts only real overlapping four-second windows',()=>{
 const d=new Decision();
 for(const [wall,end] of [[0,4000],[1900,5000],[3800,7000],[5700,9000]]) {
  d.sample(.99,wall,end,end-4000);
 }
 assert.equal(d.seconds,5);assert.equal(d.tick(5700,true).skip,true);
});
test('coverage does not invent time between scores or bridge missing audio',()=>{
 const d=new Decision();d.sample(.99,0,4000,0);
 assert.equal(d.tick(2000,true).skip,false);assert.equal(d.seconds,0);
 d.sample(.99,2000,9000,5000);assert.equal(d.seconds,0);
 d.sample(.99,4000,11000,7000);assert.equal(d.seconds,2);
 d.sample(.8,5900,13000,9000);assert.equal(d.seconds,0);assert.equal(d.ready,false);
});
test('invalid window spans and stale arrivals still reset timing',()=>{
 const d=new Decision();d.sample(.99,0,4000,0);d.sample(.99,1900,6000,0);assert.equal(d.seconds,0);
 d.sample(.99,5000,8000,4000);assert.equal(d.seconds,0);
});
