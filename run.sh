#!/usr/bin/env bash
# Server background e chalay (Termux er screen bondho korleo cholbe)
cd "$(dirname "$0")"
[ -f server.pid ] && kill "$(cat server.pid)" 2>/dev/null || true
command -v termux-wake-lock >/dev/null && termux-wake-lock
nohup python server/server.py > server.log 2>&1 &
echo $! > server.pid
sleep 2
echo "Server cholche. Chrome e kholo: http://localhost:8000"
echo "Bondho korte: bash stop.sh   |   log: server.log"
