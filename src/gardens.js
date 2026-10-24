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
import { createTree, createStoneBench, createLanternPost } from "./environment.js";
import { FurnitureBuilder } from "./furniture-builder.js";
import { WORLD } from "./data.js";

const G = WORLD.garden;
const parterreEarth = new THREE.MeshStandardMaterial({ color: 0x9d8966, roughness: 1 });

function pathRect(parent, mats, w, d, x, z, y = 0.057) {
  return plane(parent, w, d, mats.gravel, x, y, z, { castShadow: false, receiveShadow: true });
}

function createFountain(mats) {
  const group = new THREE.Group();
  group.name = "garden-fountain";
  const stone = mats.ashlar;
  const darkStone = mats.weatheredStone;

  cylinder(group, 2.8, 2.95, 0.18, darkStone, 0, 0.09, 0, { segments: 32 });
  // Basin wall is an open cylinder, with a stone rim above the water.
  const basinGeo = new THREE.CylinderGeometry(2.32, 2.48, 0.52, 32, 1, true);
  const basin = new THREE.Mesh(basinGeo, stone);
  basin.position.y = 0.43;
  basin.castShadow = true;
  basin.receiveShadow = true;
  group.add(basin);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.32, 2.32, 0.1, 32), darkStone);
  floor.position.y = 0.24;
  floor.receiveShadow = true;
  group.add(floor);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, 0.035, 32), mats.fountainWater);
  water.position.y = 0.44;
  water.receiveShadow = true;
  group.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.15, 7, 40), stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.68;
  rim.castShadow = true;
  group.add(rim);

  // central pedestal and upper bowl
  cylinder(group, 0.66, 0.82, 0.72, stone, 0, 0.68, 0, { segments: 14 });
  cylinder(group, 0.22, 0.46, 1.25, darkStone, 0, 1.3, 0, { segments: 12 });
  const upper = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.32, 0.03), new THREE.Vector2(0.8, 0.18),
    new THREE.Vector2(0.96, 0.28), new THREE.Vector2(0.88, 0.32), new THREE.Vector2(0.2, 0.1),
    new THREE.Vector2(0, 0.2)
  ], 24), stone);
  upper.position.y = 1.88;
  upper.castShadow = true;
  group.add(upper);
  const upperWater = new THREE.Mesh(new THREE.CircleGeometry(0.82, 24), mats.fountainWater);
  upperWater.rotation.x = -Math.PI / 2;
  upperWater.position.y = 2.16;
  group.add(upperWater);
  cylinder(group, 0.13, 0.2, 0.95, stone, 0, 2.45, 0, { segments: 10 });
  sphere(group, 0.26, mats.goldAntique, 0, 3.03, 0, { width: 12, height: 8, sy: 1.25 });
  cone(group, 0.11, 0.46, mats.gold, 0, 3.36, 0, { segments: 8 });
  sphere(group, 0.065, mats.gold, 0, 3.6, 0, { width: 6, height: 4 });

  // four spouts and their slender water arcs
  const arcMaterial = mats.fountainWater;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const px = Math.cos(a) * 0.64;
    const pz = Math.sin(a) * 0.64;
    const head = sphere(group, 0.13, mats.copperPatina, px, 2.01, pz, { width: 7, height: 5, sx: 1.4, sy: 0.8 });
    head.rotation.y = -a;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(px, 2.02, pz),
      new THREE.Vector3(Math.cos(a) * 1.5, 2.3, Math.sin(a) * 1.5),
      new THREE.Vector3(Math.cos(a) * 2.1, 1.4, Math.sin(a) * 2.1),
      new THREE.Vector3(Math.cos(a) * 2.05, 0.55, Math.sin(a) * 2.05)
    ]);
    const tube = new THREE.TubeGeometry(curve, 14, 0.025, 5, false);
    const jet = new THREE.Mesh(tube, arcMaterial);
    group.add(jet);
  }
  // a quiet central thread of water
  cylinder(group, 0.028, 0.04, 1.35, arcMaterial, 0, 3.21, 0, { segments: 6, castShadow: false });

  // water specks (shared by both mirrored gardens after cloning)
  const count = 150;
  const positions = new Float32Array(count * 3);
  const seeds = [];
  const r = rng(818);
  for (let i = 0; i < count; i++) {
    seeds.push({ a: r() * TAU, phase: r(), speed: 0.35 + r() * 0.45, radius: 0.2 + r() * 0.8 });
  }
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({
    color: 0xd8ebe1,
    size: 0.14,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  spray.name = "fountain-spray";
  group.add(spray);

  const update = (elapsed) => {
    const arr = sprayGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const t = (elapsed * s.speed + s.phase) % 1;
      const radial = 0.2 + t * (1.8 + s.radius);
      const y = 3.35 - t * t * 2.7;
      arr[i * 3] = Math.cos(s.a) * radial;
      arr[i * 3 + 1] = Math.max(0.5, y);
      arr[i * 3 + 2] = Math.sin(s.a) * radial;
    }
    sprayGeo.attributes.position.needsUpdate = true;
  };

  return { group, update };
}

