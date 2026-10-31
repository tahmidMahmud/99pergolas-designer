/** LED warm strip, RGB gutter strip, ceiling fans, infrared heaters. */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { PergolaDesign } from '../types';
import { useDesigner } from '../state/store';
import type { PergolaLayout } from './layout';
import { isNight, nightFactor } from './layout';
import { box, cylinder, mergeByMaterial, normalize, type Part } from './parts';
import { getMat } from './materials';
import { MergedMeshes } from './MergedMeshes';
import { IN } from './units';

const LED_COLOR = '#ffd9a0';

/** Strip running around the four beams; `inset` > 0 = inside faces, < 0 = outside faces. */
function ringStrip(L: PergolaLayout, y: number, offset: number, size: number): THREE.BufferGeometry[] {
  const { W, D } = L;
  const zf = D / 2 - offset;
  const xr = W / 2 - offset;
  const lenX = W - 2 * offset;
  const lenZ = D - 2 * offset - 2 * size;
  return [
    box(lenX, size, size, 0, y, zf),
    box(lenX, size, size, 0, y, -zf),
    box(size, size, lenZ, xr, y, 0),
    box(size, size, lenZ, -xr, y, 0),
  ];
}

function LedWarm({ L, night }: { L: PergolaLayout; night: number }) {
  const geo = useMemo(() => {
    const m = mergeByMaterial(ringStrip(L, L.H + 0.45 * IN, L.bw + 0.3 * IN, 0.55 * IN).map((geo) => ({ geo, mat: 'led' })));
    return m.get('led')!;
  }, [L]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={LED_COLOR} emissive={LED_COLOR} emissiveIntensity={0.35 + night * 3.2} roughness={0.4} />
    </mesh>
  );
}

function RgbStrip({ L, night }: { L: PergolaLayout; night: boolean }) {
  const geo = useMemo(() => {
    const m = mergeByMaterial(ringStrip(L, L.top - 1.2 * IN, -0.45 * IN, 0.7 * IN).map((geo) => ({ geo, mat: 'rgb' })));
    return m.get('rgb')!;
  }, [L]);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#7a5cff', emissiveIntensity: 0.6, roughness: 0.5 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const hue = useRef(0.72);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    mat.emissiveIntensity = night ? 2.6 : 0.55;
    mat.emissive.setHSL(hue.current, 0.9, 0.55);
    invalidate();
  }, [mat, night, invalidate]);
  useFrame((_, dt) => {
    if (!night || document.hidden) return;
    hue.current = (hue.current + dt * 0.06) % 1;
    mat.emissive.setHSL(hue.current, 0.9, 0.55);
    invalidate();
  });
  return <mesh geometry={geo} material={mat} />;
}

function fanSpots(L: PergolaLayout, count: number): [number, number][] {
  const centers = L.bays.map((b) => [(b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2] as [number, number]);
  if (count <= centers.length) return centers.slice(0, count);
  // More fans than bays: spread evenly along the long axis through the middle.
  const alongX = L.W >= L.D;
  const span = (alongX ? L.W : L.D) - 2 * L.bw;
  return Array.from({ length: count }, (_, i) => {
    const t = -span / 2 + ((i + 0.5) * span) / count;
    return (alongX ? [t, 0] : [0, t]) as [number, number];
  });
}

function Fans({ L, count }: { L: PergolaLayout; count: number }) {
  const spots = useMemo(() => fanSpots(L, count), [L, count]);
  const hubY = L.H - 12 * IN; // hangs ~1' below the beams on a downrod
  const rotor = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [cylinder(3.6 * IN, 4 * IN, 0, 0, 0, 20)];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const r = 13 * IN;
      parts.push(box(22 * IN, 0.35 * IN, 5.5 * IN, Math.cos(a) * r, -0.8 * IN, -Math.sin(a) * r, 0, a, 0.08));
    }
    const m = mergeByMaterial(parts.map((geo) => ({ geo, mat: 'fan' })));
    return m.get('fan')!;
  }, []);
  useEffect(() => () => rotor.dispose(), [rotor]);
  const rods = useMemo<Part[]>(() => {
    const len = L.H + L.bd * 0.5 - hubY;
    return spots.map(([x, z]) => ({ geo: cylinder(0.6 * IN, len, x, hubY + len / 2, z, 8), mat: 'fan' }));
  }, [spots, L, hubY]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const invalidate = useThree((s) => s.invalidate);
  useFrame((_, dt) => {
    if (document.hidden) return;
    for (const m of refs.current) if (m) m.rotation.y += dt * 3.2;
    invalidate();
  });
  return (
    <group>
      <MergedMeshes parts={rods} />
      {spots.map(([x, z], i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={rotor}
          material={getMat('fan')}
          position={[x, hubY, z]}
          castShadow
        />
      ))}
    </group>
  );
}

