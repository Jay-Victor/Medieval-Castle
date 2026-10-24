import * as THREE from "three";
import { box, cylinder, sphere, torus } from "./helpers.js";
import {
  makeChair,
  makeThrone,
  makeTable,
  makeRoundTable,
  makeArmchair,
  makeStool,
  makeBed,
  makeChest,
  makeWardrobe,
  makeNightstand,
  makeDesk,
  makeBookshelf,
  makeGlobe,
  makeLadder,
  makeFireplace,
  makeChandelier,
  makeMinstrelGallery,
  makePew,
  makeAltar,
  makeCandleStand,
  makeKitchenHearth,
  makePrepTable,
  makeBarrel,
  makeSack,
  makeHutch,
  makeTelescope,
  makeStarTable,
  makePlanter,
  makeBench,
  makeRug,
  makeTapestry,
  makeWallSconce,
  addTableSetting,
  useLighting
} from "./furniture.js";
import { FurnitureBuilder } from "./furniture-builder.js";

function markRoom(group, room) {
  group.userData.room = room;
  group.traverse((child) => {
    child.userData.room = room;
  });
  return group;
}

function reg(audit, room, id, label, group, options = {}) {
  markRoom(group, room);
  if (audit) audit.register(id, room, group, { label, ...options });
  return group;
}

function decorProps(parent, fn) {
  const b = new FurnitureBuilder(parent);
  fn(b);
  b.finish("ambient-props");
}

function addCandle(b, mats, x, y, z, h = 0.22) {
  b.cylinder(0.035, 0.045, h, mats.wax, x, y + h / 2, z, { segments: 7 });
  b.sphere(0.042, mats.flame, x, y + h + 0.035, z, { width: 5, height: 4, sy: 1.7 });
  b.sphere(0.015, mats.flameCore, x, y + h + 0.025, z, { width: 4, height: 3, sy: 1.7 });
}

function addOpenBook(b, mats, x, y, z, rotY = 0, scale = 1) {
  const w = 0.52 * scale;
  const d = 0.36 * scale;
  b.box(w, 0.03, d, mats.paper, x, y, z, { ry: rotY, round: 0.006 });
  b.box(w / 2 - 0.01, 0.012, d - 0.03, mats.offWhite || mats.paper, x - w / 4, y + 0.02, z, { ry: rotY, round: 0.003 });
  b.box(w / 2 - 0.01, 0.012, d - 0.03, mats.offWhite || mats.paper, x + w / 4, y + 0.02, z, { ry: rotY, round: 0.003 });
  b.box(0.024, 0.014, d, mats.leather, x, y + 0.016, z, { ry: rotY });
}

/* ═══════════════════════════ GREAT HALL ═══════════════════════════ */