function createRoseArch(mats, x, z, scale = 1) {
  const group = new THREE.Group();
  group.name = "rose-arch";
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  const iron = mats.ironRust;
  for (const sx of [-1, 1]) {
    cylinder(group, 0.04, 0.055, 2.3, iron, sx * 1.65, 1.15, 0, { segments: 6 });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      cylinder(group, 0.022, 0.022, 0.38, iron, sx * (1.55 + Math.cos(a) * 0.11), 2.24 + i * 0.1, 0, {
        rotZ: -sx * 0.7,
        segments: 4
      });
    }
  }
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const a = Math.PI * t;
    points.push(new THREE.Vector3(-Math.cos(a) * 1.65, 2.3 + Math.sin(a) * 1.15, 0));
  }
  const arcGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.045, 5, false);
  const arcMesh = new THREE.Mesh(arcGeo, iron);
  arcMesh.castShadow = true;
  group.add(arcMesh);

  // climbing rose foliage distributed along the arch
  const leafPositions = [];
  const bloomPositions = [];
  const roseRng = rng(Math.round((x + 20) * 111 + z * 73));
  for (let i = 0; i < 105; i++) {
    const t = roseRng();
    const a = Math.PI * t;
    const jitter = (roseRng() - 0.5) * 0.24;
    const px = -Math.cos(a) * 1.65 + jitter;
    const py = 2.3 + Math.sin(a) * 1.15 + (roseRng() - 0.5) * 0.18;
    const pz = (roseRng() - 0.5) * 0.28;
    if (i % 5 === 0) bloomPositions.push({ position: [px, py, pz], scale: 0.06 + roseRng() * 0.05 });
    else leafPositions.push({ position: [px, py, pz], scale: [0.45 + roseRng() * 0.5, 0.4 + roseRng() * 0.45, 0.15], rotation: [roseRng() * TAU, roseRng() * TAU, roseRng() * TAU] });
  }
  instanced(group, new THREE.IcosahedronGeometry(0.16, 0), mats.leafMid, leafPositions, { name: "rose-leaves", castShadow: false });
  instanced(group, new THREE.SphereGeometry(0.12, 6, 4), mats.flowerPink, bloomPositions, { name: "rose-blooms", castShadow: false });
  return group;
}

