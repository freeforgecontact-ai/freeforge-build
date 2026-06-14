@echo off
cd /d "%~dp0"
py -m pip install -q yt-dlp 2>nul || python -m pip install -q yt-dlp 2>nul
py server.py 2>nul || python server.py
pause
