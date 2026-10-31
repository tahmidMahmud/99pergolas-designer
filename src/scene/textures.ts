/** Procedural CanvasTextures (no image files): brick wall and patio pavers. */
import * as THREE from 'three';

let brickCanvas: HTMLCanvasElement | null = null;
let paverCanvas: HTMLCanvasElement | null = null;

/** Deterministic PRNG so textures look the same on every load (stable snapshots). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shade(base: [number, number, number], k: number): string {
  return `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
}

/** 512×256 px tile = 4 bricks × 8 courses ≈ 1.08 m × 0.54 m. */
export const BRICK_TILE_M: [number, number] = [1.08, 0.54];
/** 512×512 px tile = 4 × 4 pavers (24" each) ≈ 2.4 m square. */
export const PAVER_TILE_M = 2.4;

function makeBrickCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  const r = rng(7);
  g.fillStyle = '#b9b1a3'; // mortar
  g.fillRect(0, 0, 512, 256);
  const rows = 8;
  const bh = 256 / rows;
  const bw = 128;
  const palette: [number, number, number][] = [
    [176, 160, 140],
    [160, 150, 136],
    [186, 172, 152],
    [150, 140, 128],
    [170, 152, 132],
  ];
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let i = -1; i < 5; i++) {
      const x = i * bw + off;
      const col = palette[Math.floor(r() * palette.length)];
      g.fillStyle = shade(col, 0.9 + r() * 0.18);
      g.fillRect(x + 3, row * bh + 3, bw - 6, bh - 6);
      // subtle speckle
      for (let k = 0; k < 18; k++) {
        g.fillStyle = `rgba(60,50,40,${0.05 + r() * 0.06})`;
        g.fillRect(x + 4 + r() * (bw - 10), row * bh + 4 + r() * (bh - 10), 2, 2);
      }
    }
  }
  return c;
}

function makePaverCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  const r = rng(11);
  g.fillStyle = '#aca79e'; // joints
  g.fillRect(0, 0, 512, 512);
  const n = 4;
  const s = 512 / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const k = 0.97 + r() * 0.05;
      g.fillStyle = shade([208, 204, 196], k);
      g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(90,80,70,${0.03 + r() * 0.05})`;
        g.fillRect(x * s + 3 + r() * (s - 8), y * s + 3 + r() * (s - 8), 2, 2);
      }
    }
  }
  return c;
}

function toTexture(canvas: HTMLCanvasElement, rx: number, ry: number): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(rx, ry);
  return t;
}

/** Brick texture repeated for a surface of w×h meters (UVs 0..1), or per-meter (UVs in meters) when perMeter. */
export function brickTexture(w: number, h: number, perMeter = false): THREE.CanvasTexture {
  brickCanvas ??= makeBrickCanvas();
  return perMeter
    ? toTexture(brickCanvas, 1 / BRICK_TILE_M[0], 1 / BRICK_TILE_M[1])
    : toTexture(brickCanvas, w / BRICK_TILE_M[0], h / BRICK_TILE_M[1]);
}

export function paverTexture(w: number, h: number): THREE.CanvasTexture {
  paverCanvas ??= makePaverCanvas();
  return toTexture(paverCanvas, w / PAVER_TILE_M, h / PAVER_TILE_M);
}

/** Vertical gradient for scene.background (screen-space). */
export function gradientTexture(top: string, bottom: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(0.6, bottom);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