function createParterre(parent, mats, cx, cz, index) {
  const g = new THREE.Group();
  g.name = "parterre-" + index;
  g.position.set(cx, 0, cz);
  parent.add(g);
  const w = 6.4;
  const d = 2.8;
  // A pale, raked planting ground so the flowers read as embroidery from afar.
  box(g, w, 0.14, d, mats.soil, 0, 0.09, 0, { uvScale: 1.2, castShadow: false });
  box(g, w - 0.5, 0.045, d - 0.5, parterreEarth, 0, 0.16, 0, { castShadow: false, receiveShadow: true });
  // pale stone edging
  for (const sz of [-1, 1]) {
    box(g, w + 0.7, 0.08, 0.18, mats.ashlar, 0, 0.055, sz * (d / 2 + 0.16), { rounded: 0.02 });
  }
  for (const sx of [-1, 1]) {
    box(g, 0.18, 0.08, d + 0.32, mats.ashlar, sx * (w / 2 + 0.22), 0.055, 0, { rounded: 0.02 });
  }

  // clipped box outline
  const h = 0.42;
  const hedgeW = 0.3;
  box(g, w + 0.38, h, hedgeW, mats.hedge, 0, 0.21, d / 2, { rounded: 0.1, castShadow: true });
  box(g, w + 0.38, h, hedgeW, mats.hedge, 0, 0.21, -d / 2, { rounded: 0.1, castShadow: true });
  box(g, hedgeW, h, d, mats.hedge, w / 2, 0.21, 0, { rounded: 0.1, castShadow: true });
  box(g, hedgeW, h, d, mats.hedge, -w / 2, 0.21, 0, { rounded: 0.1, castShadow: true });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      sphere(g, 0.27, mats.hedgeLight, sx * (w / 2), 0.46, sz * (d / 2), {
        width: 8,
        height: 6,
        scale: [1, 0.85, 1]
      });
    }
  }

  // Four embroidered quarters of colour, with low massing blooms beneath
  // the taller flower heads so the parterre's colour reads at model scale.
  const palette = [mats.flowerPink, mats.flowerCream, mats.flowerYellow, mats.flowerPurple];
  const r = rng(1700 + index);
  const flowerSets = palette.map(() => []);
  const blobSets = palette.map(() => []);
  const stems = [];
  const foliage = [];
  for (let ix = 0; ix < 24; ix++) {
    for (let iz = 0; iz < 10; iz++) {
      const x = -w / 2 + 0.52 + (ix / 23) * (w - 1.04) + (r() - 0.5) * 0.09;
      const z = -d / 2 + 0.38 + (iz / 9) * (d - 0.76) + (r() - 0.5) * 0.06;
      if (Math.abs(x) < 0.55 && Math.abs(z) < 0.55) continue;
      const quadrant = (x < 0 ? 0 : 1) + (z < 0 ? 0 : 2);
      const hue = (quadrant + (r() > 0.78 ? 1 : 0)) % 4;
      const s = 0.85 + r() * 0.7;
      flowerSets[hue].push({
        position: [x, 0.43 + r() * 0.16, z],
        scale: [s, s * (0.7 + r() * 0.4), s],
        rotation: [0, r() * TAU, 0]
      });
      stems.push({ position: [x, 0.27, z], scale: [0.8, 0.8 + r() * 0.4, 0.8] });
      if (r() > 0.46) {
        foliage.push({
          position: [x + (r() - 0.5) * 0.12, 0.21, z + (r() - 0.5) * 0.1],
          scale: [0.55 + r() * 0.5, 0.3 + r() * 0.25, 0.55 + r() * 0.5],
          rotation: [0, r() * TAU, 0]
        });
      }
    }
  }
  // broad low colour clouds: four palette patches per bed
  for (let q = 0; q < 4; q++) {
    for (let i = 0; i < 18; i++) {
      const sx = q % 2 === 0 ? -1 : 1;
      const sz = q < 2 ? -1 : 1;
      const x = sx * (0.72 + r() * (w / 2 - 1.2));
      const z = sz * (0.6 + r() * (d / 2 - 0.9));
      blobSets[q].push({
        position: [x, 0.28, z],
        scale: [0.18 + r() * 0.26, 0.06 + r() * 0.08, 0.16 + r() * 0.24],
        rotation: [0, r() * TAU, 0]
      });
    }
  }

  const stemGeo = new THREE.CylinderGeometry(0.009, 0.013, 0.28, 4);
  instanced(g, stemGeo, mats.leafDeep, stems, { name: "flower-stems", castShadow: false });
  instanced(g, new THREE.IcosahedronGeometry(0.15, 0), mats.leafMid, foliage, {
    name: "flower-foliage",
    castShadow: false
  });
  const headGeo = new THREE.SphereGeometry(0.095, 5, 4);
  const blobGeo = new THREE.IcosahedronGeometry(0.55, 1);
  flowerSets.forEach((set, i) => {
    instanced(g, blobGeo, palette[i], blobSets[i], { name: "flower-mass-" + i, castShadow: false });
    instanced(g, headGeo, palette[i], set, { name: "flowers-" + i, castShadow: false });
  });

  // a standard rose at the geometric centre of each bed
  const rose = new THREE.Group();
  rose.position.set(0, 0.15, 0);
  g.add(rose);
  const rb = new FurnitureBuilder(rose);
  rb.cylinder(0.025, 0.04, 1.15, mats.bark, 0, 0.58, 0, { segments: 6 });
  rb.sphere(0.44, mats.leafMid, 0, 1.25, 0, { width: 8, height: 6, sy: 0.95 });
  rb.sphere(0.34, mats.leafDeep, 0.04, 1.4, 0.02, { width: 7, height: 5, sy: 0.8 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    rb.sphere(0.09, i % 3 === 0 ? mats.flowerCream : mats.flowerPink, Math.cos(a) * 0.3, 1.28 + (i % 3) * 0.1, Math.sin(a) * 0.3, {
      width: 6,
      height: 4,
      sx: 1.1,
      sy: 0.9
    });
  }
  rb.finish("standard-rose");
  return g;
}