function buildGreatHall(layers, mats, audit, state) {
  const parent = layers.furniture0;
  const decor = layers.decor0;
  const y = 0.3;

  // raised dais and its shallow fore-step
  box(parent, 8.8, 0.16, 2.7, mats.weatheredStone, 0, 0.38, -4.18, { uvScale: 1.2, rounded: 0.02 });
  box(parent, 8.9, 0.06, 2.8, mats.woodDark, 0, 0.47, -4.18, { uvScale: 1.4, rounded: 0.015, castShadow: false });
  box(parent, 5.0, 0.08, 0.35, mats.weatheredStone, 0, 0.34, -2.76, { uvScale: 0.8, rounded: 0.015 });

  const highTable = makeTable(parent, mats, 0, 0.46, -4.26, 0, {
    name: "high-table",
    w: 5.55,
    d: 0.92,
    h: 0.88,
    trestle: true
  });
  reg(audit, "greatHall", "high-table", "高台主桌", highTable);

  for (const x of [-2.05, 0, 2.05]) {
    const throne = makeThrone(parent, mats, x, 0.46, -5.16, 0);
    throne.scale.setScalar(0.9);
    reg(audit, "greatHall", "throne-" + x, "高背座椅", throne);
  }

  const longTable = makeTable(parent, mats, 0, y, 0.55, 0, {
    name: "great-hall-long-table",
    w: 6.55,
    d: 1.55,
    h: 0.9,
    trestle: true
  });
  reg(audit, "greatHall", "great-long-table", "十二席长桌", longTable);

  const chairPositions = [
    [-2.4, -0.78, 0], [-0.8, -0.78, 0], [0.8, -0.78, 0], [2.4, -0.78, 0],
    [-2.4, 1.87, Math.PI], [-0.8, 1.87, Math.PI], [0.8, 1.87, Math.PI], [2.4, 1.87, Math.PI]
  ];
  chairPositions.forEach(([x, z, rot], i) => {
    const chair = makeChair(parent, mats, x, y, z, rot, { cushion: mats.clothCrimson, name: "hall-chair-" + i });
    reg(audit, "greatHall", "hall-chair-" + i, "橡木餐椅", chair);
  });
  for (const [x, rot] of [[-3.82, Math.PI / 2], [3.82, -Math.PI / 2]]) {
    const endChair = makeChair(parent, mats, x, y, 0.55, rot, { cushion: mats.clothCrimson, arm: true, name: "hall-end-chair" });
    reg(audit, "greatHall", "hall-end-chair-" + x, "主位扶手椅", endChair);
  }

  const sideboard = makeHutch(parent, mats, 7.72, y, -2.2, -Math.PI / 2, { w: 1.85, h: 1.25, d: 0.46 });
  reg(audit, "greatHall", "hall-sideboard", "餐边柜", sideboard);

  const fireplace = makeFireplace(parent, mats, -8.34, y, -2.4, Math.PI / 2, {
    name: "great-hall-fireplace",
    w: 2.4,
    h: 3.65,
    depth: 0.72,
    room: "greatHall",
    floor: 0
  });
  reg(audit, "greatHall", "hall-fireplace", "石砌壁炉", fireplace, { wallMounted: true, ignoreBoundary: true });

  const settle = makeBench(parent, mats, -6.9, y, 0.9, Math.PI / 2, { name: "hearth-settle", length: 1.7, back: false });
  reg(audit, "greatHall", "hall-settle", "炉边长凳", settle);

  // minstrel gallery above the entrance
  const gallery = makeMinstrelGallery(parent, mats, 0, 3.62, 5.02);
  markRoom(gallery, "greatHall");

  // rugs and tapestries
  makeRug(decor, mats, mats.rugAurelia, 0, y + 0.012, 0.55, 5.9, 3.5);
  makeRug(decor, mats, mats.rugAurelia, 0, 0.472, -4.18, 6.5, 2.25);
  makeTapestry(decor, mats, mats.tapestryCrimson, 8.29, 2.55, 2.1, -Math.PI / 2, 2.4, 2.9);
  makeTapestry(decor, mats, mats.tapestryIndigo, -8.29, 2.65, 3.55, Math.PI / 2, 2.1, 2.55);

  const chandelier = makeChandelier(decor, mats, 0, 4.63, 0.55, { radius: 1.15, room: "greatHall", floor: 0 });
  markRoom(chandelier, "greatHall");

  // the table is laid for company
  const service = [];
  for (const x of [-2.4, -0.8, 0.8, 2.4]) {
    service.push({ type: "plate", x, z: -0.47 });
    service.push({ type: "plate", x, z: 0.47 });
    service.push({ type: "goblet", x: x + 0.18, z: -0.44 });
    service.push({ type: "goblet", x: x - 0.18, z: 0.44 });
  }
  service.push({ type: "plate", x: -2.95, z: 0 });
  service.push({ type: "plate", x: 2.95, z: 0 });
  service.push({ type: "runner", x: 0, z: 0, w: 5.7, d: 0.32 });
  service.push({ type: "bowl", x: 0, z: 0.04 });
  service.push({ type: "jug", x: 1.3, z: 0.1 });
  service.push({ type: "candle", x: -1.2, z: 0, height: 0.3 });
  service.push({ type: "candle", x: 1.2, z: 0, height: 0.3 });
  addTableSetting(decor, mats, 0, y + 0.9, 0.55, service);

  const highService = [
    { type: "runner", x: 0, z: 0, w: 4.7, d: 0.3 },
    { type: "plate", x: -1.65, z: 0 },
    { type: "plate", x: 0, z: 0 },
    { type: "plate", x: 1.65, z: 0 },
    { type: "goblet", x: -1.25, z: 0.32 },
    { type: "goblet", x: 0.3, z: 0.32 },
    { type: "bowl", x: -0.2, z: -0.32 },
    { type: "candle", x: 2.1, z: 0, height: 0.33 }
  ];
  addTableSetting(decor, mats, 0, 0.46 + 0.88, -4.26, highService);

  // interior sconces and small objects
  makeWallSconce(decor, mats, -3.3, 2.2, 5.8, Math.PI);
  makeWallSconce(decor, mats, 3.3, 2.2, 5.8, Math.PI);
  makeWallSconce(decor, mats, -8.3, 2.2, -0.3, Math.PI / 2);

  decorProps(decor, (b) => {
    // sideboard pewter and flowers
    b.box(0.12, 0.8, 0.12, mats.iron, 7.72, 1.72, -2.2, { round: 0.02 });
    b.sphere(0.22, mats.goldAntique, 7.72, 1.38, -2.2, { width: 10, height: 7, sx: 1.6, sy: 0.2, sz: 0.75, ry: 0.2 });
    for (const z of [-2.75, -1.65]) {
      b.cylinder(0.14, 0.18, 0.28, mats.goldAntique, 7.62, 1.5, z, { segments: 10 });
      b.cylinder(0.1, 0.13, 0.1, mats.iron, 7.62, 1.7, z, { segments: 8 });
    }
    // flames on the sconces are merged in their own groups; add tall candle pair to sideboard
    addCandle(b, mats, 7.0, 1.78, -2.82, 0.25);
    // a jug and cups on the high table
    b.cylinder(0.11, 0.08, 0.26, mats.terracotta, 1.2, 1.48, -4.45, { segments: 10 });
    // scrolls by the fire
    b.box(0.38, 0.04, 0.22, mats.parchment, -6.6, 0.58, -1.35, { ry: 0.35, round: 0.01 });
    b.box(0.32, 0.035, 0.2, mats.paper, -6.5, 0.64, -1.55, { ry: -0.15, round: 0.01 });
  });

  // the last shaft of light catches the hall
  state.lightSpots; // primitive lights are contributed by fixtures
  return { items: 18 };
}

