#!/usr/bin/env bash
cd "$(dirname "$0")"
[ -f server.pid ] && kill "$(cat server.pid)" 2>/dev/null && rm -f server.pid
[ -f tunnel.pid ] && kill "$(cat tunnel.pid)" 2>/dev/null && rm -f tunnel.pid
command -v termux-wake-unlock >/dev/null && termux-wake-unlock
echo "Server bondho."
