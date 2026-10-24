import * as THREE from "three";
import {
  box,
  cylinder,
  sphere,
  plane,
  rng,
  TAU
} from "./helpers.js";
import { FurnitureBuilder, createFurniturePiece, makeWavyCloth } from "./furniture-builder.js";

function finish(piece, name) {
  piece.builder.finish(name);
  return piece.group;
}

function register(audit, roomId, id, label, group, options = {}) {
  if (!audit) return;
  audit.register(id, roomId, group, { label, ...options });
}

function lightFromLocal(state, group, local, config) {
  group.updateWorldMatrix(true, true);
  const p = group.localToWorld(new THREE.Vector3(local[0], local[1], local[2]));
  state.lightSpots.push({
    position: new THREE.Vector3(p.x, p.y, p.z),
    color: config.color || 0xffa65d,
    intensity: config.intensity ?? 0.8,
    distance: config.distance || 6,
    type: config.type || "room",
    room: config.room || null,
    floor: config.floor ?? 0
  });
}

/* ─────────────────────────── Seating ─────────────────────────── */

export function makeChair(parent, mats, x, y, z, rotY = 0, options = {}) {
  const {
    name = "oak-chair",
    cushion = mats.clothCrimson,
    arm = false,
    scale = 1,
    gold = false
  } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  const wood = mats.woodDark;
  const g = mats.goldAntique;

  for (const lx of [-0.23, 0.23]) {
    for (const lz of [-0.21, 0.21]) {
      b.cylinder(0.034, 0.047, 0.44, wood, lx, 0.23, lz, { segments: 10 });
      b.sphere(0.04, wood, lx, 0.03, lz, { width: 7, height: 5 });
      b.cylinder(0.055, 0.055, 0.045, wood, lx, 0.36, lz, { segments: 10 });
    }
  }
  b.box(0.54, 0.08, 0.49, wood, 0, 0.46, 0, { round: 0.012 });
  b.box(0.52, 0.055, 0.47, wood, 0, 0.505, 0, { round: 0.03 });
  b.box(0.49, 0.07, 0.43, cushion, 0, 0.555, 0.005, { round: 0.045 });
  for (const lx of [-0.23, 0.23]) {
    b.cylinder(0.025, 0.03, 0.66, wood, lx, 0.82, -0.215, { segments: 9 });
    b.sphere(0.042, gold ? g : wood, lx, 1.155, -0.215, { width: 7, height: 5 });
  }
  b.box(0.51, 0.1, 0.055, wood, 0, 1.1, -0.22, { round: 0.025 });
  b.box(0.44, 0.055, 0.04, wood, 0, 0.78, -0.22, { round: 0.02 });
  for (const lx of [-0.15, 0, 0.15]) {
    b.box(0.033, 0.26, 0.026, wood, lx, 0.92, -0.22, { round: 0.008 });
  }
  if (arm) {
    for (const lx of [-0.31, 0.31]) {
      b.cylinder(0.03, 0.04, 0.5, wood, lx, 0.45, 0.02, { segments: 8 });
      b.box(0.06, 0.07, 0.48, wood, lx, 0.69, -0.01, { round: 0.02 });
      b.sphere(0.045, wood, lx, 0.73, 0.2, { width: 7, height: 5 });
    }
    b.box(0.09, 0.015, 0.37, mats.leather, 0, 0.62, 0.08, { round: 0.03 });
  }
  if (gold) {
    b.box(0.38, 0.035, 0.035, g, 0, 1.045, -0.235, { round: 0.012 });
    b.sphere(0.035, g, 0, 1.18, -0.235, { width: 6, height: 4 });
  }
  const cloth = b.finish(name + "-parts");
  void cloth;
  piece.group.scale.setScalar(scale);
  return piece.group;
}

export function makeThrone(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "high-seat", x, y, z, rotY);
  const b = piece.builder;
  makeThroneShape(b, mats);
  finish(piece, "throne");
  return piece.group;
}

function makeThroneShape(b, mats) {
  const wood = mats.woodDark;
  const g = mats.gold;
  for (const lx of [-0.31, 0.31]) {
    for (const lz of [-0.27, 0.27]) {
      b.cylinder(0.045, 0.06, 0.5, wood, lx, 0.27, lz, { segments: 10 });
      b.sphere(0.06, g, lx, 0.03, lz, { width: 7, height: 5 });
    }
  }
  b.box(0.76, 0.12, 0.66, wood, 0, 0.55, 0, { round: 0.02 });
  b.box(0.62, 0.09, 0.54, mats.clothCrimson, 0, 0.65, 0.02, { round: 0.05 });
  // high back, carved
  b.box(0.78, 0.16, 0.09, wood, 0, 1.64, -0.3, { round: 0.03 });
  b.box(0.64, 0.75, 0.08, mats.clothCrimsonDeep, 0, 1.22, -0.31, { round: 0.03 });
  b.box(0.9, 0.1, 0.1, g, 0, 1.75, -0.3, { round: 0.025 });
  for (const lx of [-0.36, 0.36]) {
    b.cylinder(0.04, 0.05, 1.15, wood, lx, 1.13, -0.3, { segments: 9 });
    b.sphere(0.07, g, lx, 1.77, -0.3, { width: 7, height: 5 });
    b.cone(0.06, 0.22, g, lx, 1.9, -0.3, { segments: 6 });
  }
  for (const lx of [-0.37, 0.37]) {
    b.cylinder(0.035, 0.045, 0.7, wood, lx, 0.62, 0.05, { segments: 8 });
    b.box(0.08, 0.09, 0.59, wood, lx, 0.92, 0.02, { round: 0.03 });
    b.sphere(0.055, g, lx, 0.96, 0.26, { width: 7, height: 5 });
  }
  // crown finial
  b.sphere(0.14, g, 0, 1.94, -0.3, { width: 8, height: 6, sy: 1.4 });
  b.cone(0.08, 0.22, g, 0, 2.14, -0.3, { segments: 6 });
  // gold nails
  for (const lx of [-0.24, 0, 0.24]) {
    b.sphere(0.03, g, lx, 1.55, -0.26, { width: 6, height: 4 });
  }
}

export function makeArmchair(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { fabric = mats.velvetGreen } = options;
  const piece = createFurniturePiece(parent, "wing-armchair", x, y, z, rotY);
  const b = piece.builder;
  const wood = mats.woodDark;
  for (const lx of [-0.34, 0.34]) {
    for (const lz of [-0.29, 0.29]) {
      b.cylinder(0.045, 0.055, 0.38, wood, lx, 0.2, lz, { segments: 9 });
      b.sphere(0.048, wood, lx, 0.03, lz, { width: 7, height: 5 });
    }
  }
  b.box(0.82, 0.14, 0.7, wood, 0, 0.43, 0, { round: 0.03 });
  b.box(0.7, 0.14, 0.62, fabric, 0, 0.54, 0.02, { round: 0.06 });
  b.box(0.8, 0.2, 0.18, fabric, 0, 0.63, -0.31, { round: 0.05 });
  b.box(0.76, 0.9, 0.16, wood, 0, 1.03, -0.31, { round: 0.03 });
  b.box(0.65, 0.78, 0.12, fabric, 0, 1.04, -0.23, { round: 0.05 });
  b.box(0.14, 0.5, 0.58, wood, -0.37, 0.77, -0.02, { round: 0.03 });
  b.box(0.14, 0.5, 0.58, wood, 0.37, 0.77, -0.02, { round: 0.03 });
  b.box(0.13, 0.06, 0.53, fabric, -0.37, 1.03, 0, { round: 0.035 });
  b.box(0.13, 0.06, 0.53, fabric, 0.37, 1.03, 0, { round: 0.035 });
  b.box(0.5, 0.075, 0.06, mats.goldAntique, 0, 1.48, -0.3, { round: 0.02 });
  b.sphere(0.06, mats.goldAntique, -0.37, 1.51, -0.26, { width: 6, height: 4 });
  b.sphere(0.06, mats.goldAntique, 0.37, 1.51, -0.26, { width: 6, height: 4 });
  finish(piece, "armchair");
  return piece.group;
}

