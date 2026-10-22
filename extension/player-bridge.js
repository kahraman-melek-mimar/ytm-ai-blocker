(() => {
  const key = 'ytm-ai-player-state';
  let state = document.getElementById(key);
  if (!state) { state = document.createElement('meta'); state.id = key; document.documentElement.appendChild(state); }
  function update() {
    const player = document.getElementById('movie_player');
    let data = {}, response = {};
    try { data = player?.getVideoData?.() || {}; response = player?.getPlayerResponse?.() || {}; } catch {}
    const detail = response.videoDetails || {};
    const media = navigator.mediaSession?.metadata;
    const id = data.video_id || detail.videoId || '';
    const matched = Boolean(id && detail.videoId === id);
    function disclosureText(value, trusted = false, depth = 0) {
      if (depth > 10 || !value) return '';
      if (typeof value === 'string') return trusted ? value.slice(0, 500) : '';
      if (Array.isArray(value)) return value.slice(0, 30).map(v => disclosureText(v, trusted, depth + 1)).join(' ');
      if (typeof value !== 'object') return '';
      return Object.entries(value).slice(0, 50).map(([key, v]) =>
        disclosureText(v, trusted || /disclosure|synthetic|provenance|altered|contentcredentials/i.test(key), depth + 1)).join(' ').slice(0, 4000);
    }
    state.setAttribute('content', JSON.stringify({
      id, title: data.title || detail.title || media?.title || '',
      artist: data.author || detail.author || media?.artist || '', channel: matched ? (detail.channelId || '') : '',
      description: matched ? (detail.shortDescription || '').slice(0, 12000) : '',
      disclosure: matched ? disclosureText(response.playerOverlays) : '', at: Date.now()
    }));
  }
  update(); setInterval(update, 500);
})();
