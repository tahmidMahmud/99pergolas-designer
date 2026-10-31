/**
 * Email bodies (sales notification + customer confirmation). Pure string builders shared by
 * functions/api/lead.ts and scripts/dev-api.mjs (which writes an .html preview locally).
 * Inline styles only (email clients), table layout, brand colors.
 */
import type { LeadPayload, Estimate } from '../types';
import {
  BRAND,
  customerRows,
  designSizeLabel,
  designTitle,
  KIND_LABEL,
  money,
  moneyRange,
  specRows,
  type SpecRow,
} from './format.ts';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const C = BRAND.colors;
const FONT = "font-family:'Instrument Sans',Helvetica,Arial,sans-serif;";

export interface EmailContext {
  /** Short code, e.g. 7KX2QF (may be absent when KV is not bound). */
  id?: string;
  /** Link the customer and sales should click (short /d/ link when stored, else full URL). */
  shareUrl: string;
  /** Estimate actually shown in the email (server-recomputed when available). */
  estimate: Estimate;
  /** Note for sales when the server estimate differs from what the customer saw. */
  priceNote?: string;
  /** cid of the inline snapshot attachment, when attached. */
  snapshotCid?: string;
  /** Public URL of the snapshot (KV-backed /og/<code>) for clients that block cid images. */
  snapshotUrl?: string;
  receivedAt?: string;
  /** Contact Form 7 key/value block (from pipeline.prepareLead). */
  cf7?: { formId: string; fields: Record<string, string> };
}

export function salesSubject(p: LeadPayload): string {
  return `New design estimate request — ${p.site.name} — ${KIND_LABEL[p.design.kind]} ${designSizeLabel(p.design)}`;
}

export function customerSubject(p: LeadPayload): string {
  return `Your ${KIND_LABEL[p.design.kind].toLowerCase()} design — 99 Pergolas`;
}

function rowsTable(rows: SpecRow[], opts: { mono?: boolean } = {}): string {
  const td = `padding:7px 10px;border-bottom:1px solid #e4e2da;vertical-align:top;${FONT}font-size:14px;`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="${td}color:${C.muted};width:38%;${opts.mono ? 'font-family:Menlo,Consolas,monospace;font-size:12px;' : ''}">${escapeHtml(k)}</td><td style="${td}color:${C.text};${opts.mono ? 'font-family:Menlo,Consolas,monospace;font-size:12px;' : ''}">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>`;
}

function estimateTable(e: Estimate): string {
  const td = `padding:6px 10px;border-bottom:1px solid #e4e2da;${FONT}font-size:13px;color:${C.text};`;
  const rows = e.items
    .map(
      (it) =>
        `<tr><td style="${td}color:${C.muted};text-transform:capitalize;">${escapeHtml(it.group)}</td><td style="${td}">${escapeHtml(it.label)}${it.note ? `<br><span style="color:${C.muted};font-size:12px;">${escapeHtml(it.note)}</span>` : ''}</td><td style="${td}text-align:center;">${it.qty}</td><td style="${td}text-align:right;white-space:nowrap;">${escapeHtml(moneyRange(it.low, it.high))}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr><th align="left" style="${td}font-weight:600;">Group</th><th align="left" style="${td}font-weight:600;">Item</th><th style="${td}font-weight:600;">Qty</th><th align="right" style="${td}font-weight:600;">Range</th></tr>
${rows}
<tr><td colspan="3" style="${td}font-weight:700;">Estimated installed</td><td style="${td}text-align:right;font-weight:700;white-space:nowrap;">${escapeHtml(moneyRange(e.low, e.high))}</td></tr>
${e.monthly > 0 ? `<tr><td colspan="4" style="${td}color:${C.brassDeep};">0% financing from ${money(e.monthly)}/mo O.A.C. (${e.termMonths} months)</td></tr>` : ''}
</table>`;
}

function shell(inner: string, preheader: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bone};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bone};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:${C.dark};padding:20px 24px;">
<div style="font-family:Archivo,Helvetica,Arial,sans-serif;font-weight:800;letter-spacing:2px;font-size:20px;color:${C.bone};">99 PERGOLAS</div>
<div style="${FONT}font-size:13px;color:${C.brass};margin-top:4px;">Custom Design Spec</div>
</td></tr>
<tr><td style="padding:24px;">${inner}</td></tr>
<tr><td style="background:${C.dark2};padding:16px 24px;${FONT}font-size:12px;color:#c9c7bd;">
${BRAND.name} · <a href="${BRAND.phoneHref}" style="color:${C.brass};text-decoration:none;">${BRAND.phone}</a> · <a href="mailto:${BRAND.email}" style="color:${C.brass};text-decoration:none;">${BRAND.email}</a> · <a href="${BRAND.site}" style="color:${C.brass};text-decoration:none;">${BRAND.siteLabel}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function h2(t: string): string {
  return `<h2 style="font-family:Archivo,Helvetica,Arial,sans-serif;font-size:16px;color:${C.text};margin:22px 0 8px;">${escapeHtml(t)}</h2>`;
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${C.brass};color:#ffffff;${FONT}font-weight:600;font-size:14px;padding:12px 22px;border-radius:999px;text-decoration:none;">${escapeHtml(label)} &rarr;</a>`;
}

