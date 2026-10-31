/** Louver blades: one InstancedMesh for all bays; angle animates toward view.louverAngle. */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { PergolaDesign } from '../types';
import { useDesigner } from '../state/store';
import type { PergolaLayout } from './layout';
import { colorHex, getMat, pcKey } from './materials';
import { IN } from './units';

const CLOSED_TILT = 2; // degrees, toward the gutter
const DEG = Math.PI / 180;

/** Unit-length blade: long axis X (length 1), chord along Z, thickness 0.9" along Y. Elliptic/airfoil-ish. */
function bladeGeometry(chord: number): THREE.BufferGeometry {
  const t = 0.9 * IN;
  const s = new THREE.Shape();
  // Lens with a fuller top and a flatter belly.
  const n = 16;
  for (let k = 0; k <= n; k++) {
    const a = Math.PI - (k / n) * Math.PI; // left → right across the top
    const x = Math.cos(a) * chord / 2;
    const y = Math.sin(a) * t * 0.6;
    if (k === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  for (let k = 1; k < n; k++) {
    const a = (k / n) * Math.PI;
    s.lineTo(Math.cos(a) * chord / 2, -Math.sin(a) * t * 0.4);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2); // extrusion → +X, chord → Z
  g.computeVertexNormals();
  return g;
}

interface Slot {
  x: number;
  y: number;
  z: number;
  len: number;
}

export function Louvers({ design, layout: L }: { design: PergolaDesign; layout: PergolaLayout }) {
  const target = useDesigner((s) => s.view.louverAngle);
  const invalidate = useThree((s) => s.invalidate);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const angle = useRef(target);

  const geo = useMemo(() => bladeGeometry(L.bladeW), [L.bladeW]);
  useEffect(() => () => geo.dispose(), [geo]);

  const slots = useMemo<Slot[]>(() => {
    const out: Slot[] = [];
    const y = L.H + L.bd * 0.62;
    for (const b of L.bays) {
      if (b.count <= 0) continue;
      const along = L.axis === 'x';
      // Blade ends tuck ~0.3" into the gutter channel so no light leaks at the ends.
      const len = (along ? b.x1 - b.x0 : b.z1 - b.z0) + 0.6 * IN;
      const stack0 = along ? b.z0 : b.x0;
      const stack1 = along ? b.z1 : b.x1;
      const mid = (stack0 + stack1) / 2;
      const span = (b.count - 1) * L.pitch;
      for (let k = 0; k < b.count; k++) {
        const s = mid - span / 2 + k * L.pitch;
        out.push(along ? { x: (b.x0 + b.x1) / 2, y, z: s, len } : { x: s, y, z: (b.z0 + b.z1) / 2, len });
      }
    }
    return out;
  }, [L]);

  const write = useMemo(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const qa = new THREE.Quaternion();
    const qt = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const X = new THREE.Vector3(1, 0, 0);
    const Y = new THREE.Vector3(0, 1, 0);
    qa.setFromAxisAngle(Y, L.axis === 'z' ? Math.PI / 2 : 0);
    return (deg: number) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const rot = Math.max(CLOSED_TILT, deg) * DEG;
      qt.setFromAxisAngle(X, rot);
      q.copy(qa).multiply(qt);
      slots.forEach((s, i) => {
        pos.set(s.x, s.y, s.z);
        scl.set(s.len, 1, 1);
        m.compose(pos, q, scl);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
  }, [slots, L.axis]);

  useLayoutEffect(() => {
    write(angle.current);
    invalidate();
  }, [write, invalidate]);

  // Kick the animation whenever the target changes.
  useEffect(() => {
    invalidate();
  }, [target, invalidate]);

  useFrame((_, dt) => {
    const diff = target - angle.current;
    if (Math.abs(diff) < 0.05) {
      if (angle.current !== target) {
        angle.current = target;
        write(target);
      }
      return;
    }
    // Exponential ease: ~95% of the way in ~600 ms.
    angle.current += diff * (1 - Math.exp(-5 * Math.min(dt, 0.05)));
    write(angle.current);
    invalidate();
  });

  const mat = getMat(pcKey(colorHex(design.louverColor, design.customRal)));
  if (!slots.length) return null;
  return <instancedMesh key={slots.length} ref={meshRef} args={[geo, mat, slots.length]} castShadow receiveShadow frustumCulled={false} />;
}
