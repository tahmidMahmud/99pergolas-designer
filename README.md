# 99 Pergolas — Custom Designer

A Pergolux-style, real-time 3D custom designer for [99 Pergolas](https://99pergolas.com/) covering every product line: Lux / Prestige louvered pergolas, solid-roof patio covers, cantilever carports, per-side enclosures (motorized screens, sliding glass, shutters, privacy panels), standalone motorized patio screens, motorized indoor shades, and an outdoor-kitchen lead module. Live estimated price range, URL-shareable designs, PDF spec sheet, and a lead pipeline that emails sales and the customer.

Reference: <https://pergoluxshop.com/products/pergola-custom-design?width=3000&length=3080&height=2620&color=Anthracite&mounting=freestanding>

## Run it

```bash
npm install
npm run dev        # Vite on http://localhost:5173 (the app)
npm run dev:api    # mock /api/lead on :8787 — writes leads to .leads/ (no email)
```

```bash
npm test                 # 61 vitest tests (rules, pricing, URL, lead)
npm run typecheck        # app
npm run typecheck:functions
npm run build            # dist/ for Cloudflare Pages
npm run preview:cf       # dist + real Pages Functions under wrangler (needs .dev.vars)
```

## Layout

| Folder | What |
|---|---|
| `src/types.ts`, `src/state/store.ts` | Shared domain types + zustand store |
| `src/config/` | Catalog (lines, colors, fabrics, enclosures, accessories), structural rules (bays, posts, louvers, validation), **pricing model**, URL (de)serialization, CF7 field mapping |
| `src/scene/` | React Three Fiber viewer: procedural posts/beams/louvers, enclosures, LED/RGB/fans/heaters, dimension labels, sun by time of day (suncalc, Dallas), snapshot capture |
| `src/ui/` | Configurator UI: stepper (Size · Style · Roof · Sides · Comfort · Review), price block, lead form, Screens/Shades/Kitchen configurators |
| `src/lead/` | `submitLead`, PDF spec sheet (jspdf), UTM/source capture, iframe bridge |
| `functions/` | Cloudflare Pages Functions: `POST /api/lead` (validate, re-price, KV save, Resend email, Zapier/HubSpot), `GET /d/:code` share redirect, `/api/design/:code`, `/og/:code` |
| `embed/` | WordPress (Divi) iframe snippet + resizer + UTM pass-through |
| `docs/` | `SPEC.md`, `DEPLOY.md`, `HANDOFF.md` (what the client must confirm), `research/` (Pergolux teardown, 99pergolas profile, competitor/tech review), `screenshots/` |

## Before launch (see docs/HANDOFF.md)

Prices are an **estimate-range model** calibrated to industry benchmarks, not 99 Pergolas' real price list — tune `src/config/pricing.ts` and `src/config/catalog.ts` with the client. Confirm line size limits, RAL colors, and lead routing (`RESEND_API_KEY`, `LEAD_TO`).