/* ═══════════════════════════ SOLAR ═══════════════════════════ */

function buildSolar(layers, mats, audit, state) {
  const parent = layers.furniture1;
  const decor = layers.decor1;
  const y = 5.55;

  const bed = makeBed(parent, mats, 4.55, y, -3.5, 0);
  reg(audit, "solar", "solar-bed", "四柱帷幔床", bed);

  const nightRight = makeNightstand(parent, mats, 6.45, y, -5.0, 0);
  reg(audit, "solar", "solar-night-right", "床头小几", nightRight);
  const nightLeft = makeNightstand(parent, mats, 2.65, y, -5.0, 0);
  reg(audit, "solar", "solar-night-left", "床头小几", nightLeft);

  const chest = makeChest(parent, mats, 4.55, y, -1.05, 0, { w: 1.75, h: 0.52, d: 0.55 });
  reg(audit, "solar", "solar-chest", "铁包木衣箱", chest);

  const wardrobe = makeWardrobe(parent, mats, 8.0, y, -1.05, -Math.PI / 2);
  reg(audit, "solar", "solar-wardrobe", "胡桃木衣柜", wardrobe, { wallMounted: true });

  const fireplace = makeFireplace(parent, mats, -2.7, y, -5.84, 0, {
    name: "solar-fireplace",
    w: 2.05,
    h: 3.75,
    depth: 0.66,
    room: "solar",
    floor: 1
  });
  reg(audit, "solar", "solar-fireplace", "套房壁炉", fireplace, { wallMounted: true, ignoreBoundary: true });

  const chairA = makeArmchair(parent, mats, -4.6, y, -2.1, Math.PI, { fabric: mats.velvetGreen });
  reg(audit, "solar", "solar-chair-a", "炉边扶手椅", chairA);
  const chairB = makeArmchair(parent, mats, -0.8, y, -2.1, Math.PI, { fabric: mats.velvetGreen });
  reg(audit, "solar", "solar-chair-b", "炉边扶手椅", chairB);
  const teaTable = makeRoundTable(parent, mats, -2.7, y, -1.25, 0.34, { name: "solar-low-table", height: 0.54 });
  reg(audit, "solar", "solar-low-table", "炉边小圆几", teaTable);

  const desk = makeDesk(parent, mats, -6.55, y, -5.36, 0, { w: 1.55, d: 0.62, h: 0.8 });
  reg(audit, "solar", "solar-desk", "写字桌", desk, { wallMounted: true });
  const deskChair = makeChair(parent, mats, -6.55, y, -4.45, Math.PI, {
    cushion: mats.velvetGreen,
    arm: true,
    name: "solar-writing-chair"
  });
  reg(audit, "solar", "solar-writing-chair", "写字椅", deskChair);

  const readingChair = makeChair(parent, mats, -3.15, y, 4.45, Math.PI * 1.2, {
    cushion: mats.clothGold,
    arm: true,
    name: "solar-reading-chair"
  });
  reg(audit, "solar", "solar-reading-chair", "窗边读书椅", readingChair);

  makeRug(decor, mats, mats.rugSolar, -0.9, y + 0.012, -0.1, 5.9, 4.3);
  makeTapestry(decor, mats, mats.tapestryIndigo, 8.29, 8.35, 3.85, -Math.PI / 2, 1.85, 2.15);
  makeTapestry(decor, mats, mats.tapestryCrimson, -8.29, 8.4, -3.75, Math.PI / 2, 1.9, 2.2);
  makeTapestry(decor, mats, mats.tapestryCrimson, 3.4, 8.25, 5.78, Math.PI, 1.45, 2.0);

  // curtains framing the balcony door, with a little morning sun on the folds
  decorProps(decor, (b) => {
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        b.box(0.2 - i * 0.03, 2.9 - i * 0.11, 0.12, mats.clothCrimsonDeep, sx * (1.42 + i * 0.14), 7.04, 5.76 - i * 0.035, {
          round: 0.05,
          ry: sx * 0.03
        });
      }
    }
    b.cylinder(0.025, 0.025, 3.0, mats.iron, 0, 8.5, 5.77, { rotZ: Math.PI / 2, segments: 5 });
    // writing desk clutter, now against the north wall
    addOpenBook(b, mats, -6.75, 6.4, -5.24, -0.1, 0.72);
    b.cylinder(0.045, 0.055, 0.11, mats.iron, -6.02, 6.42, -5.16, { segments: 8 });
    b.cylinder(0.025, 0.028, 0.3, mats.iron, -6.02, 6.55, -5.16, { rotZ: 0.45, segments: 4 });
    b.box(0.32, 0.02, 0.42, mats.paper, -6.9, 6.39, -5.45, { ry: 0.15, round: 0.003 });
    addCandle(b, mats, 6.95, 6.36, -4.95, 0.19);
    addCandle(b, mats, 2.2, 6.36, -5.0, 0.16);
    b.box(0.4, 0.04, 0.25, mats.clothIvory, 4.4, 6.11, -1.04, { round: 0.02 });
    b.sphere(0.16, mats.clothIvory, 4.8, 6.2, -1.04, { width: 7, height: 5, sy: 0.4, sx: 1.4 });
    // small vase on the low table between the fireside chairs
    b.cylinder(0.12, 0.08, 0.3, mats.terracotta, -2.7, 6.0, -1.25, { segments: 10 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28;
      b.cylinder(0.009, 0.01, 0.3, mats.leafDeep, -2.7 + Math.cos(a) * 0.1, 6.33, -1.25 + Math.sin(a) * 0.1, { segments: 3 });
      b.sphere(0.06, mats.flowerCream, -2.7 + Math.cos(a) * 0.14, 6.49, -1.25 + Math.sin(a) * 0.14, {
        width: 6,
        height: 4,
        sx: 1.2,
        sy: 0.8
      });
    }
    // book left open on the bed
    addOpenBook(b, mats, 4.85, 6.43, -1.85, 0.3, 0.62);
  });

  // south / morning balcony
  const balconyY = y;
  const leftChair = makeChair(parent, mats, -1.28, balconyY, 8.22, Math.PI / 2, {
    cushion: mats.clothCream || mats.linen,
    arm: true,
    name: "balcony-chair-left"
  });
  reg(audit, "southBalcony", "south-balcony-chair-left", "晨露藤椅", leftChair);
  const rightChair = makeChair(parent, mats, 1.28, balconyY, 8.22, -Math.PI / 2, {
    cushion: mats.clothCream || mats.linen,
    arm: true,
    name: "balcony-chair-right"
  });
  reg(audit, "southBalcony", "south-balcony-chair-right", "晨露藤椅", rightChair);
  const balconyTable = makeRoundTable(parent, mats, 0, balconyY, 8.28, 0.42, { name: "balcony-tea-table", height: 0.66 });
  reg(audit, "southBalcony", "south-balcony-table", "双人茶桌", balconyTable);

  for (const x of [-3.5, 3.5]) {
    const planter = makePlanter(parent, mats, x, balconyY, 7.05, { scale: 0.9 });
    reg(audit, "southBalcony", "south-planter-" + x, "玫瑰陶盆", planter);
  }

  addTableSetting(decor, mats, 0, balconyY + 0.66, 8.28, [
    { type: "plate", x: -0.28, z: 0.04 },
    { type: "plate", x: 0.28, z: 0.04 },
    { type: "goblet", x: -0.16, z: -0.18 },
    { type: "goblet", x: 0.18, z: -0.18 },
    { type: "bowl", x: 0, z: 0.25 }
  ]);
  decorProps(decor, (b) => {
    b.cylinder(0.16, 0.1, 0.22, mats.terracotta, 0.3, 6.3, 8.28, { segments: 10 });
    b.sphere(0.15, mats.leafMid, 0.3, 6.5, 8.28, { width: 7, height: 5, sy: 0.5 });
    b.sphere(0.06, mats.flowerPink, 0.2, 6.58, 8.22, { width: 6, height: 4 });
    b.sphere(0.05, mats.flowerWhite, 0.4, 6.55, 8.33, { width: 6, height: 4 });
  });

  return { items: 16 };
}

