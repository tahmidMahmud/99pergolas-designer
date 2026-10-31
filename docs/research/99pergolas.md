# 99 Pergolas: product and tech profile for a web configurator

Research date: 2026-10-31. Subject: https://99pergolas.com/ (99 PERGOLAS, LLC, 3939 Belt Line Rd Ste 760D, Addison TX 75001, (682) 241-5877, info@99pergolas.com).

**How to read this report**
- **[V]** means verified. I read it directly from a cited page, from the site's HTML or REST API, or from an image hosted on the site.
- **[I]** means inference. It is my reasoning from the evidence, and the evidence is stated next to it.
- **[OLD]** means the fact comes from the site version before the July 2026 redesign. That site had /lux-and-prestige-pergola/, /sides/, /accessories/ and /showroom/; all four now return 404. I read it from Wayback snapshots captured around 2026-01-12 and 2026-07-12. Treat these facts as true historically and still likely, but confirm them with the client.
- Raw captures are saved in `/private/tmp/claude-501/-Users-tmahmud-workspace-randomIdea/3e4f1fb7-db7b-41c7-ac65-03574b1c4fc7/scratchpad/research/raw/`. That folder has the HTML, text dumps, the media list, downloaded spec images and the AlunoTec pages.

---

## 0. Executive summary

1. **Platform [V].** WordPress 7.1.x runs the **Divi 4.27.4** theme. The July 2026 redesign is hand-coded HTML and CSS inside Divi Code modules. Forms use **Contact Form 7 6.1.6** with reCAPTCHA v3 and Akismet. Chat is **tawk.to**, analytics is **Google Site Kit (GT-TX587CNG)**, and there is a **TrustedSite** badge. Hosting is **GoDaddy Managed WordPress** behind Cloudflare. The site has **no e-commerce or cart**; it only collects leads. It sends no X-Frame-Options or CSP header, so an iframe, a script-tag web component, or a subdomain would all work.
2. **Products today [V].** The site sells:
   - Custom aluminum louvered pergolas in two lines, **Lux Line** (flagship) and **Prestige Line**, in Freestanding, Wall-mounted, Floating (wall-hanging) or Custom/multi-zone layouts.
   - Side enclosures: motorized screens, fixed privacy panels, sliding shutters, bifold shutters, and framed or frameless sliding glass.
   - Pergola accessories: LED, RGB, rain sensor, ceiling fan and infrared heater.
   - Standalone **motorized patio screens** and **motorized indoor shades** (six styles).
   - **Outdoor kitchens**, marked "Coming Soon".
   - **[OLD]** The old site also promoted **carports / vehicle covers** (aluminum cantilever).
3. **The specs come from an OEM [V/I].** File names in 99 Pergolas' own media library tie both lines to models from Chinese manufacturer **AlunoTec** (Dongguan):
   - **Lux Line is the AlunoTec Pergo-T600** (Pergo-LUX class). Evidence: `Luxe-Line-T600-Post-scaled.jpg`.
   - **Prestige Line is the AlunoTec Pergo-M6 PRO.** Evidence: `Prestige-Line-Pergo-M6-Pro-Post.jpg` and `Prestige-Line_-M6-Pro-4x6m-1.mp4`.
   - Several renders keep their original Chinese file names.

   AlunoTec publishes real geometry for these models: post sizes, beam and gutter sizes, blade size, maximum single-bay spans and maximum height. Those numbers are the best available basis for configurator limits.
4. **Pricing [V].** 99 Pergolas publishes **no prices**. The old comparison chart rated Lux "$$$$" and Prestige "$$$". Financing runs through **HFS Financial**; the old site said "low or 0% interest (O.A.C.)". A $200 measurement-visit fee is credited toward the purchase. Section 3 gives an estimation model built on industry benchmarks.
5. **3D [V/I].** Their process sells "3D custom design", "Approve your custom 3D design" and "3D drawings", but nothing on the site is interactive. The 3D images in the media library are AlunoTec product renders, so the "3D design" step is most likely renders or drawings produced by the supplier or in-house. An interactive configurator would be new for them.

---

## 1. Website platform and tech

| Item | Finding | Evidence |
|---|---|---|
| CMS | WordPress. `<meta name="generator" content="WordPress 7.1.3/7.1.4">` appears, and `/wp-json/` is open. **[V]** | Page HTML; https://99pergolas.com/wp-json/ |
| Theme / builder | **Divi** by Elegant Themes, version 4.27.4 (`Theme Name: Divi`, `et_pb_*` classes, `/wp-content/themes/Divi/…ver=4.27.4`, `<meta content="Divi v." name="generator">`). The REST namespace `divi/v1` is present. **[V]** | Homepage HTML |
| Page construction | The 2026 redesign pages are hand-written HTML and CSS in Divi "fullwidth code" modules. They use custom classes (`.np99`, `.line-card`, `.swatches`, `.reveal`) and CSS variables. **[V]** This means a configurator can be dropped into a page as one Code module containing a `<script>` and a custom element. **[I]** | pergolas.html source |
| Forms | **Contact Form 7 v6.1.6**: `_wpcf7_version` 6.1.6, locale `en_CA`. It runs with **reCAPTCHA v3** (site key `6LcK_hYrAAAAAOm2F6kQbu3gNnMIIOTITchIGNhA`) and Akismet (`_wpcf7_ak_js`). The form IDs are listed below. The CF7 REST GET endpoint returns 403 (`wpcf7_forbidden`). **[V]** | Form HTML; `/wp-json/contact-form-7/v1/contact-forms/1643` |
| Other plugins | Popups for Divi 3.2.7, Ditty News Ticker, FooGallery (namespace), CoBlocks, Yoast SEO and Yoast Local SEO (`wpseo-local` KML), Google Site Kit 1.190.0, LiteSpeed Cache (namespace), and Two-Factor. **[V]** | wp-json namespaces; script URLs |
| Analytics | Google tag `GT-TX587CNG` via Site Kit, with Site Kit event providers for CF7 and content events. GoDaddy "signals" traffic script `img1.wsimg.com/signals/js/clients/scc-c2/scc-c2.min.js`. **[V]** | Homepage HTML |
| Chat | **tawk.to** widget, property `6801a649bcd193190f5b18ab/1ip3733o1`. **[V]** | Homepage HTML |
| Trust badge | TrustedSite (`cdn.trustedsite.com/js/1.js`). **[V]** | Homepage HTML |
| Hosting | **GoDaddy Managed WordPress**. Evidence: the `wpaas/v1` REST namespace, `mu-plugins/vendor/wpex/godaddy-launch`, the `gdl/v1` and `wp-site-designer/v1` namespaces, and the wsimg signals script. It sits behind **Cloudflare** (`server: cloudflare`, `cf-ray … DFW`) with a GoDaddy gateway cache (`x-gateway-cache-*`). **[V]** | Response headers; wp-json |
| E-commerce | **None.** There is no WooCommerce or cart; the `woocommerce` strings are only Divi compatibility CSS. The site has lead forms, phone, email, chat and an external financing link. **[V]** | Source scan |
| Embedding constraints | No `X-Frame-Options` or CSP header was sent, so iframing is allowed. Fonts load from Google Fonts and icons from Font Awesome via cdnjs. **[V]** | home.headers |
| Sitemap / robots | `/sitemap.xml` redirects to Yoast's `sitemap_index.xml`, which lists `page-sitemap.xml` (11 pages) and `geo-sitemap.xml` (locations.kml). There is **no blog**: no posts exist and `/blog/` returns 404. robots.txt is the WordPress default. **[V]** | /robots.txt, /sitemap_index.xml |
| Pages (sitemap) | `/`, `/pergolas/`, `/motorized-screens/`, `/indoor-blinds/`, `/gallery/`, `/about-us/`, `/contact-us/`, `/free-estimate-custom-pergola/`, `/free-estimate-custom-motorized-screen/`, `/measurement-booking/`, `/measurement-form/` **[V]** | page-sitemap.xml |
| Broken links (worth telling the client) | `/custom-aluminum-pergolas/`, `/motorized-patio-screens/`, `/motorized-indoor-blinds/` and `/financing/` all 301-redirect to *image files*. `/free-estimate/` (the footer CTA) 301s to the **motorized-screen** form, not the pergola form. `/outdoor-kitchens/`, `/faq/`, `/blog/` and the old product pages return 404. The screens page has an `href="tel:tel:+16822415877"` bug. **[V]** | curl status checks |

