// Conservative decision evidence, not a calibrated probability or a provenance verifier.
// Adjacent rolling windows share audio. Only disjoint four-second windows enter the median.
export class Evidence {
  constructor() { this.reset(); }
  reset() { this.segments = []; this.acceptedEnd = null; this.updatedEnd = null; this.lastWall = null; }
  sample(raw, now, sampleTime = now) {
    if (!Number.isFinite(raw) || raw < 0 || raw > 1 || !Number.isFinite(sampleTime)) {
      this.reset(); return {ready: false, count: 0, score: null};
    }
    if (this.updatedEnd !== null && sampleTime <= this.updatedEnd) return this.result(raw);
    if (this.lastWall !== null && (now - this.lastWall > 2500 || sampleTime - this.updatedEnd > 1500)) this.reset();
    this.lastWall = now; this.updatedEnd = sampleTime;
    if (this.acceptedEnd === null || sampleTime - this.acceptedEnd >= 4000) {
      this.segments.push(raw); this.segments = this.segments.slice(-3); this.acceptedEnd = sampleTime;
    }
    return this.result(raw);
  }
  result(raw) {
    if (this.segments.length < 3) return {ready: false, count: this.segments.length, score: null};
    const median = [...this.segments].sort((a,b) => a-b)[1];
    // A fresh low score always breaks the five-second run, even if older evidence was high.
    return {ready: true, count: 3, score: Math.min(raw, median)};
  }
}