/* ═══════════════════════════ LIBRARY ═══════════════════════════ */

function buildLibrary(layers, mats, audit, state) {
  const parent = layers.furniture2;
  const decor = layers.decor2;
  const y = 10.45;

  const shelfSpecs = [
    [-5.7, -5.3, 0, 101], [-3.1, -5.3, 0, 102],
    [3.1, -5.3, 0, 103], [5.7, -5.3, 0, 104],
    [-7.9, -3.3, Math.PI / 2, 105], [7.9, -3.1, -Math.PI / 2, 106]
  ];
  shelfSpecs.forEach(([x, z, rot, seed], i) => {
    const shelf = makeBookshelf(parent, mats, x, y, z, rot, {
      name: "library-bookcase-" + i,
      w: i > 3 ? 1.8 : 2.0,
      h: 2.75,
      d: 0.44,
      seed
    });
    reg(audit, "library", "library-bookcase-" + i, "整墙书柜", shelf, { wallMounted: true });
  });

  const table = makeTable(parent, mats, -0.4, y, 0.3, 0, {
    name: "reading-table",
    w: 3.4,
    d: 1.5,
    h: 0.88,
    trestle: false
  });
  reg(audit, "library", "library-reading-table", "读经长桌", table);

  const chairs = [
    [-1.45, -0.82, 0], [0.65, -0.82, 0],
    [-1.45, 1.45, Math.PI], [0.65, 1.45, Math.PI]
  ];
  chairs.forEach(([x, z, rot], i) => {
    const chair = makeChair(parent, mats, x, y, z, rot, {
      cushion: mats.velvetGreen,
      name: "library-chair-" + i
    });
    reg(audit, "library", "library-chair-" + i, "读书椅", chair);
  });

  const fireplace = makeFireplace(parent, mats, -8.34, y, 2.0, Math.PI / 2, {
    name: "library-fireplace",
    w: 1.9,
    h: 3.35,
    depth: 0.64,
    room: "library",
    floor: 2
  });
  reg(audit, "library", "library-fireplace", "书房壁炉", fireplace, { wallMounted: true, ignoreBoundary: true });

  const armA = makeArmchair(parent, mats, -5.5, y, 0.9, -Math.PI / 2, { fabric: mats.clothBlue });
  reg(audit, "library", "library-armchair-a", "炉边读书椅", armA);
  const armB = makeArmchair(parent, mats, -5.5, y, 2.75, -Math.PI / 2, { fabric: mats.clothBlue });
  reg(audit, "library", "library-armchair-b", "炉边读书椅", armB);
  const sideTable = makeRoundTable(parent, mats, -4.7, y, 1.8, 0.3, { name: "library-side-table", height: 0.54 });
  reg(audit, "library", "library-side-table", "灯下小几", sideTable);

  const desk = makeDesk(parent, mats, 4.4, y, 5.1, Math.PI, { w: 1.55, d: 0.65, h: 0.8 });
  reg(audit, "library", "library-desk", "南窗写字桌", desk);
  const deskChair = makeChair(parent, mats, 4.4, y, 4.35, 0, {
    cushion: mats.clothGold,
    arm: true,
    name: "library-desk-chair"
  });
  reg(audit, "library", "library-desk-chair", "写字椅", deskChair);

  const globe = makeGlobe(parent, mats, 6.9, y, 3.35);
  reg(audit, "library", "library-globe", "黄铜天球仪", globe);

  const ladder = makeLadder(parent, mats, -5.45, y, -4.55, Math.PI);
  ladder.rotation.x = -0.13;
  reg(audit, "library", "library-ladder", "移动书梯", ladder);

  makeRug(decor, mats, mats.rugLibrary, 0.1, y + 0.012, 1.35, 5.7, 3.8);
  makeTapestry(decor, mats, mats.tapestryIndigo, 8.29, 12.15, 1.1, -Math.PI / 2, 1.8, 2.0);
  makeTapestry(decor, mats, mats.tapestryCrimson, -5.2, 12.3, 5.78, Math.PI, 1.7, 2.0);

  makeWallSconce(decor, mats, -3.2, 11.9, -5.75, 0);
  makeWallSconce(decor, mats, 3.2, 11.9, -5.75, 0);

  // north star balcony
  const by = y;
  const telescope = makeTelescope(parent, mats, -1.2, by, -7.8, 0.45);
  reg(audit, "northBalcony", "north-telescope", "黄铜望远镜", telescope);
  const starTable = makeStarTable(parent, mats, 1.35, by, -8.0);
  reg(audit, "northBalcony", "north-star-table", "星图石桌", starTable);
  const starChair = makeChair(parent, mats, 2.65, by, -7.12, -2.2, {
    cushion: mats.clothBlue,
    arm: true,
    name: "stargazing-chair"
  });
  reg(audit, "northBalcony", "north-star-chair", "观星椅", starChair);
  const starChest = makeChest(parent, mats, -2.8, by, -8.35, 0, { w: 0.9, h: 0.48, d: 0.45 });
  reg(audit, "northBalcony", "north-star-chest", "毛毯木箱", starChest);
  const starPlanter = makePlanter(parent, mats, -3.4, by, -6.55, { scale: 0.72 });
  reg(audit, "northBalcony", "north-star-planter", "迷迭香陶盆", starPlanter);

  decorProps(decor, (b) => {
    // reading table
    addOpenBook(b, mats, -0.7, 11.34, 0.32, 0.1, 0.9);
    addOpenBook(b, mats, 0.25, 11.34, 0.1, -0.22, 0.7);
    addCandle(b, mats, -1.55, 11.33, 0.13, 0.24);
    b.add(new THREE.TorusGeometry(0.17, 0.018, 5, 28), mats.goldAntique, [0.78, 11.51, 0.3], [0.4, 0, 0.2]);
    b.add(new THREE.TorusGeometry(0.12, 0.012, 4, 24), mats.goldAntique, [0.78, 11.51, 0.3], [1.6, 0.3, 0]);
    b.cylinder(0.025, 0.03, 0.28, mats.iron, 0.78, 11.38, 0.3, { segments: 6 });
    // desk writing things
    addOpenBook(b, mats, 4.25, 11.25, 5.08, Math.PI, 0.85);
    b.cylinder(0.05, 0.06, 0.12, mats.iron, 3.92, 11.27, 4.8, { segments: 8 });
    b.cylinder(0.022, 0.025, 0.3, mats.paper, 3.92, 11.42, 4.8, { rx: 0.4, segments: 4 });
    addCandle(b, mats, 4.9, 11.24, 4.82, 0.22);
    // little stacks and scrolls around the room
    for (let i = 0; i < 4; i++) {
      b.box(0.32 - i * 0.015, 0.045, 0.24, [mats.bookBlue, mats.bookRed, mats.bookGreen, mats.bookBrown][i], -4.5, 10.48 + i * 0.045, 0.25, {
        ry: 0.14,
        round: 0.006
      });
    }
    b.box(0.55, 0.03, 0.18, mats.parchment, 5.6, 11.1, 4.9, { ry: -0.25, round: 0.01 });
    // side table lamp
    b.cylinder(0.025, 0.04, 0.34, mats.goldAntique, -4.7, 10.5 + 0.54, 1.8, { segments: 6 });
    b.cylinder(0.16, 0.2, 0.25, mats.clothIvory, -4.7, 10.98, 1.8, { segments: 12 });
    b.cylinder(0.12, 0.15, 0.11, mats.wax, -4.7, 11.0, 1.8, { segments: 10 });
    b.sphere(0.055, mats.flame, -4.7, 11.16, 1.8, { width: 6, height: 5, sy: 1.8 });
    // star balcony: chart and flask
    addOpenBook(b, mats, 1.35, 11.24, -8.0, 0.4, 0.8);
    b.cylinder(0.035, 0.045, 0.15, mats.bottles[1], 2.0, 11.26, -7.8, { segments: 8 });
    b.cylinder(0.018, 0.02, 0.09, mats.wax, 2.0, 11.38, -7.8, { segments: 6 });
    b.sphere(0.04, mats.flame, 2.0, 11.48, -7.8, { width: 5, height: 4, sy: 1.6 });
    b.box(0.55, 0.04, 0.38, mats.linen, -2.8, 10.94, -8.35, { ry: 0.1, round: 0.02 });
    // ink, quills and loose maps on floor? keep it tidy
    b.box(0.35, 0.02, 0.26, mats.paper, 7.8, 10.47, 3.95, { ry: 0.4 });
  });

  // a soft pool of candlelight for the north balcony
  state.lightSpots.push({
    position: new THREE.Vector3(1.1, 11.2, -7.6),
    color: 0xffb977,
    intensity: 0.4,
    distance: 4.5,
    type: "room",
    room: "northBalcony",
    floor: 2
  });

  return { items: 21 };
}

