import * as THREE from "three";
import { ROOM_BY_ID } from "./data.js";

/* The audit works in plan and section: every freestanding piece of
   furniture is registered with its world-space bounds. Pieces that
   legitimately live inside another volume (a plate on a table, a
   tapestry on a wall) are never registered. Anything that would
   interpenetrate is reported with both objects named. */

export class LayoutAudit {
  constructor() {
    this.items = [];
    this.byRoom = new Map();
    this.ignoredMaterials = new Set();
  }

  register(id, roomId, object, options = {}) {
    if (!object) return null;
    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(object);
    const item = {
      id,
      roomId,
      object,
      box,
      kind: options.kind || "solid",
      wallMounted: !!options.wallMounted,
      ignoreBoundary: !!options.ignoreBoundary,
      label: options.label || id
    };
    this.items.push(item);
    if (!this.byRoom.has(roomId)) this.byRoom.set(roomId, []);
    this.byRoom.get(roomId).push(item);
    return item;
  }

  validate() {
    const issues = [];
    const rooms = [];
    const margin = 0.035;

    for (const [roomId, items] of this.byRoom.entries()) {
      const room = ROOM_BY_ID[roomId];
      const roomIssues = [];
      const bounds = room ? room.bounds : null;

      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        if (bounds && !a.ignoreBoundary && !a.wallMounted) {
          const minX = bounds.minX - margin;
          const maxX = bounds.maxX + margin;
          const minZ = bounds.minZ - margin;
          const maxZ = bounds.maxZ + margin;
          if (a.box.min.x < minX || a.box.max.x > maxX || a.box.min.z < minZ || a.box.max.z > maxZ) {
            roomIssues.push({
              type: "boundary",
              a: a.label,
              b: "room edge",
              room: roomId,
              detail: "footprint " + [
                a.box.min.x.toFixed(2),
                a.box.max.x.toFixed(2),
                a.box.min.z.toFixed(2),
                a.box.max.z.toFixed(2)
              ].join(" / ")
            });
          }
        }

        for (let j = i + 1; j < items.length; j++) {
          const b = items[j];
          const ox = Math.min(a.box.max.x, b.box.max.x) - Math.max(a.box.min.x, b.box.min.x);
          const oy = Math.min(a.box.max.y, b.box.max.y) - Math.max(a.box.min.y, b.box.min.y);
          const oz = Math.min(a.box.max.z, b.box.max.z) - Math.max(a.box.min.z, b.box.min.z);
          if (ox > 0.045 && oz > 0.045 && oy > 0.18) {
            roomIssues.push({
              type: "overlap",
              a: a.label,
              b: b.label,
              room: roomId,
              detail: "overlap " + ox.toFixed(2) + "m / " + oz.toFixed(2) + "m"
            });
          }
        }
      }

      const roomName = room ? room.name : roomId;
      rooms.push({
        roomId,
        name: roomName,
        count: items.length,
        issues: roomIssues
      });
      issues.push(...roomIssues);
    }

    return {
      pass: issues.length === 0,
      issues,
      rooms,
      itemCount: this.items.length,
      roomCount: rooms.length
    };
  }

  reportText() {
    const report = this.validate();
    const lines = [];
    lines.push("Craft audit — " + (report.pass ? "PASS" : "FAIL"));
    lines.push("Registered pieces: " + report.itemCount + " in " + report.roomCount + " rooms");
    for (const room of report.rooms) {
      lines.push("");
      lines.push(room.name + ": " + room.count + " pieces — " + (room.issues.length ? room.issues.length + " issue(s)" : "clear"));
      for (const issue of room.issues) {
        lines.push("  • " + issue.a + " × " + issue.b + " (" + issue.detail + ")");
      }
    }
    return { report, text: lines.join("\n") };
  }
}
