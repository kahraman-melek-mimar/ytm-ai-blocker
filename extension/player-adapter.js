(() => {
  function read(doc = document, href = location.href) {
    let bridge = {};
    try { bridge = JSON.parse(doc.getElementById('ytm-ai-player-state')?.getAttribute('content') || '{}'); } catch {}
    if (!bridge.at || Date.now() - bridge.at > 3000) bridge = {};
    const bar = doc.querySelector('ytmusic-player-bar');
    const info = doc.querySelector('ytmusic-track-info');
    const videos = [...doc.querySelectorAll('video, audio')];
    const video = videos.find(v => !v.paused && !v.ended) || videos[0];
    const titleEl = info?.querySelector('.ytmusicTrackInfoTitle') || bar?.querySelector('.title');
    const artistEl = info?.querySelector('.ytmusicTrackInfoByline') || bar?.querySelector('.byline');
    let id = bridge.id || new URL(href).searchParams.get('v') || '';
    const watch = bar?.querySelector('a[href*="watch?v="]');
    if (!bridge.id && watch) { try { id = new URL(watch.href, href).searchParams.get('v') || id; } catch {} }
    const title = bridge.title || titleEl?.textContent?.trim() || '';
    const artist = bridge.artist || artistEl?.textContent?.split('•')[0]?.trim() || '';
    const link = bar?.querySelector('.byline a[href*="channel/"], .byline a[href*="browse/"]');
    let channel = /^UC[\w-]+$/.test(bridge.channel || '') ? bridge.channel : '';
    if (!channel && link) { try { channel = new URL(link.href, href).pathname.match(/^\/(?:channel|browse)\/(UC[\w-]+)$/)?.[1] || ''; } catch {} }
    return {id, title, artist, channel, description: bridge.description || '', disclosure: bridge.disclosure || '', position: video?.currentTime || 0,
      playing: Boolean(video && !video.paused && !video.ended && !video.seeking && video.readyState >= 3)};
  }
  function nextButton(doc = document) {
    return doc.querySelector('ytmusic-wiz-player-controls .ytmusicPlayerControlsNextButton button') ||
      doc.querySelector('ytmusic-wiz-player-controls button[aria-label="Next"], ytmusic-wiz-player-controls button[aria-label="Sonraki"]') ||
      doc.querySelector('ytmusic-player-bar .next-button');
  }
  globalThis.YTMPlayerAdapter = {read, nextButton};
})();
