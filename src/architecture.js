import * as THREE from "three";
import {
  box,
  cylinder,
  sphere,
  cone,
  makeGroup,
  instanced,
  addStairs,
  createArchShape,
  createHipRoofGeometry,
  rng,
  TAU
} from "./helpers.js";
import { WORLD } from "./data.js";

const Y_AXIS = new THREE.Vector3(0, 1, 0);

function adjustCylinderUV(geo, radius, height, scale = 2.8) {
  const uv = geo.attributes.uv;
  if (!uv) return geo;
  const uFactor = (Math.PI * 2 * radius) / scale;
  const vFactor = height / scale;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * uFactor, uv.getY(i) * vFactor);
  }
  uv.needsUpdate = true;
  return geo;
}

function torus(parent, radius, tube, mat, x, y, z, opts = {}) {
  const geo = new THREE.TorusGeometry(radius, tube, opts.radialSegments || 6, opts.tubularSegments || 18);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow ?? true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function archedBand(parent, mats, w, h, z, blockCount = 9, material = null) {
  const spring = h * 0.72;
  const yRadius = h - spring;
  const mat = material || mats.ashlar;
  for (let i = 0; i < blockCount; i++) {
    const a = Math.PI - (i / (blockCount - 1)) * Math.PI;
    const px = Math.cos(a) * (w / 2 + 0.11);
    const py = spring + Math.sin(a) * (yRadius + 0.1);
    box(parent, 0.32, 0.38, 0.38, mat, px, py, z, {
      rotZ: a - Math.PI / 2,
      uvScale: 0.6,
      rounded: 0.025
    });
  }
  box(parent, 0.46, 0.52, 0.42, mats.ashlar, 0, h + 0.08, z, {
    uvScale: 0.7,
    rounded: 0.03
  });
}

function createWindowGroup(mats, w, h, options = {}) {
  const { material = mats.glass, mullions = true, sill = true, deepFrame = true } = options;
  const group = new THREE.Group();
  group.name = "mullioned-window";

  const glass = new THREE.Mesh(new THREE.ShapeGeometry(createArchShape(w, h), 28), material);
  glass.position.z = 0.035;
  group.add(glass);

  const outside = new THREE.Mesh(
    new THREE.ShapeGeometry(createArchShape(w + 0.08, h + 0.04), 28),
    mats.charcoal
  );
  outside.position.z = -0.012;
  group.add(outside);

  if (mullions) {
    box(group, 0.045, h * 0.65, 0.065, mats.iron, 0, h * 0.34, 0.085, { rounded: 0.008 });
    box(group, w * 0.88, 0.04, 0.065, mats.iron, 0, h * 0.52, 0.085, { rounded: 0.008 });
    for (const sx of [-w * 0.27, w * 0.27]) {
      box(group, 0.025, h * 0.32, 0.055, mats.iron, sx, h * 0.74, 0.08, { rounded: 0.005 });
    }
  }

  if (deepFrame) {
    for (const side of [-1, 1]) {
      box(group, 0.24, h * 0.73, 0.5, mats.ashlar, side * (w / 2 + 0.16), h * 0.365, 0.1, {
        uvScale: 0.55,
        rounded: 0.02
      });
    }
    archedBand(group, mats, w, h, 0.16, 8);
    box(group, w + 0.65, 0.16, 0.53, mats.ashlar, 0, -0.04, 0.14, {
      uvScale: 0.5,
      rounded: 0.025
    });
  }
  if (sill) {
    box(group, w + 0.52, 0.12, 0.38, mats.ashlar, 0, 0.02, 0.3, { uvScale: 0.45, rounded: 0.02 });
  }
  sphere(group, 0.07, mats.ashlar, 0, h + 0.17, 0.26, { width: 7, height: 5 });
  return group;
}

function createDoorGroup(mats, w, h, options = {}) {
  const { double = true, ironwork = true } = options;
  const group = new THREE.Group();
  group.name = "arched-door";

  const doorGeo = new THREE.ExtrudeGeometry(createArchShape(w, h), {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 22
  });
  const door = new THREE.Mesh(doorGeo, mats.woodDark);
  door.position.z = -0.065;
  door.castShadow = true;
  door.receiveShadow = true;
  group.add(door);

  const planks = double ? 6 : 5;
  for (let i = 1; i < planks; i++) {
    const x = -w / 2 + (i / planks) * w;
    box(group, 0.028, h * 0.76, 0.025, mats.charcoal, x, h * 0.38, 0.085, { castShadow: false });
  }
  if (double) {
    box(group, 0.04, h * 0.86, 0.03, mats.iron, 0, h * 0.42, 0.09, { castShadow: false });
    for (const sx of [-w / 4, w / 4]) {
      torus(group, 0.08, 0.018, mats.goldAntique, sx, h * 0.38, 0.12, { castShadow: false });
    }
  }
  if (ironwork) {
    for (const yy of [h * 0.16, h * 0.33, h * 0.62]) {
      box(group, w * 0.91, 0.075, 0.045, mats.iron, 0, yy, 0.11, { rounded: 0.01 });
    }
    for (const sx of [-w * 0.36, w * 0.36]) {
      for (const yy of [h * 0.16, h * 0.33, h * 0.62]) {
        sphere(group, 0.035, mats.iron, sx, yy, 0.145, { width: 6, height: 4, castShadow: false });
      }
    }
  }
  for (const side of [-1, 1]) {
    box(group, 0.3, h * 0.72, 0.6, mats.ashlar, side * (w / 2 + 0.18), h * 0.36, 0.12, {
      uvScale: 0.55,
      rounded: 0.03
    });
  }
  archedBand(group, mats, w, h, 0.18, 9);
  box(group, w + 0.8, 0.18, 0.72, mats.ashlar, 0, -0.02, 0.18, { uvScale: 0.5, rounded: 0.03 });
  return group;
}

function createArrowSlit(mats) {
  const g = new THREE.Group();
  g.name = "arrow-slit";
  box(g, 0.12, 1.25, 0.06, mats.charcoal, 0, 0, 0, { castShadow: false });
  box(g, 0.24, 0.14, 0.16, mats.ashlar, 0, 0.67, 0.06, { uvScale: 0.35 });
  box(g, 0.24, 0.14, 0.16, mats.ashlar, 0, -0.67, 0.06, { uvScale: 0.35 });
  for (const sx of [-0.16, 0.16]) {
    box(g, 0.13, 1.4, 0.16, mats.ashlar, sx, 0, 0.05, { uvScale: 0.4, rounded: 0.015 });
  }
  return g;
}

function createArchPortalShape(width, height, openingWidth, openingHeight) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  shape.moveTo(-hw, -0.55);
  shape.lineTo(-hw, height);
  shape.lineTo(hw, height);
  shape.lineTo(hw, -0.55);
  shape.closePath();

  const hole = new THREE.Path();
  const ow = openingWidth / 2;
  const spring = openingHeight * 0.68;
  hole.moveTo(-ow, 0);
  hole.lineTo(-ow, spring);
  hole.quadraticCurveTo(-ow, openingHeight, 0, openingHeight);
  hole.quadraticCurveTo(ow, openingHeight, ow, spring);
  hole.lineTo(ow, 0);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

function createTorch(state, parent, mats, x, y, z, rotY = 0, options = {}) {
  const group = new THREE.Group();
  group.name = "wall-torch";
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  parent.add(group);
  box(group, 0.22, 0.42, 0.08, mats.iron, 0, 0.08, 0.02, { rounded: 0.02 });
  box(group, 0.06, 0.6, 0.07, mats.iron, 0, 0.32, 0.2, { rotX: 0.55, rounded: 0.01 });
  box(group, 0.06, 0.6, 0.07, mats.iron, 0, 0.72, 0.47, { rotX: -0.18, rounded: 0.01 });
  box(group, 0.22, 0.1, 0.22, mats.ironRust, 0, 1.04, 0.5, { rounded: 0.02 });
  const flame = sphere(group, 0.12, mats.flame, 0, 1.24, 0.5, {
    width: 7,
    height: 6,
    scale: [0.82, 1.8, 0.82],
    castShadow: false
  });
  flame.name = "torch-flame";
  const core = sphere(group, 0.065, mats.flameCore, 0, 1.18, 0.5, {
    width: 6,
    height: 5,
    scale: [0.7, 1.9, 0.7],
    castShadow: false
  });
  const halo = sphere(group, 0.34, mats.glow, 0, 1.27, 0.5, { width: 8, height: 6, castShadow: false });
  state.flames.push({ mesh: flame, core, halo, phase: state.flames.length * 1.37 });
  if (options.light !== false) {
    const offset = new THREE.Vector3(0, 1.15, 0.75).applyAxisAngle(Y_AXIS, rotY);
    state.lightSpots.push({
      position: new THREE.Vector3(x + offset.x, y + offset.y, z + offset.z),
      color: 0xffa95a,
      intensity: options.intensity || 0.9,
      distance: options.distance || 7.5,
      type: "torch"
    });
  }
  return group;
}

function createFlag(state, parent, mats, x, y, z, options = {}) {
  const { poleHeight = 4.2, size = 1.2, rotY = 0 } = options;
  const root = new THREE.Group();
  root.name = "flag-pole";
  root.position.set(x, y, z);
  root.rotation.y = rotY;
  parent.add(root);
  cylinder(root, 0.045, 0.06, poleHeight, mats.iron, 0, poleHeight / 2, 0, { segments: 6 });
  sphere(root, 0.13, mats.gold, 0, poleHeight + 0.08, 0, { width: 8, height: 6 });
  const geo = new THREE.PlaneGeometry(size, size * 0.66, 12, 4);
  geo.translate(size / 2, -size * 0.33, 0);
  const cloth = new THREE.Mesh(geo, mats.banner);
  cloth.position.set(0.03, poleHeight - 0.2, 0);
  cloth.castShadow = true;
  root.add(cloth);
  state.flags.push({
    mesh: cloth,
    base: new Float32Array(geo.attributes.position.array),
    size,
    phase: state.flags.length * 0.91,
    kind: "pole"
  });
  return root;
}

function createHangingBanner(state, parent, mats, x, y, z, rotY = 0, options = {}) {
  const { width = 1.25, height = 3.2 } = options;
  const root = new THREE.Group();
  root.name = "hanging-banner";
  root.position.set(x, y, z);
  root.rotation.y = rotY;
  parent.add(root);
  cylinder(root, 0.035, 0.035, width + 0.5, mats.iron, 0, 0.15, 0, { rotZ: Math.PI / 2, segments: 6 });
  for (const sx of [-width / 2, width / 2]) {
    torus(root, 0.055, 0.012, mats.iron, sx, 0.15, 0, { radialSegments: 5, tubularSegments: 14 });
  }
  const geo = new THREE.PlaneGeometry(width, height, 7, 12);
  geo.translate(0, -height / 2 - 0.02, 0);
  const cloth = new THREE.Mesh(geo, mats.banner);
  cloth.castShadow = true;
  root.add(cloth);
  state.flags.push({
    mesh: cloth,
    base: new Float32Array(geo.attributes.position.array),
    size: width,
    phase: state.flags.length * 0.73,
    kind: "hang",
    height
  });
  return root;
}

function addBalustrade(parent, mats, x1, z1, x2, z2, y, options = {}) {
  const { height = 1.02, spacing = 0.38 } = options;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const rot = Math.atan2(-dz, dx);
  const group = new THREE.Group();
  group.name = "stone-balustrade";
  group.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  group.rotation.y = rot;
  parent.add(group);
  box(group, len, 0.12, 0.3, mats.ashlar, 0, 0.06, 0, { uvScale: 0.7, rounded: 0.025 });
  box(group, len + 0.07, 0.14, 0.34, mats.ashlar, 0, height, 0, { uvScale: 0.7, rounded: 0.03 });
  const profile = [
    [0.085, 0], [0.075, 0.07], [0.055, 0.11], [0.095, 0.19],
    [0.11, 0.29], [0.075, 0.38], [0.06, 0.58], [0.1, 0.68],
    [0.105, 0.79], [0.07, height - 0.2]
  ];
  const geo = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), 10);
  const count = Math.max(2, Math.floor((len - 0.4) / spacing));
  const transforms = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    transforms.push({ position: [-len / 2 + t * len, 0.12, 0] });
  }
  instanced(group, geo, mats.ashlar, transforms, { name: "balusters", castShadow: true });
  for (const side of [-1, 1]) {
    box(group, 0.27, height + 0.14, 0.38, mats.ashlar, side * (len / 2), (height + 0.14) / 2, 0, {
      uvScale: 0.6,
      rounded: 0.035
    });
    sphere(group, 0.14, mats.ashlar, side * (len / 2), height + 0.28, 0, { width: 8, height: 6 });
  }
  return group;
}