function createUrn(parent, mats, x, z, scale = 1) {
  const group = new THREE.Group();
  group.name = "stone-urn";
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
  const b = [];
  cylinder(group, 0.5, 0.62, 0.18, mats.weatheredStone, 0, 0.09, 0, { segments: 10 });
  cylinder(group, 0.22, 0.34, 0.38, mats.ashlar, 0, 0.34, 0, { segments: 10 });
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.22, 0.04), new THREE.Vector2(0.56, 0.3),
    new THREE.Vector2(0.7, 0.52), new THREE.Vector2(0.62, 0.56), new THREE.Vector2(0.2, 0.2),
    new THREE.Vector2(0, 0.3)
  ], 16), mats.ashlar);
  bowl.position.y = 0.48;
  bowl.castShadow = true;
  group.add(bowl);
  cylinder(group, 0.52, 0.52, 0.05, mats.soil, 0, 0.92, 0, { segments: 14 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const px = Math.cos(a) * 0.25;
    const pz = Math.sin(a) * 0.25;
    cylinder(group, 0.009, 0.011, 0.36, mats.leafDeep, px, 1.1, pz, { segments: 3 });
    sphere(group, 0.065, i % 3 === 0 ? mats.flowerCream : mats.flowerPurple, px * 1.2, 1.28, pz * 1.2, {
      width: 6,
      height: 4,
      sx: 1.1,
      sy: 0.9
    });
  }
  sphere(group, 0.15, mats.leafMid, 0, 1.0, 0, { width: 7, height: 5, sy: 0.5 });
  void b;
  return group;
}

