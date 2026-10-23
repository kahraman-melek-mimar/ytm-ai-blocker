(() => {
  function isAllowed(settings, id) { return Boolean(id && settings.allowed?.[id]); }
  function isBlocked(settings, id) { return Boolean(id && settings.blocked?.[`video:${id}`] && !isAllowed(settings, id)); }
  function block(settings, track) {
    if (!track.id) return false;
    settings.blocked[`video:${track.id}`] = track.title || track.id;
    delete settings.allowed[track.id]; return true;
  }
  function toggleAllow(settings, id) {
    if (!id) return;
    if (settings.allowed[id]) delete settings.allowed[id]; else settings.allowed[id] = true;
  }
  function recordSkip(history, entry) {
    if (!entry?.eventId || !entry.id || !Number.isFinite(entry.time)) return history;
    return [entry, ...history.filter(item => item.eventId !== entry.eventId)].slice(0, 200);
  }
  globalThis.YTMTrackPolicy = {isAllowed, isBlocked, block, toggleAllow, recordSkip};
})();
