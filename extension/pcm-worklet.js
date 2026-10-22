class PCMCollector extends AudioWorkletProcessor {
  constructor() {
    super(); this.buffer = new Float32Array(44100 * 4); this.enabled = false; this.total = 0; this.index = 0; this.levelCount = 0; this.sums = [0, 0];
    this.port.onmessage = event => {
      this.enabled = event.data.active; this.epoch = event.data.epoch;
      this.total = 0; this.index = 0; this.progress = 0;
    };
  }
  process(inputs) {
    const channels = inputs[0];
    if (!channels?.length) return true;
    const left = channels[0], right = channels[1] || left;
    for (let i = 0; i < left.length; i++) {
      this.sums[0] += left[i] * left[i]; this.sums[1] += right[i] * right[i]; this.levelCount++;
      if (this.levelCount >= 4410) {
        this.port.postMessage({type: 'LEVELS', epoch: this.epoch,
          left: Math.sqrt(this.sums[0] / this.levelCount), right: Math.sqrt(this.sums[1] / this.levelCount)});
        this.sums = [0, 0]; this.levelCount = 0;
      }
    }
    if (!this.enabled) return true;
    for (let i = 0; i < channels[0].length; i++) {
      let value = 0;
      for (const channel of channels) value += channel[i] / channels.length;
      this.buffer[this.index] = value;
      this.index = (this.index + 1) % this.buffer.length; this.total++;
      const first = this.total < this.buffer.length;
      const percent = first ? Math.floor(this.total / this.buffer.length * 20) * 5 : 0;
      if (first && percent > this.progress) {
        this.progress = percent; this.port.postMessage({epoch: this.epoch, percent});
      }
      if (this.total >= this.buffer.length && (this.total - this.buffer.length) % 44100 === 0) {
        const samples = new Float32Array(this.buffer.length);
        samples.set(this.buffer.subarray(this.index));
        samples.set(this.buffer.subarray(0, this.index), this.buffer.length - this.index);
        this.port.postMessage({epoch: this.epoch, samples, sampleTime: this.total / 44100 * 1000,
          seconds: this.total === this.buffer.length ? 4 : 1}, [samples.buffer]);
      }
    }
    return true;
  }
}
registerProcessor('pcm-collector', PCMCollector);
