# Deploying the 99 Pergolas designer

**Stack:** a static Vite build (`dist/`) plus Cloudflare Pages Functions (`functions/`) on one Cloudflare Pages project, with a KV namespace for saved designs and Resend for email. The free tiers cover expected lead volume.

```
design.99pergolas.com  (Cloudflare Pages)
  ├─ /                     static SPA (dist/)
  ├─ POST /api/lead        functions/api/lead.ts   → validate, recompute estimate, KV, Resend, webhook, HubSpot
  ├─ GET  /api/design/:code functions/api/design/[code].ts → saved design JSON
  ├─ GET  /d/:code         functions/d/[code].ts   → 302 to /?<design params> (OG preview HTML for link bots)
  └─ GET  /og/:code        functions/og/[code].ts  → stored snapshot PNG (og:image, email fallback)
99pergolas.com/design-your-pergola/   WordPress page with the iframe snippet (embed/README.md)
```

## 0. Prerequisites

- Node 22+ and npm.
- A Cloudflare account. The 99pergolas.com DNS already proxies through Cloudflare (responses show `server: cloudflare`). Find out who controls that zone, because GoDaddy Managed WordPress sometimes runs Cloudflare on its own account. If 99 Pergolas can't add records there, use GoDaddy DNS (step 5b).
- A Resend account (https://resend.com), plus access to add DNS records for 99pergolas.com.

## 1. Local development

```bash
npm install
npm run dev:api     # terminal 1: lead API mock on :8787 (scripts/dev-api.mjs)
npm run dev         # terminal 2: Vite on :5173; /api, /d/*, /og/* are proxied to :8787
```

The dev API uses the same validation, pricing and email templates as production. It sends no email. Each lead is written to `.leads/` (gitignored):
- `<time>-<code>.json`: the lead with the server estimate and CF7 fields
- `.sales.html` and `.customer.html`: open these in a browser to preview the emails
- `.png`: the snapshot
- `.pdf`: the spec sheet

```bash
curl -s -X POST localhost:8787/api/lead -H 'Content-Type: application/json' --data @scripts/sample-lead.json
# {"ok":true,"id":"ZCZX43","shareUrl":"http://localhost:5173/d/ZCZX43"}
```

Checks: `npm test`, `npm run typecheck`, `npm run typecheck:functions`.

## 2. Test the real Functions locally (wrangler)

```bash
npm run build
cp .env.example .dev.vars        # edit: put a real RESEND_API_KEY + your own LEAD_TO to test email
npm run preview:cf               # wrangler pages dev dist --kv DESIGNS  → http://localhost:8788
curl -s -X POST localhost:8788/api/lead -H 'Content-Type: application/json' --data @scripts/sample-lead.json
```

Wrangler simulates KV locally in `.wrangler/`, so `/d/<code>`, `/api/design/<code>` and the rate limit (5 per 10 min per IP) all work. With no `RESEND_API_KEY`, the function logs the lead and still returns `ok`.

## 3. Create the Pages project

**Option A: GitHub (recommended, auto-deploys on push)**
1. Push the repo to GitHub.
2. Go to **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git** and pick the repo.
3. Set **Framework preset** to *None*, **Build command** to `npm run build`, and **Build output** to `dist`.
4. Under **Environment variables (Production)**, set `NODE_VERSION` to `22`.
5. Save and deploy. Cloudflare reads `wrangler.toml`, picks up the `functions/` folder automatically, and serves the site at `pergola-designer.pages.dev`.

**Option B: CLI**
```bash
npx wrangler login
npm run build
npx wrangler pages project create pergola-designer --production-branch main
npx wrangler pages deploy dist
```

## 4. KV, variables and secrets

```bash
npx wrangler kv namespace create DESIGNS            # → copy the id into wrangler.toml [[kv_namespaces]] id
npx wrangler kv namespace create DESIGNS_PREVIEW    # → id for [[env.preview.kv_namespaces]]
```

Non-secret variables live in `wrangler.toml` under `[vars]` (production) and `[env.preview.vars]` (branch previews). The preview block sends leads to a test inbox and turns off customer emails.

| Variable | Example | Purpose |
|---|---|---|
| `FROM_EMAIL` | `99 Pergolas <designs@99pergolas.com>` | Sender. Its domain must be verified in Resend. |
| `LEAD_TO` | `info@99pergolas.com` | Sales inbox(es), comma-separated |
| `LEAD_BCC` | | Optional |
| `REPLY_TO` | `info@99pergolas.com` | Reply-To on the customer confirmation |
| `SEND_CUSTOMER_EMAIL` | `true` | `false` turns the confirmation off |
| `ALLOWED_ORIGINS` | `https://99pergolas.com,https://www.99pergolas.com` | Cross-origin POST allow-list. Same-origin is always allowed. |
| `PUBLIC_BASE_URL` | `https://design.99pergolas.com` | Origin used in share links and emails |
| `RATE_LIMIT` | `5` | Leads per IP per 10 minutes |
| `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_GUID` | | Optional HubSpot Forms v3 forward |

Secrets go through the CLI or **dashboard → Settings → Variables and Secrets → Encrypt**:

```bash
npx wrangler pages secret put RESEND_API_KEY        # re_...
npx wrangler pages secret put ZAPIER_WEBHOOK_URL    # optional
npx wrangler pages secret put WEBHOOK_SECRET        # optional, sent as X-Webhook-Secret
```

Redeploy after changing variables. Pages bakes them into each deployment.

**Delivery semantics.** `/api/lead` returns `ok` when at least one configured channel succeeds (sales email, webhook or HubSpot). If every configured channel fails, it returns 502 and the UI offers the `mailto:` fallback. If no channel is configured at all, the lead is only logged (visible in **Pages → Functions → Real-time logs**). Don't launch in that state.

## 5. Custom domain: design.99pergolas.com

**5a. 99pergolas.com DNS is in a Cloudflare account you control (most likely)**
1. Go to **Pages project → Custom domains → Set up a custom domain** and enter `design.99pergolas.com`.
2. Cloudflare creates the proxied `CNAME design → pergola-designer.pages.dev` record and issues the certificate, usually within minutes.

**5b. DNS is managed at GoDaddy**
1. In **Pages project → Custom domains**, add `design.99pergolas.com`. Cloudflare shows that it is waiting for a CNAME.
2. In **GoDaddy → My Products → DNS → Add record**, set Type `CNAME`, Name `design`, Value `pergola-designer.pages.dev`, TTL 1 hour.
3. Wait for Cloudflare to show **Active** (5–30 minutes; the certificate is issued automatically).

Then set `PUBLIC_BASE_URL=https://design.99pergolas.com` and redeploy.

## 6. Resend: verify 99pergolas.com for sending

1. In **Resend → Domains → Add domain**, enter `99pergolas.com`. A subdomain such as `send.99pergolas.com` also works and keeps the root SPF untouched.
2. Add the records Resend shows, in Cloudflare DNS or GoDaddy:
   - **MX** and **TXT (SPF)** on `send.99pergolas.com`, for the bounce/return path.
   - **TXT (DKIM)** on `resend._domainkey.99pergolas.com`.
   - Recommended: **TXT `_dmarc`**: `v=DMARC1; p=none; rua=mailto:info@99pergolas.com`. Skip it if a DMARC record already exists.
3. Click **Verify**. When the domain is verified, create an API key with *Sending access* only, for that domain, and save it as the `RESEND_API_KEY` secret.
4. Don't remove any existing MX or SPF records for the mailbox provider (GoDaddy/Microsoft 365 or Google). Resend's records live on the `send.` subdomain and don't conflict.

## 7. Smoke test in production

```bash
curl -s -X POST https://design.99pergolas.com/api/lead -H 'Content-Type: application/json' \
  --data @scripts/sample-lead.json
```

Check that:
- `info@` receives the sales email with the snapshot, the spec table, the CF7 block and the PDF.
- The test address receives the confirmation. Change `site.email` in the sample first.
- `https://design.99pergolas.com/d/<code>` opens the same design on the Review step.
- Pasting the `/d/<code>` link into iMessage or Slack unfurls with the snapshot.

Then open the WordPress page from a phone and submit a real lead end to end.

## 8. Add the Divi page

Follow `embed/README.md` → Option A: a new page `/design-your-pergola/` with one Code module containing `embed/wordpress-snippet.html`.

## 9. Operations

- **Logs:** go to **Pages project → Functions → Real-time logs**. Failed deliveries are logged as `lead <code>: <channel> failed: …`.
- **Pricing changes:** edit `src/config/catalog.ts` / `pricing.ts`, run `npm test`, push. The server recomputes estimates with the same code, so the UI and the emails always agree.
- **Spam:** the defenses are the honeypot field, the per-IP rate limit and server validation. If spam shows up, add Cloudflare Turnstile (see HANDOFF roadmap) or a WAF rate-limit rule on `/api/lead`.
- **Data retention:** KV holds only the design, view, estimate and snapshot (2 years for designs, 1 year for images), and no personal data. Lead PII lives only in the emails and in the CRM, if configured.

## Review build on GitHub Pages (no backend)

The public review copy at https://tahmidmahmud.github.io/99pergolas-designer/ is a static build on the `gh-pages` branch. There is no `/api/lead` there, so the estimate form falls back to a pre-filled email draft. To republish after changes:

```bash
npx vite build --base /99pergolas-designer/ --outDir dist-pages
cd dist-pages && git init -q && git add -A && git commit -qm "Pages build" && git push -f https://github.com/tahmidMahmud/99pergolas-designer.git HEAD:gh-pages
```