function addIvyPatch(state, origin, right, normal, width, height, count, seed = 1) {
  const r = rng(seed);
  const o = new THREE.Vector3(origin[0], origin[1], origin[2]);
  const rt = new THREE.Vector3(right[0], right[1], right[2]).normalize();
  const nm = new THREE.Vector3(normal[0], normal[1], normal[2]).normalize();
  for (let i = 0; i < count; i++) {
    const across = (r() - 0.5) * width;
    const up = (r() - 0.5) * height;
    const pos = o.clone().addScaledVector(rt, across).add(new THREE.Vector3(0, up, 0)).addScaledVector(nm, 0.055 + r() * 0.06);
    state.ivy.push({
      position: [pos.x, pos.y, pos.z],
      rotation: [r() * TAU, r() * TAU, r() * TAU],
      scale: [0.55 + r() * 0.95, 0.4 + r() * 0.6, 0.1]
    });
    if (r() > 0.84) {
      state.ivyFlowers.push({
        position: [pos.x, pos.y + 0.03, pos.z],
        rotation: [r() * TAU, r() * TAU, 0],
        scale: 0.55 + r() * 0.55
      });
    }
  }
}

function addCrenellations(state, specs) {
  for (const spec of specs) {
    const [x, z, rotY, length, y] = spec;
    const count = Math.max(1, Math.floor(length / 1.55));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const lx = -length / 2 + t * length;
      const pos = new THREE.Vector3(lx, 0, 0).applyAxisAngle(Y_AXIS, rotY);
      state.merlonTransforms.push({
        position: [x + pos.x, y, z + pos.z],
        rotation: [0, rotY, 0]
      });
    }
  }
}

