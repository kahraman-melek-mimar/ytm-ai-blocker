// Validate each rolling-window score without changing the model output.
// Decision owns the sole temporal gate: four seconds above 80%, or three separate three-second runs.
export class Evidence {
  constructor() { this.reset(); }
  reset() { this.segments = []; this.acceptedEnd = null; this.updatedEnd = null; this.lastWall = null; }
  sample(raw, now, sampleTime = now) {
    if (!Number.isFinite(raw) || raw < 0 || raw > 1 || !Number.isFinite(sampleTime)) {
      this.reset(); return {ready: false, count: 0, score: null};
    }
    this.updatedEnd = sampleTime; this.lastWall = now;
    return {ready: true, count: 1, score: raw};
  }
}
