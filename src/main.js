import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import { createTextureLibrary, applyTextureQuality } from "./textures.js";
import { createMaterialLibrary } from "./materials.js";
import { createLandscape, createPresentationSurface } from "./environment.js";
import { buildArchitecture } from "./architecture.js";
import { buildGardens } from "./gardens.js";
import { buildFurnishings } from "./furniture-scenes.js";
import { LayoutAudit } from "./audit.js";
import { Atmosphere, timeBand, formatHour } from "./lighting.js";
import { bakeStaticGroup } from "./bake.js";
import { ROOMS, ROOM_BY_ID, FLOOR_LABELS, GARDEN_ROOMS } from "./data.js";

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad2 = (n) => String(n).padStart(2, "0");
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

if (window.matchMedia("(max-width: 900px)").matches) {
  document.body.dataset.panel = "closed";
}

const dom = {
  canvas: $("world"),
  labels: $("roomLabels"),
  timeSlider: $("timeSlider"),
  timeClock: $("timeClock"),
  timePeriod: $("timePeriod"),
  solarPhase: $("solarPhase"),
  sunAltitude: $("sunAltitude"),
  timeSun: $("timeSun"),
  cycleButton: $("cycleButton"),
  floorNote: $("floorNote"),
  layerCount: $("layerCount"),
  exportButton: $("exportButton"),
  auditButton: $("auditButton"),
  auditStatus: $("auditStatus"),
  auditDetail: $("auditDetail"),
  auditSummary: $("auditSummary"),
  auditList: $("auditList"),
  auditDialog: $("auditDialog"),
  atlasDialog: $("atlasDialog"),
  atlasGrid: $("atlasGrid"),
  roomCard: $("roomCard"),
  roomNo: $("roomNo"),
  roomName: $("roomName"),
  roomLatin: $("roomLatin"),
  roomDescription: $("roomDescription"),
  roomFloor: $("roomFloor"),
  roomLevel: $("roomLevel"),
  roomCount: $("roomCount"),
  roomLight: $("roomLight"),
  roomFeatures: $("roomFeatures"),
  focusRoom: $("focusRoom"),
  restoreView: $("restoreView"),
  roomCardClose: $("roomCardClose"),
  loader: $("loader"),
  loaderProgress: $("loaderProgress"),
  loaderPercent: $("loaderPercent"),
  toastStack: $("toastStack"),
  rotateButton: $("rotateButton"),
  resetButton: $("resetButton"),
  mouseLabel: document.querySelector(".loader__cn"),
  floorButtons: Array.from(document.querySelectorAll(".floor-button")),
  layerInputs: Array.from(document.querySelectorAll("input[data-layer]"))
};

const app = {
  ready: false,
  time: 14.33,
  autoTime: false,
  cycleSpeed: 0.62,
  floorMode: "all",
  explode: false,
  explodeAmount: 0,
  autoRotate: false,
  selectedRoom: null,
  layers: { structure: true, roofs: true, furniture: true, gardens: true, terrain: true, labels: true },
  cameraTween: null,
  labelEntries: [],
  pointLights: [],
  nightness: 0,
  lastLabelUpdate: 0,
  introPlayed: false
};

let renderer;
let scene;
let camera;
let controls;
let atmosphere;
let world;
let layers;
let environment;
let gardens;
let audit;
let auditReport;
let visualState;
let highlightGroup;
let highlightMaterial;
let smokeSystem;
let fireflies;
let flameMeshes = [];
let flagEntries = [];
let elapsed = 0;
let lastTime = 0;
let loadStartedAt = 0;
let shadowDirty = true;
let lastShadowUpdate = 0;

function requestShadowRefresh() {
  shadowDirty = true;
}

const FLOOR_TO_NUMBER = { ground: 0, solar: 1, library: 2 };
const EXPLODE_TARGETS = [
  { group: "keep1", amount: 2.55 },
  { group: "keep2", amount: 5.1 },
  { group: "keepRoof", amount: 7.65 },
  { group: "furniture1", amount: 2.55 },
  { group: "furniture2", amount: 5.1 },
  { group: "decor1", amount: 2.55 },
  { group: "decor2", amount: 5.1 }
];

const FLOOR_VIEWS = {
  ground: { position: [27, 31, 35], target: [0, 2.4, 0] },
  solar: { position: [27, 37, 35], target: [0, 7.5, 0] },
  library: { position: [27, 42, 35], target: [0, 11.8, 0] },
  roof: { position: [46, 48, 58], target: [0, 10.5, 0] }
};

function setProgress(value, label) {
  const v = clamp(value, 0, 100);
  if (dom.loaderProgress) dom.loaderProgress.style.width = v + "%";
  if (dom.loaderPercent) dom.loaderPercent.textContent = pad2(Math.round(v));
  if (label && dom.mouseLabel) dom.mouseLabel.textContent = label;
}

function toast(message, options = {}) {
  if (!dom.toastStack) return;
  const el = document.createElement("div");
  el.className = "toast" + (options.warn ? " toast--warn" : "");
  el.textContent = message;
  dom.toastStack.appendChild(el);
  const life = options.duration || 3600;
  setTimeout(() => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 350);
  }, life);
}

function getHeroPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  let p = new THREE.Vector3(112, 98, 53);
  const target = new THREE.Vector3(0, 2.8, 0);
  let factor = 1;
  if (aspect < 1.0) factor = 1.28;
  else if (aspect < 1.35) factor = 1.1;
  p = target.clone().add(p.clone().sub(target).multiplyScalar(factor));
  return { position: p, target };
}

function getFloorView(mode) {
  if (mode === "all") return getHeroPosition();
  const config = FLOOR_VIEWS[mode];
  if (!config) return getHeroPosition();
  const target = new THREE.Vector3(config.target[0], config.target[1], config.target[2]);
  let position = new THREE.Vector3(config.position[0], config.position[1], config.position[2]);
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect < 1.0) {
    position = target.clone().add(position.clone().sub(target).multiplyScalar(1.35));
  } else if (aspect < 1.3) {
    position = target.clone().add(position.clone().sub(target).multiplyScalar(1.12));
  }
  return { position, target };
}

