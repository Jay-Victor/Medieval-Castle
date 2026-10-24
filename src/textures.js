import * as THREE from "three";

/* Procedural surfaces painted once, at load, in a 2D canvas. Keeping
   the texture library hand-made (rather than photographic) preserves
   the illuminated-model quality of the whole scene. */

const rng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

function canvas(size = 512, height = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = height;
  return c;
}

function texture(c, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function speckle(ctx, w, h, count, amount, seed) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const a = r() * amount;
    const v = r() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
    const s = 0.6 + r() * 2.0;
    ctx.fillRect(r() * w, r() * h, s, s);
  }
}

function makeStone(seed = 1, base = [190, 176, 151], mortar = [120, 109, 91]) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = `rgb(${mortar[0]},${mortar[1]},${mortar[2]})`;
  ctx.fillRect(0, 0, size, size);

  const rowH = 46;
  for (let row = -1; row < 13; row++) {
    let x = row % 2 === 0 ? -30 : -92;
    while (x < size + 40) {
      const w = 72 + Math.floor(r() * 66);
      const y = row * rowH;
      const shade = -18 + Math.floor(r() * 34);
      const hue = 30 + Math.floor(r() * 9);
      const sat = 13 + Math.floor(r() * 8);
      const light = Math.max(42, Math.min(79, 65 + shade));
      ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
      ctx.fillRect(x + 2, y + 2, w - 4, rowH - 4);
      ctx.strokeStyle = "rgba(82, 71, 55, .28)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2.5, y + 2.5, w - 5, rowH - 5);
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.fillRect(x + 4, y + 4, w - 8, 2);
      ctx.fillStyle = "rgba(46,37,26,.10)";
      ctx.fillRect(x + 4, y + rowH - 6, w - 8, 2);
      // mineral stains and hairline fissures
      if (r() > 0.55) {
        ctx.strokeStyle = `rgba(68,55,39,${0.08 + r() * 0.1})`;
        ctx.beginPath();
        let px = x + 8 + r() * (w - 16);
        let py = y + 7;
        ctx.moveTo(px, py);
        for (let k = 0; k < 4; k++) {
          px += (r() - 0.5) * 14;
          py += rowH / 5;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      x += w;
    }
  }
  speckle(ctx, size, size, 2600, 0.12, seed + 8);
  return texture(c);
}

function makeSlate(seed = 3) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#3d464c";
  ctx.fillRect(0, 0, size, size);
  const rowH = 34;
  for (let row = -1; row < 17; row++) {
    const offset = row % 2 === 0 ? -26 : 0;
    for (let x = offset; x < size + 40; x += 42) {
      const tone = 31 + r() * 18;
      ctx.fillStyle = `hsl(${198 + r() * 14} 12% ${tone}%)`;
      ctx.beginPath();
      ctx.moveTo(x + 1, row * rowH + 1);
      ctx.lineTo(x + 40, row * rowH + 1);
      ctx.lineTo(x + 40, row * rowH + rowH - 5);
      ctx.quadraticCurveTo(x + 20, row * rowH + rowH + 3, x + 1, row * rowH + rowH - 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(12,18,21,.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(223,233,232,.08)";
      ctx.fillRect(x + 2, row * rowH + 2, 36, 1);
      if (r() > 0.54) {
        ctx.fillStyle = `rgba(105,127,106,${r() * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(x + 8 + r() * 24, row * rowH + 8 + r() * 18, 5 + r() * 10, 2 + r() * 5, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  speckle(ctx, size, size, 1800, 0.18, seed + 2);
  return texture(c);
}

function makeWood(seed = 5, dark = false) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = dark ? "#4a2e1c" : "#8d623b";
  ctx.fillRect(0, 0, size, size);
  const plank = 64;
  for (let x = 0; x < size; x += plank) {
    const l = dark ? 22 + r() * 9 : 35 + r() * 10;
    ctx.fillStyle = `hsl(${27 + r() * 6} ${dark ? 38 : 35}% ${l}%)`;
    ctx.fillRect(x + 1, 0, plank - 2, size);
    ctx.fillStyle = "rgba(26,14,7,.4)";
    ctx.fillRect(x, 0, 1.5, size);
    ctx.fillStyle = "rgba(255,226,180,.07)";
    ctx.fillRect(x + 2, 0, 1, size);
    // grain
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(${dark ? "20,10,5" : "49,29,14"},${0.04 + r() * 0.12})`;
      ctx.lineWidth = 0.5 + r();
      const yy = r() * size;
      ctx.beginPath();
      ctx.moveTo(x + 3, yy);
      ctx.bezierCurveTo(x + plank * 0.3, yy - 5 + r() * 10, x + plank * 0.7, yy - 7 + r() * 14, x + plank - 3, yy + (r() - 0.5) * 10);
      ctx.stroke();
    }
    if (r() > 0.7) {
      ctx.strokeStyle = "rgba(30,14,6,.28)";
      ctx.beginPath();
      ctx.ellipse(x + 16 + r() * 30, r() * size, 3 + r() * 3, 8 + r() * 13, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  speckle(ctx, size, size, 700, 0.07, seed);
  return texture(c);
}

function makeCobble(seed = 7) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#645d51";
  ctx.fillRect(0, 0, size, size);
  const cell = 34;
  for (let y = -1; y < 17; y++) {
    for (let x = -1; x < 17; x++) {
      const cx = x * cell + (y % 2) * cell * 0.5 + (r() - 0.5) * 6;
      const cy = y * cell * 0.8 + (r() - 0.5) * 6;
      const rx = 10 + r() * 6;
      const ry = 7 + r() * 4;
      const light = 42 + r() * 17;
      ctx.fillStyle = `hsl(${33 + r() * 9} 10% ${light}%)`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (r() - 0.5) * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(30,25,20,.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(240,230,210,.08)";
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy - 2, rx * 0.55, ry * 0.3, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  speckle(ctx, size, size, 2500, 0.13, seed + 10);
  return texture(c);
}

function makeGrass(seed = 9) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#66734c";
  ctx.fillRect(0, 0, size, size);
  // broad tonal patches
  for (let i = 0; i < 70; i++) {
    const g = ctx.createRadialGradient(r() * size, r() * size, 0, r() * size, r() * size, 20 + r() * 90);
    const light = r() > 0.5 ? "rgba(130,145,93,.12)" : "rgba(49,61,38,.15)";
    g.addColorStop(0, light);
    g.addColorStop(1, "rgba(90,105,65,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  for (let i = 0; i < 5000; i++) {
    const x = r() * size;
    const y = r() * size;
    ctx.strokeStyle = `hsla(${77 + r() * 26} ${25 + r() * 24}% ${24 + r() * 30}% / ${0.10 + r() * 0.32})`;
    ctx.lineWidth = 0.5 + r() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 180; i++) {
    // tiny wildflowers, used sparingly in the outer meadow
    ctx.fillStyle = r() > 0.5 ? "rgba(236,223,188,.5)" : "rgba(196,155,94,.42)";
    ctx.beginPath();
    ctx.arc(r() * size, r() * size, 0.7 + r() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, size, size, 2300, 0.09, seed + 3);
  return texture(c);
}

function makeGravel(seed = 11) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#b9a780";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4500; i++) {
    const light = 45 + r() * 34;
    ctx.fillStyle = `hsl(${34 + r() * 14} ${7 + r() * 15}% ${light}%)`;
    ctx.beginPath();
    ctx.ellipse(r() * size, r() * size, 1 + r() * 3.1, 0.8 + r() * 2.2, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, size, size, 900, 0.12, seed);
  return texture(c);
}

function makeStoneFloor(seed = 13) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#7e7463";
  ctx.fillRect(0, 0, size, size);
  const tile = 128;
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const l = 56 + r() * 13;
      ctx.fillStyle = `hsl(${38 + r() * 7} 14% ${l}%)`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      ctx.strokeStyle = "rgba(52,43,31,.32)";
      ctx.strokeRect(x + 2.5, y + 2.5, tile - 5, tile - 5);
      ctx.fillStyle = "rgba(255,248,230,.07)";
      ctx.fillRect(x + 4, y + 4, tile - 8, 1.5);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(52,41,29,${0.05 + r() * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(x + r() * tile, y + r() * tile);
        ctx.lineTo(x + r() * tile, y + r() * tile);
        ctx.stroke();
      }
    }
  }
  speckle(ctx, size, size, 1400, 0.1, seed + 4);
  return texture(c);
}

function makeWaterBump(seed = 15) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 95; i++) {
    const y = r() * size;
    const amp = 4 + r() * 11;
    ctx.strokeStyle = `rgba(${150 + r() * 80},${150 + r() * 80},${150 + r() * 80},${0.13 + r() * 0.3})`;
    ctx.lineWidth = 0.8 + r() * 2.2;
    ctx.beginPath();
    for (let x = -10; x < size + 10; x += 12) {
      const yy = y + Math.sin((x / size) * Math.PI * (3 + r() * 5) + i) * amp;
      if (x === -10) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  return texture(c, { srgb: false });
}

function makeTapestry(seed = 21, scheme = "crimson") {
  const w = 384;
  const h = 620;
  const c = canvas(w, h);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  const crimson = scheme === "crimson";
  const bg = crimson ? "#5b2621" : "#243d40";
  const bg2 = crimson ? "#40201d" : "#192e32";
  const gold = "#c3a267";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = bg2;
  for (let i = 0; i < 90; i++) {
    ctx.fillRect(r() * w, r() * h, 2 + r() * 12, 1 + r() * 2);
  }
  // woven border
  ctx.strokeStyle = gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.strokeStyle = "rgba(195,162,103,.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  for (let x = 34; x < w - 34; x += 26) {
    ctx.beginPath();
    ctx.arc(x, 33, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, h - 33, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // stylized hunting scene / stags under a tree
  ctx.strokeStyle = "rgba(211,180,123,.7)";
  ctx.fillStyle = "rgba(208,175,116,.15)";
  ctx.lineWidth = 2;
  // tree
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.72);
  ctx.lineTo(w * 0.5, h * 0.36);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.3, 55, 90, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.5 + Math.cos(a) * 35, h * 0.3 + Math.sin(a) * 54, 15 + r() * 18, 8 + r() * 12, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  // stag silhouette
  ctx.save();
  ctx.translate(w * 0.38, h * 0.64);
  ctx.scale(0.9, 0.9);
  ctx.strokeStyle = "rgba(225,198,145,.84)";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-20, 2);
  ctx.bezierCurveTo(-32, 2, -38, -15, -32, -29);
  ctx.bezierCurveTo(-28, -38, -15, -40, -10, -51);
  ctx.lineTo(-8, -68);
  ctx.moveTo(-8, -48);
  ctx.bezierCurveTo(0, -53, 4, -61, 2, -70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.bezierCurveTo(-4, 0, 24, -7, 37, -24);
  ctx.bezierCurveTo(43, -33, 49, -34, 53, -30);
  ctx.bezierCurveTo(50, -25, 44, -22, 39, -23);
  ctx.moveTo(-8, -68);
  ctx.lineTo(-1, -54);
  ctx.lineTo(8, -54);
  ctx.moveTo(-14, -65);
  ctx.lineTo(-24, -55);
  ctx.moveTo(-9, 0);
  ctx.lineTo(-14, 18);
  ctx.moveTo(22, -7);
  ctx.lineTo(26, 12);
  ctx.stroke();
  ctx.restore();
  // little floral motifs in corners
  for (const [x, y] of [[w * 0.22, h * 0.18], [w * 0.78, h * 0.18], [w * 0.22, h * 0.82], [w * 0.78, h * 0.82]]) {
    ctx.strokeStyle = "rgba(195,162,103,.45)";
    ctx.beginPath();
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      ctx.ellipse(x + Math.cos(ang) * 13, y + Math.sin(ang) * 13, 6, 2.5, ang, 0, Math.PI * 2);
    }
    ctx.stroke();
  }
  // woven vertical threads and aging
  ctx.globalAlpha = 0.09;
  for (let x = 0; x < w; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "#f1d59c" : "#1e1210";
    ctx.fillRect(x, 0, 1, h);
  }
  ctx.globalAlpha = 1;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,226,176,.09)");
  grad.addColorStop(0.5, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return texture(c);
}

function makeBanner(seed = 31) {
  const w = 340;
  const h = 540;
  const c = canvas(w, h);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#7a2f26");
  grad.addColorStop(1, "#4a1c19");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // forked swallowtail at the bottom
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w / 2, h - 58);
  ctx.lineTo(w, h);
  ctx.lineTo(w, h - 2);
  ctx.lineTo(0, h - 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#c5a15f";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 19, w - 40, h - 41);
  ctx.strokeStyle = "rgba(197,161,95,.34)";
  ctx.lineWidth = 1;
  ctx.strokeRect(31, 30, w - 62, h - 62);
  // fleur mark
  ctx.save();
  ctx.translate(w / 2, h * 0.48);
  ctx.fillStyle = "#c7a259";
  ctx.strokeStyle = "rgba(56,30,21,.5)";
  ctx.lineWidth = 2;
  const petal = (cx, cy, sx, sy, rot) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-sx * 0.9, -sy * 0.22, -sx * 0.8, -sy, 0, -sy * 1.1);
    ctx.bezierCurveTo(sx * 0.8, -sy, sx * 0.9, -sy * 0.22, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  petal(0, 35, 50, 100, 0);
  petal(-42, 4, 37, 79, -0.42);
  petal(42, 4, 37, 79, 0.42);
  ctx.beginPath();
  ctx.ellipse(0, 20, 19, 49, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#c7a259";
  for (let x = 58; x < w - 44; x += 29) {
    ctx.beginPath();
    ctx.arc(x, 61, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, h - 57, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const aging = ctx.createLinearGradient(0, 0, 0, h);
  aging.addColorStop(0, "rgba(255,227,175,.12)");
  aging.addColorStop(1, "rgba(18,8,6,.22)");
  ctx.fillStyle = aging;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = `rgba(218,185,125,${r() * 0.12})`;
    ctx.fillRect(r() * w, r() * h, 1, 5 + r() * 20);
  }
  return texture(c);
}

function makeStainedGlass(seed = 41) {
  const w = 320;
  const h = 520;
  const c = canvas(w, h);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#18222a";
  ctx.fillRect(0, 0, w, h);
  const colors = ["#b65433", "#c88d3d", "#527e86", "#45664a", "#7a3c45", "#d1b56b", "#5b4e79"];
  // geometric leaded glass shards
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(30, 24, w - 60, h - 45, [150, 150, 8, 8]);
  ctx.clip();
  for (let i = 0; i < 96; i++) {
    const x = r() * w;
    const y = r() * h;
    const size = 12 + r() * 38;
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = 0.68 + r() * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const sides = 3 + Math.floor(r() * 3);
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2;
      ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(18,23,28,.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // central rose
  const cx = w / 2;
  const cy = h * 0.42;
  for (let ring = 3; ring >= 1; ring--) {
    const rr = ring * 38;
    for (let petal = 0; petal < 8; petal++) {
      const a = (petal / 8) * Math.PI * 2;
      ctx.fillStyle = ring === 2 ? "rgba(191,151,79,.65)" : "rgba(146,66,50,.55)";
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * rr * 0.65, cy + Math.sin(a) * rr * 0.65, rr * 0.36, rr * 0.18, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(16,21,25,.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(214,186,120,.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "#0d1419";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.roundRect(23, 17, w - 46, h - 34, [160, 160, 8, 8]);
  ctx.stroke();
  ctx.strokeStyle = "#c7a15e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(37, 31, w - 74, h - 62, [144, 144, 4, 4]);
  ctx.stroke();
  // lead cames
  ctx.strokeStyle = "rgba(12,18,22,.65)";
  ctx.lineWidth = 1.3;
  for (let x = 45; x < w - 30; x += 35) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x + 12, h - 40);
    ctx.stroke();
  }
  return texture(c);
}

function makeWindowGlow(seed = 43) {
  const size = 256;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d6b271";
  ctx.fillRect(0, 0, size, size);
  // leaded diamond quarries
  ctx.strokeStyle = "rgba(43,33,22,.55)";
  ctx.lineWidth = 3;
  for (let i = -size; i < size * 2; i += 42) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(35,27,17,.8)";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, size - 12, size - 12);
  ctx.strokeStyle = "rgba(35,27,17,.55)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "rgba(255,243,197,.32)");
  grad.addColorStop(1, "rgba(99,68,30,.2)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return texture(c);
}

function makeRug(seed = 51, style = "aurelia") {
  const w = 512;
  const h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  const palettes = {
    aurelia: ["#7b2f27", "#263d43", "#b79762", "#d6c4a0"],
    solar: ["#3e4f5a", "#7c3b2e", "#b39a68", "#d5c7ab"],
    library: ["#394837", "#6b3028", "#a78e5d", "#d9cba9"]
  };
  const p = palettes[style] || palettes.aurelia;
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = p[2];
  ctx.lineWidth = 8;
  ctx.strokeRect(15, 15, w - 30, h - 30);
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, w - 60, h - 60);
  ctx.strokeStyle = p[1];
  ctx.lineWidth = 11;
  ctx.strokeRect(48, 48, w - 96, h - 96);
  ctx.fillStyle = p[1];
  ctx.fillRect(68, 68, w - 136, h - 136);
  // geometric field
  ctx.strokeStyle = "rgba(214,196,160,.34)";
  ctx.lineWidth = 1;
  for (let i = 72; i < w - 68; i += 23) {
    ctx.beginPath();
    ctx.moveTo(i, 68);
    ctx.lineTo(i, h - 68);
    ctx.stroke();
  }
  for (let i = 72; i < h - 68; i += 23) {
    ctx.beginPath();
    ctx.moveTo(68, i);
    ctx.lineTo(w - 68, i);
    ctx.stroke();
  }
  // central medallion
  ctx.save();
  ctx.translate(w / 2, h / 2);
  for (let ring = 4; ring > 0; ring--) {
    ctx.strokeStyle = ring % 2 === 0 ? p[2] : "rgba(214,196,160,.55)";
    ctx.lineWidth = ring === 4 ? 4 : 1.5;
    ctx.beginPath();
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const rad = ring * 31 + (a % 2 ? 9 : -3);
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = p[2];
  ctx.beginPath();
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const rad = a % 2 ? 33 : 10;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (a === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // corner motifs
  for (const [x, y] of [[89, 89], [w - 89, 89], [89, h - 89], [w - 89, h - 89]]) {
    ctx.strokeStyle = p[2];
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const px = x + Math.cos(ang) * 18;
      const py = y + Math.sin(ang) * 18;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // wear
  for (let i = 0; i < 350; i++) {
    ctx.fillStyle = `rgba(235,218,187,${r() * 0.1})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 5, 1);
  }
  return texture(c);
}

function makeRadial(colorStops) {
  const size = 128;
  const c = canvas(size);
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  colorStops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function makeParchmentMap(seed = 61) {
  const w = 512;
  const h = 340;
  const c = canvas(w, h);
  const ctx = c.getContext("2d");
  const r = rng(seed);
  ctx.fillStyle = "#d9c8a6";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 250; i++) {
    ctx.strokeStyle = `rgba(104,78,43,${r() * 0.12})`;
    ctx.lineWidth = 0.5 + r();
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, 3 + r() * 25, r() * 6, r() * 6 + 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(102,70,34,.55)";
  ctx.lineWidth = 1;
  // castle plan sketch
  ctx.strokeRect(w * 0.33, h * 0.28, w * 0.36, h * 0.46);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(w * (0.33 + (i % 2) * 0.36), h * (0.28 + Math.floor(i / 2) * 0.46), 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.28);
  ctx.lineTo(w * 0.45, h * 0.48);
  ctx.lineTo(w * 0.57, h * 0.74);
  ctx.lineTo(w * 0.57, h * 0.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.33, h * 0.28, 33, 0, Math.PI * 2);
  ctx.stroke();
  const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
  grad.addColorStop(0, "rgba(255,245,218,0)");
  grad.addColorStop(1, "rgba(88,59,25,.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return texture(c);
}

export function createTextureLibrary() {
  const stone = makeStone(1);
  const stoneLight = makeStone(7, [207, 194, 170], [141, 128, 108]);
  const stoneDark = makeStone(12, [149, 138, 121], [93, 84, 70]);
  const slate = makeSlate(4);
  const wood = makeWood(5);
  const woodDark = makeWood(17, true);
  const cobble = makeCobble(8);
  const grass = makeGrass(10);
  const gravel = makeGravel(12);
  const stoneFloor = makeStoneFloor(14);
  const waterBump = makeWaterBump(16);
  const tapestryCrimson = makeTapestry(22, "crimson");
  const tapestryIndigo = makeTapestry(27, "indigo");
  const banner = makeBanner(32);
  const stainedGlass = makeStainedGlass(42);
  const windowGlow = makeWindowGlow(44);
  const rugAurelia = makeRug(52, "aurelia");
  const rugSolar = makeRug(57, "solar");
  const rugLibrary = makeRug(63, "library");
  const smoke = makeRadial([
    [0, "rgba(255,255,255,.36)"],
    [0.45, "rgba(225,223,214,.15)"],
    [1, "rgba(190,190,180,0)"]
  ]);
  const glow = makeRadial([
    [0, "rgba(255,229,168,.9)"],
    [0.25, "rgba(255,193,97,.44)"],
    [1, "rgba(255,170,70,0)"]
  ]);
  const parchmentMap = makeParchmentMap(62);

  return {
    stone,
    stoneLight,
    stoneDark,
    slate,
    wood,
    woodDark,
    cobble,
    grass,
    gravel,
    stoneFloor,
    waterBump,
    tapestryCrimson,
    tapestryIndigo,
    banner,
    stainedGlass,
    windowGlow,
    rugAurelia,
    rugSolar,
    rugLibrary,
    smoke,
    glow,
    parchmentMap
  };
}

export function applyTextureQuality(textures, maxAnisotropy = 8) {
  Object.values(textures).forEach((t) => {
    if (t && "anisotropy" in t) {
      t.anisotropy = Math.min(maxAnisotropy, 8);
      t.needsUpdate = true;
    }
  });
}