/* ═══════════════════════════ CHAPEL ═══════════════════════════ */

function buildChapel(layers, mats, audit, state) {
  const parent = layers.furniture0;
  const decor = layers.decor0;
  const y = 0.3;

  const altar = makeAltar(parent, mats, 13.7, y, 0, -Math.PI / 2);
  reg(audit, "chapel", "chapel-altar", "石祭坛", altar, { wallMounted: true });

  const pewX = [10.0, 11.1, 12.2];
  const pewZ = [-1.9, 1.9];
  pewX.forEach((x, ix) => {
    pewZ.forEach((z, iz) => {
      const pew = makePew(parent, mats, x, y, z, Math.PI / 2, { length: 2.2 });
      reg(audit, "chapel", "chapel-pew-" + ix + "-" + iz, "诵经长椅", pew);
    });
  });

  for (const z of [-1.35, 1.35]) {
    const stand = makeCandleStand(parent, mats, 12.9, y, z);
    reg(audit, "chapel", "chapel-candlestand-" + z, "黄铜烛台", stand);
  }

  const relic = createReliquary(decor, mats);
  markRoom(relic, "chapel");

  const bench = makeBench(parent, mats, 12.95, y, 0, Math.PI / 2, {
    name: "prayer-kneeler",
    length: 0.85,
    depth: 0.4,
    back: false
  });
  reg(audit, "chapel", "chapel-kneeler", "祈祷跪凳", bench);

  // a small carved saint's plinth in the northeast corner
  const statueGroup = new THREE.Group();
  statueGroup.name = "saint-niche";
  statueGroup.position.set(13.65, y, -2.75);
  decor.add(statueGroup);
  const sb = new FurnitureBuilder(statueGroup);
  sb.cylinder(0.28, 0.35, 0.5, mats.ashlar, 0, 0.25, 0, { segments: 8 });
  sb.cylinder(0.21, 0.25, 1.1, mats.weatheredStone, 0, 1.05, 0, { segments: 8 });
  sb.sphere(0.2, mats.weatheredStone, 0, 1.76, 0, { width: 9, height: 7, sy: 1.2 });
  sb.cylinder(0.12, 0.18, 0.55, mats.weatheredStone, 0, 1.36, 0, { segments: 8 });
  sb.sphere(0.14, mats.weatheredStone, 0, 1.92, 0.02, { width: 8, height: 6 });
  sb.box(0.07, 0.5, 0.06, mats.goldAntique, 0.05, 1.42, 0.2, { rz: -0.08, round: 0.01 });
  sb.finish("saint");
  reg(audit, "chapel", "chapel-saint", "圣徒石像", statueGroup);
  markRoom(statueGroup, "chapel");

  makeRug(decor, mats, mats.rugAurelia, 11.25, y + 0.012, 0, 1.1, 3.55, Math.PI / 2);
  makeTapestry(decor, mats, mats.tapestryCrimson, 11.4, 2.05, -3.47, 0, 2.0, 2.45);
  makeTapestry(decor, mats, mats.tapestryIndigo, 11.4, 2.05, 3.47, Math.PI, 1.8, 2.3);

  const sconceA = makeWallSconce(decor, mats, 9.8, 2.0, -3.45, 0);
  markRoom(sconceA, "chapel");
  const sconceB = makeWallSconce(decor, mats, 9.8, 2.0, 3.45, Math.PI);
  markRoom(sconceB, "chapel");

  decorProps(decor, (b) => {
    // altar flowers, incense and prayer books
    b.add(new THREE.CylinderGeometry(0.22, 0.13, 0.22, 12), mats.terracotta, [13.3, 1.16, 0.7], [0, 0, 0]);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      b.cylinder(0.009, 0.011, 0.32, mats.leafDeep, 13.3 + Math.cos(a) * 0.12, 1.45, 0.7 + Math.sin(a) * 0.12, { segments: 3 });
      b.sphere(0.06, i % 2 ? mats.flowerWhite : mats.flowerPink, 13.3 + Math.cos(a) * 0.18, 1.63, 0.7 + Math.sin(a) * 0.18, {
        width: 6,
        height: 4,
        sx: 1.2,
        sy: 0.8
      });
    }
    b.cylinder(0.12, 0.09, 0.18, mats.iron, 13.32, 1.28, -0.7, { segments: 8 });
    b.cylinder(0.02, 0.03, 0.1, mats.wax, 13.32, 1.4, -0.7, { segments: 5 });
    b.sphere(0.045, mats.flame, 13.32, 1.48, -0.7, { width: 5, height: 4, sy: 1.5 });
    addOpenBook(b, mats, 12.45, 1.19, 0.34, 0.4, 0.7);
    b.box(0.32, 0.05, 0.24, mats.clothGold, 12.2, 0.56, -2.0, { round: 0.03 });
    // small votive candles at the west entrance
    for (const x of [9.8, 10.15]) {
      for (const z of [2.6, 2.9]) {
        b.cylinder(0.04, 0.045, 0.12, mats.wax, x, 0.47, z, { segments: 7 });
        b.sphere(0.035, mats.flame, x, 0.56, z, { width: 5, height: 4, sy: 1.5 });
      }
    }
  });

  // altar point light
  state.lightSpots.push({
    position: new THREE.Vector3(12.8, 1.8, 0),
    color: 0xffb266,
    intensity: 0.85,
    distance: 5.5,
    type: "altar",
    room: "chapel",
    floor: 0
  });

  return { items: 13 };
}

