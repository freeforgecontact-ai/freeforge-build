#!/usr/bin/env python3
"""VibeLocal PC — petit serveur local (yt-dlp) qui sert l'interface VibeLocal.
100% local : tourne sur TON ordinateur (Windows / macOS / Linux), aucune donnee
envoyee ailleurs. Ouvre http://127.0.0.1:8777 dans ton navigateur.

Dependances : yt-dlp  (pip install yt-dlp)
"""
import http.server
import json
import os
import re
import socket
import socketserver
import sys
import urllib.parse
import webbrowser

try:
    from yt_dlp import YoutubeDL
except Exception:
    print("\n[VibeLocal] yt-dlp manquant. Installe-le :  pip install yt-dlp\n")
    raise

if getattr(sys, "frozen", False):
    BASE = os.path.dirname(sys.executable)
    RES = sys._MEIPASS
else:
    BASE = os.path.dirname(os.path.abspath(__file__))
    RES = BASE
DL = os.path.join(BASE, "downloads")
os.makedirs(DL, exist_ok=True)
LIB = os.path.join(DL, "library.json")
PORT = int(os.environ.get("VIBELOCAL_PORT", "8777"))


def ydl_opts(**kw):
    o = {"quiet": True, "no_warnings": True,
         "extractor_args": {"youtube": {"player_client": ["android", "web"]}}}
    ck = os.path.join(BASE, "cookies.txt")
    if os.path.exists(ck):
        o["cookiefile"] = ck
    o.update(kw)
    return o


def fmt_dur(s):
    s = int(s or 0)
    return f"{s // 60}:{s % 60:02d}" if s else ""


def thumb_of(e):
    t = e.get("thumbnail")
    if t:
        return t
    ths = e.get("thumbnails") or []
    if ths:
        return ths[-1].get("url", "")
    vid = e.get("id")
    return f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg" if vid else ""


def item(e):
    return {"id": e.get("id"), "title": e.get("title") or "",
            "author": e.get("uploader") or e.get("channel") or "",
            "seconds": e.get("duration") or 0, "duration": fmt_dur(e.get("duration")),
            "thumbnail": thumb_of(e)}


def search(q, n=25):
    q = (q or "").strip()
    if not q:
        return []
    with YoutubeDL(ydl_opts(extract_flat=True)) as y:
        info = y.extract_info(f"ytsearch{n}:{q}", download=False)
    return [item(e) for e in (info.get("entries") or []) if e and e.get("id")]


def resolve(vid):
    with YoutubeDL(ydl_opts()) as y:
        info = y.extract_info(f"https://www.youtube.com/watch?v={vid}", download=False)
    auds = [f for f in info.get("formats", []) if f.get("acodec") not in (None, "none")
            and f.get("vcodec") in (None, "none") and f.get("url")]
    auds.sort(key=lambda f: (f.get("abr") or 0))
    url = auds[-1]["url"] if auds else info.get("url")
    rel = []
    try:
        with YoutubeDL(ydl_opts(extract_flat=True)) as y2:
            mix = y2.extract_info(f"https://www.youtube.com/watch?v={vid}&list=RD{vid}", download=False)
        seen = {vid}
        for e in (mix.get("entries") or []):
            eid = e.get("id") if e else None
            dur = e.get("duration") or 0
            if eid and eid not in seen and 90 <= dur <= 600:
                seen.add(eid)
                rel.append(item(e))
            if len(rel) >= 20:
                break
    except Exception:
        pass
    if not rel:
        rel = [r for r in search(info.get("title") or "", 14) if r["id"] != vid][:12]
    o = item(info)
    o["streamUrl"] = url
    o["related"] = rel
    return o


def lib_read():
    try:
        return json.load(open(LIB, encoding="utf-8"))
    except Exception:
        return []


def lib_write(x):
    json.dump(x, open(LIB, "w", encoding="utf-8"))


def do_download(p):
    vid = p["id"]
    out = os.path.join(DL, f"{vid}.m4a")
    with YoutubeDL(ydl_opts(format="bestaudio[ext=m4a]/bestaudio/best",
                            outtmpl=os.path.join(DL, f"{vid}.%(ext)s"))) as y:
        y.download([f"https://www.youtube.com/watch?v={vid}"])
    if not os.path.exists(out):
        for f in os.listdir(DL):
            if f.startswith(vid + ".") and not f.endswith(".json"):
                os.replace(os.path.join(DL, f), out)
                break
    lib = lib_read()
    if not any(s["id"] == vid for s in lib):
        lib.append({"id": vid, "title": p.get("title", ""), "author": p.get("author", ""),
                    "thumbnail": p.get("thumbnail", ""), "duration": p.get("duration", ""), "local": True})
        lib_write(lib)
    return {"id": vid, "ok": True}


def do_remove(p):
    vid = p["id"]
    try:
        os.remove(os.path.join(DL, f"{vid}.m4a"))
    except OSError:
        pass
    lib = [s for s in lib_read() if s["id"] != vid]
    lib_write(lib)
    return lib


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, obj, code=200):
        b = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _err(self, msg, code=500):
        self._json({"error": msg}, code)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        try:
            if u.path in ("/", "/index.html"):
                return self._file(os.path.join(RES, "webui.html"), "text/html; charset=utf-8")
            if u.path in ("/f0.woff2", "/f1.woff2"):
                return self._file(os.path.join(RES, u.path.lstrip("/")), "font/woff2")
            if u.path == "/api/search":
                return self._json(search(q.get("q", [""])[0]))
            if u.path == "/api/resolve":
                return self._json(resolve(q.get("id", [""])[0]))
            if u.path == "/api/library":
                return self._json(lib_read())
            if u.path.startswith("/media/"):
                return self._media(os.path.join(DL, os.path.basename(u.path)))
            self.send_error(404)
        except Exception as e:
            self._err(str(e))

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        ln = int(self.headers.get("Content-Length", "0") or "0")
        body = self.rfile.read(ln) if ln else b"{}"
        try:
            p = json.loads(body.decode("utf-8") or "{}")
            if u.path == "/api/download":
                return self._json(do_download(p))
            if u.path == "/api/remove":
                return self._json(do_remove(p))
            self.send_error(404)
        except Exception as e:
            self._err(str(e))

    def _file(self, path, ctype):
        if not os.path.exists(path):
            return self.send_error(404)
        data = open(path, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _media(self, path):
        if not os.path.isfile(path):
            return self.send_error(404)
        size = os.path.getsize(path)
        rng = self.headers.get("Range")
        start, end = 0, size - 1
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            if m:
                if m.group(1):
                    start = int(m.group(1))
                if m.group(2):
                    end = int(m.group(2))
        length = end - start + 1
        self.send_response(206 if rng else 200)
        self.send_header("Content-Type", "audio/mp4")
        self.send_header("Accept-Ranges", "bytes")
        if rng:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.end_headers()
        with open(path, "rb") as f:
            f.seek(start)
            self.wfile.write(f.read(length))


class Threaded(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    srv = Threaded(("0.0.0.0", PORT), H)
    url = f"http://127.0.0.1:{PORT}"
    print("=" * 52)
    print("  VibeLocal PC est lance !")
    print(f"  Sur cet ordinateur : {url}")
    print(f"  Sur ton telephone (meme Wi-Fi) : http://{lan_ip()}:{PORT}")
    print("  (Laisse cette fenetre ouverte. Ferme-la pour arreter.)")
    print("=" * 52)
    if not os.environ.get("VIBELOCAL_NOBROWSER"):
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
