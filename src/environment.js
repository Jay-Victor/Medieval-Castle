import * as THREE from "three";
import {
  box,
  cylinder,
  sphere,
  cone,
  plane,
  rng,
  randRange,
  instanced,
  TAU
} from "./helpers.js";
import { WORLD } from "./data.js";
import { FurnitureBuilder } from "./furniture-builder.js";

function makePlaqueTexture(title, sub, width = 1024, height = 220) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#3f3529");
  grad.addColorStop(0.5, "#534635");
  grad.addColorStop(1, "#2e2820");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = "rgba(224,194,137," + (Math.random() * 0.05) + ")";
    ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 20, 1);
  }
  ctx.strokeStyle = "#b79356";
  ctx.lineWidth = 3;
  ctx.strokeRect(17, 17, width - 34, height - 34);
  ctx.strokeStyle = "rgba(183,147,86,.38)";
  ctx.lineWidth = 1;
  ctx.strokeRect(29, 29, width - 58, height - 58);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d8ba7f";
  ctx.font = "500 48px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(title, width / 2, 100);
  ctx.fillStyle = "rgba(218,192,143,.62)";
  ctx.font = "400 19px 'IBM Plex Mono', Consolas, monospace";
  ctx.fillText(sub, width / 2, 146);
  for (const x of [width * 0.16, width * 0.84]) {
    ctx.strokeStyle = "rgba(198,162,99,.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 151);
    ctx.quadraticCurveTo(x - 14, 139, x - 24, 149);
    ctx.quadraticCurveTo(x - 12, 148, x, 156);
    ctx.quadraticCurveTo(x + 12, 148, x + 24, 149);
    ctx.quadraticCurveTo(x + 14, 139, x, 151);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makePlaqueMaterial() {
  const tex = makePlaqueTexture("CASTELLUM AURELIAE", "ANNO DOMINI · MCCLXXXVI · A STUDY IN STONE & LIGHT");
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.4,
    metalness: 0.58,
    color: 0xf0dfc0
  });
}

function moatPlane(parent, w, d, x, z, mat, y = 0.055) {
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * Math.max(1, w / 7), uv.getY(i) * Math.max(1, d / 7));
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createBridge(parent, mats, z, front) {
  const group = new THREE.Group();
  group.name = front ? "south-bridge" : "north-bridge";
  group.position.set(0, 0, z);
  parent.add(group);
  const width = 4.5;
  const length = WORLD.moat.outerZ - WORLD.moat.innerZ + 1.2;
  box(group, width + 0.4, 0.3, length, mats.weatheredStone, 0, 0.02, 0, { uvScale: 1.2, rounded: 0.03 });
  box(group, width, 0.22, length - 0.3, mats.wood, 0, 0.25, 0, { uvScale: 1.8, rounded: 0.025 });
  const planks = 9;
  for (let i = 0; i < planks; i++) {
    box(group, width - 0.18, 0.025, 0.11, mats.woodDark, 0, 0.37, -length / 2 + 0.35 + (i * (length - 0.7)) / (planks - 1), {
      rounded: 0.01
    });
  }
  for (const side of [-1, 1]) {
    box(group, 0.1, 0.035, length - 0.45, mats.iron, side * (width / 2 - 0.34), 0.378, 0, { rounded: 0.02 });
    box(group, 0.28, 0.7, length - 0.2, mats.ashlar, side * (width / 2 + 0.18), 0.68, 0, { uvScale: 1, rounded: 0.03 });
    box(group, 0.46, 0.12, length + 0.15, mats.ashlar, side * (width / 2 + 0.12), 1.04, 0, { uvScale: 1, rounded: 0.04 });
    for (let i = 0; i < 5; i++) {
      box(group, 0.34, 0.25, 0.3, mats.ashlar, side * (width / 2 + 0.12), 1.21, -length / 2 + 0.55 + i * ((length - 1.1) / 4), {
        uvScale: 0.8,
        rounded: 0.02
      });
    }
  }
  for (const sz of [-length * 0.27, length * 0.27]) {
    for (const sx of [-width * 0.34, width * 0.34]) {
      cylinder(group, 0.22, 0.26, 0.8, mats.weatheredStone, sx, -0.2, sz, { segments: 8 });
    }
  }
  return group;
}

