/** Outbound integrations: Resend email, Zapier-style webhook, HubSpot Forms v3. */
import type { LeadPayload } from '../../src/types';
import type { Env } from './env';
import { list } from './http';

export interface Attachment {
  filename: string;
  /** base64, no data: prefix */
  content: string;
  /** Set for inline images referenced as cid:<content_id>. */
  content_id?: string;
  content_type?: string;
}

export interface MailInput {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string[];
  attachments?: Attachment[];
}

export async function sendResend(env: Env, mail: MailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) return { ok: false, error: 'resend not configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        ...(mail.bcc?.length ? { bcc: mail.bcc } : {}),
        ...(mail.attachments?.length ? { attachments: mail.attachments } : {}),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return res.ok ? { ok: true, id: data.id } : { ok: false, error: `resend ${res.status}: ${data.message ?? ''}` };
  } catch (e) {
    return { ok: false, error: `resend: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function postWebhook(env: Env, body: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!env.ZAPIER_WEBHOOK_URL) return { ok: false, error: 'webhook not configured' };
  try {
    const res = await fetch(env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.WEBHOOK_SECRET ? { 'X-Webhook-Secret': env.WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.ok ? { ok: true } : { ok: false, error: `webhook ${res.status}` };
  } catch (e) {
    return { ok: false, error: `webhook: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * HubSpot Forms API v3 (unauthenticated). Only standard contact properties are sent; the
 * HubSpot form must contain fields with these internal names (extra fields are rejected).
 */
export async function submitHubspot(
  env: Env,
  p: LeadPayload,
  extra: { message: string; pageUri?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!env.HUBSPOT_PORTAL_ID || !env.HUBSPOT_FORM_GUID) return { ok: false, error: 'hubspot not configured' };
  const [firstname, ...rest] = p.site.name.split(/\s+/);
  const fields = [
    ['email', p.site.email],
    ['firstname', firstname ?? ''],
    ['lastname', rest.join(' ')],
    ['phone', p.site.phone],
    ['zip', p.site.zip],
    ['city', p.site.city ?? ''],
    ['message', extra.message.slice(0, 65000)],
  ]
    .filter(([, v]) => v)
    .map(([name, value]) => ({ objectTypeId: '0-1', name, value }));
  const hutk = p.source.utm?.hutk;
  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(env.HUBSPOT_PORTAL_ID)}/${encodeURIComponent(env.HUBSPOT_FORM_GUID)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: {
            ...(hutk ? { hutk } : {}),
            pageUri: extra.pageUri ?? p.source.page ?? '',
            pageName: '99 Pergolas Designer',
          },
          legalConsentOptions: {
            consent: {
              consentToProcess: true,
              text: 'I agree to be contacted by 99 Pergolas about my estimate by phone, text or email.',
            },
          },
        }),
      },
    );
    return res.ok ? { ok: true } : { ok: false, error: `hubspot ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: `hubspot: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export { list };