function isVisibleThroughParents(object) {
  let node = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

function animateCamera(position, target, duration = 1400) {
  if (!camera || !controls) return;
  if (app.cameraTween) {
    app.cameraTween = null;
  }
  controls.autoRotate = false;
  app.autoRotate = false;
  updateRotateButton();
  app.cameraTween = {
    startPos: camera.position.clone(),
    endPos: position.clone(),
    startTarget: controls.target.clone(),
    endTarget: target.clone(),
    start: performance.now(),
    duration
  };
  controls.enabled = false;
}

function updateCameraTween(now) {
  if (!app.cameraTween) return;
  const tw = app.cameraTween;
  const t = clamp((now - tw.start) / tw.duration, 0, 1);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(tw.startPos, tw.endPos, e);
  controls.target.lerpVectors(tw.startTarget, tw.endTarget, e);
  camera.lookAt(controls.target);
  if (t >= 1) {
    app.cameraTween = null;
    controls.enabled = true;
    controls.update();
  }
}

function updateRotateButton() {
  if (!dom.rotateButton) return;
  dom.rotateButton.setAttribute("aria-pressed", app.autoRotate ? "true" : "false");
  if (controls) controls.autoRotate = app.autoRotate;
}

function setAutoRotate(enabled) {
  app.autoRotate = enabled;
  if (controls) controls.autoRotate = enabled;
  updateRotateButton();
  if (enabled) toast("自动巡游已开启 · 拖拽可接管镜头");
}

function setHour(hour, options = {}) {
  if (!atmosphere) return;
  const h = ((hour % 24) + 24) % 24;
  app.time = h;
  if (dom.timeSlider && options.updateSlider !== false) dom.timeSlider.value = String(h);
  const state = atmosphere.update(h);
  const band = state.band;
  app.nightness = state.nightness;
  if (dom.timeClock) dom.timeClock.textContent = formatHour(h);
  if (dom.timePeriod) dom.timePeriod.textContent = band.zh;
  if (dom.solarPhase) dom.solarPhase.textContent = band.en;
  if (dom.sunAltitude) dom.sunAltitude.textContent = "SUN " + state.sunAltitude + "°";
  if (dom.timeSun) dom.timeSun.style.left = (h / 24) * 100 + "%";
  document.body.dataset.phase = state.phaseTheme;
  updatePointLightVisibility(state.nightness);
  requestShadowRefresh();
  if (options.silent !== true) {
    // updating the shape of the scene is immediate; CSS handles the thematic shift
  }
}

function updatePointLightVisibility(nightness) {
  for (const entry of app.pointLights) {
    entry.light.visible = nightness > 0.08;
  }
}

function toggleAutoTime() {
  app.autoTime = !app.autoTime;
  if (dom.cycleButton) {
    dom.cycleButton.classList.toggle("is-playing", app.autoTime);
    dom.cycleButton.setAttribute("aria-pressed", app.autoTime ? "true" : "false");
  }
  if (app.autoTime) toast("太阳开始移动 · 黄昏前还有一段路");
}

function floorNoteText() {
  if (app.explode && app.floorMode === "all") return "分层展开 · 每个楼层沿垂直轴缓缓升起";
  return FLOOR_LABELS[app.floorMode] || FLOOR_LABELS.all;
}

function applyVisibility() {
  if (!layers) return;
  const L = app.layers;
  const mode = app.floorMode;
  layers.terrain.visible = L.terrain;
  layers.gardens.visible = L.gardens;
  layers.structure.visible = L.structure;
  layers.roofs.visible = L.roofs && (mode === "all" || mode === "roof");
  layers.furniture.visible = L.furniture && mode !== "roof";
  layers.decor.visible = L.furniture && mode !== "roof";

  layers.keep0.visible = mode !== "roof" || true;
  layers.keep0.visible = true;
  layers.keep1.visible = mode !== "ground";
  layers.keep2.visible = mode === "all" || mode === "library" || mode === "roof";
  layers.general.visible = true;

  layers.furniture0.visible = mode === "all" || mode === "ground";
  layers.furniture1.visible = mode === "all" || mode === "solar";
  layers.furniture2.visible = mode === "all" || mode === "library";
  layers.decor0.visible = mode === "all" || mode === "ground";
  layers.decor1.visible = mode === "all" || mode === "solar";
  layers.decor2.visible = mode === "all" || mode === "library";

  // In a section view, floor slabs and dressings at the level below only add noise.
  if (mode === "solar" || mode === "library") {
    layers.keep0.visible = true;
  }
  if (mode === "ground") {
    layers.keep1.visible = false;
    layers.keep2.visible = false;
  }

  if (dom.floorNote) dom.floorNote.textContent = floorNoteText();
  updateFloorButtons();
  updateLayerCount();
  updateLabels();
  requestShadowRefresh();
}

function updateLayerCount() {
  const count = Object.values(app.layers).filter(Boolean).length;
  if (dom.layerCount) dom.layerCount.textContent = pad2(count);
}

function updateFloorButtons() {
  dom.floorButtons.forEach((button) => {
    const active = button.dataset.floor === app.floorMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function maybeClearSelectionForMode(mode) {
  if (!app.selectedRoom) return;
  const room = app.selectedRoom;
  if (mode === "all") return;
  if (mode === "roof") {
    clearSelectedRoom(false);
    return;
  }
  if (GARDEN_ROOMS.has(room.id)) {
    if (room.id === "southBalcony" && mode === "solar") return;
    if (room.id === "northBalcony" && mode === "library") return;
    if (room.id === "frontGarden" || room.id === "rearGarden") return;
    clearSelectedRoom(false);
    return;
  }
  if (Number(room.floor) !== Number(FLOOR_TO_NUMBER[mode])) clearSelectedRoom(false);
}

function setFloorMode(mode, options = {}) {
  if (!["all", "ground", "solar", "library", "roof"].includes(mode)) return;
  const changed = app.floorMode !== mode;
  app.floorMode = mode;
  if (mode !== "all" && app.explode) {
    setExplode(false, false);
  }
  if (options.clearSelection !== false) maybeClearSelectionForMode(mode);
  applyVisibility();
  if (options.animateCamera) {
    const view = getFloorView(mode);
    animateCamera(view.position, view.target, 1500);
  }
  if (changed && options.toast !== false) {
    if (mode === "all") toast("已回到完整剖面 · 屋顶重新合拢");
    else toast("剖面已打开 · 上层空间暂时隐去");
  }
}

function setLayer(name, value, options = {}) {
  if (!(name in app.layers)) return;
  app.layers[name] = !!value;
  const input = dom.layerInputs.find((i) => i.dataset.layer === name);
  if (input) input.checked = !!value;
  applyVisibility();
  if (name === "labels") updateLabels();
  if (!options.silent) {
    // no toast for every toggle; the visual responds directly
  }
}

function setExplode(on, moveCamera = true) {
  if (on && app.floorMode !== "all") {
    app.floorMode = "all";
    maybeClearSelectionForMode("all");
    applyVisibility();
  }
  if (on === app.explode) return;
  const previousCamera = {
    position: camera.position.clone(),
    target: controls.target.clone()
  };
  app.explode = on;
  const btn = $("explodeToggle");
  if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  updateFloorButtons();
  if (dom.floorNote) dom.floorNote.textContent = floorNoteText();
  if (on) {
    app.explodeReturnCamera = previousCamera;
    const target = new THREE.Vector3(0, 9.4, 0);
    let pos = new THREE.Vector3(82, 72, 97);
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1) pos = target.clone().add(pos.clone().sub(target).multiplyScalar(1.3));
    else if (aspect < 1.3) pos = target.clone().add(pos.clone().sub(target).multiplyScalar(1.12));
    animateCamera(pos, target, 1550);
    toast("分层展开 · 拖动查看每一层的内部");
  } else {
    if (moveCamera && app.explodeReturnCamera) {
      animateCamera(app.explodeReturnCamera.position, app.explodeReturnCamera.target, 1300);
    }
    toast("楼层已经落回石墙上");
  }
}

function updateExplode(dt) {
  const before = app.explodeAmount;
  const target = app.explode ? 1 : 0;
  app.explodeAmount += (target - app.explodeAmount) * Math.min(1, dt * 4.5);
  if (Math.abs(target - app.explodeAmount) < 0.001) app.explodeAmount = target;
  for (const entry of EXPLODE_TARGETS) {
    const group = layers[entry.group];
    if (!group) continue;
    group.position.y = app.explodeAmount * entry.amount;
  }
  for (const entry of app.pointLights) {
    const floor = entry.light.userData.floor || 0;
    const offset = floor === 1 ? 2.55 : floor === 2 ? 5.1 : 0;
    entry.light.position.y = (entry.spot.position?.y || entry.light.position.y) + app.explodeAmount * offset;
  }
  if (Math.abs(before - app.explodeAmount) > 0.0004) requestShadowRefresh();
}

function formatFloorForRoom(room) {
  if (room.id === "frontGarden" || room.id === "rearGarden") return "GROUNDS";
  if (room.id === "southBalcony") return "SOLAR LEVEL";
  if (room.id === "northBalcony") return "LIBRARY LEVEL";
  if (room.floor === 0) return "GROUND LEVEL";
  if (room.floor === 1) return "SOLAR LEVEL";
  return "LIBRARY LEVEL";
}

function floorNameCn(room) {
  if (room.id === "frontGarden" || room.id === "rearGarden") return "地面";
  if (room.id === "southBalcony") return "二层露台";
  if (room.id === "northBalcony") return "三层露台";
  return room.floor === 0 ? "一层" : room.floor === 1 ? "二层" : "三层";
}

function roomItemCount(room) {
  if (!audit) return 0;
  const items = audit.byRoom.get(room.id);
  return items ? items.length : 0;
}

function getRoomAnchorGroup(room) {
  if (room.id === "greatHall") return layers.keep0;
  if (room.id === "solar") return layers.keep1;
  if (room.id === "library") return layers.keep2;
  if (room.id === "southBalcony") return layers.keep1;
  if (room.id === "northBalcony") return layers.keep2;
  if (room.id === "frontGarden" || room.id === "rearGarden") return layers.gardens;
  return layers.general;
}

function buildRoomLabels() {
  if (!dom.labels) return;
  for (const room of ROOMS) {
    const parent = getRoomAnchorGroup(room);
    const anchor = new THREE.Object3D();
    anchor.name = "label-anchor-" + room.id;
    anchor.position.set(room.anchor[0], room.anchor[1], room.anchor[2]);
    parent.add(anchor);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-label" + (room.labelPriority < 6 ? " room-label--minor" : "");
    button.setAttribute("data-room", room.id);
    const pin = document.createElement("span");
    pin.className = "room-label__pin";
    pin.setAttribute("aria-hidden", "true");
    const line = document.createElement("span");
    line.className = "room-label__line";
    const text = document.createElement("span");
    text.className = "room-label__text";
    const b = document.createElement("b");
    b.textContent = room.name;
    const small = document.createElement("small");
    small.textContent = room.latin;
    text.append(b, small);
    button.append(pin, line, text);
    button.addEventListener("click", () => {
      openRoom(room);
    });
    dom.labels.appendChild(button);
    app.labelEntries.push({ room, anchor, button });
  }
}

function labelAllowedByFloor(room) {
  const selected = app.selectedRoom;
  const isGarden = room.id === "frontGarden" || room.id === "rearGarden";
  const isBalcony = room.id === "southBalcony" || room.id === "northBalcony";
  // Focusing a room leaves exactly one annotation in the scene, so the room
  // itself, its card and its furniture can breathe.
  if (selected) return room.id === selected.id;
  // In the whole-castle view, only the principal rooms and the mirrored
  // gardens carry a floating tag; side rooms are named by their floor
  // cutaway and by the room atlas.
  if (app.floorMode === "all") return !isBalcony && room.labelPriority >= 6;
  // The cutaway views only name the rooms on the visible interior level.
  if (app.floorMode === "roof") return false;
  const level = FLOOR_TO_NUMBER[app.floorMode];
  return room.interior && room.floor === level && !isGarden && !isBalcony;
}

function updateLabels(force = false) {
  if (!app.ready || !camera) return;
  const now = performance.now();
  if (!force && now - app.lastLabelUpdate < 30) return;
  app.lastLabelUpdate = now;
  if (!app.layers.labels) {
    app.labelEntries.forEach((entry) => entry.button.classList.remove("is-visible"));
    return;
  }
  camera.updateMatrixWorld();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const candidates = [];
  for (const entry of app.labelEntries) {
    const room = entry.room;
    const visible = labelAllowedByFloor(room) && isVisibleThroughParents(entry.anchor);
    if (!visible) {
      entry.button.classList.remove("is-visible");
      entry.button.classList.add("is-suppressed");
      continue;
    }
    const pos = new THREE.Vector3();
    entry.anchor.getWorldPosition(pos);
    const screen = screenPosition(pos, camera, width, height);
    if (!screen.visible || screen.x < 12 || screen.x > width - 90 || screen.y < 78 || screen.y > height - 84) {
      entry.button.classList.remove("is-visible");
      entry.button.classList.add("is-suppressed");
      continue;
    }
    entry.button.classList.remove("is-suppressed");
    entry.button.style.left = screen.x + "px";
    entry.button.style.top = screen.y + "px";
    candidates.push({
      entry,
      x: screen.x,
      y: screen.y,
      priority: entry.room.id === app.selectedRoom?.id ? 100 : entry.room.labelPriority
    });
  }
  candidates.sort((a, b) => b.priority - a.priority);
  const accepted = [];
  for (const c of candidates) {
    const entry = c.entry;
    const targetX = clamp(c.x, 14, width - 120);
    const targetY = clamp(c.y, 85, height - 90);
    entry.button.style.left = targetX + "px";
    entry.button.style.top = targetY + "px";
    const collides = accepted.some((a) => Math.abs(a.x - targetX) < 112 && Math.abs(a.y - targetY) < 40);
    if (collides && entry.room.id !== app.selectedRoom?.id) {
      entry.button.classList.remove("is-visible");
      continue;
    }
    accepted.push({ x: targetX, y: targetY, entry });
    entry.button.classList.add("is-visible");
  }
}

function screenPosition(vector, cameraRef, width, height) {
  const p = vector.clone().project(cameraRef);
  return {
    x: (p.x * 0.5 + 0.5) * width,
    y: (-p.y * 0.5 + 0.5) * height,
    visible: p.z > -1 && p.z < 1
  };
}

function updateSelectedLabel() {
  for (const entry of app.labelEntries) {
    entry.button.classList.toggle("is-active", app.selectedRoom?.id === entry.room.id);
  }
}

function openRoom(room, options = {}) {
  if (!room) return;
  app.selectedRoom = room;
  updateSelectedLabel();
  ensureRoomVisible(room);
  fillRoomCard(room);
  dom.roomCard.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-room-card");
  setFloorMode(room.floorMode || "all", { animateCamera: false, clearSelection: false, toast: false });
  updateHighlight(room);
  if (options.focus !== false) {
    const config = room.camera;
    let pos = new THREE.Vector3(config.position[0], config.position[1], config.position[2]);
    const target = new THREE.Vector3(config.target[0], config.target[1], config.target[2]);
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1.15) pos = target.clone().add(pos.clone().sub(target).multiplyScalar(1.25));
    animateCamera(pos, target, 1700);
  }
  updateLabels(true);
}

function ensureRoomVisible(room) {
  let changed = false;
  const ensureLayer = (name, val) => {
    if (!app.layers[name] && val) {
      app.layers[name] = true;
      const input = dom.layerInputs.find((i) => i.dataset.layer === name);
      if (input) input.checked = true;
      changed = true;
    }
  };
  ensureLayer("structure", true);
  ensureLayer("labels", true);
  if (room.interior) {
    ensureLayer("furniture", true);
  } else {
    ensureLayer("gardens", true);
    ensureLayer("terrain", true);
    if (room.id === "southBalcony" || room.id === "northBalcony") {
      ensureLayer("furniture", true);
    }
  }
  if (changed) applyVisibility();
}

function fillRoomCard(room) {
  const count = roomItemCount(room);
  dom.roomNo.textContent = "ROOM " + room.numeral;
  dom.roomName.textContent = room.name;
  dom.roomLatin.textContent = room.latin;
  dom.roomDescription.textContent = room.description;
  dom.roomFloor.textContent = formatFloorForRoom(room);
  dom.roomLevel.textContent = floorNameCn(room);
  dom.roomCount.textContent = count > 0 ? count + " 件" : (room.id.includes("Garden") ? "镜像造景" : "—");
  dom.roomLight.textContent = room.light;
  dom.roomFeatures.innerHTML = "";
  room.features.forEach((feature) => {
    const li = document.createElement("li");
    li.textContent = feature;
    dom.roomFeatures.appendChild(li);
  });
}

function clearSelectedRoom(hideCard = true) {
  app.selectedRoom = null;
  updateSelectedLabel();
  if (hideCard) {
    dom.roomCard.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-room-card");
  }
  if (highlightGroup) highlightGroup.visible = false;
  updateLabels(true);
}

function updateHighlight(room) {
  if (!highlightGroup) return;
  const center = new THREE.Vector3(
    (room.bounds.minX + room.bounds.maxX) / 2,
    (room.bounds.y || 0) + 0.04,
    (room.bounds.minZ + room.bounds.maxZ) / 2
  );
  const isGarden = room.id === "frontGarden" || room.id === "rearGarden";
  const size = isGarden ? 2.8 : 1.2;
  highlightGroup.scale.setScalar(size);
  highlightGroup.position.copy(center);
  highlightGroup.visible = true;
}

function restoreOverview(options = {}) {
  clearSelectedRoom();
  setFloorMode("all", { animateCamera: false, clearSelection: false, toast: false });
  setExplode(false, false);
  const hero = getHeroPosition();
  animateCamera(hero.position, hero.target, 1600);
  if (options.toast !== false) toast("回到全览 · 两座镜像花园重新对齐");
}

function buildAtlas() {
  if (!dom.atlasGrid) return;
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M6 3h7v7"/></svg>';
  ROOMS.forEach((room) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "atlas-room";
    const top = document.createElement("span");
    top.className = "atlas-room__top";
    const num = document.createElement("span");
    num.textContent = "ROOM " + room.numeral;
    const floor = document.createElement("span");
    floor.textContent = formatFloorForRoom(room);
    top.append(num, floor);
    const cn = document.createElement("span");
    cn.className = "atlas-room__cn";
    cn.textContent = room.name;
    const en = document.createElement("span");
    en.className = "atlas-room__en";
    en.textContent = room.latin;
    const note = document.createElement("span");
    note.className = "atlas-room__note";
    note.textContent = room.atlasNote;
    button.append(top, cn, en, note);
    button.insertAdjacentHTML("beforeend", arrow);
    button.addEventListener("click", () => {
      dom.atlasDialog.close();
      openRoom(room);
    });
    dom.atlasGrid.appendChild(button);
  });
}

function buildAuditUI() {
  auditReport = audit.validate();
  const issueCount = auditReport.issues.length;
  const solidCount = auditReport.itemCount;
  if (dom.auditStatus) dom.auditStatus.textContent = auditReport.pass ? "工艺审校通过" : "发现 " + issueCount + " 处待调整";
  if (dom.auditDetail) {
    dom.auditDetail.textContent = auditReport.pass
      ? solidCount + " 件陈设 · 无碰撞 / 无越界"
      : issueCount + " 处重叠或越界 · 点击查看";
  }
  if (dom.auditButton) dom.auditButton.classList.toggle("is-warning", !auditReport.pass);

  if (!dom.auditSummary || !dom.auditList) return;
  dom.auditSummary.innerHTML = "";
  const summaryParts = [
    ["登记陈设", solidCount + " 件"],
    ["审校区域", auditReport.roomCount + " 个"],
    ["穿模冲突", issueCount + " 处"],
    ["边界违规", auditReport.issues.filter((i) => i.type === "boundary").length + " 处"]
  ];
  summaryParts.forEach(([label, value], index) => {
    const span = document.createElement("span");
    span.innerHTML = label + " <b>" + value + "</b>";
    if (index === 2) span.className = issueCount ? "is-warn" : "is-pass";
    dom.auditSummary.appendChild(span);
  });
  dom.auditList.innerHTML = "";
  auditReport.rooms.forEach((roomRow) => {
    const row = document.createElement("div");
    row.className = "audit-room-row" + (roomRow.issues.length ? " is-warning" : "");
    const name = document.createElement("b");
    name.textContent = roomRow.name;
    const count = document.createElement("span");
    count.textContent = roomRow.count + " 件";
    const verdict = document.createElement("span");
    verdict.textContent = roomRow.issues.length ? roomRow.issues.length + " 处冲突" : "清";
    row.append(name, count, verdict);
    dom.auditList.appendChild(row);
    if (roomRow.issues.length) {
      roomRow.issues.slice(0, 4).forEach((issue) => {
        const detail = document.createElement("div");
        detail.className = "audit-room-row is-warning";
        detail.style.paddingLeft = "16px";
        detail.style.fontSize = "6.8px";
        detail.textContent = "↳ " + issue.a + " × " + issue.b + " · " + issue.detail;
        dom.auditList.appendChild(detail);
      });
    }
  });
  console.info("[Castellum Aureliae] furniture audit", auditReport);
  console.info("[Castellum Aureliae] audit text\n" + audit.reportText().text);
}

/* ─────────────────────── Point lights, smoke, fireflies ─────────────────────── */

function createPointLights() {
  if (!visualState) return;
  const spots = visualState.lightSpots.filter((spot) => spot.type !== "torch");
  // Two additional pool-of-light sources for the gate passages.
  spots.push({ position: new THREE.Vector3(0, 3.6, 24.1), color: 0xffa45b, intensity: 1.05, distance: 9, type: "gate", room: null, floor: 0 });
  spots.push({ position: new THREE.Vector3(0, 3.6, -24.1), color: 0xffa45b, intensity: 1.05, distance: 9, type: "gate", room: null, floor: 0 });
  let count = 0;
  for (const spot of spots) {
    if (count >= 12) break;
    const light = new THREE.PointLight(spot.color, 0, spot.distance || 7, 2);
    light.position.copy(spot.position);
    light.castShadow = false;
    light.visible = false;
    light.name = "room-light-" + count;
    light.userData.baseIntensity = spot.intensity || 0.8;
    light.userData.type = spot.type;
    light.userData.room = spot.room;
    light.userData.floor = spot.floor || 0;
    light.userData.phase = Math.random() * Math.PI * 2;
    scene.add(light);
    app.pointLights.push({ light, spot });
    count += 1;
  }
}

function createSmoke() {
  if (!visualState || !visualState.smokeSpots || !visualState.smokeSpots.length) return;
  const spots = visualState.smokeSpots;
  const perSpot = 22;
  const count = spots.length * perSpot;
  const positions = new Float32Array(count * 3);
  const particles = [];
  const r = (() => {
    let s = 813;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();
  for (let s = 0; s < spots.length; s++) {
    for (let i = 0; i < perSpot; i++) {
      const index = s * perSpot + i;
      particles.push({
        spot: spots[s],
        phase: r(),
        speed: 0.08 + r() * 0.09,
        drift: (r() - 0.5) * 0.18,
        driftZ: (r() - 0.5) * 0.18,
        radius: 0.15 + r() * 0.45
      });
      positions[index * 3] = spots[s].x;
      positions[index * 3 + 1] = spots[s].y;
      positions[index * 3 + 2] = spots[s].z;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xa7a092,
    size: 1.65,
    map: visualState.textures ? visualState.textures.smoke : null,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.name = "chimney-smoke";
  scene.add(points);
  smokeSystem = { points, particles, positions, geometry };
}

function createFireflies(textures) {
  const count = 70;
  const positions = new Float32Array(count * 3);
  const base = [];
  const r = (() => {
    let s = 515;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  })();
  for (let i = 0; i < count; i++) {
    const front = i < count / 2;
    const x = (r() - 0.5) * 36;
    const z = (front ? 1 : -1) * (8.8 + r() * 9.2);
    const y = 0.3 + r() * 2.4;
    base.push({ x, y, z, phase: r() * Math.PI * 2, speed: 0.4 + r() * 0.8 });
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf4d58e,
    size: 0.22,
    map: textures.glow,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  points.name = "summer-fireflies";
  scene.add(points);
  fireflies = { points, base, positions, geometry: geo, material: mat };
}

function collectFlames() {
  const r = (() => {
    let s = 121;
    return () => {
      s = (s * 22695477 + 1) >>> 0;
      return s / 4294967296;
    };
  })();
  flameMeshes = [];
  if (visualState?.flames?.length) {
    visualState.flames.forEach((entry) => {
      flameMeshes.push({
        mesh: entry.mesh,
        baseScale: entry.mesh.scale.clone(),
        phase: entry.phase,
        core: entry.core,
        halo: entry.halo
      });
    });
  }
  if (world) {
    world.traverse((object) => {
      if (object.name === "lantern-flame" || object.name === "torch-flame" || object.name === "torch-halo") {
        if (flameMeshes.some((f) => f.mesh === object)) return;
        flameMeshes.push({
          mesh: object,
          baseScale: object.scale.clone(),
          phase: r() * TAU,
          halo: object.name === "torch-halo" ? object : null
        });
      }
    });
  }
}

const TAU = Math.PI * 2;

function updateSmoke(elapsedSeconds) {
  if (!smokeSystem) return;
  const { particles, positions, geometry } = smokeSystem;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const life = ((elapsedSeconds * p.speed + p.phase) % 1);
    const height = 7.5 * life;
    const spread = 0.2 + life * 1.65;
    positions[i * 3] = p.spot.x + Math.sin(life * 9 + p.phase * 18) * spread * p.drift * 3.2;
    positions[i * 3 + 1] = p.spot.y + height;
    positions[i * 3 + 2] = p.spot.z + Math.cos(life * 7 + p.phase * 13) * spread * p.driftZ * 3.2;
  }
  geometry.attributes.position.needsUpdate = true;
  smokeSystem.points.material.opacity = 0.11 + 0.07 * (1 - app.nightness * 0.35);
}

function updateFireflies(elapsedSeconds) {
  if (!fireflies) return;
  const opacity = app.nightness > 0.45 ? (app.nightness - 0.45) * 1.1 : 0;
  fireflies.material.opacity = clamp(opacity, 0, 0.7);
  fireflies.points.visible = opacity > 0.01;
  if (!fireflies.points.visible) return;
  const positions = fireflies.positions;
  for (let i = 0; i < fireflies.base.length; i++) {
    const b = fireflies.base[i];
    positions[i * 3] = b.x + Math.sin(elapsedSeconds * b.speed + b.phase) * 0.5;
    positions[i * 3 + 1] = b.y + Math.sin(elapsedSeconds * b.speed * 0.7 + b.phase * 2) * 0.22;
    positions[i * 3 + 2] = b.z + Math.cos(elapsedSeconds * b.speed * 0.8 + b.phase) * 0.4;
  }
  fireflies.geometry.attributes.position.needsUpdate = true;
}

function updateFlags(time) {
  if (!visualState?.flags) return;
  for (const flag of visualState.flags) {
    const positions = flag.mesh.geometry.attributes.position;
    const base = flag.base;
    for (let i = 0; i < positions.count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const bz = base[i * 3 + 2];
      if (flag.kind === "pole") {
        const influence = Math.pow(clamp(bx / flag.size, 0, 1), 0.7);
        positions.setZ(i, bz + Math.sin(time * 2.2 + bx * 4.5 + flag.phase) * 0.16 * influence);
        positions.setY(i, by + Math.sin(time * 1.7 + bx * 3 + flag.phase) * 0.04 * influence);
      } else {
        const vertical = clamp(-by / (flag.height || 1), 0, 1);
        const sway = 0.035 + vertical * 0.11;
        positions.setZ(i, bz + Math.sin(time * 1.45 + by * 3 + flag.phase) * sway);
        positions.setX(i, bx + Math.sin(time * 0.8 + by * 2 + flag.phase) * 0.025 * vertical);
      }
    }
    positions.needsUpdate = true;
    flag.mesh.geometry.computeVertexNormals();
  }
}

function updateFlames(time) {
  for (const entry of flameMeshes) {
    if (!entry.mesh?.isMesh) continue;
    const flicker = 0.9 + Math.sin(time * 9 + entry.phase) * 0.06 + Math.sin(time * 17.7 + entry.phase * 2) * 0.035;
    entry.mesh.scale.set(
      entry.baseScale.x * (0.94 + flicker * 0.06),
      entry.baseScale.y * flicker,
      entry.baseScale.z * (0.94 + flicker * 0.06)
    );
    if (entry.halo && entry.halo.material) {
      entry.halo.material.opacity = 0.08 + Math.max(0, app.nightness - 0.25) * 0.18;
    }
  }
}

function updatePointLights(time, dt) {
  const darkness = clamp(app.nightness, 0, 1);
  for (const entry of app.pointLights) {
    const { light } = entry;
    if (!light.visible) continue;
    const flicker = light.userData.type === "fire" || light.userData.type === "forge" || light.userData.type === "chandelier"
      ? 0.88 + Math.sin(time * 8.3 + light.userData.phase) * 0.08 + Math.sin(time * 19.2 + light.userData.phase) * 0.04
      : 1;
    light.intensity = light.userData.baseIntensity * (0.22 + darkness * 1.3) * 4.6 * flicker;
  }
  void dt;
}

/* ─────────────────────────── Build sequence ─────────────────────────── */

async function buildScene() {
  loadStartedAt = performance.now();
  setProgress(3, "正在展开城堡的第一张图纸");
  await nextFrame();

  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x182027, 1);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 900);
  const hero = getHeroPosition();
  camera.position.set(132, 118, 82);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(hero.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.058;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.55;
  controls.minDistance = 24;
  controls.maxDistance = 150;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.autoRotateSpeed = 0.48;
  controls.screenSpacePanning = false;
  controls.update();
  controls.addEventListener("start", () => {
    if (app.autoRotate) {
      app.autoRotate = false;
      updateRotateButton();
    }
  });

  setProgress(10, "研磨石灰岩、橡木与铅玻璃");
  await nextFrame();
  const textures = createTextureLibrary();
  applyTextureQuality(textures, renderer.capabilities.getMaxAnisotropy());
  const mats = createMaterialLibrary(textures);
  visualState = {
    flags: [],
    flames: [],
    smokeSpots: [],
    lightSpots: [],
    textures
  };

  setProgress(24, "铺设台座与三重护城河");
  await nextFrame();
  world = new THREE.Group();
  world.name = "Castellum-Aureliae";
  scene.add(world);
  layers = {
    terrain: new THREE.Group(),
    gardens: new THREE.Group(),
    structure: new THREE.Group(),
    roofs: new THREE.Group(),
    furniture: new THREE.Group(),
    decor: new THREE.Group(),
    keep0: new THREE.Group(),
    keep1: new THREE.Group(),
    keep2: new THREE.Group(),
    general: new THREE.Group(),
    keepRoof: new THREE.Group(),
    fixedRoofs: new THREE.Group(),
    furniture0: new THREE.Group(),
    furniture1: new THREE.Group(),
    furniture2: new THREE.Group(),
    decor0: new THREE.Group(),
    decor1: new THREE.Group(),
    decor2: new THREE.Group()
  };
  layers.terrain.name = "terrain-layer";
  layers.gardens.name = "garden-layer";
  layers.structure.name = "structure-layer";
  layers.roofs.name = "roof-layer";
  layers.furniture.name = "furniture-layer";
  layers.decor.name = "decor-layer";
  layers.keep0.name = "keep-ground";
  layers.keep1.name = "keep-solar";
  layers.keep2.name = "keep-library";
  layers.general.name = "shell-general";
  layers.keepRoof.name = "roofs-keep";
  layers.fixedRoofs.name = "roofs-general";
  layers.furniture0.name = "furniture-ground";
  layers.furniture1.name = "furniture-solar";
  layers.furniture2.name = "furniture-library";
  layers.decor0.name = "decor-ground";
  layers.decor1.name = "decor-solar";
  layers.decor2.name = "decor-library";
  world.add(layers.terrain, layers.gardens, layers.structure, layers.roofs, layers.furniture, layers.decor);
  layers.structure.add(layers.keep0, layers.keep1, layers.keep2, layers.general);
  layers.roofs.add(layers.keepRoof, layers.fixedRoofs);
  layers.furniture.add(layers.furniture0, layers.furniture1, layers.furniture2);
  layers.decor.add(layers.decor0, layers.decor1, layers.decor2);

  environment = createLandscape(mats, textures);
  layers.terrain.add(environment.root);
  const surveyTable = createPresentationSurface();
  scene.add(surveyTable);

  setProgress(35, "立起主堡、角楼与六座门塔");
  await nextFrame();
  const architecture = buildArchitecture({ layers, mats });
  visualState.flags = architecture.flags;
  visualState.flames = architecture.flames;
  visualState.smokeSpots.push(...architecture.smokeSpots);
  visualState.lightSpots.push(...architecture.lightSpots);
  collectFlames();

  setProgress(54, "修整前庭与后庭的镜像花园");
  await nextFrame();
  gardens = buildGardens({ mats, textures, state: visualState, root: layers.gardens });

  setProgress(70, "搬入长桌、四柱床和第九百本书");
  await nextFrame();
  audit = new LayoutAudit();
  const furnishings = buildFurnishings({ layers, mats, audit, state: visualState });
  visualState.lightSpots.push(...furnishings.lightSpots.filter((s) => !visualState.lightSpots.includes(s)));
  buildAuditUI();

  // Collect animated meshes before welding the static shell.
  collectFlames();
  const excludeFromBake = new Set();
  for (const entry of visualState.flags) excludeFromBake.add(entry.mesh);
  for (const entry of flameMeshes) excludeFromBake.add(entry.mesh);
  const bakeTargets = [
    ["terrain", layers.terrain],
    ["gardens", layers.gardens],
    ["keep-ground", layers.keep0],
    ["keep-solar", layers.keep1],
    ["keep-library", layers.keep2],
    ["general", layers.general],
    ["keep-roof", layers.keepRoof],
    ["fixed-roofs", layers.fixedRoofs]
  ];
  const bakeStats = [];
  for (const [name, group] of bakeTargets) {
    const stats = bakeStaticGroup(group, { exclude: excludeFromBake });
    bakeStats.push({ name, ...stats });
  }
  const interiorBakeTargets = [
    ["furniture-ground", layers.furniture0], ["furniture-solar", layers.furniture1], ["furniture-library", layers.furniture2],
    ["decor-ground", layers.decor0], ["decor-solar", layers.decor1], ["decor-library", layers.decor2]
  ];
  for (const [name, group] of interiorBakeTargets) {
    const stats = bakeStaticGroup(group, { exclude: excludeFromBake });
    bakeStats.push({ name, ...stats });
  }
  console.info("[Castellum] static weld", bakeStats);

  setProgress(84, "点亮窗子与壁炉");
  await nextFrame();
  atmosphere = new Atmosphere(scene, renderer, textures, mats);
  collectFlames();

  // mark explosive groups and preserve their base transform
  for (const entry of EXPLODE_TARGETS) {
    const group = layers[entry.group];
    if (group) group.userData.baseY = 0;
  }

  highlightGroup = new THREE.Group();
  highlightGroup.name = "selected-room-highlight";
  highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8a263,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ringA = new THREE.Mesh(new THREE.RingGeometry(0.94, 1.02, 72), highlightMaterial);
  ringA.rotation.x = -Math.PI / 2;
  const ringB = new THREE.Mesh(new THREE.RingGeometry(1.16, 1.19, 72), highlightMaterial);
  ringB.rotation.x = -Math.PI / 2;
  highlightGroup.add(ringA, ringB);
  highlightGroup.visible = false;
  scene.add(highlightGroup);

  createPointLights();
  createSmoke();
  createFireflies(textures);
  buildRoomLabels();
  buildAtlas();
  setupInteractions();

  setProgress(93, "校对每一把椅子与墙的距离");
  await nextFrame();

  // set the initial sun & UI
  if (dom.timeSlider) dom.timeSlider.value = String(app.time);
  setHour(app.time);
  applyVisibility();
  buildAuditUI();

  // first render / shader compilation
  await document.fonts.ready.catch(() => {});
  try {
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  } catch (error) {
    console.warn("Shader precompilation was skipped", error);
  }
  setProgress(98, "最后点亮门厅的两支火把");
  await nextFrame();
  renderer.render(scene, camera);
  setProgress(100, "城堡已开门");

  app.ready = true;
  lastTime = performance.now();
  renderer.shadowMap.needsUpdate = true;
  lastShadowUpdate = performance.now();
  requestAnimationFrame(animate);
  await wait(550);
  document.body.classList.add("is-ready");
  dom.loader.classList.add("is-done");
  setTimeout(() => dom.loader.remove(), 1300);

  const finalHero = getHeroPosition();
  controls.target.copy(finalHero.target);
  controls.update();
  animateCamera(finalHero.position, finalHero.target, 2800);
  setTimeout(() => {
    toast("欢迎来到金鸢尾堡 · 拖拽环游，或点选一枚房间标记");
  }, 900);
  setTimeout(() => {
    if (!app.selectedRoom) toast("提示：观览台可以打开屋顶剖面，逐层查看室内");
  }, 6500);

  window.__CASTLE__ = {
    scene,
    world,
    camera,
    renderer,
    controls,
    layers,
    requestShadowRefresh,
    audit,
    get report() {
      return auditReport;
    },
    get stats() {
      return {
        objects: countObjects(world),
        triangles: renderer.info.render.triangles,
        calls: renderer.info.render.calls
      };
    },
    rooms: ROOMS,
    setTime: (h) => {
      setHour(h);
    },
    setFloor: setFloorMode,
    openRoom,
    reset: () => restoreOverview(),
    setExplode,
    exportGLB,
    refreshAudit: () => {
      auditReport = audit.validate();
      buildAuditUI();
      return auditReport;
    },
    updateLabels
  };

  console.info("[Castellum] built in " + Math.round(performance.now() - loadStartedAt) + "ms");
  console.info("[Castellum] render stats", countObjects(world), renderer.info);
}

function countObjects(root) {
  let n = 0;
  root.traverse((o) => { if (o.isMesh || o.isPoints) n += 1; });
  return n;
}

/* ─────────────────────────── Interface ─────────────────────────── */

function setupInteractions() {
  // The export and craftsmanship controls stay docked at the panel's foot.
  const panelEl = document.querySelector(".panel");
  const panelFooter = document.querySelector(".panel__footer");
  const archiveSection = document.querySelector(".console-section--export");
  if (panelEl && panelFooter && archiveSection) {
    panelEl.insertBefore(archiveSection, panelFooter);
    archiveSection.classList.add("is-docked");
  }

  dom.timeSlider.addEventListener("input", (event) => {
    app.autoTime = false;
    if (dom.cycleButton) {
      dom.cycleButton.classList.remove("is-playing");
      dom.cycleButton.setAttribute("aria-pressed", "false");
    }
    setHour(parseFloat(event.target.value));
  });

  if (dom.cycleButton) {
    dom.cycleButton.addEventListener("click", toggleAutoTime);
  }

  document.querySelectorAll(".time-track__scale button").forEach((button) => {
    button.addEventListener("click", () => {
      const hour = parseFloat(button.dataset.hour);
      app.autoTime = false;
      if (dom.cycleButton) {
        dom.cycleButton.classList.remove("is-playing");
        dom.cycleButton.setAttribute("aria-pressed", "false");
      }
      setHour(hour);
    });
  });

  dom.floorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.floor;
      clearSelectedRoom();
      setFloorMode(mode, { animateCamera: true });
      if (window.innerWidth <= 900) closePanel();
    });
  });

  dom.layerInputs.forEach((input) => {
    input.addEventListener("change", () => {
      setLayer(input.dataset.layer, input.checked);
      if (input.dataset.layer === "labels" && input.checked) updateLabels(true);
    });
  });

  const explodeButton = $("explodeToggle");
  if (explodeButton) {
    explodeButton.addEventListener("click", () => {
      setExplode(!app.explode);
    });
  }

  if (dom.rotateButton) {
    dom.rotateButton.addEventListener("click", () => {
      setAutoRotate(!app.autoRotate);
    });
  }
  if (dom.resetButton) {
    dom.resetButton.addEventListener("click", () => restoreOverview());
  }

  const panelCollapse = $("panelCollapse");
  if (panelCollapse) panelCollapse.addEventListener("click", closePanel);
  const panelTrigger = $("panelTrigger");
  if (panelTrigger) panelTrigger.addEventListener("click", openPanel);

  if (dom.roomCardClose) dom.roomCardClose.addEventListener("click", () => clearSelectedRoom());
  if (dom.focusRoom) {
    dom.focusRoom.addEventListener("click", () => {
      if (app.selectedRoom) openRoom(app.selectedRoom);
    });
  }
  if (dom.restoreView) dom.restoreView.addEventListener("click", () => restoreOverview());

  const atlasTrigger = $("atlasTrigger");
  if (atlasTrigger) {
    atlasTrigger.addEventListener("click", () => {
      if (dom.atlasDialog) dom.atlasDialog.showModal();
    });
  }
  const atlasClose = $("atlasClose");
  if (atlasClose) atlasClose.addEventListener("click", () => dom.atlasDialog.close());
  if (dom.atlasDialog) {
    dom.atlasDialog.addEventListener("click", (event) => {
      if (event.target === dom.atlasDialog) dom.atlasDialog.close();
    });
  }

  if (dom.auditButton) {
    dom.auditButton.addEventListener("click", () => {
      dom.auditDialog.showModal();
    });
  }
  const auditClose = $("auditClose");
  if (auditClose) auditClose.addEventListener("click", () => dom.auditDialog.close());
  if (dom.auditDialog) {
    dom.auditDialog.addEventListener("click", (event) => {
      if (event.target === dom.auditDialog) dom.auditDialog.close();
    });
  }

  if (dom.exportButton) {
    dom.exportButton.addEventListener("click", () => exportGLB());
  }

  window.addEventListener("keydown", (event) => {
    if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === "r") restoreOverview();
    if (key === "l") setLayer("labels", !app.layers.labels);
    if (event.code === "Space") {
      event.preventDefault();
      toggleAutoTime();
    }
    if (key === "escape") {
      clearSelectedRoom();
      if (dom.atlasDialog?.open) dom.atlasDialog.close();
      if (dom.auditDialog?.open) dom.auditDialog.close();
    }
  });

  renderer.domElement.addEventListener("pointerdown", () => {
    const hint = $("orbitHint");
    if (hint) hint.classList.add("is-dismissed");
    if (app.autoRotate) setAutoRotate(false);
  }, { once: false });

  window.addEventListener("resize", onResize);
  setTimeout(() => {
    const hint = $("orbitHint");
    if (hint) hint.classList.add("is-dismissed");
  }, 15000);
}