function createLilyPads(parent, mats) {
  const r = rng(701);
  const pads = [];
  for (let i = 0; i < 64; i++) {
    const side = Math.floor(r() * 4);
    let x = 0;
    let z = 0;
    if (side === 0) {
      x = randRange(r, -34.7, 31.8); z = randRange(r, 28.2, 30.8);
    } else if (side === 1) {
      x = randRange(r, -34.7, 31.8); z = randRange(r, -30.8, -28.2);
    } else if (side === 2) {
      x = randRange(r, 32.2, 34.7); z = randRange(r, -27, 27);
    } else {
      x = randRange(r, -34.7, -32.2); z = randRange(r, -27, 27);
    }
    pads.push({
      position: [x, 0.075, z],
      rotation: [-Math.PI / 2, 0, r() * TAU],
      scale: 0.22 + r() * 0.45
    });
  }
  const padGeo = new THREE.CircleGeometry(1, 9, 0, Math.PI * 1.86);
  const padMesh = new THREE.InstancedMesh(padGeo, mats.leafMid, pads.length);
  const dummy = new THREE.Object3D();
  pads.forEach((p, i) => {
    dummy.position.set(p.position[0], p.position[1], p.position[2]);
    dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    padMesh.setMatrixAt(i, dummy.matrix);
  });
  padMesh.receiveShadow = true;
  parent.add(padMesh);
  const reeds = [];
  for (let i = 0; i < 90; i++) {
    const side = i % 4;
    let x;
    let z;
    if (side === 0) { x = randRange(r, -35, 35); z = randRange(r, 31.1, 31.45); }
    else if (side === 1) { x = randRange(r, -35, 35); z = randRange(r, -31.45, -31.1); }
    else if (side === 2) { x = randRange(r, 35.1, 35.45); z = randRange(r, -31, 31); }
    else { x = randRange(r, -35.45, -35.1); z = randRange(r, -31, 31); }
    const h = 0.45 + r() * 0.85;
    reeds.push({ position: [x, 0.05 + h / 2, z], rotation: [0, r() * TAU, (r() - 0.5) * 0.22], scale: [0.7, h, 0.7] });
  }
  const reedGeo = new THREE.CylinderGeometry(0.025, 0.04, 1, 4);
  const reedsMesh = new THREE.InstancedMesh(reedGeo, mats.leafDeep, reeds.length);
  reeds.forEach((t, i) => {
    dummy.position.set(t.position[0], t.position[1], t.position[2]);
    dummy.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2]);
    dummy.scale.set(t.scale[0], t.scale[1], t.scale[2]);
    dummy.updateMatrix();
    reedsMesh.setMatrixAt(i, dummy.matrix);
  });
  reedsMesh.castShadow = true;
  parent.add(reedsMesh);
}

