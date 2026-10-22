(() => {
  if (document.getElementById('ytm-ai-blocker')) return;
  const VERSION = '3.1.1';
  let settings = {enabled: true, blocked: {}, allowed: {}};
  let preferences = {language: navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en', position: null};
  let current = null, lastSkipped = '', seekToken = 0, lastScoreAt = 0, lastLevelAt = 0;
  let capture = false, tickBusy = false, messageState = {code: 'start', values: {}};
  const scoreView = new YTMScoreView();
  const host = document.createElement('div'); host.id = 'ytm-ai-blocker';
  const root = host.attachShadow({mode: 'open'});
  const css = document.createElement('style'); css.textContent = YTMPanelCSS;
  root.appendChild(css);
  const panel = document.createElement('section');
  panel.innerHTML = `<header><div id="handle" tabindex="0">⠿ YTM AI BLOCKER <small>v${VERSION}</small></div><select id="language"><option value="tr">TR</option><option value="en">EN</option></select></header>
    <div class="meters"><div class="channel"><span id="left-label"></span><div class="well" role="meter" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="-60" id="left-meter"><div class="fill" id="left-fill"></div></div><span class="db" id="left-db">−∞</span></div>
    <div class="ai" id="ai" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuetext="—"><div class="readout"><small id="ai-label"></small><div id="score">—</div><div id="age"></div></div></div>
    <div class="channel"><span id="right-label"></span><div class="well" role="meter" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="-60" id="right-meter"><div class="fill" id="right-fill"></div></div><span class="db" id="right-db">−∞</span></div></div>
    <div id="status" role="status" aria-live="polite"></div><progress id="countdown" hidden max="5" value="0"></progress>
    <div class="controls"><label class="switch" for="enabled"><span id="auto-label"></span><input id="enabled" type="checkbox" checked></label><div class="actions"><button id="allow"></button><button id="block"></button></div></div>
    <footer><span id="signature"></span><button id="lists"></button></footer><div class="brand"><span id="dot"></span>by Kahraman MELEK®</div>
    <dialog id="manager"><h2 id="list-title"></h2><div id="list"></div><div class="dialog-actions"><button id="reset-position"></button><button id="close"></button></div></dialog>`;
  root.appendChild(panel); document.documentElement.appendChild(host);
  const el = id => root.getElementById(id);
  const tr = (key, values) => YTMI18n.translate(preferences.language, key, values);
  function status(code, values = {}) {
    messageState = {code, values}; const text = tr(code, values);
    if (el('status').textContent !== text) el('status').textContent = text;
  }
  async function saveSettings() { await chrome.storage.local.set({settings}); }
  async function savePreferences() { await chrome.storage.local.set({panelPreferences: preferences}); }
  function renderOrigin() {
    const result = YTMProvenance.inspect(current || {});
    const names = [...new Set(result.evidence.map(e => e.kind === 'platform-disclosure' ? tr('platform') :
      `${e.provider} (${tr(e.kind === 'declaration' ? 'claim' : 'mention')})`))];
    el('signature').textContent = `${tr('origin')}: ${names.join(', ') || tr('none')}`;
    el('signature').title = tr('originHint');
  }
  function renderLists() {
    el('list').replaceChildren();
    for (const [kind, entries] of [['blockedEntry', settings.blocked], ['allowedEntry', settings.allowed]]) {
      for (const [key, value] of Object.entries(entries)) {
        const row = document.createElement('div'); row.className = 'entry';
        const text = document.createElement('span'); text.textContent = `${tr(kind)} · ${typeof value === 'string' ? value : key}`;
        const button = document.createElement('button'); button.textContent = tr('remove');
        button.onclick = async () => { delete entries[key]; render(); await tick(); await saveSettings(); };
        row.append(text, button); el('list').append(row);
      }
    }
    if (!el('list').childNodes.length) el('list').textContent = tr('empty');
  }
  function render() {
    panel.lang = preferences.language;
    el('language').value = preferences.language; el('language').setAttribute('aria-label', tr('language'));
    el('handle').setAttribute('aria-label', tr('drag')); el('handle').title = tr('drag');
    el('left-label').textContent = tr('left'); el('right-label').textContent = tr('right');
    for (const channel of ['left', 'right']) el(`${channel}-meter`).setAttribute('aria-label', `${tr(channel)} ${tr('level')} (dBFS)`);
    el('ai-label').textContent = tr('ai'); el('ai').setAttribute('aria-label', tr('scoreHint')); el('ai').title = tr('scoreHint');
    el('auto-label').textContent = tr('auto'); el('enabled').checked = settings.enabled;
    el('allow').textContent = tr(settings.allowed[current?.id] ? 'revoke' : 'allow');
    el('allow').classList.toggle('is-allowed', Boolean(settings.allowed[current?.id]));
    el('block').textContent = tr('block'); el('lists').textContent = tr('lists');
    el('list-title').textContent = tr('lists'); el('close').textContent = tr('close'); el('reset-position').textContent = tr('resetPosition');
    status(messageState.code, messageState.values); renderOrigin(); renderLists(); renderScore();
  }
  function renderScore() {
    const score = scoreView.score;
    el('score').textContent = score === null ? '—' : YTMI18n.formatPercent(preferences.language, score);
    el('ai').style.setProperty('--turn', `${score === null ? 0 : score * 2.7}deg`);
    el('ai').style.setProperty('--accent', score > 80 ? '#ff967e' : '#75dfb1');
    if (score === null) { el('ai').removeAttribute('aria-valuenow'); el('ai').setAttribute('aria-valuetext', tr('noScore')); }
    else { el('ai').setAttribute('aria-valuenow', String(score)); el('ai').setAttribute('aria-valuetext', YTMI18n.formatPercent(preferences.language, score)); }
    el('age').textContent = lastScoreAt ? tr('scoreAge', {age: Math.floor((Date.now() - lastScoreAt) / 1000)}) : tr('noScore');
  }
  function level(channel, rms) {
    const db = rms > 0 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60;
    el(`${channel}-fill`).style.clipPath = `inset(${100 - (db + 60) / 60 * 100}% 0 0)`;
    el(`${channel}-db`).textContent = rms > .001 ? `${Math.round(db)}` : '−∞';
    el(`${channel}-meter`).setAttribute('aria-valuenow', String(Math.round(db)));
  }
  function readTrack() {
    const track = YTMPlayerAdapter.read();
    return {...track, seekToken, enabled: settings.enabled && !settings.allowed[track.id]};
  }
  function next(id) {
    const fresh = readTrack();
    if (!id || fresh.id !== id || lastSkipped === id || !fresh.playing) return;
    const button = YTMPlayerAdapter.nextButton();
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') { status('nextUnavailable'); return; }
    lastSkipped = id; status('skipping'); button.click();
  }
  el('enabled').onchange = async event => {
    settings.enabled = event.target.checked; render(); await tick(); await saveSettings();
  };
  el('block').onclick = async () => {
    const track = readTrack(); if (!track.id) return;
    YTMTrackPolicy.block(settings, track); render(); next(track.id); await saveSettings();
  };
  el('allow').onclick = async () => {
    const track = readTrack(); if (!track.id) return;
    YTMTrackPolicy.toggleAllow(settings, track.id);
    render(); await tick(); await saveSettings();
  };
  el('language').onchange = async event => { preferences.language = event.target.value; render(); await savePreferences(); };
  el('lists').onclick = () => { renderLists(); el('manager').showModal(); };
  el('close').onclick = () => el('manager').close();
  let offset = null;
  function moveTo(left, top) {
    const rect = host.getBoundingClientRect();
    const position = {left: Math.max(8, Math.min(left, Math.max(8, innerWidth - rect.width - 8))),
      top: Math.max(8, Math.min(top, Math.max(8, innerHeight - rect.height - 8)))};
    host.style.left = `${position.left}px`; host.style.top = `${position.top}px`;
    host.style.right = 'auto'; host.style.bottom = 'auto'; preferences.position = position;
  }
  const handle = el('handle');
  handle.onpointerdown = event => {
    if (event.button !== 0) return;
    const rect = host.getBoundingClientRect(); offset = {x: event.clientX - rect.left, y: event.clientY - rect.top};
    handle.setPointerCapture(event.pointerId); handle.classList.add('dragging');
  };
  handle.onpointermove = event => { if (offset && handle.hasPointerCapture(event.pointerId)) moveTo(event.clientX - offset.x, event.clientY - offset.y); };
  handle.onpointerup = event => { if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId); };
  handle.onlostpointercapture = () => { offset = null; handle.classList.remove('dragging'); savePreferences().catch(() => {}); };
  handle.onkeydown = event => {
    const directions = {ArrowLeft: [-15, 0], ArrowRight: [15, 0], ArrowUp: [0, -15], ArrowDown: [0, 15]};
    if (!directions[event.key]) return;
    event.preventDefault(); const rect = host.getBoundingClientRect(), [x, y] = directions[event.key];
    moveTo(rect.left + x, rect.top + y); savePreferences().catch(() => {});
  };
  function clamp() { if (preferences.position) moveTo(preferences.position.left, preferences.position.top); }
  addEventListener('resize', clamp); new ResizeObserver(clamp).observe(panel);
  el('reset-position').onclick = async () => { moveTo(innerWidth - host.offsetWidth - 22, innerHeight - host.offsetHeight - 102); await savePreferences(); };
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'STATUS') {
      if (message.code) status(message.code, message.values);
      else status('listening');
      el('status').title = message.detail || message.text || '';
    }
    if (message.type === 'SCORE_PENDING') {
      scoreView.reset(); lastScoreAt = 0; renderScore();
      el('countdown').hidden = true;
      status('comparing', {count: message.count});
    }
    if (message.type === 'SCORE' && scoreView.accept(message.probability, message.seconds)) {
      lastScoreAt = Date.now(); renderScore();
    }
    if (message.type === 'LEVELS') {
      lastLevelAt = Date.now(); level('left', message.left); level('right', message.right);
    }
    if (message.type === 'COUNTDOWN') {
      el('countdown').hidden = message.elapsed === null;
      el('countdown').value = message.elapsed || 0;
      el('countdown').setAttribute('aria-label', tr('countdown', {elapsed: YTMI18n.formatNumber(preferences.language, message.elapsed || 0)}));
      if (message.elapsed !== null) status('countdown', {elapsed: YTMI18n.formatNumber(preferences.language, message.elapsed)});
    }
    if (message.type === 'SKIP' && settings.enabled && !settings.allowed[message.id]) next(message.id);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings?.newValue) { settings = {...settings, ...changes.settings.newValue}; render(); }
    if (changes.panelPreferences?.newValue) { preferences = {...preferences, ...changes.panelPreferences.newValue}; render(); clamp(); }
  });
  document.addEventListener('seeking', () => { seekToken++; }, true);
  async function tick() {
    if (tickBusy) return; tickBusy = true;
    try {
      const track = readTrack();
      if (current?.id !== track.id) { lastSkipped = ''; lastScoreAt = 0; scoreView.reset(); el('countdown').hidden = true; status('warming'); }
      current = track; renderOrigin(); renderScore();
      el('allow').disabled = el('block').disabled = !track.id;
      el('allow').textContent = tr(settings.allowed[track.id] ? 'revoke' : 'allow');
      el('allow').classList.toggle('is-allowed', Boolean(settings.allowed[track.id]));
      if (track.id && settings.enabled && YTMTrackPolicy.isBlocked(settings, track.id)) next(track.id);
      if (Date.now() - lastLevelAt > 750) { level('left', 0); level('right', 0); }
      const response = await chrome.runtime.sendMessage({type: 'TRACK', track: {...track, description: undefined, disclosure: undefined}});
      capture = Boolean(response?.capturing); el('dot').classList.toggle('on', capture);
      el('dot').title = tr(capture ? 'captureOn' : 'captureOff');
      if (!settings.enabled) { status('disabled'); el('countdown').hidden = true; }
      else if (settings.allowed[track.id]) { status('allowed'); el('countdown').hidden = true; }
      else if (!capture) status('start');
      else if (!track.id) status('noTrack');
      else if (!track.playing) status('paused');
    } catch { status('reload'); }
    finally { tickBusy = false; }
  }
  (async () => {
    const data = await chrome.storage.local.get(['settings', 'panelPreferences']);
    if (data.settings) settings = {...settings, ...data.settings};
    if (data.panelPreferences) preferences = {...preferences, ...data.panelPreferences};
    render(); clamp(); await tick(); setInterval(tick, 250);
  })().catch(() => status('reload'));
})();
