/**
 * Attribution capture: UTM / click ids / referrer / device / page.
 *
 * Inside the WordPress iframe, the parent page passes its own params two ways (see
 * embed/wordpress-snippet.html): plain `utm_*` / `gclid` / `fbclid` on the iframe src, and a
 * `?src=<json>` blob that also carries the parent page URL (`page`), the parent's referrer
 * (`ref`) and the HubSpot cookie (`hutk`). The parent may also postMessage
 * `{type:'99p:hutk', value}` later (see embed.ts).
 *
 * The UI rewrites the query string with design params via history.replaceState, which drops
 * utm_* — so the first read is cached in memory + sessionStorage at module load.
 */
import type { LeadPayload } from '../types';

type Source = LeadPayload['source'];

const KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'ttclid',
  'hutk',
] as const;

const STORE_KEY = '99p:source';
let cached: Source | undefined;

function safeSession(): Storage | undefined {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

function detectDevice(): Source['device'] {
  if (typeof window === 'undefined') return 'desktop';
  try {
    if (window.matchMedia?.('(max-width: 900px)').matches) return 'mobile';
  } catch {
    /* ignore */
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  // iPadOS reports as Mac; treat touch-first coarse pointers as mobile.
  try {
    if (navigator.maxTouchPoints > 1 && window.matchMedia?.('(pointer: coarse)').matches) return 'mobile';
  } catch {
    /* ignore */
  }
  return 'desktop';
}

function parseSrcBlob(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const obj: unknown = JSON.parse(raw);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof v === 'string' && v && k.length <= 40) out[k] = v.slice(0, 500);
    }
    return out;
  } catch {
    return {};
  }
}

function readNow(): Source {
  const params = new URLSearchParams(location.search);
  const blob = parseSrcBlob(params.get('src'));
  const utm: Record<string, string> = {};
  for (const k of KEYS) {
    const v = params.get(k) ?? blob[k];
    if (v) utm[k] = v.slice(0, 300);
  }
  const inIframe = window.parent !== window;
  if (inIframe) utm.embed = '1';
  // Embedded via the snippet: the parent's own referrer is the real one (document.referrer is just the parent page).
  const referrer = (blob.page ? blob.ref : document.referrer) || undefined;
  const page = blob.page || location.origin + location.pathname;
  const src: Source = { device: detectDevice(), page };
  if (referrer) src.referrer = referrer;
  if (Object.keys(utm).length) src.utm = utm;
  return src;
}

/**
 * Capture once (on first import) and remember for the session. Earlier values win for UTM
 * keys (first touch within the session); device is re-detected each call.
 */
export function initSource(): Source {
  if (cached) return cached;
  if (typeof window === 'undefined' || typeof location === 'undefined') {
    cached = { device: 'desktop' };
    return cached;
  }
  let now: Source;
  try {
    now = readNow();
  } catch {
    now = { device: detectDevice() };
  }
  const ss = safeSession();
  try {
    const prev = ss?.getItem(STORE_KEY);
    if (prev) {
      const p = JSON.parse(prev) as Source;
      now = {
        ...now,
        referrer: p.referrer ?? now.referrer,
        page: p.page ?? now.page,
        utm: { ...(now.utm ?? {}), ...(p.utm ?? {}) },
      };
      if (now.utm && !Object.keys(now.utm).length) delete now.utm;
    }
    ss?.setItem(STORE_KEY, JSON.stringify(now));
  } catch {
    /* storage blocked (Safari iframe / private mode) — memory only */
  }
  cached = now;
  return now;
}

/** Add/overwrite one attribution value later (e.g. hutk posted from the parent page). */
export function setSourceValue(key: string, value: string): void {
  const s = initSource();
  s.utm = { ...(s.utm ?? {}), [key]: value.slice(0, 300) };
  try {
    safeSession()?.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Attribution for a LeadPayload. Never throws. */
export function captureSource(): Source {
  const s = initSource();
  return { ...s, device: detectDevice(), ...(s.utm ? { utm: { ...s.utm } } : {}) };
}

// Capture at import time, before the UI's URL sync rewrites location.search.
if (typeof window !== 'undefined') {
  try {
    initSource();
  } catch {
    /* ignore */
  }
}