function createGardenTemplate(mats, state) {
  const root = new THREE.Group();
  root.name = "formal-garden";
  root.position.set(0, 0, G.centerZ);

  // All main paths are slightly above the turf and below the parterres.
  pathRect(root, mats, 3.1, 10.9, 0, 0, 0.058);
  pathRect(root, mats, 33.5, 2.35, 0, 0, 0.059);
  const plaza = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.75, 48), mats.gravel);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.061;
  plaza.receiveShadow = true;
  root.add(plaza);

  // parterre quadrants
  createParterre(root, mats, 7.45, 2.95, 1);
  createParterre(root, mats, -7.45, 2.95, 2);
  createParterre(root, mats, 7.45, -2.95, 3);
  createParterre(root, mats, -7.45, -2.95, 4);

  // gravel aprons in front of the parterres
  for (const sx of [-1, 1]) {
    pathRect(root, mats, 1.15, 9.4, sx * 11.7, 0, 0.057);
  }

  const fountain = createFountain(mats);
  root.add(fountain.group);

  const archA = createRoseArch(mats, 0, -4.48, 1);
  const archB = createRoseArch(mats, 0, 4.48, 1);
  root.add(archA, archB);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const lamp = createLanternPost(root, mats, sx * 2.55, sz * 2.9, { scale: 0.82 });
      lamp.group.userData.room = "garden";
    }
    createUrn(root, mats, sx * 13.25, -4.55, 0.92);
    createUrn(root, mats, sx * 13.25, 4.55, 0.92);
    createStoneBench(root, mats, sx * 13.15, 0, -2.65, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    createStoneBench(root, mats, sx * 13.15, 0, 2.65, sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    createTree(root, { x: sx * 16.3, z: -3.8, scale: 0.72, seed: 120 + sx * 3, type: "olive", mats });
    createTree(root, { x: sx * 16.3, z: 3.8, scale: 0.72, seed: 125 + sx * 3, type: "olive", mats });
    createTree(root, { x: sx * 17.4, z: 0, scale: 0.64, seed: 133 + sx * 3, type: "cypress", mats });
  }

  // topiary columns framing the south/north axis
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const topiary = new THREE.Group();
      topiary.position.set(sx * 3.6, 0, sz * 4.55);
      root.add(topiary);
      cylinder(topiary, 0.24, 0.32, 0.35, mats.terracotta, 0, 0.18, 0, { segments: 10 });
      cylinder(topiary, 0.12, 0.16, 0.55, mats.bark, 0, 0.6, 0, { segments: 6 });
      sphere(topiary, 0.48, mats.hedgeLight, 0, 1.1, 0, { width: 9, height: 7, sy: 1.35 });
      sphere(topiary, 0.33, mats.hedge, 0, 1.65, 0, { width: 8, height: 6, sy: 1.1 });
    }
  }

  // low fruit-tree espaliers and shrubs along the courtyard edge
  const shrubs = [];
  const r = rng(1212);
  for (let i = 0; i < 58; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (12.8 + r() * 5.3);
    const z = (r() - 0.5) * 9.0;
    if (Math.abs(x) < 12.4) continue;
    shrubs.push({
      position: [x, 0.3, z],
      scale: [0.35 + r() * 0.55, 0.25 + r() * 0.35, 0.35 + r() * 0.55],
      rotation: [0, r() * TAU, 0]
    });
  }
  instanced(root, new THREE.IcosahedronGeometry(0.8, 1), mats.hedge, shrubs, {
    name: "garden-shrubs",
    castShadow: true
  });

  // a discreet stone sundial on each western lawn
  for (const sx of [-1, 1]) {
    const dial = new THREE.Group();
    dial.position.set(sx * 10.6, 0, -4.55);
    root.add(dial);
    cylinder(dial, 0.3, 0.42, 0.9, mats.ashlar, 0, 0.45, 0, { segments: 8 });
    cylinder(dial, 0.6, 0.55, 0.1, mats.weatheredStone, 0, 0.96, 0, { segments: 18 });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), mats.goldAntique);
    face.rotation.x = -Math.PI / 2;
    face.position.y = 1.02;
    dial.add(face);
    cylinder(dial, 0.018, 0.025, 0.65, mats.iron, 0.06, 1.22, 0, { rotZ: 0.45, segments: 4 });
  }

  const update = (elapsed) => {
    fountain.update(elapsed);
  };
  return { root, update };
}

