# -*- coding: utf-8 -*-
"""Timeline definition for the Castellum Aureliae promo film."""
import json, math

# ── narration timing (measured from the TTS renders) ──
def load_durations():
    rows = json.load(open("video/audio/durations.json"))
    return {r["id"]: r["duration"] for r in rows}

DUR = load_durations()

# (id, tail seconds)
ORDER = [
    ("prologue", 2.10),
    ("orbit", 1.25),
    ("floors", 1.15),
    ("rooms", 1.20),
    ("explode", 1.15),
    ("garden", 1.20),
    ("audit", 1.15),
    ("daynight", 1.15),
    ("export", 2.20),
    ("coda", 5.00),
]

def build_timeline(lead=0.55):
    scenes = []
    t = 0.0
    for i, (sid, tail) in enumerate(ORDER):
        dur = DUR[sid] + tail
        scenes.append({
            "index": i,
            "id": sid,
            "start": round(t, 3),
            "dur": round(dur, 3),
            "end": round(t + dur, 3),
            "voice": round(t + (0.5 if sid == "prologue" else 0.35), 3),
            "voice_dur": DUR[sid],
        })
        t += dur
    return scenes, round(t, 3)

SCENES, TOTAL = build_timeline()
