# -*- coding: utf-8 -*-
"""Typography + motion-graphics toolkit for the Castellum Aureliae promo film."""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1920, 1080
SS = 2  # overlay supersample factor

GOLD        = (200, 162, 98)
GOLD_LIGHT  = (231, 203, 152)
GOLD_DEEP   = (150, 116, 62)
CREAM       = (245, 236, 221)
MUTED       = (176, 162, 140)
INK         = (12, 10, 8)

FONT_DIR = "video/assets/fonts"
CJK_SERIF = "C:/Windows/Fonts/NotoSerifSC-VF.ttf"
CJK_SANS  = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
LATIN_DISPLAY = os.path.join(FONT_DIR, "Cormorant-500.ttf")
LATIN_DISPLAY_IT = os.path.join(FONT_DIR, "Cormorant-400i.ttf")
LATIN_SANS = os.path.join(FONT_DIR, "AlegreyaSans-500.ttf")
MONO = os.path.join(FONT_DIR, "IBMPlexMono-400.ttf")

_cache = {}

def font(path, size_px, weight=None):
    key = (path, size_px, weight)
    if key in _cache:
        return _cache[key]
    f = ImageFont.truetype(path, int(size_px))
    if weight:
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
    _cache[key] = f
    return f

def cn(size, weight="Regular"):
    return font(CJK_SERIF, size * SS, weight)

def sans(size, weight="Regular"):
    return font(CJK_SANS, size * SS, weight)

def latin(size, weight=None):
    return font(LATIN_DISPLAY, size * SS)

def latin_sans(size):
    return font(LATIN_SANS, size * SS)

def mono(size):
    return font(MONO, size * SS)

def text_width(draw, text, f, tracking=0.0):
    if not text:
        return 0.0
    tracking_px = tracking * f.size
    return sum(draw.textlength(ch, font=f) for ch in text) + tracking_px * (len(text) - 1)

def draw_tracked(draw, xy, text, f, fill, tracking=0.0, align="left", baseline=None):
    """Draw text with letter-spacing. xy is (x, y_top) unless baseline given."""
    x, y = xy
    total = text_width(draw, text, f, tracking)
    if align == "center":
        x -= total / 2
    elif align == "right":
        x -= total
    tracking_px = tracking * f.size
    if baseline is not None:
        for ch in text:
            draw.text((x, baseline), ch, font=f, fill=fill, anchor="ls")
            x += draw.textlength(ch, font=f) + tracking_px
    else:
        for ch in text:
            draw.text((x, y), ch, font=f, fill=fill, anchor="la")
            x += draw.textlength(ch, font=f) + tracking_px
    return total

def hairline(draw, x0, y0, x1, y1, fill, width=1):
    draw.line([(x0, y0), (x1, y1)], fill=fill, width=max(1, int(round(width))))

def radial_scrim(size, center, radius, strength=0.92, power=2.2):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - center[0]) / radius[0]) ** 2 + ((yy - center[1]) / radius[1]) ** 2)
    a = np.clip(1.0 - d, 0, 1) ** power * strength
    return a

def linear_scrim(size, direction="bottom", span=0.55, strength=0.85):
    w, h = size
    if direction == "bottom":
        g = np.linspace(1.0, 0.0, h).reshape(h, 1)
    elif direction == "top":
        g = np.linspace(0.0, 1.0, h).reshape(h, 1)
    elif direction == "left":
        g = np.linspace(1.0, 0.0, w).reshape(1, w)
    else:
        g = np.linspace(0.0, 1.0, w).reshape(1, w)
    g = np.clip((g - (1 - span)) / span, 0, 1) ** 1.5 * strength
    return np.broadcast_to(g, (h, w)).astype(np.float32)

def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)

def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3

def ease_in_out(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2

def crest(size, color=GOLD, alpha=255):
    """A thin drawn seal: rings + four-point star + dot."""
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = (s / 2, s / 2)
    col = color + (alpha,)
    pad = s * 0.04
    d.ellipse([pad, pad, s - pad, s - pad], outline=col, width=max(1, int(s * 0.006)))
    r2 = s * 0.34
    d.ellipse([c[0] - r2, c[1] - r2, c[0] + r2, c[1] + r2], outline=color + (int(alpha * 0.55),), width=max(1, int(s * 0.004)))
    r3 = s * 0.44
    for i in range(4):
        a = math.pi / 2 * i
        d.line([(c[0] + math.cos(a) * r3 * 0.9, c[1] + math.sin(a) * r3 * 0.9),
                (c[0] + math.cos(a) * r3, c[1] + math.sin(a) * r3)], fill=col, width=max(1, int(s * 0.006)))
    # four point star
    pts = []
    for i in range(8):
        a = -math.pi / 2 + i * math.pi / 4
        rr = s * 0.30 if i % 2 == 0 else s * 0.075
        pts.append((c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr))
    d.polygon(pts, outline=col)
    d.ellipse([c[0] - s * 0.022, c[1] - s * 0.022, c[0] + s * 0.022, c[1] + s * 0.022], fill=col)
    return img

def downscale(img, factor=SS):
    return img.resize((img.width // factor, img.height // factor), Image.LANCZOS)

def pill(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

class Canvas:
    """Supersampled RGBA canvas placed at (x, y) in the 1920x1080 frame."""
    def __init__(self, x, y, w, h):
        self.x, self.y = x, y
        self.w, self.h = w, h
        self.img = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def finish(self):
        return downscale(self.img)

    def px(self, v):
        return v * SS
