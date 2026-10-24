# -*- coding: utf-8 -*-
import json
cues = json.load(open("video/audio/cues.json", encoding="utf-8"))
script = json.load(open("video/script.json", encoding="utf-8"))
texts = {s["id"]: s for s in script["scenes"]}
names = {
    "prologue": "序章", "orbit": "01 环绕", "floors": "02 剖面", "rooms": "03 九室",
    "explode": "04 展开", "garden": "05 庭园", "audit": "06 审校",
    "daynight": "07 一日之光", "export": "08 带走", "coda": "尾声",
}
def mmss(t):
    return "%d:%02d" % (int(t // 60), int(t % 60))
lines = ["# 解说文案 · 金鸢尾堡 / Castellum Aureliae", "",
         "> 成片：《金鸢尾堡-演示宣传片.mp4》· %s · 1920×1080 · 30 fps" % mmss(cues["total"]), "",
         "旁白：Kokoro-82M 中文神经语音（zf_xiaoxiao），语速 0.88。段与段之间留约 1 秒呼吸。", ""]
for sc in cues["scenes"]:
    sc2 = texts[sc["id"]]
    lines += ["## %s · %s" % (names[sc["id"]], mmss(sc["voice"])), "",
              "> %s" % sc2["title"], "", sc2["text"], ""]
open("video/解说文案.md", "w", encoding="utf-8").write("\n".join(lines))
print("doc written", len(lines))
