/** Procedural house wall behind the back edge: brick-ish texture, eave, patio door and windows. */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { box, type Part } from './parts';
import { brickTexture } from './textures';
import { MergedMeshes } from './MergedMeshes';
import { IN } from './units';

export function House({ width, backZ, structureTop }: { width: number; backZ: number; structureTop: number }) {
  const wallW = Math.max(width + 5, 9);
  const wallH = Math.max(structureTop + 0.9, 3.4);
  const thick = 0.3;

  const brick = useMemo(() => {
    const tex = brickTexture(wallW, wallH);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 });
  }, [wallW, wallH]);
  useEffect(
    () => () => {
      brick.map?.dispose();
      brick.dispose();
    },
    [brick],
  );

  const parts = useMemo<Part[]>(() => {
    const out: Part[] = [];
    const zf = backZ; // wall face
    // Eave: fascia + overhang roof slab + soffit.
    out.push({ geo: box(wallW + 0.6, 0.22, 0.08, 0, wallH + 0.1, zf + 0.62), mat: 'trim' });
    out.push({ geo: box(wallW + 0.6, 0.1, 0.7, 0, wallH + 0.02, zf + 0.3), mat: 'trim' });
    out.push({ geo: box(wallW + 0.7, 0.08, 2.2, 0, wallH + 0.48, zf - 0.4, 0.38, 0, 0), mat: 'roof' });
    // Patio door (sliding, 72" × 82") centered, plus two windows if the wall is wide enough.
    const dw = 72 * IN;
    const dh = 82 * IN;
    const dz = zf + 0.012;
    out.push({ geo: box(dw, dh, 0.02, 0, dh / 2, dz), mat: 'doorGlass' });
    const tr = 2.5 * IN;
    out.push({ geo: box(dw + 2 * tr, tr, 0.05, 0, dh + tr / 2, dz), mat: 'trim' });
    for (const s of [-1, 1]) out.push({ geo: box(tr, dh, 0.05, s * (dw / 2 + tr / 2), dh / 2, dz), mat: 'trim' });
    out.push({ geo: box(1.5 * IN, dh, 0.04, 0, dh / 2, dz + 0.005), mat: 'trim' });
    const ww = 36 * IN;
    const wh = 48 * IN;
    const wy = 36 * IN + wh / 2;
    const wx = Math.min(width / 2 + 0.9, wallW / 2 - 0.8);
    if (wx > dw / 2 + ww / 2 + 0.4) {
      for (const s of [-1, 1]) {
        out.push({ geo: box(ww, wh, 0.02, s * wx, wy, dz), mat: 'doorGlass' });
        out.push({ geo: box(ww + 2 * tr, tr, 0.05, s * wx, wy + wh / 2 + tr / 2, dz), mat: 'trim' });
        out.push({ geo: box(ww + 4 * tr, tr * 1.2, 0.08, s * wx, wy - wh / 2 - tr / 2, dz), mat: 'trim' });
        for (const t of [-1, 1]) out.push({ geo: box(tr, wh, 0.05, s * wx + t * (ww / 2 + tr / 2), wy, dz), mat: 'trim' });
        out.push({ geo: box(ww, 1.2 * IN, 0.04, s * wx, wy, dz + 0.005), mat: 'trim' });
      }
    }
    return out;
  }, [wallW, wallH, backZ, width]);

  return (
    <group>
      <mesh position={[0, wallH / 2, backZ - thick / 2]} material={brick} castShadow receiveShadow>
        <boxGeometry args={[wallW, wallH, thick]} />
      </mesh>
      <MergedMeshes parts={parts} />
    </group>
  );
}
