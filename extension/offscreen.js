let stream,context,source,collector,sink,epoch,worker,ready;
let active=false,pending=false,queued=null;
let nextId=0;
const requests=new Map();
function report(data){return chrome.runtime.sendMessage({type:'RESULT',...data}).catch(()=>{});}
function failRequests(error){for(const entry of requests.values()){clearTimeout(entry.timer);entry.reject(error);}requests.clear();}
function rpc(type,data={}) {
  const id=++nextId;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      const error=Object.assign(new Error('Bundled model timed out'),{code:'timeout'});
      failRequests(error);worker?.terminate();worker=null;ready=Promise.resolve(false);
    },30000);
    requests.set(id,{resolve,reject,timer});
    try {worker.postMessage({id,type,...data},data.samples?[data.samples.buffer]:[]);}
    catch(error){clearTimeout(timer);requests.delete(id);reject(error);}
  });
}
function initializeModel(){
  worker=new Worker(chrome.runtime.getURL('model-worker.mjs'),{type:'module'});
  worker.onmessage=({data})=>{
    const request=requests.get(data.id);if(!request)return;
    clearTimeout(request.timer);requests.delete(data.id);
    if(data.ok)request.resolve(data);
    else request.reject(Object.assign(new Error(data.error),{code:data.code}));
  };
  worker.onerror=event=>{
    failRequests(Object.assign(new Error(event.message || 'Model worker failed'),{code:'modelFailure'}));
    worker?.terminate();worker=null;ready=Promise.resolve(false);
  };
  return rpc('INIT').catch(error=>{
    if(active)report({epoch,error:error.message,errorCode:error.code || 'modelFailure'});
    return false;
  });
}
async function stop(){
  active=false;epoch=null;queued=null;
  if(stream)for(const track of stream.getTracks()){track.onended=null;track.stop();}
  stream=null;
  worker?.terminate();worker=null;failRequests(new Error('Capture stopped'));ready=null;
  if(context)await context.close();context=null;
}
async function analyze(data){
  if(!active || data.epoch!==epoch)return;
  // At most one queued window; a slow machine cannot accumulate audio indefinitely.
  if(pending){queued=data;return;}
  pending=true;
  const requestEpoch=data.epoch;
  try {
    const loaded=await ready;
    if(!loaded)throw Object.assign(new Error('Bundled model could not load'),{code:'modelFailure'});
    if(!active || requestEpoch!==epoch)return;
    const windowStart=data.sampleTime-data.samples.length/44100*1000;
    const result=await rpc('ANALYZE',{samples:data.samples});
    if(active && requestEpoch===epoch)await report({epoch:requestEpoch,probability:result.probability,
      inferenceMs:result.inferenceMs,backend:result.backend,sampleTime:data.sampleTime,windowStart,seconds:data.seconds});
  } catch(error){
    if(active && requestEpoch===epoch)await report({epoch:requestEpoch,error:error.message,errorCode:error.code || 'modelFailure'});
  } finally {
    pending=false;const next=queued;queued=null;
    if(next && active && next.epoch===epoch)analyze(next);
  }
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message.target!=='audio')return;
  (async()=>{
    if(message.type==='START'){
      await stop();
      stream=await navigator.mediaDevices.getUserMedia({audio:{mandatory:{chromeMediaSource:'tab',chromeMediaSourceId:message.streamId}},video:false});
      stream.getAudioTracks()[0].onended=()=>chrome.runtime.sendMessage({type:'CAPTURE_ENDED'}).catch(()=>{});
      context=new AudioContext({sampleRate:44100});
      if(context.sampleRate!==44100)throw new Error('44100 Hz audio context unavailable');
      await context.audioWorklet.addModule('pcm-worklet.js');
      source=context.createMediaStreamSource(stream);source.connect(context.destination);
      collector=new AudioWorkletNode(context,'pcm-collector',{channelCountMode:'max',channelInterpretation:'discrete'});
      collector.port.onmessage=({data})=>{
        if(data.type==='LEVELS')chrome.runtime.sendMessage(data).catch(()=>{});
        else if(data.samples){
          chrome.runtime.sendMessage({type:'PROGRESS',epoch:data.epoch,phase:'inference'}).catch(()=>{});analyze(data);
        }else chrome.runtime.sendMessage({type:'PROGRESS',epoch:data.epoch,phase:'collecting',percent:data.percent}).catch(()=>{});
      };
      sink=context.createGain();sink.gain.value=0;source.connect(collector).connect(sink).connect(context.destination);
      await context.resume();ready=initializeModel();
    }else if(message.type==='TRACK'){
      epoch=message.epoch;active=message.active;queued=null;collector?.port.postMessage({epoch,active});
    }else if(message.type==='STOP')await stop();
    reply({ok:true});
  })().catch(async error=>{await stop();reply({ok:false,error:`${error.name || 'Error'}: ${error.message}`});});
  return true;
});
