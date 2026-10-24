# -*- coding: utf-8 -*-
"""Approximate sentence-level subtitles from the narration script + measured TTS lengths."""
import json, re, os

CUES = json.load(open("video/audio/cues.json", encoding="utf-8"))
SCRIPT = json.load(open("video/script.json", encoding="utf-8"))
texts = {s["id"]: s["text"] for s in SCRIPT["scenes"]}

def split_sentences(text):
    parts = re.split(r"(?<=[。！？；])", text)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # keep clauses reasonably short for a two-line subtitle
        if len(p) > 26:
            sub = re.split(r"(?<=[，、])", p)
            buf = ""
            for s in sub:
                if len(buf) + len(s) > 24 and buf:
                    out.append(buf); buf = s
                else:
                    buf += s
            if buf.strip():
                out.append(buf.strip())
        else:
            out.append(p)
    return out

def ts(sec):
    h = int(sec // 3600); m = int((sec % 3600) // 60); s = sec % 60
    return "%02d:%02d:%06.3f" % (h, m, s)

lines = []
idx = 1
for sc in CUES["scenes"]:
    sents = split_sentences(texts[sc["id"]])
    if not sents:
        continue
    weights = [max(1, len(re.sub(r"[，。；、！？：]", "", s))) for s in sents]
    total_w = sum(weights)
    t0 = sc["voice"]
    dur = sc["voice_dur"]
    for s, w in zip(sents, weights):
        d = dur * w / total_w
        start = t0
        end = min(t0 + d, sc["voice"] + dur + 0.2)
        lines.append((idx, start, end, s))
        idx += 1
        t0 += d

with open("video/out/subtitles.srt", "w", encoding="utf-8-sig") as f:
    for i, a, b, text in lines:
        f.write("%d\n%s --> %s\n%s\n\n" % (i, ts(a).replace(".", ","), ts(b).replace(".", ","), text))
print("srt lines", len(lines))