export function makeStool(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "three-leg-stool", x, y, z, rotY);
  const b = piece.builder;
  b.cylinder(0.25, 0.24, 0.08, mats.woodDark, 0, 0.47, 0, { segments: 12 });
  b.cylinder(0.18, 0.2, 0.06, mats.leather, 0, 0.53, 0, { segments: 10 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    b.cylinder(0.025, 0.035, 0.44, mats.woodDark, Math.cos(a) * 0.17, 0.23, Math.sin(a) * 0.17, { segments: 7 });
  }
  finish(piece, "stool");
  return piece.group;
}

/* ─────────────────────────── Tables ─────────────────────────── */

export function makeTable(parent, mats, x, y, z, rotY = 0, options = {}) {
  const {
    name = "oak-table",
    w = 5.8,
    d = 1.4,
    h = 0.9,
    topMat = mats.wood,
    legMat = mats.woodDark,
    trestle = false,
    apron = true
  } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  b.box(w, 0.12, d, topMat, 0, h - 0.06, 0, { round: 0.025 });
  b.box(w - 0.08, 0.045, d + 0.04, legMat, 0, h - 0.14, 0, { round: 0.015 });
  // plank seams
  for (let i = 1; i < 4; i++) {
    b.box(0.025, 0.012, d - 0.04, legMat, -w / 2 + (i * w) / 4, h + 0.006, 0, {});
  }
  if (trestle) {
    for (const sx of [-1, 1]) {
      const px = sx * (w / 2 - 0.5);
      b.box(0.2, h - 0.2, 0.18, legMat, px, (h - 0.2) / 2, 0, { round: 0.02 });
      b.box(0.2, 0.16, d - 0.2, legMat, px, 0.12, 0, { round: 0.02 });
      for (const sz of [-1, 1]) {
        b.box(0.14, h - 0.32, 0.14, legMat, px + sx * 0.32, (h - 0.32) / 2, sz * (d / 2 - 0.24), {
          rx: 0,
          rz: sx * 0.16,
          round: 0.02
        });
      }
    }
    b.box(w - 1.15, 0.13, 0.16, legMat, 0, 0.34, 0, { round: 0.02 });
  } else {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        b.cylinder(0.06, 0.085, h - 0.15, legMat, sx * (w / 2 - 0.28), (h - 0.15) / 2, sz * (d / 2 - 0.2), { segments: 8 });
        b.sphere(0.075, legMat, sx * (w / 2 - 0.28), 0.06, sz * (d / 2 - 0.2), { width: 7, height: 5 });
      }
    }
    if (apron) {
      b.box(w - 0.55, 0.14, 0.1, legMat, 0, h - 0.25, d / 2 - 0.17, { round: 0.02 });
      b.box(w - 0.55, 0.14, 0.1, legMat, 0, h - 0.25, -d / 2 + 0.17, { round: 0.02 });
      b.box(0.1, 0.14, d - 0.56, legMat, w / 2 - 0.24, h - 0.25, 0, { round: 0.02 });
      b.box(0.1, 0.14, d - 0.56, legMat, -w / 2 + 0.24, h - 0.25, 0, { round: 0.02 });
    }
  }
  finish(piece, name);
  return piece.group;
}

export function makeRoundTable(parent, mats, x, y, z, radius = 0.6, options = {}) {
  const { name = "round-table", height = 0.78, cloth = null } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, 0);
  const b = piece.builder;
  b.cylinder(radius, radius * 0.92, 0.09, mats.wood, 0, height - 0.045, 0, { segments: 24 });
  if (cloth) b.cylinder(radius + 0.03, radius + 0.06, 0.035, cloth, 0, height + 0.02, 0, { segments: 24 });
  b.cylinder(0.07, 0.1, height - 0.15, mats.woodDark, 0, (height - 0.15) / 2, 0, { segments: 10 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.2;
    b.box(0.12, 0.08, 0.5, mats.woodDark, Math.cos(a) * 0.2, 0.07, Math.sin(a) * 0.2, {
      ry: -a,
      rz: 0.02,
      round: 0.02
    });
  }
  b.sphere(0.11, mats.woodDark, 0, 0.14, 0, { width: 8, height: 6, sy: 0.6 });
  finish(piece, name);
  return piece.group;
}

export function makeBench(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "bench", length = 2.1, depth = 0.46, back = false } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  b.box(length, 0.1, depth, mats.wood, 0, 0.46, 0, { round: 0.025 });
  for (const sx of [-1, 1]) {
    b.box(0.12, 0.42, depth - 0.08, mats.woodDark, sx * (length / 2 - 0.18), 0.21, 0, { round: 0.02 });
    if (back) {
      b.cylinder(0.03, 0.04, 0.95, mats.woodDark, sx * (length / 2 - 0.16), 0.95, -depth / 2 + 0.09, { segments: 8 });
    }
  }
  if (back) {
    b.box(length - 0.22, 0.16, 0.06, mats.woodDark, 0, 1.35, -depth / 2 + 0.09, { round: 0.02 });
    b.box(length - 0.22, 0.08, 0.045, mats.woodDark, 0, 0.98, -depth / 2 + 0.09, { round: 0.015 });
    for (let i = -2; i <= 2; i++) {
      b.box(0.035, 0.42, 0.035, mats.woodDark, (i * (length - 0.5)) / 5, 1.16, -depth / 2 + 0.09, { round: 0.008 });
    }
  }
  finish(piece, name);
  return piece.group;
}

/* ─────────────────────────── Storage & desks ─────────────────────────── */

export function makeChest(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "iron-bound-chest", w = 1.55, h = 0.55, d = 0.55 } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  b.box(w, h - 0.12, d, mats.woodDark, 0, (h - 0.12) / 2 + 0.06, 0, { round: 0.025 });
  b.box(w + 0.04, 0.14, d + 0.03, mats.wood, 0, h - 0.07, 0, { round: 0.035, rx: 0.01 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.sphere(0.065, mats.iron, sx * (w / 2 - 0.1), 0.05, sz * (d / 2 - 0.08), { width: 7, height: 5 });
    }
  }
  for (const sx of [-w * 0.31, w * 0.31]) {
    b.box(0.09, h - 0.05, d + 0.035, mats.iron, sx, (h - 0.05) / 2, 0, { round: 0.01 });
    b.box(0.22, 0.16, 0.04, mats.iron, sx, h * 0.76, d / 2 + 0.03, { round: 0.015 });
  }
  b.box(0.15, 0.2, 0.04, mats.goldAntique, 0, h - 0.12, d / 2 + 0.04, { round: 0.02 });
  b.sphere(0.035, mats.iron, 0, h - 0.12, d / 2 + 0.07, { width: 6, height: 4 });
  finish(piece, name);
  return piece.group;
}

