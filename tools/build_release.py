"""Build allowlisted V4 Beta archives; never include private audio/analysis or environments."""
import hashlib,json
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/'package.json').read_text())['version']
OUT=ROOT/'dist';OUT.mkdir(exist_ok=True)
RUNTIME={'ort.wasm.min.mjs','ort.webgpu.min.mjs','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm',
 'ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm',
 'ort-wasm-simd-threaded.asyncify.mjs','ort-wasm-simd-threaded.asyncify.wasm','ONNX-RUNTIME-LICENSE.txt'}
MODELS={'artifactnet_v94_zero_guard.onnx','artifactnet_v94_full.onnx.data','MODEL-CARD.md'}
for folder,names in [('vendor',RUNTIME),('models',MODELS)]:
    for name in names:
        p=ROOT/'extension'/folder/name
        if not p.is_file() or p.stat().st_size==0:raise SystemExit('Missing packaged asset: '+str(p))
extension=[]
for p in (ROOT/'extension').rglob('*'):
    if not p.is_file():continue
    rel=p.relative_to(ROOT/'extension')
    if rel.parts[0]=='vendor' and p.name not in RUNTIME:continue
    if rel.parts[0]=='models' and p.name not in MODELS:continue
    if p.suffix not in {'.js','.mjs','.css','.html','.json','.wasm','.onnx','.data','.md','.txt'}:continue
    extension.append(p)
manifest=json.loads((ROOT/'extension/manifest.json').read_text())
if manifest['host_permissions']!=['https://music.youtube.com/*']:raise SystemExit('Unexpected host permission')
public=[ROOT/name for name in ['README.md','README.tr.md','PRIVACY.md','THIRD_PARTY_NOTICES.md','CHROMEWEBSTORE.md','package.json','package-lock.json','.gitignore']]
public.extend([ROOT/'docs/KNOWN-LIMITATIONS.md', ROOT/'docs/VALIDATION.md'])
for folder,suffixes in [('core',{'.mjs'}),('backend',{'.py','.sql'}),('tests',{'.mjs','.py','.json'}),('.github',{'.yml'})]:
    public.extend(p for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in suffixes and '__pycache__' not in p.parts)
public.extend(ROOT/'tools'/name for name in ['build_release.py','prepare_runtime.py','check_wasm.mjs','export_catalog.py'])
user_files=extension+[ROOT/name for name in ['README.md','README.tr.md','PRIVACY.md','THIRD_PARTY_NOTICES.md']]+[ROOT/'docs/KNOWN-LIMITATIONS.md']
optional_analysis=[ROOT/'tools/audio_analysis.py',ROOT/'tools/audio-analysis-requirements.txt',ROOT/'docs/AUDIO-ANALYSIS.md']
user_files+=optional_analysis
public+=optional_analysis
launchers=[ROOT/name for name in ['START.html','START-Windows.cmd','START-macOS.command']]
public+=launchers
artifacts=[]
for suffix,members in [('serverless',user_files+launchers),('Windows',user_files+[ROOT/'START.html',ROOT/'START-Windows.cmd']),('macOS',user_files+[ROOT/'START.html',ROOT/'START-macOS.command']),('source',extension+public)]:
    name=f'ytm-ai-blocker-{VERSION}-{suffix}.zip';target=OUT/name
    with ZipFile(target,'w',ZIP_DEFLATED) as archive:
        for p in sorted(set(members)):
            if not p.is_file():raise SystemExit('Missing public file: '+str(p))
            archive.write(p,str(Path('ytm-ai-blocker-'+VERSION)/p.relative_to(ROOT)))
    artifacts.append({'file':name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size})
(OUT/'SHA256SUMS.json').write_text(json.dumps(artifacts,indent=2)+'\n')
print(json.dumps(artifacts,indent=2))
