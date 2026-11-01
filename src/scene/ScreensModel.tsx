/** Standalone motorized screens: a covered-patio wall with N openings, each with housing + dropped fabric. */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ScreensDesign } from '../types';
import { useDesigner } from '../state/store';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { box, plane, type Part } from './parts';
import { colorHex, fabricKey, pcKey } from './materials';
import { brickTexture } from './textures';
import { buildScreen } from './Enclosures';
import { MergedMeshes } from './MergedMeshes';
import { DimensionSet, type DimSpec } from './Dimensions';
import { IN, ftIn } from './units';

const END_PIER = 24;
const PIER = 18;
const HEADER = 22;
export const PORCH_DEPTH = 3.6;

export interface ScreensLayout {
  wallW: number;
  wallH: number;
  openings: { x: number; w: number; h: number; mountedOn: string }[];
}

export function screensLayout(d: ScreensDesign): ScreensLayout {
  const ops = d.openings.length ? d.openings : [{ width: 120, height: 96, mountedOn: 'wood' as const }];
  const totalIn = 2 * END_PIER + ops.reduce((s, o) => s + Math.max(24, o.width), 0) + PIER * (ops.length - 1);
  const maxH = Math.max(...ops.map((o) => Math.max(36, o.height)));
  const wallW = totalIn * IN;
  const wallH = (maxH + HEADER) * IN;
  let cursor = -totalIn / 2 + END_PIER;
  const openings = ops.map((o) => {
    const w = Math.max(24, o.width);
    const x = (cursor + w / 2) * IN;
    cursor += w + PIER;
    return { x, w: w * IN, h: Math.max(36, o.height) * IN, mountedOn: o.mountedOn };
  });
  return { wallW, wallH, openings };
}

const TRIM_MAT: Record<string, string | null> = { wood: 'wood', aluminum: 'alu', metal: 'metal', brick: null, other: 'trim' };