export function makeWardrobe(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "wardrobe", w = 1.65, h = 2.15, d = 0.64 } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  b.box(w, h, d, mats.woodDark, 0, h / 2, 0, { round: 0.035 });
  b.box(w + 0.12, 0.12, d + 0.1, mats.wood, 0, h - 0.06, 0, { round: 0.03 });
  b.box(w + 0.05, 0.12, d + 0.05, mats.wood, 0, 0.07, 0, { round: 0.025 });
  b.box(w - 0.16, h - 0.38, 0.035, mats.wood, 0, h / 2, d / 2 + 0.004, { round: 0.01 });
  b.box(0.035, h - 0.38, 0.025, mats.woodDark, 0, h / 2, d / 2 + 0.03, {});
  for (const sx of [-1, 1]) {
    b.box(w / 2 - 0.14, h - 0.55, 0.045, mats.woodDark, sx * (w / 4 + 0.035), h / 2 + 0.02, d / 2 + 0.03, { round: 0.015 });
    b.sphere(0.04, mats.goldAntique, sx * 0.18, h * 0.55, d / 2 + 0.09, { width: 7, height: 5 });
    b.sphere(0.035, mats.goldAntique, sx * 0.16, h * 0.53, d / 2 + 0.1, { width: 6, height: 4 });
  }
  for (let i = 0; i < 3; i++) {
    b.box(w - 0.25, 0.03, 0.02, mats.goldAntique, 0, 0.25 + i * 0.16, d / 2 + 0.06, {});
  }
  b.box(w - 0.25, 0.04, 0.03, mats.iron, 0, h - 0.26, d / 2 + 0.06, { round: 0.005 });
  finish(piece, name);
  return piece.group;
}

export function makeNightstand(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "night-table", x, y, z, rotY);
  const b = piece.builder;
  b.box(0.55, 0.55, 0.42, mats.woodDark, 0, 0.3, 0, { round: 0.025 });
  b.box(0.61, 0.06, 0.46, mats.wood, 0, 0.59, 0, { round: 0.02 });
  for (const sx of [-1, 1]) {
    b.sphere(0.04, mats.woodDark, sx * 0.21, 0.06, 0.14, { width: 6, height: 4 });
    b.sphere(0.04, mats.woodDark, sx * 0.21, 0.06, -0.14, { width: 6, height: 4 });
  }
  b.box(0.42, 0.14, 0.025, mats.wood, 0, 0.42, 0.22, { round: 0.01 });
  b.sphere(0.026, mats.goldAntique, 0, 0.42, 0.25, { width: 6, height: 4 });
  finish(piece, "night-table");
  return piece.group;
}

export function makeDesk(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "writing-desk", w = 1.55, d = 0.66, h = 0.78 } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  b.box(w, 0.07, d, mats.wood, 0, h, 0, { round: 0.02 });
  b.box(w - 0.08, 0.12, 0.08, mats.woodDark, 0, h - 0.11, d / 2 - 0.08, { round: 0.015 });
  for (const sx of [-1, 1]) {
    b.box(0.1, h - 0.08, 0.1, mats.woodDark, sx * (w / 2 - 0.1), (h - 0.08) / 2, d / 2 - 0.1, { round: 0.015 });
    b.box(0.1, h - 0.08, 0.1, mats.woodDark, sx * (w / 2 - 0.1), (h - 0.08) / 2, -d / 2 + 0.1, { round: 0.015 });
  }
  b.box(w * 0.34, h * 0.36, d * 0.72, mats.woodDark, -w * 0.24, h * 0.63, 0, { round: 0.025 });
  for (let i = 0; i < 3; i++) {
    b.box(w * 0.29, 0.09, 0.03, mats.wood, -w * 0.24, h * 0.48 + i * 0.14, d * 0.36, { round: 0.01 });
    b.sphere(0.022, mats.goldAntique, -w * 0.24, h * 0.48 + i * 0.14, d * 0.38, { width: 5, height: 4 });
  }
  b.box(w + 0.03, 0.035, 0.06, mats.goldAntique, 0, h + 0.025, -d / 2 + 0.04, { round: 0.01 });
  finish(piece, name);
  return piece.group;
}

/* ─────────────────────────── Bed ─────────────────────────── */

export function makeBed(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "four-poster-bed", x, y, z, rotY);
  const b = piece.builder;
  const w = 2.35;
  const d = 3.45;
  const wood = mats.woodDark;
  const gold = mats.goldAntique;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.cylinder(0.06, 0.075, 2.58, wood, sx * (w / 2 - 0.08), 1.29, sz * (d / 2 - 0.08), { segments: 9 });
      b.sphere(0.09, gold, sx * (w / 2 - 0.08), 2.62, sz * (d / 2 - 0.08), { width: 8, height: 6 });
      b.cone(0.065, 0.22, gold, sx * (w / 2 - 0.08), 2.78, sz * (d / 2 - 0.08), { segments: 6 });
    }
  }
  b.box(w - 0.05, 0.18, d - 0.05, wood, 0, 0.37, 0, { round: 0.025 });
  b.box(w - 0.25, 0.3, d - 0.3, mats.linen, 0, 0.55, 0, { round: 0.06 });
  b.box(w - 0.18, 0.1, d - 0.25, mats.linenLight, 0, 0.73, 0.04, { round: 0.04 });
  // duvet and folded blanket
  b.box(w - 0.22, 0.08, d * 0.48, mats.beddingBlue, 0, 0.81, 0.45, { round: 0.035 });
  b.box(w - 0.16, 0.05, d * 0.2, mats.clothGold, 0, 0.865, 0.92, { round: 0.02 });
  for (let i = 0; i < 4; i++) {
    b.box(w - 0.28, 0.012, 0.035, mats.linenLight, 0, 0.84, -0.1 + i * 0.57, {});
  }
  // pillows
  for (const sx of [-1, 1]) {
    b.box(0.78, 0.16, 0.44, mats.linenLight, sx * 0.5, 0.86, -d * 0.33, { round: 0.09, rx: -0.08 });
    b.sphere(0.1, gold, sx * 0.86, 0.96, -d * 0.35, { width: 7, height: 5, sx: 0.8, sy: 0.4, sz: 1.4 });
  }
  // headboard & footboard
  b.box(w - 0.06, 1.35, 0.1, wood, 0, 1.36, -d / 2 + 0.05, { round: 0.03 });
  b.box(w - 0.38, 0.92, 0.055, mats.clothCrimson, 0, 1.33, -d / 2 + 0.12, { round: 0.04 });
  b.box(w - 0.06, 0.7, 0.09, wood, 0, 0.72, d / 2 - 0.03, { round: 0.025 });
  b.box(w - 0.22, 0.05, 0.11, gold, 0, 1.05, d / 2 - 0.03, { round: 0.01 });
  // An open four-poster frame with short valances, so the mattress and linens
  // remain legible from the cutaway camera.
  b.box(w + 0.12, 0.09, 0.09, wood, 0, 2.64, d / 2, { round: 0.015 });
  b.box(w + 0.12, 0.09, 0.09, wood, 0, 2.64, -d / 2, { round: 0.015 });
  b.box(0.09, 0.09, d + 0.12, wood, w / 2, 2.64, 0, { round: 0.015 });
  b.box(0.09, 0.09, d + 0.12, wood, -w / 2, 2.64, 0, { round: 0.015 });
  b.box(w - 0.05, 0.28, 0.05, mats.clothCrimson, 0, 2.49, d / 2 - 0.06, { round: 0.018 });
  b.box(w - 0.05, 0.24, 0.05, mats.clothCrimson, 0, 2.49, -d / 2 + 0.06, { round: 0.018 });
  for (const sx of [-1, 1]) {
    b.box(0.05, 0.26, d * 0.52, mats.clothCrimson, sx * (w / 2 - 0.06), 2.48, 0.5, { round: 0.018 });
    // gathered side curtains at the head, with gold tie-backs
    for (let i = 0; i < 3; i++) {
      b.box(0.075, 1.82 - i * 0.07, 0.28, mats.clothCrimsonDeep, sx * (w / 2 - 0.02 - i * 0.055), 1.5, -d / 2 + 0.36 + i * 0.26, { round: 0.03 });
    }
    b.add(new THREE.TorusGeometry(0.12, 0.022, 5, 14), mats.gold, [sx * (w / 2 - 0.17), 1.46, -d / 2 + 0.62], [Math.PI / 2, 0, 0]);
  }
  // little tufted foot bench attached visually, but separate item for audit
  b.box(0.7, 0.18, 0.13, wood, 0, 0.6, d / 2 + 0.1, { round: 0.02 });
  finish(piece, "four-poster-bed");
  return piece.group;
}

