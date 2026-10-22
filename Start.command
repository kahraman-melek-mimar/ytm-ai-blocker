#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if [[ ! -x .venv/bin/python ]]; then
  echo 'Run Install.command first.'
  read '?Press Enter to close…'
  exit 1
fi
.venv/bin/python server/server.py