function snapshotImg(ctx: EmailContext): string {
  const src = ctx.snapshotCid ? `cid:${ctx.snapshotCid}` : ctx.snapshotUrl;
  if (!src) return '';
  return `<img src="${escapeHtml(src)}" alt="Design snapshot" width="592" style="display:block;width:100%;max-width:592px;height:auto;border-radius:10px;margin:0 0 8px;">`;
}

export function salesEmailHtml(p: LeadPayload, ctx: EmailContext): string {
  const { formId, fields } = ctx.cf7 ?? { formId: '', fields: {} };
  const src: SpecRow[] = [['Device', p.source.device]];
  if (p.source.page) src.push(['Page', p.source.page]);
  if (p.source.referrer) src.push(['Referrer', p.source.referrer]);
  for (const [k, v] of Object.entries(p.source.utm ?? {})) src.push([k, v]);
  if (ctx.receivedAt) src.push(['Received', ctx.receivedAt]);
  if (ctx.id) src.push(['Design code', ctx.id]);

  const inner = `
<p style="${FONT}font-size:15px;color:${C.text};margin:0 0 4px;"><strong>${escapeHtml(p.site.name)}</strong> requested a free estimate from the online designer.</p>
<p style="${FONT}font-size:14px;color:${C.muted};margin:0 0 16px;">${escapeHtml(designTitle(p.design))} · est. ${escapeHtml(moneyRange(ctx.estimate.low, ctx.estimate.high))}</p>
${snapshotImg(ctx)}
<p style="margin:12px 0 4px;">${button(ctx.shareUrl, 'Open the 3D design')}</p>
<p style="${FONT}font-size:12px;color:${C.muted};word-break:break-all;margin:6px 0 0;">${escapeHtml(ctx.shareUrl)}</p>
${h2('Customer')}
${rowsTable(customerRows(p.site))}
<p style="${FONT}font-size:13px;margin:8px 0 0;"><a href="tel:${escapeHtml(p.site.phone.replace(/[^\d+]/g, ''))}" style="color:${C.brassDeep};">Call</a> · <a href="mailto:${escapeHtml(p.site.email)}" style="color:${C.brassDeep};">Email</a> · Reply within one business day</p>
${h2('Design')}
${rowsTable(specRows(p.design))}
${h2('Estimate')}
${ctx.priceNote ? `<p style="${FONT}font-size:12px;color:#a04020;margin:0 0 8px;">${escapeHtml(ctx.priceNote)}</p>` : ''}
${estimateTable(ctx.estimate)}
<p style="${FONT}font-size:11px;color:${C.muted};margin:8px 0 0;">${escapeHtml(ctx.estimate.disclaimer)}</p>
${Object.keys(fields).length ? `${h2(`Form fields (CF7 #${formId})`)}${rowsTable(Object.entries(fields), { mono: true })}` : ''}
${h2('Source')}
${rowsTable(src)}`;
  return shell(inner, `${p.site.name} · ${designTitle(p.design)}`);
}