export function buildArchitecture({ layers, mats }) {
  const state = {
    flags: [],
    flames: [],
    smokeSpots: [],
    lightSpots: [],
    ivy: [],
    ivyFlowers: [],
    merlonTransforms: [],
    windows: 0,
    doors: 0
  };

  const keep = WORLD.keep;
  const W = keep.w;
  const D = keep.d;
  const T = 0.66;
  const hx = W / 2;
  const hz = D / 2;
  const trim = mats.ashlar;
  const stone = mats.wallStone;

  const face = (parent, element, side, pos, y, rotationOffset = 0) => {
    if (side === "south") {
      element.position.set(pos, y, hz + 0.035);
      element.rotation.y = 0;
    } else if (side === "north") {
      element.position.set(pos, y, -hz - 0.035);
      element.rotation.y = Math.PI;
    } else if (side === "east") {
      element.position.set(hx + 0.035, y, pos);
      element.rotation.y = Math.PI / 2;
    } else {
      element.position.set(-hx - 0.035, y, pos);
      element.rotation.y = -Math.PI / 2;
    }
    element.rotation.y += rotationOffset;
    parent.add(element);
    if (element.userData.isWindow) state.windows += 1;
    if (element.userData.isDoor) state.doors += 1;
    return element;
  };

  const addWindow = (parent, side, pos, y, w = 1.45, h = 2.65, options = {}) => {
    const win = createWindowGroup(mats, w, h, options);
    win.userData.isWindow = true;
    face(parent, win, side, pos, y);
    return win;
  };
  const addDoor = (parent, side, pos, y, w = 3.1, h = 4.0, options = {}) => {
    const door = createDoorGroup(mats, w, h, options);
    door.userData.isDoor = true;
    face(parent, door, side, pos, y);
    return door;
  };

  const keepShell = (groupIndex, yStart, yEnd) => {
    const g = new THREE.Group();
    g.name = "keep-storey-" + groupIndex;
    const group = groupIndex === 0 ? layers.keep0 : groupIndex === 1 ? layers.keep1 : layers.keep2;
    group.add(g);
    const height = yEnd - yStart;
    if (groupIndex === 0) {
      box(g, W + 0.7, 0.64, D + 0.7, trim, 0, -0.02, 0, { uvScale: 1.2, rounded: 0.04 });
    } else {
      box(g, W + 0.55, 0.34, D + 0.55, trim, 0, yStart + 0.17, 0, { uvScale: 1.4, rounded: 0.03 });
    }
    const floorY = groupIndex === 0 ? 0.3 : yStart + 0.35;
    const floorMat = groupIndex === 2 ? mats.wood : mats.stoneFloor;
    box(g, W - 1.35, 0.09, D - 1.35, floorMat, 0, floorY - 0.045, 0, { uvScale: 2.5, receiveShadow: true });
    const wallBottom = yStart;
    const wallTop = yEnd;
    const wallH = wallTop - wallBottom;
    box(g, W, wallH, T, stone, 0, wallBottom + wallH / 2, hz - T / 2, { uvScale: 3.4, rounded: 0.025 });
    box(g, W, wallH, T, stone, 0, wallBottom + wallH / 2, -hz + T / 2, { uvScale: 3.4, rounded: 0.025 });
    box(g, T, wallH, D - T * 2, stone, -hx + T / 2, wallBottom + wallH / 2, 0, { uvScale: 3.4, rounded: 0.025 });
    box(g, T, wallH, D - T * 2, stone, hx - T / 2, wallBottom + wallH / 2, 0, { uvScale: 3.4, rounded: 0.025 });

    const innerW = W - T * 2 - 0.02;
    const innerD = D - T * 2 - 0.02;
    const liningY = floorY + (wallTop - floorY) / 2;
    const liningH = wallTop - floorY - 0.06;
    const plaster = groupIndex === 1 ? mats.plasterWarm : mats.plaster;
    box(g, innerW, liningH, 0.05, plaster, 0, liningY, -hz + T + 0.03, { castShadow: false, receiveShadow: true });
    box(g, innerW, liningH, 0.05, plaster, 0, liningY, hz - T - 0.03, { castShadow: false, receiveShadow: true });
    box(g, 0.05, liningH, innerD, plaster, -hx + T + 0.03, liningY, 0, { castShadow: false, receiveShadow: true });
    box(g, 0.05, liningH, innerD, plaster, hx - T - 0.03, liningY, 0, { castShadow: false, receiveShadow: true });
    box(g, innerW, 0.98, 0.075, mats.woodDark, 0, floorY + 0.49, -hz + T + 0.09, { castShadow: false });
    box(g, innerW, 0.98, 0.075, mats.woodDark, 0, floorY + 0.49, hz - T - 0.09, { castShadow: false });
    box(g, 0.075, 0.98, innerD, mats.woodDark, -hx + T + 0.09, floorY + 0.49, 0, { castShadow: false });
    box(g, 0.075, 0.98, innerD, mats.woodDark, hx - T - 0.09, floorY + 0.49, 0, { castShadow: false });
    for (const px of [-6.1, -2.3, 2.3, 6.1]) {
      box(g, 0.16, liningH - 0.1, 0.11, mats.woodDark, px, liningY, -hz + T + 0.11, { rounded: 0.02, castShadow: false });
      box(g, 0.16, liningH - 0.1, 0.11, mats.woodDark, px, liningY, hz - T - 0.11, { rounded: 0.02, castShadow: false });
    }
    // A perimeter cornice, not a ceiling: the cutaway views need open rooms.
    box(g, W + 0.4, 0.2, 0.34, trim, 0, wallTop - 0.03, hz - 0.17, { uvScale: 1.1, rounded: 0.03 });
    box(g, W + 0.4, 0.2, 0.34, trim, 0, wallTop - 0.03, -hz + 0.17, { uvScale: 1.1, rounded: 0.03 });
    box(g, 0.34, 0.2, D + 0.4, trim, hx - 0.17, wallTop - 0.03, 0, { uvScale: 1.1, rounded: 0.03 });
    box(g, 0.34, 0.2, D + 0.4, trim, -hx + 0.17, wallTop - 0.03, 0, { uvScale: 1.1, rounded: 0.03 });

    const quoinGeo = new THREE.BoxGeometry(0.8, 0.38, 0.8);
    const quoins = [];
    const rows = Math.max(3, Math.floor(wallH / 0.7));
    for (let row = 0; row < rows; row++) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const big = row % 2 === 0;
          quoins.push({
            position: [sx * (hx - 0.16), wallBottom + 0.3 + row * 0.64, sz * (hz - 0.16)],
            scale: [big ? 1.18 : 0.82, 1, big ? 1.18 : 0.82]
          });
        }
      }
    }
    const qmesh = new THREE.InstancedMesh(quoinGeo, trim, quoins.length);
    const dummy = new THREE.Object3D();
    quoins.forEach((q, i) => {
      dummy.position.set(q.position[0], q.position[1], q.position[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(q.scale[0], q.scale[1], q.scale[2]);
      dummy.updateMatrix();
      qmesh.setMatrixAt(i, dummy.matrix);
    });
    qmesh.castShadow = true;
    qmesh.receiveShadow = true;
    g.add(qmesh);
    return { group: g, floorY, height };
  };

  keepShell(0, 0, keep.floors[1]);
  keepShell(1, keep.floors[1], keep.floors[2]);
  keepShell(2, keep.floors[2], keep.floors[3]);

  // ── Keep facades ──────────────────────────────────────────────────────
  addDoor(layers.keep0, "south", 0, 0.3, 3.25, 4.15, { double: true });
  addDoor(layers.keep0, "north", 0, 0.3, 3.05, 3.8, { double: true });
  addWindow(layers.keep0, "south", -5.15, 1.0, 1.55, 2.7);
  addWindow(layers.keep0, "south", 5.15, 1.0, 1.55, 2.7);
  addWindow(layers.keep0, "north", -5.1, 1.0, 1.45, 2.5);
  addWindow(layers.keep0, "north", 5.1, 1.0, 1.45, 2.5);
  addWindow(layers.keep0, "east", 4.95, 1.2, 1.15, 2.1);
  addWindow(layers.keep0, "west", -4.95, 1.2, 1.15, 2.1);
  addWindow(layers.keep0, "south", -7.0, 1.35, 0.85, 1.55);
  addWindow(layers.keep0, "south", 7.0, 1.35, 0.85, 1.55);

  addDoor(layers.keep1, "south", 0, keep.floors[1] + 0.35, 2.25, 3.05, { double: true });
  addWindow(layers.keep1, "south", -5.15, keep.floors[1] + 0.8, 1.55, 2.55);
  addWindow(layers.keep1, "south", 5.15, keep.floors[1] + 0.8, 1.55, 2.55);
  addWindow(layers.keep1, "north", -5.0, keep.floors[1] + 0.8, 1.5, 2.45);
  addWindow(layers.keep1, "north", 0.0, keep.floors[1] + 0.8, 1.5, 2.45);
  addWindow(layers.keep1, "north", 5.0, keep.floors[1] + 0.8, 1.5, 2.45);
  for (const side of [-1, 1]) {
    addWindow(layers.keep1, side > 0 ? "east" : "west", -2.85, keep.floors[1] + 0.8, 1.25, 2.2);
    addWindow(layers.keep1, side > 0 ? "east" : "west", 2.85, keep.floors[1] + 0.8, 1.25, 2.2);
  }

  addWindow(layers.keep2, "south", -5.1, keep.floors[2] + 0.8, 1.35, 2.2);
  addWindow(layers.keep2, "south", 0, keep.floors[2] + 0.8, 1.35, 2.2);
  addWindow(layers.keep2, "south", 5.1, keep.floors[2] + 0.8, 1.35, 2.2);
  addDoor(layers.keep2, "north", 0, keep.floors[2] + 0.35, 2.0, 2.65, { double: true });
  addWindow(layers.keep2, "north", -5.0, keep.floors[2] + 0.8, 1.3, 2.1);
  addWindow(layers.keep2, "north", 5.0, keep.floors[2] + 0.8, 1.3, 2.1);
  for (const side of [-1, 1]) {
    addWindow(layers.keep2, side > 0 ? "east" : "west", -2.7, keep.floors[2] + 0.8, 1.15, 2.0);
    addWindow(layers.keep2, side > 0 ? "east" : "west", 2.7, keep.floors[2] + 0.8, 1.15, 2.0);
  }

  const addInteriorWindow = (parent, side, pos, y, w, h) => {
    const win = createWindowGroup(mats, w, h, { deepFrame: false, mullions: true });
    win.scale.setScalar(0.82);
    if (side === "south") {
      win.position.set(pos, y, hz - T - 0.11);
      win.rotation.y = Math.PI;
    } else if (side === "north") {
      win.position.set(pos, y, -hz + T + 0.11);
      win.rotation.y = 0;
    } else if (side === "east") {
      win.position.set(hx - T - 0.11, y, pos);
      win.rotation.y = -Math.PI / 2;
    } else {
      win.position.set(-hx + T + 0.11, y, pos);
      win.rotation.y = Math.PI / 2;
    }
    parent.add(win);
  };
  addInteriorWindow(layers.keep0, "south", 5.15, 1.1, 1.3, 2.3);
  addInteriorWindow(layers.keep0, "south", -5.15, 1.1, 1.3, 2.3);
  addInteriorWindow(layers.keep0, "north", 0, 2.2, 1.2, 2.0);
  addInteriorWindow(layers.keep1, "south", 5.15, keep.floors[1] + 0.95, 1.25, 2.1);
  addInteriorWindow(layers.keep1, "north", 0, keep.floors[1] + 0.95, 1.2, 2.0);
  addInteriorWindow(layers.keep2, "south", 0, keep.floors[2] + 0.95, 1.15, 1.8);

  for (let level = 0; level < 3; level++) {
    const g = level === 0 ? layers.keep0 : level === 1 ? layers.keep1 : layers.keep2;
    const y0 = keep.floors[level];
    const y1 = keep.floors[level + 1];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        box(g, 0.95, y1 - y0 - 0.18, 0.52, trim, sx * (hx + 0.12), (y0 + y1) / 2, sz * (hz - 0.2), {
          uvScale: 1.2,
          rounded: 0.03
        });
      }
    }
  }

  for (const side of [-1, 1]) {
    box(layers.keep0, 5.4, 0.22, 1.25, mats.stoneFloor, 0, 0.16, side * (hz + 0.6), {
      uvScale: 1.1,
      rounded: 0.03
    });
    box(layers.keep0, 5.6, 0.14, 0.45, trim, 0, 0.09, side * (hz + 1.32), { uvScale: 0.8, rounded: 0.02 });
    box(layers.keep0, 5.8, 0.08, 0.42, trim, 0, 0.04, side * (hz + 1.7), { uvScale: 0.8, rounded: 0.02 });
    for (const sx of [-2.95, 2.95]) {
      cylinder(layers.keep0, 0.22, 0.28, 0.8, mats.weatheredStone, sx, 0.4, side * (hz + 1.1), { segments: 8 });
      sphere(layers.keep0, 0.18, trim, sx, 0.83, side * (hz + 1.1), { width: 8, height: 6 });
    }
  }

  createTorch(state, layers.keep0, mats, -2.35, 2.0, hz + 0.26, 0, { intensity: 0.75 });
  createTorch(state, layers.keep0, mats, 2.35, 2.0, hz + 0.26, 0, { intensity: 0.75 });
  createTorch(state, layers.keep0, mats, -2.35, 2.0, -hz - 0.26, Math.PI, { intensity: 0.6 });
  createTorch(state, layers.keep0, mats, 2.35, 2.0, -hz - 0.26, Math.PI, { intensity: 0.6 });

  addIvyPatch(state, [-hx - 0.03, 2.3, 2.0], [0, 0, 1], [-1, 0, 0], 6.5, 4.1, 150, 301);
  addIvyPatch(state, [hx + 0.03, 2.1, -2.0], [0, 0, -1], [1, 0, 0], 5.2, 3.4, 110, 302);

  // ── Balconies ─────────────────────────────────────────────────────────
  const balconySouth = new THREE.Group();
  balconySouth.name = "south-balcony";
  layers.keep1.add(balconySouth);
  const balconyY = keep.floors[1] + 0.35;
  box(balconySouth, 8.8, 0.3, 3.1, mats.ashlar, 0, balconyY - 0.15, hz + 1.52, { uvScale: 1.5, rounded: 0.03 });
  box(balconySouth, 8.3, 0.12, 2.75, mats.stoneFloor, 0, balconyY + 0.02, hz + 1.52, { uvScale: 2, rounded: 0.02 });
  for (const x of [-3.4, -1.7, 0, 1.7, 3.4]) {
    box(balconySouth, 0.34, 0.85, 1.15, mats.weatheredStone, x, balconyY - 0.88, hz + 0.52, {
      rotX: 0.34,
      uvScale: 0.8,
      rounded: 0.03
    });
  }
  addBalustrade(balconySouth, mats, -4.25, hz + 3.01, 4.25, hz + 3.01, balconyY, { height: 1.04 });
  addBalustrade(balconySouth, mats, -4.25, hz + 0.18, -4.25, hz + 3.0, balconyY, { height: 1.04 });
  addBalustrade(balconySouth, mats, 4.25, hz + 0.18, 4.25, hz + 3.0, balconyY, { height: 1.04 });
  for (const sx of [-1, 1]) {
    box(balconySouth, 0.65, 0.82, 0.65, mats.ashlar, sx * 3.85, balconyY + 0.41, hz + 2.9, {
      uvScale: 0.7,
      rounded: 0.04
    });
  }

  const balconyNorth = new THREE.Group();
  balconyNorth.name = "north-balcony";
  layers.keep2.add(balconyNorth);
  const starY = keep.floors[2] + 0.35;
  box(balconyNorth, 7.8, 0.3, 2.55, mats.ashlar, 0, starY - 0.15, -hz - 1.25, { uvScale: 1.5, rounded: 0.03 });
  box(balconyNorth, 7.25, 0.11, 2.2, mats.stoneFloor, 0, starY + 0.02, -hz - 1.25, { uvScale: 2, rounded: 0.02 });
  for (const x of [-2.9, -1.45, 0, 1.45, 2.9]) {
    box(balconyNorth, 0.33, 0.75, 0.95, mats.weatheredStone, x, starY - 0.8, -hz - 0.5, {
      rotX: -0.32,
      uvScale: 0.8,
      rounded: 0.03
    });
  }
  addBalustrade(balconyNorth, mats, -3.75, -hz - 2.48, 3.75, -hz - 2.48, starY, { height: 1.0 });
  addBalustrade(balconyNorth, mats, -3.75, -hz - 0.15, -3.75, -hz - 2.48, starY, { height: 1.0 });
  addBalustrade(balconyNorth, mats, 3.75, -hz - 0.15, 3.75, -hz - 2.48, starY, { height: 1.0 });

  createTorch(state, balconySouth, mats, -3.85, balconyY + 1.18, hz + 0.3, 0, { light: false });
  createTorch(state, balconyNorth, mats, 3.35, starY + 1.12, -hz - 0.3, Math.PI, { light: false });

  // ── Keep roof ─────────────────────────────────────────────────────────
  const roof = new THREE.Group();
  roof.name = "keep-roof";
  layers.keepRoof.add(roof);
  box(roof, W + 0.9, 0.5, D + 0.9, trim, 0, keep.floors[3] + 0.1, 0, { uvScale: 1.2, rounded: 0.04 });
  const roofH = keep.roofH;
  const roofGeo = createHipRoofGeometry(W + 2.0, D + 2.0, roofH, 2.0);
  const roofMesh = new THREE.Mesh(roofGeo, mats.slate);
  roofMesh.name = "keep-hip-roof";
  roofMesh.position.set(0, keep.floors[3] + 0.33, 0);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  roof.add(roofMesh);
  box(roof, W + 2.05, 0.19, D + 2.05, mats.woodDark, 0, keep.floors[3] + 0.28, 0, { rounded: 0.02 });
  const ridgeY = keep.floors[3] + 0.33 + roofH;
  cylinder(roof, 0.15, 0.15, 5.4, mats.copperPatina, 0, ridgeY + 0.06, 0, { rotZ: Math.PI / 2, segments: 8 });
  for (const sx of [-1, 1]) {
    sphere(roof, 0.18, mats.gold, sx * 2.7, ridgeY + 0.05, 0, { width: 8, height: 6 });
    cone(roof, 0.13, 0.55, mats.gold, sx * 2.7, ridgeY + 0.38, 0, { segments: 6 });
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cylinder(roof, 0.22, 0.28, 0.9, trim, sx * (hx + 0.35), keep.floors[3] + 0.6, sz * (hz + 0.35), { segments: 8 });
      cone(roof, 0.28, 1.25, mats.slateDark, sx * (hx + 0.35), keep.floors[3] + 1.65, sz * (hz + 0.35), { segments: 8 });
      sphere(roof, 0.11, mats.gold, sx * (hx + 0.35), keep.floors[3] + 2.33, sz * (hz + 0.35), { width: 8, height: 6 });
    }
  }

  const addDormer = (x, z, rot) => {
    const d = new THREE.Group();
    d.position.set(x, keep.floors[3] + 0.18, z);
    d.rotation.y = rot;
    roof.add(d);
    box(d, 2.2, 1.8, 1.75, mats.ashlar, 0, 1.12, 1.35, { uvScale: 0.9, rounded: 0.03 });
    const shape = new THREE.Shape();
    shape.moveTo(-1.25, 0);
    shape.lineTo(1.25, 0);
    shape.lineTo(0, 1.05);
    shape.closePath();
    const prism = new THREE.ExtrudeGeometry(shape, { depth: 1.95, bevelEnabled: false, curveSegments: 1 });
    prism.translate(0, 0, -0.98);
    const dm = new THREE.Mesh(prism, mats.slateDark);
    dm.position.set(0, 2.02, 1.35);
    dm.castShadow = true;
    dm.receiveShadow = true;
    d.add(dm);
    const wg = createWindowGroup(mats, 1.05, 1.24, { deepFrame: false });
    wg.position.set(0, 0.72, 2.24);
    d.add(wg);
    state.windows += 1;
    box(d, 2.8, 0.13, 0.34, mats.woodDark, 0, 1.9, 2.22, { rounded: 0.02 });
  };
  for (const x of [-4.35, 4.35]) {
    addDormer(x, hz - 1.75, 0);
    addDormer(x, -hz + 1.75, Math.PI);
  }

  for (const sx of [-1, 1]) {
    const cx = sx * 5.0;
    const cz = -2.4;
    const stackH = 3.5;
    const baseY = keep.floors[3] + 3.7;
    box(roof, 1.55, 0.38, 1.1, trim, cx, baseY + 0.19, cz, { uvScale: 0.8, rounded: 0.03 });
    box(roof, 1.1, stackH, 0.78, stone, cx, baseY + stackH / 2, cz, { uvScale: 0.8, rounded: 0.02 });
    box(roof, 1.42, 0.26, 1.0, trim, cx, baseY + stackH, cz, { uvScale: 0.7, rounded: 0.03 });
    for (const s of [-1, 1]) {
      cylinder(roof, 0.18, 0.22, 0.4, mats.charcoal, cx + s * 0.27, baseY + stackH + 0.3, cz, { segments: 8 });
    }
    state.smokeSpots.push(new THREE.Vector3(cx, baseY + stackH + 0.7, cz));
  }
  createFlag(state, roof, mats, 1.25, ridgeY + 0.1, 0, { poleHeight: 4.4, size: 1.55, rotY: -0.12 });

  // ── Attached wings: kitchen and chapel ──────────────────────────────
  const wingH = WORLD.wings.height;
  const buildWing = (side) => {
    const isChapel = side > 0;
    const x0 = side * WORLD.wings.x0;
    const x1 = side * WORLD.wings.x1;
    const cx = (x0 + x1) / 2;
    const depth = WORLD.wings.z * 2;
    const group = new THREE.Group();
    group.name = isChapel ? "chapel-wing" : "kitchen-wing";
    layers.general.add(group);
    box(group, 5.9, 0.4, depth + 0.3, trim, cx, 0.2, 0, { uvScale: 1.2, rounded: 0.03 });
    const wx = isChapel ? x1 - 0.28 : x0 + 0.28;
    box(group, 0.56, wingH, depth, stone, wx, wingH / 2, 0, { uvScale: 2.6, rounded: 0.025 });
    box(group, Math.abs(x1 - x0), wingH, 0.56, stone, cx, wingH / 2, WORLD.wings.z - 0.28, { uvScale: 2.6, rounded: 0.025 });
    box(group, Math.abs(x1 - x0), wingH, 0.56, stone, cx, wingH / 2, -WORLD.wings.z + 0.28, { uvScale: 2.6, rounded: 0.025 });
    box(group, 4.5, 0.16, 6.8, isChapel ? mats.stoneFloor : mats.cobble, cx, 0.32, 0, { uvScale: 1.8 });
    const interiorMat = isChapel ? mats.plasterWarm : mats.plaster;
    box(group, 0.06, wingH - 0.8, depth - 0.8, interiorMat, isChapel ? x1 - 0.57 : x0 + 0.57, 2.55, 0, { castShadow: false });
    for (const z of [-2.4, 2.4]) {
      const win = createWindowGroup(mats, 1.12, 2.0, { deepFrame: true });
      win.position.set(wx + (isChapel ? 0.32 : -0.32), 1.15, z);
      win.rotation.y = isChapel ? Math.PI / 2 : -Math.PI / 2;
      group.add(win);
      state.windows += 1;
    }
    if (isChapel) {
      const greatWindow = createWindowGroup(mats, 2.2, 3.0, {
        material: mats.stainedGlass,
        deepFrame: true,
        mullions: true
      });
      greatWindow.position.set(x1 + 0.04, 0.9, -0.3);
      greatWindow.rotation.y = Math.PI / 2;
      group.add(greatWindow);
      state.windows += 1;
      const interior = createWindowGroup(mats, 2.2, 3.0, {
        material: mats.stainedGlass,
        deepFrame: false,
        mullions: true
      });
      interior.position.set(x1 - 0.62, 0.9, -0.3);
      interior.rotation.y = -Math.PI / 2;
      group.add(interior);
      for (const z of [-2.5, 0, 2.5]) {
        box(group, 0.55, 3.7, 0.7, trim, x1 + 0.35, 1.85, z, { uvScale: 0.8, rounded: 0.03 });
        box(group, 0.8, 0.45, 0.9, trim, x1 + 0.48, 3.78, z, { uvScale: 0.7, rounded: 0.025 });
      }
      const door = createDoorGroup(mats, 1.55, 2.65, { double: true, ironwork: true });
      door.position.set(x1 + 0.05, 0.42, 2.5);
      door.rotation.y = Math.PI / 2;
      group.add(door);
      state.doors += 1;
      box(group, 2.1, 0.14, 0.7, trim, x1 + 0.4, 0.35, 2.5, { uvScale: 0.7, rounded: 0.02 });
      box(group, 2.0, 0.11, 0.6, trim, x1 + 0.65, 0.24, 2.5, { uvScale: 0.7, rounded: 0.02 });
    } else {
      const door = createDoorGroup(mats, 1.4, 2.4, { double: false });
      door.position.set(x0 - 0.05, 0.42, 2.45);
      door.rotation.y = -Math.PI / 2;
      group.add(door);
      state.doors += 1;
      box(group, 2.1, 0.14, 0.7, trim, x0 - 0.4, 0.35, 2.45, { uvScale: 0.7, rounded: 0.02 });
      box(group, 2.0, 0.11, 0.6, trim, x0 - 0.65, 0.24, 2.45, { uvScale: 0.7, rounded: 0.02 });
    }
    box(group, 0.4, 0.3, depth + 0.1, trim, wx, 0.3, 0, { uvScale: 0.8, rounded: 0.02 });

    const wingRoof = new THREE.Group();
    wingRoof.name = isChapel ? "chapel-roof" : "kitchen-roof";
    layers.fixedRoofs.add(wingRoof);
    const rShape = new THREE.Shape();
    const rw = 6.7;
    const rd = depth + 0.9;
    const rh = 2.5;
    rShape.moveTo(-rw / 2, 0);
    rShape.lineTo(rw / 2, 0);
    rShape.lineTo(0, rh);
    rShape.closePath();
    const rg = new THREE.ExtrudeGeometry(rShape, { depth: rd, bevelEnabled: false });
    rg.translate(0, 0, -rd / 2);
    const wingRoofMesh = new THREE.Mesh(rg, mats.slate);
    wingRoofMesh.position.set(cx, wingH + 0.32, 0);
    wingRoofMesh.castShadow = true;
    wingRoofMesh.receiveShadow = true;
    wingRoof.add(wingRoofMesh);
    box(wingRoof, rw + 0.2, 0.16, 0.28, mats.woodDark, cx, wingH + 0.3, rd / 2 - 0.05, { rounded: 0.02 });
    box(wingRoof, rw + 0.2, 0.16, 0.28, mats.woodDark, cx, wingH + 0.3, -rd / 2 + 0.05, { rounded: 0.02 });
    cylinder(wingRoof, 0.1, 0.1, rd - 0.2, mats.copperPatina, cx, wingH + 0.88 + rh, 0, { rotX: Math.PI / 2, segments: 8 });
    if (isChapel) {
      cylinder(wingRoof, 0.32, 0.5, 1.2, trim, cx - 1.3, wingH + 1.55, 1.8, { segments: 8 });
      cone(wingRoof, 0.26, 2.2, mats.slateDark, cx - 1.3, wingH + 3.25, 1.8, { segments: 8 });
      box(wingRoof, 0.08, 0.9, 0.08, mats.gold, cx - 1.3, wingH + 4.45, 1.8, { rounded: 0.01 });
      box(wingRoof, 0.5, 0.08, 0.08, mats.gold, cx - 1.3, wingH + 4.62, 1.8, { rounded: 0.01 });
    } else {
      const chim = cx - 1.9;
      const chz = -2.4;
      box(wingRoof, 1.1, 3.2, 0.9, stone, chim, wingH + 1.9, chz, { uvScale: 0.8, rounded: 0.02 });
      box(wingRoof, 1.4, 0.24, 1.15, trim, chim, wingH + 3.55, chz, { uvScale: 0.7, rounded: 0.02 });
      state.smokeSpots.push(new THREE.Vector3(chim, wingH + 3.8, chz));
    }
    addIvyPatch(state, [isChapel ? x1 + 0.02 : x0 - 0.02, 1.5, -2.8], [0, 0, 1], [isChapel ? 1 : -1, 0, 0], 4.4, 2.6, 70, isChapel ? 511 : 512);
    return { group, wingRoof, cx };
  };
  buildWing(-1);
  buildWing(1);

  // ── Curtain walls ─────────────────────────────────────────────────────
  const walls = new THREE.Group();
  walls.name = "curtain-walls";
  layers.general.add(walls);
  const wallH = WORLD.wall.height;
  const wallT = WORLD.wall.thickness;
  const gateGap = 7.95;
  const wallSegments = [
    { x: (WORLD.wall.x + gateGap) / 2, z: WORLD.wall.z, w: WORLD.wall.x - gateGap, d: wallT, horizontal: true, sign: 1 },
    { x: -(WORLD.wall.x + gateGap) / 2, z: WORLD.wall.z, w: WORLD.wall.x - gateGap, d: wallT, horizontal: true, sign: 1 },
    { x: (WORLD.wall.x + gateGap) / 2, z: -WORLD.wall.z, w: WORLD.wall.x - gateGap, d: wallT, horizontal: true, sign: -1 },
    { x: -(WORLD.wall.x + gateGap) / 2, z: -WORLD.wall.z, w: WORLD.wall.x - gateGap, d: wallT, horizontal: true, sign: -1 },
    { x: WORLD.wall.x, z: 0, w: wallT, d: WORLD.wall.z * 2, horizontal: false, sign: 1 },
    { x: -WORLD.wall.x, z: 0, w: wallT, d: WORLD.wall.z * 2, horizontal: false, sign: -1 }
  ];
  for (const seg of wallSegments) {
    box(walls, seg.w, wallH, seg.d, stone, seg.x, wallH / 2, seg.z, { uvScale: 3.6, rounded: 0.03 });
    box(walls, seg.w + 0.25, 0.75, seg.d + 0.45, trim, seg.x, 0.36, seg.z, { uvScale: 1.4, rounded: 0.03 });
    if (seg.horizontal) {
      box(walls, seg.w - 0.1, 0.16, 1.15, mats.cobble, seg.x, wallH + 0.08, seg.z, { uvScale: 1.3 });
      box(walls, seg.w - 0.3, 0.45, 0.25, trim, seg.x, wallH + 0.35, seg.z - seg.sign * 0.55, { uvScale: 0.8, rounded: 0.02 });
    } else {
      box(walls, 1.15, 0.16, seg.d, mats.cobble, seg.x, wallH + 0.08, seg.z, { uvScale: 1.3 });
      box(walls, 0.25, 0.45, seg.d - 0.3, trim, seg.x - seg.sign * 0.55, wallH + 0.35, seg.z, { uvScale: 0.8, rounded: 0.02 });
    }
  }

  const wallY = wallH + 0.15;
  addCrenellations(state, [
    [(WORLD.wall.x + gateGap) / 2, WORLD.wall.z, 0, WORLD.wall.x - gateGap, wallY],
    [-(WORLD.wall.x + gateGap) / 2, WORLD.wall.z, 0, WORLD.wall.x - gateGap, wallY],
    [(WORLD.wall.x + gateGap) / 2, -WORLD.wall.z, 0, WORLD.wall.x - gateGap, wallY],
    [-(WORLD.wall.x + gateGap) / 2, -WORLD.wall.z, 0, WORLD.wall.x - gateGap, wallY],
    [WORLD.wall.x, 0, Math.PI / 2, WORLD.wall.z * 2, wallY],
    [-WORLD.wall.x, 0, Math.PI / 2, WORLD.wall.z * 2, wallY]
  ]);

  const slitPositions = [
    [-21, WORLD.wall.z + wallT / 2 + 0.01, 0], [-16, WORLD.wall.z + wallT / 2 + 0.01, 0], [-11, WORLD.wall.z + wallT / 2 + 0.01, 0],
    [11, WORLD.wall.z + wallT / 2 + 0.01, 0], [16, WORLD.wall.z + wallT / 2 + 0.01, 0], [21, WORLD.wall.z + wallT / 2 + 0.01, 0],
    [-21, -WORLD.wall.z - wallT / 2 - 0.01, Math.PI], [-15, -WORLD.wall.z - wallT / 2 - 0.01, Math.PI],
    [15, -WORLD.wall.z - wallT / 2 - 0.01, Math.PI], [21, -WORLD.wall.z - wallT / 2 - 0.01, Math.PI]
  ];
  for (const [x, z, rot] of slitPositions) {
    const slit = createArrowSlit(mats);
    slit.position.set(x, 4.2, z);
    slit.rotation.y = rot;
    walls.add(slit);
  }
  for (const sx of [-1, 1]) {
    for (const z of [-14, -7, 7, 14]) {
      const slit = createArrowSlit(mats);
      slit.position.set(sx * (WORLD.wall.x + wallT / 2 + 0.01), 4.2, z);
      slit.rotation.y = (sx * Math.PI) / 2;
      walls.add(slit);
    }
  }

  addIvyPatch(state, [-13, 2.0, WORLD.wall.z + 0.56], [1, 0, 0], [0, 0, 1], 7.0, 3.9, 90, 601);
  addIvyPatch(state, [17, 1.5, -WORLD.wall.z - 0.56], [-1, 0, 0], [0, 0, -1], 5.2, 3.2, 60, 602);

  // ── Towers ────────────────────────────────────────────────────────────
  const towerPositions = [
    [WORLD.wall.x, WORLD.wall.z], [WORLD.wall.x, -WORLD.wall.z],
    [-WORLD.wall.x, WORLD.wall.z], [-WORLD.wall.x, -WORLD.wall.z]
  ];

  const addRoundTower = (x, z, radius, height, opts = {}) => {
    const { roofHeight = 4.9, flag = true, group = layers.general, roofGroup = layers.fixedRoofs, name = "round-tower" } = opts;
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, 0, z);
    group.add(g);
    const shellGeo = new THREE.CylinderGeometry(radius * 0.92, radius, height, 24);
    adjustCylinderUV(shellGeo, radius, height, 3.4);
    const shell = new THREE.Mesh(shellGeo, stone);
    shell.position.y = height / 2;
    shell.castShadow = true;
    shell.receiveShadow = true;
    g.add(shell);
    cylinder(g, radius + 0.55, radius + 0.65, 0.8, trim, 0, 0.4, 0, { segments: 24 });
    cylinder(g, radius + 0.22, radius + 0.08, 0.5, trim, 0, height - 0.2, 0, { segments: 24 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      box(g, 0.28, 0.48, 0.48, trim, Math.cos(a) * (radius + 0.1), height - 0.55, Math.sin(a) * (radius + 0.1), {
        rotY: -a,
        uvScale: 0.5,
        rounded: 0.02
      });
    }
    for (const a of [0.4, 2.25, 4.1]) {
      const win = createWindowGroup(mats, 0.72, 1.55, { deepFrame: false });
      win.position.set(Math.sin(a) * (radius + 0.01), height - 2.7, Math.cos(a) * (radius + 0.01));
      win.rotation.y = a;
      g.add(win);
      state.windows += 1;
    }
    for (const yy of [height * 0.3, height * 0.56]) {
      const a = yy < height * 0.5 ? 1.1 : 5.0;
      const slit = createArrowSlit(mats);
      slit.scale.setScalar(0.7);
      slit.position.set(Math.sin(a) * (radius + 0.01), yy, Math.cos(a) * (radius + 0.01));
      slit.rotation.y = a;
      g.add(slit);
    }
    const inward = Math.atan2(-x, -z);
    const door = createDoorGroup(mats, 1.2, 2.2, { double: false });
    door.position.set(Math.sin(inward) * radius - 0.02, 0.25, Math.cos(inward) * radius - 0.02);
    door.rotation.y = inward;
    door.scale.setScalar(0.85);
    g.add(door);
    state.doors += 1;
    box(g, 1.8, 0.15, 0.7, trim, Math.sin(inward) * (radius + 0.25), 0.22, Math.cos(inward) * (radius + 0.25), {
      uvScale: 0.6,
      rounded: 0.02
    });
    const roofRoot = new THREE.Group();
    roofRoot.name = name + "-roof";
    roofRoot.position.set(x, 0, z);
    roofGroup.add(roofRoot);
    cone(roofRoot, radius + 0.85, roofHeight, mats.slate, 0, height + roofHeight / 2, 0, { segments: 16 });
    cylinder(roofRoot, 0.07, 0.09, 1.7, mats.iron, 0, height + roofHeight + 0.8, 0, { segments: 6 });
    sphere(roofRoot, 0.16, mats.gold, 0, height + roofHeight + 1.5, 0, { width: 8, height: 6 });
    if (flag) {
      createFlag(state, roofRoot, mats, 0, height + roofHeight + 0.5, 0, { poleHeight: 2.4, size: 0.75, rotY: Math.PI * 0.2 });
    }
    addIvyPatch(state, [x, 1.4, z + radius + 0.02], [1, 0, 0], [0, 0, 1], radius * 1.6, 2.1, 60, 700 + Math.round(x + z));
    return { group: g, roof: roofRoot };
  };

  for (const [x, z] of towerPositions) {
    addRoundTower(x, z, WORLD.tower.radius, WORLD.tower.height, {
      roofHeight: 5.2,
      flag: true,
      name: x < 0 ? (z > 0 ? "west-south-tower" : "west-north-tower") : (z > 0 ? "east-south-tower" : "east-north-tower")
    });
  }

  for (const sx of [-1, 1]) {
    addStairs(layers.general, 1.4, 12, 0.47, 0.34, mats.weatheredStone, sx * 13.6, WORLD.wall.z - 2.3, {
      rotY: sx > 0 ? Math.PI : 0,
      baseY: 0.05,
      railing: false,
      name: "wall-stair"
    });
  }

  // ── Gatehouses ────────────────────────────────────────────────────────
  const buildGatehouse = (gateZ, south) => {
    const group = new THREE.Group();
    group.name = south ? "south-gatehouse" : "north-gatehouse";
    layers.general.add(group);
    const gw = 15.9;
    const gh = 8.2;
    const depth = 4.3;
    const portalShape = createArchPortalShape(gw, gh, 3.35, 5.55);
    const geo = new THREE.ExtrudeGeometry(portalShape, { depth, bevelEnabled: false, curveSegments: 26 });
    const gateMesh = new THREE.Mesh(geo, stone);
    gateMesh.position.set(0, 0.2, gateZ - depth / 2);
    gateMesh.castShadow = true;
    gateMesh.receiveShadow = true;
    group.add(gateMesh);
    box(group, gw + 0.35, 0.22, depth + 0.3, trim, 0, gh + 0.15, gateZ, { uvScale: 1.2, rounded: 0.03 });
    addCrenellations(state, [[0, gateZ, 0, gw - 1.2, gh + 0.28]]);
    box(group, gw - 0.7, 0.18, depth - 0.3, mats.cobble, 0, gh + 0.1, gateZ, { uvScale: 1.3 });
    for (const dir of [-1, 1]) {
      archedBand(group, mats, 3.35, 5.55, gateZ + dir * (depth / 2) + dir * 0.05, 9);
      const shieldShape = new THREE.Shape();
      shieldShape.moveTo(-0.55, 0.62);
      shieldShape.quadraticCurveTo(-0.58, 0.1, 0, -0.55);
      shieldShape.quadraticCurveTo(0.58, 0.1, 0.55, 0.62);
      shieldShape.lineTo(0, 0.78);
      shieldShape.closePath();
      const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelSize: 0.025,
        bevelThickness: 0.025,
        bevelSegments: 1
      });
      const shield = new THREE.Mesh(shieldGeo, mats.clothCrimsonDeep);
      shield.position.set(0, 5.9, gateZ + dir * (depth / 2 + 0.04));
      shield.rotation.y = dir > 0 ? 0 : Math.PI;
      shield.castShadow = true;
      group.add(shield);
      const fleur = new THREE.Group();
      fleur.position.set(0, 6.43, gateZ + dir * (depth / 2 + 0.18));
      fleur.rotation.y = dir > 0 ? 0 : Math.PI;
      group.add(fleur);
      sphere(fleur, 0.12, mats.gold, 0, 0, 0, { width: 8, height: 6, scale: [1, 2.1, 0.5] });
      for (const sx of [-1, 1]) {
        sphere(fleur, 0.1, mats.gold, sx * 0.16, 0.03, 0, { width: 7, height: 5, scale: [0.8, 1.6, 0.4] });
      }
    }
    for (const sx of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(sx * 1.54, 0.28, gateZ + depth / 2 - 0.2);
      leaf.rotation.y = sx * 0.92;
      group.add(leaf);
      box(leaf, 1.3, 3.3, 0.12, mats.woodDark, sx * 0.66, 1.65, 0, { rounded: 0.03 });
      for (const yy of [0.6, 1.65, 2.7]) {
        box(leaf, 1.3, 0.07, 0.17, mats.iron, sx * 0.66, yy, 0, { rounded: 0.01 });
      }
    }
    for (let i = -3; i <= 3; i++) {
      box(group, 0.1, 2.2, 0.1, mats.iron, i * 0.46, 4.8, gateZ + 0.2, { rounded: 0.01 });
    }
    for (let i = 0; i < 4; i++) {
      box(group, 3.1, 0.08, 0.08, mats.iron, 0, 3.9 + i * 0.45, gateZ + 0.2, { rounded: 0.01 });
    }
    for (const sx of [-1, 1]) {
      const tower = addRoundTower(sx * WORLD.gatehouse.towerX, gateZ, WORLD.gatehouse.towerR, WORLD.gatehouse.towerH, {
        roofHeight: 4.5,
        flag: true,
        group,
        roofGroup: layers.fixedRoofs,
        name: (south ? "south" : "north") + "-gate-tower-" + (sx > 0 ? "east" : "west")
      });
      const w = createWindowGroup(mats, 0.72, 1.5, { deepFrame: false });
      if (south) {
        w.position.set(sx * WORLD.gatehouse.towerX, 8.55, gateZ + WORLD.gatehouse.towerR + 0.02);
        w.rotation.y = 0;
      } else {
        w.position.set(sx * WORLD.gatehouse.towerX, 8.55, gateZ - WORLD.gatehouse.towerR - 0.02);
        w.rotation.y = Math.PI;
      }
      group.add(w);
      state.windows += 1;
      void tower;
    }
    if (south) {
      createTorch(state, group, mats, -2.7, 3.0, gateZ + depth / 2 + 0.22, 0, { intensity: 1.2, distance: 9 });
      createTorch(state, group, mats, 2.7, 3.0, gateZ + depth / 2 + 0.22, 0, { intensity: 1.2, distance: 9 });
    } else {
      createTorch(state, group, mats, -2.7, 3.0, gateZ - depth / 2 - 0.22, Math.PI, { intensity: 1.0, distance: 8 });
      createTorch(state, group, mats, 2.7, 3.0, gateZ - depth / 2 - 0.22, Math.PI, { intensity: 1.0, distance: 8 });
    }
    const facing = south ? 1 : -1;
    const bannerZ = gateZ + facing * (WORLD.gatehouse.towerR + 0.2);
    createHangingBanner(state, group, mats, -WORLD.gatehouse.towerX, 8.7, bannerZ, south ? 0 : Math.PI, { width: 1.0, height: 3.1 });
    createHangingBanner(state, group, mats, WORLD.gatehouse.towerX, 8.7, bannerZ, south ? 0 : Math.PI, { width: 1.0, height: 3.1 });
    addIvyPatch(state, [-5.5, 1.1, gateZ + facing * (depth / 2 + 0.02)], [1, 0, 0], [0, 0, facing], 3.2, 1.9, 55, south ? 801 : 802);
    return group;
  };
  buildGatehouse(WORLD.gatehouse.z, true);
  buildGatehouse(-WORLD.gatehouse.z, false);

  // ── Merlon mesh ───────────────────────────────────────────────────────
  const merlonGeo = new THREE.BoxGeometry(0.72, 0.92, 0.5);
  const merlonMesh = new THREE.InstancedMesh(merlonGeo, trim, state.merlonTransforms.length);
  const dummy = new THREE.Object3D();
  state.merlonTransforms.forEach((t, i) => {
    dummy.position.set(t.position[0], t.position[1], t.position[2]);
    dummy.rotation.set(0, t.rotation[1], 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    merlonMesh.setMatrixAt(i, dummy.matrix);
  });
  merlonMesh.castShadow = true;
  merlonMesh.receiveShadow = true;
  layers.general.add(merlonMesh);

  // ── Ivy instances ─────────────────────────────────────────────────────
  const leafGeo = new THREE.IcosahedronGeometry(0.11, 0);
  const ivyMaterial = mats.leafDeep.clone();
  ivyMaterial.color.setHex(0xffffff);
  ivyMaterial.side = THREE.DoubleSide;
  ivyMaterial.emissive = new THREE.Color(0x0a1207);
  ivyMaterial.emissiveIntensity = 0.4;
  const ivyMesh = new THREE.InstancedMesh(leafGeo, ivyMaterial, state.ivy.length);
  const colors = [new THREE.Color(0x5b7444), new THREE.Color(0x405d38), new THREE.Color(0x738254)];
  const ivyRng = rng(991);
  state.ivy.forEach((t, i) => {
    dummy.position.set(t.position[0], t.position[1], t.position[2]);
    dummy.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2]);
    dummy.scale.set(t.scale[0], t.scale[1], t.scale[2]);
    dummy.updateMatrix();
    ivyMesh.setMatrixAt(i, dummy.matrix);
    ivyMesh.setColorAt(i, colors[Math.floor(ivyRng() * colors.length)]);
  });
  ivyMesh.castShadow = false;
  ivyMesh.receiveShadow = true;
  layers.general.add(ivyMesh);

  if (state.ivyFlowers.length) {
    const petalGeo = new THREE.SphereGeometry(0.045, 5, 4);
    const flowers = new THREE.InstancedMesh(petalGeo, mats.flowerPink, state.ivyFlowers.length);
    state.ivyFlowers.forEach((t, i) => {
      dummy.position.set(t.position[0], t.position[1], t.position[2]);
      dummy.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2]);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
    });
    flowers.castShadow = false;
    layers.general.add(flowers);
  }

  createHangingBanner(state, layers.keep1, mats, -7.7, keep.floors[1] + 4.2, hz + 0.12, 0, { width: 0.9, height: 2.6 });
  createHangingBanner(state, layers.keep1, mats, 7.7, keep.floors[1] + 4.2, hz + 0.12, 0, { width: 0.9, height: 2.6 });

  return state;
}
