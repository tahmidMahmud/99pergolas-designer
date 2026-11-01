/**
 * Module-level registry filled by the mounted <Viewer>, so UI code can call captureSnapshot()
 * and fitCamera() without prop drilling. Only one Viewer is expected at a time.
 */
import { useSyncExternalStore } from 'react';
import type * as THREE from 'three';

interface Registry {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  invalidate: () => void;
  fit?: (instant?: boolean) => void;
}

let reg: Registry | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function registerScene(r: Registry | null): void {
  reg = r;
  emit();
}

/** The live scene graph (null until a Viewer is mounted). Used by AR export. */
export function getScene(): THREE.Scene | null {
  return reg?.scene ?? null;
}

export function registerFit(fn: ((instant?: boolean) => void) | undefined): void {
  if (reg) reg.fit = fn;
}

/** True once a Viewer canvas is mounted and ready to capture. */
export function useSceneReady(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => reg !== null,
    () => false,
  );
}

/** Re-frame the camera to the default 3/4 view of the current design. */
export function fitCamera(): void {
  reg?.fit?.();
  reg?.invalidate();
}

/**
 * PNG data URL of the current frame. Renders synchronously at up to 2× pixel ratio
 * (works with frameloop="demand" and preserveDrawingBuffer=false), then restores.
 */
export async function captureSnapshot(): Promise<string> {
  if (!reg) throw new Error('3D viewer is not mounted');
  const { gl, scene, camera, invalidate } = reg;
  const prev = gl.getPixelRatio();
  const canvas = gl.domElement;
  const cssW = canvas.clientWidth || canvas.width / prev;
  const cssH = canvas.clientHeight || canvas.height / prev;
  // Cap the long edge at 4096 px to stay inside mobile GPU limits.
  const ratio = Math.max(prev, Math.min(2, 4096 / Math.max(cssW, cssH)));
  try {
    if (ratio !== prev) gl.setPixelRatio(ratio);
    gl.render(scene, camera);
    return canvas.toDataURL('image/png');
  } finally {
    if (ratio !== prev) gl.setPixelRatio(prev);
    gl.render(scene, camera);
    invalidate();
  }
}
