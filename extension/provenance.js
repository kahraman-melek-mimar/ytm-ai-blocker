(() => {
  const providers = [
    {name: 'Suno', token: /\bsuno\b/i},
    {name: 'Udio', token: /\budio\b/i},
    {name: 'Google Lyria / MusicFX', token: /\b(?:lyria|musicfx)\b/i}
  ];
  // Declarations are text evidence, never verified file signatures or acoustic watermarks.
  function inspect(track) {
    const fields = [['Başlık', track.title || ''], ['Sanatçı', track.artist || ''], ['Açıklama', track.description || '']];
    const evidence = [];
    for (const [source, text] of fields) {
      for (const provider of providers) {
        if (!provider.token.test(text)) continue;
        const lines = text.split(/[\n.!?]+/).filter(line => provider.token.test(line));
        const declaration = lines.some(line =>
          !/\b(?:not|never|without|no)\b|kullanılmadı|üretilmedi|değildir|degildir|kullanmadan/i.test(line) &&
          /\b(?:made|created|generated|produced|composed)\s+(?:entirely\s+)?(?:with|using|by|in)\b|ile\s+(?:üretildi|oluşturuldu|yapıldı|hazırlandı)|(?:üretilmiştir|oluşturulmuştur)/i.test(line));
        evidence.push({provider: provider.name, source, kind: declaration ? 'declaration' : 'mention'});
      }
    }
    const disclosure = (track.disclosure || '').trim();
    if (/made with ai|ai[- ]generated|altered or synthetic|yapay zek[aâ].*(?:üret|oluştur)|değiştirilmiş veya sentetik/i.test(disclosure)) {
      evidence.push({provider: 'YouTube', source: 'Oynatıcı beyanı', kind: 'platform-disclosure'});
    }
    return {evidence, credentials: 'unavailable', watermark: 'not-verified'};
  }
  function label(result) {
    if (!result.evidence.length) return 'Üretim bilgisi: okunabilir YZ beyanı bulunamadı';
    return result.evidence.map(e => `${e.provider}: ${e.kind === 'declaration' ? 'üretim beyanı' :
      e.kind === 'platform-disclosure' ? 'YZ içerik beyanı (ses/görsel ayrımı belirsiz)' : 'isim geçiyor, kanıt değil'} (${e.source})`).join(' · ');
  }
  globalThis.YTMProvenance = {inspect, label};
})();
