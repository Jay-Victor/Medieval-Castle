import * as THREE from "three";
import { mergeGeometries } from "./helpers.js";

/* Combine the thousands of small static stone, wood and foliage meshes into
   one mesh per material and shadow setting. The room contents are excluded
   because their individual groups power the furniture audit. */

function prepareGeometry(geometry) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  for (const key of Object.keys(g.attributes)) {
    if (key !== "position" && key !== "normal" && key !== "uv") g.deleteAttribute(key);
  }
  return g;
}

export function bakeStaticGroup(group, options = {}) {
  if (!group) return { meshesRemoved: 0, meshesCreated: 0 };
  const exclude = options.exclude || new Set();
  group.updateWorldMatrix(true, true);
  const groupInverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  const meshes = [];

  group.traverse((object) => {
    if (!object.isMesh) return;
    if (object.isInstancedMesh || object.isSkinnedMesh) return;
    if (exclude.has(object)) return;
    if (object.children.length > 0) return;
    if (Array.isArray(object.material)) return;
    const mat = object.material;
    if (!mat || mat.transparent || mat.alphaTest > 0 || mat.isShaderMaterial) return;
    if (object.geometry.morphAttributes && Object.keys(object.geometry.morphAttributes).length) return;
    object.updateWorldMatrix(true, false);
    const localMatrix = new THREE.Matrix4().copy(groupInverse).multiply(object.matrixWorld);
    const geo = prepareGeometry(object.geometry);
    geo.applyMatrix4(localMatrix);
    const key = [
      mat.uuid,
      object.castShadow ? 1 : 0,
      object.receiveShadow ? 1 : 0,
      object.renderOrder || 0
    ].join("|");
    if (!buckets.has(key)) {
      buckets.set(key, {
        material: mat,
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
        renderOrder: object.renderOrder || 0,
        geometries: []
      });
    }
    buckets.get(key).geometries.push(geo);
    meshes.push(object);
  });

  if (!meshes.length) return { meshesRemoved: 0, meshesCreated: 0 };
  const bakedRoot = new THREE.Group();
  bakedRoot.name = "baked-static";
  group.add(bakedRoot);
  let created = 0;
  for (const bucket of buckets.values()) {
    if (!bucket.geometries.length) continue;
    const merged = mergeGeometries(bucket.geometries, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.name = "baked-" + (bucket.material.name || "surface") + "-" + created;
    mesh.castShadow = bucket.castShadow;
    mesh.receiveShadow = bucket.receiveShadow;
    mesh.renderOrder = bucket.renderOrder;
    bakedRoot.add(mesh);
    bucket.geometries.forEach((g) => g.dispose());
    created += 1;
  }

  for (const mesh of meshes) {
    if (mesh.parent) mesh.parent.remove(mesh);
  }

  return { meshesRemoved: meshes.length, meshesCreated: created };
}
