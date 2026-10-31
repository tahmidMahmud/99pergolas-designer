/** OrbitControls + auto-framing to a pleasing 3/4 view; fitCamera() is registered for the UI. */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { registerFit } from './snapshot';

export interface Bounds {
  center: [number, number, number];
  radius: number;
}

const AZIMUTH = (34 * Math.PI) / 180; // toward the right of the front
const ELEVATION = (19 * Math.PI) / 180;

export function CameraRig({ bounds, frameKey }: { bounds: Bounds; frameKey: string }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const tween = useRef<{ t: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 } | null>(null);
  const first = useRef(true);
  const coarse = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches, []);

  const goal = useCallback(() => {
    const aspect = size.width > 0 && size.height > 0 ? size.width / size.height : camera.aspect || 1.5;
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const f = Math.min(vfov, hfov);
    const dist = (bounds.radius / Math.sin(f / 2)) * 1.08;
    const target = new THREE.Vector3(...bounds.center);
    const pos = new THREE.Vector3(
      Math.sin(AZIMUTH) * Math.cos(ELEVATION),
      Math.sin(ELEVATION),
      Math.cos(AZIMUTH) * Math.cos(ELEVATION),
    )
      .multiplyScalar(dist)
      .add(target);
    return { pos, target };
  }, [bounds, camera, size.width, size.height]);

  const fit = useCallback(
    (instant = false) => {
      const c = controls.current;
      const g = goal();
      if (instant || !c) {
        camera.position.copy(g.pos);
        camera.lookAt(g.target);
        if (c) {
          c.target.copy(g.target);
          c.update();
        }
        tween.current = null;
      } else {
        tween.current = { t: 0, fromPos: camera.position.clone(), toPos: g.pos, fromTarget: c.target.clone(), toTarget: g.target };
      }
      invalidate();
    },
    [goal, camera, invalidate],
  );

  useEffect(() => {
    registerFit(fit);
    return () => registerFit(undefined);
  }, [fit]);

  // Auto-frame when the size/kind changes (instant the first time, once the canvas has a size).
  const hasSize = size.width > 0 && size.height > 0;
  useEffect(() => {
    if (!hasSize) return;
    fit(first.current);
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey, hasSize]);

  useFrame((_, dt) => {
    const tw = tween.current;
    const c = controls.current;
    if (!tw || !c) return;
    tw.t = Math.min(1, tw.t + dt / 0.6);
    const e = 1 - Math.pow(1 - tw.t, 3);
    camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
    c.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
    c.update();
    if (tw.t >= 1) tween.current = null;
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      enablePan={!coarse}
      minPolarAngle={0.15}
      maxPolarAngle={1.45}
      minDistance={bounds.radius * 0.9}
      maxDistance={bounds.radius * 4.5}
      onStart={() => {
        tween.current = null;
      }}
    />
  );
}
