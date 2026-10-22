import test from 'node:test';
import assert from 'node:assert/strict';
import {Decision} from '../extension/core.mjs';
test('five seconds of refreshed high scores required; wall time alone cannot skip', () => {
  const d = new Decision();
  for (let t = 0; t < 5000; t += 1000) {
    d.sample(.9, 10000 + t, 4000 + t);
    assert.equal(d.tick(10000 + t, true).skip, false);
  }
  assert.equal(d.tick(15000, true).skip, false);
  d.sample(.9, 15000, 9000);
  assert.equal(d.tick(15000, true).skip, true);
});
test('dip below 80 resets full five second period', () => {
  const d = new Decision();
  d.sample(.9, 1000); d.sample(.9, 2000); d.sample(.79, 3000);
  assert.equal(d.seconds, 0); assert.equal(d.tick(3000, true).remaining, null);
  for (let t = 4000; t <= 8000; t += 1000) {
    d.sample(.9, t); assert.equal(d.tick(t, true).skip, false);
  }
  d.sample(.9, 9000); assert.equal(d.tick(9000, true).skip, true);
});
test('exact 80 does not initiate but maintains a run; stale and paused results reset', () => {
  const d = new Decision();
  d.sample(.8, 1000); assert.equal(d.tick(1000, true).remaining, null);
  d.sample(.9, 2000); d.sample(.8, 3000); assert.equal(d.seconds, 1);
  d.sample(.9, 6000); assert.equal(d.seconds, 0);
  d.tick(6000, false); assert.equal(d.since, null);
  d.sample(.9, 7000); assert.equal(d.tick(10000, true).skip, false);
  assert.equal(d.since, null);
});
test('missing audio windows, repeated sample, invalid scores do not advance evidence', () => {
  const d = new Decision(); d.sample(.9, 1000, 4000); d.sample(.9, 2000, 4000);
  assert.equal(d.seconds, 0);
  d.sample(.9, 3000, 6000); assert.equal(d.seconds, 0);
  for (const p of [NaN, Infinity, -1, 1.1]) {
    d.sample(p, 4000, 7000); assert.equal(d.since, null);
  }
});
