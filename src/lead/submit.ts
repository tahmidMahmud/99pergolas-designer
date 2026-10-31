/**
 * Client-side lead submission. Never throws.
 *
 *   const res = await submitLead(payload, { website: honeypotValue });
 *   if (res.ok) showThanks(res.shareUrl);
 *   else showError(res.error, res.mailto);   // offer "Email us instead" with res.mailto
 *
 * POSTs JSON to `${VITE_API_BASE ?? ''}/api/lead` (Cloudflare Pages Function in prod,
 * scripts/dev-api.mjs locally via the Vite proxy). The spec PDF is generated client-side and
 * attached (base64) so the server can email it without running jsPDF at the edge.
 */
import type { LeadPayload } from '../types';
import { designTitle, money, moneyRange, plainSummary, BRAND } from './format.ts';
import { captureSource } from './source.ts';
import { postToParent } from './embed.ts';

export interface SubmitResult {
  ok: boolean;
  /** Short design code, e.g. "7KX2QF". */
  id?: string;
  /** Short share link (https://design.99pergolas.com/d/7KX2QF) or the long URL. */
  shareUrl?: string;
  /** Human-readable error for the form. */
  error?: string;
  /** Per-field validation errors from the server (keys like "site.email"). */
  fieldErrors?: Record<string, string>;
  /** Ready-made mailto: link to offer when ok === false. */
  mailto?: string;
}

export interface SubmitOptions {
  /** Value of the hidden honeypot input named "website" (must be empty for humans). */
  website?: string;
  /** Attach the generated spec PDF (default true). */
  attachPdf?: boolean;
  /** Request timeout in ms (default 15000). */
  timeoutMs?: number;
}

const MAX_PDF_B64 = 5_000_000;

function apiBase(): string {
  try {
    const b = (import.meta.env?.VITE_API_BASE as string | undefined) ?? '';
    return b.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([p, new Promise<undefined>((r) => (t = setTimeout(() => r(undefined), ms)))]);
  } catch {
    return undefined;
  } finally {
    if (t) clearTimeout(t);
  }
}

async function makePdfBase64(payload: LeadPayload): Promise<string | undefined> {
  const { buildSpecPdf, blobToBase64 } = await import('./pdf.ts');
  const blob = await buildSpecPdf(payload);
  const b64 = await blobToBase64(blob);
  return b64.length <= MAX_PDF_B64 ? b64 : undefined;
}

export async function submitLead(payload: LeadPayload, opts: SubmitOptions = {}): Promise<SubmitResult> {
  const mailto = (() => {
    try {
      return mailtoFallback(payload);
    } catch {
      return `mailto:${BRAND.email}`;
    }
  })();
  try {
    const source = payload.source ?? captureSource();
    const pdf = opts.attachPdf === false ? undefined : await withTimeout(makePdfBase64(payload), 6000);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15_000);
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...payload, source, website: opts.website ?? '', ...(pdf ? { pdf } : {}) }),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON (HTML error page, proxy failure) */
    }

    if (res.ok && data.ok === true) {
      // Conversion ping for the WordPress parent page (GA4 generate_lead / Meta Lead). No PII.
      postToParent('99p:lead', {
        kind: payload.design.kind,
        value: Math.round((payload.estimate.low + payload.estimate.high) / 2),
        id: typeof data.id === 'string' ? data.id : undefined,
      });
      return {
        ok: true,
        id: typeof data.id === 'string' ? data.id : undefined,
        shareUrl: typeof data.shareUrl === 'string' ? data.shareUrl : payload.shareUrl,
      };
    }
    if (res.status === 400 || res.status === 422) {
      const fieldErrors =
        data.errors && typeof data.errors === 'object' ? (data.errors as Record<string, string>) : undefined;
      return {
        ok: false,
        error:
          (typeof data.error === 'string' && data.error) || 'Please check the highlighted fields and try again.',
        fieldErrors,
        mailto,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        error: `Too many requests from this connection. Please call ${BRAND.phone} or email us instead.`,
        mailto,
      };
    }
    return {
      ok: false,
      error: `We couldn't send your design right now (error ${res.status}). Please email it to us instead or call ${BRAND.phone}.`,
      mailto,
    };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return {
      ok: false,
      error: aborted
        ? `The request timed out. Please email your design to us instead or call ${BRAND.phone}.`
        : `You appear to be offline. Please email your design to us instead or call ${BRAND.phone}.`,
      mailto,
    };
  }
}

/** Max length of the whole mailto: URL (some mail clients truncate around 2000). */
const MAILTO_MAX = 1800;

/**
 * mailto:info@99pergolas.com with a plain-text spec summary in the body, URL-encoded and kept
 * under 1800 characters total (lines are dropped from the end of the spec, keeping contact,
 * estimate and the design link).
 */
export function mailtoFallback(payload: LeadPayload): string {
  const subject = `Design estimate request - ${payload.site?.name || 'website'} - ${designTitle(payload.design)}`;
  const head = `mailto:${BRAND.email}?subject=${encodeURIComponent(subject)}&body=`;
  const full = plainSummary(payload);
  const enc = encodeURIComponent;

  let body = full;
  if ((head + enc(body)).length <= MAILTO_MAX) return head + enc(body);

  // Keep the essentials; trim the spec section line by line.
  const essentials = [
    designTitle(payload.design),
    `Name: ${payload.site?.name ?? ''}`,
    `Phone: ${payload.site?.phone ?? ''}`,
    `Email: ${payload.site?.email ?? ''}`,
    payload.site?.zip ? `ZIP: ${payload.site.zip}` : '',
    `Estimated installed: ${moneyRange(payload.estimate.low, payload.estimate.high)}`,
    payload.estimate.monthly > 0 ? `From ${money(payload.estimate.monthly)}/mo O.A.C.` : '',
  ].filter(Boolean);
  const link = payload.shareUrl ? `Design link: ${payload.shareUrl}` : '';
  const specLines = full.split('\n').filter((l) => l && !essentials.includes(l) && l !== link);

  const build = (n: number) => [...essentials, link, '', ...specLines.slice(0, n)].filter((l, i) => l || i > 0).join('\n');
  let n = specLines.length;
  while (n > 0 && (head + enc(build(n))).length > MAILTO_MAX) n--;
  body = build(n);
  if ((head + enc(body)).length > MAILTO_MAX) {
    // Even the essentials are too long (huge share URL): drop the link, then hard-truncate.
    body = essentials.join('\n');
    while ((head + enc(body)).length > MAILTO_MAX && body.length > 10) body = body.slice(0, -10);
  }
  return head + enc(body);
}
