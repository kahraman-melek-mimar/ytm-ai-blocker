// Dependency-injected adapter for packaged ONNX Runtime Web; browser validation pending.
export class BrowserModel {
  constructor(ort, {modelUrl, weightsUrl, weightsPath = 'artifactnet_v94_full.onnx.data', executionProviders = ['wasm']}) {
    this.ort = ort; this.config = {modelUrl, weightsUrl, weightsPath, executionProviders}; this.session = null; this.busy = false;
  }
  async load() {
    const {modelUrl, weightsUrl, weightsPath, executionProviders} = this.config;
    if (!modelUrl || !weightsUrl) throw new Error('Packaged model paths required');
    this.ort.env.wasm.numThreads = 1;
    this.ort.env.wasm.proxy = false;
    this.session = await this.ort.InferenceSession.create(modelUrl, {
      executionProviders, externalData: [{path: weightsPath, data: weightsUrl}]
    });
  }
  async analyze(samples) {
    if (!this.session) throw Object.assign(new Error('Model not loaded'), {code:'modelUnavailable'});
    if (this.busy) throw Object.assign(new Error('Model busy'), {code:'modelBusy'});
    if (!(samples instanceof Float32Array) || samples.length !== 176400 || !samples.every(Number.isFinite))
      throw Object.assign(new Error('Expected four seconds of finite 44.1 kHz mono audio'), {code:'invalidAudio'});
    let energy = 0;
    for (const sample of samples) {
      if (Math.abs(sample) > 1.1) throw Object.assign(new Error('PCM outside allowed range'), {code:'invalidAudio'});
      energy += sample * sample;
    }
    if (Math.sqrt(energy / samples.length) < 0.0001) throw Object.assign(new Error('Insufficient audio'), {code:'insufficientAudio'});
    this.busy = true;
    try {
      const input = new this.ort.Tensor('float32', samples, [1, samples.length]);
      const result = await this.session.run({audio:input});
      const probability = result[this.session.outputNames[0]]?.data?.[0];
      if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1)
        throw Object.assign(new Error('Invalid model score'), {code:'invalidScore'});
      return probability;
    } finally { this.busy = false; }
  }
  async dispose() {
    if (this.busy) throw new Error('Cannot release a running model');
    await this.session?.release(); this.session = null;
  }
}
