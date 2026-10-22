"""Offline diagnostic only: local audio -> rolling model scores. Does not upload audio."""
import argparse
import json
import subprocess
import time
from pathlib import Path
import numpy as np
import onnxruntime as ort

parser = argparse.ArgumentParser()
parser.add_argument('audio', nargs='+')
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
model = ort.InferenceSession(str(root/'server/models/artifactnet_v94_full.onnx'), sess_options=options, providers=['CPUExecutionProvider'])
reports = []
for name in args.audio:
    audio = np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',name,'-af','pan=mono|c0=0.5*c0+0.5*c1','-f','f32le','-ar','44100','pipe:1']), dtype='<f4')
    scores = []
    for start in range(0, len(audio) - 176400 + 1, 44100):
        chunk = audio[start:start+176400].reshape(1,-1)
        started = time.monotonic()
        score = float(np.asarray(model.run(None, {'audio': chunk})[0]).reshape(-1)[0])
        score = score if np.isfinite(score) and 0 <= score <= 1 else None
        scores.append({'start':start/44100,'end':start/44100+4,'score':score,'inference_seconds':round(time.monotonic()-started,3)})
    independent = [row['score'] for row in scores[::4] if row['score'] is not None]
    longest = 0; since = None
    for row in scores:
        if row['score'] is None or row['score'] < .8: since = None
        elif since is None and row['score'] > .8: since = row['end']
        if since is not None: longest=max(longest,row['end']-since)
    report = {'id':Path(name).stem,'sample_seconds':len(audio)/44100,'windows':scores,
      'independent_median':float(np.median(independent)) if independent else None,
      'maximum':max((row['score'] for row in scores if row['score'] is not None),default=None),
      'high_score_duration_seconds':longest,'would_skip_under_current_rule':longest>=5}
    reports.append(report)
    Path(args.output).write_text(json.dumps(reports,indent=2,allow_nan=False))
    print(json.dumps({k:v for k,v in report.items() if k!='windows'}),flush=True)