/* ─────────────────────────── Fireplace ─────────────────────────── */

export function makeFireplace(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "hearth", w = 2.3, h = 3.1, depth = 0.7, room = null, floor = 0 } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  const stone = mats.ashlar;
  b.box(w + 0.3, 0.18, depth + 0.15, stone, 0, 0.09, depth / 2 - 0.04, { round: 0.03 });
  b.box(w, h - 0.4, 0.22, stone, 0, (h - 0.4) / 2, 0.06, { round: 0.02 });
  for (const sx of [-1, 1]) {
    b.box(0.36, h - 0.35, depth, stone, sx * (w / 2 - 0.16), (h - 0.35) / 2, depth / 2, { round: 0.03 });
    b.box(0.48, 0.22, depth + 0.06, mats.weatheredStone, sx * (w / 2 - 0.16), h - 0.24, depth / 2, { round: 0.03 });
  }
  b.box(w, 0.28, depth + 0.1, stone, 0, h - 0.55, depth / 2 + 0.02, { round: 0.025 });
  b.box(w + 0.45, 0.18, depth + 0.24, mats.weatheredStone, 0, h - 0.27, depth / 2 + 0.04, { round: 0.03 });
  // recess
  b.box(w - 0.82, h - 1.1, 0.06, mats.charcoal, 0, (h - 1.1) / 2 + 0.25, depth - 0.1, { round: 0.015 });
  b.box(w - 0.7, 0.08, depth * 0.75, mats.iron, 0, 0.35, depth * 0.55, {});
  for (const sx of [-0.32, 0.32]) {
    b.box(0.12, 0.58, 0.12, mats.ironRust, sx, 0.62, depth * 0.6, { rotZ: 0.35, round: 0.02 });
    b.box(0.12, 0.58, 0.12, mats.ironRust, -sx, 0.66, depth * 0.6, { rotZ: -0.35, round: 0.02 });
  }
  b.cylinder(0.13, 0.15, 1.1, mats.woodDark, 0, 0.44, depth * 0.56, { rotZ: Math.PI / 2, segments: 8 });
  b.cylinder(0.1, 0.12, 0.9, mats.woodDark, -0.08, 0.54, depth * 0.63, { rotZ: Math.PI / 2, segments: 7 });
  // fire
  for (let i = 0; i < 7; i++) {
    const r = 0.13 + (i % 3) * 0.055;
    b.sphere(r, i % 3 === 0 ? mats.flameCore : mats.flame, -0.33 + i * 0.11, 0.46 + (i % 2) * 0.11, depth * 0.52 + (i % 3) * 0.04, {
      width: 7,
      height: 6,
      sy: 1.55
    });
  }
  b.sphere(0.1, mats.ember, -0.25, 0.4, depth * 0.58, { width: 6, height: 4 });
  b.sphere(0.09, mats.ember, 0.36, 0.4, depth * 0.58, { width: 6, height: 4 });
  // mantel objects
  b.cylinder(0.065, 0.08, 0.16, mats.goldAntique, -w * 0.27, h - 0.15, depth * 0.65, { segments: 8 });
  b.sphere(0.08, mats.woodDark, w * 0.22, h - 0.1, depth * 0.6, { width: 7, height: 5 });
  b.cylinder(0.045, 0.05, 0.3, mats.wax, -w * 0.06, h - 0.12, depth * 0.64, { segments: 8 });
  b.sphere(0.05, mats.flame, -w * 0.06, h + 0.06, depth * 0.64, { width: 6, height: 5, sy: 1.7 });
  finish(piece, name + "-mesh");
  lightFromLocal(state, piece.group, [0, 0.9, depth + 0.45], {
    color: 0xff9b4d,
    intensity: 1.15,
    distance: 7.5,
    type: "fire",
    room,
    floor
  });
  return piece.group;
}

// A shared state is threaded through the builder functions below.
let state;
function useLighting(s) {
  state = s;
}

/* ─────────────────────────── Chandelier & gallery ─────────────────────────── */

