import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script = await readFile(new URL('../extension/player-bridge.js', import.meta.url), 'utf8');
function run(responseId) {
  let content;
  const state = {setAttribute: (key, value) => { content = JSON.parse(value); }};
  const player = {getVideoData: () => ({video_id: 'current', title: 'Track'}),
    getPlayerResponse: () => ({videoDetails: {videoId: responseId, shortDescription: 'Made with Suno', channelId: 'UCtest'},
      playerOverlays: {syntheticDisclosure: {simpleText: 'Made with AI'}}})};
  const document = {getElementById: id => id === 'movie_player' ? player : state};
  vm.runInNewContext(script, {document, navigator: {}, Date, setInterval: () => {}});
  return content;
}
test('metadata from a previous player response is never attributed to current song', () => {
  const result = run('previous');
  assert.equal(result.description, ''); assert.equal(result.disclosure, ''); assert.equal(result.channel, '');
});
test('matching response exposes description and scoped disclosure', () => {
  const result = run('current');
  assert.equal(result.description, 'Made with Suno'); assert.match(result.disclosure, /Made with AI/);
});
