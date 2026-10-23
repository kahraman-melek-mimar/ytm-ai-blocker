let stream, context, source, collector, sink, epoch, active = false, pending, controller;
function report(data) { return chrome.runtime.sendMessage({type: 'RESULT', ...data}).catch(() => {}); }
async function stop() {
  active = false; epoch = null; controller?.abort(); pending = null;
  if (stream) for (const track of stream.getTracks()) track.stop();
  stream = null;
  if (context) await context.close();
  context = null;
}
async function analyze(data) {
  if (!active || data.epoch !== epoch) return;
  if (pending) {
    await report({epoch, error: 'Model cannot keep up', errorCode: 'modelBusy'});
    return;
  }
  const requestEpoch = data.epoch;
  const request = crypto.randomUUID(); pending = request;
  const abort = new AbortController(); controller = abort;
  const timer = setTimeout(() => abort.abort(), 6000);
  try {
    const response = await fetch('http://127.0.0.1:5050/analyze', {
      method: 'POST', headers: {'Content-Type': 'application/octet-stream'},
      body: data.samples.buffer, signal: abort.signal});
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || `HTTP ${response.status}`);
      const codes = ['invalidScore', 'insufficientAudio', 'invalidAudio', 'modelBusy', 'modelFailure'];
      const legacy = result.error === 'Model geçerli bir skor üretmedi.' ? 'invalidScore' :
        result.error === 'Sessizlik: analiz için yeterli ses yok.' ? 'insufficientAudio' : null;
      error.code = codes.includes(result.code) ? result.code : legacy || (response.status === 429 ? 'modelBusy' : 'modelFailure');
      throw error;
    }
    if (typeof result.probability !== 'number' || !Number.isFinite(result.probability) ||
        result.probability < 0 || result.probability > 1) {
      const error = new Error('Geçersiz model çıktısı.'); error.code = 'invalidScore'; throw error;
    }
    if (active && requestEpoch === epoch) await report({epoch: requestEpoch, probability: result.probability, sampleTime: data.sampleTime, seconds: data.seconds});
  } catch (error) {
    if (active && requestEpoch === epoch && pending === request) await report({epoch: requestEpoch,
      error: error.message, errorCode: error.name === 'AbortError' ? 'timeout' : error instanceof TypeError ? 'fetchError' : (error.code || 'modelFailure')});
  } finally { clearTimeout(timer); if (pending === request) pending = null; }
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.target !== 'audio') return;
  (async () => {
    if (message.type === 'START') {
      await stop();
      stream = await navigator.mediaDevices.getUserMedia({audio: {mandatory: {
        chromeMediaSource: 'tab', chromeMediaSourceId: message.streamId}}, video: false});
      stream.getAudioTracks()[0].onended = () => chrome.runtime.sendMessage({type: 'CAPTURE_ENDED'});
      context = new AudioContext({sampleRate: 44100});
      if (context.sampleRate !== 44100) throw new Error('44100 Hz ses bağlamı oluşturulamadı.');
      await context.audioWorklet.addModule('pcm-worklet.js');
      source = context.createMediaStreamSource(stream);
      source.connect(context.destination); // tabCapture suppresses original playback.
      collector = new AudioWorkletNode(context, 'pcm-collector', {channelCountMode: 'max', channelInterpretation: 'discrete'});
      collector.port.onmessage = event => {
        const data = event.data;
        if (data.type === 'LEVELS') {
          chrome.runtime.sendMessage(data).catch(() => {});
        } else if (data.samples) {
          chrome.runtime.sendMessage({type: 'PROGRESS', epoch: data.epoch, phase: 'inference'}).catch(() => {});
          analyze(data);
        } else {
          chrome.runtime.sendMessage({type: 'PROGRESS', epoch: data.epoch, phase: 'collecting', percent: data.percent}).catch(() => {});
        }
      };
      sink = context.createGain(); sink.gain.value = 0;
      source.connect(collector).connect(sink).connect(context.destination);
      await context.resume();
    } else if (message.type === 'TRACK') {
      controller?.abort(); epoch = message.epoch; active = message.active;
      collector?.port.postMessage({epoch, active});
    } else if (message.type === 'STOP') await stop();
    reply({ok: true});
  })().catch(async error => { await stop(); reply({ok: false, error: error.message}); });
  return true;
});
