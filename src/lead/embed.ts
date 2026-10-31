/**
 * Child side of the iframe bridge (parent side: embed/wordpress-snippet.html).
 *
 * - Posts `{type:'99p:height', height}` to the parent whenever the document height changes, so
 *   the Divi page can size the iframe (the parent clamps it to its viewport; the app keeps its
 *   own internal scroll + sticky viewer).
 * - Accepts `{type:'99p:hutk', value}` from the parent (HubSpot cookie) into lead attribution.
 * - Adds `embed` class on <html> when `?embed=1` or framed, for UI tweaks (e.g. hide header).
 * - `postToParent(type, data)` lets the UI tell the parent about events (e.g. '99p:lead' on submit
 *   for GA/Meta conversion tracking on the WordPress side).
 *
 * Call `initEmbedBridge()` once from main.tsx. Safe to call when not framed (no-op except class).
 */
import { setSourceValue } from './source.ts';

let started = false;

export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window || new URLSearchParams(location.search).get('embed') === '1';
  } catch {
    return true; // cross-origin access errors only happen when framed
  }
}

export function postToParent(type: string, data: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  try {
    // Height / event pings carry no personal data, so '*' is acceptable here.
    window.parent.postMessage({ type, ...data }, '*');
  } catch {
    /* ignore */
  }
}

export function initEmbedBridge(): () => void {
  if (typeof window === 'undefined' || started) return () => {};
  started = true;
  const framed = window.parent !== window;
  if (isEmbedded()) document.documentElement.classList.add('embed');
  if (!framed) return () => {};

  let last = 0;
  let raf = 0;
  const send = () => {
    raf = 0;
    const h = Math.ceil(
      Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0),
    );
    if (Math.abs(h - last) < 2) return;
    last = h;
    postToParent('99p:height', { height: h });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(send);
  };

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : undefined;
  ro?.observe(document.documentElement);
  if (document.body) ro?.observe(document.body);
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);

  const onMessage = (e: MessageEvent) => {
    if (e.source !== window.parent) return;
    const d = e.data as { type?: unknown; value?: unknown } | null;
    if (!d || typeof d !== 'object') return;
    if (d.type === '99p:hutk' && typeof d.value === 'string' && /^[a-f0-9]{16,64}$/i.test(d.value)) {
      setSourceValue('hutk', d.value);
    } else if (d.type === '99p:ping') {
      last = 0;
      schedule();
    }
  };
  window.addEventListener('message', onMessage);
  postToParent('99p:ready');
  schedule();

  return () => {
    ro?.disconnect();
    window.removeEventListener('load', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('message', onMessage);
    if (raf) cancelAnimationFrame(raf);
    started = false;
  };
}
