# -*- coding: utf-8 -*-
"""Composable overlay cards."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from design import (W, H, SS, GOLD, GOLD_LIGHT, GOLD_DEEP, CREAM, MUTED, INK,
                    cn, sans, latin, latin_sans, mono, draw_tracked, text_width,
                    hairline, crest, downscale, radial_scrim, linear_scrim, Canvas)


def _full():
    return Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))


def title_card():
    img = _full()
    d = ImageDraw.Draw(img)
    cx = W * SS / 2

    seal = crest(int(96 * SS), GOLD, 240)
    img.alpha_composite(seal, (int(cx - seal.width / 2), int(266 * SS)))

    f_kick = mono(13)
    draw_tracked(d, (cx, 398 * SS), "AN ARCHITECTURAL FABLE", f_kick, GOLD + (230,), 0.44, align="center")

    f_title = cn(106, "Medium")
    draw_tracked(d, (cx, 432 * SS), "金鸢尾堡", f_title, CREAM + (255,), 0.16, align="center")

    hairline(d, cx - 120 * SS, 594 * SS, cx + 120 * SS, 594 * SS, GOLD + (140,), 1 * SS)

    f_lat = latin(38)
    draw_tracked(d, (cx, 620 * SS), "CASTELLUM AURELIAE", f_lat, GOLD_LIGHT + (240,), 0.30, align="center")

    f_sub = sans(19, "Light")
    draw_tracked(d, (cx, 694 * SS), "一座为光而建的城堡 · 石墙 · 角楼 · 两座对称庭园", f_sub, MUTED + (235,), 0.10, align="center")
    return downscale(img)


def chapter_card(kicker, title, latin_text):
    """Bottom-left chapter card, canvas trimmed to content."""
    cw, ch, pad = 620, 176, 34
    c = Canvas(0, 0, cw + pad * 2, ch + pad * 2)
    img = c.img
    # soft dark pocket, feathered so it never reads as a hard box
    plate = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dp = ImageDraw.Draw(plate)
    dp.rounded_rectangle([pad * SS, pad * SS, (pad + cw) * SS, (pad + ch) * SS],
                         radius=10 * SS, fill=(9, 8, 6, 214))
    plate = plate.filter(ImageFilter.GaussianBlur(15 * SS))
    img.alpha_composite(plate)
    d = ImageDraw.Draw(img)
    x0 = (pad + 24) * SS
    y0 = (pad + 14) * SS
    d.line([(pad * SS + 3 * SS, y0 + 6 * SS), (pad * SS + 3 * SS, y0 + 132 * SS)],
           fill=GOLD + (200,), width=2 * SS)
    f_kick = mono(12.5)
    draw_tracked(d, (x0, y0), kicker.upper(), f_kick, GOLD_LIGHT + (250,), 0.38)
    f_t = cn(40, "Medium")
    draw_tracked(d, (x0, y0 + 26 * SS), title, f_t, CREAM + (255,), 0.05)
    hairline(d, x0, y0 + 92 * SS, x0 + 250 * SS, y0 + 92 * SS, GOLD + (105,), 1 * SS)
    f_l = latin_sans(15)
    draw_tracked(d, (x0, y0 + 104 * SS), latin_text.upper(), f_l, MUTED + (240,), 0.18)
    return c.finish()


def scrim_cluster(kind="bottom-left"):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    a = np.zeros((H, W), dtype=np.float32)
    if kind == "bottom-left":
        a = np.maximum(a, radial_scrim((W, H), (230, 1010), (580, 300), 0.95, 1.35))
        a = np.maximum(a, linear_scrim((W, H), "bottom", 0.26, 0.5))
        a = np.maximum(a, linear_scrim((W, H), "left", 0.18, 0.34))
    elif kind == "bottom":
        a = linear_scrim((W, H), "bottom", 0.34, 0.72)
    elif kind == "top":
        a = linear_scrim((W, H), "top", 0.26, 0.62)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[..., 0:3] = 6
    rgba[..., 3] = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def callout(label, sub="", width=None, align="left", small=False):
    pad_x, pad_y = 26, 17
    fs = 20 if not small else 17
    tmp = Canvas(0, 0, 10, 10)
    d = tmp.d
    f_m = sans(fs, "Medium")
    f_s = mono(11.5)
    w_label = text_width(d, label, f_m, 0.02)
    w_sub = text_width(d, sub, f_s, 0.18) if sub else 0
    body_w = max(w_label, w_sub)
    w = int(body_w / SS + pad_x * 2 + 24)
    h = int(62 + (18 if sub else 0))
    c = Canvas(0, 0, w, h)
    d = c.d
    d.rounded_rectangle([0, 0, w * SS - 1, h * SS - 1], radius=3 * SS,
                        fill=(10, 9, 7, 216), outline=GOLD + (70,), width=1 * SS)
    # gold tick on the left edge
    d.rectangle([0, 0, 3 * SS, h * SS], fill=GOLD + (220,))
    draw_tracked(d, (22 * SS, 15 * SS), label, f_m, CREAM + (250,), 0.02)
    if sub:
        draw_tracked(d, (22 * SS, 42 * SS), sub.upper(), f_s, GOLD_LIGHT + (220,), 0.20)
    return c.finish()


def stat_card(rows, title="ARCHIVE · EXPORT", width=430):
    w = width
    h = 84 + len(rows) * 46 + 24
    c = Canvas(0, 0, w, h)
    d = c.d
    d.rectangle([0, 0, w * SS - 1, h * SS - 1], fill=(11, 10, 8, 240))
    d.rectangle([0, 0, w * SS - 1, h * SS - 1], outline=GOLD + (80,), width=1 * SS)
    d.rectangle([0, 0, 4 * SS, h * SS], fill=GOLD + (215,))
    f_t = mono(11.5)
    draw_tracked(d, (26 * SS, 20 * SS), title, f_t, GOLD_LIGHT + (250,), 0.34)
    hairline(d, 26 * SS, 46 * SS, (w - 26) * SS, 46 * SS, GOLD + (60,), 1 * SS)
    fy = 58
    for label, value in rows:
        f_l = sans(15, "Light")
        f_v = latin_sans(16)
        draw_tracked(d, (26 * SS, fy * SS), label, f_l, MUTED + (235,), 0.04)
        draw_tracked(d, ((w - 26) * SS, fy * SS - 3 * SS), value, f_v, CREAM + (250,), 0.06, align="right")
        fy += 46
    return c.finish()


def end_card():
    img = _full()
    d = ImageDraw.Draw(img)
    cx = W * SS / 2
    seal = crest(int(64 * SS), GOLD, 220)
    img.alpha_composite(seal, (int(cx - seal.width / 2), int(300 * SS)))
    f_t = cn(80, "Medium")
    draw_tracked(d, (cx, 400 * SS), "金鸢尾堡", f_t, CREAM + (255,), 0.16, align="center")
    hairline(d, cx - 100 * SS, 520 * SS, cx + 100 * SS, 520 * SS, GOLD + (150,), 1 * SS)
    f_l = latin(32)
    draw_tracked(d, (cx, 540 * SS), "CASTELLUM AURELIAE", f_l, GOLD_LIGHT + (240,), 0.32, align="center")
    f_s = sans(20, "Light")
    draw_tracked(d, (cx, 620 * SS), "打开浏览器，光就在原来的位置等你", f_s, CREAM + (235,), 0.10, align="center")
    f_m = mono(12)
    draw_tracked(d, (cx, 700 * SS), "HTTP://127.0.0.1:4173", f_m, MUTED + (220,), 0.26, align="center")
    return downscale(img)


def scrim_full(center_alpha=0.66, edge_alpha=0.9):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = (xx - W / 2) / (W / 2)
    dy = (yy - H / 2) / (H / 2)
    d = np.clip(np.sqrt(dx * dx * 0.85 + dy * dy) / 1.4, 0, 1)
    a = center_alpha + (edge_alpha - center_alpha) * (d ** 1.4)
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[..., 0:3] = 5
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def minimap_rule():
    """Thin gold frame inset used as a cinematic border."""
    img = _full()
    d = ImageDraw.Draw(img)
    m = 26 * SS
    d.rectangle([m, m, W * SS - m, H * SS - m], outline=GOLD + (26,), width=1 * SS)
    return downscale(img)
