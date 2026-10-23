import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const scope = vm.createContext({});
vm.runInContext(await readFile(new URL('../extension/score-view.js', import.meta.url), 'utf8'), scope);
test('sample collection never overwrites or zeroes model score', () => {
  const view = new scope.YTMScoreView();
  assert.equal(view.score, null); view.accept(.923);
  for (const percent of [0, 5, 50, 100, 0, 25]) {
    assert.ok(!view.collecting(percent).includes('%'));
    assert.equal(view.label, 'YZ skoru: %92');
  }
  assert.equal(view.windows, 1); assert.equal(view.seconds, 4);
  view.accept(.021); assert.equal(view.label, 'YZ skoru: %2');
  assert.equal(view.seconds, 8);
});
test('unknown score is distinct from an actual zero model result', () => {
  const view = new scope.YTMScoreView();
  assert.equal(view.label, 'YZ skoru: —'); view.accept(0);
  assert.equal(view.label, 'YZ skoru: %0');
  assert.equal(view.accept(NaN), false); assert.equal(view.windows, 1);
  view.reset(); assert.equal(view.score, null); assert.equal(view.seconds, 0);
});

test('peak rises immediately and decays by elapsed time without modifying the score', () => {
  const view = new scope.YTMScoreView();
  view.accept(.9,1,0); view.accept(.5,1,1000);
  assert.equal(view.peak,90); assert.equal(view.advancePeak(2000),82);
  assert.equal(view.score,50); assert.equal(view.advancePeak(10000),50);
  view.accept(.98,1,11000); assert.equal(view.peak,98);
  view.reset(); assert.equal(view.peak,null);
});
test('meter blends green, yellow and red continuously', () => {
  const view = new scope.YTMScoreView();
  view.accept(0); assert.equal(view.color,'rgb(117, 223, 177)');
  view.accept(.5); assert.equal(view.color,'rgb(244, 202, 102)');
  view.accept(.65); assert.equal(view.color,'rgb(250, 151, 96)');
  view.accept(.8); assert.equal(view.color,'rgb(255, 100, 90)');
});