function openPanel() {
  document.body.dataset.panel = "open";
  const trigger = $("panelTrigger");
  if (trigger) trigger.setAttribute("aria-expanded", "true");
}

function closePanel() {
  document.body.dataset.panel = "closed";
  const trigger = $("panelTrigger");
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function onResize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (width <= 900 && document.body.dataset.panel !== "open") {
    document.body.dataset.panel = "closed";
  }
  updateLabels(true);
}

/* ─────────────────────────── GLB export ─────────────────────────── */

async function exportGLB() {
  if (!app.ready || !world) return;
  const button = dom.exportButton;
  if (!button || button.classList.contains("is-loading")) return;
  button.classList.add("is-loading");
  const label = button.querySelector("b");
  const oldLabel = label ? label.textContent : "";
  if (label) label.textContent = "正在封箱…";
  toast("正在把 3D 城堡打包成 GLB，可能需要几秒");

  await new Promise((resolve) => setTimeout(resolve, 60));
  try {
    const clone = world.clone(true);
    clone.name = "Castellum_Aureliae";
    const remove = [];
    clone.traverse((node) => {
      node.visible = true;
      if (node.isPoints || node.isSprite) remove.push(node);
      if (node.userData && node.userData.baseY !== undefined) node.position.y = 0;
    });
    remove.forEach((node) => {
      if (node.parent) node.parent.remove(node);
    });
    // Export the assembled castle, never the exploded offset positions.
    for (const name of ["keep-solar", "keep-library", "roofs-keep", "furniture-solar", "furniture-library", "decor-solar", "decor-library"]) {
      const node = clone.getObjectByName(name);
      if (node) node.position.y = 0;
    }
    // Re-index welded geometry and remove duplicate vertices. This does not
    // alter the interactive scene; it only makes the exported binary leaner.
    const weldCache = new Map();
    clone.traverse((node) => {
      if (!node.isMesh || node.isInstancedMesh || !node.geometry) return;
      const source = node.geometry;
      if (weldCache.has(source.uuid)) {
        node.geometry = weldCache.get(source.uuid);
        return;
      }
      if (source.index) {
        weldCache.set(source.uuid, source);
        return;
      }
      try {
        const welded = mergeVertices(source.clone(), 1e-4);
        if (welded.index) {
          welded.computeBoundingSphere();
          welded.computeBoundingBox();
          weldCache.set(source.uuid, welded);
          node.geometry = welded;
        }
      } catch (error) {
        console.warn("Could not index an export mesh", error);
      }
    });
    const exportScene = new THREE.Scene();
    exportScene.name = "Castellum Aureliae";
    exportScene.add(clone);

    const exporter = new GLTFExporter();
    const result = await new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (glb) => resolve(glb),
        (error) => reject(error),
        { binary: true, onlyVisible: false, maxTextureSize: 512, truncateDrawRange: true }
      );
    });

    const blob = new Blob([result], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Castellum_Aureliae.glb";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("GLB 已导出 · " + (blob.size / 1024 / 1024).toFixed(2) + " MB");
  } catch (error) {
    console.error("GLB export failed", error);
    toast("GLB 导出失败 · 请查看控制台");
  } finally {
    button.classList.remove("is-loading");
    if (label) label.textContent = oldLabel || "导出 GLB 模型";
  }
}