export function makeChandelier(parent, mats, x, y, z, options = {}) {
  const { radius = 1.1, room = "greatHall", floor = 0 } = options;
  const piece = createFurniturePiece(parent, "iron-candelabra", x, y, z, 0);
  const b = piece.builder;
  b.cylinder(0.05, 0.05, 1.0, mats.iron, 0, -0.5, 0, { segments: 6 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    b.cylinder(0.018, 0.018, 1.1, mats.iron, Math.cos(a) * 0.32, -0.45, Math.sin(a) * 0.32, {
      rz: Math.cos(a) * 0.3,
      rx: Math.sin(a) * 0.3,
      segments: 4
    });
  }
  b.add(new THREE.TorusGeometry(radius, 0.055, 6, 36), mats.iron, [0, -0.95, 0], [Math.PI / 2, 0, 0]);
  b.add(new THREE.TorusGeometry(radius * 0.72, 0.035, 5, 28), mats.iron, [0, -0.7, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const px = Math.cos(a) * radius;
    const pz = Math.sin(a) * radius;
    b.cylinder(0.12, 0.18, 0.1, mats.iron, px, -0.86, pz, { segments: 8 });
    b.cylinder(0.045, 0.055, 0.3, mats.wax, px, -0.64, pz, { segments: 8 });
    b.sphere(0.06, mats.flame, px, -0.43, pz, { width: 6, height: 5, sy: 1.8 });
  }
  b.sphere(0.11, mats.gold, 0, -0.95, 0, { width: 8, height: 6 });
  finish(piece, "chandelier");
  lightFromLocal(state, piece.group, [0, -1.2, 0], {
    color: 0xffa65b,
    intensity: 1.25,
    distance: 8,
    type: "chandelier",
    room,
    floor
  });
  return piece.group;
}

export function makeMinstrelGallery(parent, mats, x, y, z) {
  const piece = createFurniturePiece(parent, "minstrel-gallery", x, y, z, 0);
  const b = piece.builder;
  b.box(5.0, 0.18, 1.15, mats.woodDark, 0, 0, 0, { round: 0.02 });
  b.box(5.0, 0.06, 0.08, mats.wood, 0, 0.1, 0.54, { round: 0.015 });
  for (let i = -5; i <= 5; i++) {
    b.cylinder(0.025, 0.03, 0.82, mats.woodDark, i * 0.46, 0.49, 0.55, { segments: 7 });
    b.sphere(0.04, mats.woodDark, i * 0.46, 0.92, 0.55, { width: 6, height: 4 });
  }
  b.box(5.0, 0.07, 0.09, mats.woodDark, 0, 0.9, 0.55, { round: 0.02 });
  for (const sx of [-1, 1]) {
    b.box(0.28, 1.2, 0.28, mats.woodDark, sx * 2.42, -0.5, 0.38, { round: 0.03 });
    b.box(0.9, 0.16, 0.3, mats.woodDark, sx * 2.4, -0.25, 0.2, { round: 0.02, rz: sx * -0.4 });
  }
  // harp
  b.cylinder(0.035, 0.05, 1.2, mats.wood, 1.8, 0.7, 0.2, { rz: 0.22, segments: 8 });
  b.cylinder(0.035, 0.045, 0.9, mats.wood, 2.25, 1.08, 0.2, { rz: -0.8, segments: 8 });
  b.box(0.6, 0.04, 0.08, mats.wood, 1.98, 1.29, 0.2, { rotZ: 0.28, round: 0.015 });
  for (let i = 0; i < 7; i++) {
    b.cylinder(0.004, 0.004, 0.6 - i * 0.045, mats.silver, 1.9 + i * 0.045, 0.94, 0.2, {
      rz: 0.12,
      segments: 3
    });
  }
  // stools & scrolls
  b.add(new THREE.CylinderGeometry(0.18, 0.2, 0.35, 8), mats.woodDark, [-0.9, 0.44, -0.04], [0, 0, 0]);
  b.cylinder(0.04, 0.05, 0.3, mats.woodDark, -1.05, 0.17, 0.15, { segments: 6 });
  b.cylinder(0.04, 0.05, 0.3, mats.woodDark, -0.75, 0.17, 0.15, { segments: 6 });
  finish(piece, "minstrel-gallery");
  return piece.group;
}

/* ─────────────────────────── Bookcase, globe, ladder ─────────────────────────── */

export function makeBookshelf(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { name = "bookcase", w = 2.0, h = 2.75, d = 0.44, seed = 1, shelves = 5 } = options;
  const piece = createFurniturePiece(parent, name, x, y, z, rotY);
  const b = piece.builder;
  const r = rng(seed * 31 + 7);
  const wood = mats.woodDark;
  b.box(w, h, 0.06, wood, 0, h / 2, -d / 2 + 0.03, { round: 0.012 });
  b.box(0.1, h, d, wood, -w / 2 + 0.05, h / 2, 0, { round: 0.015 });
  b.box(0.1, h, d, wood, w / 2 - 0.05, h / 2, 0, { round: 0.015 });
  b.box(w + 0.12, 0.14, d + 0.08, mats.wood, 0, h - 0.05, 0, { round: 0.02 });
  b.box(w + 0.06, 0.1, d + 0.04, wood, 0, 0.06, 0, { round: 0.015 });
  b.box(w, 0.08, d, wood, 0, h - 0.18, 0, { round: 0.01 });
  const usable = h - 0.42;
  for (let s = 0; s < shelves; s++) {
    const sy = 0.22 + (s / (shelves - 1)) * (usable - 0.1);
    b.box(w - 0.2, 0.045, d - 0.05, wood, 0, sy, 0.015, { round: 0.008 });
    // books standing, leaning and stacked
    let cursor = -w / 2 + 0.2;
    while (cursor < w / 2 - 0.3) {
      const bw = 0.06 + r() * 0.06;
      const bh = 0.24 + r() * 0.15;
      const depth = d * (0.62 + r() * 0.18);
      const bookMat = [mats.bookBlue, mats.bookRed, mats.bookGreen, mats.bookBrown, mats.bookCream][Math.floor(r() * 5)];
      const lean = r() > 0.86 ? 0.15 : 0;
      b.box(bw, bh, depth, bookMat, cursor + bw / 2, sy + 0.025 + bh / 2 + (lean ? 0 : 0.01), 0.04, {
        rz: lean,
        round: 0.007
      });
      if (r() > 0.4) {
        b.box(bw + 0.01, 0.035, depth - 0.03, mats.paper, cursor + bw / 2, sy + bh * 0.82, 0.04, { rz: lean });
      }
      cursor += bw + 0.012 + (r() > 0.82 ? 0.06 : 0);
    }
    // horizontal stack on a few shelves
    if (s % 2 === 0) {
      let sx = w / 2 - 0.52;
      for (let i = 0; i < 3; i++) {
        b.box(0.34, 0.045, 0.25, [mats.bookCream, mats.bookRed, mats.bookBlue][i], sx, sy + 0.055 + i * 0.042, 0.05, {
          ry: 0.08,
          round: 0.005
        });
      }
    }
  }
  // carved sides / feet
  for (const sx of [-1, 1]) {
    b.sphere(0.07, wood, sx * (w / 2 - 0.05), 0.06, d / 2 - 0.06, { width: 6, height: 4 });
    b.cone(0.05, 0.16, mats.goldAntique, sx * (w / 2 - 0.05), h + 0.08, d / 2 - 0.08, { segments: 6 });
  }
  b.box(0.6, 0.05, 0.03, mats.goldAntique, 0, h * 0.62, d / 2 + 0.02, { round: 0.005 });
  finish(piece, name);
  return piece.group;
}

export function makeGlobe(parent, mats, x, y, z) {
  const piece = createFurniturePiece(parent, "terrestrial-globe", x, y, z, 0);
  const b = piece.builder;
  b.add(new THREE.TorusGeometry(0.42, 0.022, 5, 30), mats.brass || mats.goldAntique, [0, 0.72, 0], [0, 0, 0]);
  b.add(new THREE.TorusGeometry(0.43, 0.018, 5, 30), mats.goldAntique, [0, 0.72, 0], [Math.PI / 2, 0, 0]);
  b.sphere(0.32, mats.clothBlue, 0, 0.72, 0, { width: 16, height: 12 });
  const continents = [
    [-0.08, 0.77, 0.24, 0.14, 0.07],
    [0.13, 0.82, 0.17, 0.09, 0.05],
    [-0.15, 0.62, 0.2, 0.07, 0.05],
    [0.16, 0.62, 0.14, 0.08, 0.04],
    [0.0, 0.87, 0.12, 0.04, 0.03]
  ];
  for (const [cx, cy, cz, rx, ry] of continents) {
    b.sphere(rx, mats.bookGreen, cx, cy, cz, { width: 7, height: 5, sx: 1.4, sy: 0.6, sz: 0.25, rz: 0.2 });
    void ry;
  }
  b.cylinder(0.035, 0.04, 0.65, mats.woodDark, 0, 0.33, 0, { segments: 8 });
  b.cylinder(0.28, 0.33, 0.06, mats.woodDark, 0, 0.03, 0, { segments: 12 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    b.box(0.1, 0.08, 0.48, mats.woodDark, Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16, { ry: -a, round: 0.02 });
  }
  finish(piece, "globe");
  return piece.group;
}

export function makeLadder(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "library-ladder", x, y, z, rotY);
  const b = piece.builder;
  const h = 2.5;
  for (const sx of [-1, 1]) {
    b.cylinder(0.035, 0.045, h, mats.woodDark, sx * 0.27, h / 2, 0, { segments: 7, rz: sx * 0.09 });
  }
  for (let i = 0; i < 7; i++) {
    b.box(0.55, 0.035, 0.07, mats.wood, 0, 0.35 + i * 0.29, 0, { round: 0.008 });
  }
  finish(piece, "ladder");
  return piece.group;
}

/* ─────────────────────────── Chapel ─────────────────────────── */

export function makePew(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { length = 2.2 } = options;
  const piece = createFurniturePiece(parent, "chapel-pew", x, y, z, rotY);
  const b = piece.builder;
  b.box(length, 0.12, 0.44, mats.woodDark, 0, 0.44, 0, { round: 0.025 });
  b.box(length - 0.16, 0.055, 0.4, mats.wood, 0, 0.52, 0.01, { round: 0.02 });
  for (const sx of [-1, 1]) {
    b.box(0.09, 0.42, 0.4, mats.woodDark, sx * (length / 2 - 0.12), 0.21, 0, { round: 0.02 });
    b.cylinder(0.025, 0.035, 0.92, mats.woodDark, sx * (length / 2 - 0.12), 0.94, -0.19, { segments: 7 });
  }
  b.box(length, 0.12, 0.07, mats.woodDark, 0, 1.35, -0.19, { round: 0.025 });
  b.box(length, 0.06, 0.05, mats.woodDark, 0, 0.96, -0.19, { round: 0.018 });
  for (let i = -2; i <= 2; i++) {
    b.box(0.03, 0.32, 0.025, mats.woodDark, i * (length / 4), 1.14, -0.19, { round: 0.006 });
  }
  b.box(0.25, 0.06, 0.05, mats.goldAntique, 0, 1.42, -0.19, { round: 0.01 });
  finish(piece, "pew");
  return piece.group;
}

export function makeAltar(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "stone-altar", x, y, z, rotY);
  const b = piece.builder;
  b.box(2.0, 0.9, 0.82, mats.ashlar, 0, 0.45, 0, { round: 0.035 });
  b.box(2.2, 0.12, 0.96, mats.weatheredStone, 0, 0.96, 0, { round: 0.025 });
  b.box(1.7, 0.04, 0.7, mats.clothIvory, 0, 1.035, 0.01, { round: 0.015 });
  b.box(1.86, 0.24, 0.06, mats.clothIvory, 0, 0.85, 0.42, { round: 0.02 });
  // cross
  b.box(0.11, 1.0, 0.09, mats.goldAntique, 0, 1.55, 0, { round: 0.02 });
  b.box(0.55, 0.1, 0.08, mats.goldAntique, 0, 1.76, 0.001, { round: 0.02 });
  // candle sticks
  for (const sx of [-1, 1]) {
    b.cylinder(0.06, 0.09, 0.25, mats.goldAntique, sx * 0.65, 1.15, 0.06, { segments: 8 });
    b.cylinder(0.035, 0.04, 0.22, mats.wax, sx * 0.65, 1.36, 0.06, { segments: 8 });
    b.sphere(0.045, mats.flame, sx * 0.65, 1.5, 0.06, { width: 6, height: 5, sy: 1.6 });
  }
  b.box(0.5, 0.04, 0.24, mats.paper, 0.2, 1.06, -0.15, { rotZ: 0.04, round: 0.008 });
  finish(piece, "altar");
  return piece.group;
}

export function makeCandleStand(parent, mats, x, y, z) {
  const piece = createFurniturePiece(parent, "processional-candle", x, y, z, 0);
  const b = piece.builder;
  b.cylinder(0.2, 0.25, 0.06, mats.iron, 0, 0.03, 0, { segments: 10 });
  b.cylinder(0.035, 0.05, 1.35, mats.iron, 0, 0.7, 0, { segments: 8 });
  b.cylinder(0.16, 0.2, 0.05, mats.iron, 0, 1.39, 0, { segments: 10 });
  b.cylinder(0.05, 0.06, 0.4, mats.wax, 0, 1.6, 0, { segments: 8 });
  b.sphere(0.065, mats.flame, 0, 1.88, 0, { width: 6, height: 5, sy: 1.8 });
  finish(piece, "candle-stand");
  return piece.group;
}

/* ─────────────────────────── Kitchen ─────────────────────────── */

export function makeKitchenHearth(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "kitchen-hearth", x, y, z, rotY);
  const b = piece.builder;
  const w = 2.5;
  const d = 0.84;
  b.box(w + 0.2, 0.15, d + 0.3, mats.weatheredStone, 0, 0.075, d / 2, { round: 0.03 });
  b.box(w, 1.7, 0.2, mats.ashlar, 0, 0.85, 0.05, { round: 0.02 });
  for (const sx of [-1, 1]) {
    b.box(0.36, 1.5, 0.8, mats.weatheredStone, sx * (w / 2 - 0.18), 0.9, d / 2, { round: 0.03 });
  }
  b.box(w, 0.2, 0.34, mats.ashlar, 0, 2.25, 0.25, { round: 0.025 });
  b.box(w, 0.22, 0.78, mats.weatheredStone, 0, 2.48, d / 2 - 0.02, { round: 0.025 });
  b.cylinder(0.55, 0.75, 1.8, mats.ashlar, 0, 3.3, 0.2, { segments: 10 });
  b.box(w - 0.8, 0.06, 0.06, mats.iron, 0, 1.28, 0.51, {});
  b.cylinder(0.055, 0.055, 1.3, mats.iron, 0, 1.12, 0.55, { rotZ: Math.PI / 2, segments: 6 });
  // hanging cauldron
  b.add(new THREE.TorusGeometry(0.09, 0.018, 4, 14), mats.iron, [0, 1.02, 0.58], [0, 0, 0]);
  b.sphere(0.26, mats.iron, 0, 0.65, 0.6, { width: 12, height: 8, sx: 1.15, sy: 0.9, sz: 1.1 });
  b.cylinder(0.23, 0.2, 0.09, mats.iron, 0, 0.83, 0.6, { segments: 14 });
  // fire and logs
  for (let i = 0; i < 5; i++) {
    b.sphere(0.23 + (i % 2) * 0.08, i % 2 ? mats.flame : mats.flameCore, -0.6 + i * 0.28, 0.4 + (i % 2) * 0.12, 0.58, {
      width: 7,
      height: 6,
      sy: 1.7
    });
  }
  b.cylinder(0.12, 0.14, 1.1, mats.woodDark, 0, 0.22, 0.56, { rotZ: Math.PI / 2, segments: 8 });
  // bread oven to the left, part of the same solid mass
  b.sphere(0.48, mats.weatheredStone, -1.45, 0.9, 0.36, { width: 12, height: 8, sx: 1, sy: 0.95, sz: 0.8 });
  b.box(0.5, 0.22, 0.12, mats.charcoal, -1.45, 0.85, 0.72, { round: 0.01 });
  b.box(0.5, 0.1, 0.4, mats.ashlar, -1.45, 1.42, 0.36, { round: 0.02 });
  // hanging herbs and copper
  for (let i = 0; i < 5; i++) {
    b.cylinder(0.008, 0.008, 0.5, mats.iron, 0.65 + i * 0.15, 1.85, 0.78, { segments: 3 });
    b.cone(0.08, 0.25, mats.moss || mats.leafOlive, 0.65 + i * 0.15, 1.58, 0.78, { segments: 5 });
  }
  b.cylinder(0.16, 0.16, 0.06, mats.copperPatina, 1.0, 1.95, 0.6, { rotX: Math.PI / 2, segments: 12 });
  finish(piece, "hearth");
  lightFromLocal(state, piece.group, [0, 1.1, d + 0.6], {
    color: 0xff8c45,
    intensity: 1.1,
    distance: 7,
    type: "fire",
    room: "kitchen",
    floor: 0
  });
  return piece.group;
}

