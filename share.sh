#!/usr/bin/env bash
# Poribarer jonno free internet link (Cloudflare Tunnel) + password. Termux e: bash share.sh
cd "$(dirname "$0")"
command -v cloudflared >/dev/null || pkg install -y cloudflared
read -rsp "Poribarer jonno ekta password thik koro (dekha jabe na): " PW; echo
[ -z "$PW" ] && { echo "Password dite hobe."; exit 1; }
export ACCESS_PASSWORD="$PW"
bash run.sh >/dev/null
[ -f tunnel.pid ] && kill "$(cat tunnel.pid)" 2>/dev/null || true
nohup cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
echo $! > tunnel.pid
echo "Link toiri hocche..."
URL=""
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1)
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then echo "Link pawa jayni. 'cat tunnel.log' dekho."; exit 1; fi
echo ""
echo "Poribarke eta pathao:  $URL"
echo "Name: je kono kichu (jemon family)   Password: tomar deya password"
echo "Link ta prottekbar share.sh chalale bodole jay. Bondho: bash stop.sh"
