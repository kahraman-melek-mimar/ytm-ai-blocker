// Fresh rolling-window scores; >80% for 4 seconds OR three separate 3-second runs.
export class Decision {
  constructor() { this.reset(); }
  reset() {
    this.seconds = 0; this.last = null; this.since = null; this.sampleTime = null;
    this.ready = false; this.qualifyingRuns = 0; this.runCounted = false;
  }
  sample(probability, now, sampleTime = now, windowStart = null) {
    if (!Number.isFinite(probability) || probability < 0 || probability > 1 || !Number.isFinite(sampleTime)) {
      this.reset(); return;
    }
    if (this.sampleTime !== null && sampleTime <= this.sampleTime) return;
    // A real four-second analyzed window can bridge a slower inference cadence.
    // Never bridge missing audio, an invalid span, stale delivery, or a held score.
    const covered = Number.isFinite(windowStart) && Math.abs(sampleTime-windowStart-4000)<=1 &&
      this.sampleTime !== null && windowStart <= this.sampleTime && sampleTime-this.sampleTime <= 4000;
    if (this.last !== null && (now - this.last > 2500 || (sampleTime - this.sampleTime > 1500 && !covered))) this.reset();
    this.last = now; this.sampleTime = sampleTime;
    if (probability <= .8) {
      this.since = null; this.seconds = 0; this.ready = false; this.runCounted = false; return;
    }
    if (this.since === null) this.since = sampleTime;
    this.seconds = (sampleTime - this.since) / 1000;
    if (this.seconds >= 3 && !this.runCounted) {
      this.qualifyingRuns++; this.runCounted = true;
    }
    this.ready = this.seconds >= 4 || this.qualifyingRuns >= 3;
  }
  tick(now, playing) {
    if (!playing || this.last === null || now - this.last > 2500) {
      this.reset(); return {skip: false, remaining: null};
    }
    return {skip: this.ready, remaining: this.since === null ? null : Math.max(0, 4 - this.seconds)};
  }
}