export function ScreensModel({ design }: { design: ScreensDesign }) {
  const L = useMemo(() => screensLayout(design), [design]);
  const showDims = useDesigner((s) => s.view.showDimensions);
  const brickWall = (design.openings[0]?.mountedOn ?? 'brick') === 'brick';
  const thick = 0.25;

  // Front wall with holes (extruded so the openings show reveals).
  const wallGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-L.wallW / 2, 0);
    s.lineTo(L.wallW / 2, 0);
    s.lineTo(L.wallW / 2, L.wallH);
    s.lineTo(-L.wallW / 2, L.wallH);
    s.closePath();
    for (const o of L.openings) {
      const h = new THREE.Path();
      h.moveTo(o.x - o.w / 2, 0.001);
      h.lineTo(o.x - o.w / 2, o.h);
      h.lineTo(o.x + o.w / 2, o.h);
      h.lineTo(o.x + o.w / 2, 0.001);
      h.closePath();
      s.holes.push(h);
    }
    const front = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    front.translate(0, 0, -thick);
    // Side walls of the porch (same material, UVs in meters so the brick scale matches).
    const sideShape = new THREE.Shape();
    sideShape.moveTo(0, 0);
    sideShape.lineTo(PORCH_DEPTH + 0.2, 0);
    sideShape.lineTo(PORCH_DEPTH + 0.2, L.wallH);
    sideShape.lineTo(0, L.wallH);
    sideShape.closePath();
    const sides = [-1, 1].map((sgn) => {
      const g = new THREE.ExtrudeGeometry(sideShape, { depth: thick, bevelEnabled: false });
      g.rotateY(Math.PI / 2); // shape x → −z
      g.translate(sgn > 0 ? L.wallW / 2 - thick : -L.wallW / 2, 0, 0);
      return g;
    });
    const merged = mergeGeometries([front, ...sides], false) ?? front;
    if (merged !== front) [front, ...sides].forEach((g) => g.dispose());
    return merged;
  }, [L]);
  useEffect(() => () => wallGeo.dispose(), [wallGeo]);

  const wallMat = useMemo(() => {
    if (brickWall) return new THREE.MeshStandardMaterial({ map: brickTexture(1, 1, true), roughness: 0.92 });
    return new THREE.MeshStandardMaterial({ color: '#e4ddd0', roughness: 0.95 });
  }, [brickWall]);
  useEffect(
    () => () => {
      wallMat.map?.dispose();
      wallMat.dispose();
    },
    [wallMat],
  );

  const parts = useMemo<Part[]>(() => {
    const out: Part[] = [];
    const push = (geo: THREE.BufferGeometry, mat: string) => out.push({ geo, mat });
    const { wallW, wallH } = L;
    // Porch interior: ceiling, back house wall, roof slab, interior door.
    push(box(wallW, 0.08, PORCH_DEPTH, 0, wallH - 0.04, -PORCH_DEPTH / 2 - thick / 2), 'trim');
    push(box(wallW, wallH, 0.2, 0, wallH / 2, -PORCH_DEPTH - 0.1), 'interior');
    push(box(wallW + 0.5, 0.18, PORCH_DEPTH + 0.8, 0, wallH + 0.09, -PORCH_DEPTH / 2 + 0.2), 'roof');
    push(box(wallW + 0.5, 0.22, 0.05, 0, wallH + 0.07, 0.62), 'trim');
    const dw = 72 * IN;
    const dh = 82 * IN;
    push(box(dw, dh, 0.02, 0, dh / 2, -PORCH_DEPTH + 0.01), 'doorGlass');
    // Trim around openings by mounting surface.
    const tw = 4 * IN;
    for (const o of L.openings) {
      const mk = TRIM_MAT[o.mountedOn] ?? 'trim';
      if (mk) {
        push(box(tw, o.h + tw, 0.06, o.x - o.w / 2 - tw / 2 + 0.01, (o.h + tw) / 2, 0.03), mk);
        push(box(tw, o.h + tw, 0.06, o.x + o.w / 2 + tw / 2 - 0.01, (o.h + tw) / 2, 0.03), mk);
        push(box(o.w + 2 * tw, tw, 0.06, o.x, o.h + tw / 2, 0.03), mk);
      }
      // Screen, outside-mounted in front of the opening.
      const frameKey = pcKey(colorHex(design.frameColor));
      const fabKey = fabricKey(colorHex(design.fabricColor), design.fabric);
      const local: Part[] = [];
      buildScreen((g, k) => local.push({ geo: g, mat: k }), o.w + 3 * IN, o.h + 5 * IN, frameKey, fabKey, 0.85, 0);
      const m = new THREE.Matrix4().makeTranslation(o.x, 0, 0.12);
      for (const p of local) push(p.geo.applyMatrix4(m), p.mat);
    }
    // Porch floor (slightly darker pavers look via interior color).
    push(plane(wallW, PORCH_DEPTH, 0, 0, 0).rotateX(-Math.PI / 2).translate(0, 0.006, -PORCH_DEPTH / 2), 'interior');
    return out;
  }, [L, design.frameColor, design.fabricColor, design.fabric]);

  const dims = useMemo<DimSpec[]>(
    () =>
      L.openings.map((o, i) => ({
        a: [o.x - o.w / 2, o.h * 0.62, 0.45],
        b: [o.x + o.w / 2, o.h * 0.62, 0.45],
        tick: [0, 0.08, 0],
        label: `${ftIn(design.openings[i]?.width ?? o.w / IN)} × ${ftIn(design.openings[i]?.height ?? o.h / IN)}`,
        at: [o.x, o.h * 0.62 + 0.2, 0.45],
      })),
    [L, design.openings],
  );

  return (
    <group userData={{ arRoot: true }}>
      <mesh geometry={wallGeo} material={wallMat} castShadow receiveShadow userData={{ arSkip: true }} />
      <MergedMeshes parts={parts} />
      <group userData={{ arSkip: true }}>
        {showDims && <DimensionSet dims={dims} scale={Math.max(L.wallW, L.wallH) * 0.8} />}
      </group>
    </group>
  );
}