export function createTree(parent, options = {}) {
  const {
    x = 0,
    z = 0,
    scale = 1,
    seed = 1,
    type = "oak",
    rotation = 0,
    leafMaterials = null,
    mats = null
  } = options;
  const r = rng(seed * 37 + 11);
  const group = new THREE.Group();
  group.name = type + "-tree";
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);
  parent.add(group);
  if (!mats) return group;
  const palette = leafMaterials || [mats.leafDeep, mats.leafMid, mats.leafLight, mats.leafOlive];
  const b = new FurnitureBuilder(group);

  if (type === "cypress") {
    b.cylinder(0.16, 0.26, 4.1, mats.bark, 0, 2.05, 0, { segments: 7 });
    for (let i = 0; i < 4; i++) {
      const rad = 0.85 - i * 0.14;
      b.sphere(rad, palette[i % palette.length], (r() - 0.5) * 0.16, 2.5 + i * 0.64, (r() - 0.5) * 0.16, {
        width: 8,
        height: 7,
        sy: 2.1,
        ry: r() * TAU
      });
    }
  } else if (type === "olive") {
    const trunkH = 2.5;
    b.cylinder(0.19, 0.34, trunkH, mats.bark, 0, trunkH / 2, 0, { segments: 7, rz: (r() - 0.5) * 0.08 });
    for (let i = 0; i < 3; i++) {
      b.cylinder(0.06, 0.13, 1.6, mats.bark, (i - 1) * 0.3, trunkH - 0.15, 0, {
        segments: 5,
        rz: (i - 1) * 0.45,
        rx: (r() - 0.5) * 0.5
      });
    }
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU;
      const rad = 0.3 + r() * 1.7;
      b.sphere(0.65 + r() * 0.4, palette[i % 3], Math.cos(a) * rad, 3.15 + r() * 1.2, Math.sin(a) * rad, {
        width: 7,
        height: 6,
        sy: 0.7 + r() * 0.35,
        ry: r() * TAU
      });
    }
  } else {
    const h = 4.2 + r() * 1.4;
    b.cylinder(0.22, 0.5, h, mats.bark, 0, h / 2, 0, { segments: 8 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      b.cylinder(0.06, 0.17, 2.1, mats.bark, Math.cos(a) * 0.8, h * 0.72, Math.sin(a) * 0.8, {
        segments: 5,
        rz: 0.8,
        ry: a
      });
    }
    for (let i = 0; i < 13; i++) {
      const a = r() * TAU;
      const rad = 0.2 + r() * 2.3;
      const yy = h * 0.68 + r() * 2.1;
      b.sphere(0.8 + r() * 0.85, palette[i % palette.length], Math.cos(a) * rad, yy, Math.sin(a) * rad, {
        width: 8,
        height: 7,
        sy: 0.75 + r() * 0.4,
        ry: r() * TAU
      });
    }
  }
  b.finish(type + "-merged");
  return group;
}

export function createStoneBench(parent, mats, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  box(g, 2.25, 0.16, 0.58, mats.ashlar, 0, 0.52, 0, { rounded: 0.04, uvScale: 0.8 });
  box(g, 2.0, 0.06, 0.45, mats.weatheredStone, 0, 0.62, 0.01, { rounded: 0.02 });
  for (const sx of [-0.74, 0.74]) {
    box(g, 0.18, 0.44, 0.48, mats.ashlar, sx, 0.25, 0, { rounded: 0.028, uvScale: 0.6 });
    for (const sz of [-0.24, 0.24]) {
      cylinder(g, 0.075, 0.075, 0.2, mats.weatheredStone, sx, 0.49, sz, { rotX: Math.PI / 2, segments: 7 });
    }
  }
  box(g, 2.25, 0.23, 0.14, mats.ashlar, 0, 0.82, -0.28, { rounded: 0.035, uvScale: 0.6 });
  return g;
}

export function createLanternPost(parent, mats, x, z, options = {}) {
  const { scale = 1 } = options;
  const g = new THREE.Group();
  g.name = "lantern-post";
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  cylinder(g, 0.17, 0.22, 0.22, mats.weatheredStone, 0, 0.11, 0, { segments: 8 });
  cylinder(g, 0.07, 0.09, 2.3, mats.iron, 0, 1.25, 0, { segments: 8 });
  for (let i = 0; i < 3; i++) {
    cylinder(g, 0.008, 0.008, 0.32, mats.iron, Math.cos((i / 3) * TAU) * 0.16, 2.11, Math.sin((i / 3) * TAU) * 0.16, {
      segments: 4,
      rotZ: 0.34
    });
  }
  cylinder(g, 0.2, 0.22, 0.09, mats.iron, 0, 2.42, 0, { segments: 8 });
  box(g, 0.28, 0.38, 0.28, mats.glass, 0, 2.66, 0, { rounded: 0.03 });
  for (const sx of [-0.14, 0.14]) {
    for (const sz of [-0.14, 0.14]) {
      box(g, 0.025, 0.42, 0.025, mats.iron, sx, 2.66, sz, { rounded: 0.01 });
    }
  }
  cone(g, 0.3, 0.2, mats.iron, 0, 2.92, 0, { segments: 8, rotY: Math.PI / 8 });
  const flame = sphere(g, 0.08, mats.flame, 0, 2.65, 0, { width: 6, height: 5, castShadow: false });
  flame.name = "lantern-flame";
  return { group: g, flame };
}

