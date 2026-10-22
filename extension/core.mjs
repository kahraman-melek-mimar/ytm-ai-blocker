// Score updates use a rolling four-second window, with a one-second hop.
export class Decision {
  constructor() { this.reset(); }
  reset() { this.seconds = 0; this.last = null; this.since = null; this.sampleTime = null; this.ready = false; }
  sample(probability, now, sampleTime = now) {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1 || !Number.isFinite(sampleTime)) {
      this.reset(); return;
    }
    if (this.sampleTime !== null && sampleTime <= this.sampleTime) return;
    if (this.last !== null && (now - this.last > 2500 || sampleTime - this.sampleTime > 1500)) this.reset();
    this.last = now; this.sampleTime = sampleTime;
    if (probability < .8) { this.since = null; this.seconds = 0; this.ready = false; return; }
    // Crossing requires >80%. Exactly 80% does not cancel an existing run.
    if (this.since === null && probability > .8) this.since = sampleTime;
    this.seconds = this.since === null ? 0 : (sampleTime - this.since) / 1000;
    this.ready = this.since !== null && this.seconds >= 5;
  }
  tick(now, playing) {
    if (!playing || this.last === null || now - this.last > 2500) {
      this.reset(); return {skip: false, remaining: null};
    }
    return {skip: this.ready, remaining: this.since === null ? null : Math.max(0, 5 - this.seconds)};
  }
}
