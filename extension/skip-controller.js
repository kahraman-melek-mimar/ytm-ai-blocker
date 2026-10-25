(() => {
  class SkipController {
    constructor({readTrack, nextButton, now = () => Date.now(), delay = ms => new Promise(resolve => setTimeout(resolve, ms))}) {
      Object.assign(this, {readTrack, nextButton, now, delay}); this.busy = false;
    }
    async attempt(id) {
      if (this.busy) return {ok:false,reason:'busy'};
      const track = this.readTrack();
      if (!id || track.id !== id || !track.playing) return {ok:false,reason:'ineligible'};
      const button = this.nextButton();
      if (!button || button.disabled || button.hasAttribute?.('disabled') || button.getAttribute?.('aria-disabled') === 'true') return {ok:false,reason:'unavailable'};
      this.busy = true;
      try {
        button.click();
        const end = this.now() + 3000;
        do {
          await this.delay(100);
          const fresh = this.readTrack();
          if (fresh.id && fresh.id !== id) return {ok:true,reason:'trackChanged'};
        } while (this.now() < end);
        return {ok:false,reason:'unchanged'};
      } catch { return {ok:false,reason:'clickFailed'}; }
      finally { this.busy = false; }
    }
  }
  globalThis.YTMSkipController = SkipController;
})();
