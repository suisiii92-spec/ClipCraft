"""Viral-moment detection: audio loudness per second (+ YouTube 'most replayed' heatmap when available)."""
import math
import subprocess


def audio_levels(path):
    """RMS loudness (dB) for every second of audio, via ffmpeg."""
    cmd = [
        "ffmpeg", "-v", "quiet", "-i", path, "-vn", "-ac", "1", "-af",
        "aresample=8000,asetnsamples=n=8000:p=0,astats=metadata=1:reset=1,"
        "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
        "-f", "null", "-",
    ]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    vals = []
    for line in out.splitlines():
        if "RMS_level=" in line:
            raw = line.split("=", 1)[1].strip()
            try:
                v = float(raw)
            except ValueError:
                v = -90.0
            vals.append(max(-90.0, v) if math.isfinite(v) else -90.0)
    return vals


def _percentile(values, p):
    s = sorted(values)
    return s[min(len(s) - 1, int(p * (len(s) - 1)))]


def normalize(values):
    if not values:
        return []
    lo, hi = _percentile(values, 0.1), _percentile(values, 0.95)
    if hi - lo < 1e-6:
        return [0.5] * len(values)
    return [min(1.0, max(0.0, (x - lo) / (hi - lo))) for x in values]


def smooth(values, k):
    n = len(values)
    pre = [0.0]
    for x in values:
        pre.append(pre[-1] + x)
    h = k // 2
    out = []
    for i in range(n):
        a, b = max(0, i - h), min(n, i + h + 1)
        out.append((pre[b] - pre[a]) / (b - a))
    return out


def heat_to_seconds(heat, n):
    out = [0.0] * n
    for seg in heat:
        for t in range(int(seg["start_time"]), min(n, math.ceil(seg["end_time"]))):
            out[t] = seg["value"]
    return out


def build_signal(levels, heat=None):
    audio = normalize(smooth(levels, 3))
    if heat and audio:
        h = normalize(heat_to_seconds(heat, len(audio)))
        return [0.6 * h[i] + 0.4 * audio[i] for i in range(len(audio))]
    return audio


def _score(sig, s, e):
    mean = sum(sig[s:e]) / max(1, e - s)
    return int(round(100 * (0.5 + 0.49 * mean)))


def pick_clips(sig, count=3, fixed=0, lo=15, hi=60):
    """fixed=0 -> auto length (grow around each peak while it stays hot). Else best windows of `fixed` seconds."""
    n = len(sig)
    if n == 0:
        return []
    if n <= lo:
        return [{"index": 1, "start": 0, "end": n, "score": _score(sig, 0, n)}]
    hi = min(hi, max(lo, n // count))          # short video -> shorter clips so several fit
    sm = smooth(sig, 5)
    taken = [False] * n
    out = []
    attempts = 0
    while len(out) < count and attempts < count * 4:
        attempts += 1
        if fixed:
            d = min(fixed, max(8, n // count), n)
            pre, tk = [0.0], [0]
            for i in range(n):
                pre.append(pre[-1] + sm[i])
                tk.append(tk[-1] + taken[i])
            best = None
            for s in range(0, n - d + 1):
                if tk[s + d] - tk[s]:
                    continue
                m = (pre[s + d] - pre[s]) / d
                if best is None or m > best[0]:
                    best = (m, s)
            if best is None:
                break
            s, e = best[1], best[1] + d
        else:
            cand = [i for i in range(n) if not taken[i]]
            if not cand:
                break
            p = max(cand, key=lambda i: sm[i])
            l = r = p
            thr = 0.6 * sm[p]
            while r - l + 1 < hi:
                lv = sm[l - 1] if l > 0 and not taken[l - 1] else -1
                rv = sm[r + 1] if r + 1 < n and not taken[r + 1] else -1
                v = max(lv, rv)
                if v < 0 or (r - l + 1 >= lo and v < thr):
                    break
                if lv >= rv:
                    l -= 1
                else:
                    r += 1
            s, e = l, r + 1
            if e - s < 8:
                for i in range(max(0, s - 2), min(n, e + 2)):
                    taken[i] = True
                continue
        for i in range(max(0, s - 2), min(n, e + 2)):
            taken[i] = True
        out.append({"index": len(out) + 1, "start": s, "end": e, "score": _score(sig, s, e)})
    return out
