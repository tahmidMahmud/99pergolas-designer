import { describe, expect, it } from 'vitest';
import sample from '../../../scripts/sample-lead.json';
import type { LeadPayload } from '../../types';
import { designTitle, formatInches, money, specRows } from '../format.ts';
import { validateLead } from '../validate.ts';
import { mailtoFallback } from '../submit.ts';
import { CODE_RE, newCode, normalizeCode, prepareLead } from '../pipeline.ts';
import { customerEmailHtml, escapeHtml, salesEmailHtml, salesSubject } from '../email.ts';
import { buildSpecPdf } from '../pdf.ts';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const base = () => clone(sample) as unknown as LeadPayload & { website?: string };

describe('format', () => {
  it('formats inches as ft-in', () => {
    expect(formatInches(150)).toBe(`12' 6"`);
    expect(formatInches(144)).toBe(`12' 0"`);
    expect(formatInches(7.6)).toBe(`0' 8"`);
  });
  it('formats money', () => {
    expect(money(18400)).toBe('$18,400');
    expect(money(0)).toBe('$0');
    expect(money(NaN)).toBe('$0');
  });
  it('renders spec rows per kind', () => {
    const p = base();
    const rows = Object.fromEntries(specRows(p.design));
    expect(rows['Width x Length x Height']).toBe(`14' 0" x 16' 0" x 9' 0" clear`);
    expect(rows['Front side']).toContain('95% sun block');
    expect(rows['Louver color']).toContain('RAL 7016');
    expect(designTitle({ kind: 'kitchen', shape: 'l', length: 120, grill: true, fridge: false, sink: true, counter: 'quartz' })).toContain('L-shape');
  });
});

describe('validateLead', () => {
  it('accepts the sample payload and drops unknown keys', () => {
    const p = base() as unknown as Record<string, unknown>;
    (p.design as Record<string, unknown>).evil = 'x';
    const r = validateLead(p);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.honeypot).toBe(false);
      expect('evil' in r.payload.design).toBe(false);
      expect(r.payload.site.email).toBe('test.customer@example.com');
    }
  });
  it('rejects bad contact fields, consent and kind', () => {
    const p = base();
    p.site = { ...p.site, name: 'A', phone: '555-1234', email: 'nope', consent: false };
    (p.design as unknown as { kind: string }).kind = 'boat';
    const r = validateLead(p);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors)).toEqual(
        expect.arrayContaining(['site.name', 'site.phone', 'site.email', 'site.consent', 'design.kind']),
      );
    }
  });
  it('flags the honeypot', () => {
    const p = base();
    p.website = 'http://spam.example';
    const r = validateLead(p);
    expect(r.ok && r.honeypot).toBe(true);
  });
  it('rejects non-image snapshots and absurd sizes', () => {
    const p = base();
    p.snapshot = 'data:text/html;base64,PHNjcmlwdD4=';
    expect(validateLead(p).ok).toBe(false);
    const q = base();
    (q.design as { width: number }).width = 1e9;
    expect(validateLead(q).ok).toBe(false);
  });
  it('validates screens/shades/kitchen shapes', () => {
    const p = base();
    p.design = { kind: 'screens', openings: [{ width: 120, height: 96, mountedOn: 'brick' }], frameColor: 'black', fabricColor: 'grey', fabric: '95', windSensor: true, control: 'remote', projectType: 'residential' };
    expect(validateLead(p).ok).toBe(true);
    p.design = { kind: 'shades', windows: [], service: 'install' };
    expect(validateLead(p).ok).toBe(false);
  });
});

describe('mailtoFallback', () => {
  it('stays under 1800 chars and targets info@', () => {
    const p = base();
    p.site.notes = 'x'.repeat(3000);
    p.shareUrl = 'https://design.99pergolas.com/?' + 'a=1&'.repeat(150);
    const m = mailtoFallback(p);
    expect(m.startsWith('mailto:info@99pergolas.com?subject=')).toBe(true);
    expect(m.length).toBeLessThanOrEqual(1800);
    expect(decodeURIComponent(m)).toContain('Test Customer');
  });
  it('includes the full summary when short', () => {
    const p = base();
    p.site.notes = undefined;
    const body = decodeURIComponent(mailtoFallback(p).split('&body=')[1]);
    expect(body).toContain('Estimated installed:');
    expect(body).toContain('Front side:');
  });
});

describe('pipeline', () => {
  it('makes 6-char Crockford codes', () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(CODE_RE);
    expect(normalizeCode('zczx43')).toBe('ZCZX43');
    expect(normalizeCode('abc')).toBeUndefined();
  });
  it('recomputes the estimate server-side, builds our own URL and CF7 fields', () => {
    const p = base();
    const r = prepareLead(p, 'https://design.99pergolas.com/');
    expect(r.estimate.low).toBeGreaterThan(0);
    expect(r.estimate.high).toBeGreaterThanOrEqual(r.estimate.low);
    expect(r.priceNote).toBeTruthy(); // sample client estimate is deliberately off
    expect(r.longUrl.startsWith('https://design.99pergolas.com/?')).toBe(true);
    expect(r.cf7.formId).toBe('1643');
    expect(r.cf7.fields['model']).toBe('Lux Line');
    expect(r.cf7.fields['ms1-pcs']).toBe('1');
  });
});

describe('email', () => {
  it('escapes customer input and includes the CF7 block', () => {
    const p = base();
    p.site.name = '<img src=x onerror=alert(1)>';
    const prepared = prepareLead(p, 'https://design.99pergolas.com');
    const ctx = { id: 'ZCZX43', shareUrl: 'https://design.99pergolas.com/d/ZCZX43', estimate: prepared.estimate, cf7: prepared.cf7 };
    const html = salesEmailHtml(p, ctx);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain(escapeHtml('<img src=x onerror=alert(1)>'));
    expect(html).toContain('full-name');
    expect(customerEmailHtml(p, ctx)).toContain('one business day');
    expect(salesSubject(p)).toMatch(/^New design estimate request — .+ — Louvered pergola 14' 0" x 16' 0"$/);
  });
});

describe('pdf', () => {
  it('builds a PDF blob with a snapshot', async () => {
    const p = base();
    p.estimate = prepareLead(p, 'https://x.test').estimate;
    const blob = await buildSpecPdf(p);
    expect(blob.size).toBeGreaterThan(2000);
    const head = new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()).slice(0, 5));
    expect(head).toBe('%PDF-');
  });
});