export function salesEmailText(p: LeadPayload, ctx: EmailContext): string {
  const { formId, fields } = ctx.cf7 ?? { formId: '', fields: {} };
  const lines = [
    `New design estimate request from ${p.site.name}`,
    designTitle(p.design),
    `Estimated installed: ${moneyRange(ctx.estimate.low, ctx.estimate.high)}`,
    ctx.priceNote ?? '',
    `Design: ${ctx.shareUrl}`,
    '',
    ...customerRows(p.site).map(([k, v]) => `${k}: ${v}`),
    '',
    ...specRows(p.design).map(([k, v]) => `${k}: ${v}`),
    '',
    ...ctx.estimate.items.map((i) => `- [${i.group}] ${i.label} x${i.qty}: ${moneyRange(i.low, i.high)}`),
    '',
    Object.keys(fields).length ? `CF7 #${formId}` : '',
    ...Object.entries(fields).map(([k, v]) => `${k}: ${v}`),
  ];
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

export function customerEmailHtml(p: LeadPayload, ctx: EmailContext): string {
  const first = p.site.name.split(/\s+/)[0] || p.site.name;
  const inner = `
<p style="${FONT}font-size:16px;color:${C.text};margin:0 0 12px;">Hi ${escapeHtml(first)},</p>
<p style="${FONT}font-size:15px;line-height:1.55;color:${C.text};margin:0 0 12px;">Thanks for designing your ${escapeHtml(KIND_LABEL[p.design.kind].toLowerCase())} with us. We have your design and a member of our team will reply within one business day to talk through it and set up your free on-site measure.</p>
${snapshotImg(ctx)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bone};border-radius:10px;margin:8px 0 16px;"><tr><td style="padding:14px 16px;${FONT}">
<div style="font-size:13px;color:${C.muted};">${escapeHtml(designTitle(p.design))}</div>
<div style="font-family:Archivo,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:${C.text};margin-top:4px;">${escapeHtml(moneyRange(ctx.estimate.low, ctx.estimate.high))}</div>
${ctx.estimate.monthly > 0 ? `<div style="font-size:13px;color:${C.brassDeep};margin-top:2px;">0% financing from ${money(ctx.estimate.monthly)}/mo O.A.C.</div>` : ''}
</td></tr></table>
<p style="margin:0 0 16px;">${button(ctx.shareUrl, 'View or edit your design')}</p>
<p style="${FONT}font-size:14px;line-height:1.55;color:${C.text};margin:0 0 12px;">Want to move faster? Call us at <a href="${BRAND.phoneHref}" style="color:${C.brassDeep};">${BRAND.phone}</a> or <a href="${BRAND.measureUrl}" style="color:${C.brassDeep};">book your measure</a> ($200, credited toward your project).</p>
<p style="${FONT}font-size:14px;color:${C.text};margin:0 0 16px;">Rain or shine, stay outside.<br>The 99 Pergolas team</p>
<p style="${FONT}font-size:11px;color:${C.muted};margin:0;">${escapeHtml(ctx.estimate.disclaimer)}</p>`;
  return shell(inner, 'We have your design. We will reply within one business day.');
}

export function customerEmailText(p: LeadPayload, ctx: EmailContext): string {
  const first = p.site.name.split(/\s+/)[0] || p.site.name;
  return [
    `Hi ${first},`,
    '',
    `Thanks for designing your ${KIND_LABEL[p.design.kind].toLowerCase()} with us. We have your design and will reply within one business day to set up your free on-site measure.`,
    '',
    `${designTitle(p.design)}: ${moneyRange(ctx.estimate.low, ctx.estimate.high)} estimated installed.`,
    `View or edit your design: ${ctx.shareUrl}`,
    '',
    `Questions? Call ${BRAND.phone} or email ${BRAND.email}.`,
    '',
    'The 99 Pergolas team',
    '',
    ctx.estimate.disclaimer,
  ].join('\n');
}
