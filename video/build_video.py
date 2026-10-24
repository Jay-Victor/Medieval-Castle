# -*- coding: utf-8 -*-
"""Castellum Aureliae — promo film renderer (frames + ffmpeg encode)."""
import json, os, math, sys, subprocess, shutil, argparse, glob, time
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageEnhance
import design as D
import cards as C
import scenes as T
from design import W, H, SS, GOLD, GOLD_LIGHT, CREAM, MUTED

FPS = 30
OUT_DIR = "video/out"
FRAME_DIR = "tmp/frames"
STILL_DIR = "video/stills"
SRC_CROP = (0, 67, 1600, 967)

# ---------------------------------------------------------------- sources
PLATE_H = 1042

class Source:
    """A screenshot presented on the stage, or a full-bleed cinematic plate."""
    def __init__(self, name, path, stage=True, crop=None):
        im = Image.open(path).convert("RGB")
        if crop:
            im = im.crop(crop)
        self.name = name
        self.im = im
        self.w, self.h = im.size
        self.stage = stage
        if stage:
            self.k = PLATE_H / self.h
            pw, ph = int(round(self.w * self.k)), PLATE_H
            plate = im.resize((pw, ph), Image.LANCZOS).filter(
                ImageFilter.UnsharpMask(radius=1.1, percent=52, threshold=2))
            self.plate = plate.convert("RGBA")
            cover = ImageOps.fit(im, (W, H), Image.LANCZOS)
            bg = cover.filter(ImageFilter.GaussianBlur(30))
            bg = ImageEnhance.Brightness(bg).enhance(0.30)
            bg = ImageEnhance.Color(bg).enhance(0.7)
            self.bg = bg.convert("RGBA")
        else:
            self.k = W / self.w
            plate = im.resize((int(round(self.w * self.k)), int(round(self.h * self.k))), Image.LANCZOS)
            self.plate = plate.filter(ImageFilter.UnsharpMask(radius=1.2, percent=46, threshold=2)).convert("RGBA")
            self.bg = None

    def render(self, zoom, focal):
        inv = 1.0 / zoom
        cx = focal[0] * self.k - (W / 2.0) * inv
        cy = focal[1] * self.k - (H / 2.0) * inv
        fg = self.plate.transform((W, H), Image.AFFINE, (inv, 0, cx, 0, inv, cy),
                                  Image.BICUBIC, fillcolor=(0, 0, 0, 0))
        if self.bg is None:
            return fg.convert("RGB")
        return Image.alpha_composite(self.bg, fg).convert("RGB")

SRC = {}
def load_sources():
    SRC["day"] = Source("day", "previews/hero-day.png")
    SRC["night"] = Source("night", "previews/hero-night.png")
    SRC["library"] = Source("library", "previews/library.png")
    SRC["exploded"] = Source("exploded", "previews/exploded.png")
    SRC["atlas"] = Source("atlas", "previews/atlas.png")
    SRC["audit"] = Source("audit", "previews/audit.png")
    b = Image.open("previews/balcony.png")
    bw = int(b.height * 16 / 9)
    x0 = (b.width - bw) // 2
    SRC["balcony"] = Source("balcony", "previews/balcony.png", stage=False, crop=(x0, 0, x0 + bw, b.height))

# ---------------------------------------------------------------- look
def build_grade():
    lut = np.arange(256, dtype=np.float32) / 255.0
    s = 0.5 - 0.5 * np.cos(np.clip(lut, 0, 1) * math.pi * 0.92)
    s = 0.38 * lut + 0.62 * s
    s = np.clip(s + 0.012 * (1 - lut) ** 2, 0, 1)
    r = np.clip(s * 1.030 + 0.006, 0, 1)
    g = np.clip(s * 1.004 + 0.003, 0, 1)
    b = np.clip(s * 0.968, 0, 1)
    return [np.clip(c * 255, 0, 255).astype(np.uint8) for c in (r, g, b)]

GRADE = None

def build_vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = (xx - W / 2) / (W / 2)
    dy = (yy - H / 2) / (H / 2)
    d = np.sqrt(dx ** 2 * 0.9 + dy ** 2)
    v = 1.0 - np.clip((d - 0.55) / 0.8, 0, 1) ** 1.8 * 0.42
    return v[..., None].astype(np.float32)

