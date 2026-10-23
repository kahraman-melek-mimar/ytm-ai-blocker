import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Evidence} from '../extension/evidence.mjs';
import {Decision} from '../extension/core.mjs';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/false-positive-traces.json',import.meta.url),'utf8'));
for (const fixture of fixtures) test(`measured false-positive trace does not complete four-second gate: ${fixture.id}`, () => {
  const evidence=new Evidence(), decision=new Decision(); let maximum=0, skips=0;
  for (const row of fixture.windows) {
    const now=row.end*1000;
    const result=evidence.sample(row.raw === null ? NaN : row.raw, now, now);
    if (result.ready) { maximum=Math.max(maximum,result.score); decision.sample(result.score,now,now); }
    else decision.reset();
    if (decision.tick(now,true).skip) skips++;
  }
  assert.equal(skips,0);
});
test('continuous high scores start immediately and skip after four seconds', () => {
  const e=new Evidence(), d=new Decision(); let firstReady=null, firstSkip=null;
  for(let t=4000;t<=9000;t+=1000) {
    const result=e.sample(.95,t,t);
    if(result.ready) { firstReady ??=t; d.sample(result.score,t,t); }
    if(d.tick(t,true).skip) firstSkip ??=t;
  }
  assert.equal(firstReady,4000); assert.equal(firstSkip,8000);
});
test('earlier low scores cannot suppress a fresh high score; invalid scores reset', () => {
  const e=new Evidence();
  for(let t=4000;t<=12000;t+=1000) e.sample(.1,t,t);
  assert.equal(e.sample(.99,13000,13000).score,.99);
  assert.equal(e.sample(NaN,14000,14000).ready,false);
  assert.equal(e.sample(.99,15000,15000).ready,true);
});
test('a low sample resets the four-second run and recovery needs a full new run', () => {
  const e=new Evidence(), d=new Decision();
  for(let t=4000;t<=7000;t+=1000) d.sample(e.sample(.95,t,t).score,t,t);
  d.sample(e.sample(.79,8000,8000).score,8000,8000);
  assert.equal(d.tick(8000,true).remaining,null);
  for(let t=10000;t<=13000;t+=1000) {
    d.sample(e.sample(.95,t,t).score,t,t); assert.equal(d.tick(t,true).skip,false);
  }
  d.sample(e.sample(.95,14000,14000).score,14000,14000);
  assert.equal(d.tick(14000,true).skip,true);
});
