#!/usr/bin/env bash
cd "$(dirname "$0")"; python3 -m pip install -q yt-dlp 2>/dev/null; python3 server.py