VIGNETTE = None

GRAIN = None
def build_grain():
    rs = np.random.RandomState(11)
    tiles = []
    for _ in range(7):
        n = rs.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
        n = np.repeat(np.repeat(n, 2, axis=0), 2, axis=1)[:H, :W]
        tiles.append(n[..., None])
    return tiles

# ---------------------------------------------------------------- compositing
def composite(dst, overlay, x, y, alpha=1.0):
    if alpha <= 0.003:
        return dst
    arr = np.asarray(overlay)
    h, w = arr.shape[:2]
    x0, y0 = int(round(x)), int(round(y))
    sx0 = max(0, -x0); sy0 = max(0, -y0)
    dx0 = max(0, x0); dy0 = max(0, y0)
    dx1 = min(W, x0 + w); dy1 = min(H, y0 + h)
    if dx1 <= dx0 or dy1 <= dy0:
        return dst
    src = arr[sy0:sy0 + (dy1 - dy0), sx0:sx0 + (dx1 - dx0)]
    a = (src[..., 3:4].astype(np.float32) / 255.0) * alpha
    region = dst[dy0:dy1, dx0:dx1].astype(np.float32)
    out = region * (1.0 - a) + src[..., :3].astype(np.float32) * a
    dst[dy0:dy1, dx0:dx1] = np.clip(out, 0, 255).astype(np.uint8)
    return dst

