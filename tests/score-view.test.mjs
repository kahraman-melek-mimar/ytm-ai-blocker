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
    assert.equal(view.label, 'YZ skoru: %92.3');
  }
  assert.equal(view.windows, 1); assert.equal(view.seconds, 4);
  view.accept(.021); assert.equal(view.label, 'YZ skoru: %2.1');
  assert.equal(view.seconds, 8);
});
test('unknown score is distinct from an actual zero model result', () => {
  const view = new scope.YTMScoreView();
  assert.equal(view.label, 'YZ skoru: —'); view.accept(0);
  assert.equal(view.label, 'YZ skoru: %0.0');
  assert.equal(view.accept(NaN), false); assert.equal(view.windows, 1);
  view.reset(); assert.equal(view.score, null); assert.equal(view.seconds, 0);
});
