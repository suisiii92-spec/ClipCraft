import glob, hashlib, os, re, shutil, subprocess, tempfile, threading, time, uuid
from flask import Flask, request, send_file, send_from_directory, jsonify
from flask_cors import CORS
import yt_dlp
import analysis

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "..", "dist")
COOKIES = os.path.join(HERE, "cookies.txt")     # optional: helps when YouTube blocks cloud servers
WORK = os.path.join(tempfile.gettempdir(), "clipcraft")
os.makedirs(WORK, exist_ok=True)

app = Flask(__name__, static_folder=DIST, static_url_path="")
CORS(app)

RATIOS = {"9:16": (9, 16), "1:1": (1, 1), "4:5": (4, 5), "16:9": (16, 9)}
SOURCES = {}          # id -> {"kind", "url"|"path", "sig", "w", "h"}
LOCKS = {}
LOCKS_GUARD = threading.Lock()


def purge_old():
    now = time.time()
    for f in glob.glob(os.path.join(WORK, "*")):
        try:
            if now - os.path.getmtime(f) > 86400:
                os.remove(f) if os.path.isfile(f) else shutil.rmtree(f)
        except OSError:
            pass


purge_old()


def clean(e):
    return re.sub(r"\x1b\[[0-9;]*m", "", str(e)).strip()[:300]


def ydl_base():
    # YouTube needs a JS runtime (node/deno) + yt-dlp-ejs to expose 1080p/2K/4K formats.
    o = {"quiet": True, "noplaylist": True, "js_runtimes": {"node": {}, "deno": {}}}
    if os.path.exists(COOKIES):
        o["cookiefile"] = COOKIES
    return o


def youtube_info(url, sid):
    opts = {**ydl_base(), "format": "worstaudio/worst", "outtmpl": os.path.join(WORK, f"{sid}.%(ext)s")}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
    path = glob.glob(os.path.join(WORK, f"{sid}.*"))[0]
    try:
        levels = analysis.audio_levels(path)
    finally:
        os.remove(path)
    fm = [f for f in info.get("formats", []) if f.get("vcodec") not in (None, "none") and f.get("width") and f.get("height")]
    best = max(fm, key=lambda f: min(f["width"], f["height"])) if fm else None
    w, h = (best["width"], best["height"]) if best else (1280, 720)
    return analysis.build_signal(levels, info.get("heatmap")), w, h


