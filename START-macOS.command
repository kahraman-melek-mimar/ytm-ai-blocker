#!/bin/zsh
# Opens the bundled guide and Chrome. Installs nothing and starts no server.
YTM_PACKAGE_DIR="$(cd -- "$(dirname -- "$0")" && pwd)" || exit 1
if [[ -d '/Applications/Google Chrome.app' || -d "$HOME/Applications/Google Chrome.app" ]]; then
  open -a 'Google Chrome' "$YTM_PACKAGE_DIR/START.html" 'chrome://extensions/' 'https://music.youtube.com/'
else
  open "$YTM_PACKAGE_DIR/START.html"
fi