function createReliquary(parent, mats) {
  const group = new THREE.Group();
  group.name = "votive-reliquary";
  group.position.set(13.68, 0.3, 2.72);
  parent.add(group);
  const b = new FurnitureBuilder(group);
  b.cylinder(0.22, 0.28, 0.15, mats.iron, 0, 0.08, 0, { segments: 8 });
  b.cylinder(0.05, 0.07, 0.65, mats.goldAntique, 0, 0.45, 0, { segments: 8 });
  b.box(0.32, 0.35, 0.22, mats.goldAntique, 0, 0.86, 0, { round: 0.03 });
  b.box(0.24, 0.22, 0.04, mats.stainedGlass, 0, 0.86, 0.12, { round: 0.01 });
  b.cone(0.22, 0.3, mats.goldAntique, 0, 1.17, 0, { segments: 8 });
  b.finish("reliquary");
  return group;
}

/* ═══════════════════════════ KITCHEN ═══════════════════════════ */

function buildKitchen(layers, mats, audit, state) {
  const parent = layers.furniture0;
  const decor = layers.decor0;
  const y = 0.3;

  const hearth = makeKitchenHearth(parent, mats, -14.15, y, -1.1, Math.PI / 2);
  reg(audit, "kitchen", "kitchen-hearth", "石砌大灶与面包炉", hearth, { wallMounted: true, ignoreBoundary: true });

  const prep = makePrepTable(parent, mats, -11.9, y, 0.4, 0, { w: 2.3, d: 1.0, h: 0.85 });
  reg(audit, "kitchen", "kitchen-prep", "中央备餐台", prep);

  const work = makeTable(parent, mats, -12.35, y, 2.55, 0, {
    name: "kitchen-work-table",
    w: 1.55,
    d: 0.72,
    h: 0.82,
    trestle: true
  });
  reg(audit, "kitchen", "kitchen-work-table", "南墙工作桌", work);

  const stools = [[-12.4, -0.72, 0], [-11.3, -0.72, 0]];
  stools.forEach(([x, z, rot], i) => {
    const stool = makeStool(parent, mats, x, y, z, rot);
    reg(audit, "kitchen", "kitchen-stool-" + i, "三腿木凳", stool);
  });

  const barrelA = makeBarrel(parent, mats, -10.15, y, 2.3, 1);
  reg(audit, "kitchen", "kitchen-barrel-a", "橡木酒桶", barrelA);
  const barrelB = makeBarrel(parent, mats, -10.15, y, 1.4, 0.82);
  reg(audit, "kitchen", "kitchen-barrel-b", "橡木酒桶", barrelB);

  const hutch = makeHutch(parent, mats, -11.8, y, -3.12, 0, { w: 2.3, h: 1.95, d: 0.42 });
  reg(audit, "kitchen", "kitchen-hutch", "锡器餐具柜", hutch, { wallMounted: true });

  const sack = makeSack(parent, mats, -9.95, y, -2.7, 0.9);
  reg(audit, "kitchen", "kitchen-sack", "谷物布袋", sack);

  makeRug(decor, mats, mats.rugLibrary, -12.0, y + 0.012, 1.35, 2.2, 1.5);
  makeTapestry(decor, mats, mats.tapestryIndigo, -10.2, 2.5, -3.46, 0, 1.4, 1.6);

  decorProps(decor, (b) => {
    // hanging herb bundles and copper pans above the prep table
    for (let i = 0; i < 7; i++) {
      const x = -12.85 + i * 0.27;
      b.cylinder(0.009, 0.011, 0.45, mats.iron, x, 3.2, -1.3 + (i % 2) * 0.3, { segments: 3 });
      b.cone(0.07 + (i % 2) * 0.025, 0.3, i % 3 === 0 ? mats.flowerYellow : mats.leafOlive, x, 2.94, -1.3 + (i % 2) * 0.3, {
        segments: 5,
        rx: 0.1
      });
    }
    for (let i = 0; i < 3; i++) {
      b.cylinder(0.12, 0.12, 0.04, mats.copperPatina, -13.1 + i * 0.3, 2.8, -1.9, { rotX: 1.4, segments: 12 });
    }
    // produce, bread and a bowl on the prep table
    b.sphere(0.12, mats.foodBread, -12.4, 1.19, 0.28, { width: 7, height: 5, sx: 1.5, sy: 0.55, sz: 0.9 });
    for (let i = 0; i < 4; i++) {
      b.sphere(0.065, i % 2 ? mats.foodGreen : mats.foodFruit, -11.5 + i * 0.14, 1.17, 0.28 + (i % 2) * 0.15, { width: 6, height: 4 });
    }
    b.cylinder(0.18, 0.12, 0.1, mats.terracotta, -11.7, 1.16, 0.66, { segments: 12 });
    for (const z of [2.4, 2.7]) {
      b.sphere(0.11, mats.foodGreen, -12.55, 1.16, z, { width: 7, height: 5, sy: 0.7 });
    }
    // jugs on hutch
    for (let i = 0; i < 3; i++) {
      b.cylinder(0.08, 0.065, 0.3, mats.terracotta, -12.5 + i * 0.32, 2.08, -2.88, { segments: 10 });
    }
    // little basket of onions by the barrels
    b.cylinder(0.24, 0.19, 0.16, mats.leafOlive, -10.1, 0.42, 0.55, { segments: 12 });
    for (let i = 0; i < 4; i++) {
      b.sphere(0.06, mats.paper, -10.2 + i * 0.08, 0.53, 0.55 + (i % 2) * 0.06, { width: 6, height: 4, sy: 0.8 });
    }
    // firewood
    for (let i = 0; i < 5; i++) {
      b.cylinder(0.07, 0.08, 0.7, mats.woodDark, -13.55 + (i % 3) * 0.1, 0.38 + Math.floor(i / 3) * 0.13, 1.2 + (i % 2) * 0.16, {
        rx: Math.PI / 2,
        ry: 0.2,
        segments: 6
      });
    }
    // cupboards and cutlery details
    for (let i = 0; i < 4; i++) {
      b.cylinder(0.012, 0.012, 0.35, mats.iron, -13.7, 1.8 - i * 0.25, 0.0, { rz: 0.2, segments: 3 });
    }
    addCandle(b, mats, -10.9, 1.3, 2.55, 0.18);
  });

  makeWallSconce(decor, mats, -9.7, 2.2, 0.2, -Math.PI / 2);
  return { items: 9 };
}

