/**
 * POST /api/lead — receive a LeadPayload from the designer.
 *
 * 1. CORS (same-origin + ALLOWED_ORIGINS), size + JSON checks, manual validation (src/lead/validate.ts)
 * 2. Honeypot `website` → silently "succeed"; per-IP rate limit (KV, 5 / 10 min)
 * 3. Clamp + recompute the estimate server-side (src/config via src/lead/pipeline.ts)
 * 4. Save {design, view, estimate, createdAt} under a 6-char code in KV `DESIGNS` (+ snapshot image)
 * 5. Email sales (Resend) with spec, estimate, CF7 key/value block, inline snapshot, PDF;
 *    optional Zapier-style webhook and HubSpot Forms v3; customer confirmation in the background
 * 6. → { ok: true, id, shareUrl }
 *
 * Response errors: 400 bad JSON, 403 origin, 413 too large, 422 validation {errors}, 429 rate limit,
 * 502 every configured delivery channel failed (client then offers the mailto fallback).
 */
import type { LeadPayload } from '../../src/types';
import { validateLead } from '../../src/lead/validate.ts';
import { newCode, prepareLead } from '../../src/lead/pipeline.ts';
import {
  customerEmailHtml,
  customerEmailText,
  customerSubject,
  salesEmailHtml,
  salesEmailText,
  salesSubject,
  type EmailContext,
} from '../../src/lead/email.ts';
import { plainSummary } from '../../src/lead/format.ts';
import type { Env } from '../_lib/env';
import { baseUrl, clientIp, corsHeaders, corsOrigin, json, list } from '../_lib/http';
import { rateLimited, saveDesign, saveImage, uniqueCode } from '../_lib/store';
import { postWebhook, sendResend, submitHubspot, type Attachment } from '../_lib/deliver';

const MAX_BODY = 10 * 1024 * 1024;
const MAX_PDF_B64 = 7_000_000;