export function createLandscape(mats, textures) {
  const root = new THREE.Group();
  root.name = "land-and-water";
  const stoneBase = new THREE.Group();
  stoneBase.name = "maquette-base";
  root.add(stoneBase);

  box(stoneBase, WORLD.base.w, WORLD.base.h, WORLD.base.d, mats.weatheredStone, 0, -WORLD.base.h / 2, 0, {
    rounded: 0.7,
    uvScale: 3
  });
  box(stoneBase, WORLD.base.w + 0.5, 0.34, WORLD.base.d + 0.5, mats.ashlar, 0, -0.22, 0, {
    rounded: 0.22,
    uvScale: 3
  });
  box(stoneBase, WORLD.base.w - 1.2, 0.18, WORLD.base.d - 1.2, mats.grassDark, 0, -0.02, 0, {
    rounded: 0.2,
    uvScale: 10
  });

  const groundMat = mats.grass.clone();
  groundMat.map = textures.grass.clone();
  groundMat.map.repeat.set(19, 16);
  groundMat.map.needsUpdate = true;
  groundMat.bumpMap = groundMat.map;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.base.w - 1.3, WORLD.base.d - 1.3), groundMat);
  ground.name = "grass-sea";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.04;
  ground.receiveShadow = true;
  root.add(ground);

  for (const side of [-1, 1]) {
    box(stoneBase, WORLD.base.w - 1.9, 0.045, 0.11, mats.goldAntique, 0, -0.36, side * (WORLD.base.d / 2 + 0.015), { rounded: 0.02, castShadow: false });
    box(stoneBase, 0.11, 0.045, WORLD.base.d - 1.9, mats.goldAntique, side * (WORLD.base.w / 2 + 0.015), -0.36, 0, { rounded: 0.02, castShadow: false });
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(stoneBase, 1.2, 0.42, 1.2, mats.ashlar, sx * (WORLD.base.w / 2 - 2.8), -0.5, sz * (WORLD.base.d / 2 - 2.8), {
        rounded: 0.08,
        uvScale: 1.5
      });
    }
  }

  const plaqueMat = makePlaqueMaterial();
  const plaqueGeo = new THREE.PlaneGeometry(16, 3.45);
  const plaqueFront = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaqueFront.position.set(0, -1.23, WORLD.base.d / 2 + 0.03);
  plaqueFront.receiveShadow = true;
  root.add(plaqueFront);
  const plaqueBack = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaqueBack.position.set(0, -1.23, -WORLD.base.d / 2 - 0.03);
  plaqueBack.rotation.y = Math.PI;
  plaqueBack.receiveShadow = true;
  root.add(plaqueBack);

  const miX = WORLD.moat.innerX;
  const miZ = WORLD.moat.innerZ;
  const moX = WORLD.moat.outerX;
  const moZ = WORLD.moat.outerZ;
  const moatGroup = new THREE.Group();
  moatGroup.name = "moat";
  root.add(moatGroup);
  moatPlane(moatGroup, moX * 2 - 0.5, moZ * 2 - 0.5, 0, 0, mats.weatheredStone, -0.02);
  moatPlane(moatGroup, moX * 2, moZ - miZ, 0, (moZ + miZ) / 2, mats.water, 0.055);
  moatPlane(moatGroup, moX * 2, moZ - miZ, 0, -(moZ + miZ) / 2, mats.water, 0.055);
  moatPlane(moatGroup, moX - miX, miZ * 2, (moX + miX) / 2, 0, mats.water, 0.055);
  moatPlane(moatGroup, moX - miX, miZ * 2, -(moX + miX) / 2, 0, mats.water, 0.055);
  for (const side of [-1, 1]) {
    box(moatGroup, 64, 0.16, 0.52, mats.ashlar, 0, 0.09, side * miZ, { uvScale: 1.2, rounded: 0.03 });
    box(moatGroup, 71, 0.16, 0.52, mats.ashlar, 0, 0.09, side * moZ, { uvScale: 1.2, rounded: 0.03 });
    box(moatGroup, 0.52, 0.16, 56, mats.ashlar, side * miX, 0.09, 0, { uvScale: 1.2, rounded: 0.03 });
    box(moatGroup, 0.52, 0.16, 63, mats.ashlar, side * moX, 0.09, 0, { uvScale: 1.2, rounded: 0.03 });
  }
  createBridge(moatGroup, mats, (miZ + moZ) / 2, true);
  createBridge(moatGroup, mats, -(miZ + moZ) / 2, false);
  createLilyPads(moatGroup, mats);

  const roadMat = mats.cobble;
  for (const side of [-1, 1]) {
    plane(root, 4.5, 6.7, roadMat, 0, 0.043, side * ((WORLD.wall.z + miZ) / 2), {
      castShadow: false,
      name: "approach-road"
    });
    plane(root, 4.6, 4.1, roadMat, 0, 0.043, side * (moZ + 2.1), { castShadow: false });
    const turning = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), roadMat);
    turning.rotation.x = -Math.PI / 2;
    turning.position.set(0, 0.044, side * 34.1);
    turning.receiveShadow = true;
    root.add(turning);
    for (const sx of [-2.8, 2.8]) {
      cylinder(root, 0.12, 0.16, 0.55, mats.weatheredStone, sx, 0.28, side * 33.6, { segments: 8 });
      sphere(root, 0.17, mats.leafMid, sx, 0.68, side * 33.6, { width: 8, height: 6 });
    }
  }

  const treeData = [
    [-38, -25, 1.05, 31, "oak"],
    [38, -25, 1.05, 32, "oak"],
    [-38, 25, 1.0, 33, "oak"],
    [38, 25, 1.0, 34, "oak"],
    [-38, -6, 0.8, 35, "olive"],
    [38, -6, 0.8, 36, "olive"],
    [-38, 6, 0.8, 37, "olive"],
    [38, 6, 0.8, 38, "olive"],
    [-27, 33.8, 0.9, 39, "cypress"],
    [27, 33.8, 0.9, 40, "cypress"],
    [-27, -33.8, 0.9, 41, "cypress"],
    [27, -33.8, 0.9, 42, "cypress"]
  ];
  for (const [x, z, scale, seed, type] of treeData) {
    createTree(root, { x, z, scale, seed, type, mats });
  }
  const edgeTrees = [
    [-36, 11, 0.78, 50, "olive"], [36, 11, 0.78, 51, "olive"],
    [-36, -11, 0.78, 52, "olive"], [36, -11, 0.78, 53, "olive"],
    [-12, 33.2, 0.7, 54, "oak"], [12, 33.2, 0.7, 55, "oak"],
    [-12, -33.2, 0.7, 56, "oak"], [12, -33.2, 0.7, 57, "oak"],
    [-35, 29.5, 0.68, 58, "cypress"], [35, 29.5, 0.68, 59, "cypress"],
    [-35, -29.5, 0.68, 60, "cypress"], [35, -29.5, 0.68, 61, "cypress"]
  ];
  for (const [x, z, scale, seed, type] of edgeTrees) {
    createTree(root, { x, z, scale, seed, type, mats });
  }

  const shrubs = [];
  const shrubGeo = new THREE.IcosahedronGeometry(0.8, 1);
  const r = rng(911);
  for (let i = 0; i < 46; i++) {
    const edge = i % 4;
    let x;
    let z;
    if (edge === 0) { x = (r() - 0.5) * 66; z = 32.8 + r() * 2.2; }
    else if (edge === 1) { x = (r() - 0.5) * 66; z = -32.8 - r() * 2.2; }
    else if (edge === 2) { x = 36.4 + r() * 2.4; z = (r() - 0.5) * 58; }
    else { x = -36.4 - r() * 2.4; z = (r() - 0.5) * 58; }
    if (Math.abs(x) < 5 && Math.abs(z) > 29) continue;
    shrubs.push({
      position: [x, 0.38, z],
      scale: [0.5 + r() * 0.9, 0.4 + r() * 0.6, 0.5 + r() * 0.9],
      rotation: [0, r() * TAU, 0]
    });
  }
  instanced(root, shrubGeo, mats.hedge, shrubs, { name: "outer-shrubs" });

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * 39.6;
      const pz = sz * 33.6;
      cylinder(root, 0.15, 0.2, 0.42, mats.ashlar, px, 0.2, pz, { segments: 8 });
      sphere(root, 0.08, mats.gold, px, 0.47, pz, { width: 6, height: 4 });
    }
  }

  for (const side of [-1, 1]) {
    for (const sx of [-3.1, 3.1]) {
      cylinder(root, 0.06, 0.09, 1.3, mats.iron, sx, 0.65, side * 32.2, { segments: 6 });
      box(root, 0.24, 0.3, 0.24, mats.glass, sx, 1.36, side * 32.2, { rounded: 0.03 });
      cone(root, 0.22, 0.16, mats.iron, sx, 1.58, side * 32.2, { segments: 6 });
      sphere(root, 0.24, mats.flame, sx, 1.36, side * 32.2, {
        width: 8,
        height: 6,
        scale: [1, 1.3, 1],
        castShadow: false
      });
    }
  }

  const update = (elapsed) => {
    mats.water.bumpMap.offset.x = elapsed * 0.008;
    mats.water.bumpMap.offset.y = elapsed * 0.004;
    mats.fountainWater.bumpMap.offset.x = elapsed * 0.013;
    mats.fountainWater.bumpMap.offset.y = elapsed * 0.007;
  };

  return { root, update };
}

