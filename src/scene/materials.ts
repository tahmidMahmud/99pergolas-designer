/** Shared, cached materials keyed by string. Powder coat = satin paint, never chrome. */
import * as THREE from 'three';
import type { ColorId, FabricId } from '../types';

export const COLOR_HEX: Record<Exclude<ColorId, 'custom'>, string> = {
  black: '#1d1f1e',
  grey: '#3b3f3e',
  white: '#f4f3ef',
  bronze: '#4a3f2f',
};
const CUSTOM_FALLBACK = '#6b6f6d';

/** Resolve a ColorId (+ optional custom RAL / hex) to an sRGB hex string. */
export function colorHex(id: ColorId | undefined, customRal?: string): string {
  if (!id) return COLOR_HEX.black;
  if (id !== 'custom') return COLOR_HEX[id] ?? COLOR_HEX.black;
  const s = (customRal ?? '').trim();
  if (/^#?[0-9a-f]{6}$/i.test(s)) return s.startsWith('#') ? s : `#${s}`;
  if (/^#?[0-9a-f]{3}$/i.test(s)) {
    const h = s.replace('#', '');
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return CUSTOM_FALLBACK;
}

export const FABRIC_OPACITY: Record<FabricId, number> = {
  blackout: 0.95,
  '99': 0.85,
  '97': 0.8,
  '95': 0.7,
  '90': 0.6,
  '70': 0.45,
  '60': 0.35,
};

export const pcKey = (hex: string) => `pc:${hex}`;
export const fabricKey = (hex: string, fabric: FabricId | undefined) => `fab:${hex}:${FABRIC_OPACITY[fabric ?? '95']}`;

const cache = new Map<string, THREE.Material>();

function create(key: string): THREE.Material {
  const [kind, a, b] = key.split(':');
  switch (kind) {
    case 'pc':
      return new THREE.MeshStandardMaterial({ color: a, roughness: 0.55, metalness: 0.15 });
    case 'fab': {
      const opacity = Number(b);
      return new THREE.MeshStandardMaterial({
        color: a,
        roughness: 0.92,
        metalness: 0,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    }
    case 'glass':
      return new THREE.MeshStandardMaterial({
        color: '#d6e6e8',
        roughness: 0.05,
        metalness: 0.2,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    case 'dark':
      return new THREE.MeshStandardMaterial({ color: '#191a1a', roughness: 0.6, metalness: 0.2 });
    case 'trim':
      return new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.75, metalness: 0 });
    case 'doorGlass':
      return new THREE.MeshStandardMaterial({ color: '#2a363b', roughness: 0.12, metalness: 0.45 });
    case 'wood':
      return new THREE.MeshStandardMaterial({ color: '#7d5a3a', roughness: 0.8, metalness: 0 });
    case 'alu':
      return new THREE.MeshStandardMaterial({ color: '#b8bbba', roughness: 0.45, metalness: 0.35 });
    case 'metal':
      return new THREE.MeshStandardMaterial({ color: '#55595a', roughness: 0.5, metalness: 0.4 });
    case 'stucco':
      return new THREE.MeshStandardMaterial({ color: '#e4ddd0', roughness: 0.95, metalness: 0 });
    case 'interior':
      return new THREE.MeshStandardMaterial({ color: '#cfc6b6', roughness: 0.95, metalness: 0 });
    case 'roof':
      return new THREE.MeshStandardMaterial({ color: '#4a4b48', roughness: 0.9, metalness: 0 });
    case 'fan':
      return new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.6, metalness: 0.2 });
    default:
      return new THREE.MeshStandardMaterial({ color: '#888888', roughness: 0.7 });
  }
}

export function getMat(key: string): THREE.Material {
  let m = cache.get(key);
  if (!m) {
    m = create(key);
    cache.set(key, m);
  }
  return m;
}

/** Fabric/glass are transparent: they should not write into the shadow map unless dense. */
export function castsShadow(key: string): boolean {
  if (key === 'glass') return false;
  if (key.startsWith('fab:')) return Number(key.split(':')[2]) >= 0.6;
  return true;
}
