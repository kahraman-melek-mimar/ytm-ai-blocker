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
  assert.equal(translate('en', 'countdown', {elapsed: '3.0', runs: 1}), 'Time: 3.0 / 4 sec · Count: 1 / 3');
  assert.equal(translate('tr', 'block'), 'Parçayı Engelle ve Geç');
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

test('percent sign and decimal separator follow the selected language', async () => {
  const {YTMI18n: {formatPercent, formatNumber}} = await load('i18n.js');
  assert.equal(formatPercent('tr',72.4),'%72');
  assert.equal(formatPercent('en',72.4),'72%');
  assert.equal(formatPercent('tr',0),'%0');
  assert.equal(formatPercent('en',100),'100%');
  assert.equal(formatPercent('tr',NaN),'—');
  assert.equal(formatNumber('tr',3.5),'3,5');
  assert.equal(formatNumber('en',3.5),'3.5');
});

test('automatic skip history is bounded, deduplicated and separate from blocking', async () => {
  const {YTMTrackPolicy: policy} = await load('track-policy.js');
  let history=[];
  for(let i=0;i<205;i++) history=policy.recordSkip(history,{eventId:`event-${i}`,id:'same-track',title:'Track',time:i,reason:'model'});
  assert.equal(history.length,200); assert.equal(history[0].eventId,'event-204');
  history=policy.recordSkip(history,{...history[0]});assert.equal(history.length,200);
  assert.equal(history.filter(e=>e.eventId==='event-204').length,1);
  assert.equal(policy.recordSkip(history,{id:'invalid'}),history);
  const settings={allowed:{},blocked:{}};
  assert.equal(policy.isBlocked(settings,'same-track'),false);
});

test('release warning copy and meter labels are explicit in both languages', async () => {
 const {YTMI18n:{translate}}=await load('i18n.js');
 assert.equal(translate('tr','ai'),'YZ Metre'); assert.equal(translate('en','ai'),'AI Meter');
 for(const lang of ['tr','en']) for(const key of ['warning_error','warning_dj','warning_classical']) assert.notEqual(translate(lang,key),key);
 assert.equal(translate('en','warning_dj'),'Not recommended for DJ music.');
 assert.equal(translate('tr','warning_classical'),'Klasik müziklerde kullanılması önerilmez.');
});

test('saved list links support legacy allowances and blocks without turning channel IDs into songs', async () => {
 const {YTMTrackPolicy:p}=await load('track-policy.js');
 assert.equal(p.listRecord('allowedEntry','i3f1pKJdwvA',true).url,'https://music.youtube.com/watch?v=i3f1pKJdwvA');
 assert.equal(p.listRecord('blockedEntry','video:NPjIJC4ZE3k','Title').title,'Title');
 assert.equal(p.listRecord('blockedEntry','channel:UClegacy','Channel').url,null);
 assert.equal(p.trackURL('javascript:alert(1)'),null);
 const settings={allowed:{},blocked:{}};
 p.toggleAllow(settings,'i3f1pKJdwvA','Saved title');
 assert.equal(settings.allowed.i3f1pKJdwvA,'Saved title');
 assert.equal(p.isAllowed(settings,'i3f1pKJdwvA'),true);
 p.toggleAllow(settings,'i3f1pKJdwvA','Saved title');
 assert.equal(p.isAllowed(settings,'i3f1pKJdwvA'),false);
});
