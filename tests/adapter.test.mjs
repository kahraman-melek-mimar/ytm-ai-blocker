import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script = await readFile(new URL('../extension/player-adapter.js', import.meta.url), 'utf8');
function fixture({bridge, legacy = false} = {}) {
  const title = {textContent: 'Fari'};
  const artist = {textContent: 'AFRO DEEP RITUAL • MAMBAYA • 2026'};
  const video = {paused: false, ended: false, seeking: false, readyState: 4, currentTime: 84};
  const button = {};
  const doc = {
    getElementById: () => bridge ? {getAttribute: () => JSON.stringify(bridge)} : null,
    querySelectorAll: () => [video],
    querySelector: selector => {
      if (selector === 'ytmusic-track-info' && !legacy) return {querySelector: x => x === '.ytmusicTrackInfoTitle' ? title : artist};
      if (selector === 'ytmusic-player-bar' && legacy) return {querySelector: x => x === '.title' ? title : x === '.byline' ? artist : null};
      if (selector.includes('NextButton') && !legacy) return button;
      if (selector === 'ytmusic-player-bar .next-button' && legacy) return button;
      return null;
    }
  };
  const scope = vm.createContext({URL, Date}); vm.runInContext(script, scope);
  return {adapter: scope.YTMPlayerAdapter, doc, button};
}
test('new player on homepage reads title, artist, playback and bridge video identity', () => {
  const {adapter, doc, button} = fixture({bridge: {id: 'video123', channel: 'UCtest', at: Date.now()}});
  const track = adapter.read(doc, 'https://music.youtube.com/');
  assert.equal(track.id, 'video123'); assert.equal(track.title, 'Fari');
  assert.equal(track.artist, 'AFRO DEEP RITUAL'); assert.equal(track.playing, true);
  assert.equal(track.channel, 'UCtest'); assert.equal(adapter.nextButton(doc), button);
});
test('stale metadata cannot identify a new track', () => {
  const {adapter, doc} = fixture({bridge: {id: 'old', at: Date.now() - 9000}});
  assert.equal(adapter.read(doc, 'https://music.youtube.com/').id, '');
});
test('legacy player still works with watch URL identity', () => {
  const {adapter, doc, button} = fixture({legacy: true});
  const track = adapter.read(doc, 'https://music.youtube.com/watch?v=legacy');
  assert.equal(track.id, 'legacy'); assert.equal(track.title, 'Fari');
  assert.equal(adapter.nextButton(doc), button);
});
