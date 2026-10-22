from pathlib import Path
from huggingface_hub import snapshot_download

# Keep the graph and its external weights from the same revision.
snapshot_download(repo_id='intrect/artifactnet', revision='e915f0d',
                  allow_patterns=['artifactnet_v94_full.onnx', 'artifactnet_v94_full.onnx.data', 'README.md'],
                  local_dir=Path(__file__).parent / 'models')
print('Model indirildi. Başlat.command ile sunucuyu açabilirsiniz.')
