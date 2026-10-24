import * as THREE from "three";
import { RoundedBoxGeometry, mergeGeometries } from "./helpers.js";

/* Furniture is assembled from many small forms, then welded by material.
   That keeps the maquette rich at close range while keeping the draw-call
   count gentle enough for a laptop to orbit at 60fps. */

function prepare(geo) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  for (const key of Object.keys(g.attributes)) {
    if (key !== "position" && key !== "normal" && key !== "uv") g.deleteAttribute(key);
  }
  return g;
}

export class FurnitureBuilder {
  constructor(group) {
    this.group = group;
    this.parts = new Map();
  }

  add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    const g = prepare(geometry);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2], "XYZ"));
    m.compose(new THREE.Vector3(position[0], position[1], position[2]), q, new THREE.Vector3(scale[0], scale[1], scale[2]));
    g.applyMatrix4(m);
    if (!this.parts.has(material)) this.parts.set(material, []);
    this.parts.get(material).push(g);
    return this;
  }

  box(w, h, d, material, x = 0, y = 0, z = 0, opts = {}) {
    const { round = 0, rx = 0, ry = 0, rz = 0 } = opts;
    const geo = round > 0.012
      ? new RoundedBoxGeometry(w, h, d, 1, Math.min(round, Math.min(w, h, d) * 0.45))
      : new THREE.BoxGeometry(w, h, d);
    return this.add(geo, material, [x, y, z], [rx, ry, rz]);
  }

  cylinder(rt, rb, h, material, x = 0, y = 0, z = 0, opts = {}) {
    const { segments = 16, rx = 0, ry = 0, rz = 0 } = opts;
    return this.add(new THREE.CylinderGeometry(rt, rb, h, segments), material, [x, y, z], [rx, ry, rz]);
  }

  sphere(r, material, x = 0, y = 0, z = 0, opts = {}) {
    const { width = 12, height = 8, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0 } = opts;
    return this.add(new THREE.SphereGeometry(r, width, height), material, [x, y, z], [rx, ry, rz], [sx, sy, sz]);
  }

  cone(r, h, material, x = 0, y = 0, z = 0, opts = {}) {
    const { segments = 10, rx = 0, ry = 0, rz = 0 } = opts;
    return this.add(new THREE.ConeGeometry(r, h, segments), material, [x, y, z], [rx, ry, rz]);
  }

  lathe(points, material, x = 0, y = 0, z = 0, opts = {}) {
    const { segments = 18, sx = 1, sy = 1, sz = 1 } = opts;
    const geo = new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), segments);
    return this.add(geo, material, [x, y, z], [0, 0, 0], [sx, sy, sz]);
  }

  plane(w, h, material, x = 0, y = 0, z = 0, opts = {}) {
    const { rx = -Math.PI / 2, ry = 0, rz = 0, segX = 1, segY = 1 } = opts;
    return this.add(new THREE.PlaneGeometry(w, h, segX, segY), material, [x, y, z], [rx, ry, rz]);
  }

  shape(shape, material, x = 0, y = 0, z = 0, opts = {}) {
    const { depth = 0, rx = 0, ry = 0, rz = 0, bevel = 0 } = opts;
    const geo = depth > 0
      ? new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: bevel > 0,
          bevelSize: bevel,
          bevelThickness: bevel,
          bevelSegments: 1,
          curveSegments: 16
        })
      : new THREE.ShapeGeometry(shape, 18);
    return this.add(geo, material, [x, y, z], [rx, ry, rz]);
  }

  finish(name = "furniture") {
    const group = new THREE.Group();
    group.name = name;
    for (const [material, geometries] of this.parts.entries()) {
      if (!geometries.length) continue;
      const merged = mergeGeometries(geometries, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = (material.name || "part") + "-merged";
      group.add(mesh);
      geometries.forEach((g) => g.dispose());
    }
    this.group.add(group);
    return group;
  }
}

export function createFurniturePiece(parent, name, x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  parent.add(group);
  const builder = new FurnitureBuilder(group);
  return { group, builder };
}

export function makeWavyCloth(width, height, folds = 4, depth = 0.06, segmentsX = 12, segmentsY = 8) {
  const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / width + 0.5;
    const v = y / height + 0.5;
    pos.setZ(i, Math.sin(u * Math.PI * folds) * depth * (0.4 + v * 0.6));
  }
  geo.computeVertexNormals();
  return geo;
}