/* A large surveyor's table beneath the maquette. It catches the key light,
   holds the brass datum rings, and gives the lower half of the frame a
   deliberate material world instead of an endless backdrop. */
function makeSurveyTableTexture() {
  const size = 2048;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const r = rng(4621);
  const base = ctx.createRadialGradient(size * 0.5, size * 0.48, 40, size * 0.5, size * 0.5, size * 0.58);
  base.addColorStop(0, "#b9a88c");
  base.addColorStop(0.32, "#927e64");
  base.addColorStop(0.68, "#5b4f3e");
  base.addColorStop(1, "#2b251d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000; i++) {
    const x = r() * size;
    const y = r() * size;
    const a = r() * 0.06;
    ctx.fillStyle = r() > 0.5 ? "rgba(227,196,143," + a + ")" : "rgba(0,0,0," + a + ")";
    ctx.fillRect(x, y, 1 + r() * 2.5, 1);
  }
  // concentric survey rings
  for (const [radius, alpha, width] of [[size * 0.18, 0.14, 1], [size * 0.28, 0.09, 1], [size * 0.4, 0.08, 1.5], [size * 0.47, 0.06, 1]]) {
    ctx.strokeStyle = "rgba(211,177,116," + alpha + ")";
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // faint radial datum marks
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const inner = size * 0.4;
    const outer = size * (i % 4 === 0 ? 0.49 : 0.455);
    ctx.strokeStyle = "rgba(201,163,93," + (i % 4 === 0 ? 0.2 : 0.09) + ")";
    ctx.lineWidth = i % 4 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(a) * inner, size / 2 + Math.sin(a) * inner);
    ctx.lineTo(size / 2 + Math.cos(a) * outer, size / 2 + Math.sin(a) * outer);
    ctx.stroke();
  }
  // compass rose
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.strokeStyle = "rgba(211,177,116,.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.46);
    ctx.lineTo(size * 0.018, -size * 0.42);
    ctx.lineTo(-size * 0.018, -size * 0.42);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
  // ink/parchment scratches
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = "rgba(233,208,163," + (r() * 0.035) + ")";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = r() * size;
    const y = r() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 250, y + (r() - 0.5) * 250);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createPresentationSurface() {
  const texture = makeSurveyTableTexture();
  const group = new THREE.Group();
  group.name = "survey-table";
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xfff7e9,
    roughness: 0.66,
    metalness: 0.03,
    emissive: 0x1b130c,
    emissiveIntensity: 0.09,
    emissiveMap: texture
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(250, 128), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -2.72;
  disc.receiveShadow = true;
  group.add(disc);

  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc6a15e,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (const [radius, width] of [[60, 0.22], [82, 0.13], [120, 0.18], [178, 0.1]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + width, 160), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.7;
    group.add(ring);
  }
  return group;
}
