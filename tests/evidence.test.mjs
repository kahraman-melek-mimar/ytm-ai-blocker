import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Evidence} from '../extension/evidence.mjs';
import {Decision} from '../extension/core.mjs';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/false-positive-traces.json',import.meta.url),'utf8'));
for (const fixture of fixtures) test(`measured false-positive trace suppresses short spikes: ${fixture.id}`, () => {
  const evidence=new Evidence(), decision=new Decision(); let maximum=0, skips=0;
  for (const row of fixture.windows) {
    const now=row.end*1000;
    const result=evidence.sample(row.raw === null ? NaN : row.raw, now, now);
    if (result.ready) { maximum=Math.max(maximum,result.score); decision.sample(result.score,now,now); }
    else decision.reset();
    if (decision.tick(now,true).skip) skips++;
  }
  assert.equal(skips,0); assert.ok(maximum<.8);
});
test('overlapping windows cannot satisfy independent evidence; consistent high signal still skips after five seconds', () => {
  const e=new Evidence(), d=new Decision(); let firstReady=null, firstSkip=null;
  for(let t=4000;t<=17000;t+=1000) {
    const result=e.sample(.95,t,t);
    if(result.ready) { firstReady ??=t; d.sample(result.score,t,t); }
    if(d.tick(t,true).skip) firstSkip ??=t;
  }
  assert.equal(firstReady,12000); assert.equal(firstSkip,17000);
});
test('a fresh drop below threshold cancels even when independent median is high', () => {
  const e=new Evidence(); for(let t=4000;t<=12000;t+=1000) e.sample(.95,t,t);
  assert.equal(e.sample(.4,13000,13000).score,.4);
  assert.equal(e.sample(NaN,14000,14000).ready,false);
  assert.equal(e.sample(.99,15000,15000).ready,false);
});