function createSideCourtyards(root, mats, state) {
  const courtyard = new THREE.Group();
  courtyard.name = "service-courts";
  root.add(courtyard);

  // packed stone courts on both flanks of the keep
  for (const sx of [-1, 1]) {
    plane(courtyard, 8.9, 15.6, mats.cobble, sx * 20.0, 0.054, 0, {
      castShadow: false,
      receiveShadow: true
    });
    for (const z of [-7.4, 7.4]) {
      box(courtyard, 9.1, 0.13, 0.3, mats.ashlar, sx * 20.0, 0.11, z, { uvScale: 0.9, rounded: 0.02 });
    }
  }

  // west stable
  const stable = new THREE.Group();
  stable.name = "west-stable";
  stable.position.set(-20.6, 0, -2.6);
  courtyard.add(stable);
  const straw = new THREE.MeshStandardMaterial({ color: 0x9b834f, roughness: 1 });
  for (const sx of [-1.55, 1.55]) {
    for (const z of [-2.65, 2.65]) {
      cylinder(stable, 0.13, 0.18, 2.9, mats.woodDark, sx * 1.25, 1.45, z, { segments: 7 });
    }
  }
  box(stable, 3.3, 0.16, 6.1, mats.wood, 0, 2.96, 0, { rotZ: 0.08, rounded: 0.02 });
  for (let i = 0; i < 15; i++) {
    box(stable, 0.12, 0.12, 0.15, mats.woodDark, -1.4 + i * 0.2, 2.73, -2.92, { rotZ: 0.08, rounded: 0.02 });
  }
  box(stable, 3.4, 1.25, 0.16, mats.woodDark, 0, 0.65, -2.92, { rounded: 0.02 });
  box(stable, 3.4, 1.25, 0.16, mats.woodDark, 0, 0.65, 2.92, { rounded: 0.02 });
  box(stable, 0.2, 2.9, 6.1, mats.woodDark, -1.55, 1.45, 0, { rounded: 0.02 });
  for (const z of [-1.8, 0, 1.8]) {
    box(stable, 2.3, 0.85, 0.12, mats.woodDark, -0.25, 0.62, z, { rounded: 0.02 });
  }
  // hay bales, sacks, trough
  for (const [x, y, z, s] of [[-1.0, 0.34, -2.3, 0.9], [0.7, 0.34, -2.0, 1.0], [0.3, 0.34, 1.9, 0.8]]) {
    box(stable, 1.0 * s, 0.65 * s, 0.7 * s, straw, x, y * s, z, { rounded: 0.03, castShadow: true });
    for (let i = 0; i < 5; i++) {
      box(stable, 0.9 * s, 0.012, 0.02, mats.woodDark, x, (y + i * 0.08) * s, z + 0.36 * s, { castShadow: false });
    }
  }
  box(stable, 1.9, 0.45, 0.6, mats.woodDark, 0.2, 0.27, 2.4, { rounded: 0.02 });
  for (const sx of [-0.7, 0.7]) {
    box(stable, 0.1, 0.4, 0.55, mats.woodDark, sx, 0.24, 2.4, { rotZ: sx * 0.05, rounded: 0.01 });
  }
  const trough = box(stable, 1.8, 0.35, 0.6, mats.weatheredStone, -0.5, 0.22, 0.3, { rounded: 0.05 });
  box(stable, 1.55, 0.02, 0.4, mats.fountainWater, -0.5, 0.4, 0.3, { rounded: 0.01, castShadow: false });
  void trough;

  // a cart waiting under the stable eaves
  const cart = new THREE.Group();
  cart.name = "hay-cart";
  cart.position.set(-18.0, 0, 4.0);
  cart.rotation.y = 0.5;
  courtyard.add(cart);
  box(cart, 2.4, 0.22, 1.1, mats.woodDark, 0, 0.55, 0, { rounded: 0.025 });
  box(cart, 2.3, 0.45, 0.15, mats.wood, 0, 0.78, 0.5, { rounded: 0.02 });
  box(cart, 2.3, 0.45, 0.15, mats.wood, 0, 0.78, -0.5, { rounded: 0.02 });
  for (const sx of [-0.85, 0.85]) {
    const wheel = new THREE.Group();
    wheel.position.set(sx, 0.42, 0.6);
    cart.add(wheel);
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 5, 18), mats.woodDark);
    rimMesh.castShadow = true;
    wheel.add(rimMesh);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      cylinder(wheel, 0.018, 0.018, 0.76, mats.woodDark, Math.cos(a) * 0.0, Math.sin(a) * 0.0, 0, {
        rotZ: a,
        segments: 4
      });
    }
  }
  box(cart, 0.12, 0.12, 1.8, mats.woodDark, -1.4, 0.5, 0.7, { rotX: 0.2, rounded: 0.02 });
  for (let i = 0; i < 4; i++) {
    sphere(cart, 0.42, straw, -0.7 + (i % 2) * 0.8, 0.95, -0.2 + Math.floor(i / 2) * 0.4, {
      width: 7,
      height: 5,
      sy: 0.5
    });
  }

  // east well
  const well = new THREE.Group();
  well.name = "courtyard-well";
  well.position.set(21.1, 0, 4.0);
  courtyard.add(well);
  cylinder(well, 1.2, 1.35, 0.9, mats.weatheredStone, 0, 0.45, 0, { segments: 20 });
  const wellRim = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.13, 6, 22), mats.ashlar);
  wellRim.rotation.x = Math.PI / 2;
  wellRim.position.y = 0.98;
  well.add(wellRim);
  const wellWater = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), mats.fountainWater);
  wellWater.rotation.x = -Math.PI / 2;
  wellWater.position.y = 0.7;
  well.add(wellWater);
  for (const sx of [-1, 1]) {
    cylinder(well, 0.09, 0.12, 2.1, mats.woodDark, sx * 1.08, 1.25, 0, { segments: 7 });
  }
  box(well, 2.45, 0.13, 0.13, mats.woodDark, 0, 2.3, 0, { rounded: 0.02 });
  box(well, 2.1, 0.08, 0.95, mats.slate, 0, 2.55, 0, { rotX: 0.0, rounded: 0.015 });
  cylinder(well, 0.13, 0.15, 0.35, mats.ironRust, 0, 1.95, 0.3, { segments: 7 });
  cylinder(well, 0.012, 0.012, 1.0, mats.rope || mats.linen, 0, 1.45, 0.3, { segments: 3 });
  cylinder(well, 0.16, 0.19, 0.25, mats.woodDark, 0, 0.9, 0.3, { segments: 8, openEnded: true });

  // east forge
  const forge = new THREE.Group();
  forge.name = "blacksmith-forge";
  forge.position.set(20.1, 0, -4.4);
  courtyard.add(forge);
  box(forge, 2.3, 0.6, 1.2, mats.weatheredStone, 0, 0.3, 0, { rounded: 0.04 });
  box(forge, 1.1, 0.28, 0.8, mats.charcoal, 0, 0.72, 0.1, { rounded: 0.03 });
  for (let i = 0; i < 5; i++) {
    sphere(forge, 0.16, i % 2 ? mats.flame : mats.ember, -0.35 + i * 0.18, 0.82, 0.15, {
      width: 6,
      height: 4,
      sy: 0.6
    });
  }
  cylinder(forge, 0.28, 0.66, 2.9, mats.weatheredStone, 0, 1.45, -0.72, { segments: 10 });
  box(forge, 0.5, 0.28, 0.42, mats.iron, 1.55, 0.52, 0.2, { rounded: 0.025 });
  cylinder(forge, 0.16, 0.24, 0.7, mats.woodDark, 1.55, 0.35, 0.2, { segments: 7 });
  box(forge, 1.35, 0.12, 0.7, mats.woodDark, -1.15, 0.82, 1.75, { rounded: 0.02 });
  for (const sx of [-0.5, 0.5]) {
    box(forge, 0.1, 0.8, 0.1, mats.woodDark, -1.65 + sx, 0.4, 1.75, { rounded: 0.015 });
  }
  // anvil
  box(forge, 0.32, 0.22, 0.72, mats.iron, 1.55, 0.86, 0.2, { rounded: 0.04 });
  box(forge, 0.42, 0.2, 0.32, mats.iron, 1.55, 1.04, 0.2, { rounded: 0.03 });
  cone(forge, 0.13, 0.35, mats.iron, 1.55, 1.15, -0.1, { rotX: Math.PI / 2, segments: 6 });
  // tool rack with hammers and tongs
  for (let i = 0; i < 4; i++) {
    cylinder(forge, 0.012, 0.016, 0.55, mats.iron, -1.75 + i * 0.16, 1.4, 0.9, { rotZ: i % 2 ? 0.25 : -0.25, segments: 3 });
    box(forge, 0.12, 0.1, 0.08, mats.iron, -1.75 + i * 0.16 + (i % 2 ? 0.12 : -0.12), 1.13, 0.9, { rounded: 0.01 });
  }
  // firewood and coal pile
  for (let i = 0; i < 6; i++) {
    box(forge, 0.55, 0.12, 0.16, mats.charcoal, 1.7, 0.08 + i * 0.09, -0.2 + (i % 3) * 0.18, {
      ry: i * 0.3,
      rounded: 0.02
    });
  }

  // training target and weapon rack in the east court
  const target = new THREE.Group();
  target.name = "archery-target";
  target.position.set(23.4, 1.55, -0.2);
  target.rotation.y = -Math.PI / 2;
  courtyard.add(target);
  cylinder(target, 0.7, 0.7, 0.12, mats.woodDark, 0, 0, 0, { rotX: Math.PI / 2, segments: 18 });
  for (const [r, mat] of [[0.52, mats.linen], [0.34, mats.clothCrimson], [0.13, mats.linen]]) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 22), mat);
    disc.position.z = 0.07;
    target.add(disc);
  }
  cylinder(target, 0.05, 0.06, 2.2, mats.iron, 0, -0.75, 0, { segments: 5 });
  for (const sx of [-1, 1]) {
    box(courtyard, 0.12, 1.5, 0.12, mats.woodDark, 23.8, 0.75, 1.1 + sx * 0.6, { rounded: 0.01 });
  }
  box(courtyard, 0.1, 0.1, 1.2, mats.woodDark, 23.8, 1.5, 1.1, { rotX: 0, rounded: 0.01 });
  for (let i = 0; i < 3; i++) {
    cylinder(courtyard, 0.015, 0.02, 1.7, mats.woodDark, 23.8, 0.9, 0.65 + i * 0.3, { segments: 4 });
    box(courtyard, 0.18, 0.22, 0.03, mats.iron, 23.8, 1.68, 0.65 + i * 0.3, { rounded: 0.01 });
  }

  // courtyard lights / forge smoke anchors
  if (state) {
    state.lightSpots.push({
      position: new THREE.Vector3(20.3, 1.4, -4.2),
      color: 0xff8b45,
      intensity: 0.8,
      distance: 5.5,
      type: "forge",
      room: "courtyard",
      floor: 0
    });
    if (state.smokeSpots) state.smokeSpots.push(new THREE.Vector3(20.0, 3.2, -5.1));
  }

  return courtyard;
}

