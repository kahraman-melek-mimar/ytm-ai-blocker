#!/bin/zsh
set -eu
cd -- "${0:A:h}"
python3 -m venv .venv
.venv/bin/python -m pip install -r server/requirements.txt
.venv/bin/python server/download_model.py
echo 'Setup complete. Open Start.command and keep its window open.'
read '?Press Enter to close…'