**Recommendation for embedding [I]**
- **Best fit:** host the configurator as a standalone app on a subdomain such as `design.99pergolas.com` (Vercel or Netlify). Embed it on a new WordPress page, for example `/design-your-pergola/`, in a Divi Code module, either as an `<iframe>` or as a `<script type="module">` that defines a custom element. A web component in shadow DOM avoids Divi CSS collisions.
- **Lead hand-off:** do not post to CF7 directly. reCAPTCHA v3 and nonces make cross-origin CF7 submission brittle. Have the app's own backend email the lead and attach a PDF or PNG of the design, and optionally forward it to their CRM.
- **Keep CF7 field names.** Reuse the existing names (listed in section 4) so the lead emails look the same as today's.
- A WordPress plugin is possible, but it would tie the build to GoDaddy-managed PHP, so it is not recommended.

---

## 2. Product catalog and specifications

### 2.1 Product lines (current site)

These product groups are all verified on [/](https://99pergolas.com/), [/pergolas/](https://99pergolas.com/pergolas/) and [/about-us/](https://99pergolas.com/about-us/):

1. **Custom Aluminum Pergolas.** Two lines, **Lux Line** ("Flagship", "The Ultimate Smart Pergola Experience") and **Prestige Line** ("Elegant Design Meets Everyday Performance"). The homepage card also says "Motorized louvered-roof pergolas, modern pergolas, and patio covers."
2. **Motorized Patio Screens**, sold standalone or on pergolas.
3. **Motorized Indoor Blinds / Shades** in six collections.
4. **Bifold Aluminum Shutters**
5. **Sliding Aluminum Shutters**
6. **Sliding Glass Systems**
7. **Fixed Aluminum Privacy Panels**
8. **Outdoor Kitchens**, listed as "Coming Soon" on About. The homepage still markets "outdoor kitchens, BBQ islands, cabinets, countertops, and grills".

Products found only on the old site **[OLD]** ([Wayback homepage 2026-07-12](http://web.archive.org/web/20260712204737/https://99pergolas.com/)):
- **Carports & Vehicle Covers**: "premium aluminum cantilever carports". Images are named `6X8-LUX-LINE-CARPORT*.webp`.
- Applications such as kids' play areas and batting cages.
- **No solid-roof patio cover product page was found** on either version. The phrase "patio covers" appears only as marketing copy.

### 2.2 Lux vs Prestige: every spec found

| Spec | Lux Line | Prestige Line | Source |
|---|---|---|---|
| OEM model (from file names) | AlunoTec **Pergo-T600** (`Luxe-Line-T600-Post-scaled.jpg`) | AlunoTec **Pergo-M6 PRO** (`Prestige-Line-Pergo-M6-Pro-Post.jpg`, `Prestige-Line_-M6-Pro-4x6m-1.mp4`) | [V] [media REST](https://99pergolas.com/wp-json/wp/v2/media) |
| Louver drive | Motorized; remote **and** mobile app | Motorized; **remote only** | [OLD] comparison chart `line-comparaison-scaled.jpeg`; [OLD] /lux-and-prestige-pergola/ |
| Louver opening angle | **0 to 105°** max | **0 to 90°** max | [OLD] chart; AlunoTec LUX page also says 0–105° |
| Louver (blade) wall thickness | **5/64 in** (≈2.0 mm) | **1/16 in** (≈1.6 mm) | [OLD] chart |
| Post size | **5 7/8 × 5 7/8 in** (150 × 150 mm), wall **7/64 in** (≈2.8 mm) | **5 7/8 × 5 7/8 in** (150 × 150 mm), wall **5/64 in** (≈2.0 mm) | [OLD] chart; matches AlunoTec "2.8 mm beams and posts" (LUX) and "150x150x2.0 mm" (M6 PRO) |
| Post profile look | Square, flat faces, with two internal cable/drain channels | Square with rounded corners and an integrated corner drain channel | [V] images `Luxe-Line-T600-Post`, `Prestige-Line-Pergo-M6-Pro-Post` |
| Beam / gutter | Not published | **190 × 115 × 2.2 mm** (7.5 × 4.5 in) one-piece beam and gutter ("beam sink") | AlunoTec M6 PRO page [V-OEM] |
| Blade size | Not published | Listed as "170x4.5x1.5 mm". This is most likely about 170 mm (6.7 in) wide by 1.5 mm wall. [I] | AlunoTec M6 PRO |
| Footplate | Not published | 195 × 195 × 8 mm (7 11/16 in square) | AlunoTec M6 PRO |
| Max single bay (4 posts) | **6 × 7 m ≈ 19'8" × 22'11"** (OEM LUX) | **4000 × 6000 mm ≈ 13'1" × 19'8"** (OEM M6 PRO) | AlunoTec [LUX](https://www.alunotec.com/pergo-lux-custom-aluminum-pergola.html), [M6 PRO](https://www.alunotec.com/alunotec-new-pergo-m6-pro-easy-installation-better-waterproof-motorized-louvered-pergola-kits.html), [compare](https://www.alunotec.com/compare-aluminum-pergola-models.html) |
| Max post height | Up to 3 m ≈ 9'10" (OEM) | Not separately stated; the OEM family says up to 3 m | AlunoTec LUX and ECO pages |
| OEM standard sizes | Not published | 3×6, 4×5, 4.5×6, 4×8, 5×10 m, plus custom | AlunoTec M6 PRO FAQ |
| Sizes in 99 Pergolas' own image names (m) | 3×6, 4×6, 4.5×6, 4.5×8, 4×9, 6×8, 8×5; 6×7 wall-mounted | 4×6 | [V] media library |
| Customization | "Fully Customized" | "Semi Customized" | [OLD] chart |
| Wind resistance | 99 Pergolas' own two chart versions conflict: "100–140 mph" and "75–137 mph". OEM LUX: 180–220 km/h (112–137 mph); a test video claims 130–156 mph. | 99 Pergolas chart versions conflict: "80–120 mph" and "50–75 mph". OEM M6 PRO: 170–200 km/h (106–124 mph). | [OLD] two chart images; AlunoTec |
| Snow load | 18–31 in | 16–20 in | [OLD] chart. OEM: LUX 60–80 cm (24–31 in); M6 PRO 36–56 cm (14–22 in) |
| Rain | Waterproof when closed; water drains through a hidden gutter and down the posts | Same | [OLD] FAQ #3 |
| Rain sensor | Included | Chart says "Included"; the Accessories page says "optional on Prestige" | [OLD] |
| Lighting | LED and RGB | LED only | [OLD] chart; current page lists "Integrated LED lighting options" for Prestige |
| Heater / fan | "Fully compatible" | "Included" (as written on the chart) | [OLD] chart |
| Side enclosures | Glass doors, shutter doors, motorized screens | Screens or shutters optional | [OLD] chart |
| Voice control | Alexa / Google Home, Lux only | No | [OLD] FAQ #7 |
| Warranty (structure) | **20 years** | **15 years**. The current page lists the 20-year warranty only under Lux. | [OLD] chart; [/pergolas/](https://99pergolas.com/pergolas/) |
| Warranty (motors, electronics, accessories) | "5+ years … (varies by item)" | Same | [OLD] FAQ #17 |
| Install crew | 3–4 people | 2–3 people | [OLD] chart |
| Install time | 2–5 days average | 1–3 days average | [OLD] /lux-and-prestige-pergola/. FAQ #11: "Most projects are installed in 1–3 days" |
| Price tier | $$$$ | $$$ | [OLD] chart |

**Data-quality warnings [I]**
- 99 Pergolas published **two different versions** of the comparison chart. One uses `line-comparaison-scaled.jpeg` and the other `dl1hm9ohdd675djizaoo-scaled-1.webp`, and their wind numbers disagree.
- "80–120" for Prestige looks like the OEM's **km/h** figure for its budget Pergo-LITE, relabeled as mph.
- The configurator should **not** display wind or snow ratings. Use engineering-letter values from the client instead.
- The old site called the pergolas "tornado proof"; the current site has dropped that claim.
- The current homepage says "Made in the USA", but the media file names point to Chinese OEM sourcing. Confirm with the client before the configurator repeats any origin claim.

### 2.3 Mounting and design types

The quote form field `pergola-design` takes these values **[V]** ([form](https://99pergolas.com/free-estimate-custom-pergola/)):

| Value | Description |
|---|---|
| `Freestanding` | "independent from existing structures" |
| `Wall Mounted` | "Attaches directly to your home" |
| `Wall Hanging` | Marketed as "Floating Pergolas … concealed structural support" |
| `Custom Shape` | "L-shaped layouts, multi-zone pergolas, connected structures"; [OLD] "L shaped, curved, double, or combination" |

- The `B-T600-4×6-grey` image shows a multi-bay L-shape built from several 4 × 6 m modules that share posts.
- There is also an image named `Luxe-Line-with-offset-Posts-2-1.png`. **[V]**
- From the OEM side, AlunoTec LUX supports "single/multi-bay, L-shape, trapezoid, corner fills" **[V-OEM]**.

### 2.4 Colors and finishes

- **Quote form [V]:**
  - `louver-color`: Grey / White / Black / Customized, plus a free-text `custom-louver-color`.
  - `frame-color`: Grey / White / Black / Customized, plus `custom-frame-color`.
  - Frame and louver colors are therefore chosen **independently**.
- **Current /pergolas/ page [V]:** "Standard colors plus additional RAL colors. Every pergola is powder-coated to order … full RAL palette." It shows eight illustrative swatches with no names: `#1d1f1e #3b3f3e #6b6f6d #9ba09d #d9dad6 #f4f3ef #4a3f2f #7a5c3a`. The last two are bronze/brown tones.
- **[OLD] showroom:** the standard colors were WHITE, GREY, **GREY+WHITE** and BLACK. The site showed an RAL chart image (`IMG_2080.webp`, full RAL Classic 1000–9018), and FAQ #9 said "20+ custom colors and finishes by request".
- **OEM render** `Luxe-Line-with-white-grey-black-and-customized-colors.jpg` shows white, black and anthracite louvers, plus custom colors including a gradient.
- **[I] Suggested RAL mapping for rendering** (confirm with client):
  - Black ≈ RAL 9005 matte
  - Grey ≈ RAL 7016 anthracite
  - White ≈ RAL 9016 traffic white
  - Optional bronze ≈ RAL 8019 / 8017, to cover the bronze swatch tones

### 2.5 Accessories (pergola)

The quote form `accessories[]` takes `LED-lighting`, `RGB-lighting`, `Rain-sensor`, `Ceiling-fan`, `Electric-heater` **[V]**.

| Accessory | Details found |
|---|---|
| **LED** | Integrated warm-white architectural light in the structure **[V]**. The OEM puts warm or cool dimmable LEDs on the blades. A silicone LED strip cross-section image is in the media library. |
| **RGB** | "Millions of color combinations", remote and smart control, scenes **[V]**. **[OLD]** Lux only; remote or app with dim, pulse and strobe. The OEM runs RGB along the gutter perimeter. |
| **Rain sensor** | Auto-closes the louvers **[V]**. |
| **Wind sensor** | Offered on **screens** ("retracts the screen during high winds") **[V]**. **[OLD]** "rain and wind sensors" were also mentioned for pergolas. |
| **Ceiling fan** | "Ceiling fan ready" **[V]**. **[OLD]** "sealed, rust resistant motors", "lowers perceived temperature by 5–10°F", remote or wall switch. |
| **Electric infrared heater** | Wall or ceiling mount, "no smoke, gas" **[V]**. Media images show 1–2 heaters per bay. The OEM heater model appears in file names as "T22A/T22C". |
| **Control system** | Form field `control-system`: `Remote` / `Mobile App` **[V]**. The OEM app is **Tuya** (Smart Life) with voice support (AlunoTec LUX page) **[V-OEM]**. 99 Pergolas' "mobile-app-control.png" is a generic mock-up, not a real app screenshot. **[V]** |
| **Electrical** | **[OLD]** FAQ #10: "integrated electrical prep for lights, fans, heaters, and automation … wiring is included." |
| **Seen in photos, not offered as options [V]** | Speakers ("Pergola with speakers, heaters, and a fan"). OEM add-ons also include WPC decking and outdoor furniture. |

### 2.6 Side enclosures

The quote form has a "Sides Option" grid. Each type has two rows of width (or length) × height × pieces **[V]**.

| Form key prefix | Type | Marketing claims |
|---|---|---|
| `ms` | Motorized Screen | Reduce heat and UV, insects, privacy, remote, wind-sensor compatible |
| `fsw` | Fixed Side Walls (shutter panels) | "Fixed Aluminum Privacy Panels", permanent privacy, custom sizes. **[OLD]** "Solid or louvered aluminum side walls" |
| `ss` | Sliding Shutter | Smooth sliding on a track, powder-coated |
| `fold` | Folding (Bifold) Shutter | "Adjustable louvers" (operable blades), stacks to the side |
| `fsgd` | Framed Sliding Glass Door | **[OLD]** "Lockable" |
| `frsgd` | Frameless Sliding Glass Door | "Elegant frameless look", four-season room |

- Each type uses fields `{prefix}1-w`, `{prefix}1-h`, `{prefix}1-pcs`, `{prefix}2-w`, `{prefix}2-h`, `{prefix}2-pcs`.
- The second row is labeled "L:" (length). That suggests row 1 covers the width sides and row 2 the length sides. **[I]**
- OEM equivalents: zip screens (motorized or manual), framed and frameless glass doors, vertical louver, bifold louvered panel, sliding louvered panel, and fixed louvered panel ([AlunoTec add-ons](https://www.alunotec.com/pergola-optional-add-ons.html)).

### 2.7 Motorized patio screens (standalone)

Sources: [/motorized-screens/](https://99pergolas.com/motorized-screens/) and [screen form](https://99pergolas.com/free-estimate-custom-motorized-screen/) **[V]**.
- **Installs on:** brick openings, aluminum frames, wood frames, metal structures, covered patios, aluminum pergolas, outdoor kitchens and restaurant patios. Form field `installation-type` takes Brick / Aluminum Frame / Wood Frame / Metal / Other.
- **Openings:** 1–6 or More. Optional W × H for up to three openings.
- **Colors:** frame color and fabric color are each Black / White / Grey / Customized.
- **Fabric openness**, expressed as sun block: Blackout, 99%, 97%, 95%, 90%, 70%, 60%. The site's guide groups them as:
  - 99/97%: more shade and privacy
  - 95%: balanced
  - 90/70/60%: more view and airflow
  - Blackout: complete privacy
  - The interactive picker on the page shows Shade, Privacy and Visibility ratings for each option.
- **[OLD] fabric swatch names:** `IMG_2081.webp` and `2C9FB1F9…jpeg` list 0% Black, 10% Light Grey, 30% Black, 3% Black, 3% Black Grey, 3% Black White, 5% Dark Grey, 5% White Grey, 5% Beige and 5% Blue Grey. The percentages are **openness**, and openness ≈ 100 − sun block. **[I]**
- **Claims:** "Block up to 95% of the sun's heat and harmful UV rays". FAQ: "not waterproof walls or storm protection systems".
- **Pricing FAQ:** "Pricing depends on the opening size, number of screens, fabric, motor, installation surface, and electrical requirements."
- **Smart features:** wind sensor (Yes / No / more info); motor type Remote Control or Mobile App.
- **Project type:** Residential or Commercial.

### 2.8 Motorized indoor shades

Source: [/indoor-blinds/](https://99pergolas.com/indoor-blinds/) **[V]**.
- **Collections:** Shangri-La (sheer with adjustable vanes), Vertical Drapery, Roman, Zebra, Honeycomb/Cellular, and Roller (sheer, solar, light-filtering, privacy, room-darkening, blackout).
- **Operation:** manual or motorized. Motorized options are remote, wall switch or compatible smart-home system, with individual or grouped control.
- **Channels:** professional install, a **DIY supply program**, and **trade/wholesale** for builders, designers and dealers, "across the United States".
- **No dedicated quote form.** The CTA goes to /contact-us/.

### 2.9 Warranty, install, permits, engineering (summary)

- **Warranty:** 20-year structural, shown as "20-yr Warranty on structures" on the homepage **[V]**. **[OLD]** Prestige had 15 years; motors and electronics had 5+ years.
- **Install time:** **[OLD]** 1–3 days typical; Lux 2–5 days.
- **Permits:** **[OLD]** "permit assistance"; "engineered drawings, HOA submittals, and city permit paperwork". The OEM offers HOA drawings.
- **Engineering ratings:** see the warnings in 2.2. Nothing is stamped or certified on the site.
- **Materials:** powder-coated aluminum **[V]**. The OEM uses AkzoNobel powder on 6063-T6 for LUX and 6063-T5/T6 for ECO/M6 **[V-OEM]**.

---

## 3. Pricing

### 3.1 What 99 Pergolas publishes [V]

- **No prices, "starting at" figures or per-square-foot rates** anywhere, current or old. The old FAQ #16 said: "Prices vary by size, features, and options … exact quote during your free consultation."
- **Relative tier:** Lux "$$$$" vs Prestige "$$$" **[OLD chart]**.
- **Financing:** an "Apply Now" button links to **HFS Financial** at `https://www.hfsfinancial.net/promo/67f7fef2c6cd95578286fcfc/`. Current claims: "Fast online pre-qualification · No impact on your credit to check eligibility · Flexible monthly payment plans · No down payment options for qualified applicants". **[OLD]** "Monthly payment plans with low or 0% interest (O.A.C.)".
- **HFS terms (third-party, possibly outdated):**
  - Unsecured home-improvement loans
  - Roughly $2k–$150k+
  - 3–20 year terms
  - Soft pull
  - Funded 100% up front
  - Sources: [HFS brochure](https://cambridgepavers.com/dfiles/HFS_Home_Brochure_Cambridge.pdf), [Aqua directory](https://aquamagazine.com/directory/business-services/financial-services/company/15115553/hfs-financial-services)
  - **Do not hard-code APRs.**
- **Measurement visit:** "A $200 site visit fee is required when our team arrives. This fee is fully credited toward your final invoice if you proceed with a pergola purchase." This is a required checkbox on the booking form.

### 3.2 Industry benchmarks (installed, US)

| Source | Figure |
|---|---|
| HomeGuide 2026 (louvered) | $6,500–$18,000 average, or **$45–$125/sq ft** installed. Motorized: **$55–$125/sq ft**. Smart/automated: **up to $175/sq ft**. ([homeguide.com/costs/louvered-pergola-cost](https://homeguide.com/costs/louvered-pergola-cost)) |
| HomeGuide brand figures | **Equinox $65–$100/sq ft**, **Azenco $80–$120/sq ft**, **StruXure $150–$200/sq ft** installed (same source; Equinox also confirmed by [Pergola Cave](https://pergolacave.com/blogs/blog/pergola-cost-los-angeles)) |
| Arrow Outdoor Living | 12×20 StruXure-class system **$36,000–$48,000** installed ([link](https://arrowoutdoorliving.com/how-much-does-a-pergola-cost/)) |
| The Luxury Pergola (direct-to-consumer, DFW-served, excludes install) | 10×10 from $17,555; 12×16 from $24,168; 12×20 from $28,340; 14×20 $34,236; 20×20 Pro $55,000; contractor install $2k–$5k. It claims Fort Worth contractors charge $40k–$60k. ([link](https://theluxurypergola.com/pages/the-luxury-pergola-cost), [Fort Worth](https://theluxurypergola.com/pages/fort-worth-texas-pergola)) |
| Pergolux kits (DIY, low end) | 10×10 S3 manual $4,732; Sundream motorized $5,984 (quoted on the Luxury Pergola page above) |
| Motorized screens, Dallas | **$4,000–$9,000 per opening** (Audie Builds Dallas); $3,500–$7,000 (Richardson page); Texas guides $2,000–$5,000; national $3,500–$8,000+, with multi-opening patios at $8k–$25k+ ([audiebuilds.com/motorized-screens/in/dallas](https://audiebuilds.com/motorized-screens/in/dallas), [customshadeandshutter.com](https://www.customshadeandshutter.com/exterior-patio-shades-cost-texas/), [goretractable.net](https://goretractable.net/2026/02/09/whats-the-real-cost-of-motorized-retractable-screens/)) |

### 3.3 Proposed estimation model [I]

This is not 99 Pergolas' pricing. Calibrate it with the client before launch, and show it as a **range** ("Estimated $X–$Y installed"), never as a firm quote.

**Positioning [I].** Both lines are imported OEM product with in-house installation. That places them in the Equinox/Azenco band, below StruXure.

**Base structure rate**, in $/sq ft of roof footprint, installed, including standard motorization, posts, gutters and basic install:

| Line | Low | Mid | High |
|---|---|---|---|
| Prestige | $55 | $70 | $85 |
| Lux | $75 | $95 | $120 |

**Base modifiers:**
- Minimum project charge of about $9,000 (Prestige) or $12,000 (Lux).
- Wall-hanging / floating: +10–15% for the concealed support and engineering.
- Custom shape or multi-bay: +5% per extra bay for shared-post detailing.
- Custom RAL color: +5–8% on the structure.
- Two-tone frame and louver: +0–3%.
- Clear height over 9'0": +5%.

**Adders (each)**

| Item | Low | High | Notes |
|---|---|---|---|
| Warm-white LED package | $800 | $2,000 | Included in Lux? Confirm. |
| RGB package | $1,000 | $2,500 | Lux only |
| Rain sensor | $300 | $600 | Included in Lux per the old chart |
| Wind sensor (screens) | $250 | $500 | |
| Ceiling fan | $600 | $1,500 | Per fan |
| Infrared heater | $800 | $2,000 | Per heater |
| Mobile app / voice hub | $300 | $800 | Lux only (Tuya) |
| Electrical run to pergola | $1,000 | $3,000 | Depends on distance |
| Permit / engineering / HOA package | $500 | $2,000 | |
| Motorized screen | $3,500 or ~$45/sq ft | $7,500 or ~$75/sq ft | Per opening; DFW benchmarks |
| Fixed louvered privacy panel | $40/sq ft | $70/sq ft | |
| Sliding shutter | $60/sq ft | $100/sq ft | |
| Bifold shutter | $70/sq ft | $110/sq ft | |
| Framed sliding glass | $80/sq ft | $120/sq ft | |
| Frameless sliding glass | $100/sq ft | $150/sq ft | |

**Formula.** `total = max(min_charge, area_sqft × base_rate[line] × Π(modifiers)) + Σ adders`. Display low to high, rounded to the nearest $500.

**Sanity check.** A 12' × 16' Prestige (192 sq ft) gives ≈ $10.6k–$16.3k for the structure alone. A Lux of the same size with LED, RGB, one fan, one heater and two screens gives ≈ $28k–$47k. Both fall in line with the HomeGuide and Luxury Pergola benchmarks.

---

## 4. Lead flow (current)

**Entry points [V]**
- Header "Call Now" (`tel:16822415877`).
- Homepage CTAs: "Get a Free Estimate", "Book Your Measure", "Finance Now".
- The homepage footer modal "What are you planning?" routes to the pergola or screen estimate forms, or to contact.
- tawk.to chat on every page.
- Email info@99pergolas.com.
- Phone hours: "Monday to Saturday".
- **[OLD]** "DM us 'DESIGN' on Instagram"; WhatsApp mentioned.
- No Calendly or online booking calendar. Measurement booking is a form, followed by a phone or email confirmation ("within 24–72 hours to schedule. An adult must be present").

**Forms (all Contact Form 7) [V]**

| Form (CF7 id) | Page | Fields (name: values) |
|---|---|---|
| **Pergola estimate (1643)** | /free-estimate-custom-pergola/ | `full-name`*, `phone-number`*, `date`*, `email-address`*, `address`*, `zip-code`*; `length`*, `width`*, `height`* (free text, no units); `model`: Lux Line / Prestige Line; `pergola-design`: Freestanding / Wall Mounted / Wall Hanging / Custom Shape; `accessories[]`: LED-lighting, RGB-lighting, Rain-sensor, Ceiling-fan, Electric-heater; sides grid (`ms*`, `fsw*`, `ss*`, `fold*`, `fsgd*`, `frsgd*`, each `-w/-h/-pcs` ×2); `louver-color` + `custom-louver-color`; `frame-color` + `custom-frame-color`; `control-system`: Remote / Mobile App; `radio-606` (usage): Residential, Commercial, Poolside, Rooftop, Balcony, Garden, Lawn; `site-photo` (file). Promise: "Reply within one business day"; "Approximate measurements are fine". |
| **Screen estimate (1783)** | /free-estimate-custom-motorized-screen/ | `full-name`*, `phone-number`*, `estimate-date`, `your-email`*, `project-address`*, `zip-code`*; `installation-type`; `openings` (1–6, More); `width-1..3`, `height-1..3`; `photo-upload`; `frame-color`(+custom); `fabric-color`(+custom); `fabric-openness`; `wind-sensor`; `motor-type`; `project-type`; `additional-notes` |
| **Measurement booking (1448)** | /measurement-booking/ and /measurement-form/ | `first-name`*, `last-name`*, `primary-phone`*, `your-email`*, `address-line`*, `city`*, `state`*, `zip`*, `Message`, `site-fee-agreement[]` ($200 credited fee). The visit includes "On-site measurement · Custom design consultation · **3D drawings** · Materials & style guidance · Transparent pricing · Warranty overview". |
| **Contact (1864)** | /contact-us/ | `your-name`*, `your-phone`*, `your-email`*, `your-city`, `your-service` (Custom Aluminum Pergola / Motorized Patio Screens / Motorized Indoor Blinds / Sliding Glass Systems / Aluminum Shutters / Privacy Panels / Outdoor Kitchen / Not sure yet), `your-message` |

**Process [V]**
- The homepage strip reads "01 WE MEASURE · 02 WE DESIGN · 03 WE BUILD · 04 WE INSTALL".
- The estimate pages describe three steps: review request, recommendations (line, configuration, colors, accessories), then measure and install.
- **[OLD]** "Book your free measurement → Approve your custom 3D design → Confirm quote and timeline → We fabricate & install in days".

**Service area [V]**
- Current: Celina, Prosper, Frisco, McKinney, Plano, Allen, Little Elm, Aubrey, The Colony, Denton, Flower Mound, Southlake, Grapevine, Highland Park, University Park, Dallas and Fort Worth ("17+ communities"), plus the DFW Metroplex.
- Gallery and project locations also include Irving and Midlothian.
- **[OLD]** "Houston Metro, Austin Metro, Projects across Texas and the U.S. by request". The current site is DFW-focused.

**Implication for the configurator [I]**
- Its output should fill every field of form 1643 or 1783, with units made explicit (feet and inches).
- It should attach a rendered image, add a photo upload, and end with two CTAs: "Send my design for a free estimate" and "Book my measure ($200, credited)".
- Collect a ZIP code early and soft-gate on the DFW service ZIPs.

---

## 5. Brand assets

**Logo [V]**

| File | Description |
|---|---|
| `https://99pergolas.com/wp-content/uploads/2026/07/logo-white.png` | Current header and footer logo, white |
| `…/2026/07/logo-white-brassmark.png` | White wordmark with a brass/tan louvered-cube icon |
| `…/2025/09/logo-scaled.png` | Black serif wordmark "99 PERGOLAS" with a grey isometric louvered-cube line icon |
| `…/2025/03/99-perg-logo-small.png` | Old logo |
| `…/2025/07/cropped-cropped-99-Perg-Logo-2-{32,180,192,270}.png` | Favicons |

The wordmark is a classical serif in a Trajan-like style; the exact font was not identified. **[I]**

**Colors** (CSS custom properties on `.np99` and `footer`) **[V]**:
- `--ink #171A18`, `--ink-2 #20241F`, footer `--ink #101311`
- `--paper #F2F1EC`, `--card #FFFFFF`, `--line #DCD9D0`, `--line-dark rgba(255,255,255,.12)`
- `--text #22251F`, `--muted #62655D`, `--muted-dark #A8ABA1`, footer text `#C9CCC4`, dim `#8B8E85`
- **Accent brass/gold `--accent #B4863B`**, `--accent-deep #8F6A2B`, `--accent-soft rgba(180,134,59,.14)`
- `--radius 14px`, `--wrap 1240px`

**Fonts [V]**
- `--display: "Archivo"`, a variable-width font (wdth 62–125, wght 100–900).
- `--body: "Instrument Sans"`.
- Both load from Google Fonts. Divi also loads Open Sans and Archivo defaults.

**Taglines [V]**
- Current:
  - "Premium Outdoor Living, Built for North Texas."
  - "Luxury Shading & Outdoor Living Specialists"
  - "From Design to Shade — Your Custom Pergola Starts Here"
  - "Two Lines. One Standard of Quality."
  - "Enjoy Your Patio Year-Round."
  - "Cook, Entertain, Live Outside."
  - "Perfect Light. One Touch Away."
  - "Built Across North Texas, One Project at a Time."
- **[OLD]:**
  - "Rain or Shine, Stay Outside!"
  - "Texas' #1 Custom Aluminum Pergola"
  - "Built for Texas! Built for Life!"
  - "We Measure, Custom-size, Design and Install!"

**Proof points [V]:** 14+ years of international experience · 20-year structural warranty · 17+ communities · Residential and commercial · Financing.

**Image style [V/I]**
- Dark, upscale dusk and night scenes that show warm LED glow, plus a mix of OEM photoreal renders (grey anthracite frames, white backgrounds) and real install photos.
- The new site uses WebP banners with descriptive alt text.
- The new layout is dark ink with an off-white paper background, brass accents, a 14px radius, and a "reveal" scroll animation.

**Social [V]**
- Instagram [@99pergolas](https://www.instagram.com/99pergolas/), Dallas TX; about 283 followers per search snippet.
- [Facebook](https://www.facebook.com/p/99-Pergolas-61575691640781/): about 17 likes, "Not yet rated (0 Reviews)" per search snippet.
- [LinkedIn](https://www.linkedin.com/company/99-pergolas/).
- **No Google Business reviews, Yelp, Houzz, BBB, or press coverage were found.**
- Yoast Local SEO lists the Addison address and phone, but the geo coordinates and schema logo URL are empty.

---

## 6. Existing 3D design / visualizer

- **Claims [V]:**
  - Measurement page: "3D drawings".
  - **[OLD]** homepage: "on-site measurement and 3D custom design".
  - **[OLD]** FAQ: "Approve your custom 3D design".
  - **[OLD]** Sides page: "FREE 3D Estimate".
  - **[OLD]** Accessories page: "During your on-site measurement and 3D design session … We'll even mock it up visually".
  - **[OLD]** Showroom page: "use our online showroom to explore design styles, color options, and enclosure fabrics". That showroom was static images.
- **No interactive 3D tool or visualizer script was found** on any page: no three.js, model-viewer, Sketchfab or vendor embed. **[V]**
- **Likely tooling [I].**
  - Many 3D images in the media library are AlunoTec factory renders. Examples: `C-Pergo-T600-4x6-灰-无框玻璃门固定百叶屏风叶片灯…` (grey, frameless glass door, fixed louver screen, blade lights), `B-Pergo-M6-Pro-4x4-灰-加热器…` (grey, heater), `3D-Rendering-22-scaled.jpg` and `B-T600-4×6-grey`.
  - AlunoTec markets "3D" design support to dealers.
  - So the "3D drawings" are most likely produced by the OEM from the measured dimensions, or in-house in SketchUp or a similar tool, then sent as images or PDF.
  - The engineering team should treat the configurator as **replacing or front-loading that 3D step**, and could reuse the OEM geometry as reference.

---

## 7. Configurator parameters (recommendation) [I unless cited]

**General rules**
- Units are US feet and inches. Accept inputs like 12' 6"; display ft-in; store inches internally.
- Default step is 1 inch. Offer a 6-inch "quick" slider step.
- Snap louver count to the blade pitch: about 6.7 in (170 mm) for Prestige, from the OEM blade. Lux pitch is TBD, assume about 7–8 in.
- Louvers span the **shorter** dimension of a bay and stack along the longer beam. This is consistent with OEM bay maximums of 4 m (louver length) × 6 m.

### 7.1 Louvered pergola (Lux / Prestige)

| Parameter | Type / options | Default | Constraints |
|---|---|---|---|
| Line | Lux, Prestige | Prestige | Drives the limits below |
| Mounting | Freestanding, Wall-mounted, Wall-hanging (floating), Custom (multi-bay / L) | Freestanding | Wall types remove the posts on the house side and need a wall material choice (brick, siding/stucco, stone) and a ledger height check |
| Width (louver span, per bay) | ft-in | 12'0" | Min 7'0"; **max single bay: Prestige 13'1", Lux 19'8"** (OEM) |
| Length (projection / beam direction, per bay) | ft-in | 16'0" | Min 7'0"; **max single bay: Prestige 19'8", Lux 22'11"** (OEM) |
| Overall size (multi-bay) | Auto-split into bays, adding shared posts | n/a | Soft cap about 40' × 40' (larger means custom quote). OEM standard 5 × 10 m (16'5" × 32'10") shows multi-bay is routine. |
| Clear height (grade to underside of beam) | ft-in | 8'6" | Min 7'0"; max **9'10"** (3 m OEM post); above 9'10" means custom/engineering |
| Post size (display only) | 5 7/8" square | n/a | From the 99 Pergolas chart |
| Post count / offset posts | Auto (4 per bay, shared on joins); "offset post" toggle (Lux) | Auto | Offset per the `Luxe-Line-with-offset-Posts` image |
| Louver angle (preview) | Slider | 0° (closed) | **Lux 0–105°, Prestige 0–90°** |
| Frame color | Black, Grey, White, Custom RAL (picker) | Black | Matches the form field `frame-color` |
| Louver color | Black, Grey, White, Custom RAL | Same as frame | Matches `louver-color`; allow two-tone (old "Grey+White") |
| Control | Remote; Mobile app (+ voice) | Remote (Prestige), App (Lux) | **[OLD]** App and voice were Lux only; the current form allows both. Make it configurable by admin. |
| LED (warm white) | Toggle | On for Lux | n/a |
| RGB | Toggle | Off | Lux only **[OLD]** |
| Rain sensor | Toggle | On (Lux, included) | n/a |
| Ceiling fans | 0–2 per bay | 0 | Needs a center beam or louver bay; recommend 1 per ~150–200 sq ft |
| Infrared heaters | 0–4 per bay (wall, post or ceiling mount) | 0 | Recommend 1 per ~100 sq ft for comfort |
| Sides | Per bay side: None / Motorized screen / Fixed privacy panel / Sliding shutter / Bifold shutter / Framed sliding glass / Frameless sliding glass | None | Width = bay side length; height = clear height. Screens split if wider than about 16'–20'; shutter panels about 2'–3' each; glass panels about 3'–4' each. Industry zip screens reach about 16–25' wide and 11–16' tall depending on the model ([Phantom Screens](https://www.phantomscreens.com/?p=33608), [Zipscreen brochure](https://cdn.b12.io/client_media/Lt5VjdLq/a9abcb9e-b915-11ed-8d30-0242ac110002-Zipscreen_brochure.pdf)). Default the cap to 16' wide × 10' tall until the client confirms OEM limits. |
| Screen fabric (if screens) | Openness / sun-block: Blackout, 99, 97, 95, 90, 70, 60; fabric color Black / White / Grey / Beige / Custom | 95% | Matches the screen form values |
| Usage | Residential, Commercial, Poolside, Rooftop, Balcony, Garden, Lawn | Residential | Form field `radio-606` |
| Site context | Ground surface (concrete, pavers, deck, grass), house wall material, ZIP code, photo upload | n/a | Drives footing, permit and adder logic |

**Validation rules**
- Prestige bays above the limits auto-add a bay or suggest Lux.
- RGB, app and voice are disabled on Prestige when admin "Lux-only" flags are set.
- Wall-hanging requires a wall height of at least clear height plus about 10 in for beam depth (OEM beam ≈ 7.5 in tall).
- Warn when a side opening exceeds the per-unit screen or glass maximum, and split it automatically.

### 7.2 Motorized patio screen (standalone)

| Parameter | Options | Default | Range |
|---|---|---|---|
| Mount structure | Brick, Aluminum frame, Wood frame, Metal, Other | Wood frame | n/a |
| Number of openings | 1–12 (form allows "More") | 1 | n/a |
| Opening width | ft-in, step 1" | 10'0" | 3'0"–20'0" (above that, split or custom) |
| Opening height (drop) | ft-in, step 1" | 8'0" | 3'0"–12'0" (larger means custom) |
| Mount style | Inside / outside face (recess) | Outside | Inference: affects housing |
| Frame / housing color | Black, White, Grey, Custom | Black | n/a |
| Fabric color | Black, White, Grey, (Beige), Custom | Black | n/a |
| Openness | Blackout, 99%, 97%, 95%, 90%, 70%, 60% | 95% | n/a |
| Wind sensor | Yes / No / More info | Yes | n/a |
| Control | Remote, Mobile app | Remote | n/a |
| Project type | Residential, Commercial | Residential | n/a |

### 7.3 Motorized indoor shades

| Parameter | Options | Range |
|---|---|---|
| Style | Shangri-La, Vertical Drapery, Roman, Zebra, Honeycomb, Roller | n/a |
| Per-window width × height | inches, step 1/8" (standard for blinds) | Width 12"–144" (vertical drapery up to about 192"); height 12"–144". Typical industry limits; confirm with the supplier. |
| Mount | Inside / outside | n/a |
| Opacity | Sheer, Light-filtering, Privacy, Room-darkening, Blackout (per style) | n/a |
| Operation | Manual, Remote, Wall switch, Smart home | n/a |
| Fabric color | Neutral palette (TBD from supplier book) | n/a |
| Service | Professional install, DIY supply, Trade | n/a |
| Quantity / rooms | Add multiple windows | n/a |

### 7.4 Other products

- **Shutters, privacy panels and glass as standalone products.** Reuse the side-enclosure module. Inputs: opening width, height, panel count (auto) and color (RAL).
- **Outdoor kitchens.** "Coming Soon" **[V]**. Make this a simple placeholder lead module (linear feet of island, L or U shape, grill and fridge checkboxes, countertop material) rather than full 3D.
- **Carports.** **[OLD]** only. If the client revives them, use the pergola module with a "Cantilever carport" mount: single-side posts, 1–2 car widths (10'–20'), depth 16'–20', clear height 7'6"–9'.

### 7.5 Output to the lead

Produce four things:
1. A summary that maps one-to-one to the CF7 field names in section 4.
2. A rendered PNG at three-quarter view, plus a top-down dimensioned plan.
3. The estimated price range with its assumptions.
4. The CTAs "Request my free estimate" and "Book measurement ($200, credited)". Also show an HFS financing link with an estimated monthly payment at the user's chosen term, labeled O.A.C. Do not show APR figures.

---

## 8. Source index

- Current site: https://99pergolas.com/, /pergolas/, /motorized-screens/, /indoor-blinds/, /gallery/, /about-us/, /contact-us/, /free-estimate-custom-pergola/, /free-estimate-custom-motorized-screen/, /measurement-booking/, /measurement-form/, /robots.txt, /sitemap_index.xml, /locations.kml, /wp-json/, /wp-json/wp/v2/media
- Old site (Wayback):
  - http://web.archive.org/web/20260712204737/https://99pergolas.com/
  - /lux-and-prestige-pergola/, /sides/, /accessories/, /showroom/ (captures around 2026-01-12)
- Spec images on 99 Pergolas:
  - `/wp-content/uploads/2025/04/line-comparaison-scaled.jpeg`
  - `/2025/04/dl1hm9ohdd675djizaoo-scaled-1.webp`
  - `/2025/04/Luxe-Line-T600-Post-scaled.jpg`
  - `/2025/04/Prestige-Line-Pergo-M6-Pro-Post.jpg`
  - `/2025/04/Luxe-Line-Blade-Rotation-2.jpg`
  - `/2025/04/Luxe-Line-with-white-grey-black-and-customized-colors.jpg`
  - `/2025/03/IMG_2080.webp` (RAL)
  - `/2025/03/IMG_2081.webp` (fabrics)
  - `/2025/03/B-T600-4×6-grey.webp`
- OEM:
  - https://www.alunotec.com/products/Pergo-T600.html
  - https://www.alunotec.com/pergo-lux-custom-aluminum-pergola.html
  - https://www.alunotec.com/alunotec-new-pergo-m6-pro-easy-installation-better-waterproof-motorized-louvered-pergola-kits.html
  - https://www.alunotec.com/compare-aluminum-pergola-models.html
  - https://www.alunotec.com/pergo-eco-patio-aluminum-pergola.html
  - https://www.alunotec.com/pergola-optional-add-ons.html
- Pricing: HomeGuide, Pergola Cave, Arrow Outdoor Living, The Luxury Pergola, Audie Builds, Custom Shade & Shutter, Go Retractable, and the HFS brochures (links inline in section 3).
- Social: https://www.instagram.com/99pergolas/, https://www.facebook.com/p/99-Pergolas-61575691640781/, https://www.linkedin.com/company/99-pergolas/
