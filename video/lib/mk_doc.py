# -*- coding: utf-8 -*-
"""Emit the narration documents (Chinese + English) from cues.json + script.json."""
import json

cues = json.load(open("video/audio/cues.json", encoding="utf-8"))
script = json.load(open("video/script.json", encoding="utf-8"))
texts = {s["id"]: s for s in script["scenes"]}

NAMES = {
    "prologue": ("\u5e8f\u7ae0", "Prologue"),
    "orbit": ("01 \u73af\u7ed5", "01 Orbit"),
    "floors": ("02 \u5256\u9762", "02 Storeys"),
    "rooms": ("03 \u4e5d\u5ba4", "03 The Room Atlas"),
    "explode": ("04 \u5c55\u5f00", "04 Exploded"),
    "garden": ("05 \u5ead\u56ed", "05 The Parterre"),
    "audit": ("06 \u5ba1\u6821", "06 Survey"),
    "daynight": ("07 \u4e00\u65e5\u4e4b\u5149", "07 A Day in Light"),
    "export": ("08 \u5e26\u8d70", "08 Archive"),
    "coda": ("\u5c3e\u58f0", "Coda"),
}


def mmss(t):
    return "%d:%02d" % (int(t // 60), int(t % 60))


def write(path, lang):
    total = mmss(cues["total"])
    if lang == "zh":
        lines = [
            "# \u89e3\u8bf4\u6587\u6848 \u00b7 \u91d1\u9e22\u5c3e\u5821 / Castellum Aureliae",
            "",
            "> \u6210\u7247\u300a\u91d1\u9e22\u5c3e\u5821-\u6f14\u793a\u5ba3\u4f20\u7247.mp4\u300b\u00b7 %s \u00b7 1920\u00d71080 \u00b7 30 fps" % total,
            "",
            "\u65c1\u767d\uff1aKokoro-82M \u4e2d\u6587\u795e\u7ecf\u8bed\u97f3\uff08zf_xiaoxiao\uff09\uff0c\u8bed\u901f 0.88\u3002\u6bb5\u4e0e\u6bb5\u4e4b\u95f4\u7559\u7ea6 1 \u79d2\u547c\u5438\u3002",
            "",
            "[English version](narration.en.md)",
            "",
        ]
    else:
        lines = [
            "# Narration script \u00b7 Castellum Aureliae",
            "",
            "> Film: *\u91d1\u9e22\u5c3e\u5821-\u6f14\u793a\u5ba3\u4f20\u7247.mp4* \u00b7 %s \u00b7 1920\u00d71080 \u00b7 30 fps" % total,
            "",
            "Voice: Kokoro-82M Chinese neural voice (zf_xiaoxiao), speed 0.88, about one second of breathing room between segments.",
            "This is the English translation of the spoken Mandarin narration; the audio itself is Chinese.",
            "",
            "[\u4e2d\u6587\u7248](narration.md)",
            "",
        ]
    for sc in cues["scenes"]:
        scene = texts[sc["id"]]
        zh_name, en_name = NAMES[sc["id"]]
        name = zh_name if lang == "zh" else en_name
        lines += ["## %s \u00b7 %s" % (name, mmss(sc["voice"])), ""]
        lines += ["> %s" % scene["title"], ""]
        lines += [scene["text"] if lang == "zh" else scene.get("text_en", ""), ""]
    text = "\n".join(lines)
    open(path, "w", encoding="utf-8", newline="\n").write(text)
    print("written", path, len(text), "chars")


write("video/narration.md", "zh")
write("video/narration.en.md", "en")
