(() => {
  if (document.getElementById('ytm-ai-blocker')) return;
  const VERSION = '4.0.11 Beta';
  let settings = {enabled: false, blocked: {}, allowed: {}};
  let preferences = {language: navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en', position: null, dockVersion: 1};
  let current = null, lastSkipped = '', seekToken = 0, lastScoreAt = 0, lastLevelAt = 0;
  let skipHistory = [], pendingSkip = null;
  let modelVerdict = false;
  let counterValues = {elapsed: 0, runs: 0};
  let analysisPaused = false;
  let capture = false, tickBusy = false, messageState = {code: 'start', values: {}};
  const scoreView = new YTMScoreView();
  const levelPeaks = {left: new YTMScoreView(), right: new YTMScoreView()};
  const host = document.createElement('div'); host.id = 'ytm-ai-blocker';
  const root = host.attachShadow({mode: 'open'});
  const css = document.createElement('style'); css.textContent = YTMPanelCSS;
  root.appendChild(css);
  const panel = document.createElement('section');
  panel.innerHTML = `<header><div id="handle" tabindex="0">⠿ YTM AI BLOCKER <small>v${VERSION}</small></div><select id="language"><option value="tr">TR</option><option value="en">EN</option></select></header>
    <div class="meters"><div class="channel"><span id="left-label"></span><div class="vu-scale"><svg class="vu-ticks" id="left-ticks" viewBox="0 0 30 112" aria-hidden="true"></svg><div class="well" role="meter" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="-60" id="left-meter"><div class="fill" id="left-fill"></div><div class="vu-peak" id="left-peak" aria-hidden="true"></div></div></div><span class="db" id="left-db">−∞&nbsp;dBFS</span></div>
    <div class="ai" id="ai" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuetext="—"><div class="spectrum" aria-hidden="true"></div><svg id="dial-ticks" viewBox="0 0 158 158" aria-hidden="true"></svg><div id="peak" aria-hidden="true" hidden></div><div class="readout"><small id="ai-label"></small><div id="score">—</div><div id="age"></div></div></div>
    <div class="channel"><span id="right-label"></span><div class="vu-scale"><svg class="vu-ticks" id="right-ticks" viewBox="0 0 30 112" aria-hidden="true"></svg><div class="well" role="meter" aria-valuemin="-60" aria-valuemax="0" aria-valuenow="-60" id="right-meter"><div class="fill" id="right-fill"></div><div class="vu-peak" id="right-peak" aria-hidden="true"></div></div></div><span class="db" id="right-db">−∞&nbsp;dBFS</span></div></div>
    <div id="status" role="status" aria-live="polite"></div><div id="countdown-slot"><progress id="countdown" hidden max="4" value="0"></progress></div>
    <div id="decision-basis"><div id="model-verdict"></div><div id="digital-proof"></div></div><div class="controls"><button id="analysis-toggle" type="button"></button><label class="switch" for="enabled"><span id="auto-label"></span><input id="enabled" type="checkbox"></label><div class="actions"><button id="allow"></button><button id="block"></button></div></div>
    <footer><span id="signature"></span><button id="lists"></button></footer><div class="brand"><button id="warnings-button" type="button" aria-describedby="warnings-popover" aria-expanded="false" aria-controls="warnings-popover">!</button><span id="dot"></span><a id="feedback" href="https://github.com/kahraman-melek-mimar/ytm-ai-blocker/issues/new" target="_blank" rel="noopener noreferrer">by Kahraman MELEK®</a></div>
    <div id="warnings-popover" popover="auto" role="tooltip"><strong id="warnings-title"></strong><ul><li id="warning-error"></li><li id="warning-dj"></li><li id="warning-classical"></li></ul></div>
    <dialog id="manager" aria-labelledby="list-title"><h2 id="list-title" tabindex="0"></h2><div id="list"></div><div class="dialog-actions"><button id="reset-position"></button><button id="close"></button></div></dialog>`;
  root.appendChild(panel); document.documentElement.appendChild(host);
  const el = id => root.getElementById(id);
  const tr = (key, values) => YTMI18n.translate(preferences.language, key, values);
  for (const channel of ['left','right']) for (let value=0;value<=100;value+=2) {
    const major=value%10===0, y=1+(100-value)*1.1;
    for (const [x1,x2] of major ? [[0,5],[25,30]] : [[2,5],[25,28]]) {
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      for(const [key,v] of Object.entries({x1,x2,y1:y,y2:y})) line.setAttribute(key,String(v));
      line.setAttribute('stroke-width',major?'1.6':'0.6');
      el(`${channel}-ticks`).appendChild(line);
    }
  }
  // A 270-degree scale: major ticks every 10%, minor ticks every 2%.
  for (let value = 0; value <= 100; value += 2) {
    const major = value % 10 === 0, angle = (225 + value * 2.7) * Math.PI / 180;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const inner = major ? 69 : 73;
    for (const [key, coordinate] of Object.entries({x1:79+Math.sin(angle)*inner, y1:79-Math.cos(angle)*inner,
      x2:79+Math.sin(angle)*77, y2:79-Math.cos(angle)*77})) line.setAttribute(key, String(coordinate));
    line.setAttribute('stroke-width', major ? '2' : '0.8');
    line.setAttribute('class', major ? 'major' : 'minor');
    el('dial-ticks').appendChild(line);
  }

  function status(code, values = {}) {
    if (code === 'listening' || code === 'slowAnalysis') {
      code = 'countdown'; values = {elapsed: YTMI18n.formatNumber(preferences.language, counterValues.elapsed), runs: counterValues.runs};
    }
    messageState = {code, values}; const text = tr(code, values) + (values.detail ? ` · ${values.detail}` : '');
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
  function copyButton(text, label = 'copy') {
    const button = document.createElement('button'); button.textContent = tr(label);
    button.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = tr('copied');
        setTimeout(() => { if (button.isConnected) button.textContent = tr(label); }, 2000);
      } catch {
        const area = document.createElement('textarea'); area.value = text; area.readOnly = true;
        area.setAttribute('aria-label',tr('copyManual')); area.title = tr('copyManual');
        button.after(area); area.focus(); area.select(); button.textContent = tr('copyManual');
      }
    };
    return button;
  }
  function renderLists() {
    el('list').replaceChildren();
    const allURLs = [...Object.entries(settings.blocked).map(([key,value]) => YTMTrackPolicy.listRecord('blockedEntry',key,value).url),
      ...Object.entries(settings.allowed).map(([key,value]) => YTMTrackPolicy.listRecord('allowedEntry',key,value).url),
      ...skipHistory.map(item => YTMTrackPolicy.trackURL(item.id))].filter(Boolean);
    if (allURLs.length) {
      const copyAll = copyButton([...new Set(allURLs)].join('\n'), 'copyAll'); el('list').append(copyAll);
    }
    for (const [kind, entries] of [['blockedEntry', settings.blocked], ['allowedEntry', settings.allowed]]) {
      for (const [key, value] of Object.entries(entries)) {
        const row = document.createElement('div'); row.className = 'entry';
        const item = YTMTrackPolicy.listRecord(kind,key,value);
        const text = document.createElement(item.url ? 'a' : 'span'); text.textContent = `${tr(kind)} · ${item.title}`;
        if (item.url) { text.href = item.url; text.target = '_blank'; text.rel = 'noopener noreferrer'; }
        const button = document.createElement('button'); button.textContent = tr('remove');
        button.onclick = async () => { delete entries[key]; render(); await tick(); await saveSettings(); };
        const actions = document.createElement('div'); actions.className = 'list-actions'; if (item.url) actions.append(copyButton(item.url)); actions.append(button); row.append(text, actions); el('list').append(row);
      }
    }
    if (!el('list').childNodes.length) el('list').textContent = tr('empty');
    const heading = document.createElement('h3'); heading.textContent = tr('autoHistory'); el('list').append(heading);
    if (!skipHistory.length) {
      const empty = document.createElement('p'); empty.textContent = tr('historyEmpty'); el('list').append(empty);
    }
    for (const item of skipHistory) {
      const row = document.createElement('div'); row.className = 'history-entry';
      const link = document.createElement('a'); link.textContent = item.title || item.id;
      link.href = `https://music.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      const detail = document.createElement('small');
      const time = new Intl.DateTimeFormat(preferences.language === 'tr' ? 'tr-TR' : 'en-US', {dateStyle:'short',timeStyle:'short'}).format(new Date(item.time));
      detail.textContent = `${time} · ${tr(item.reason === 'blocked' ? 'historyBlocked' : 'historyModel')}${Number.isFinite(item.score) ? ` · ${YTMI18n.formatPercent(preferences.language,item.score)}` : ''}`;
      const remove = document.createElement('button'); remove.textContent = tr('remove');
      remove.onclick = async () => { skipHistory = skipHistory.filter(row => row.eventId !== item.eventId); renderLists(); await chrome.storage.local.set({skipHistory}); };
      const actions = document.createElement('div'); actions.className = 'list-actions'; actions.append(copyButton(link.href),remove); row.append(link,detail,actions); el('list').append(row);
    }
  }
  function renderCapture() {
    el('analysis-toggle').textContent = tr(!capture ? 'captureFirst' : analysisPaused ? 'analysisPaused' : 'listening');
    el('analysis-toggle').disabled = !capture;
    el('analysis-toggle').title = tr(!capture ? 'analysisControlHint' : analysisPaused ? 'analysisResume' : 'analysisPause');
    el('analysis-toggle').classList.toggle('is-paused', capture && analysisPaused);
    el('analysis-toggle').setAttribute('aria-pressed',String(capture && !analysisPaused));
  }
  function render() {
    panel.lang = preferences.language;
    el('feedback').title = tr('feedbackHint');
    el('feedback').setAttribute('aria-label',tr('feedbackHint'));
    const feedback = new URL('https://github.com/kahraman-melek-mimar/ytm-ai-blocker/issues/new');
    feedback.searchParams.set('title',tr('feedbackTitle'));
    feedback.searchParams.set('body',tr('feedbackBody'));
    el('feedback').href = feedback.href;
    el('language').value = preferences.language; el('language').setAttribute('aria-label', tr('language'));
    el('handle').setAttribute('aria-label', tr('drag')); el('handle').title = tr('drag');
    el('left-label').textContent = tr('left'); el('right-label').textContent = tr('right');
    for (const channel of ['left', 'right']) el(`${channel}-meter`).setAttribute('aria-label', `${tr(channel)} ${tr('level')} (dBFS)`);
    el('ai-label').textContent = tr('ai'); el('ai').setAttribute('aria-label', tr('scoreHint')); el('ai').title = tr('scoreHint');
    el('warnings-button').setAttribute('aria-label',tr('warningsTitle'));
    el('warnings-title').textContent = tr('warningsTitle');
    for(const key of ['error','dj','classical']) el(`warning-${key}`).textContent = tr(`warning_${key}`);
    el('auto-label').textContent = tr('auto'); el('enabled').checked = settings.enabled;
    el('allow').textContent = tr(settings.allowed[current?.id] ? 'revoke' : 'allow');
    el('allow').classList.toggle('is-allowed', Boolean(settings.allowed[current?.id]));
    el('block').textContent = tr('block'); el('lists').textContent = tr('lists');
    el('list-title').textContent = tr('lists'); el('list-title').title = tr('listMoveHint'); el('list-title').setAttribute('aria-label', `${tr('lists')} · ${tr('listMoveHint')}`); el('close').textContent = tr('close'); el('reset-position').textContent = tr('resetPosition');
    status(messageState.code === 'countdown' ? 'listening' : messageState.code, messageState.values); renderOrigin(); renderLists(); renderScore(); renderVerdict(); renderCapture();
  }
  function renderVerdict() {
    el('model-verdict').textContent = tr(modelVerdict ? 'modelSuspected' : 'modelUndecided');
    el('model-verdict').classList.toggle('suspected', modelVerdict);
    el('digital-proof').textContent = tr('proofUnverified');
    el('decision-basis').title = tr('decisionBasisHint');
  }
  function renderScore() {
    const score = scoreView.score;
    el('score').textContent = score === null ? '—' : YTMI18n.formatPercent(preferences.language, score);
    el('ai').style.setProperty('--turn', `${score === null ? 0 : score * 2.7}deg`);
    el('ai').style.setProperty('--accent', scoreView.color);
    const peak = scoreView.advancePeak();
    el('peak').hidden = peak === null;
    if (peak !== null) el('peak').style.transform = `rotate(${225 + peak * 2.7}deg)`;
    if (score === null) { el('ai').removeAttribute('aria-valuenow'); el('ai').setAttribute('aria-valuetext', tr('noScore')); }
    else { el('ai').setAttribute('aria-valuenow', String(score)); el('ai').setAttribute('aria-valuetext', YTMI18n.formatPercent(preferences.language, score)); }
    el('age').textContent = lastScoreAt ? tr('scoreAge', {age: Math.floor((Date.now() - lastScoreAt) / 1000)}) : tr('noScore');
  }
  function level(channel, rms) {
    const db = rms > 0 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60;
    const peakView = levelPeaks[channel];
    peakView.accept((db + 60) / 60, 1);
    el(`${channel}-peak`).style.transform = `translateY(${100 - peakView.peak}%)`;
    el(`${channel}-fill`).style.clipPath = `inset(${100 - (db + 60) / 60 * 100}% 0 0)`;
    el(`${channel}-db`).textContent = rms > .001 ? `${Math.round(db)}\u00a0dBFS` : '−∞\u00a0dBFS';
    el(`${channel}-meter`).setAttribute('aria-valuenow', String(Math.round(db)));
  }
  function readTrack() {
    const track = YTMPlayerAdapter.read();
    return {...track, seekToken, enabled: settings.enabled && !settings.allowed[track.id]};
  }
  const skipController = new YTMSkipController({readTrack,nextButton:()=>YTMPlayerAdapter.nextButton()});
  async function next(id, automaticReason = null) {
    if (lastSkipped === id || skipController.busy) return {ok:false,reason:'busy'};
    const fresh = readTrack();
    const entry = automaticReason ? {eventId:crypto.randomUUID(),id,title:fresh.title || id,time:Date.now(),
      reason:automaticReason,score:automaticReason === 'model' ? scoreView.score : null} : null;
    if (entry) pendingSkip=entry;
    status('skipping');
    const result = await skipController.attempt(id);
    if (result.ok) lastSkipped=id;
    else {
      if (pendingSkip===entry) pendingSkip=null;
      if (result.reason==='unavailable') status('nextUnavailable');
      else if (!['busy','ineligible'].includes(result.reason)) status('nextFailed');
    }
    return result;
  }
  el('analysis-toggle').onclick = async () => {
    el('analysis-toggle').disabled = true;
    try { await chrome.runtime.sendMessage({type:'ANALYSIS_TOGGLE'}); await tick(); }
    finally { renderCapture(); }
  };
  el('enabled').onchange = async event => {
    settings.enabled = event.target.checked; render(); await tick(); await saveSettings();
  };
  el('block').onclick = async () => {
    const track = readTrack(); if (!track.id) return;
    YTMTrackPolicy.block(settings, track); render(); next(track.id); await saveSettings();
  };
  el('allow').onclick = async () => {
    const track = readTrack(); if (!track.id) return;
    YTMTrackPolicy.toggleAllow(settings, track.id, track.title);
    render(); await tick(); await saveSettings();
  };
  el('language').onchange = async event => { preferences.language = event.target.value; render(); await savePreferences(); };
  el('lists').onclick = () => { renderLists(); el('manager').showModal(); restoreListWindow(); };
  el('close').onclick = () => el('manager').close();
  const manager = el('manager'), listHandle = el('list-title');
  let listOffset = null, listSaveTimer;
  function fitListWindow(left, top) {
    const rect = manager.getBoundingClientRect();
    const width = Math.min(rect.width, Math.max(1, innerWidth - 16));
    const height = Math.min(rect.height, Math.max(1, innerHeight - 16));
    manager.style.width = `${width}px`; manager.style.height = `${height}px`;
    manager.style.margin = '0'; manager.style.right = 'auto'; manager.style.bottom = 'auto';
    manager.style.left = `${Math.max(8, Math.min(left, innerWidth - width - 8))}px`;
    manager.style.top = `${Math.max(8, Math.min(top, innerHeight - height - 8))}px`;
  }
  function rememberListWindow() {
    if (!manager.open) return;
    const {left,top,width,height} = manager.getBoundingClientRect();
    preferences.listWindow = {left,top,width,height};
    clearTimeout(listSaveTimer);
    listSaveTimer = setTimeout(() => savePreferences().catch(() => {}), 200);
  }
  function restoreListWindow() {
    const saved = preferences.listWindow;
    if (saved && [saved.left,saved.top,saved.width,saved.height].every(Number.isFinite)) {
      manager.style.width = `${Math.max(260,saved.width)}px`;
      manager.style.height = `${Math.max(220,saved.height)}px`;
      fitListWindow(saved.left,saved.top);
    } else {
      const rect = manager.getBoundingClientRect();
      fitListWindow((innerWidth-rect.width)/2,(innerHeight-rect.height)/2);
    }
  }
  listHandle.onpointerdown = event => {
    if (event.button !== 0) return;
    const rect = manager.getBoundingClientRect(); listOffset = {x:event.clientX-rect.left,y:event.clientY-rect.top};
    listHandle.setPointerCapture(event.pointerId); listHandle.classList.add('dragging');
  };
  listHandle.onpointermove = event => {
    if (listOffset && listHandle.hasPointerCapture(event.pointerId)) fitListWindow(event.clientX-listOffset.x,event.clientY-listOffset.y);
  };
  listHandle.onpointerup = event => { if (listHandle.hasPointerCapture(event.pointerId)) listHandle.releasePointerCapture(event.pointerId); };
  listHandle.onlostpointercapture = () => { listOffset=null; listHandle.classList.remove('dragging'); rememberListWindow(); };
  listHandle.onkeydown = event => {
    const delta = {ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,-15],ArrowDown:[0,15]}[event.key];
    if (!delta) return;
    event.preventDefault(); const rect=manager.getBoundingClientRect(); fitListWindow(rect.left+delta[0],rect.top+delta[1]); rememberListWindow();
  };
  new ResizeObserver(() => {
    if (!manager.open) return;
    const rect=manager.getBoundingClientRect(); fitListWindow(rect.left,rect.top); rememberListWindow();
  }).observe(manager);
  addEventListener('resize', () => { if (manager.open) { const rect=manager.getBoundingClientRect(); fitListWindow(rect.left,rect.top); rememberListWindow(); } });
  manager.addEventListener('close', () => { clearTimeout(listSaveTimer); savePreferences().catch(() => {}); });
  let offset = null;
  function moveTo(left, top) {
    const rect = host.getBoundingClientRect();
    const position = {left: Math.max(8, Math.min(left, Math.max(8, innerWidth - rect.width - 8))),
      top: Math.max(8, Math.min(top, Math.max(8, innerHeight - rect.height - 8)))};
    host.style.left = `${position.left}px`; host.style.top = `${position.top}px`;
    host.style.right = 'auto'; host.style.bottom = 'auto'; host.style.transform = 'none'; preferences.position = position;
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
  function dockPanel() { for(const key of ['left','top','right','bottom','transform']) host.style[key] = ''; }
  function clamp() {
    if (preferences.position) moveTo(preferences.position.left, preferences.position.top);
    else dockPanel();
    if(el('warnings-popover').matches(':popover-open')) positionWarnings();
  }
  addEventListener('resize', clamp); new ResizeObserver(clamp).observe(panel);
  el('reset-position').onclick = async () => { preferences.position = null; dockPanel(); await savePreferences(); };
  let warningPinned = false;
  function positionWarnings() {
    const button = el('warnings-button').getBoundingClientRect();
    const bubble = el('warnings-popover').getBoundingClientRect();
    const left = Math.max(8, Math.min(button.left, innerWidth - bubble.width - 8));
    const top = button.top - bubble.height - 8 >= 8 ? button.top - bubble.height - 8 : Math.max(8, Math.min(button.bottom + 8, innerHeight - bubble.height - 8));
    el('warnings-popover').style.left = `${left}px`; el('warnings-popover').style.top = `${top}px`;
  }
  function showWarnings() { el('warnings-popover').showPopover(); positionWarnings(); }
  function hideWarnings() { if(!warningPinned) el('warnings-popover').hidePopover(); }
  el('warnings-button').onmouseenter = showWarnings;
  el('warnings-button').onmouseleave = hideWarnings;
  el('warnings-button').onfocus = showWarnings;
  el('warnings-button').onblur = hideWarnings;
  el('warnings-button').onclick = () => {
    warningPinned = !warningPinned;
    if(warningPinned) showWarnings(); else el('warnings-popover').hidePopover();
  };
  el('warnings-popover').addEventListener('toggle',event => {
    const open = event.newState === 'open';
    el('warnings-button').setAttribute('aria-expanded',String(open));
    if(!open) warningPinned = false;
  });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type === 'MODEL_VERDICT' && message.id === current?.id) {
      modelVerdict = Boolean(message.detected); renderVerdict();
    }
    if (message.type === 'STATUS') {
      if (message.code) status(message.code, {...message.values, ...(message.code === 'captureError' ? {detail:message.detail} : {})});
      else status('listening');
      el('status').title = message.detail || message.text || '';
      if (message.code==='slowAnalysis') el('age').title = `${message.detail || ''} · ${tr('slowAnalysis',message.values || {})}`;
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
      counterValues = {elapsed: Math.max(0, Math.min(4, Number(message.elapsed) || 0)), runs: Math.max(0, Math.min(3, Number(message.runs) || 0))};
      el('countdown').hidden = message.elapsed === null;
      el('countdown').value = message.elapsed || 0;
      el('countdown').setAttribute('aria-label', tr('countdown', {elapsed: YTMI18n.formatNumber(preferences.language, message.elapsed || 0), runs: message.runs || 0}));
      status('listening');
    }
    if (message.type === 'SKIP') {
      if (!settings.enabled || settings.allowed[message.id] || analysisPaused) { reply({ok:false,reason:'disabled'}); return; }
      next(message.id,'model').then(reply,()=>reply({ok:false,reason:'clickFailed'})); return true;
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings?.newValue) { settings = {...settings, ...changes.settings.newValue}; render(); }
    if (changes.skipHistory?.newValue) { skipHistory = changes.skipHistory.newValue; renderLists(); }
    if (changes.panelPreferences?.newValue) { preferences = {...preferences, ...changes.panelPreferences.newValue}; render(); clamp(); }
  });
  document.addEventListener('seeking', () => { seekToken++; }, true);
  async function tick() {
    if (tickBusy) return; tickBusy = true;
    try {
      const track = readTrack();
      if (pendingSkip && track.id && track.id !== pendingSkip.id) {
        const entry = pendingSkip; pendingSkip = null;
        skipHistory = YTMTrackPolicy.recordSkip(skipHistory, entry);
        await chrome.storage.local.set({skipHistory}); renderLists();
      } else if (pendingSkip && Date.now() - pendingSkip.time > 10000) pendingSkip = null;
      if (current?.id !== track.id) { counterValues = {elapsed:0,runs:0}; modelVerdict = false; renderVerdict(); lastSkipped = ''; lastScoreAt = 0; scoreView.reset(); el('countdown').hidden = true; status('warming'); }
      current = track; renderOrigin(); renderScore();
      el('allow').disabled = el('block').disabled = !track.id;
      el('allow').textContent = tr(settings.allowed[track.id] ? 'revoke' : 'allow');
      el('allow').classList.toggle('is-allowed', Boolean(settings.allowed[track.id]));
      if (track.id && settings.enabled && YTMTrackPolicy.isBlocked(settings, track.id)) next(track.id, 'blocked');
      if (Date.now() - lastLevelAt > 750) { level('left', 0); level('right', 0); }
      const response = await chrome.runtime.sendMessage({type: 'TRACK', track: {...track, description: undefined, disclosure: undefined}});
      const wasPaused = analysisPaused;
      analysisPaused = Boolean(response?.paused);
      if (analysisPaused !== wasPaused) { scoreView.reset(); lastScoreAt = 0; renderScore(); }
      capture = Boolean(response?.capturing); renderCapture(); el('dot').classList.toggle('on', capture);
      el('dot').title = tr(capture ? 'captureOn' : 'captureOff');
      if (!capture && response?.startupError) { status('captureError', {detail:response.startupError}); el('status').title = response.startupError; }
      else if (!capture) status('start');
      else if (analysisPaused) { status('analysisPaused'); el('countdown').hidden = true; }
      else if (!track.id) status('noTrack');
      else if (!track.playing) status('paused');

    } catch { status('reload'); }
    finally { tickBusy = false; }
  }
  (async () => {
    const data = await chrome.storage.local.get(['settings', 'panelPreferences', 'skipHistory']);
    if (Array.isArray(data.skipHistory)) skipHistory = data.skipHistory.slice(0,200);
    if (data.settings) settings = {...settings, ...data.settings};
    if (data.panelPreferences) preferences = {...preferences, ...data.panelPreferences};
    if (data.panelPreferences?.dockVersion !== 1) { preferences.position = null; preferences.dockVersion = 1; await savePreferences(); }
    render(); clamp(); await tick(); setInterval(tick, 250);
  })().catch(() => status('reload'));
})();