def draw_leader(dst, p0, p1, alpha=1.0, color=GOLD):
    if alpha <= 0.01:
        return dst
    pad = 12
    x0 = int(min(p0[0], p1[0])) - pad; y0 = int(min(p0[1], p1[1])) - pad
    x1 = int(max(p0[0], p1[0])) + pad; y1 = int(max(p0[1], p1[1])) + pad
    x0c, y0c = max(0, x0), max(0, y0)
    x1c, y1c = min(W, x1), min(H, y1)
    if x1c <= x0c or y1c <= y0c:
        return dst
    img = Image.new("RGBA", (x1c - x0c, y1c - y0c), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    a1 = int(205 * alpha)
    d.line([(p0[0] - x0c, p0[1] - y0c), (p1[0] - x0c, p1[1] - y0c)], fill=color + (a1,), width=1)
    r = 3.2
    d.ellipse([p1[0] - x0c - r, p1[1] - y0c - r, p1[0] - x0c + r, p1[1] - y0c + r],
              fill=(238, 224, 198, int(235 * alpha)), outline=color + (a1,))
    r2 = 9.5
    d.ellipse([p1[0] - x0c - r2, p1[1] - y0c - r2, p1[0] - x0c + r2, p1[1] - y0c + r2],
              outline=color + (int(90 * alpha),), width=1)
    return composite(dst, img, x0c, y0c, 1.0)

# ---------------------------------------------------------------- cursor
CURSOR_TILE = None
def build_cursor():
    S = 3
    size = 46
    img = Image.new("RGBA", (size * S, size * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(0, 0), (0, 21.5), (5.6, 16.2), (9.4, 24.6), (13.2, 22.9), (9.4, 14.7), (16.2, 14.7)]
    poly = [(x * S + 4 * S, y * S + 4 * S) for x, y in pts]
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.polygon([(x + 2.4 * S, y + 3.4 * S) for x, y in poly], fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3.0 * S))
    img.alpha_composite(shadow)
    d.polygon(poly, fill=(252, 247, 236, 255))
    d.line(poly + [poly[0]], fill=(24, 18, 12, 255), width=int(1.25 * S), joint="curve")
    return img.resize((size, size), Image.LANCZOS), 4.0

def cursor_tile(pos, click_age=None):
    base, tip = CURSOR_TILE
    S = 3
    pad = 30
    canvas = Image.new("RGBA", (104 * S, 104 * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    cx = (pad + tip + 6) * S
    cy = (pad + tip + 6) * S
    if click_age is not None and 0 <= click_age <= 0.9:
        k = click_age / 0.9
        for mul, wid, aa in ((1.0, 2.2, 220), (1.5, 1.0, 110)):
            rr = (7 + 34 * D.ease_out(k)) * mul * S
            a = int(aa * (1 - k) ** 1.7)
            if a > 2:
                d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=GOLD_LIGHT + (a,), width=max(1, int(wid * S)))
    arrow = base.resize((base.width * S, base.height * S), Image.LANCZOS)
    canvas.alpha_composite(arrow, (int(pad * S), int(pad * S)))
    out = canvas.resize((104, 104), Image.LANCZOS)
    return out, pos[0] - pad - tip, pos[1] - pad - tip

# ---------------------------------------------------------------- engine
def lerp(a, b, k):
    return a + (b - a) * k

def track(t, keys, easing=D.ease_in_out):
    if t <= keys[0][0]:
        return keys[0][1]
    for i in range(len(keys) - 1):
        t0, v0 = keys[i]
        t1, v1 = keys[i + 1]
        if t0 <= t <= t1:
            k = easing((t - t0) / max(1e-6, t1 - t0))
            return tuple(lerp(a, b, k) for a, b in zip(v0, v1))
    return keys[-1][1]

def to_frame(src, pt, zoom, focal):
    return (W / 2.0 + (pt[0] - focal[0]) * zoom * src.k,
            H / 2.0 + (pt[1] - focal[1]) * zoom * src.k)

class Shot:
    def __init__(self, src, t0, cam, dissolve=0.0):
        self.src = src; self.t0 = t0; self.cam = cam; self.dissolve = dissolve
    def camera(self, t):
        return track(t, self.cam)
    def image(self, t):
        z, fx, fy = self.camera(t)
        return SRC[self.src].render(z, (fx, fy))

class Scene:
    def __init__(self, spec, shots, overlays, cursor=None, xfade=0.75, dim=None):
        self.spec = spec
        self.id = spec["id"]
        self.start = spec["start"]; self.dur = spec["dur"]; self.end = spec["end"]
        self.shots = shots; self.overlays = overlays; self.cursor = cursor
        self.xfade = xfade; self.dim = dim
        self.black_in = 0.0

    def active(self, t):
        active = self.shots[0]
        for sh in self.shots:
            if t >= sh.t0 - 1e-6:
                active = sh
        return active

    def base(self, t):
        active = self.shots[0]; prev = None
        for i, sh in enumerate(self.shots):
            if t >= sh.t0 - 1e-6:
                active = sh
                prev = self.shots[i - 1] if i > 0 else None
        img = active.image(t)
        if prev is not None and active.dissolve > 0 and t < active.t0 + active.dissolve:
            k = D.ease_in_out((t - active.t0) / active.dissolve)
            img = Image.blend(prev.image(min(t, active.t0)), img, k)
        return img

    def cursor_state(self, t):
        c = self.cursor
        if not c:
            return None
        sh = self.shots[c["shot"]]
        if t < sh.t0 - 1e-6 or t > c.get("hide_after", 1e9):
            return None
        z, fx, fy = sh.camera(t)
        p = track(t, c["keys"])
        pos = to_frame(SRC[sh.src], p, z, (fx, fy))
        age = None
        for tc in c.get("clicks", []):
            if 0 <= t - tc <= 0.9:
                age = t - tc
        return pos, age

# ---------------------------------------------------------------- cards
CARDS = {}
def build_cards():
    CARDS["title"] = np.asarray(C.title_card())
    CARDS["end"] = np.asarray(C.end_card())
    CARDS["scrim_bl"] = np.asarray(C.scrim_cluster("bottom-left"))
    CARDS["scrim_b"] = np.asarray(C.scrim_cluster("bottom"))
    CARDS["scrim_full"] = np.asarray(C.scrim_full())
    CARDS["chapter"] = {}
    chap = {
        "orbit": ("01 · ORBIT", "绕着它走一圈", "DRAG TO CIRCLE"),
        "floors": ("02 · STOREYS", "把城堡剖开", "FLOOR SECTION"),
        "rooms": ("03 · THE ROOM ATLAS", "九个房间，九种光线", "NINE ROOMS"),
        "explode": ("04 · EXPLODED", "沿垂直轴展开", "AXONOMETRIC"),
        "garden": ("05 · THE PARTERRE", "两座对称的庭园", "MIRRORED GARDENS"),
        "audit": ("06 · SURVEY", "可以被复核的建造", "CRAFTSMANSHIP"),
        "daynight": ("07 · A DAY IN LIGHT", "一日之光", "DAWN TO MIDNIGHT"),
        "export": ("08 · ARCHIVE", "把它带走", "GLB · BINARY"),
    }
    for k, v in chap.items():
        CARDS["chapter"][k] = np.asarray(C.chapter_card(*v))
    CARDS["callout"] = {}
    co = {
        "orbit": ("按住拖动 · 环绕全堡", "DRAG TO ORBIT · SCROLL TO ZOOM"),
        "floors": ("点击楼层 · 剖开内部", "FIVE VIEWPOINTS"),
        "rooms": ("每一间都有自己的档案", "FLOOR · FURNISHING · LIGHT"),
        "explode": ("墙体 · 家具 · 屋顶 分层升起", "2.55 / 5.10 / 7.65 M"),
        "garden": ("晨露露台 · 从卧室走进花园", "THE MORNING BALCONY"),
        "audit": ("79 件陈设 · 冲突 0 · 越界 0", "SURVEYED BY WORLD AABB"),
        "daynight": ("拖动时间轴 · 24 小时光照", "DAWN · NOON · DUSK · MIDNIGHT"),
    }
    for k, (a, b) in co.items():
        CARDS["callout"][k] = np.asarray(C.callout(a, b))
    CARDS["stats"] = np.asarray(C.stat_card([
        ("FORMAT", "GLTF 2.0 · BINARY"),
        ("SIZE", "15.86 MB"),
        ("MESH NODES", "501"),
        ("TRIANGLES", "566,934"),
        ("MATERIALS", "87"),
    ], title="ARCHIVE · EXPORT"))
    CARDS["frame"] = np.asarray(C.minimap_rule())

def ev_chapter(sid, t0, t1, fade=0.62):
    return {"img": CARDS["chapter"][sid], "t0": t0, "t1": t1, "fade": fade,
            "pos": (58, 806), "rise": 16, "scrim": "scrim_bl", "scrim_a": 0.75}

def ev_callout(sid, t0, t1, target, offset, fade=0.55):
    return {"img": CARDS["callout"][sid], "t0": t0, "t1": t1, "fade": fade,
            "target": target, "offset": offset, "leader": True, "rise": 10}

# ---------------------------------------------------------------- scenes
SCENE_OBJS = {}
def build_scenes():
    A = {}
    spec = {s["id"]: s for s in T.SCENES}

    A["prologue"] = Scene(spec["prologue"],
        [Shot("day", 0.0, [(3.4, (1.10, 800, 520)), (12.8, (1.03, 800, 520))])],
        [{"img": CARDS["title"], "t0": 0.25, "t1": 3.95, "fade": 0.95, "pos": (0, 0), "rise": 0}],
        xfade=0.0)
    A["prologue"].black_in = 1.85

    A["orbit"] = Scene(spec["orbit"],
        [Shot("day", 0.0, [(0.0, (1.045, 800, 520)), (12.6, (1.115, 800, 520))])],
        [ev_chapter("orbit", 0.40, 4.55),
         ev_callout("orbit", 2.05, 7.30, (800, 530), (135, -335))],
        cursor={"shot": 0, "keys": [(0.0, (1310, 760)), (1.35, (905, 595)), (2.9, (885, 585)),
                                    (4.8, (760, 555)), (6.3, (700, 572))],
                "clicks": [], "hide_after": 7.2})

    A["floors"] = Scene(spec["floors"],
        [Shot("day", 0.0, [(0.0, (1.05, 800, 520)), (1.9, (1.07, 800, 520))]),
         Shot("library", 1.78, [(1.78, (1.08, 800, 520)), (13.6, (1.03, 800, 520))], dissolve=0.62)],
        [ev_chapter("floors", 0.40, 4.50),
         ev_callout("floors", 3.45, 8.10, (1295, 285), (-470, -40))],
        cursor={"shot": 0, "keys": [(0.0, (1010, 740)), (0.95, (1295, 285))],
                "clicks": [1.18], "hide_after": 2.55})

    A["rooms"] = Scene(spec["rooms"],
        [Shot("atlas", 0.0, [(0.0, (1.10, 800, 520)), (3.5, (1.05, 800, 520))]),
         Shot("library", 3.50, [(3.5, (1.03, 800, 520)), (12.4, (1.17, 300, 690))], dissolve=0.60)],
        [ev_chapter("rooms", 0.40, 4.30),
         ev_callout("rooms", 5.45, 9.80, (250, 720), (355, -330))],
        cursor={"shot": 0, "keys": [(0.0, (1119, 600)), (1.55, (1097, 442))],
                "clicks": [2.45], "hide_after": 3.40})

    A["explode"] = Scene(spec["explode"],
        [Shot("library", 0.0, [(0.0, (1.03, 800, 520)), (1.9, (1.03, 800, 520))]),
         Shot("day", 1.62, [(1.62, (1.03, 800, 520)), (3.5, (1.03, 800, 520))], dissolve=0.45),
         Shot("exploded", 3.52, [(3.52, (1.03, 800, 520)), (12.5, (1.09, 800, 520))], dissolve=0.50)],
        [ev_chapter("explode", 0.40, 4.45),
         ev_callout("explode", 5.45, 9.90, (800, 530), (300, -350))],
        cursor={"shot": 0, "keys": [(0.0, (1330, 178)), (0.8, (1330, 178)), (2.25, (1525, 362))],
                "clicks": [0.88, 2.58], "hide_after": 3.35})

    A["garden"] = Scene(spec["garden"],
        [Shot("balcony", 0.0, [(0.0, (1.09, 752, 423)), (13.6, (1.0, 780, 432))])],
        [ev_chapter("garden", 0.40, 4.70),
         ev_callout("garden", 3.55, 8.10, (563, 430), (365, -320))])

    A["audit"] = Scene(spec["audit"],
        [Shot("day", 0.0, [(0.0, (1.04, 800, 520)), (2.0, (1.07, 900, 550))]),
         Shot("audit", 1.95, [(1.95, (1.10, 800, 520)), (12.2, (1.04, 800, 520))], dissolve=0.55)],
        [ev_chapter("audit", 0.40, 4.35),
         ev_callout("audit", 3.25, 7.55, (800, 540), (-545, -300))],
        cursor={"shot": 0, "keys": [(0.0, (1000, 740)), (0.85, (1270, 852))],
                "clicks": [1.10], "hide_after": 2.30})

    A["daynight"] = Scene(spec["daynight"],
        [Shot("day", 0.0, [(0.0, (1.03, 800, 520)), (4.7, (1.04, 800, 520))]),
         Shot("night", 2.15, [(2.15, (1.03, 800, 520)), (15.1, (1.09, 800, 520))], dissolve=2.45)],
        [ev_chapter("daynight", 0.40, 4.55),
         ev_callout("daynight", 4.75, 8.90, (600, 900), (300, -345))],
        cursor={"shot": 0, "keys": [(0.75, (600, 900)), (1.45, (600, 900)), (4.25, (800, 900))],
                "clicks": [], "hide_after": 5.10})

    A["export"] = Scene(spec["export"],
        [Shot("day", 0.0, [(0.0, (1.03, 800, 520)), (16.4, (1.11, 1180, 640))])],
        [ev_chapter("export", 0.40, 4.55),
         {"img": CARDS["stats"], "t0": 2.35, "t1": 10.2, "fade": 0.55,
          "target": (1395, 803), "offset": (-720, -430), "leader": True, "rise": 12}],
        cursor={"shot": 0, "keys": [(0.0, (1010, 760)), (1.05, (1395, 803))],
                "clicks": [1.48], "hide_after": 2.45})

    A["coda"] = Scene(spec["coda"],
        [Shot("night", 0.0, [(0.0, (1.06, 800, 520)), (12.6, (1.13, 800, 520))])],
        [{"img": CARDS["scrim_full"], "t0": 0.35, "t1": 12.6, "fade": 1.1, "pos": (0, 0), "rise": 0, "alpha": 0.94},
         {"img": CARDS["end"], "t0": 1.15, "t1": 12.0, "fade": 1.0, "pos": (0, 0), "rise": 0}],
        xfade=0.9, dim=0.50)
    return A

def build_all():
    global GRADE, VIGNETTE, GRAIN, CURSOR_TILE, SCENE_OBJS
    load_sources()
    build_cards()
    GRADE = build_grade()
    VIGNETTE = build_vignette()
    GRAIN = build_grain()
    CURSOR_TILE = build_cursor()
    SCENE_OBJS = build_scenes()

# ---------------------------------------------------------------- frame assembly
def overlay_alpha(ov, t):
    fade = ov.get("fade", 0.6)
    if t < ov["t0"] or t > ov["t1"]:
        return 0.0
    a = min(1.0, (t - ov["t0"]) / max(1e-3, fade), (ov["t1"] - t) / max(1e-3, fade))
    return D.ease(max(0.0, a))

def scene_overlay_pos(scene, ov, t):
    if "target" not in ov:
        return ov["pos"], None
    sh = scene.active(t)
    z, fx, fy = sh.camera(t)
    tgt = to_frame(SRC[sh.src], ov["target"], z, (fx, fy))
    ox, oy = ov["offset"]
    w = ov["img"].shape[1]; h = ov["img"].shape[0]
    x = min(max(28, tgt[0] + ox), W - w - 28)
    y = min(max(28, tgt[1] + oy), H - h - 28)
    return (x, y), tgt

def render_frame(t_abs, frame_no):
    scene = SCENE_OBJS[T.SCENES[0]["id"]]
    idx = 0
    for i, s in enumerate(T.SCENES):
        if t_abs >= s["start"]:
            scene = SCENE_OBJS[s["id"]]; idx = i
    t = min(t_abs - scene.start, scene.dur)

    base = scene.base(t)
    if scene.id == "prologue":
        bstart = 3.05
        k = D.ease_in_out((t - bstart) / scene.black_in) if t > bstart else 0.0
        if k < 1.0:
            base = Image.blend(Image.new("RGB", (W, H), (7, 6, 4)), base, k)

    if idx > 0 and scene.xfade > 0 and t < scene.xfade:
        prev = SCENE_OBJS[T.SCENES[idx - 1]["id"]]
        base = Image.blend(prev.base(prev.dur), base, D.ease_in_out(t / scene.xfade))

    src = np.asarray(base)
    arr = np.stack([GRADE[0][src[..., 0]], GRADE[1][src[..., 1]], GRADE[2][src[..., 2]]], axis=-1)

    for ov in scene.overlays:
        a = overlay_alpha(ov, t)
        if a <= 0.003:
            continue
        pos, tgt = scene_overlay_pos(scene, ov, t)
        rise = int((1 - D.ease(min(1.0, (t - ov["t0"]) / 0.65))) * ov.get("rise", 0))
        if ov.get("scrim"):
            composite(arr, CARDS[ov["scrim"]], 0, 0, a * ov.get("scrim_a", 0.9))
        if ov.get("leader") and tgt is not None:
            w = ov["img"].shape[1]; h = ov["img"].shape[0]
            ax = pos[0] + (w if tgt[0] < pos[0] else 0)
            ay = pos[1] + h * 0.5
            draw_leader(arr, (ax, ay), tgt, a)
        composite(arr, ov["img"], pos[0], pos[1] + rise, a * ov.get("alpha", 1.0))

    st = scene.cursor_state(t)
    if st:
        pos, age = st
        tile, tx, ty = cursor_tile(pos, age)
        composite(arr, np.asarray(tile), tx, ty, 1.0)

    arr = (arr.astype(np.float32) * VIGNETTE).astype(np.uint8)
    if scene.dim:
        arr = (arr.astype(np.float32) * scene.dim).astype(np.uint8)
    g = GRAIN[frame_no % len(GRAIN)]
    arr = np.clip(arr.astype(np.float32) + g * 3.1, 0, 255).astype(np.uint8)

    if scene.id == "coda" and t > scene.dur - 1.5:
        k = 1.0 - D.ease_in_out((t - (scene.dur - 1.5)) / 1.5)
        arr = (arr.astype(np.float32) * k).astype(np.uint8)
    if scene.id == "prologue" and t < 0.5:
        arr = (arr.astype(np.float32) * (t / 0.5)).astype(np.uint8)
    return arr

# ---------------------------------------------------------------- main
def export_cues():
    cues = {"scenes": [], "clicks": [], "total": T.TOTAL}
    for s in T.SCENES:
        cues["scenes"].append({"id": s["id"], "start": s["start"], "end": s["end"],
                               "voice": s["voice"], "voice_dur": s["voice_dur"]})
        sc = SCENE_OBJS[s["id"]]
        if sc.cursor:
            for c in sc.cursor.get("clicks", []):
                cues["clicks"].append(round(s["start"] + c, 3))
    os.makedirs("video/audio", exist_ok=True)
    with open("video/audio/cues.json", "w", encoding="utf-8") as fh:
        json.dump(cues, fh, indent=1)
    print("cues written", len(cues["clicks"]))

def render_stills(times):
    os.makedirs(STILL_DIR, exist_ok=True)
    for tt in times:
        t0 = time.time()
        arr = render_frame(tt, int(tt * FPS))
        Image.fromarray(arr).save(os.path.join(STILL_DIR, f"still-{tt:07.2f}.jpg"), quality=93, subsampling=0)
        print(f"still {tt:.2f}s  {time.time()-t0:.2f}s", flush=True)

def encode_chunk(frames, out):
    if not frames:
        return False
    start = int(os.path.basename(frames[0])[1:6])
    cmd = ["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-start_number", str(start),
           "-i", os.path.join(FRAME_DIR, "f%05d.jpg"),
           "-frames:v", str(len(frames)),
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
           "-x264-params", "keyint=60:min-keyint=30", out]
    subprocess.run(cmd, check=True)
    return True

def render_all(chunk=450):
    os.makedirs(FRAME_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in glob.glob(os.path.join(FRAME_DIR, "*.jpg")):
        os.remove(f)
    total = int(round(T.TOTAL * FPS))
    for f in range(total):
        arr = render_frame(f / FPS, f)
        Image.fromarray(arr).save(os.path.join(FRAME_DIR, f"f{f + 1:05d}.jpg"), quality=95, subsampling=0)
        if f % 150 == 0:
            print(f"frame {f}/{total}  ({f/FPS:.1f}s)", flush=True)
    files = sorted(glob.glob(os.path.join(FRAME_DIR, "f*.jpg")))
    parts = []
    for i in range(0, len(files), chunk):
        grp = files[i:i + chunk]
        part = os.path.join(OUT_DIR, f"part-{i//chunk:03d}.mp4")
        encode_chunk(grp, part)
        parts.append(part)
        print("encoded", part, flush=True)
    with open(os.path.join(OUT_DIR, "parts.txt"), "w", encoding="utf-8") as fh:
        for p in parts:
            fh.write("file '" + os.path.abspath(p).replace("\\", "/") + "'" + chr(10))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
                    "-i", os.path.join(OUT_DIR, "parts.txt"), "-c", "copy",
                    os.path.join(OUT_DIR, "video-only.mp4")], check=True)
    print("video-only.mp4 done")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", type=str, default="")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--chunk", type=int, default=450)
    ap.add_argument("--from-frame", type=int, default=0)
    ap.add_argument("--to-frame", type=int, default=0)
    args = ap.parse_args()
    build_all()
    print("timeline total", T.TOTAL, "frames", int(round(T.TOTAL * FPS)))
    export_cues()
    if args.stills:
        render_stills([float(x) for x in args.stills.split(",")])
    if args.from_frame or args.to_frame:
        a = args.from_frame
        b = args.to_frame or int(round(T.TOTAL * FPS))
        os.makedirs(FRAME_DIR, exist_ok=True)
        for f in range(a, b):
            arr = render_frame(f / FPS, f)
            Image.fromarray(arr).save(os.path.join(FRAME_DIR, f"f{f + 1:05d}.jpg"), quality=95, subsampling=0)
            if (f - a) % 100 == 0:
                print(f"frame {f}/{b}", flush=True)
        print("range done", a, b)
    if args.all:
        render_all(args.chunk)