export const onRequestOptions: PagesFunction<Env> = async ({ request, env }) => {
  const origin = corsOrigin(request, env);
  if (origin === null) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = corsOrigin(request, env);
  if (origin === null) return json({ ok: false, error: 'Origin not allowed.' }, 403);
  const cors = corsHeaders(origin);

  const len = Number(request.headers.get('Content-Length') ?? '0');
  if (len > MAX_BODY) return json({ ok: false, error: 'Request too large.' }, 413, cors);

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return json({ ok: false, error: 'Request too large.' }, 413, cors);
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'Invalid JSON.' }, 400, cors);
  }

  const v = validateLead(body);
  if (!v.ok) {
    return json({ ok: false, error: 'Please check the highlighted fields.', errors: v.errors }, 422, cors);
  }
  const base = baseUrl(request, env);
  const kv = env.DESIGNS;

  if (v.honeypot) {
    // Bots get a convincing success and nothing else happens.
    console.log('lead: honeypot hit', clientIp(request));
    return json({ ok: true, id: newCode(), shareUrl: `${base}/` }, 200, cors);
  }

  if (await rateLimited(kv, clientIp(request), Number(env.RATE_LIMIT) || 5)) {
    return json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' }, 429, cors);
  }

  const payload = v.payload;
  const prepared = prepareLead(payload, base);
  const createdAt = new Date().toISOString();

  // ---- Persist ------------------------------------------------------------------------------
  let id: string;
  let shareUrl = prepared.longUrl;
  let snapshotUrl: string | undefined;
  if (kv) {
    try {
      id = await uniqueCode(kv);
      const hasImage = payload.snapshot ? await saveImage(kv, id, payload.snapshot).catch(() => false) : false;
      await saveDesign(kv, id, {
        design: prepared.design,
        ...(payload.view ? { view: payload.view } : {}),
        estimate: prepared.estimate,
        createdAt,
        hasImage,
      });
      shareUrl = `${base}/d/${id}`;
      if (hasImage) snapshotUrl = `${base}/og/${id}`;
    } catch (e) {
      console.error('lead: KV save failed', e);
      id = newCode();
    }
  } else {
    id = newCode();
  }

  const lead: LeadPayload = { ...payload, design: prepared.design, estimate: prepared.estimate, shareUrl };

  // ---- Attachments --------------------------------------------------------------------------
  const attachments: Attachment[] = [];
  let snapshotCid: string | undefined;
  const snap = payload.snapshot && /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(payload.snapshot);
  if (snap) {
    snapshotCid = 'design-snapshot';
    attachments.push({
      filename: `design-${id}.${snap[2] === 'jpeg' ? 'jpg' : snap[2]}`,
      content: snap[3],
      content_id: snapshotCid,
      content_type: snap[1],
    });
  }
  const pdf = (body as { pdf?: unknown }).pdf;
  if (typeof pdf === 'string' && pdf.startsWith('JVBER') && pdf.length <= MAX_PDF_B64 && /^[A-Za-z0-9+/=]+$/.test(pdf)) {
    attachments.push({ filename: `99-pergolas-design-${id}.pdf`, content: pdf, content_type: 'application/pdf' });
  }

  const ctx: EmailContext = {
    id,
    shareUrl,
    estimate: prepared.estimate,
    priceNote: prepared.priceNote,
    snapshotCid,
    snapshotUrl,
    receivedAt: createdAt,
    cf7: prepared.cf7,
  };

  // ---- Deliver ------------------------------------------------------------------------------
  const to = list(env.LEAD_TO);
  const channels: { name: string; run: Promise<{ ok: boolean; error?: string }> }[] = [];
  if (env.RESEND_API_KEY && to.length) {
    channels.push({
      name: 'sales-email',
      run: sendResend(env, {
        to,
        bcc: list(env.LEAD_BCC),
        replyTo: `${lead.site.name.replace(/[<>",]/g, '')} <${lead.site.email}>`,
        subject: salesSubject(lead),
        html: salesEmailHtml(lead, ctx),
        text: salesEmailText(lead, ctx),
        attachments,
      }),
    });
  }
  if (env.ZAPIER_WEBHOOK_URL) {
    const { snapshot: _omit, ...rest } = lead;
    void _omit;
    channels.push({
      name: 'webhook',
      run: postWebhook(env, {
        id,
        createdAt,
        ...rest,
        longUrl: prepared.longUrl,
        snapshotUrl,
        priceNote: prepared.priceNote,
        cf7FormId: prepared.cf7.formId,
        cf7: prepared.cf7.fields,
        summary: plainSummary(lead),
      }),
    });
  }
  if (env.HUBSPOT_PORTAL_ID && env.HUBSPOT_FORM_GUID) {
    channels.push({
      name: 'hubspot',
      run: submitHubspot(env, lead, { message: `${plainSummary(lead)}\nCode: ${id}` }),
    });
  }

  const results = await Promise.all(channels.map((c) => c.run));
  results.forEach((r, i) => {
    if (!r.ok) console.error(`lead ${id}: ${channels[i].name} failed: ${r.error}`);
  });
  const delivered = results.some((r) => r.ok);

  if (channels.length && !delivered) {
    return json(
      { ok: false, error: 'We could not deliver your request. Please email or call us.', id },
      502,
      cors,
    );
  }
  if (!channels.length) {
    console.warn(`lead ${id}: no delivery channel configured (set RESEND_API_KEY + LEAD_TO)`);
    console.log(JSON.stringify({ id, site: lead.site, design: lead.design, estimate: lead.estimate, shareUrl }));
  }

  // ---- Customer confirmation (background) ---------------------------------------------------
  if (env.RESEND_API_KEY && env.SEND_CUSTOMER_EMAIL !== 'false') {
    context.waitUntil(
      sendResend(env, {
        to: [lead.site.email],
        replyTo: env.REPLY_TO || to[0],
        subject: customerSubject(lead),
        html: customerEmailHtml(lead, ctx),
        text: customerEmailText(lead, ctx),
        attachments,
      }).then((r) => {
        if (!r.ok) console.error(`lead ${id}: customer email failed: ${r.error}`);
      }),
    );
  }

  return json({ ok: true, id, shareUrl }, 200, cors);
};
