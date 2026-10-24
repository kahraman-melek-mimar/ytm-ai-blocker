import {BrowserModel} from './browser-model.mjs';
import {ModelEngine} from './model-engine.mjs';
let model;
async function create(backend) {
  const ort=backend==='WebGPU' ? await import('./vendor/ort.webgpu.min.mjs') : await import('./vendor/ort.wasm.min.mjs');
  ort.env.wasm.wasmPaths=new URL('./vendor/',import.meta.url).href;
  return new BrowserModel(ort,{modelUrl:new URL('./models/artifactnet_v94_zero_guard.onnx',import.meta.url).href,
    weightsUrl:new URL('./models/artifactnet_v94_full.onnx.data',import.meta.url).href,
    executionProviders:backend==='WebGPU'?['webgpu','wasm']:['wasm']});
}
self.onmessage=async({data})=>{
  const {id,type,samples}=data;
  try {
    if(type==='INIT') {
      model=new ModelEngine({hasGPU:async()=>{try{return Boolean(await navigator.gpu?.requestAdapter());}catch{return false;}},
        createGPU:()=>create('WebGPU'),createCPU:()=>create('CPU')});
      await model.load();self.postMessage({id,ok:true,backend:model.backend});
    }else if(type==='ANALYZE') {
      if(!model)throw new Error('Model not initialized');
      const start=performance.now();const probability=await model.analyze(samples);
      self.postMessage({id,ok:true,probability,backend:model.backend,inferenceMs:Math.round(performance.now()-start)});
    }else throw new Error('Unknown model request');
  }catch(error){self.postMessage({id,ok:false,error:error.message,code:error.code || 'modelFailure'});}
};
