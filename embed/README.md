# Putting the designer on 99pergolas.com

The designer is a standalone web app hosted at **https://design.99pergolas.com** (Cloudflare Pages, see `docs/DEPLOY.md`). WordPress never runs the 3D code. It only shows the app in a frame or links to it, so Divi, LiteSpeed Cache and other plugins can't break it, and the heavy 3D bundle stays off the marketing pages.

You can use any combination of the three options below. Most sites should start with **Option A** plus **Option B** for ads.

| | Option A: iframe on a Divi page | Option B: standalone subdomain | Option C: full-width landing page |
|---|---|---|---|
| URL | 99pergolas.com/design-your-pergola/ | design.99pergolas.com | 99pergolas.com/design/ (or a campaign URL) |
| Best for | Organic traffic, the main nav, SEO copy around the tool | Paid ads, QR codes, email and SMS links, mobile | A campaign page with the tool as the hero |
| Header and footer | The site's own | Designer header only | The site's own, minimal |
| Work | Paste one snippet | None (it's the app) | Snippet plus a Divi blank template |

---

## Option A: iframe in a Divi Code module (recommended)

1. In WP Admin go to **Pages → Add New**. Title it **Design Your Pergola**, with the slug `design-your-pergola`.
2. Click **Use Divi Builder**, then **Build From Scratch**.
3. Add a **Regular section** with a **1-column row**. Open the row settings (gear icon):
   - **Design → Sizing**: turn on *Use Custom Width* and set *Custom Width* to `1440px`. Set *Custom Gutter Width* to `1`.
   - **Design → Spacing**: set *Padding* top and bottom to `0`.
4. Optional: above the frame, add a **Text** module with the H1 ("Design your pergola in 3D") and one sentence of copy. Keep the long SEO copy, FAQs and testimonials **below** the designer.
5. Add a **Code** module to the row. Paste the whole contents of `embed/wordpress-snippet.html`.
   - Paste it exactly as given. Blank lines inside `<script>` make WordPress add `<p>` tags, which break the script.
   - If the app is hosted somewhere other than `design.99pergolas.com`, change the two URLs in the snippet (`src` and the "Open the designer" link).
6. **Save → Publish.** Open the page in a private window and check:
   - The designer loads, and the frame grows to about the screen height (minimum 640 px).
   - Adding `?utm_source=test` to the page URL passes through. The designer's lead email shows `utm_source: test` under **Source**.
7. Link to the page:
   - **Divi → Theme Builder / Menus**: add "Design Your Pergola" to the main menu.
   - Point the homepage "Get a Free Estimate" buttons at it, or add a second button "Design yours in 3D".
8. Caching: if LiteSpeed Cache or another optimizer is set to "Delay JS" or "Combine JS", exclude the inline snippet (search for `p99-designer`), or turn JS optimization off for this page only.

**What the snippet does** (about 25 lines of vanilla JS, no jQuery):
- Copies `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid` and `ttclid` from the page URL into the iframe `src`. It also adds `?src={json}`, which carries the parent page URL, the visitor's original referrer and the HubSpot `hubspotutk` cookie. The browser can't pass these across origins any other way, because Safari blocks third-party cookies.
- Listens for `{type:'99p:height', height}` from the designer, checking the message origin. It sizes the frame to the content but never taller than the visitor's screen, so the app's sticky 3D viewer keeps working inside the frame.
- When a lead is sent, the designer posts `{type:'99p:lead', kind, value}` (no personal data). The snippet fires GA4 `generate_lead` (Site Kit's `gtag`) and a Meta `Lead` event if the pixel exists.
- Shows a "Open the designer full screen · request a free estimate · call" line under the frame, and a `<noscript>` fallback.

**Content Security Policy.** The site sends no CSP or X-Frame-Options today, so nothing is needed. If one is added later, include `frame-src https://design.99pergolas.com` on WordPress. The designer itself must allow `frame-ancestors https://99pergolas.com https://www.99pergolas.com` (it sends no frame-ancestors header today).

## Option B: standalone subdomain

The app already runs at `https://design.99pergolas.com`, with nothing to install in WordPress. Use it for:
- **Google and Meta ads.** Send the click straight to `https://design.99pergolas.com/?utm_source=google&utm_medium=cpc&utm_campaign=…`. On phones this beats an iframe inside a scrolling page.
- **Preset links**, such as a 14×20 Lux with screens: design it, copy the URL from the address bar, and use it as the ad's final URL.
- **QR codes** at the showroom and on trucks or yard signs.

The app captures UTMs and click ids on the first page view, so they survive while the visitor changes the design.

## Option C: full-width landing page

For a campaign page where the designer is the hero:
1. Create the page as in Option A, but in **Divi → Page Settings** pick the **Blank Page** template, or a Theme Builder template with a slim header.
2. Add a **Fullwidth section** containing a **Fullwidth Code** module, and paste the same snippet.
3. In the snippet, change the wrapper style `max-width:1440px` to `max-width:none`, and the iframe `border-radius:14px` to `0`.
4. Add a short trust strip under it (20-year warranty, tornado-rated, 0% financing, phone).

---

## Testing locally

```bash
npm run dev            # app on http://localhost:5173
npm run dev:api        # lead API on :8787 (separate terminal)
open "http://localhost:5173/embed-demo.html?utm_source=demo&gclid=abc"
```

`public/embed-demo.html` contains the same snippet, pointed at `/?embed=1`. It prints every bridge message (`99p:ready`, `99p:height`, `99p:lead`) and the resulting frame height in a log under the frame.

## Message reference

| Direction | Message | Notes |
|---|---|---|
| designer → page | `{type:'99p:ready'}` | Sent once on load. The page replies with the HubSpot cookie if it has one. |
| designer → page | `{type:'99p:height', height}` | Content height in CSS px. Sent on every layout change (throttled to animation frames). |
| designer → page | `{type:'99p:lead', kind, value, id}` | After a successful submit. `value` is the estimate midpoint in USD. No personal data. |
| page → designer | `{type:'99p:hutk', value}` | HubSpot `hubspotutk`, stored with the lead's attribution. |
| page → designer | `{type:'99p:ping'}` | Asks the designer to re-send its height. |

The designer side is `src/lead/embed.ts` (`initEmbedBridge()`), and the attribution capture is `src/lead/source.ts`.
