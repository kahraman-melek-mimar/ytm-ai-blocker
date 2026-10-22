import {Decision} from './core.mjs';
let session = null;
let operation = false;
let creating;
// In-memory objects are a cache; capture ownership and decision evidence survive a worker restart.
const restored = (async () => {
  const {captureSession} = await chrome.storage.session.get('captureSession');
  if (!captureSession || !await chrome.offscreen.hasDocument()) return;
  session = {...captureSession, decision: Object.assign(new Decision(), captureSession.decision)};
})();
async function persistSession() {
  await chrome.storage.session.set({captureSession: session ? {...session, decision: {...session.decision}} : null});
}
async function offscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creating) creating = chrome.offscreen.createDocument({url: 'offscreen.html',
    reasons: ['USER_MEDIA'], justification: 'Kullanıcının başlattığı YTM sekme sesini yerel modelle analiz etmek.'}).finally(() => { creating = null; });
  await creating;
}
async function send(tabId, message) {
  try { await chrome.tabs.sendMessage(tabId, message); } catch { /* Tab navigating. */ }
}
async function stop() {
  const old = session;
  session = null;
  await persistSession();
  if (await chrome.offscreen.hasDocument()) {
    await chrome.runtime.sendMessage({target: 'audio', type: 'STOP'}).catch(() => {});
  }
  if (old) await send(old.tabId, {type: 'STATUS', code: 'captureStopped'});
  await chrome.action.setBadgeText({text: ''});
}
chrome.action.onClicked.addListener(async tab => {
  if (operation) return;
  operation = true;
  try {
    await restored;
    if (session?.tabId === tab.id) { await stop(); return; }
    if (!tab.url?.startsWith('https://music.youtube.com/')) {
      await chrome.action.setBadgeText({text: 'YTM'}); return;
    }
    await stop();
    await offscreen();
    const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId: tab.id});
    session = {tabId: tab.id, track: null, epoch: crypto.randomUUID(), decision: new Decision()};
    const result = await chrome.runtime.sendMessage({target: 'audio', type: 'START', streamId});
    if (!result?.ok) throw new Error(result?.error || 'Ses yakalanamadı.');
    await persistSession();
    await chrome.action.setBadgeText({text: 'ON'});
    await chrome.action.setBadgeBackgroundColor({color: '#127d68'});
    await send(tab.id, {type: 'STATUS', code: 'captureStarted'});
  } catch (error) {
    const id = tab.id;
    await stop();
    await send(id, {type: 'STATUS', code: 'captureError', detail: error.message});
    await chrome.action.setBadgeText({text: '!'});
  } finally { operation = false; }
});
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target === 'audio') return;
  (async () => {
    await restored;
    if (message.type === 'TRACK' && sender.tab?.id === session?.tabId) {
      const s = session;
      const t = message.track;
      if (s.track?.id !== t.id || s.track?.playing !== t.playing || s.track?.enabled !== t.enabled || s.track?.seekToken !== t.seekToken ||
          Math.abs((s.track?.position ?? 0) - t.position) > 2) {
        s.epoch = crypto.randomUUID(); s.decision.reset();
        s.skipped = false;
        await send(s.tabId, {type: 'COUNTDOWN', elapsed: null});
        await chrome.runtime.sendMessage({target: 'audio', type: 'TRACK', epoch: s.epoch,
          active: Boolean(t.id && t.playing && t.enabled)});
      }
      const ownershipChanged = s.track?.id !== t.id || s.track?.enabled !== t.enabled || s.track?.playing !== t.playing || s.track?.seekToken !== t.seekToken;
      s.track = t;
      if (ownershipChanged) await persistSession();
      const state = s.decision.tick(Date.now(), t.playing && t.enabled);
      if (state.skip && !s.skipped) {
        s.skipped = true;
        await send(s.tabId, {type: 'SKIP', id: t.id, reason: 'Ses modeli: YZ skoru 5 saniye boyunca eşik altına düşmedi.'});
      }
    }
    if (message.type === 'LEVELS' && sender.url === chrome.runtime.getURL('offscreen.html') && session && message.epoch === session.epoch) {
      await send(session.tabId, {type: 'LEVELS', left: Math.max(0, Math.min(1, Number(message.left) || 0)),
        right: Math.max(0, Math.min(1, Number(message.right) || 0))});
    }
    if (message.type === 'PROGRESS' && sender.url === chrome.runtime.getURL('offscreen.html') && session && message.epoch === session.epoch) {
      await send(session.tabId, {type: 'PROGRESS', phase: message.phase, percent: message.percent});
    }
    if (message.type === 'RESULT' && sender.url === chrome.runtime.getURL('offscreen.html')) {
      const s = session;
      if (!s || message.epoch !== s.epoch || !s.track?.playing || !s.track.enabled || s.skipped) {
        reply({ok: true, ignored: true}); return;
      }
      if (message.error) {
        s.decision.reset();
        await send(s.tabId, {type: 'COUNTDOWN', elapsed: null});
        await send(s.tabId, {type: 'STATUS', code: message.errorCode || 'analysisError', detail: message.error});
      } else {
        s.decision.sample(message.probability, Date.now(), message.sampleTime);
        await send(s.tabId, {type: 'SCORE', probability: message.probability, seconds: message.seconds});
        const decision = s.decision.tick(Date.now(), true);
        if (decision.skip) {
          s.skipped = true;
          await send(s.tabId, {type: 'SKIP', id: s.track.id,
            reason: 'Skipping AI Music… YZ skoru 5 saniye boyunca eşik altına düşmedi.'});
        } else {
          await send(s.tabId, {type: 'STATUS', code: 'listening'});
          await send(s.tabId, {type: 'COUNTDOWN', elapsed: decision.remaining === null ? null : s.decision.seconds});
        }
      }
    }
    if (message.type === 'RESULT') await persistSession();
    if (message.type === 'CAPTURE_ENDED' && sender.url === chrome.runtime.getURL('offscreen.html')) await stop();
    if (message.type === 'HELLO') reply({capturing: sender.tab?.id === session?.tabId});
    else reply({ok: true, capturing: Boolean(session && sender.tab?.id === session.tabId)});
  })().catch(error => reply({error: error.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { (async () => { await restored; if (session?.tabId === id) await stop(); })().catch(() => {}); });
