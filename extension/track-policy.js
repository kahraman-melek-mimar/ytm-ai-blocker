(() => {
  function isAllowed(settings, id) { return Boolean(id && settings.allowed?.[id]); }
  function isBlocked(settings, id) { return Boolean(id && settings.blocked?.[`video:${id}`] && !isAllowed(settings, id)); }
  function block(settings, track) {
    if (!track.id) return false;
    settings.blocked[`video:${track.id}`] = track.title || track.id;
    delete settings.allowed[track.id]; return true;
  }
  function toggleAllow(settings, id, title) {
    if (!id) return;
    if (settings.allowed[id]) delete settings.allowed[id]; else settings.allowed[id] = title || true;
  }
  function recordSkip(history, entry) {
    if (!entry?.eventId || !entry.id || !Number.isFinite(entry.time)) return history;
    return [entry, ...history.filter(item => item.eventId !== entry.eventId)].slice(0, 200);
  }
  function trackURL(id) {
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? `https://music.youtube.com/watch?v=${id}` : null;
  }
  function listRecord(kind, key, value) {
    const id = kind === 'blockedEntry' ? (key.startsWith('video:') ? key.slice(6) : '') : key;
    return {id, title: typeof value === 'string' ? value : id || key, url: trackURL(id)};
  }
  globalThis.YTMTrackPolicy = {isAllowed, isBlocked, block, toggleAllow, recordSkip, trackURL, listRecord};
})();
