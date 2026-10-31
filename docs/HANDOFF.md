# Handoff: 99 Pergolas 3D designer

**What it is:** a Pergolux-style custom designer for every 99 Pergolas product: Lux and Prestige louvered pergolas, solid-roof patio covers, cantilever carports, per-side enclosures, standalone motorized screens, indoor shades and outdoor kitchens.
- It shows a live **estimated installed range** and a 0% financing monthly figure.
- It ends in a **lead**, not a checkout. Sales gets an email with a 3D snapshot, a spec, an itemized estimate, a PDF and a share link. The customer gets a confirmation.

**Where it runs:** standalone at `design.99pergolas.com` and inside an iframe on a Divi page. See `docs/DEPLOY.md` and `embed/README.md`.

---

## 1. What the client must confirm before launch

Nothing below is published by 99 Pergolas today. The current values are researched estimates (`docs/research/99pergolas.md` §3), and **customers will see them**.

### 1.1 Pricing bands: `src/config/catalog.ts` and `src/config/pricing.ts`
| Item | Current assumption | Confirm |
|---|---|---|
| Structure $/sq ft (low / mid / high) | Lux 75 / 95 / 120 · Prestige 55 / 70 / 85 (`LINES[*].rate`) | ☐ |
| Minimum job | Lux $12,000 · Prestige $9,000 (`LINES[*].minCharge`) | ☐ |
| Solid roof | Prestige band × 0.8 (`PRICING.solidRoofFactor`) | ☐ |
| Modifiers | extra bay +5% each, floating +12%, cantilever +15%, custom RAL +6%, two-tone +2%, clear height > 9' +5% (`PRICING`) | ☐ |
| Permit / engineering | $500–$2,000 (`PRICING.permit`) | ☐ |
| Add-ons | LED $800–2,000 · RGB $1,000–2,500 · rain $300–600 · wind $250–500 · fan $600–1,500 ea · heater $800–2,000 ea · app hub $300–800 (`ACCESSORIES`) | ☐ |
| Enclosures, $/sq ft | screen 45–75 (min $3,500) · fixed panel 40–70 · sliding shutter 60–100 · bifold 70–110 · framed glass 80–120 · frameless glass 100–150 (`ENCLOSURES`) | ☐ |
| Standalone screens | $45–75 / sq ft per opening, $3,500 minimum | ☐ |
| Shades, per window | roller 350–900 · zebra 400–1,000 · honeycomb 450–1,100 · roman 500–1,200 · shangri-la 600–1,400 · vertical 700–1,600 · motor +250–450 | ☐ |
| Kitchen | $900–1,800 per linear ft + grill 1,500–4,000 · fridge 800–2,000 · sink 600–1,500 | ☐ |
| Financing | 60 months, 0% O.A.C., midpoint ÷ 60 (`FINANCE_TERM_MONTHS`). Is this the right term, and is the HFS wording approved? | ☐ |
| Disclaimer | "Estimate for planning only, based on typical Texas installations…" (`DISCLAIMER`). Needs legal review. | ☐ |

**How to tune:** edit the numbers, then run `npm test`. The tests check that pricing is monotonic and the URL round-trips. Push to deploy. The server recomputes every estimate with the same code, so emails always match what the UI shows. If a customer's on-screen number differs from the server's, the sales email flags it.

### 1.2 Size limits: `src/config/catalog.ts` (`LINES`) and `src/config/rules.ts`
- Single-bay maximums: **Lux 19'8" × 22'11"** and **Prestige 13'1" × 19'8"**. Larger sizes split into multiple bays with intermediate posts.
- Clear height: **7'0"–9'10"**. Minimum size: **7'0"** each way.
- Soft cap: **40' × 40'**. Beyond that the design is flagged "engineering review".
- Cantilever (carport) depth is capped at **20'**.
- Sides wider than **16'** prompt a "split into two screens" warning.
- Rear enclosures are disabled for wall-mounted and floating mounting.
- RGB and app/voice control are **Lux-only**.

☐ Confirm each value against the OEM (AlunoTec) spec sheets, and confirm whether Prestige really excludes RGB and app control.

### 1.3 Colors: `src/config/catalog.ts` (`COLORS`)
- Black ≈ **RAL 9005**, Grey (anthracite) ≈ **RAL 7016**, White ≈ **RAL 9016**, Bronze ≈ **RAL 8019**, plus Custom (free-text RAL, +6%).
- Frame and louver colors are independent (two-tone +2%).

☐ Confirm the RAL codes, whether bronze is a standard color, and the custom-color upcharge and lead time.

### 1.4 Lead routing: `wrangler.toml` `[vars]` and secrets
| Question | Default |
|---|---|
| Who receives leads (`LEAD_TO`, `LEAD_BCC`)? | info@99pergolas.com |
| Sender name and address (`FROM_EMAIL`)? Needs Resend domain verification. | `99 Pergolas <designs@99pergolas.com>` |
| Send the customer a confirmation with the PDF (`SEND_CUSTOMER_EMAIL`)? | yes |
| CRM: Zapier/Make webhook, HubSpot Forms, or email only? | email only |
| Consent wording on the form (TCPA/SMS). Needs legal review. | UI agent's copy |
| Service area: soft-gate non-DFW ZIPs? | not gated |

The sales email reproduces the existing **Contact Form 7 field names** (form 1643 for pergolas, 1783 for screens, 1864 for contact), so it reads like today's WordPress form emails.

---

## 2. How this compares with Pergolux

Pergolux's configurator is the reference (`docs/research/pergolux.md`).

