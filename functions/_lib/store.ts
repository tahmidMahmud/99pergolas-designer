/** KV helpers: saved designs, snapshots and the per-IP rate limit. All no-ops when KV is unbound. */
import type { Design, Estimate, ViewState } from '../../src/types';
import { newCode } from '../../src/lead/pipeline.ts';

export interface StoredDesign {
  design: Design;
  view?: Partial<ViewState>;
  estimate: Estimate;
  createdAt: string;
  /** True when a snapshot image is stored under img:<code>. */
  hasImage?: boolean;
}

const DESIGN_TTL = 60 * 60 * 24 * 730; // 2 years
const IMAGE_TTL = 60 * 60 * 24 * 365; // 1 year

export async function uniqueCode(kv: KVNamespace): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    if ((await kv.get(`d:${code}`)) === null) return code;
  }
  return newCode(8).slice(0, 6); // astronomically unlikely to reach here
}

export async function saveDesign(kv: KVNamespace, code: string, rec: StoredDesign): Promise<void> {
  await kv.put(`d:${code}`, JSON.stringify(rec), { expirationTtl: DESIGN_TTL });
}

export async function loadDesign(kv: KVNamespace | undefined, code: string): Promise<StoredDesign | null> {
  if (!kv) return null;
  return kv.get<StoredDesign>(`d:${code}`, 'json');
}

export function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; type: string } | null {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, type: m[1] };
}

export async function saveImage(kv: KVNamespace, code: string, dataUrl: string): Promise<boolean> {
  const img = dataUrlToBytes(dataUrl);
  if (!img) return false;
  await kv.put(`img:${code}`, img.bytes, { expirationTtl: IMAGE_TTL, metadata: { type: img.type } });
  return true;
}

/**
 * Fixed-window limiter: `limit` hits per 10 minutes per IP. KV is eventually consistent, so this
 * is a soft limit (good enough against form spam; Turnstile is the stronger option).
 */
export async function rateLimited(kv: KVNamespace | undefined, ip: string, limit: number): Promise<boolean> {
  if (!kv || !ip || ip === 'unknown') return false;
  const WINDOW = 600;
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const rec = await kv.get<{ n: number; t: number }>(key, 'json');
  if (rec && now - rec.t < WINDOW) {
    if (rec.n >= limit) return true;
    await kv.put(key, JSON.stringify({ n: rec.n + 1, t: rec.t }), { expirationTtl: Math.max(60, WINDOW - (now - rec.t)) });
    return false;
  }
  await kv.put(key, JSON.stringify({ n: 1, t: now }), { expirationTtl: WINDOW });
  return false;
}
