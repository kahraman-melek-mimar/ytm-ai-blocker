"""Exploratory DSP measurements, not a watermark decoder or AI classifier.
Requires numpy and ffmpeg/ffprobe. Run from any cwd. All processing is local.
"""
from pathlib import Path
import argparse, hashlib, json, subprocess, shutil, sys
import numpy as np
SR=44100
BANDS=[(100,1000),(1000,4000),(4000,8000),(8000,16000),(16000,20000)]

def db(v): return float(10*np.log10(max(float(v),1e-30)))

def modulation(audio):
    # Rectangular RMS integration at 1000 Hz; removes carrier, preserves 50 Hz AM.
    # 44 samples gives 1002.27 Hz envelope sampling, used explicitly below.
    block=44; n=len(audio)//block
    env=np.sqrt(np.mean(audio[:n*block].reshape(n,block)**2,axis=1))
    env-=env.mean(); power=np.abs(np.fft.rfft(env*np.hanning(n)))**2
    f=np.fft.rfftfreq(n,block/SR)
    target=(f>=49)&(f<=51); neighbors=((f>=40)&(f<48))|((f>52)&(f<=60))
    if power.sum()<1e-20:return {'peakHz':None,'contrastDb':None}
    idx=np.flatnonzero(target)[np.argmax(power[target])]
    return {'peakHz':float(f[idx]),'contrastDb':db(power[idx]/max(float(np.median(power[neighbors])),1e-30))}

def measure(stereo):
    mono=stereo.mean(axis=1).astype(np.float64)
    nfft=8192; hop=2048
    frames=np.lib.stride_tricks.sliding_window_view(stereo,nfft,axis=0)[::hop]
    z=np.fft.rfft(frames*np.hanning(nfft),axis=-1)
    p=np.mean(np.abs(z)**2,axis=(0,1)); f=np.fft.rfftfreq(nfft,1/SR)
    total=max(float(p.sum()),1e-30)
    # Mean of channel power avoids destructive L/R downmix cancellation.
    smooth=np.convolve(p,np.ones(93)/93,mode='same') # approximately 500 Hz
    anchors={str(hz):db(np.mean(smooth[np.abs(f-hz)<=125])/max(float(smooth.max()),1e-30)) for hz in [8000,14000,15000,16000,18000,19000,20000]}
    cross=np.mean(z[:,0]*np.conj(z[:,1]),axis=0)
    pl=np.mean(np.abs(z[:,0])**2,axis=0); pr=np.mean(np.abs(z[:,1])**2,axis=0)
    coherence=np.clip(np.abs(cross)**2/np.maximum(pl*pr,1e-30),0,1)
    band_rows=[]
    for lo,hi in BANDS:
        mask=(f>=lo)&(f<hi); weights=p[mask]
        band_rows.append({'lowHz':lo,'highHz':hi,'energyPercent':float(weights.sum()/total*100),
            'weightedCoherence':float(np.sum(coherence[mask]*weights)/max(float(weights.sum()),1e-30)),
            'crossPhaseConcentration':float(abs(np.sum(cross[mask]))/max(float(np.sum(abs(cross[mask]))),1e-30))})
    high=(f>=19000)&(f<=20000)
    pd=10*np.log10(np.maximum(p,1e-30))
    baseline=np.median(np.lib.stride_tricks.sliding_window_view(np.pad(pd,46,mode='reflect'),93),axis=-1)
    residual=pd-baseline
    indices=np.flatnonzero(high & (p/total>1e-12))
    peak=int(indices[np.argmax(residual[indices])]) if len(indices) else None
    return {'rmsDbfs':db(np.mean(stereo.astype(np.float64)**2)),
        'rolloff99Hz':float(f[min(np.searchsorted(np.cumsum(p)/total,.99),len(f)-1)]),
        'energy8to16kPercent':float(p[(f>=8000)&(f<16000)].sum()/total*100),
        'energy19to20kPercent':float(p[high].sum()/total*100),
        'spectralAnchorsRelativeDb':anchors,'bands':band_rows,'modulation50':modulation(mono),
        'highBandPeak':None if peak is None else {'hz':float(f[peak]),'localProminenceDb':float(residual[peak])}}, f,p/total

def self_test():
    t=np.arange(SR*4)/SR
    carrier=np.sin(2*np.pi*1000*t)
    am=carrier*(1+.5*np.sin(2*np.pi*50*t))
    result=modulation(am)
    assert abs(result['peakHz']-50)<.5 and result['contrastDb']>20,result
    same,_,_=measure(np.column_stack([carrier,carrier]))
    opposite,_,_=measure(np.column_stack([carrier,-carrier]))
    assert same['bands'][0]['weightedCoherence']>.99
    assert abs(same['rmsDbfs']-opposite['rmsDbfs'])<1e-6
    zero,_,_=measure(np.zeros((SR,2)))
    assert zero['modulation50']['peakHz'] is None
    print('Synthetic AM, channel cancellation and silence checks passed',flush=True)

