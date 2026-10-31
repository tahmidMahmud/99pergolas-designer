/**
 * Sun (suncalc, Dallas TX, June 21 at view.hour), hemisphere fill, PMREM room environment for
 * subtle reflections, gradient backdrop + fog that blend into the bone (#F2F1EC) viewer card.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import * as SunCalc from 'suncalc';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useDesigner } from '../state/store';
import { nightFactor } from './layout';
import { gradientTexture } from './textures';
import { smoothstep } from './units';

const LAT = 32.78;
const LNG = -96.8;

/** Sun direction in scene space (unit vector toward the sun). Front (+z) faces south, west = −x. */
export function sunDirection(hour: number): { dir: THREE.Vector3; altitude: number } {
  const h = Math.floor(hour);
  const min = Math.round((hour - h) * 60);
  // June 21 local CDT (UTC−5).
  const date = new Date(Date.UTC(2026, 5, 21, h + 5, min));
  // suncalc 2.x: degrees; azimuth is north-based clockwise (0 = N, 90 = E, 180 = S, 270 = W).
  const p = SunCalc.getPosition(date, LAT, LNG);
  const alt = (Math.max(p.altitude, 3.5) * Math.PI) / 180;
  const az = (p.azimuth * Math.PI) / 180;
  // Scene: north = −z, east = +x.
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)).normalize();
  return { dir, altitude: (p.altitude * Math.PI) / 180 };
}

export interface LightingProps {
  /** Bounding half-extent of the subject in meters (for the shadow frustum). */
  radius: number;
  /** Height of the tallest shadow caster, meters. */
  height: number;
}

const DAY = { top: '#e6eae9', bottom: '#f2f1ec', fog: '#f2f1ec' };
const NIGHT = { top: '#0b1222', bottom: '#1b2436', fog: '#1b2436' };

export function Lighting({ radius, height }: LightingProps) {
  const hour = useDesigner((s) => s.view.hour);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const light = useRef<THREE.DirectionalLight>(null);
  const night = nightFactor(hour);

  // Environment map for soft reflections (procedural, no network).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    room.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    });
    pmrem.dispose();
    invalidate();
    return () => {
      if (scene.environment === env) scene.environment = null;
      env.dispose();
    };
  }, [gl, scene, invalidate]);

  // Backdrop + fog follow day/night.
  const isDark = night > 0.5;
  useEffect(() => {
    const pal = isDark ? NIGHT : DAY;
    const bg = gradientTexture(pal.top, pal.bottom);
    scene.background = bg;
    scene.fog = new THREE.Fog(pal.fog, radius * 3.5, radius * 10);
    invalidate();
    return () => {
      bg.dispose();
    };
  }, [isDark, scene, radius, invalidate]);

  const sun = useMemo(() => sunDirection(hour), [hour]);
  const altDeg = (sun.altitude * 180) / Math.PI;
  const dayK = smoothstep(-2, 12, altDeg) * (1 - night);
  const warm = smoothstep(4, 35, altDeg);
  const sunColor = new THREE.Color('#ffc794').lerp(new THREE.Color('#fffaf4'), warm);
  const sunI = night > 0.99 ? 0.7 : 2.5 * dayK + 0.5 * night;
  const color = night > 0.99 ? new THREE.Color('#9fb4ff') : sunColor;

  // Moonlight comes from a fixed high direction at night so shadows stay readable.
  const moon = night > 0.99;
  const dir = useMemo(() => (moon ? new THREE.Vector3(0.35, 0.8, 0.45).normalize() : sun.dir), [moon, sun]);

  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    // Center the shadow frustum on the structure plus half its shadow throw.
    const tanAlt = Math.max(0.12, dir.y / Math.hypot(dir.x, dir.z));
    const throwLen = Math.min(height / tanAlt, radius * 2.5);
    const horiz = new THREE.Vector3(-dir.x, 0, -dir.z).normalize().multiplyScalar(throwLen / 2);
    l.target.position.copy(horiz);
    l.target.updateMatrixWorld();
    l.position.copy(horiz).addScaledVector(dir, 40);
    const half = radius * 1.2 + throwLen / 2 + 0.5;
    const cam = l.shadow.camera;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 1;
    cam.far = 90;
    cam.updateProjectionMatrix();
    l.shadow.needsUpdate = true;
    invalidate();
  }, [dir, radius, height, invalidate]);

  return (
    <>
      <hemisphereLight args={[night > 0.5 ? '#5a6ea8' : '#ffffff', night > 0.5 ? '#1c2232' : '#d6d2c8', night > 0.5 ? 0.6 : 0.85]} />
      <ambientLight intensity={0.08 + 0.1 * (1 - night)} />
      <directionalLight
        ref={light}
        color={color}
        intensity={sunI}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
      <EnvIntensity value={0.32 * (1 - night) + 0.05} />
    </>
  );
}

function EnvIntensity({ value }: { value: number }) {
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    scene.environmentIntensity = value;
    invalidate();
  }, [scene, value, invalidate]);
  return null;
}