function Heaters({ L, count, night }: { L: PergolaLayout; count: number; night: number }) {
  const parts = useMemo(() => {
    const { W, D, H, bw } = L;
    // Slots: under the back beam, then side beams, then the front beam.
    const slots: { x: number; z: number; ry: number }[] = [
      { x: -W / 4, z: -D / 2 + bw, ry: 0 },
      { x: W / 4, z: -D / 2 + bw, ry: 0 },
      { x: -W / 2 + bw, z: 0, ry: -Math.PI / 2 },
      { x: W / 2 - bw, z: 0, ry: Math.PI / 2 },
      { x: -W / 4, z: D / 2 - bw, ry: Math.PI },
      { x: W / 4, z: D / 2 - bw, ry: Math.PI },
    ];
    const out: Part[] = [];
    slots.slice(0, Math.min(count, slots.length)).forEach((s) => {
      // Local: x along beam, +z inward (under the roof), tilted 30° down toward the center.
      const m = new THREE.Matrix4().makeRotationY(s.ry).setPosition(s.x, H - 3.2 * IN, s.z);
      const body = box(30 * IN, 3.2 * IN, 4 * IN, 0, 0, 3 * IN, -0.5, 0, 0);
      const glow = box(27 * IN, 0.3 * IN, 2.6 * IN, 0, -1.7 * IN, 3.9 * IN, -0.5, 0, 0);
      const bracket = box(1 * IN, 3 * IN, 1 * IN, 0, 2 * IN, 1 * IN);
      out.push({ geo: body.applyMatrix4(m), mat: 'dark' });
      out.push({ geo: bracket.applyMatrix4(m), mat: 'dark' });
      out.push({ geo: glow.applyMatrix4(m), mat: 'heaterGlow' });
    });
    return out;
  }, [L, count]);
  const glowParts = useMemo(() => parts.filter((p) => p.mat === 'heaterGlow'), [parts]);
  const bodyParts = useMemo(() => parts.filter((p) => p.mat !== 'heaterGlow'), [parts]);
  const glowGeo = useMemo(() => {
    const m = mergeByMaterial(glowParts.map((p) => ({ geo: normalize(p.geo), mat: 'g' })));
    return m.get('g');
  }, [glowParts]);
  useEffect(() => () => glowGeo?.dispose(), [glowGeo]);
  return (
    <group>
      <MergedMeshes parts={bodyParts} />
      {glowGeo && (
        <mesh geometry={glowGeo}>
          <meshStandardMaterial color="#2a1a12" emissive="#ff6a2a" emissiveIntensity={0.15 + night * 1.6} />
        </mesh>
      )}
    </group>
  );
}

export function Accessories({ design, layout: L }: { design: PergolaDesign; layout: PergolaLayout }) {
  const hour = useDesigner((s) => s.view.hour);
  const night = nightFactor(hour);
  return (
    <group>
      {design.ledWarm && <LedWarm L={L} night={night} />}
      {design.rgb && <RgbStrip L={L} night={isNight(hour)} />}
      {/* Warm fill under the roof at night; always mounted so the light count (and shaders) never change. */}
      <pointLight
        position={[0, L.H - 0.15, 0]}
        color={LED_COLOR}
        intensity={design.ledWarm ? night * 6 * Math.max(1, (L.W * L.D) / 14) : 0}
        distance={Math.max(L.W, L.D) * 2.2}
        decay={1.6}
      />
      {design.fans > 0 && <Fans L={L} count={design.fans} />}
      {design.heaters > 0 && <Heaters L={L} count={design.heaters} night={night} />}
    </group>
  );
}
