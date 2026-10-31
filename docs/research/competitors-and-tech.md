# 3D Pergola Configurator: Competitors, Platforms, Stack, Geometry, Pricing

Prepared for: 99 Pergolas (Texas, aluminum louvered pergolas). Research date: 2026-10-31.
Scope: research only. Pergolux was covered separately and is skipped here.

**How to read this.** Lines marked **[F]** are facts from a cited source, or from what I saw in a site's public front-end code (I fetched the HTML and JS bundles and looked for library and vendor fingerprints). Lines marked **[I]** are my own inferences or recommendations. Prices from contractor blogs are marketing estimates, not audited data.

---

## A. Competitor and best-in-class configurator teardowns

### A1. StruXure Pergola X Visualizer (category leader, US). Best reference build
- **URL:** https://visualizer.struxure.com/. It is linked from the struxure.com nav as "Pergola X Visualizer". A separate Cabana X configurator is at configurator.struxure.com. [F]
- **Tech [F, from the bundle]:** Vite SPA with React, React Router, `@react-three/fiber` and three.js **r180**, GSAP for camera tweens, and Tailwind. Geometry is mostly procedural: `boxGeometry`, `extrudeGeometry`, `cylinderGeometry`, `rectAreaLight` for LED strips, and `meshStandardMaterial`. There is even a procedural reference house (walls, hip roof, windows, chimney) used for house-mount context. **AR** loads Google `<model-viewer>` 3.5.0 on demand and exports the live scene to GLB. The backend is Supabase plus Netlify Functions (`configurator-save`, `configurator-load?code=`, `dealer-names`, `gravity-form-submit`). Built-in telemetry tracks step views, abandonment, frame stalls and long tasks, and there is an in-app bug reporter that files Linear tickets with html2canvas screenshots.
- **Steps [F]:** Size, then Color & Finish, Screens, Mounting, Fans & Lighting, Heat & Sound, Explore, and Review & Share.
  - Size offers "Popular Sizes" presets (14'x14', 12'x16', 12'x20', 14'x20'), a "Custom Coverage" option where you type width and length and it generates two panel layouts, and a "Custom Pro Design" freehand zone drawing tool.
  - Other parameters: multi-zone layouts, louver type, frame and louver colors separately, house mount (yes/no and style), screens (solar, bug, insect or privacy mesh), privacy slats, glass panels, fan count and color, lighting (beam lights, gutter LEDs), Bromic and Infratech heater SKUs, speakers, cornice and crown trims, post accessories, and even decks and outdoor kitchens.
- **Pricing [F]:** none shown. Instead the tool shows soft complexity warnings that push toward a dealer: "Larger structures benefit from on-site assessment", "Fan + multiple lighting systems need electrical planning", "Refine your design with your local dealer."
- **Lead capture [F]:** the final step collects first name, last name, email, phone, project type, role, address, "working with a dealer?" and dealer name. It submits to a WordPress **Gravity Form** together with a **share link** (required), a design summary, and **UTM / organic / referral attribution** stored in a 30-day cookie. Dealer routing uses Salesforce dealer IDs.
- **Save/share [F]:** short share code with a `SharedDesignViewer` route. PDF export: not seen. Embed: standalone subdomain opened in a new tab (`target=_blank`), not iframed.
- **Good [I]:** the fastest path to a credible design (presets first), procedural geometry (tiny downloads), AR, share links tied to every lead, attribution, and serious observability.
- **Bad [I]:** no price anchor at all. The scope (decks, kitchens, heaters) is far beyond what a regional installer needs. A separate subdomain means no shared session with the marketing site.
- **Also [F]:** StruXure's FAQ says dealers offer 3D renderings "at a very minimal cost" (https://struxure.com/faq/). Several dealers embed their own copies, for example https://www.distinctiveos.com/pergola-configurator (Wix site) and https://struxurepnw.com/pergola-visualizer/.