/* ═══════════════════════════ NORTH BALCONY ═══════════════════════════ */

function buildNorthBalconyDetails(layers, mats, decor) {
  // additional textile and observing props around the pieces in buildLibrary
  decorProps(decor, (b) => {
    b.box(0.55, 0.035, 0.38, mats.parchment, 1.35, 11.25, -8.0, { ry: 0.2, round: 0.01 });
    b.box(0.22, 0.025, 0.16, mats.ink || mats.charcoal, 1.6, 11.28, -7.95, { ry: 0.2 });
    b.cylinder(0.04, 0.05, 0.18, mats.goldAntique, -1.65, 10.66, -7.85, { segments: 7 });
    b.sphere(0.065, mats.flame, -1.65, 10.79, -7.85, { width: 5, height: 4, sy: 1.7 });
    b.box(0.8, 0.04, 0.55, mats.wool || mats.linen, -2.8, 10.95, -8.35, { ry: 0.3, round: 0.0 });
    b.cylinder(0.025, 0.03, 0.25, mats.iron, 3.4, 10.58, -8.7, { segments: 5 });
    b.sphere(0.075, mats.flame, 3.4, 10.8, -8.7, { width: 5, height: 4, sy: 1.6 });
  });
}

/* ═══════════════════════════ ASSEMBLY ═══════════════════════════ */

export function buildFurnishings({ layers, mats, audit, state }) {
  useLighting(state);
  buildGreatHall(layers, mats, audit, state);
  buildSolar(layers, mats, audit, state);
  buildLibrary(layers, mats, audit, state);
  buildChapel(layers, mats, audit, state);
  buildKitchen(layers, mats, audit, state);
  buildNorthBalconyDetails(layers, mats, layers.decor2);

  return {
    lightSpots: state.lightSpots,
    itemCount: audit ? audit.items.length : 0
  };
}