def main():
    parser=argparse.ArgumentParser(description="Local exploratory audio measurements; not an AI verdict or watermark decoder.")
    parser.add_argument('files',nargs='*',type=Path)
    parser.add_argument('--output',type=Path,default=Path('audio-analysis-results'))
    parser.add_argument('--self-test',action='store_true')
    args=parser.parse_args()
    if args.self_test:
        self_test()
        if not args.files:return
    if not args.files:parser.error('Select at least one audio file, or use --self-test')
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):parser.error('FFmpeg and ffprobe must be installed and available on PATH')
    args.output.mkdir(parents=True,exist_ok=True)
    reports=[]; errors=[]
    for path in args.files:
        try:
            path=path.resolve(strict=True)
            probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],stderr=subprocess.PIPE))
            stream=next(s for s in probe['streams'] if s['codec_type']=='audio')
            duration=float(probe['format'].get('duration') or stream.get('duration') or 0)
            if duration<.5:raise ValueError('Audio must have a known duration of at least 0.5 seconds')
            native_rate=int(stream['sample_rate']); segment=min(20,duration)
            starts=sorted(set(round(max(0,(duration-segment)*fraction),3) for fraction in [.1,.25,.4,.55,.7,.85]))
            windows=[]
            for start in starts:
                raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',str(path),'-t',str(segment),'-ac','2','-ar',str(SR),'-f','f32le','pipe:1'],stderr=subprocess.PIPE)
                stereo=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
                if len(stereo)<8192:raise ValueError('Decoded window too short')
                result,_,_=measure(stereo);result['startSeconds']=start;result['seconds']=len(stereo)/SR;windows.append(result)
            checksum=hashlib.sha256()
            with path.open('rb') as handle:
                for chunk in iter(lambda:handle.read(1024*1024),b''):checksum.update(chunk)
            reports.append({'file':path.name,'sha256':checksum.hexdigest(),'originalSampleRate':native_rate,'analysisSampleRate':SR,'durationSeconds':duration,
                'codec':stream.get('codec_name'),'metadata':probe['format'].get('tags',{}),
                'caveats':['No AI verdict; no Suno/SynthID/AudioSeal decoding; no C2PA signature validation.',
                    'Resampling cannot restore missing frequencies; compression and mastering affect these measurements.',
                    '50 Hz contrast uses the strongest bin in 49–51 Hz against neighboring median power; peak selection creates a positive baseline.',
                    'Phase measures describe the mix; they do not measure vocal formants.'],
                'highBandWithinOriginalNyquist':native_rate>=40000,'windows':windows})
            print(path.name+': analyzed',flush=True)
        except (OSError,ValueError,KeyError,StopIteration,subprocess.CalledProcessError) as exc:
            errors.append({'file':path.name,'error':str(exc)});print(path.name+': failed: '+str(exc),file=sys.stderr)
    report={'toolVersion':'4.0.6-beta.1','purpose':'Exploratory DSP, not an AI classifier','spectralFFTSize':8192,'spectralHop':2048,'reports':reports,'errors':errors}
    (args.output/'report.json').write_text(json.dumps(report,indent=2,allow_nan=False),encoding='utf-8')
    text=['# Ses analizi / Audio analysis','', 'Deneysel ölçümler; YZ kararı veya dijital imza doğrulaması değildir. / Exploratory measurements, not an AI verdict or watermark verification.','',
        '| File | 99% energy below Hz | 8–16 kHz energy % | 19–20 kHz energy % | 50 Hz contrast dB |','|---|---:|---:|---:|---:|']
    for row in reports:
        ws=row['windows'];med=lambda key:float(np.median([w[key] for w in ws]))
        contrasts=[w['modulation50']['contrastDb'] for w in ws if w['modulation50']['contrastDb'] is not None]
        contrast=f'{float(np.median(contrasts)):.2f}' if contrasts else 'N/A'
        text.append(f"| {row['file'].replace('|','/')} | {med('rolloff99Hz'):.0f} | {med('energy8to16kPercent'):.4f} | {med('energy19to20kPercent'):.3g} | {contrast} |")
    text+=['','Rolloff99 is cumulative energy, not an estimated brickwall cutoff. See report.json for per-band coherence, phase concentration, spectral anchors and individual windows.',
       'No vocal separation or F1/F2 tracking is performed. No audio is uploaded. Labels and metadata text are not cryptographically verified.']
    if errors:text+=['','Errors:']+[f"- {e['file']}: {e['error']}" for e in errors]
    (args.output/'REPORT.md').write_text('\n'.join(text)+'\n',encoding='utf-8')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
