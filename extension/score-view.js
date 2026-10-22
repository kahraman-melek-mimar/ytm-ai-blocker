(() => {
  class ScoreView {
    constructor() { this.reset(); }
    reset() { this.probability = null; this.windows = 0; this.seconds = 0; }
    accept(probability, seconds = 4) {
      if (!Number.isFinite(probability) || probability < 0 || probability > 1) return false;
      this.probability = probability; this.windows++; this.seconds += Number.isFinite(seconds) && seconds > 0 ? seconds : 1; return true;
    }
    get score() { return this.probability === null ? null : this.probability * 100; }
    get label() { return this.score === null ? 'YZ skoru: —' : `YZ skoru: %${this.score.toFixed(1)}`; }
    collecting(percent) {
      const seconds = Math.max(0, Math.min(4, Number(percent) / 25));
      return Number.isFinite(seconds) ? `Sıradaki ses örneği: ${seconds.toFixed(1)} / 4 sn` : 'Ses örneği bekleniyor';
    }
  }
  globalThis.YTMScoreView = ScoreView;
})();
