/** Bindings and variables for the Pages Functions. See .env.example and wrangler.toml. */
export interface Env {
  /** KV namespace for saved designs, snapshots and rate-limit counters. Optional. */
  DESIGNS?: KVNamespace;
  /** Resend API key (secret). Without it no email is sent. */
  RESEND_API_KEY?: string;
  /** Verified sender, e.g. "99 Pergolas <designs@99pergolas.com>". */
  FROM_EMAIL?: string;
  /** Comma list of sales inboxes. */
  LEAD_TO?: string;
  /** Optional comma list BCC'd on sales notifications. */
  LEAD_BCC?: string;
  /** Reply-To for customer confirmations (default: first LEAD_TO). */
  REPLY_TO?: string;
  /** "false" disables the customer confirmation email. */
  SEND_CUSTOMER_EMAIL?: string;
  /** Comma list of origins allowed to POST cross-origin (same-origin is always allowed). */
  ALLOWED_ORIGINS?: string;
  /** Public origin of the designer, e.g. https://design.99pergolas.com (default: request origin). */
  PUBLIC_BASE_URL?: string;
  /** Optional Zapier/Make/n8n catch hook; receives the full lead JSON. */
  ZAPIER_WEBHOOK_URL?: string;
  /** Optional shared secret sent as X-Webhook-Secret to the webhook. */
  WEBHOOK_SECRET?: string;
  /** Optional HubSpot Forms v3 (unauthenticated) submission. */
  HUBSPOT_PORTAL_ID?: string;
  HUBSPOT_FORM_GUID?: string;
  /** Max lead submissions per IP per 10 minutes (default 5). */
  RATE_LIMIT?: string;
}

export const DEFAULT_ALLOWED_ORIGINS = 'https://99pergolas.com,https://www.99pergolas.com';
