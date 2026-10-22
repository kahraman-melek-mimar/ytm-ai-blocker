"""Build explicit-allowlist archives: no model, environment, private settings or unrelated projects."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'extension/manifest.json').read_text())['version']
OUTPUT = ROOT / 'dist'
OUTPUT.mkdir(exist_ok=True)
(ROOT / 'extension/panel-style.js').write_text('globalThis.YTMPanelCSS = ' + json.dumps((ROOT / 'extension/panel.css').read_text()) + ';\n')

files = []
for name in ['README.md', 'README.tr.md', 'THIRD_PARTY_NOTICES.md', 'PROVENANCE-ARASTIRMA.md',
             'CHROMEWEBSTORE.md', 'TEST-SONUCLARI.md', 'package.json', '.gitignore',
             'Start.command', 'Install.command', 'Başlat.command', 'Kurulum.command']:
    files.append(ROOT / name)
for folder, suffixes in [('extension', {'.js', '.mjs', '.json', '.html', '.css'}),
                         ('server', {'.py', '.txt'}), ('tests', {'.py', '.mjs'}),
                         ('docs', {'.jpg', '.md'}), ('.github', {'.yml'})]:
    for file in (ROOT / folder).rglob('*'):
        if file.is_file() and file.suffix in suffixes and 'models' not in file.parts and '__pycache__' not in file.parts:
            files.append(file)
files.append(ROOT / 'tools/build_release.py')
artifacts = []
for name, members, prefix in [(f'ytm-ai-blocker-{VERSION}-source.zip', files, 'ytm-ai-blocker'),
                              (f'ytm-ai-blocker-{VERSION}-extension.zip', [p for p in files if p.is_relative_to(ROOT / 'extension')], '')]:
    path = OUTPUT / name
    with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
        for file in sorted(set(members)):
            relative = file.relative_to(ROOT / 'extension' if not prefix else ROOT)
            archive.write(file, str(Path(prefix) / relative))
    artifacts.append({'file': name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
(OUTPUT / 'SHA256SUMS.json').write_text(json.dumps(artifacts, indent=2) + '\n')
print('Built ' + ', '.join(item['file'] for item in artifacts))