export function buildGardens({ mats, textures, state, root }) {
  const group = new THREE.Group();
  group.name = "gardens";
  root.add(group);

  const frontTemplate = createGardenTemplate(mats, state);
  frontTemplate.root.name = "south-parterre";
  group.add(frontTemplate.root);

  const rear = frontTemplate.root.clone(true);
  rear.name = "north-parterre";
  rear.position.set(0, 0, -G.centerZ);
  rear.rotation.y = Math.PI;
  group.add(rear);

  // continuation of the central walk from the garden gates to the walls
  for (const z of [20.15, -20.15]) {
    pathRect(group, mats, 3.1, 2.2, 0, z, 0.057);
    pathRect(group, mats, 3.1, 2.9, 0, Math.sign(z) * 8.0, 0.057);
  }

  // kitchen garden alongside the west wing
  const herb = new THREE.Group();
  herb.name = "kitchen-herb-garden";
  herb.position.set(-16.4, 0, 6.0);
  group.add(herb);
  for (let i = 0; i < 4; i++) {
    box(herb, 1.8, 0.2, 0.75, mats.soil, 0, 0.1, i * 0.85, { rounded: 0.02 });
    for (let j = 0; j < 8; j++) {
      const x = -0.7 + j * 0.2;
      const z = -0.25 + (j % 2) * 0.5;
      sphere(herb, 0.09, j % 3 === 0 ? mats.flowerPurple : mats.leafOlive, x, 0.32, i * 0.85 + z, {
        width: 6,
        height: 4,
        sy: 1.3
      });
    }
  }
  box(herb, 2.0, 0.42, 0.7, mats.woodDark, 0, 0.21, 3.8, { rounded: 0.02 });
  for (let i = 0; i < 5; i++) {
    cylinder(herb, 0.08, 0.1, 0.45, mats.terracotta, -0.6 + i * 0.3, 0.24, -0.55, { segments: 8 });
    sphere(herb, 0.16, mats.leafDeep, -0.6 + i * 0.3, 0.53, -0.55, { width: 6, height: 4, sy: 0.6 });
  }

  const side = createSideCourtyards(group, mats, state);

  // garden point lights (one warm lamp in each parterre)
  state.lightSpots.push({
    position: new THREE.Vector3(2.15, 2.2, G.centerZ + 2.8),
    color: 0xffb06d,
    intensity: 0.65,
    distance: 8,
    type: "garden",
    room: "frontGarden",
    floor: 0
  });
  state.lightSpots.push({
    position: new THREE.Vector3(-2.15, 2.2, -G.centerZ - 2.8),
    color: 0xffb06d,
    intensity: 0.65,
    distance: 8,
    type: "garden",
    room: "rearGarden",
    floor: 0
  });

  return {
    group,
    front: frontTemplate.root,
    rear,
    side,
    update: frontTemplate.update
  };
}
