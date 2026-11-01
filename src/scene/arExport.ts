/**
 * AR export: bake the live design (meshes + instanced louvers, minus house/ground/labels) into one
 * clean group, then serialize it to USDZ (iOS AR Quick Look) or GLB (Android / WebXR).
 *
 * Scene components opt in with `userData.arRoot` and opt out with `userData.arSkip`.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getScene } from './snapshot';

const MAX_EMISSIVE = 1;

/** Position/normal/uv only, non-indexed, no groups — so every part can be merged by material. */
function prepare(src: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry {
  let g = src.clone();
  if (g.index) g = g.toNonIndexed();
  const pos = g.getAttribute('position');
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', pos.clone());
  const normal = g.getAttribute('normal');
  if (normal) out.setAttribute('normal', normal.clone());
  else out.computeVertexNormals();
  const uv = g.getAttribute('uv');
  out.setAttribute('uv', uv && uv.itemSize === 2 ? uv.clone() : new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2));
  out.applyMatrix4(matrix);
  g.dispose();
  return out;
}

function skipped(o: THREE.Object3D, stopAt: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = o;
  while (p && p !== stopAt) {
    if (p.userData?.arSkip) return true;
    p = p.parent;
  }
  return false;
}

/** Clone a material for export: emissive clamped (night LEDs would blow out), render-only flags dropped. */
function exportMaterial(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const c = m.clone();
  c.emissiveIntensity = Math.min(MAX_EMISSIVE, m.emissiveIntensity);
  c.depthWrite = true;
  c.map = null; // procedural canvas textures are context only (house/pavers); never exported
  return c;
}

/**
 * Bake every `arRoot` subtree into a single group. Instanced meshes are expanded, all parts are
 * merged per material, and world transforms are baked relative to the root (ground = y 0, meters).
 */
export function bakeForAr(scene: THREE.Object3D): THREE.Group {
  scene.updateMatrixWorld(true);
  const roots: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.userData?.arRoot) roots.push(o);
  });
  const byMaterial = new Map<THREE.MeshStandardMaterial, THREE.BufferGeometry[]>();
  const inv = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const inst = new THREE.Matrix4();

  for (const root of roots) {
    inv.copy(root.matrixWorld).invert();
    root.traverseVisible((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || skipped(o, root)) return;
      const mat = mesh.material;
      if (Array.isArray(mat) || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      const std = mat as THREE.MeshStandardMaterial;
      local.copy(inv).multiply(mesh.matrixWorld);
      const list = byMaterial.get(std) ?? [];
      const im = mesh as THREE.InstancedMesh;
      if (im.isInstancedMesh) {
        for (let i = 0; i < im.count; i++) {
          im.getMatrixAt(i, inst);
          list.push(prepare(mesh.geometry, new THREE.Matrix4().copy(local).multiply(inst)));
        }
      } else {
        list.push(prepare(mesh.geometry, local.clone()));
      }
      byMaterial.set(std, list);
    });
  }

  const group = new THREE.Group();
  group.name = 'Design';
  let n = 0;
  for (const [mat, geos] of byMaterial) {
    if (!geos.length) continue;
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    geos.forEach((g) => g !== merged && g.dispose());
    if (!merged) continue;
    merged.computeBoundingBox();
    const mesh = new THREE.Mesh(merged, exportMaterial(mat));
    mesh.name = `Part_${n++}`;
    group.add(mesh);
  }
  return group;
}

/** Free the geometries/materials created by bakeForAr. */
export function disposeBaked(group: THREE.Group): void {
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
}

/** Wait until the viewer is mounted and the design has geometry to export (lazy chunk + Suspense). */
export async function waitForDesign(timeoutMs = 10_000): Promise<THREE.Scene> {
  const t0 = Date.now();
  for (;;) {
    const scene = getScene();
    if (scene) {
      let hasMesh = false;
      scene.traverse((o) => {
        if (o.userData?.arRoot) o.traverse((c) => ((c as THREE.Mesh).isMesh ? (hasMesh = true) : undefined));
      });
      if (hasMesh) return scene;
    }
    if (Date.now() - t0 > timeoutMs) throw new Error('3D model is not ready');
    await new Promise((r) => setTimeout(r, 120));
  }
}

/** Current design as a baked group (caller disposes). */
export async function bakeCurrentDesign(): Promise<THREE.Group> {
  return bakeForAr(await waitForDesign());
}

/** USDZ for AR Quick Look (iOS/iPadOS Safari and Chrome, macOS Quick Look). Real-world scale, meters. */
export async function exportUsdz(): Promise<Blob> {
  const [{ USDZExporter }, group] = await Promise.all([import('three/addons/exporters/USDZExporter.js'), bakeCurrentDesign()]);
  try {
    const bytes = await new USDZExporter().parseAsync(group, {
      quickLookCompatible: true,
      ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } },
      includeAnchoringProperties: true,
    });
    return new Blob([bytes], { type: 'model/vnd.usdz+zip' });
  } finally {
    disposeBaked(group);
  }
}

/** Binary glTF of the design (Android Scene Viewer when hosted, or any 3D app). */
export async function exportGlb(): Promise<Blob> {
  const [{ GLTFExporter }, group] = await Promise.all([import('three/addons/exporters/GLTFExporter.js'), bakeCurrentDesign()]);
  try {
    const out = await new GLTFExporter().parseAsync(group, { binary: true });
    return new Blob([out as ArrayBuffer], { type: 'model/gltf-binary' });
  } finally {
    disposeBaked(group);
  }
}
