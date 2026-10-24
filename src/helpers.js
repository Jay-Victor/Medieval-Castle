import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const TAU = Math.PI * 2;

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function randRange(r, a, b) {
  return a + (b - a) * r();
}

export function makeGroup(parent, name = "group", x = 0, y = 0, z = 0, rotY = 0) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  if (parent) parent.add(g);
  return g;
}

export function scaleBoxUVs(geometry, w, h, d, scale = 2.8) {
  const uv = geometry.attributes.uv;
  const normal = geometry.attributes.normal;
  if (!uv) return geometry;
  for (let i = 0; i < uv.count; i++) {
    let u = 1;
    let v = 1;
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    if (nx > 0.5) {
      u = d / scale;
      v = h / scale;
    } else if (ny > 0.5) {
      u = w / scale;
      v = d / scale;
    } else if (nz > 0.5) {
      u = w / scale;
      v = h / scale;
    }
    uv.setXY(i, uv.getX(i) * Math.max(0.25, u), uv.getY(i) * Math.max(0.25, v));
  }
  uv.needsUpdate = true;
  return geometry;
}

export function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    rotY = 0,
    rotX = 0,
    rotZ = 0,
    uvScale = 0,
    rounded = 0,
    castShadow = true,
    receiveShadow = true,
    name = "box"
  } = options;
  const useBevel = rounded > 0.012;
  const geometry = useBevel
    ? new RoundedBoxGeometry(w, h, d, 1, Math.min(rounded, Math.min(w, h, d) * 0.45))
    : new THREE.BoxGeometry(w, h, d);
  if (uvScale > 0) scaleBoxUVs(geometry, w, h, d, uvScale);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function cylinder(parent, radiusTop, radiusBottom, height, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    segments = 16,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    openEnded = false,
    castShadow = true,
    receiveShadow = true,
    name = "cylinder"
  } = options;
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, openEnded);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function sphere(parent, radius, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    width = 16,
    height = 12,
    scale = [1, 1, 1],
    rotY = 0,
    castShadow = true,
    receiveShadow = true,
    name = "sphere"
  } = options;
  const geo = new THREE.SphereGeometry(radius, width, height);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function cone(parent, radius, height, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    segments = 12,
    rotY = 0,
    rotX = 0,
    openEnded = false,
    castShadow = true,
    receiveShadow = true,
    name = "cone"
  } = options;
  const geo = new THREE.ConeGeometry(radius, height, segments, 1, openEnded);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, 0);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function torus(parent, radius, tube, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    radialSegments = 8,
    tubularSegments = 24,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    castShadow = true,
    receiveShadow = true,
    name = "torus"
  } = options;
  const geo = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function plane(parent, w, h, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    rotX = -Math.PI / 2,
    rotY = 0,
    rotZ = 0,
    castShadow = false,
    receiveShadow = true,
    name = "plane"
  } = options;
  const geo = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function panel(parent, w, h, mat, x = 0, y = 0, z = 0, options = {}) {
  return plane(parent, w, h, mat, x, y, z, {
    ...options,
    rotX: options?.rotX ?? 0
  });
}

export function customMesh(parent, geometry, mat, x = 0, y = 0, z = 0, options = {}) {
  const {
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    castShadow = true,
    receiveShadow = true,
    name = "mesh"
  } = options;
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent?.add(mesh);
  return mesh;
}

export function lathe(parent, points, mat, x = 0, y = 0, z = 0, options = {}) {
  const { segments = 20, scale = 1, castShadow = true, receiveShadow = true, name = "lathe" } = options;
  const geo = new THREE.LatheGeometry(points.map(([px, py]) => new THREE.Vector2(px * scale, py * scale)), segments);
  return customMesh(parent, geo, mat, x, y, z, { castShadow, receiveShadow, name });
}