export function makePrepTable(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { w = 2.3, d = 1.0, h = 0.85 } = options;
  const piece = createFurniturePiece(parent, "kitchen-table", x, y, z, rotY);
  const b = piece.builder;
  b.box(w, 0.1, d, mats.wood, 0, h, 0, { round: 0.025 });
  for (const sx of [-1, 1]) {
    b.box(0.13, h, 0.13, mats.woodDark, sx * (w / 2 - 0.16), h / 2, d / 2 - 0.12, { round: 0.02 });
    b.box(0.13, h, 0.13, mats.woodDark, sx * (w / 2 - 0.16), h / 2, -d / 2 + 0.12, { round: 0.02 });
  }
  b.box(w - 0.4, 0.12, 0.08, mats.woodDark, 0, h - 0.18, d / 2 - 0.08, { round: 0.015 });
  b.box(w - 0.4, 0.12, 0.08, mats.woodDark, 0, h - 0.18, -d / 2 + 0.08, { round: 0.015 });
  // cutting board and bowls
  b.box(0.5, 0.04, 0.3, mats.woodPale, -0.35, h + 0.06, -0.05, { round: 0.01 });
  b.cylinder(0.18, 0.12, 0.1, mats.terracotta, 0.46, h + 0.1, 0.06, { segments: 12 });
  b.sphere(0.08, mats.foodFruit, 0.42, h + 0.16, 0.06, { width: 7, height: 5 });
  b.sphere(0.06, mats.foodGreen, 0.32, h + 0.14, -0.04, { width: 6, height: 4 });
  b.cylinder(0.05, 0.06, 0.25, mats.bottles[0], 0.9, h + 0.15, 0.2, { segments: 8 });
  b.cylinder(0.035, 0.045, 0.12, mats.wax, 0.9, h + 0.33, 0.2, { segments: 8 });
  finish(piece, "prep-table");
  return piece.group;
}