/* ─────────────────────────── Animation loop ─────────────────────────── */

let previous = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - previous) / 1000 || 0.016);
  previous = now;
  elapsed += dt;

  if (app.autoTime) {
    let hour = app.time + dt * app.cycleSpeed;
    if (hour >= 24) hour -= 24;
    setHour(hour);
  }

  updateCameraTween(now);
  updateExplode(dt);
  controls.update();
  clampPan();
  updateLabels();

  if (environment) environment.update(elapsed);
  if (gardens) gardens.update(elapsed);
  updateSmoke(elapsed);
  updateFireflies(elapsed);
  updateFlags(elapsed);
  updateFlames(elapsed);
  updatePointLights(elapsed, dt);
  if (shadowDirty && now - lastShadowUpdate > 90) {
    renderer.shadowMap.needsUpdate = true;
    shadowDirty = false;
    lastShadowUpdate = now;
  }
  if (highlightGroup && highlightGroup.visible && highlightMaterial) {
    highlightMaterial.opacity = 0.44 + Math.sin(elapsed * 2.3) * 0.13;
    highlightGroup.rotation.y = elapsed * 0.13;
    if (app.selectedRoom) {
      const floor = app.selectedRoom.floor;
      if (app.explode && floor > 0) {
        const offset = EXPLODE_TARGETS.find((e) => e.group === (floor === 1 ? "keep1" : "keep2"));
        highlightGroup.position.y = (app.selectedRoom.bounds.y || 0) + 0.04 + (offset ? app.explodeAmount * offset.amount : 0);
      }
    }
  }
  renderer.render(scene, camera);
}

function clampPan() {
  if (!controls) return;
  controls.target.x = clamp(controls.target.x, -36, 36);
  controls.target.y = clamp(controls.target.y, 0, 28);
  controls.target.z = clamp(controls.target.z, -34, 34);
}

/* ─────────────────────────── Boot ─────────────────────────── */

(async () => {
  try {
    await buildScene();
  } catch (error) {
    console.error("[Castellum] construction failed", error);
    if (dom.mouseLabel) dom.mouseLabel.textContent = "建造中止 · 请查看控制台";
    setProgress(100, "建造中止 · 请查看控制台");
    const loader = dom.loader;
    if (loader) {
      const line = document.createElement("div");
      line.style.marginTop = "18px";
      line.style.fontSize = "10px";
      line.style.opacity = ".6";
      line.textContent = String(error.message || error);
      loader.querySelector(".loader__inner")?.appendChild(line);
    }
  }
})();
