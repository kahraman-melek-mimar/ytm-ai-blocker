#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if [[ ! -x .venv/bin/python ]]; then
  echo 'Önce Kurulum.command dosyasını çalıştırın.'
  read '?Kapatmak için Enter…'
  exit 1
fi
.venv/bin/python server/server.py
