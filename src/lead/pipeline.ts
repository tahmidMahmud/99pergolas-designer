/**
 * Server-side lead preparation shared by functions/api/lead.ts and scripts/dev-api.mjs:
 * clamp the design to legal values, recompute the estimate with the same pure pricing code the
 * UI uses, rebuild the share URL on OUR origin (never echo a client-supplied link into emails),
 * and map to the Contact Form 7 field names.
 */
import type { Design, Estimate, LeadPayload, ViewState } from '../types';
import { clamp, designToCF7Fields, designToParams, estimate as computeEstimate } from '../config/index.ts';
import { DEFAULT_DISCLAIMER, moneyRange, TIMEFRAME_LABEL } from './format.ts';

export interface PreparedLead {
  design: Design;
  estimate: Estimate;
  /** Set when the client's displayed estimate differs materially from the server's. */
  priceNote?: string;
  /** Full design link on our origin: `${base}/?p=pergola&w=…`. */
  longUrl: string;
  /** Query string only (no leading ?), for /d/<code> redirects. */
  query: string;
  cf7: { formId: string; fields: Record<string, string> };
}

const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I L O U)

/** 6-char base32 short code from crypto.getRandomValues (~1.07e9 space). */
export function newCode(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b & 31];
  return s;
}

export const CODE_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

export function normalizeCode(raw: string | undefined | null): string | undefined {
  const c = (raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return CODE_RE.test(c) ? c : undefined;
}

export function designQuery(design: Design, view?: Partial<ViewState>): string {
  return designToParams(design, view).toString();
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > Math.max(500, 0.05 * Math.max(a, b));
}

export function prepareLead(p: LeadPayload, base: string): PreparedLead {
  const design = clamp(p.design);
  let est: Estimate;
  let priceNote: string | undefined;
  try {
    est = computeEstimate(design);
    if (differs(est.low, p.estimate.low) || differs(est.high, p.estimate.high)) {
      priceNote = `Customer saw ${moneyRange(p.estimate.low, p.estimate.high)}; server recomputed ${moneyRange(est.low, est.high)} (shown below). Check the design link.`;
    }
  } catch (e) {
    est = { ...p.estimate, disclaimer: p.estimate.disclaimer || DEFAULT_DISCLAIMER };
    priceNote = `Server could not recompute the estimate (${e instanceof Error ? e.message : 'error'}); showing the customer's figures.`;
  }
  if (!est.disclaimer) est = { ...est, disclaimer: DEFAULT_DISCLAIMER };

  const view = p.view ? { ...p.view, step: 'review' as const } : { step: 'review' as const };
  const query = designQuery(design, view);
  const root = base.replace(/\/+$/, '');

  const raw = designToCF7Fields(design, p.site, {
    date: p.site.timeframe ? TIMEFRAME_LABEL[p.site.timeframe] : '',
  });
  const fields: Record<string, string> = {};
  let formId = '';
  for (const [k, v] of Object.entries(raw)) {
    const val = Array.isArray(v) ? v.join(', ') : v;
    if (k === '_wpcf7') formId = val;
    else if (val) fields[k] = val;
  }
  if (p.site.notes && !fields['additional-notes'] && !fields['your-message']) fields['additional-notes'] = p.site.notes;

  return { design, estimate: est, priceNote, longUrl: `${root}/?${query}`, query, cf7: { formId, fields } };
}
