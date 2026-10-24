// GPU support is a capability probe, not a guarantee that a model kernel can run.
export class ModelEngine {
  constructor({hasGPU, createGPU, createCPU}) {Object.assign(this,{hasGPU,createGPU,createCPU});this.model=null;this.backend=null;}
  async load() {
    if(await this.hasGPU()) {
      let candidate;
      try {candidate=await this.createGPU();await candidate.load();this.model=candidate;this.backend='WebGPU';return;}
      catch {try{await candidate?.dispose();}catch{/* Partial initialization. */}}
    }
    this.model=await this.createCPU();await this.model.load();this.backend='CPU';
  }
  async analyze(samples) {
    try {return await this.model.analyze(samples);}
    catch(error) {
      if(this.backend!=='WebGPU' || ['invalidAudio','insufficientAudio','invalidScore','modelBusy'].includes(error.code))throw error;
      try{await this.model.dispose();}catch{/* Device may already be lost. */}
      this.model=await this.createCPU();this.backend='CPU';await this.model.load();
      return await this.model.analyze(samples);
    }
  }
}
