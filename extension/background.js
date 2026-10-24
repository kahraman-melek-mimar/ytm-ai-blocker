import {Decision} from './core.mjs';
import {Evidence} from './evidence.mjs';
let session = null;
let operation = false;
let creating;
let startupError = null;
// In-memory objects are a cache; capture ownership and decision evidence survive a worker restart.
const restored = (async () => {
  const {captureSession, startupError: savedError} = await chrome.storage.session.get(['captureSession','startupError']);
  startupError = savedError || null;
  if (!captureSession || !await chrome.offscreen.hasDocument()) return;
  session = {...captureSession, decision: Object.assign(new Decision(), captureSession.decision),
    evidence: Object.assign(new Evidence(), captureSession.evidence || {})};
})();
async function persistSession() {
  await chrome.storage.session.set({captureSession: session ? {...session, decision: {...session.decision}, evidence: {...session.evidence}} : null});
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
async function skipIfReady(s) {
  // A retained verdict is for display; only a fresh qualifying run can skip.
  if (session !== s || s.skipped || s.paused || !s.track?.enabled || !s.track.playing ||
      !s.decision.tick(Date.now(), true).skip) return;
  s.skipped = true;
  await persistSession();
  await send(s.tabId, {type: 'SKIP', id: s.track.id,
    reason: 'Audio model: above 80% for 4 seconds, or three separate 3-second runs.'});
}
async function stop() {
  const old = session;
  session = null;
  await persistSession();
  if (await chrome.offscreen.hasDocument()) {
    await chrome.runtime.sendMessage({target: 'audio', type: 'STOP'}).catch(() => {});
    await chrome.offscreen.closeDocument();
  }
  if (old) await send(old.tabId, {type: 'STATUS', code: 'captureStopped'});
  await chrome.action.setBadgeText({text: ''});
}
chrome.action.onClicked.addListener(async tab => {
  if (operation) return;
  operation = true;
  let stage = 'offscreen';
  try {
    await restored;
    startupError = null;
    await chrome.storage.session.set({startupError:null});
    if (session?.tabId === tab.id) { await stop(); return; }
    if (!tab.url?.startsWith('https://music.youtube.com/')) {
      await chrome.action.setBadgeText({text: 'YTM'}); return;
    }
    await stop();
    await offscreen();
    stage = 'tabCapture';
    const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId: tab.id});
    session = {tabId: tab.id, track: null, epoch: crypto.randomUUID(), decision: new Decision(), evidence: new Evidence()};
    stage = 'audioStart';
    const result = await chrome.runtime.sendMessage({target: 'audio', type: 'START', streamId});
    if (!result?.ok) throw new Error(result?.error || 'Ses yakalanamadı.');
    await persistSession();
    await chrome.action.setTitle({title:'YTM AI Blocker V4 TEST'});
    await chrome.action.setBadgeText({text: 'ON'});
    await chrome.action.setBadgeBackgroundColor({color: '#127d68'});
    await send(tab.id, {type: 'STATUS', code: 'captureStarted'});
  } catch (error) {
    const id = tab.id;
    try { await stop(); } catch { session = null; }
    startupError = {tabId:id, stage, detail:`${stage}: ${error.message}`};
    await chrome.storage.session.set({startupError});
    console.error('V4 capture start failed', startupError.detail);
    await chrome.action.setTitle({title:startupError.detail});
    await send(id, {type: 'STATUS', code: 'captureError', detail: startupError.detail});
    await chrome.action.setBadgeText({text: '!'});
  } finally { operation = false; }
});
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target === 'audio') return;
  (async () => {
    await restored;
    if (message.type === 'ANALYSIS_TOGGLE' && sender.tab?.id === session?.tabId) {
      const s = session; s.paused = !s.paused;
      s.epoch = crypto.randomUUID(); s.decision.reset(); s.evidence.reset(); s.skipped = false;
      await chrome.runtime.sendMessage({target:'audio',type:'TRACK',epoch:s.epoch,
        active:Boolean(s.track?.id && s.track.playing && !s.paused)});
      await send(s.tabId,{type:'COUNTDOWN',elapsed:null});
      await persistSession();
    }
    if (message.type === 'TRACK' && sender.tab?.id === session?.tabId) {
      const s = session;
      const t = message.track;
      if (s.track?.id !== t.id) s.modelVerdict = false;
      if (s.track?.id !== t.id || s.track?.playing !== t.playing || s.track?.seekToken !== t.seekToken ||
          Math.abs((s.track?.position ?? 0) - t.position) > 2) {
        s.epoch = crypto.randomUUID(); s.decision.reset(); s.evidence.reset();
        s.skipped = false;
        await send(s.tabId, {type: 'COUNTDOWN', elapsed: null});
        await chrome.runtime.sendMessage({target: 'audio', type: 'TRACK', epoch: s.epoch,
          active: Boolean(t.id && t.playing && !s.paused)});
      }
      const ownershipChanged = s.track?.id !== t.id || s.track?.playing !== t.playing || s.track?.seekToken !== t.seekToken;
      s.track = t;
      if (ownershipChanged) await persistSession();
      s.decision.tick(Date.now(), t.playing);
      await send(s.tabId, {type: 'MODEL_VERDICT', id: t.id, detected: Boolean(s.modelVerdict)});
      await skipIfReady(s);
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
      if (!s || s.paused || message.epoch !== s.epoch || !s.track?.playing) {
        reply({ok: true, ignored: true}); return;
      }
      if (message.error) {
        s.decision.reset(); s.evidence.reset();
        await send(s.tabId, {type: 'SCORE_PENDING', count: 0});
        await send(s.tabId, {type: 'COUNTDOWN', elapsed: null});
        await send(s.tabId, {type: 'STATUS', code: message.errorCode || 'analysisError', detail: message.error});
      } else {
        const estimate = s.evidence.sample(message.probability, Date.now(), message.sampleTime);
        if (!estimate.ready) {
          s.decision.reset();
          await send(s.tabId, {type: 'SCORE_PENDING', count: estimate.count});
          await send(s.tabId, {type: 'COUNTDOWN', elapsed: null});
        } else {
          s.decision.sample(estimate.score, Date.now(), message.sampleTime);
          await send(s.tabId, {type: 'SCORE', probability: estimate.score, rawProbability: message.probability, seconds: message.seconds});
          const decision = s.decision.tick(Date.now(), true);
          if (decision.skip) s.modelVerdict = true;
          // User enabled model-based skipping; this is not verified provenance.
          await send(s.tabId, {type: 'MODEL_VERDICT', id: s.track.id, detected: Boolean(s.modelVerdict)});
          await send(s.tabId, {type: 'COUNTDOWN', elapsed: decision.remaining === null ? null : Math.min(4, s.decision.seconds), runs: s.decision.qualifyingRuns});
          if (message.inferenceMs > 1500) await send(s.tabId, {type:'STATUS',code:'slowAnalysis',values:{duration:(message.inferenceMs/1000).toFixed(1)},detail:`${message.backend || 'CPU'} · ${message.inferenceMs} ms`});
          await skipIfReady(s);
        }
      }
    }
    if (message.type === 'RESULT') await persistSession();
    if (message.type === 'CAPTURE_ENDED' && sender.url === chrome.runtime.getURL('offscreen.html')) await stop();
    if (message.type === 'HELLO') reply({capturing: sender.tab?.id === session?.tabId, paused: Boolean(session?.paused), startupError:sender.tab?.id === startupError?.tabId ? startupError.detail : null});
    else reply({ok: true, capturing: Boolean(session && sender.tab?.id === session.tabId), paused: Boolean(session?.paused), startupError:sender.tab?.id === startupError?.tabId ? startupError.detail : null});
  })().catch(error => reply({error: error.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { (async () => { await restored; if (session?.tabId === id) await stop(); })().catch(() => {}); });
