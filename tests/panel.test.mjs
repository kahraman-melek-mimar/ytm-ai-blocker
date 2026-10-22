import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
async function load(file) {
  const scope = vm.createContext({});
  vm.runInContext(await readFile(new URL(`../extension/${file}`, import.meta.url), 'utf8'), scope); return scope;
}
test('TR and EN cover the same UI messages without unresolved placeholders', async () => {
  const {YTMI18n: {messages, translate}} = await load('i18n.js');
  assert.deepEqual(Object.keys(messages.tr).sort(), Object.keys(messages.en).sort());
  assert.equal(translate('en', 'countdown', {elapsed: '3.0'}), 'AI high · 3.0 / 5 sec');
  assert.equal(translate('tr', 'block'), 'Bu parçayı engelle ve geç');
});
test('track block never blocks other songs by the same channel; allowance wins immediately', async () => {
  const {YTMTrackPolicy: policy} = await load('track-policy.js');
  const settings = {blocked: {}, allowed: {}};
  policy.block(settings, {id: 'one', channel: 'UCsame', title: 'One'});
  assert.equal(policy.isBlocked(settings, 'one'), true);
  assert.equal(policy.isBlocked(settings, 'two'), false);
  assert.equal(settings.blocked['channel:UCsame'], undefined);
  policy.toggleAllow(settings, 'one'); assert.equal(policy.isBlocked(settings, 'one'), false);
  policy.toggleAllow(settings, 'one'); assert.equal(policy.isBlocked(settings, 'one'), true);
});
test('bundled panel CSS is identical to its editable source', async () => {
  const {YTMPanelCSS} = await load('panel-style.js');
  assert.equal(YTMPanelCSS, await readFile(new URL('../extension/panel.css', import.meta.url), 'utf8'));
});
test('all manifest script and locale references exist', async () => {
  const manifest = JSON.parse(await readFile(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
  for (const group of manifest.content_scripts) for (const file of group.js) await readFile(new URL(`../extension/${file}`, import.meta.url));
  for (const lang of ['tr', 'en']) {
    const messages = JSON.parse(await readFile(new URL(`../extension/_locales/${lang}/messages.json`, import.meta.url), 'utf8'));
    assert.ok(messages.extensionName.message); assert.ok(messages.extensionDescription.message);
  }
});