### A2. Azenco R-Blade 3D configurator (built by dealer Breslow)
- **URL:** https://3d.breslow.com/. Breslow is an Azenco dealer (https://breslow.com/products/r-blade-pergola/). Azenco's own homepage has a lighter "Made to Measure" sampler. [F]
- **Tech [F, from the bundle]:** Vite build with vanilla **three.js**, lil-gui 0.21, an RGBE HDR environment, SSAO and UnrealBloom post-processing, a "PhotoMode" chunk with ACES/AgX tone mapping, and a **SunSimulator** (date, time, location lookup via OpenStreetMap Nominatim, compass, "Face Sun / Face Away"). State is read from URL params (`w`, `l`, `h`).
- **Parameters [F]:** roof type (R-Blade, R-Shade or R-Breeze), zones added along length or width (length-to-length, width-to-width or mixed), wall attachment per side, frame and blade colors (White, Charcoal, Black, Bronze), a lights & fan package or custom counts (recessed, LED bar, solar post, fan), retractable shades per side, louver open/close angle, post management with a max-span warning, and post size (6.5"x6.5"x12' or 8"x8"x15').
- **Geometry constants hard-coded [F]:** max single zone 192" x 276" (16' x 23'). Max span 23'-0", or 30'-0" with a structural header. Post 6.5". Main beam 14" tall. Blade chord 9.5" and thickness 2.125". Default post height 10'. Minimum dimension 72".
- **Pricing [F]:** it generates a full BOM with SKUs (POST-6512, BEAM-STRUCT, LIGHT-RECESS, FAN-CEILING and so on), but every `unitPrice` is 0. In other words, pricing is architected but switched off. No lead form inside the 3D tool.
- **Azenco corporate [F]:** the homepage tool is "a sample, not the full catalog". The CTA is "Get a Quote for This Design". The FAQ says installed cost "typically ranges from $15,000 to $40,000+" (https://azenco-outdoor.com/).
- **Good [I]:** the sun/shadow simulation is the single most persuasive feature for a louvered roof. The BOM-driven design makes pricing a data problem, not a code problem.
- **Bad [I]:** a dev-tool feel (lil-gui panels) and no lead capture inside the tool.

### A3. Equinox Louvered Roof Visualizer (Amerimax / Euramax)
- **URL:** https://www.equinoxroof.com/visualizer/. It **301-redirects to `equinox.chameleonpower.com`**, which means the vendor is **Chameleon Power**, a photo and visualizer vendor. [F]
- **Features [F]:** adjust louvers, set the sun position and time of day, "add rain". "Works best with Chrome or Firefox." It offers SketchUp files for pros (https://www.equinoxroof.com/resources/). A dealer version (Four Seasons) adds an AR mode using the phone camera. Its lead form asks for name, phone and product (required) plus email and zip (optional), with TCPA consent (https://www.four-seasons-motorized-pergolas.com/louvered-roof-visualizer/).
- **Pricing:** none. **Bad [I]:** a vendor-hosted, browser-sensitive tool behind a click-to-load placeholder. It feels dated next to StruXure.

### A4. Renson Outdoor Configurator (Belgium, sold in the US)
- **URL:** https://configurator.renson-outdoor.com/en/. [F]
- **Tech [F]:** ASP.NET MVC with jQuery, Bootstrap, SignalR and Google Maps (dealer locator). There are user accounts ("Login", "Open configuration"). Products are Camargue, Algarve and Amani, and "configuration templates" serve as starting points.
- **Flow [F]:** "save and share it with a dealer". Renson's product pages say changes are "immediately reflected in the visualization". **Pricing:** consumer side none. Dealer pricing lives in a separate "RIO Outdoor" ordering platform (https://renson.net/en-us/pro).
- **Bad [I]:** login-gated saving adds friction. Good: templates, and a dealer locator built into the handoff.

### A5. Brustor 3D Simulator (Belgium; B200 XL louvered and others)
- **URL:** https://www.brustor.com/en-us/3d-simulator, with the app at `3dsimulator.brustor.com`. [F]
- **Tech [F, from the bundle]:** **Angular + three.js** (3.7 MB main bundle).
- **Flow [F]:** roof type (fabric or louvered), then attached/freestanding, dimensions, screens and lighting, color. You can **upload a photo of your garden and place the 3D model on it**. Then you pick a nearby dealer and send the design for a custom quote. It has presets for each model.
- **Pricing:** none. **Good [I]:** the photo-placement feature is a cheap stand-in for AR that works on desktop too.

### A6. Sunzout motorized louvered configurator (US DTC kit seller). Closest DTC analog with price logic
- **URL:** https://designer.brendanwilliamdesigns.com/pergola-configurator. It is built with **Lovable** (Vite/React; the page metadata names Lovable). [F]
- **Parameters [F]:**
  - Mount: freestanding, 1-wall or 2-wall (corner).
  - Width and projection 9–40 ft, height 8–12 ft, in 1-inch steps. Max unsupported beam span 20 ft.
  - Frame and louver color separately (Matte Black, Bronze, Dark Gray, Light Gray, Sand, Light Tan, White, Custom). Louver direction (parallel to width or projection).
  - Motorized (included) or manual (−$100).
  - Add-ons: LED (none, warm or RGB); Infratech 2000W heaters $720 each; fans with beam $650 each; soundbar $299; TVs $1,399–1,999; screens per side (mesh or clear vinyl); glass walls per side (sliding, fixed or bi-fold); privacy slat walls; rain+wind sensor +$190.
  - Shipping/unloading as a percentage of price (10% up to $7k and 7% above, or 20%/14% with carrier unloading).
  - A diagram legend (post 8"x6", beam 9" tall, clearance 8'3").
  - An optional **free AI preview** that places the pergola into the user's patio photo.
- **Pricing presentation [F]:** add-on prices are shown, but the base price is hidden until after the lead form: "Your full price breakdown and estimated total will appear on the quote page after you submit your info." The quote is also emailed. There is a "Schedule a Call With a Designer" link.
- **Good [I]:** price-gating as a lead magnet, and visible add-on prices that build trust. **Bad [I]:** not true 3D, and a generic look.

### A7. Paragon Outdoor "Signature" (US e-commerce)
- **URL:** https://paragon-outdoor.com/products/signature-louvered-pergola. It uses Shopify variant selectors, plus "Customize + Add to cart" leading to an external configurator at signature.paragon-outdoor.com. [F]
- **Specs and price [F]:** "Starting from $9,215.67" (shown as a sale from $10,239.63). 135° motorized louvers. Max footprint 38'7" x 13'2" x 9'9" (fixed height). 120 mph wind and 24.5 psf snow ratings. 18"x18"x30" footings. About 12 weeks made to order. ShopPay financing.
- **[I]:** a "Starting from" anchor price is the standard e-commerce pattern. It is useful as an anchor even for an installer.

### A8. Adjacent categories (the UX patterns worth copying)

| Tool | URL | Tech (observed) | Live price | Notes |
|---|---|---|---|---|
| **Tuff Shed** configurator | https://www.tuffshed.com/configure → `tuffshed.kbmax.com` | **KBMax (now Epicor CPQ)**: AngularJS app, viewer and rules bundles on Azure CDN [F] | Yes, priced by ZIP. A running price tracker vs. budget; save a no-obligation quote or buy online [F] (https://www.888tuffshed.com/bringing-customization-to-a-new-level/, older article) | The gold standard for "live price + save quote". Enterprise CPQ cost. |
| **Morton Buildings 3D Studio** | https://mortonbuildings.com/3d-studio, which iframes `3dstudio.mortonbuildings.com` [F] | Not identified (bot wall) | No | Size the building around your equipment; save, print, shareable rendering; hand off to a sales consultant [F] (https://mortonbuildings.com/blog/designing-your-own-building-with-the-morton-buildings-new-3d-studio). An iframe embed is the same approach recommended below. |
| **Trex Deck Designer** | https://deckdesigner.trex.com | **Unity WebGL** (`unity-canvas`, co-branded with Home Depot) [F] | No (materials list) | Trex says it is for laptop or desktop. Unity's payload hurts mobile [I]. |
| **TimberTech Deck Designer** | https://deckdesigner.timbertech.com | **Babylon.js** (10 MB bundle) plus **Marketo** forms [F] | No (take-off list) | Free account to save designs [F]. A heavy bundle [I]. |
| **Alan's Factory Outlet** 3D carport/garage builder | https://alansfactoryoutlet.com/3d-carport-and-metal-garage-builder/ | Behind Cloudflare. Vendor unconfirmed | Yes, ZIP-based (codes vary by state) [F] | Save by emailing the design [F]. |
| **Viking Metal Garages / Viking Steel** | https://3destimator.vikingmetalgarages.com/ | `carportview.com` loader that redirects to **js.idearoom.com** (vendor **IdeaRoom**) [F] | Yes (real-time) | IdeaRoom also targets pergolas and gazebos [F] (https://www.capterra.ca/software/159859/idearoom). |
| **Sensei Carports** (vendor) | https://www.senseidigital.com/3d-carport-builder/ | SaaS for dealers | Live pricing from 200+ manufacturers [F] | |
| Backyard Discovery / Costco / Sam's | samsclub.com listings | None | Fixed SKUs ("Choose Size", $1,999–$3,599) [F] | No configurator. They compete on price, not customization. |
| Elephant Structures | — | No official 3D tool found | — | Could not verify. |

### A9. Patterns across competitors [I]
1. **No premium louvered brand shows a live total price.** StruXure, Azenco, Equinox, Renson and Brustor all route to a dealer. **DTC kit sellers do show prices** (Paragon, Sunzout add-ons, Pergolux). **Shed and carport builders show live ZIP-based prices.** For an installer like 99 Pergolas, a **range estimate** ("Estimated $X–$Y installed") is a real differentiator against StruXure and Azenco dealers in Texas.
2. **The best tools start from presets**, not from a blank form: StruXure Popular Sizes, Renson templates, Brustor models.
3. **The sun/shade simulation** (Breslow, Equinox) is the louver-specific "wow" feature. It shows *why* adjustable louvers matter.
4. **Placing the design on your own space** is now common: AR (StruXure, Four Seasons), a garden photo (Brustor), an AI photo composite (Sunzout).
5. **Every lead carries a share link plus a design summary plus attribution** (StruXure). That is the minimum bar.
6. **Procedural geometry over GLB assets** is what the two most modern tools (StruXure, Breslow) both do. It confirms that no modelling is needed.

---

## B. Off-the-shelf configurator platforms: do they fit?

A 99 Pergolas configurator needs **continuous parametric dimensions** (width, length and height in inches, louver count derived from length, post count derived from span) plus **lead generation, not a cart**. Most platforms are built around swapping pre-made GLB meshes and e-commerce carts. Non-uniform scaling of a mesh distorts profiles and can't add louvers or posts, so those platforms fit poorly. [I]

| Platform | Pricing (source) | Parametric dims? | Fit for 99 Pergolas |
|---|---|---|---|
| **Threekit** | Not public. Third-party estimates run about $30k–$150k/yr plus implementation [F, estimates] (https://www.trustradius.com/products/threekit/pricing, https://cpq3d.com/3d-product-configurator-cost/) | Yes (rules plus procedural) | Enterprise overkill. Poor value. |
| **Zakeke** | Starter $59/mo (annual) or $69.90 monthly, plus a 1.9% transaction fee. Grow $110 (1.7%). Scale $255 (1.5%). Enterprise custom [F] (https://admin.zakeke.com/en-US/pricing) | Weak (mesh/variant swaps; pricing rules on Grow+) | Built for e-commerce personalization. The transaction-fee model assumes a cart. Poor fit. |
| **Expivi** | Quote-only. Core = Configure/Price/Quote with BOM; 3D/AR is an add-on; WordPress and Salesforce integrations [F] (https://www.expivi.com/pricing). A biased competitor estimates about €499/mo or more [F] | Some (dimension-driven pricing) | Plausible but CPQ-heavy, and you still pay for 3D modelling. |
| **Roomle (Rubens)** | About €100/mo (viewer) up to €1,450/mo (full-logic modular); enterprise custom [F] (https://www.roomle.com/en/pricing-2024-v2) | Modular (furniture-style grids) | Designed for furniture. Louver-count logic would be awkward. |
| **DynaMaker** | Directories list about €80–90/mo to start [F] (https://sourceforge.net/software/product/DynaMaker); real production tiers not public | **Yes (true parametric CAD, TypeScript)**; exports STEP, DXF, PDF | The best platform fit technically, but it is still a hosted lock-in, and you write code anyway. |
| **ShapeDiver** | Startup €199/mo (annual) or €299 monthly, 2k credits. Business €499/€799, 10k credits plus APIs. Domain whitelist 1+1 [F] (https://www.shapediver.com/pricing) | **Yes (Grasshopper)** | Strong for complex geometry. It needs Grasshopper/Rhino skills, every change makes a server round-trip (latency), and you pay per credit. Overkill for boxes and extrusions. |
| **Configura CET** | Desktop CET Designer about $1,260–1,420/user/yr [F] (https://www.capterra.com/p/10001623/CET-Commercial-Interiors/) | Yes | A dealer and space-planning desktop tool, **not** a consumer web configurator. Not a fit. |
| **Kickflip** | About $59/mo plus up to 1.95% per sale (sources conflict) [F] (https://apps.shopify.com/mycustomizer-1) | No (layered 2D/3D variants) | Shopify cart-centric. Not a fit. |
| **Shopify-native** (variants, `<model-viewer>`) | Included | No | Only fixed SKUs. Not a fit. |
| **Sketchfab Viewer API** | Free to Business plans; APIs to "continue to function" during the move to Fab [F] (https://sketchfab.com/blogs/community/sketchfab-update-what-you-need-to-know-now-that-fabs-live/) | No (toggle and recolor existing nodes) | Platform uncertainty and no parametrics. Not a fit. |
| **IdeaRoom** (vertical: sheds, carports, pergolas) | Not public. Capterra says "$500/user" [F]. Real-time pricing and dealer data inheritance [F] (https://www.idearoom.com/faq) | Yes for their product templates | The most relevant vertical SaaS. Worth a demo call if 99 Pergolas wants buy-not-build. Its look is generic and lock-in is high [I]. |
| **Configurix / "Pergola Configurator"** | Starting $499/mo [F] (https://www.capterra.com/p/10040551/Pergola-Configurator/) | Claimed | An unknown small vendor. Evaluate before trusting. |

**Verdict [I]:** **build custom.** The geometry is simple (boxes, extrusions, instanced louvers), StruXure and Breslow prove a small team can ship a premium result with R3F or three.js, and a custom build avoids $2.4k–$150k/yr in SaaS fees plus per-lead and per-transaction economics. The cost estimate is about 4–8 weeks of one senior front-end/3D developer for an MVP (my estimate). CPQ3D, a biased competitor, models a self-hosted three.js build at about €45k in year 1 (https://cpq3d.com/3d-product-configurator-cost/). Revisit **IdeaRoom** only if internal dev capacity is zero.

---

## C. Recommended custom stack (lead-gen, embeddable on WordPress)

### C1. Libraries (latest stable on npm as of 2026-10-31) [F: registry.npmjs.org]

| Package | Latest | Recommendation |
|---|---|---|
| `react` / `react-dom` | 19.3.1 | Pin 19.2.x or 19.3.x. R3F peer range is `>=19 <19.4`. |
| `three` | 0.187.0 (released 2026-10-30) | **Pin `0.186.1`** (2026-09-24). Wait at least 2 weeks before taking a new release. |
| `@types/three` | 0.187.0 | Match the three version (0.186.x). |
| `@react-three/fiber` | 9.8.2 | Use as is. |
| `@react-three/drei` | 10.7.9 | `Environment`, `ContactShadows`/`AccumulativeShadows`, `Text`, `Line`, `Bounds`, `PerformanceMonitor`, `AdaptiveDpr`, `RoundedBox`, `Instances`. |
| `@react-three/postprocessing` / `postprocessing` | 3.2.2 / 6.39.5 | Optional (N8AO, SMAA, bloom for LEDs). Desktop only. |
| `n8ao` | 2.0.1 | Ambient occlusion. Desktop only. |
| `zustand` | 5.0.16 | Configurator state. |
| `suncalc` | 2.1.1 | Sun position from lat/long, date and time (Texas default). |
| `@google/model-viewer` | 4.4.0 | Lazy-loaded AR (Scene Viewer / Quick Look) from a GLB exported via three's `GLTFExporter`. StruXure does exactly this. |
| `jspdf` | 4.2.1 | Client-side spec/quote PDF. Alternative: `@react-pdf/renderer` 4.9.0. |
| `vite` | 8.3.5 | Build. |
| `@hubspot/api-client` | 14.1.2 | Server side only, if using the HubSpot CRM API. |
| `@iframe-resizer/parent` / `child` | 5.5.9 | **License is GPL-3.0** [F]. Use a ~20-line custom `postMessage` resizer instead, or buy a license. |

Alternative engine: `@babylonjs/core` 9.33.1. It is excellent, and TimberTech uses it, but the bundle is larger and the React integration less idiomatic. **R3F is recommended** because it matches StruXure's choice, has the bigger ecosystem, and leaves room for DOM-first UI. [I]

### C2. Architecture [I]
```
WordPress page (SEO copy, schema, testimonials)
  └─ <iframe src="https://design.99pergolas.com/?embed=1&utm_*=…" allow="xr-spatial-tracking; fullscreen; web-share">
        Vite + React 19 + R3F SPA  (static, Cloudflare Pages or Vercel)
          ├─ state: zustand  ⇄  URL query (?v=1&w=144&l=240&h=108&m=fs&fc=blk&lc=wht&dir=w&led=w&scr=f,l&fan=1&sens=1)
          ├─ scene: procedural pergola (inches → meters), Environment HDRI + sun DirectionalLight (suncalc)
          ├─ pricing.ts: pure function(config) → {low, high, lineItems}  (same code runs server-side)
          └─ lead step → POST /api/lead  (Cloudflare Worker / Vercel Function)
                 ├─ validate + Turnstile check + recompute price server-side
                 ├─ save config + short code (D1/KV/Supabase) + PNG snapshot (R2/S3)
                 ├─ HubSpot Forms API v3 (with hutk from parent page) and/or webhook → Zapier/Make → CRM
                 ├─ email to sales (Resend/Postmark) with share link, snapshot, BOM, PDF
                 └─ confirmation email to customer with PDF + share link
```
- **Why an iframe rather than a web component [I]:** the iframe isolates CSS and JS from the WordPress theme and plugins, makes the same embed work on WordPress, Wix (whose HTML embed is an iframe anyway), Squarespace and landing-page builders, and keeps the heavy 3D bundle off the marketing page's Core Web Vitals. Morton embeds its 3D Studio the same way [F].
  - A web component (`@r2wc/react-to-web-component` 2.1.1) is possible, but WordPress themes leak global CSS, jQuery-era scripts and optimization plugins (WP Rocket and similar) that defer or minify scripts and break module loading.
- **Also ship a full-page route** (`design.99pergolas.com`) for paid ads. That is a better mobile experience than an iframe in a scrolling page.

### C3. State in URL, sharing and SEO [I]
- Keep the canonical design state in a **short, human-readable, versioned query string** (`v=1&w=144&l=240…`, inches as integers). Use `history.replaceState` on change (debounced), not `pushState`, so the Back button doesn't step through every slider move. Breslow already reads `w/l/h` from the URL [F].
- **Saved designs get a short code** (`/d/7KX2QF`) stored server side, which is what StruXure does [F]. Use the code in emails and CRM, and the query string for instant links.
- **SEO:** the configurator itself has little SEO value. Keep ranking content on the WordPress page (H1, FAQ, pricing guide, `Product`/`Service` schema). Set `noindex` on `/d/*` share pages but give them **OG images**, either the PNG snapshot uploaded at save time or one generated at the edge from params. Shared links then unfurl with a picture in iMessage, Facebook and email.
- **Pass attribution into the iframe:** append the parent page's UTM params plus `gclid`/`fbclid` to the iframe `src`, and `postMessage` the HubSpot `hubspotutk` cookie value from the parent. Safari's ITP blocks third-party cookies inside the iframe, so the iframe can't read the parent's cookies itself. StruXure persists UTM, organic and referral source in its own 30-day cookie [F].

### C4. Parametric geometry in code (no modelling) [I]
- Work in **inches internally** and multiply by 0.0254 for scene meters. Both StruXure-era and Breslow code do this (`y=.0254`) [F].
- **Posts:** `RoundedBox` (radius about 0.1") or `ExtrudeGeometry` of a square tube profile. Add a base-plate cap and an optional post-cap.
- **Beams / perimeter gutter-beam:** extrude a 2D `Shape` (rectangle with an inner gutter channel) along the X or Z length. Use mitered corners or butt-joint caps.
- **Louvers:** one `ExtrudeGeometry` of the blade profile (elliptical or airfoil chord about 6–9.5" and thickness about 1.25–2.1"), rendered as an **`InstancedMesh`**.
  - Count: `n = floor((innerSpan − 2·endGap) / pitch)`, with pitch about 7.875" for an 8" blade (derived from the Equinox chart in section D).
  - Rotate each instance about its pivot axis with one shared angle, 0° to 150–170°. Animate with a spring or GSAP.
- **Gutters/downspouts:** gutters are part of the perimeter beam profile. A downspout sits as a small cylinder inside a chosen post. A scupper outlet at the post base is a nice detail.
- **Accessories:**
  - LED strip: thin emissive box under the beam inner edge, plus a `RectAreaLight`/`SpotLight` when "night" is on.
  - Screens: a plane with alpha mesh texture and a roll-up height slider. Fans: low-poly cylinder and blades.
  - Wall mount: a ledger beam plus a simple procedural house wall with siding or stucco texture, so "attached" reads instantly. StruXure builds a procedural house [F].
- **Draw-call budget:** merge static members per material (`BufferGeometryUtils.mergeGeometries`) and instance the louvers. Target under 60 draw calls.

### C5. Materials, lighting and look [I, physically grounded]
- **Powder coat is paint, not bare metal.** Use `MeshStandardMaterial` (or `MeshPhysicalMaterial` with light clearcoat) with **metalness 0–0.1 and roughness 0.45–0.7**. Many amateur configurators make aluminum look like chrome, and that reads as cheap.
  - Add a faint tiling normal/roughness noise for "textured" finishes. Equinox markets a "crinkle" powder coat (https://alumawoodfactorydirect.net/equinox-louvers-new-crinkle-powder-coating/).
  - Colors: store swatches as sRGB hex mapped to the RAL/AAMA names used in quotes.
- **Tone mapping:** `THREE.NeutralToneMapping` (Khronos PBR Neutral) keeps swatch colors closest to the real powder-coat samples. ACES shifts and desaturates colors. Use ACES or AgX only for a "photo mode".
- **Lighting:**
  - Use a small 1k–2k outdoor **HDRI** (a CC0 Poly Haven sky) via drei `<Environment files=… />` for reflections and ambient. Do not show the background, or show a blurred one.
  - Add one **directional "sun" light with shadows**, positioned by `suncalc` from a Texas lat/long, date and time. The louver shadow stripes on the patio are the hero visual.
  - Shadow map 2048 on desktop and 1024 on mobile, with a tight shadow camera frustum fitted to the pergola bounds.
  - Ground: `ContactShadows` (cheap) or `AccumulativeShadows` (pretty, static) under posts, plus a paver patio plane and grass.
- **Day/night toggle:** night lowers environment intensity and turns on the LED emissive and lights (add bloom on desktop only).
- **Dimension annotations:**
  - Draw dimension lines with drei `<Line>` and labels with drei **`<Text>`** (troika SDF text inside the canvas). They then appear in PNG/PDF snapshots.
  - drei `<Html>` labels are DOM overlays and will **not** appear in `toDataURL` captures.
  - Show W, L, clear height, post spacing and louver count. Billboard the labels toward the camera.

### C6. Mobile performance and known gotchas
- **DPR:** `<Canvas dpr={[1, 2]}>` plus `<PerformanceMonitor>`/`<AdaptiveDpr>`, capping at 1.5 on phones [I].
  - iOS Safari loses WebGL contexts under memory pressure, and reports tie this to high DPR with antialiasing on. Mitigations: cap pixel ratio, disable MSAA on high-DPR devices, reduce GPU memory, and handle `webglcontextlost`/`restored` [F] (https://discourse.threejs.org/t/texture-is-causing-loss-of-context-in-ipados-ios-17-5-1-when-using-react-three-fiber/68643, https://bugs.webkit.org/show_bug.cgi?id=289601, https://bugs.webkit.org/show_bug.cgi?id=290623).
  - WebKit reports that WebGL memory can persist across navigations [F]. Avoid mounting the canvas on multiple WordPress pages in one session [I].
- **`frameloop="demand"`** plus `invalidate()` on state change. The scene only renders while the user interacts, which saves battery and avoids thermal throttling [I].
- **iframe + OrbitControls + touch [I]:**
  - (1) Set `touch-action: none` on the canvas only, not on the page.
  - (2) Inside a scrolling WordPress page, a full-height 3D canvas traps the user's scroll. Use a fixed-height iframe (about 70–80svh), keep a non-canvas strip for page scroll, or show a "Tap to rotate" overlay on mobile that enables controls after a tap.
  - (3) Disable `enablePan` on mobile and clamp `minPolarAngle`/`maxPolarAngle` (never under the ground) and `minDistance`/`maxDistance` scaled to the pergola size.
  - (4) Pinch-zoom inside an iframe can trigger page zoom on iOS. Add `<meta name="viewport" … maximum-scale=1>` in the iframe document (StruXure does this [F]).
- **Canvas resize loop [I]:** R3F sizes from the parent via ResizeObserver. If the iframe height auto-resizes to content, and content height depends on the canvas, you get a feedback loop. Give the canvas container an explicit height (`svh`/`dvh` units), and only post the **panel** height to the parent.
- **Screenshots [F/I]:**
  - Either create the renderer with `preserveDrawingBuffer: true` (small perf cost), or call `gl.render(scene, camera)` and immediately `gl.domElement.toBlob()` in the same tick (https://discourse.threejs.org/t/saving-out-high-resolution-screenshot-of-scene-with-react-three-fiber/69477).
  - Post-processing effects are missing from naive captures [F]. Render through the composer for captures.
  - For high-res PDF images, temporarily `setSize`/`setPixelRatio` larger, render, capture, then restore.
- **Safari specifics [I]:** Low Power Mode throttles `requestAnimationFrame` to about 30 fps. Use MP4/WebM fallbacks for any intro video. Test the `<model-viewer>` AR Quick Look path (USDZ is generated on the fly by model-viewer from GLB).
- **Bundle budget [I]:** three plus R3F plus drei, tree-shaken, comes to about 250–350 KB gzipped. StruXure ships about 1.0 MB three and 0.75 MB R3F vendor chunks, unminified sizes [F]. Lazy-load AR, PDF and post-processing. The HDRI should be at most about 1.5 MB, or use a prefiltered `.ktx2`/`.env`-style cubemap.

### C7. Quote submission and CRM [F/I]
- **HubSpot:** `POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}` works unauthenticated and with CORS. It accepts `fields[]`, `context` (including `hutk`, `pageUri` and `pageName`) and `legalConsentOptions` [F] (https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated.md). Submit server side anyway, so you can validate, recompute the price and attach the share link [I].
- **Generic:** server function, then a signed webhook to Zapier, Make or n8n, then any CRM (JobNimbus, Jobber, ServiceTitan, GoHighLevel and others are common among Texas installers [I]). StruXure posts to a WordPress Gravity Form [F]. That is a reasonable zero-CRM option if 99 Pergolas already runs Gravity Forms or WPForms; Gravity Forms has a REST API.
- **Fields:**
  - Required: name, phone, email, ZIP, project timeframe, TCPA/SMS consent checkbox. Equinox dealers make consent required [F].
  - Plus: design JSON, share URL, PNG, estimate range, UTM/gclid, and the device type.
- **Spam:** Cloudflare Turnstile, a honeypot field, and a server-side rate limit.

### C8. Hosting [I]
- **Cloudflare Pages + Workers + R2 + D1/KV** has the cheapest egress and edge OG images. **Vercel** gives the best DX with Next.js if you later want SSR share pages. Both serve a static Vite SPA fine.
- Use a custom subdomain (`design.99pergolas.com`) so first-party analytics and cookies work. If the WordPress site uses a CSP, configure `frame-ancestors` and `frame-src`.

---

## D. Parametric geometry reference (US louvered aluminum market)

| Brand / source | Louver | Rotation | Posts | Beams | Max single zone / span | Heights |
|---|---|---|---|---|---|---|
| **StruXure Pergola X (Pivot 6)** | 6" interlocking [F] (https://struxure.com/product/pergola-x/pivot-6-slide/) | 170° (Blue Sky); some pages cite 150–155° [F] | 6x6 or 8x8 | 2x8 frame; **XL**: 2x10 frame, 8x8 posts, 7½" gutter (std 5½") [F] (https://www.struxurebybluesky.com/pergola-x) | **12' x 20' per zone**, unlimited zones with pass-through gutters [F] (https://struxure.com/faq/) | n/a |
| **Azenco R-Blade** | 9.5" chord x 2.125" (Breslow configurator constants) [F]; 16' louver length available [F] (https://azenco-outdoor.com/introducing-the-16ft-louver-for-r-blade/) | 0–160° [F] (https://breslow.com/products/r-blade-pergola/); dual-wall louvers [F] | 6.5" std; 8x8 option (12' / 15' stock) | 14" main beam/fascia | 16' x 23' zone, 23' span (30' with structural header) [F, Breslow]; Breslow marketing says 20'x20' bay, Brannan says 15' x 22'10" [F] | default 10' post |
| **Equinox** | 8" dual-cell; 8/10/12/14' stated lengths (actual 88 5/16" etc.) [F] (https://www.equinoxroof.com/wp-content/uploads/2023/12/EQU-Takeoff-Example-Phoenix-Packet.pdf) | n/a | **4x4** and **7x7** (1/8" wall) [F] | 2x8 (1/8" wall) and **4x8** (1/4" wall), 16/20/24' lengths [F] | Freestanding with 8' louvers: max post spacing **15.7'** (single 2x8 header), **19.7'** (double 2x8), **21.9'** (single 4x8); up to 2' overhang each side [F] | example 9–10' |
| **Arcadia** (Arcat spec) | n/a | 0 to "almost 180°" [F] | n/a | 2x8 up to double 2x12, 0.125–0.1875" wall [F] | spans 6–24 ft, widths 6–16 ft; louvers pitched **2°** to internal gutter when closed [F] (https://www.arcat.com/sdspecs/htm/10530arc.htm) | n/a |
| **Sunzout** (DTC kit) | n/a | n/a | 8"x6" | 9" tall | W/P 9–40 ft; **max unsupported beam span 20 ft** [F] | 8–12 ft |
| **Paragon Signature** | n/a | 135° | n/a | n/a | up to 38'7" x 13'2" [F] | fixed 9'9" |
| **Renson Algarve** | n/a | rotating | slim | n/a | "coupled up to 6 x 6 m (~19.7') without additional column" [F] (configurator.renson-outdoor.com) | n/a |
| **Renson Camargue** | n/a | rotating | n/a | n/a | module up to 7 m x 4.5 m (retailer) [F] | n/a |
| **Gibus Med Twist** | n/a | adjustable | 4+ freestanding / 2+ leaning | n/a | single module 610 x 450 cm [F] | n/a |

**Louver pitch (derived) [F→I]:** the Equinox chart lists 7 louvers in a 57.25" opening and 36 louvers in 285.5". That gives (285.5−57.25)/29 = **about 7.87" on center** for an 8" blade, so roughly 1/8" of overlap per pair, plus about 1" of end clearance per side. A rule of thumb for code: **pitch ≈ blade width − 0.125" to −0.5"**. For 99 Pergolas' own extrusions, get the exact number from their spec sheet. The research-99pergolas agent may have it.

**Structural behavior to encode [F where cited; otherwise I]:**
- **Freestanding:** at least 4 posts, a perimeter beam on all sides, and footings at every post. Paragon: 18"x18"x30". Equinox example: 27" cube with the 4x8 header.
- **Attached (lean-to):** a ledger beam on the house wall replaces 2 posts. Sunzout offers 1-wall and 2-wall (corner) mounts. The gutter normally drains away from the house. Attached installs typically **trigger permits** and need house-wall and flashing assessment (Arrow lists attachment as a permit trigger [F]).
- **Intermediate posts and zones:**
  - Add one when beam span exceeds the limit: about 20' (Sunzout), 20–23' (Azenco), or 15.7–21.9' (Equinox, by header).
  - Add a new zone when louver length exceeds about 12–16'. StruXure zones are 12' wide, Azenco louvers reach 16', Equinox 14'.
  - **Default rule for the UI [I]:** auto-insert a post when any beam span exceeds 20'. Auto-split into zones when the louver-direction span exceeds 13–14'. Show an "engineering review required" badge above 20' x 24' or in high-wind/coastal ZIPs.
- **Roof pitch and gutters:** the frame is level; the louvers themselves shed water to an internal perimeter gutter. Arcadia's closed pitch is 2° [F]. Downspouts run inside or beside posts.
- **Typical sizes sold [I, consistent with F above]:** about 10'x10' up to 20'x24' single structure. Popular presets: 10x10, 10x12, 12x12, 12x16, 12x20, 14x14, 14x20 (StruXure's set [F]), 16x20 and 20x20. Standard clear height 8'–10'. Offer 8–12' with a 9' default.

---

## E. Pricing benchmarks and "estimate" presentation

### E1. Installed price per sq ft, motorized louvered aluminum (US, 2025–2026)
| Source | Range | Notes |
|---|---|---|
| HomeGuide 2026 | manual **$45–110**; motorized **$55–125**; smart/sensors **$75–175** per sq ft; typical project $6.5k–$18k [F] (https://homeguide.com/costs/louvered-pergola-cost) | Brand ranges: **Equinox $65–100**, **Azenco $80–120**, **StruXure $150–200** per sq ft [F] |
| Angi 2026 | motorized **$60–130**, smart up to **$180** per sq ft [F] (https://www.angi.com/articles/motorized-pergola-cost.htm) | |
| Arrow Outdoor Living (Tulsa) | **$60–200** per sq ft; **12x20 StruXure-class $36k–48k installed**; motorized louvered $15k–50k+ [F] (https://arrowoutdoorliving.com/how-much-does-a-pergola-cost/) | |
| Patio Covered (Los Angeles) | "no less than **$65 to $180**" per sq ft; Equinox cheaper than Azenco/Vergola [F] (https://patiocovered.com/how-much-does-a-motorized-pergola-cost/) | |
| Azenco corporate | **$15k–$40k+ installed** [F] | |
| DFW builder | louvered with motor and rain sensor **$15k–$25k** total [F] (https://6thavehomes.com/blog/dfw-backyard-build-calendar-pergola-patio-2026) | |
| Equinox dealer takeoff (Phoenix example, 16'2" x 23'9.5", about 384 sq ft) | extrusion and hardware subtotal **$21,052** at dealer price, before install/motor/electrical [F] | About **$55/sq ft in parts alone**, so installed $80–110/sq ft is plausible [I] |
| Suns Lifestyle (UK) | bespoke "from **£1,250/m²**" average (~$145–160/sq ft) [F] (https://sunslifestyle.com/collections/louvered-pergolas) | |
| DTC kits (not installed) | Paragon Signature from **$9,216**; Sunzout kits from about **$5,500**; Backyard Discovery steel louvered **$1,999–$3,599** [F] | Price floor that buyers see when comparison shopping [I] |

**Synthesis [I]:** a Texas installer of a motorized louvered aluminum pergola should expect **about $70–$130/sq ft installed** for the base structure (12x16 ≈ $13k–$25k), with premium brands at $150–200. The per-sq-ft rate **falls with size** (fixed costs like motor, controls, mobilization and permits get amortized), so model it as a **fixed base plus a per-sq-ft rate**, not a pure per-sq-ft rate.

### E2. Add-on benchmarks
| Item | Benchmark |
|---|---|
| Rain sensor | $125–300 [F, blogs]; Sunzout rain+wind sensor **+$190** [F] |
| Wind sensor | $200–600 [F, blog] |
| LED (perimeter or louver) | $500–$5,000 integrated; custom $3k–10k [F, blogs] |
| Motorized screens (zip track) | **$1,500–$7,000 per opening**; $2,500–5,000 per side typical [F, blogs] |
| Ceiling fan + fan beam | Sunzout **$650 each** [F]; general $150–500 fan only [F] |
| Infrared heater | Sunzout Infratech 2000W **$720 each** [F]; general $500–3,000 [F] |
| Manual vs motorized | Sunzout manual **−$100** (kit) [F]; installer blogs say motorization adds $3k–8k [F]. Inference: the gap is mostly installer labor and electrical, not motor parts. |
| Electrical run | $500–2,000 [F] (Arrow) |
| Permits | $50–200 typical (Arrow) [F]; Texas municipalities vary, and HOA approval is common [I] |
| Footings / extra post | No public per-post price found. Estimate **$400–900 per additional post with footing** [I] |
| Attached vs freestanding | No public delta found. Attached saves 2 posts and footings but adds ledger, flashing and permit work, so estimate it at about net-zero to −5% [I] |
| Custom (RAL) color | No public figure found. Brands list 6–8 standard colors plus "custom" [F]. Estimate **+8–15% of structure** or a flat fee [I] |

### E3. How competitors present prices without committing [F]
- **No price at all; route to a dealer:** StruXure (with "complexity" nudges), Azenco ("sample, not the full catalog"; "local expert… quotes the build"), Equinox, Renson, Brustor.
- **Price gated behind lead capture:** Sunzout ("full price breakdown and estimated total will appear on the quote page after you submit your info").
- **Live price with save quote:** Tuff Shed (ZIP-based, running total vs. budget), Alan's and IdeaRoom carports (ZIP-based because codes vary by state).
- **Anchor price:** Paragon ("Starting from $9,215.67", strikethrough sale), Pergolux ("from $7,990"), Azenco FAQ range ($15k–$40k+).

**Recommendation [I]:** show a **live range** ("Estimated installed: $18,400 – $22,900") that updates with every change. Reveal a **PDF with an itemized estimate** after the lead form; this mixes the Tuff Shed and Sunzout patterns. Disclaimer, kept short and always visible next to the number:
> "Estimate for planning only, based on typical Texas installations. Final price confirmed after a free on-site measure and depends on site conditions, permits/HOA, electrical, and engineering for your wind zone. Not an offer or contract."

Add "0% financing from $X/mo" under the range. 99 Pergolas markets 0% financing, so this turns a $20k number into a monthly figure.

---

## ONE-PAGE SUMMARY: recommended parameter list, UX flow, stack

**Parameters (v1)**
1. **Start from:** preset tiles (10x10, 12x12, 12x16, 12x20, 14x20, 16x20, 20x20) or Custom.
2. **Mount:** Freestanding / Attached 1 wall / Attached 2 walls (corner). Attached shows a procedural house wall.
3. **Size:** width and length 8'–24' (1" steps; slider plus numeric input), clear height 8'–12' (default 9'). Auto-insert posts above a 20' span. Auto-split zones when the louver run exceeds about 14'. Show a "custom engineering" badge beyond 24'.
4. **Louver direction:** parallel to width or length. The tool derives louver count and post count and displays them.
5. **Colors:** frame and louvers chosen separately (4–6 standard powder coats plus "Custom RAL", priced as an upcharge).
6. **Roof control:** motorized (default) + rain sensor + wind sensor toggles, with live louver-angle slider (0–150°) and a **sun/time slider** showing shade on the patio.
7. **Lighting:** none / perimeter LED warm / RGB / louver LED. A night-mode toggle previews it.
8. **Screens:** motorized zip screens per side (front, back, left, right), with a mesh opacity choice.
9. **Comfort:** ceiling fan (+fan beam), infrared heater, quantity steppers.
10. **Site (optional):** ZIP (for regional pricing and wind zone), surface (existing patio or needs pad), timeframe.

**UX flow**
1. Hero: 3D preview of a popular preset, auto-rotating. Show the "Estimated $X–$Y installed" chip from second 1.
2. Step 1, Size & mount (presets first, then custom).
3. Step 2, Style & colors.
4. Step 3, Features (screens, lighting, sensors, comfort). Each option card shows "+$" so the range updates live.
5. Step 4, "See it in your yard": a sun/shade simulator, AR (mobile, via model-viewer), or a photo upload backdrop (phase 2).
6. Step 5, Review: annotated dimensions, spec list, estimate range, financing per month.
7. CTA "Get my exact quote + PDF" opens a short form (name, phone, email, ZIP, timeframe, consent; Turnstile). Then a thank-you screen with the share link, a PDF download, and a "Book your free measure" calendar embed.
8. Every step writes the URL. "Share design" is available at all times.

**Stack**
- Vite 8 + React 19.2/19.3 + **@react-three/fiber 9.8 + drei 10.7 + three 0.186.1** (pinned) + zustand 5. Procedural geometry (extrusions plus InstancedMesh louvers), NeutralToneMapping, a 1k HDRI plus a suncalc-driven shadowed sun, ContactShadows, troika `<Text>` dimension labels.
- `frameloop="demand"`, DPR capped [1, 1.5–2], context-loss handling, and lazy chunks for AR (`@google/model-viewer` 4.4 + GLTFExporter), PDF (jsPDF 4.2) and post-processing (desktop only).
- A single shared `pricing.ts` (base + per-sq-ft + per-post + add-ons, ZIP multipliers), recomputed server side.
- **Cloudflare Pages + Worker** (or Vercel): `/api/lead` stores the config, short code and PNG (R2), pushes to **HubSpot Forms v3** (with `hutk`) or a webhook to Zapier, and emails sales and the customer.
- Embedded in WordPress with an **iframe** plus a ~20-line postMessage height/UTM bridge. Avoid GPL iframe-resizer. A full-page route on `design.99pergolas.com` serves ads and mobile.
- Effort estimate [I]: an MVP takes about 4–8 dev-weeks. Phase 2 adds photo backdrop/AI composite, multi-zone L-shapes, and a sales-rep mode with real pricing and a BOM.
