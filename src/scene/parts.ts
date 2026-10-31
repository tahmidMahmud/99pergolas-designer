/**
 * Geometry helpers: every static member is pushed as a Part tagged with a material key,
 * then merged into ONE geometry per material (keeps draw calls low).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface Part {
  geo: THREE.BufferGeometry;
  mat: string;
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);

/** Normalize to non-indexed position/normal/uv so any geometry can be merged with any other. */
export function normalize(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  for (const name of Object.keys(out.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') out.deleteAttribute(name);
  }
  if (!out.attributes.normal) out.computeVertexNormals();
  if (!out.attributes.uv) {
    const n = out.attributes.position.count;
    out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  }
  out.clearGroups();
  return out;
}

/** Axis-aligned (optionally rotated, XYZ order) box, meters, centered at (cx,cy,cz). */
export function box(
  sx: number,
  sy: number,
  sz: number,
  cx: number,
  cy: number,
  cz: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(Math.max(sx, 1e-4), Math.max(sy, 1e-4), Math.max(sz, 1e-4));
  tmpQ.setFromEuler(tmpE.set(rx, ry, rz));
  g.applyMatrix4(tmpM.compose(tmpV.set(cx, cy, cz), tmpQ, ONE));
  return normalize(g);
}

/** Box with softly rounded edges (posts). */
export function roundedBox(sx: number, sy: number, sz: number, cx: number, cy: number, cz: number, r = 0.006): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(r, sx / 3, sz / 3));
  g.translate(cx, cy, cz);
  return normalize(g);
}

export function plane(w: number, h: number, cx: number, cy: number, cz: number, ry = 0): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  if (ry) g.rotateY(ry);
  g.translate(cx, cy, cz);
  return normalize(g);
}

export function cylinder(r: number, h: number, cx: number, cy: number, cz: number, seg = 16): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.translate(cx, cy, cz);
  return normalize(g);
}

/**
 * Extrude a 2D profile (x = outward, y = up, meters) along a line.
 * `origin` is where profile (0,0) sits at the START of the run; the run goes along cross(outward, up).
 * Returns geometry spanning `length` centered on `center` (the inner-bottom line midpoint).
 */
export function extrudeAlong(
  shape: THREE.Shape,
  length: number,
  center: THREE.Vector3,
  outward: THREE.Vector3,
): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 6 });
  const up = new THREE.Vector3(0, 1, 0);
  const along = new THREE.Vector3().crossVectors(outward, up).normalize();
  const basis = new THREE.Matrix4().makeBasis(outward.clone().normalize(), up, along);
  const start = center.clone().addScaledVector(along, -length / 2);
  basis.setPosition(start);
  g.applyMatrix4(basis);
  return normalize(g);
}

/** Apply a matrix to every geometry in a list (in place) and return it. */
export function transformAll(geos: THREE.BufferGeometry[], mtx: THREE.Matrix4): THREE.BufferGeometry[] {
  for (const g of geos) g.applyMatrix4(mtx);
  return geos;
}

/** Group parts by material and merge each group into one geometry. */
export function mergeByMaterial(parts: Part[]): Map<string, THREE.BufferGeometry> {
  const groups = new Map<string, THREE.BufferGeometry[]>();
  for (const p of parts) {
    const list = groups.get(p.mat) ?? [];
    list.push(p.geo);
    groups.set(p.mat, list);
  }
  const out = new Map<string, THREE.BufferGeometry>();
  for (const [key, list] of groups) {
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (merged) {
      if (list.length > 1) list.forEach((g) => g.dispose());
      merged.computeBoundingSphere();
      out.set(key, merged);
    }
  }
  return out;
}

/** Matrix placing a local side frame (x along side, +z outward, y up) at (x,z) with yaw `ry`. */
export function sideMatrix(x: number, z: number, ry: number): THREE.Matrix4 {
  return new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
}