def probe_size(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    w, h = out.strip().split(",")[:2]
    return int(w), int(h)


def plan(src, duration, count):
    return analysis.pick_clips(src["sig"], count=max(1, min(12, count)), fixed=duration)


@app.get("/")
def index():
    return send_from_directory(DIST, "index.html")


@app.get("/api/health")
def health():
    return jsonify(ok=True)


@app.post("/api/analyze")
def analyze():
    try:
        duration = int(request.form.get("duration", 0))
        count = int(request.form.get("count", 3))
        sid = uuid.uuid4().hex[:12]
        if "file" in request.files:
            f = request.files["file"]
            path = os.path.join(WORK, sid + (os.path.splitext(f.filename or "")[1] or ".mp4"))
            f.save(path)
            w, h = probe_size(path)
            sig = analysis.build_signal(analysis.audio_levels(path))
            SOURCES[sid] = {"kind": "local", "path": path, "sig": sig, "w": w, "h": h}
        else:
            url = request.form["url"]
            sig, w, h = youtube_info(url, sid)
            SOURCES[sid] = {"kind": "youtube", "url": url, "sig": sig, "w": w, "h": h}
        if not SOURCES[sid]["sig"]:
            return jsonify(error="No audio track found to analyze."), 400
        return jsonify(id=sid, width=w, height=h, clips=plan(SOURCES[sid], duration, count))
    except Exception as e:
        return jsonify(error=clean(e)), 500


@app.get("/api/plan")
def get_plan():
    src = SOURCES.get(request.args.get("id", ""))
    if not src:
        return jsonify(error="Session expired. Process the video again."), 404
    return jsonify(clips=plan(src, int(request.args.get("duration", 0)), int(request.args.get("count", 3))))


def target_size(ratio, q):
    w, h = RATIOS.get(ratio, (9, 16))
    W, H = (q, q * h / w) if w <= h else (q * w / h, q)       # quality = short side (1080p -> 1080x1920)
    even = lambda x: int(round(x / 2)) * 2
    return even(W), even(H)


def make_clip(sid, src, start, end, ratio, quality, preview, fit):
    q = max(240, min(480 if preview else quality, min(src["w"], src["h"])))
    W, H = target_size(ratio, q)
    key = hashlib.sha1(f"{sid}|{start}|{end}|{ratio}|{q}|{preview}|{fit}".encode()).hexdigest()[:16]
    out = os.path.join(WORK, f"{key}.mp4")
    with LOCKS_GUARD:
        lock = LOCKS.setdefault(key, threading.Lock())
    with lock:
        if os.path.exists(out):
            return out
        rw, rh = RATIOS.get(ratio, (9, 16))
        if fit:   # whole frame, sharp, on a blurred background
            vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                  f"scale=iw/8:ih/8,boxblur=4:2,scale={W}:{H}[bg];"
                  f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease:flags=lanczos[fg];"
                  f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1")
        else:     # fill: centre crop
            vf = (f"crop=w='min(iw,ih*{rw}/{rh})':h='min(ih,iw*{rh}/{rw})',"
                  f"scale={W}:{H}:flags=lanczos,setsar=1")
        enc = ["-c:v", "libx264", "-preset", "ultrafast" if preview else "veryfast",
               "-crf", "28" if preview else "20", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart"]
        tmp_out = out + ".part.mp4"
        raw = None
        try:
            if src["kind"] == "local":
                cmd = ["ffmpeg", "-y", "-ss", str(start), "-i", src["path"], "-t", str(end - start),
                       "-vf", vf, *enc, tmp_out]
            else:
                raw = os.path.join(WORK, f"{key}_raw.mp4")
                k = "width" if src["h"] > src["w"] else "height"
                with yt_dlp.YoutubeDL({
                    **ydl_base(),
                    "format": f"bv*[{k}<={q}]+ba/b[{k}<={q}]/bv*+ba/b",
                    "merge_output_format": "mp4", "outtmpl": raw,
                    "download_ranges": yt_dlp.utils.download_range_func(None, [(start, end)]),
                    "force_keyframes_at_cuts": True,
                }) as ydl:
                    ydl.download([src["url"]])
                cmd = ["ffmpeg", "-y", "-i", raw, "-vf", vf, *enc, tmp_out]
            subprocess.run(cmd, check=True, capture_output=True)
            os.replace(tmp_out, out)
        finally:
            if raw and os.path.exists(raw):
                os.remove(raw)
    return out


@app.get("/api/clip")
def clip():
    try:
        sid = request.args["id"]
        src = SOURCES.get(sid)
        if not src:
            return jsonify(error="Session expired. Process the video again."), 404
        start = max(0, int(request.args["start"]))
        end = min(start + 120, int(request.args["end"]))
        if end <= start:
            return jsonify(error="Invalid time range"), 400
        preview = request.args.get("preview") == "1"
        out = make_clip(sid, src, start, end, request.args.get("ratio", "9:16"),
                        int(request.args.get("quality", 720)), preview, request.args.get("fit") == "1")
        return send_file(out, mimetype="video/mp4", as_attachment=not preview,
                         download_name=f"clip-{start}-{end}.mp4")
    except subprocess.CalledProcessError as e:
        return jsonify(error="ffmpeg failed: " + clean(e.stderr.decode(errors="ignore")[-200:])), 500
    except Exception as e:
        return jsonify(error=clean(e)), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), threaded=True)
