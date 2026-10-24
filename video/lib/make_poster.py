# -*- coding: utf-8 -*-
"""Build the clickable film poster used at the top of the READMEs."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from design import (GOLD, GOLD_LIGHT, CREAM, MUTED, W, H, cn, latin, mono, sans,
                    draw_tracked, hairline)

OUT = "previews/film-poster.jpg"

# Prefer the frame extracted from the film; fall back to the committed preview so
# the poster can be rebuilt from a clean clone.
if os.path.exists("金鸢尾堡-画面.jpg"):
    img = Image.open("金鸢尾堡-画面.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
else:
    src = Image.open("previews/hero-day.png").convert("RGB")
    crop = src.crop((0, 60, src.width, 960)).resize((W, H), Image.LANCZOS)
    img = crop
# darken the bottom third so the caption reads
yy = np.linspace(0, 1, H, dtype=np.float32).reshape(H, 1)
grad = np.clip((yy - 0.52) / 0.42, 0, 1) ** 0.95 * 0.96
grad = np.repeat(grad, W, axis=1)[..., None]
arr = np.asarray(img).astype(np.float32) * (1 - grad)
img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

S = 2
overlay = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
d = ImageDraw.Draw(overlay)

cx, cy, r = 150 * S, 930 * S, 46 * S
d.ellipse([cx - r - 3 * S, cy - r - 3 * S, cx + r + 3 * S, cy + r + 3 * S], fill=(8, 7, 5, 120))
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(11, 10, 8, 210), outline=GOLD + (235,), width=2 * S)
tri = [(cx - 13 * S, cy - 20 * S), (cx - 13 * S, cy + 20 * S), (cx + 22 * S, cy)]
d.polygon(tri, fill=CREAM + (255,))

f_kick = mono(12)
draw_tracked(d, (230 * S, 900 * S), "DEMO FILM · 2:04 · 1920×1080", f_kick, GOLD_LIGHT + (245,), 0.30)
f_title = cn(46, "Medium")
draw_tracked(d, (230 * S, 928 * S), "金鸢尾堡 · 演示宣传片", f_title, CREAM + (255,), 0.04)
hairline(d, 230 * S, 1006 * S, 700 * S, 1006 * S, GOLD + (110,), 1 * S)
f_lat = latin(26)
draw_tracked(d, (230 * S, 1016 * S), "CASTELLUM AURELIAE", f_lat, GOLD_LIGHT + (215,), 0.24)

overlay = overlay.resize((W, H), Image.LANCZOS)
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
os.makedirs("previews", exist_ok=True)
img.save(OUT, quality=90, subsampling=0)
print("poster written", OUT, os.path.getsize(OUT) // 1024, "KB")