| | Pergolux (pergoluxshop.com) | 99 Pergolas designer |
|---|---|---|
| Business model | Shopify cart → checkout (kit sale) | Lead generation: estimate range → free measure |
| 3D | Charpstar fork of `<model-viewer>` that rescales one glTF | Fully parametric React Three Fiber: real bays, posts, louver count, enclosures, accessories |
| Units | Millimetres (US UI quantized to inches) | Inches throughout. ft-in dropdowns plus sliders with 1" steps. |
| Sizes | 1–4 m × 1.58–5.96 m (length snaps to steps) | Up to 40' × 40' with automatic multi-bay; per-line limits |
| Mounting | Freestanding, wall | Freestanding, wall-mounted, floating (wall-hanging), cantilever carport |
| Colors | 3 fixed combinations | Frame and louver chosen independently, 4 standard colors plus any RAL |
| Sides | Screen or frameless glass, up to 6 half-sides | 6 enclosure types per side, screen fabric (blackout → 60%), disabled-with-reason rules |
| Accessories | LED white or RGB | Warm LED, RGB, rain and wind sensors, fans, heaters, remote/app control |
| Viewer | Open louvers, show dimensions | Same, plus a sun/time-of-day slider with real Dallas sun angles, night mode with LEDs, and a snapshot |
| Price | Exact cart price (variant ladder) | Live installed range, itemized, with 0% financing per month and a disclaimer |
| Sharing | URL params | URL params plus short codes `/d/XXXXXX` with link-preview images |
| Output | Order | Sales email (snapshot, spec, CF7 block, PDF), customer confirmation, optional CRM |
| Other products | No | Screens (3D), shades (2D), outdoor kitchen (form) |
| Embedding | Native theme section | Standalone subdomain plus a WordPress iframe with UTM and conversion bridge |

---

## 3. Known limitations

- **Estimates are model-based**, not 99 Pergolas' real price list, until §1.1 is confirmed.
- **No CAPTCHA.** Spam protection is a honeypot, a soft per-IP rate limit (KV is eventually consistent) and validation. The customer confirmation email could be abused to send mail to third parties. If abuse appears, add Turnstile or turn `SEND_CUSTOMER_EMAIL` off.
- **No lead database.** Personal data exists only in the emails, the webhook and the CRM. KV stores the design, estimate and snapshot under the share code, never contact details. If every delivery channel fails, the customer sees the mailto/phone fallback, but nothing is queued for retry.
- **The PDF is generated in the browser** (jsPDF, lazy-loaded) and attached to the POST. A very old phone that can't build it still submits, just without the PDF.
- **Snapshots** are the viewer canvas at submit time. The quality depends on the device, and there is no separate top-down plan drawing yet.
- **Iframe height** is clamped to the visitor's screen so the sticky viewer works. The page scrolls inside the frame, not the WordPress page.
- **Attribution** inside the iframe depends on the snippet passing params. Safari blocks reading the parent's cookies directly.
- **Screens, shades and kitchens** use simplified 3D or 2D previews. Kitchens are a lead form with a price band, not a layout tool.
- **L-shapes, gable or attached-to-roof covers, and multiple attached walls** are not modeled.

## 4. Roadmap

1. **AR "see it in your yard":** export the current scene to GLB (three.js `GLTFExporter`) and hand it to `<model-viewer>`, which uses Scene Viewer on Android and Quick Look on iOS (needs USDZ conversion, or the WebXR path on Android).
2. **Backyard photo placement:** the customer uploads a photo, places four ground points, and we render the pergola over it with a matched camera. Use the photo as the snapshot and attach it to the lead (also satisfies the CF7 `site-photo` field).
3. **Saved designs and accounts-free resume:** we already store `/d/<code>`. Add "email me this design" before the full lead, and "my designs" in localStorage.
4. **L-shapes and multi-structure layouts:** two joined rectangles sharing posts, plus a corner gutter.
5. **Turnstile** on the lead form, and a KV/D1 lead queue with retry.
6. **Booking:** embed the measurement booking ($200, credited) with a calendar after submit.
7. **Sales tools:** a `?sales=1` mode that shows margin bands and a printable quote. Prefill from a phone call.
8. **OG images for plain URLs** (not just `/d/` codes), rendered at the edge from params.
9. **Analytics:** step funnel events (`size → style → … → submit`) to GA4 through the parent bridge.

## 5. Map of the code

| Path | What |
|---|---|
| `src/types.ts`, `src/state/store.ts` | Shared contracts and the zustand store |
| `src/config/` | Catalog, rules, pricing, URL state, CF7 mapping. Pure TS, also used server-side. |
| `src/scene/` | React Three Fiber viewer, parametric geometry, snapshot |
| `src/ui/`, `src/App.tsx` | Configurator UI and lead form |
| `src/lead/submit.ts` | `submitLead(payload, {website})` → `{ok, id, shareUrl, error, fieldErrors, mailto}`, plus `mailtoFallback` |
| `src/lead/pdf.ts` | `buildSpecPdf(payload)` → Blob (jsPDF, lazy). Also `formatInches`, `money`, `downloadBlob`. |
| `src/lead/source.ts` | UTM, click-id, referrer and device capture (survives URL rewrites) |
| `src/lead/embed.ts` | iframe bridge: height, `99p:lead` conversion ping, `hutk` |
| `src/lead/validate.ts`, `pipeline.ts`, `email.ts`, `format.ts` | Shared server logic: validation, estimate recompute, short codes, email HTML |
| `functions/` | Cloudflare Pages Functions: `/api/lead`, `/api/design/:code`, `/d/:code`, `/og/:code` |
| `scripts/dev-api.mjs` | Local API mock that writes `.leads/` |
| `embed/` | WordPress snippet and instructions. `public/embed-demo.html` is the local bridge test. |
