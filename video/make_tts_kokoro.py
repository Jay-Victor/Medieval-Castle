# -*- coding: utf-8 -*-
"""Narration synthesis with Kokoro-82M (Chinese) + humanised pacing."""
import sys, os, json, re, wave
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"))
from kokoro import Kokoro, write_wav, SR

VOICE = os.environ.get("KOKORO_VOICE", "zf_xiaoxiao")
SPEED = float(os.environ.get("KOKORO_SPEED", "0.96"))
OUTDIR = "video/audio/segments-kokoro"
os.makedirs(OUTDIR, exist_ok=True)

PAUSE = {"，": 0.20, ",": 0.20, "、": 0.16, "；": 0.34, "：": 0.28, "。": 0.52, ".": 0.52,
         "？": 0.45, "!": 0.42, "！": 0.42, "—": 0.30}

def normalise(text):
    t = text.replace("——", "，")
    t = t.replace("“", "").replace("”", "").replace("「", "").replace("」", "")
    t = t.replace("·", "")
    return t

def split_clauses(text):
    """Return [(clause, pause_after_seconds)] preserving punctuation rhythm."""
    parts = re.split(r"([，,、；；：。.？?！!])", text)
    out = []
    buf = ""
    for piece in parts:
        if not piece:
            continue
        if piece in PAUSE:
            if buf.strip():
                out.append((buf.strip(), PAUSE[piece]))
                buf = ""
        else:
            buf += piece
    if buf.strip():
        out.append((buf.strip(), 0.4))
    return out

def trim(x, thresh=0.006, pad=0.02):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]

def fade(x, ms=6):
    n = int(SR * ms / 1000)
    if len(x) < 2 * n:
        return x
    y = x.copy()
    y[:n] *= np.linspace(0, 1, n)
    y[-n:] *= np.linspace(1, 0, n)
    return y

def synth(text, k, voice):
    t = normalise(text)
    chunks = []
    for clause, pause in split_clauses(t):
        audio, ps = k.synth_text(clause, voice, speed=SPEED)
        if len(audio) == 0:
            continue
        audio = fade(trim(audio))
        chunks.append(audio)
        chunks.append(np.zeros(int(pause * SR), dtype=np.float32))
    if chunks:
        chunks.pop()  # no trailing pause
    return np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)

def main():
    script = json.load(open("video/script.json", encoding="utf-8"))
    k = Kokoro()
    report = []
    for sc in script["scenes"]:
        audio = synth(sc["text"], k, VOICE)
        path = os.path.join(OUTDIR, sc["id"] + ".wav")
        write_wav(path, audio)
        dur = len(audio) / SR
        report.append({"id": sc["id"], "duration": round(dur, 3)})
        print("%-10s %6.2fs  %d samples" % (sc["id"], dur, len(audio)), flush=True)
    json.dump(report, open("video/audio/durations-kokoro.json", "w"), indent=1)
    print("TOTAL", round(sum(r["duration"] for r in report), 2), "voice", VOICE, "speed", SPEED)

if __name__ == "__main__":
    main()
