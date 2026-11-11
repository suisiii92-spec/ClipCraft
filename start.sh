#!/usr/bin/env bash
# Termux e: bash start.sh  (install + build + background e server chalu)
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || pkg install -y nodejs
command -v python >/dev/null || pkg install -y python
command -v ffmpeg >/dev/null || pkg install -y ffmpeg
pip install -q -U -r requirements.txt
[ -d node_modules ] || npm install
npm run build
bash run.sh