export function makeBarrel(parent, mats, x, y, z, scale = 1) {
  const piece = createFurniturePiece(parent, "barrel", x, y, z, 0);
  const b = piece.builder;
  const s = scale;
  b.lathe([
    [0, 0], [0.22, 0.01], [0.31, 0.1], [0.34, 0.35], [0.31, 0.6], [0.24, 0.7], [0, 0.7]
  ], mats.woodDark, 0, 0, 0, { segments: 14, sx: s, sy: s, sz: s });
  for (const yy of [0.16, 0.52]) {
    b.add(new THREE.TorusGeometry(0.33 * s, 0.018, 4, 20), mats.iron, [0, yy * 0.9 + 0.05, 0], [Math.PI / 2, 0, 0]);
  }
  b.cylinder(0.25 * s, 0.25 * s, 0.05, mats.woodDark, 0, 0.7 * s, 0, { segments: 12 });
  finish(piece, "barrel");
  return piece.group;
}

export function makeSack(parent, mats, x, y, z, scale = 1) {
  const piece = createFurniturePiece(parent, "grain-sack", x, y, z, 0.3);
  const b = piece.builder;
  b.sphere(0.32, mats.linen, 0, 0.25, 0, { width: 9, height: 6, sx: 1, sy: 1.25, sz: 0.85 });
  b.cylinder(0.12, 0.16, 0.16, mats.linen, 0, 0.62, 0, { segments: 8 });
  b.cylinder(0.14, 0.14, 0.04, mats.woodDark, 0, 0.7, 0, { segments: 8 });
  b.sphere(0.06, mats.foodBread, 0.1, 0.72, 0, { width: 6, height: 4 });
  piece.group.scale.setScalar(scale);
  finish(piece, "sack");
  return piece.group;
}

export function makeHutch(parent, mats, x, y, z, rotY = 0, options = {}) {
  const { w = 2.2, h = 1.95, d = 0.42 } = options;
  const piece = createFurniturePiece(parent, "pewter-hutch", x, y, z, rotY);
  const b = piece.builder;
  b.box(w, h, d, mats.woodDark, 0, h / 2, 0, { round: 0.03 });
  b.box(w + 0.1, 0.08, d + 0.06, mats.wood, 0, 0.05, 0, { round: 0.015 });
  b.box(w + 0.08, 0.11, d + 0.06, mats.wood, 0, h - 0.08, 0, { round: 0.02 });
  for (let r = 0; r < 3; r++) {
    b.box(w - 0.25, 0.04, d - 0.05, mats.wood, 0, 0.58 + r * 0.4, 0.02, { round: 0.01 });
  }
  b.box(w - 0.35, 0.03, 0.02, mats.iron, 0, 0.84, d / 2 + 0.01, {});
  for (let i = 0; i < 5; i++) {
    b.cylinder(0.06 + (i % 2) * 0.03, 0.08, 0.13 + (i % 3) * 0.03, mats.iron, -w / 2 + 0.4 + i * 0.33, 0.7 + (i % 2) * 0.4, d / 2 + 0.02, { segments: 8 });
    b.cylinder(0.09, 0.1, 0.05, mats.iron, -w / 2 + 0.4 + i * 0.33, 0.66 + (i % 2) * 0.4, d / 2 + 0.02, { segments: 8 });
  }
  b.box(0.6, 0.04, 0.3, mats.clothCrimson, 0.5, 0.42, 0.14, { round: 0.03 });
  finish(piece, "hutch");
  return piece.group;
}

/* ─────────────────────────── Exterior furniture ─────────────────────────── */

export function makeTelescope(parent, mats, x, y, z, rotY = 0) {
  const piece = createFurniturePiece(parent, "brass-telescope", x, y, z, rotY);
  const b = piece.builder;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    b.cylinder(0.018, 0.025, 1.3, mats.woodDark, Math.cos(a) * 0.25, 0.63, Math.sin(a) * 0.25, {
      rx: Math.sin(a) * 0.45,
      rz: Math.cos(a) * 0.45,
      segments: 5
    });
  }
  b.cylinder(0.06, 0.08, 0.08, mats.brass || mats.goldAntique, 0, 1.28, 0, { segments: 10 });
  b.cylinder(0.08, 0.12, 1.1, mats.goldAntique, 0.1, 1.62, -0.3, { rotX: Math.PI / 2.8, rotZ: -0.2, segments: 16 });
  b.cylinder(0.12, 0.15, 0.2, mats.goldAntique, 0.1, 1.9, -0.62, { rotX: Math.PI / 2.8, rotZ: -0.2, segments: 16 });
  b.cylinder(0.1, 0.12, 0.12, mats.iron, 0.1, 1.35, 0.02, { rotX: Math.PI / 2.8, rotZ: -0.2, segments: 12 });
  b.add(new THREE.TorusGeometry(0.14, 0.018, 4, 20), mats.goldAntique, [0.1, 1.35, 0.02], [Math.PI / 2, 0, 0]);
  finish(piece, "telescope");
  return piece.group;
}