export function instanced(parent, geometry, material, transforms, options = {}) {
  const {
    castShadow = true,
    receiveShadow = true,
    name = "instances",
    colors = null
  } = options;
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  const dummy = new THREE.Object3D();
  transforms.forEach((t, i) => {
    dummy.position.set(t.position?.[0] ?? 0, t.position?.[1] ?? 0, t.position?.[2] ?? 0);
    dummy.rotation.set(t.rotation?.[0] ?? 0, t.rotation?.[1] ?? 0, t.rotation?.[2] ?? 0);
    const s = t.scale;
    if (Array.isArray(s)) dummy.scale.set(s[0], s[1], s[2]);
    else dummy.scale.setScalar(typeof s === "number" ? s : 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (colors && colors[i] !== undefined) mesh.setColorAt(i, colors[i]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  parent?.add(mesh);
  return mesh;
}

export function mergeMeshes(parent, meshes, name = "merged") {
  const group = new THREE.Group();
  group.name = name;
  meshes.forEach((m) => {
    m.updateMatrix();
    if (!m.geometry) return;
    const g = m.geometry.clone().applyMatrix4(m.matrix);
    group.add(new THREE.Mesh(g, m.material));
  });
  parent?.add(group);
  return group;
}

export function createArchShape(width, height, pointed = 0.72) {
  const shape = new THREE.Shape();
  const half = width / 2;
  const spring = height * pointed;
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half, spring);
  shape.quadraticCurveTo(half, height, 0, height);
  shape.quadraticCurveTo(-half, height, -half, spring);
  shape.lineTo(-half, 0);
  shape.closePath();
  return shape;
}

export function createArchGeometry(width, height, segments = 28) {
  const shape = createArchShape(width, height);
  return new THREE.ShapeGeometry(shape, segments);
}

export function createArchFrameGeometry(width, height, thickness, depth = 0.12) {
  const outer = createArchShape(width + thickness * 2, height + thickness);
  const inner = createArchShape(width, height);
  // The inner cut-out sits on the base; lift it so its feet align with the outer frame.
  const innerPath = new THREE.Path();
  const half = width / 2;
  const spring = height * 0.72;
  innerPath.moveTo(-half, 0);
  innerPath.lineTo(half, 0);
  innerPath.lineTo(half, spring);
  innerPath.quadraticCurveTo(half, height, 0, height);
  innerPath.quadraticCurveTo(-half, height, -half, spring);
  innerPath.lineTo(-half, 0);
  outer.holes.push(innerPath);
  return new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false, curveSegments: 24 });
}

export function createHipRoofGeometry(w, d, h, textureScale = 2.2) {
  const xEave = w / 2;
  const zEave = d / 2;
  const ridgeHalf = Math.max(0.1, (w - d) / 2);
  const positions = [];
  const uvs = [];
  const normals = [];
  const pushTriangle = (a, b, c, ua, ub, uc) => {
    positions.push(...a, ...b, ...c);
    uvs.push(...ua, ...ub, ...uc);
  };
  const p = {
    frontL: [-xEave, 0, zEave],
    frontR: [xEave, 0, zEave],
    backL: [-xEave, 0, -zEave],
    backR: [xEave, 0, -zEave],
    ridgeL: [-ridgeHalf, h, 0],
    ridgeR: [ridgeHalf, h, 0]
  };
  const uv = (x, z, vertical = 0) => [x / textureScale, (z + vertical) / textureScale];
  // front slope (+z)
  const fUvScale = Math.sqrt(d * d + h * h) / textureScale;
  pushTriangle(p.frontL, p.frontR, p.ridgeR, [-xEave / textureScale, 0], [xEave / textureScale, 0], [p.ridgeR[0] / textureScale, fUvScale]);
  pushTriangle(p.frontL, p.ridgeR, p.ridgeL, [-xEave / textureScale, 0], [p.ridgeR[0] / textureScale, fUvScale], [p.ridgeL[0] / textureScale, fUvScale]);
  // back slope (-z)
  pushTriangle(p.backR, p.backL, p.ridgeL, [xEave / textureScale, 0], [-xEave / textureScale, 0], [p.ridgeL[0] / textureScale, fUvScale]);
  pushTriangle(p.backR, p.ridgeL, p.ridgeR, [xEave / textureScale, 0], [p.ridgeL[0] / textureScale, fUvScale], [p.ridgeR[0] / textureScale, fUvScale]);
  // left hip
  const sideUvScale = Math.sqrt(w * w + h * h) / textureScale;
  pushTriangle(p.frontL, p.ridgeL, p.backL, [zEave / textureScale, 0], [zEave / textureScale, sideUvScale], [-zEave / textureScale, 0]);
  // right hip
  pushTriangle(p.backR, p.ridgeR, p.frontR, [-zEave / textureScale, 0], [-zEave / textureScale, sideUvScale], [zEave / textureScale, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export function createGableRoofGeometry(w, d, h, textureScale = 2.2) {
  const xHalf = w / 2;
  const zHalf = d / 2;
  const positions = [];
  const uvs = [];
  // two sloping planes meeting at a ridge along z
  const slopeLen = Math.sqrt(xHalf * xHalf + h * h);
  const tri = (a, b, c, ua, ub, uc) => {
    positions.push(...a, ...b, ...c);
    uvs.push(...ua, ...ub, ...uc);
  };
  const leftFront = [-xHalf, 0, zHalf];
  const leftBack = [-xHalf, 0, -zHalf];
  const rightFront = [xHalf, 0, zHalf];
  const rightBack = [xHalf, 0, -zHalf];
  const ridgeFront = [0, h, zHalf];
  const ridgeBack = [0, h, -zHalf];
  tri(leftFront, rightFront, ridgeFront, [0, 0], [w / textureScale, 0], [w / textureScale / 2, slopeLen / textureScale]);
  tri(leftBack, ridgeBack, rightBack, [0, d / textureScale], [w / textureScale / 2, d / textureScale + slopeLen / textureScale], [w / textureScale, d / textureScale]);
  tri(leftBack, leftFront, ridgeFront, [0, 0], [d / textureScale, 0], [d / textureScale, slopeLen / textureScale]);
  tri(leftBack, ridgeFront, ridgeBack, [d / textureScale, 0], [d / textureScale, slopeLen / textureScale], [0, d / textureScale]);
  tri(rightFront, rightBack, ridgeBack, [0, 0], [0, d / textureScale], [d / textureScale, slopeLen / textureScale]);
  tri(rightFront, ridgeBack, ridgeFront, [0, 0], [d / textureScale, slopeLen / textureScale], [d / textureScale, 0]);
  // The above triangles include roof slopes; gable end walls are added separately.
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export function createHippedAppearance(parent, w, d, h, mat, x, y, z, options = {}) {
  const geo = createHipRoofGeometry(w, d, h, options.textureScale || 2.2);
  const mesh = customMesh(parent, geo, mat, x, y, z, { name: options.name || "hip-roof" });
  return mesh;
}

export function addStairs(parent, width, steps, rise, run, mat, x, z, options = {}) {
  const {
    rotY = 0,
    baseY = 0,
    name = "stone-stairs",
    railing = true,
    railMat = null
  } = options;
  const group = makeGroup(parent, name, x, baseY, z, rotY);
  const list = [];
  for (let i = 0; i < steps; i++) {
    const height = rise * (i + 1);
    const depth = run;
    const step = box(group, width, height, depth, mat, 0, height / 2, i * run + run / 2, {
      uvScale: 1.2,
      rounded: 0.015
    });
    list.push(step);
  }
  if (railing && railMat) {
    const sideOffset = width / 2 + 0.05;
    for (const side of [-1, 1]) {
      const rail = box(group, 0.08, 0.08, run * steps, railMat, side * sideOffset, rise * steps + 0.72, (run * steps) / 2, {
        rounded: 0.02
      });
      rail.rotation.x = -Math.atan2(rise, run);
      // rotate around the centre of the incline – close enough for a miniature
      const baseX = side * sideOffset;
      rail.position.x = baseX;
      for (let i = 0; i < steps; i += 2) {
        box(group, 0.07, 0.86, 0.07, railMat, baseX, rise * (i + 1) + 0.42, i * run + run / 2, { rounded: 0.02 });
      }
    }
  }
  return { group, steps: list };
}

export function addFence(parent, mat, points, height = 0.9, x, y, z) {
  // Simple ropes/rails for a little orchard enclosure. Points are local x/z pairs.
  const g = makeGroup(parent, "fence", x, y, z);
  const postGeo = new THREE.CylinderGeometry(0.06, 0.07, height, 6);
  const posts = [];
  points.forEach(([px, pz]) => {
    posts.push({ position: [px, height / 2, pz] });
  });
  instanced(g, postGeo, mat, posts, { castShadow: true });
  return g;
}

export function addCurtains(parent, x, y, z, width, height, mat, options = {}) {
  // Sculptural folds rather than flat planes: two gently gathered panels.
  const { side = "both", foldCount = 3, depth = 0.16 } = options;
  const panelW = width / (side === "both" ? 2.15 : 1.05);
  const makePanel = (cx, dir) => {
    const segments = foldCount * 2;
    const geo = new THREE.PlaneGeometry(panelW, height, segments, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const normalized = px / panelW + 0.5;
      const fold = Math.sin(normalized * Math.PI * foldCount) * depth;
      const flare = 1 + (0.5 - py / height) * 0.1;
      pos.setZ(i, fold * (0.25 + flare * 0.75));
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.position.set(cx, 0, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
  };
  if (side === "left" || side === "both") makePanel(-width / 2 + panelW / 2, -1);
  if (side === "right" || side === "both") makePanel(width / 2 - panelW / 2, 1);
  // tie-backs
  if (options.tiebacks !== false) {
    for (const s of side === "both" ? [-1, 1] : [side === "left" ? -1 : 1]) {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), options.tieMat || mat);
      knob.position.set(s * (width / 2 - panelW * 0.75), -height * 0.28, 0.1);
      parent.add(knob);
    }
  }
}

export function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  });
}

export function screenPosition(vector, camera, width, height) {
  const p = vector.clone().project(camera);
  return {
    x: (p.x * 0.5 + 0.5) * width,
    y: (-p.y * 0.5 + 0.5) * height,
    visible: p.z > -1 && p.z < 1
  };
}

export function makeBillboardTextureSprite() {
  // Retained for future decorative sprites; the model avoids billboards at export.
  return null;
}

export function mergeAll(meshes) {
  const geos = meshes.map((m) => {
    m.updateMatrix();
    return m.geometry.clone().applyMatrix4(m.matrix);
  });
  return mergeGeometries(geos, false);
}

export { THREE, RoundedBoxGeometry, mergeGeometries };
