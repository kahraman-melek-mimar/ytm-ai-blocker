(() => {
  class ScoreView {
    constructor() { this.reset(); }
    reset() { this.probability = null; this.windows = 0; this.seconds = 0; this.peak = null; this.peakAt = null; }
    accept(probability, seconds = 4, now = Date.now()) {
      if (!Number.isFinite(probability) || probability < 0 || probability > 1) return false;
      this.advancePeak(now); this.probability = probability; this.peak = Math.max(this.peak ?? 0, probability * 100); this.peakAt = now; this.windows++; this.seconds += Number.isFinite(seconds) && seconds > 0 ? seconds : 1; return true;
    }
    advancePeak(now = Date.now()) {
      if (this.peak !== null && this.peakAt !== null) {
        this.peak = Math.max(this.score ?? 0, this.peak - Math.max(0, now - this.peakAt) / 1000 * 8);
        this.peakAt = now;
      }
      return this.peak;
    }
    get color() {
      const score = this.score ?? 0;
      const stops = [[0,[117,223,177]],[50,[244,202,102]],[80,[255,100,90]],[100,[255,65,65]]];
      for (let i=1;i<stops.length;i++) if(score<=stops[i][0]) {
        const [a,x]=stops[i-1], [b,y]=stops[i], t=(score-a)/(b-a);
        return `rgb(${x.map((v,j)=>Math.round(v+(y[j]-v)*t)).join(', ')})`;
      }
    }
    get score() { return this.probability === null ? null : this.probability * 100; }
    get label() { return this.score === null ? 'YZ skoru: —' : `YZ skoru: %${Math.round(this.score)}`; }
    collecting(percent) {
      const seconds = Math.max(0, Math.min(4, Number(percent) / 25));
      return Number.isFinite(seconds) ? `Sıradaki ses örneği: ${seconds.toFixed(1)} / 4 sn` : 'Ses örneği bekleniyor';
    }
  }
  globalThis.YTMScoreView = ScoreView;
})();