export function makeStarTable(parent, mats, x, y, z) {
  const piece = createFurniturePiece(parent, "star-chart-table", x, y, z, 0);
  const b = piece.builder;
  b.cylinder(0.6, 0.55, 0.08, mats.woodDark, 0, 0.78, 0, { segments: 22 });
  b.cylinder(0.45, 0.48, 0.02, mats.parchment, 0, 0.83, 0, { segments: 22 });
  b.cylinder(0.1, 0.14, 0.72, mats.woodDark, 0, 0.4, 0, { segments: 10 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    b.box(0.1, 0.09, 0.48, mats.woodDark, Math.cos(a) * 0.18, 0.08, Math.sin(a) * 0.18, { ry: -a, round: 0.02 });
  }
  b.sphere(0.06, mats.goldAntique, 0.1, 0.9, 0.12, { width: 7, height: 5 });
  b.cylinder(0.04, 0.05, 0.22, mats.wax, -0.28, 0.9, -0.1, { segments: 7 });
  b.sphere(0.045, mats.flame, -0.28, 1.04, -0.1, { width: 5, height: 4, sy: 1.6 });
  finish(piece, "star-table");
  return piece.group;
}

export function makePlanter(parent, mats, x, y, z, options = {}) {
  const { scale = 1, flowers = true } = options;
  const piece = createFurniturePiece(parent, "stone-planter", x, y, z, 0);
  const b = piece.builder;
  b.cylinder(0.32, 0.26, 0.48, mats.terracotta, 0, 0.24, 0, { segments: 14 });
  b.add(new THREE.TorusGeometry(0.31, 0.03, 5, 18), mats.terracottaDark, [0, 0.46, 0], [Math.PI / 2, 0, 0]);
  b.cylinder(0.27, 0.27, 0.04, mats.soil, 0, 0.47, 0, { segments: 14 });
  if (flowers) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      b.cylinder(0.012, 0.014, 0.35, mats.leafDeep, Math.cos(a) * 0.13, 0.65, Math.sin(a) * 0.13, { segments: 4 });
      b.sphere(0.085, i % 3 === 0 ? mats.flowerCream : mats.flowerPink, Math.cos(a) * 0.16, 0.82 + (i % 2) * 0.07, Math.sin(a) * 0.16, {
        width: 7,
        height: 5,
        sx: 1.2,
        sy: 0.8
      });
    }
    b.sphere(0.13, mats.leafMid, 0, 0.54, 0, { width: 7, height: 5, sy: 0.4 });
  }
  piece.group.scale.setScalar(scale);
  finish(piece, "planter");
  return piece.group;
}

/* ─────────────────────────── Decorative props ─────────────────────────── */

export function makeRug(parent, mats, mat, x, y, z, w, d, rotY = 0) {
  const geo = new THREE.PlaneGeometry(w, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(-Math.PI / 2, 0, rotY);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.name = "woven-rug";
  parent.add(mesh);
  return mesh;
}

export function makeTapestry(parent, mats, material, x, y, z, rotY, w, h) {
  const group = new THREE.Group();
  group.name = "tapestry";
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  parent.add(group);
  cylinder(group, 0.035, 0.035, w + 0.28, mats.iron, 0, h / 2 + 0.12, 0.04, { rotZ: Math.PI / 2, segments: 6 });
  for (const sx of [-1, 1]) {
    sphere(group, 0.055, mats.goldAntique, sx * (w / 2 + 0.12), h / 2 + 0.12, 0.04, { width: 7, height: 5 });
  }
  const cloth = new THREE.Mesh(makeWavyCloth(w, h, 6, 0.045, 14, 8), material);
  cloth.castShadow = true;
  cloth.receiveShadow = true;
  group.add(cloth);
  const rod = cylinder(group, 0.035, 0.035, w + 0.22, mats.iron, 0, h / 2 + 0.12, 0.04, { rotZ: Math.PI / 2, segments: 6 });
  void rod;
  return group;
}

export function makeWallSconce(parent, mats, x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.name = "wall-sconce";
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  parent.add(group);
  const b = new FurnitureBuilder(group);
  b.box(0.18, 0.3, 0.06, mats.iron, 0, 0, 0, { round: 0.02 });
  b.cylinder(0.025, 0.035, 0.35, mats.iron, 0, 0.1, 0.2, { rx: 0.8, segments: 6 });
  b.cylinder(0.18, 0.22, 0.05, mats.iron, 0, 0.28, 0.37, { segments: 8 });
  for (const sx of [-0.12, 0.12]) {
    b.cylinder(0.035, 0.04, 0.23, mats.wax, sx, 0.4, 0.37, { segments: 7 });
    b.sphere(0.04, mats.flame, sx, 0.54, 0.37, { width: 5, height: 4, sy: 1.6 });
  }
  b.finish("sconce");
  return group;
}

export function addTableSetting(parent, mats, x, y, z, layout) {
  const group = new THREE.Group();
  group.name = "table-service";
  group.position.set(x, y, z);
  parent.add(group);
  const b = new FurnitureBuilder(group);
  for (const item of layout) {
    if (item.type === "plate") {
      b.cylinder(0.13, 0.11, 0.022, mats.silver, item.x, 0.02, item.z, { segments: 16 });
      b.cylinder(0.09, 0.09, 0.005, mats.parchment, item.x, 0.033, item.z, { segments: 12 });
      b.sphere(0.045, mats.foodBread, item.x, 0.055, item.z, { width: 6, height: 4 });
    } else if (item.type === "goblet") {
      b.add(new THREE.LatheGeometry([
        new THREE.Vector2(0.0, 0), new THREE.Vector2(0.055, 0.005), new THREE.Vector2(0.045, 0.02),
        new THREE.Vector2(0.02, 0.09), new THREE.Vector2(0.045, 0.13), new THREE.Vector2(0.055, 0.17), new THREE.Vector2(0.045, 0.17), new THREE.Vector2(0, 0.17)
      ], 10), mats.goldAntique, [item.x, 0.02, item.z], [0, 0, 0]);
    } else if (item.type === "candle") {
      b.cylinder(0.035, 0.045, item.height || 0.22, mats.wax, item.x, 0.11 + (item.height || 0.22) / 2 - 0.11, item.z, { segments: 7 });
      b.sphere(0.04, mats.flame, item.x, 0.24 + (item.height || 0.22) / 2, item.z, { width: 5, height: 4, sy: 1.6 });
    } else if (item.type === "jug") {
      b.cylinder(0.1, 0.07, 0.25, mats.terracotta, item.x, 0.125, item.z, { segments: 10 });
      b.cylinder(0.035, 0.06, 0.08, mats.terracotta, item.x, 0.28, item.z, { segments: 8 });
    } else if (item.type === "bowl") {
      b.cylinder(0.2, 0.13, 0.1, mats.terracotta, item.x, 0.05, item.z, { segments: 14 });
      b.sphere(0.12, mats.foodFruit, item.x, 0.13, item.z, { width: 7, height: 5, sy: 0.7 });
    } else if (item.type === "runner") {
      b.box(item.w, 0.012, item.d, mats.clothIvory, item.x, 0.006, item.z, { round: 0.005 });
    }
  }
  const mesh = b.finish("table-service");
  void mesh;
  return group;
}

// Final assembly lives in furniture-scenes.js, keeping this file a library
// of reusable, individually auditable pieces.
export { finish, register, lightFromLocal, useLighting };
