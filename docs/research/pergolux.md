# Pergolux "Custom Design" pergola configurator: teardown

Target: https://pergoluxshop.com/products/pergola-custom-design?width=3000&length=3080&height=2620&color=Anthracite&mounting=freestanding
Researched: 2026-10-31. Sources: raw HTML, theme JS bundles (prettified), the theme source map, Charpstar's viewer bundle, the glTF file, Shopify product JSON, and a live browser session on the page.

Labels used below. **[code]** means read directly in source. **[live]** means seen in a real browser. **[json]** means read from a Shopify endpoint. **[inference]** means my interpretation and not confirmed.

---

## 0. Summary

- **Platform.** Shopify Online Store 2.0 with a custom theme (theme id 196067524974, assets under `/cdn/shop/t/359/assets/`). The front end uses petite-vue, jQuery 3.6.4 and `is-land` islands. **[code]** Response headers include `powered-by: Shopify` and `server-timing ... theme;desc="196067524974", pageType;desc="product"`.
- **Configurator engine.** There is no third-party configurator SaaS such as Threekit, Expivi, Zakeke, Roomle, DynaMaker or ShapeDiver. The logic is a hand-written theme class, `PergolaProduct` in `de-pergola-product.js`, plus about 1,500 lines of inline `<script>` in the product section.
- **3D.** Charpstar (a 3D/AR agency, files on BunnyCDN at `js.charpstar.net`) supplies a forked, unminified build of Google `<model-viewer>` (three.js r152). The fork adds `px*` methods that rebuild one parametric glTF (`PX.glb`) at runtime by scaling and cloning named nodes. The 3D is real-time.
- **Pricing.** Everything is computed in the browser: `price = (base + area_m2 × price_per_m2) × multiplier`. The result then **snaps to the nearest-priced variant** of a Shopify product that has 100 "price-ladder" variants. Those variants have option `ID` and SKU `TM_SUN_04`, with prices from $2,024 to $33,502 in steps of about $319. Side walls use the same approach with their own ladder products. The LED add-on is a flat $872.
- **Ordering.** Two `POST /cart/add.js` calls. The first adds the chosen ladder variant with the dimensions as **line-item properties**. The second adds the wall and LED ladder variants, each with their own size properties. The cart drawer then opens and checkout is standard Shopify. There are no draft orders and no quote step inside the configurator.
- **Lead capture** is separate from the configurator: a Klaviyo embedded "This model, your space" quote form, a Klaviyo Black Friday signup, a HubSpot meetings link, a chat widget and a WhatsApp/contact float.

---

## 1. Configurable parameters

Source for all of this: the inline `parameterConfiguration` object, the slider markup and `de-pergola-product.js`. **[code]** Everything was checked live unless marked otherwise.

| Param (URL key) | Control | Units / range | Step | Default | URL values |
|---|---|---|---|---|---|
| `width` | `#slider1` range + `#value-input1` text (hidden in US) + feet/inch `<select>`s | 1000–4000 mm freestanding; **max 3900 mm wall-mounted** (`data-maxwallfixed="3900"`, `data-maxdefault="4000"`) | 1 mm (the US UI quantizes to whole inches through the selects) | 3000 | integer mm, e.g. `width=3000` |
| `length` | `#slider2` + `#value-input2` + feet/inch selects | 1580–5960 mm | **150 mm up to 4880; above that only 5060, 5360, 5660, 5960** (`snapLengthMM`: step 300 above 4880, anchored at 5060 above 5000) | 3080 | integer mm, snapped. `length=3000` becomes 2930 **[live]** |
| `height` | `#slider3` + `#value-input3` + feet/inch selects | 1500–3000 mm | 1 mm | 2620 | integer mm |
| `color` | radio `properties[Color]` (`.color-input`, `data-color`) | Anthracite, White, Anthracite with white louvers. Each is labelled "$0". | – | Anthracite | Exact `data-color` string, case-sensitive: `color=Anthracite`, `color=White`, `color=Anthracite+with+white+louvers`. `color=white` is ignored **[live]** |
| `mounting` | radio `properties[Mounting]` (`.variant-layout-option`) | Freestanding, Wall mounted. Each is labelled "$0". | – | Freestanding | `freestanding` or `wallmount` |
| `wall_left` / `wall_right` | radios `properties[Left side]` / `properties[Right side]` | Screen, Sliding glass without frame. Hidden in the US (`style="display:none"`): Wooden slat wall, Sliding glass with frame, Fixed glass. | – | None | `screen`, `glass_frameless`, `glass_framed`, `glass_fixed`, `aluminium` |
| `wall_front_left` / `wall_front_right` | radios `properties[Front Left]` / `properties[Front Right]` | Same as above. The "Right" half is only shown when length ≥ 5060 (`.only-xl`). Below that, "Front Left" is labelled just "Front". | – | None | same |
| `wall_back_left` / `wall_back_right` | radios `properties[Back Left]` / `properties[Back Right]` | Same. Disabled when wall-mounted. | – | None | same |
| `led_white` | checkbox `#ledToggle` (`properties[Accessories 2]`) | LED stripes, warm white, $872 | – | off | `true` / `false` |
| `led_rgb` | checkbox `#ledToggleRGB` (`properties[Accessories 3]`) | LED stripes, RGB, $872. Mutually exclusive with warm white. | – | off | `true` / `false` |
| (no URL key) | `#quantity` +/- | integer | 1 | 1 | **Ignored**: `addToCartConfig()` hard-codes `quantity: 1` **[code]** |
| (viewer only) | "Open Louvers" toggle | animates the louvers 90° over 2 s | – | closed | – |
| (viewer only) | "Show Dimensions" toggle | SVG dimension lines and labels | – | off | – |

Wall-size rules (inline `glassWallLimit`, `screenWallLimit`, `aluminiumWallLimit`; **[code]**):
- Glass and screen side walls (left/right) need **width ≥ 1580 mm when wall-mounted** and **≥ 1620 mm when freestanding**.
- Glass and screen front/back walls need **length ≥ 1620 mm**.
- Aluminium slat walls have a **max height of 2890 mm**.
- When a size breaks a rule, `handleWallSizes()` greys out that wall type, unselects it and shows "No Expansion / Select Wall Options to Continue".

Other options:
- **Not configurable:** roof type, louver orientation, post count, post position, heater, motor or remote. Post count is derived from size and mounting (see §4).
- **Theme code for other markets** has more inputs: free accessory/heater toggles (`.free-accessory-toggle`, a "Free heater" 1500 W), wood and aluminium slat walls, framed and fixed glass, and `#mounting_option` for a mounting bracket. In the US the free-accessory list is `[]`, and the wood and aluminium products resolve to `{"error":"json not allowed for this object"}`, meaning the metafield product reference is missing. **[code]**
- The UK twin store (`pergolux.co.uk/products/pergola-custom-design`) runs the same product and shows more wall types (Aluminium wall, framed and fixed glass). LED there is £446.

---

## 2. UI/UX flow

### Layout

**Desktop** (live at 1024 px):
- Two columns. On the left is a sticky media gallery (`tablet:sticky`), whose first slide is the `<model-viewer>` (about 500×375 at 1024 px). Under it are 19 thumbnails: the 3D icon plus photos and a technical drawing.
- On the right, in order: title, star rating, short description, **live price** (`#selectedValueb`), a Black Friday countdown card, then the configurator form `#product_form`.

**Mobile** (375 px):
- The gallery is full width on top with a "1 / 19" counter.
- The viewer has "Open Louvers", "Show Dimensions" and **"View in AR"**. The AR button only appears on mobile user agents: iOS uses Quick Look and Android uses Scene Viewer or WebXR.
- The form stacks below. "Add to cart" sits about 4,100 px down a 14,800 px page. There is **no sticky CTA**. The `app/pdpx-sticky-cta` module is in the import map but is not mounted here.

### Step order

The steps are numbered headings on a single long page. There is no wizard.

1. **Size.** "Select the Ideal Size…". Width, Length and Height, each with a feet and inches dropdown pair (US unit mode `feet_and_inches`) and a range slider whose track is filled green `#297844`. Each has an info tooltip explaining how it is measured:
   - Width runs from the outside of one column base to the other.
   - Wall-mounted width is measured from the wall.
   - Height is measured from the ground to the roof in the open position. The louvers stick out up to 3.74 in above the beam.
   - Live feet ranges: width 3′–13′, length 5′–19′, height 4′–9′. The inch options only list values that snap to valid mm.
2. **Color.** "Select Your Signature Color". Three swatch cards, each showing "$0". Clicking one calls `viewer.pxColor()`.
3. **Mounting.** "Choose between wall mounted or freestanding". Two cards with pictograms. Choosing Wall mounted:
   - lowers the width max to 3900 and clamps the width;
   - disables the back walls;
   - shows a brick wall (`WMW` node) and wall beam (`WMM`) in 3D and hides the back posts.
4. **Sidewall.** One card per side: Left, Right, Front (split into Left/Right when length ≥ 5060), Back (same split). Each card has:
   - a side pictogram and a tooltip;
   - rows for each wall type, each with a size-dependent price and an "Add" button that turns into "Remove" when selected;
   - a "No Expansion" basket summary. Once a type is added, the other types on that side are disabled.
5. **Accessories.** Warm-white LED and RGB LED, each with Add/Remove. They are mutually exclusive.
6. **Quantity, then summary price, then lead times.** Lead times are "Anthracite: 10–12 weeks, White: 12–14 weeks". Then the **Add to cart** button `#btn-s`, an error banner, the "Schedule a Consultation" HubSpot link, and trust badges (Simple Setup, Free Delivery, 10 Year Warranty, Weather Resistant).

### Live price

- Recalculated on every `change` of the sliders, inputs or properties.
- Shown in three places: `#selectedValueb` near the top, `#selectedValue` in the summary, and the hidden `#total-price` input. The number is formatted with `Intl.NumberFormat` and has no decimals (`currencyDigits = 0`).
- A strike-through compare price (`#ccCc`) and a "Save -{discount_percent}%" label appear only if the formula's `discount_percent > 0`. It is 0 now.
- **Server-rendered HTML always shows the cheapest variant ($2024)** until JS runs. URL parameters do not affect the SSR. **[code + curl]**

### Validation and constraints

- Out-of-range typed values are clamped to min/max (`updateSliderAndInput`, `setSliderAndInput`).
- Length is snapped to the 150/300 grid.
- Pressing Enter in the form is blocked.
- The wall rules from §1 grey out options. There are no text error messages, only disabled rows and the "No Expansion / Select Wall Options to Continue" copy.
- **Center post rule:** length ≥ 5060 mm adds a middle post on each long side (pricing and line-item logic). The 3D adds it at length > 5000. It also unlocks the Front Right and Back Right wall slots.

### Saved designs and sharing

- **The URL is the share link.** `history.replaceState` writes every change back to the query string through `trackURLParam`. On load, `prefillInputs()` reads the parameters (polling up to 50×200 ms until the DOM is ready), then `syncAllParamsToUrl()` fills in missing keys.
- There is no "save design" button, account save, or email-my-design feature. `app/save-configuration` and a toast module are in the import map but not mounted on this page.

### Lead capture (independent of the configurator state)

- A Klaviyo embedded quote form, "This model, your space – Let's price this one for your space". Fields: First Name, Email, Phone (with country picker), "Size you have in mind" (free text), a select, and "Get my quote". The copy promises a "callback within one working day". **The form does not receive the configuration automatically.** No hidden config fields were seen. **[live]**
- A Klaviyo signup (`WcTQKG`: First name, email, SMS opt-in) for Black Friday early access, plus a lead-gen popup trigger (`LeadGenPopupTriggerApp("RHx53d")` → `klaviyo.openForm`).
- HubSpot meeting link: `https://meetings-eu1.hubspot.com/peter-lehmann/book-a-consult`.
- A chat bubble ("our experts from our California office…"), a contact float, a phone number in the top bar, and Judge.me reviews (703 product reviews, 4.8).

---

## 3. Visuals and 3D

### Viewer element

```html
<model-viewer id="threeDViewer" src="https://js.charpstar.net/Pergolux/PX.glb"
  field-of-view="45deg" interaction-prompt="none" camera-controls
  shadow-intensity="1" shadow-softness="1" exposure="1.3"
  environment-image="neutral" environment-image="https://js.charpstar.net/AR/hdri.hdr"
  max-camera-orbit="auto 95deg auto">
```

The `environment-image` attribute appears twice. The browser keeps the first one, so `neutral` wins and the HDR file is never used. **[code + live]**

### Library

- `https://js.charpstar.net/Pergolux/mv2.js` is a 2.03 MB unminified ES module (425 KB brotli). It is Google model-viewer with three.js r152 (and an r125 header in one bundled helper).
- Charpstar added custom methods to the `ControlsModelViewerElement` class:
  - `setInitialPXSizing(length,width,height)`, `pxLengthControl`, `pxWidthControl`, `pxHeightControl`, `centerBeamHandle`
  - `pxWallAttachmentHandle('FS'|'WM')`
  - `pxLeftWall`, `pxRightWall`, `pxFrontWall`, `pxBackWall` with `'Screen'|'Glass-FL'|'Glass-F'|'Glass-FX'|'Wood'|'None'`
  - `pxToggleFront/Back{Screen,GlassFrameless,AluSlat}{Left,Right}(bool)`
  - `pxColor('Antracite'|'White'|'Antracite-White'|'Black'|'Black-White')`
  - `pxLEDToggle(bool, 1|2)`. Value 2 swaps to a red `MeshBasicMaterial` to suggest RGB.
  - `pxHeaterToggle`, `animatePergola`, `dimensionLineToggle`, `setDimensionUnits('mm'|'feet-inches')`, `updateFramingPX`
  - AR helpers `activateARPX`, `openiOSQuickLookForPX`, `openSceneViewerForPX`, and a QR modal. The QR modal would POST config JSON to `https://charpstar.se/PX/upload.php` and point to `ar.PXliving.com`, but that call is commented out for desktop.

### Asset

- `PX.glb` is 848 KB. glTF 2.0, made with Gestaltor 2023.1, created 2025-10-15. It uses `KHR_draco_mesh_compression`, `KHR_materials_variants`, `KHR_texture_transform`, `ior` and `specular`.
- 41 nodes, 39 meshes, 12 materials, 3 JPEG textures (Wall, Wood, Rosewood), no animations.
- Named nodes: `HB` (post), `HBJ` (post joint), `HBF` (foot), `WB`/`LB` (width/length beams), `RM` (one roof louver module), `CHB`/`CWB` (center post and beam), `WMM`/`WMW` (wall-mount beam and brick wall), `LED`, `HeaterMain`/`HeaterCoil`, `Logo`/`LogoInner`, `Screen-*`, `Glass-*` (1/3/4/5-rail, door frames), `WoodW*`, `AluWall-*`, `SundreamB`.
- Materials: `Antracite.002` (base 0.047 grey, metallic 0.8, roughness 0.5), `White.002`, `Black.002`, `GlassDoor-Glass` (alpha 0.36), `ScreenMaterial` (alpha 0.87), `WallText`, `WoodWall`, `Alu-Slat-*`, `metal_chrome`, `HeaterCoil`.
- Shopify also holds copies as product media: `https://cdn.shopify.com/3d/models/o/b2e473bc2007ef58/PX.glb` and `…/2c5648a195a5c386/PX.usdz`. **[json]** I could not confirm whether the iOS AR path uses the USDZ.

### How size maps to 3D

The viewer works in units of mm ÷ 100, with a further ÷10 inside node transforms. **[code]**
- On load it calls `setInitialPXSizing(3080, 3000, 2000)`. The page then applies the slider values when the `model-visibility` event fires (`applyInitialDimensions`).
- **Width** scales `WB.scale.x = w/100 − 1.2`. The roof modules get `scale.x = WB − 0.75`. The back posts, beams and feet move to `z = −(WB/10 ± offsets)`.
- **Length** scales `LB.scale.z = l/100 − 1`. The right-side posts and feet move to `x = LB/10 ± offsets`. The louver count is `floor((LB/10)/moduleWidth)`, minus 1 when the length is over 4.9 m. Louvers are cloned or removed at a 0.15 spacing.
- **Height** scales the posts `HB.scale.y = h/100 − 1.75` and `HBJ.scale.y = h/100`, and moves the beams, roof, LEDs, logo and heater to `y = h/1000 − 0.175` (or similar).
- **Center post:** `CHB` is cloned to the front and back plus `CWB` when length > 50.0 (> 5000 mm).
- **Walls** are rebuilt by cloning panels, rails or slats to fit. Wood and aluminium slat counts are computed from the span.
- **Wall-mount** hides the back posts and beam, shows `WMM` plus the brick `WMW`, and repeats the wall texture by the current length and height.
- **Color** swaps materials. `AntraciteColorMaterial` is the original post material. White and Black are clones with the color set to 1,1,1 or 0,0,0. For the two-tone option the roof uses `currentPX2Material`.
- **Camera:** after each change `updateFramingPX()` disables controls briefly and sets FOV by length: ≤3 m → 20°, 3–4 m → 22°, 4–5 m → 37°, >5 m → 75°. Camera orbit is capped at 95° polar so the user can't look from below. Pan and zoom are enabled. There is a soft ground shadow (intensity 1, softness 0.5).

### Dimension annotations

- Model-viewer hotspots (`hotspot-dot±X±Y±Z`, `hotspot-dim…`) plus SVG `<line>`s, redrawn every animation frame.
- Labels show width, length and height in feet-inches on the US store. Other markets use "mm".

### Environment

- Neutral IBL with exposure 1.3.
- A light-grey `#EEEEEE` background. There is a "Dark Mode" toggle in the code, but it is not added to the UI.

---

## 4. Pricing model

### Formula

Live values in the US store, from the inline `pergolaProduct.setFormula({...})` call. These are most likely Shopify metafields or section settings. **[code]**

```
base_price 3214, price_per_sqm 584, min_sqm 3.0, multiplier 1.43
screen_base 847, screen_per_sqm 146
glass_base 1655, glass_per_sqm 224
wood_base 800, wood_per_sqm 155          (unused in the US)
aluminium_base 1310, aluminium_per_sqm 253 (unused in the US)
discount_percent 0, discount_text "Save -{discount_percent}%"
```

`setFormula` multiplies every base and per-m² value by `multiplier`. **[code]**

**Pergola**
```
raw = 3214×1.43 + (W_m × L_m) × 584×1.43
    = 4596.02 + 835.12 × area_m2
```
- Height, color and mounting do **not** affect price.
- `min_sqm` is passed to `calculatePrice()` but never used. There is no minimum-area floor. **[code]**
- Quirk: W_m and L_m are read from the **native range input values**. `#slider2` has `step=150`, so the browser snaps the XL lengths down by 30 mm (5060→5030, 5360→5330, 5660→5630, 5960→5930). Cart properties use the text-input values. So XL lengths are priced about 0.12 m² × width cheaper than ordered. **[live]**: at 4000×5960 the slider was 5930 and the price $24,255, while the true-size formula gives $24,574.

**Snapping to the ladder.**
- `findClosestVariant(raw)` picks the variant of product 14818760196462 whose price is closest to `raw`.
- That variant's price is the displayed and charged price.
- 100 variants, option "ID" (labels 2249…20564 in steps of 185, which carry no meaning), SKU `TM_SUN_04`, `inventory_management: shopify`, `fulfillment_service: manual`.
- Prices go from $2,024 to $33,502 in steps of about $318.9.
- The first 35 variants carry compare-at prices of price ÷ 0.7. These are not shown, because the display uses the formula's `discount_percent`.
- Three variants at the end (IDs 20194, 20379, 20564) are priced $2,255–$2,893. They look like back-filled low rungs. **[json]**
- With the current formula the reachable range is about $5,761 (1000×1580) to $24,574 (4000×5960). The rungs below $5.7k are never selected. **[inference]**

**Walls.** Each wall's panel size comes from structure geometry (below). The price is `wallBase + panel_area_m2 × wallPerSqm` (× 1.43), then snapped to that wall's ladder product:
- Screen: `screen-custom-design`, 99 variants, $893–$3,280, step about $23.4.
- Glass: `glass-wall-custom-made`, 64 variants, $1,575–$5,390, step about $59.
- Large walls are **capped at the top rung** ($3,280 screen, $5,390 glass). **[inference from ladder plus formula]**

**LED.** Flat $872 for either color. Product `led-stripes-custom-design` has variants "Warm white" and "RGB". The price is hard-coded into the label with `getFormattedPrice(872)`.

**Total shown** = ladder pergola price + sum of the price spans of the checked add-on rows (`getInputPrices()` parses the `.price` text). Currency is USD (`Shopify.currency.active`), formatted as `$12,457`. Code paths exist for GBP and CHF.

### Geometry used for walls and line items

From `calculateSizes`. The S4 height offset of 81 comes from tag `custom-design:s4`. **[code]**
- posts per side `getColumnFeet(size, mounted)` = 2, −1 if wall-mounted (width axis only), +1 if size ≥ 5060
- structure_width = W − 40 × widthPosts
- structure_length = L − 80
- structure_height = H − 81
- walkthrough_height = structure_height − 175
- side panel = (structure_width − 120 × widthPosts − 1) × (structure_height − 177)
- front/back panel = ((structure_length − 120 × lengthPosts) / (lengthPosts − 1) − 1) × (structure_height − 177)
- LED run = (structure_width − 265, structure_length − 265)

### Example prices

Modelled with the formula plus the ladders. The first row and 2500×2480 were also checked live; the live 4000×5960 differs because of the slider quirk.

| W × L × H (mm) | Mount | Area m² | Raw $ | **Pergola $** | Screen side / F-B | Glass side / F-B | Posts |
|---|---|---|---|---|---|---|---|
| 3000×3080×2620 | FS | 9.24 | 12,312.53 | **12,457** (live ✓) | 2,526 / 2,578 | 4,415 / 4,480 | 4 |
| 3000×3080×2620 | WM | 9.24 | 12,312.53 | **12,457** | 2,604 / 2,578 | 4,545 / 4,480 | 2 + wall |
| 1000×1580×1500 | FS | 1.58 | 5,915.51 | **5,761** | 1,384 / 1,548 | 2,628 / 2,862 | 4 |
| 2000×2030×2500 | FS | 4.06 | 7,986.61 | **7,993** | 1,993 / 2,016 | 3,564 / 3,623 | 4 |
| 2500×2480×2200 | FS | 6.20 | 9,773.8 | **9,906** (live ✓) | 2,086 (live ✓) | – | 4 |
| 3000×3980×2620 | FS | 11.94 | 14,567.35 | **14,689** | 2,526 / 3,020 | 4,415 / 5,130 | 4 |
| 3500×3530×2400 | FS | 12.36 | 14,913.93 | **15,008** | 2,630 / 2,656 | 4,545 / 4,545 | 4 |
| 4000×4880×2620 | FS | 19.52 | 20,897.56 | **20,748** | 3,020 / 3,280 (cap) | 5,130 / 5,390 (cap) | 4 |
| 4000×5060×2620 | FS | 20.24 | 21,498.85 | **21,385** | 3,020 / 2,344 per half | 5,130 / 4,090 per half | 6 |
| 4000×5960×3000 | FS | 23.84 | 24,505.28 | 24,574 modelled; **24,255 live** (slider 5930) | 3,280 / 2,786 (live ✓) | 5,390 / 4,805 (live ✓) | 6 |

Live total with options: 2500×2480 plus a left screen and warm-white LED gave $9,906 + $2,086 + $872 = **$12,864**.

For comparison, the standard (non-custom) products use fixed variant matrices of Color × Size × Layout with 56 variants:
- `pergola` (Pergola 4): $6,490 for 10'×10', up to $14,490 for 13'×19'.
- Pro: $7,990–$17,990.
- Pro Max: $11,490–$25,990.

**[json]** `/products.json`

---

## 5. Product facts

- **Product.** "Custom Design Pergola S4". Vendor PERGOLUX GmbH. Template `pergolux-tailor-made`. Tags `custom-design:s4, live_website, massgefertigt_sundream, TM`. Published 2026-02-10.
- **Description.** "Built on the robust Pro Series framework with enhanced reinforcement". It is a 4th-generation kit: motorized louvers; Bluetooth/Matter smart home; SnapFIT no-drill accessory channels; RainLUX drainage through the posts; a roof rated for high snow loads; a 10-year warranty; free delivery in 5–15 days after shipping; DIY assembly through an app, YouTube and PDF.
- **Colors.** Anthracite, White, and Anthracite with white louvers. Black and Black-with-white exist in the code and in the standard products, but not on this custom product.
- **Mounting and posts.** Freestanding has 4 posts, or 6 when length ≥ 5060. Wall-mounted has 2 posts, or 3, with a wall beam.
- **Lead times.** Anthracite 10–12 weeks, White 12–14 weeks.
- **Shared code across markets.** Germany (`pergolux-tyskland`, German property names such as "Linke Seite" and "Farbe"), UK and CH (GBP/CHF branches), and the US. US-specific behavior: feet and inches, and the "Market: US" line property.
- **Third-party press.** A 2026 release ([barchart](https://www.barchart.com/story/news/254932/pergolux-launches-customsized-pergolas-with-us-presale)) as summarized by search. I could not fetch the page itself. It mentions custom-size pre-orders, maximums of 13.13 ft wide × 19.56 ft long × 9.52 ft high, and a 20% intro discount. 13.13 ft = 4000 mm and 19.56 ft = 5960 mm, which match the code. 9.52 ft = 2900 mm, which differs from today's 3000 mm max. **[unverified]**

---

## 6. Other notable points

### Cart and order payload **[code]**

1. `POST /cart/add.js` with:
   ```
   {id:<ladder variant>, quantity:1, properties:{
     "Configurator height","Configurator width","Configurator length",
     "Structure width","Structure length","Structure height","Walkthrough height",
     "Color","Mounting","Controller color":"Warm white|RGB|No LED", "_unique_id":"id-…"}}
   ```
   On the US store the values are strings such as `9' 10"`. Structure values are given to 1/32″ (`formatSizeValue`).
2. `POST /cart/add.js {items:[…]}` with:
   - each wall variant, with properties `Width`, `Height`, `Side` (e.g. "Left screen" or "Front right glass" in XL), `Color`, `_unique_id`;
   - the LED variant, with `Width`, `Length`, `Market: US`, `Color`, `_unique_id`.
3. `GET` cart, then open the cart drawer. On error a `#cart-error-banner` is shown.

Points to note:
- There is no grouping or bundle key between the pergola line and its wall lines. Each `_unique_id` is random.
- **Price integrity is client-side only.** Anyone can add the cheapest ladder variant with arbitrary dimension properties through `/cart/add.js`. I found no Shopify Function or cart validation in the public assets. Any server-side check (for example manual order review, which `fulfillment_service: manual` might hint at) is **not discoverable**.

### URL and parameter behavior **[live]**

- Out-of-range values (`width=5000`) and wrongly cased colors are silently ignored. The defaults stay, but **the bad parameter remains in the URL**, because `syncAllParamsToUrl` skips keys that are already present.
- Wall and LED parameters can be **wiped after prefill**. When the lazy-loaded viewer fires `load`, `resetProducts()` runs and resets the walls, LEDs and the `#pxfreestand` radio. The URL then still says `wall_left=screen` while the UI shows None.
- After prefill the displayed total once missed the LED until the next recalculation ($11,992 shown vs $12,864 correct).

### SEO

- Canonical is `https://pergoluxshop.com/products/pergola-custom-design` with no parameters. `og:url` matches.
- JSON-LD `ProductGroup` lists all 100 ladder variants as Offers named "Custom Design Pergola S4 - 2249" and so on, with a lowest price of $2,024.
- Title: "Custom Pergola: Tailored Designs for Your Outdoor Space | PERGOLUX".

### Analytics and marketing

- Elevar data layer (GTM), Klaviyo, Hotjar, Microsoft Clarity, SpeedCurve LUX (page label `product.pergolux-tailor-made`), Awin affiliate, an adtribute.io script, Judge.me, Affirm (theme extension), the Consentmo GDPR banner, and Shopify Forms.
- The configurator raises DOM events `custom-design:update` (detail `{totalPrice, pergolaPrice, accessoriesPrice, squareMeters}`), `custom-design:refresh` and `custom-design:sync-url`. I found no configurator-specific analytics events.

### A/B and dormant modules

These are in the import map but not mounted here:
- `app/custom-design-model-picker`: a "base vs plus" model switcher that prices the other model from the same `squareMeters` and keeps the query string when switching.
- `app/mini-configurator`, `app/save-configuration`, `app/product-model-switcher`, `app/pdpx-sticky-cta`, `app/pdp-tiered-discount`, `app/hubspot-calendar`, `app/alma-plans`.

These suggest planned or variant experiences. **[inference]**

### Performance

| Item | Size |
|---|---|
| HTML | 1.21 MB raw, 137 KB brotli. Variant JSON is inlined twice in the constructor, plus 100 JSON-LD offers. |
| `mv2.js` | 2.03 MB, 425 KB brotli, unminified |
| `PX.glb` | 848 KB |

- jQuery is loaded.
- The Charpstar CDN sends `cache-control: max-age=30`.
- `mobileViewer` (`#threeDViewerSlider`) is referenced but missing, so there are null branches. One even has a typo, `mobileViewerviewer`.

### Inherited bugs

Do not copy these into a rebuild:
- The slider-step price drift for XL lengths.
- The reset race on viewer load.
- Quantity being ignored.
- `findClosestVariant` being O(n), which is fine at 100 variants.
- Mismatched center-post thresholds (5000 in 3D vs 5060 in pricing).

---

## 7. URLs and endpoints

| URL | What it returns |
|---|---|
| `https://pergoluxshop.com/products/pergola-custom-design?width=…&length=…&height=…&color=…&mounting=…` | Product page (SSR shows $2024). Configuration is applied client-side from the query string. |
| `https://pergoluxshop.com/products/pergola-custom-design.js` | Shopify AJAX product JSON. 100 ladder variants (`ID` option, prices in cents), media including the GLB and USDZ. |
| `https://pergoluxshop.com/products/pergola-custom-design.json` | Admin-style product JSON: `template_suffix: pergolux-tailor-made`, tags, variant prices as strings, `fulfillment_service: manual`. `updated_at` changes every few minutes while prices stay the same. **[inference]**: an automated job touches the variants, such as an inventory top-up. |
| `https://pergoluxshop.com/products/screen-custom-design.js` | Screen ladder: 99 variants, $893–$3,280, SKU `TM_SCR_03`. |
| `https://pergoluxshop.com/products/glass-wall-custom-made.js` | Glass ladder: 64 variants, $1,575–$5,390, SKU `TM_GWA_03`. |
| `https://pergoluxshop.com/products/led-stripes-custom-design.js` | LED: Warm white and RGB, $872 each, SKU `TM_LED_03`. |
| `https://pergoluxshop.com/products.json?limit=250` | 36 products, including the standard Pergola 4 / Pro / Pro Max / S3 lines. |
| `https://pergoluxshop.com/cdn/shop/t/359/assets/de-pergola-product.js` | The `PergolaProduct` class: formula, snapping, geometry, cart. |
| `https://pergoluxshop.com/cdn/shop/t/359/assets/de-pergola-product.js.map` | **Public source map with `sourcesContent`.** Original comments, including German admin product URLs. |
| `https://pergoluxshop.com/cdn/shop/t/359/assets/de-pergola.js` | Only a `window.debounce` helper. |
| `https://pergoluxshop.com/cdn/shop/t/359/assets/app-custom-design-model-picker.js` | Dormant base/plus model picker. |
| `https://pergoluxshop.com/cdn/shop/t/359/assets/app-lead-gen-popup-trigger.js` | Klaviyo `openForm` trigger. |
| `https://js.charpstar.net/Pergolux/mv2.js` | Charpstar fork of model-viewer with the `px*` API. |
| `https://js.charpstar.net/Pergolux/PX.glb` | Parametric pergola model (Draco, 41 nodes). |
| `https://js.charpstar.net/AR/hdri.hdr` | 281 KB HDR. Referenced but overridden by `environment-image="neutral"`. |
| `https://cdn.shopify.com/3d/models/o/b2e473bc2007ef58/PX.glb`, `…/2c5648a195a5c386/PX.usdz` | Shopify-hosted copies of the model (product media). |
| `https://charpstar.se/PX/upload.php` | AR-QR config upload in `mv2.js`. Not triggered on this page. |
| `/cart/add.js` (POST), `window.routes.cart_url` (GET) | Order creation. |
| `https://meetings-eu1.hubspot.com/peter-lehmann/book-a-consult` | Consultation booking. |
| `https://pergolux.co.uk/products/pergola-custom-design` | UK twin. Same product and engine, more wall types, £ pricing. |

Not discoverable: any server-side pricing or validation API (none exists client-side), the Klaviyo form's backend routing, the admin metafield names behind `setFormula`, and whether orders are checked by hand.

---

## 8. Build notes for an equivalent

- Pricing in a rebuild needs a single deterministic formula module shared by the UI and the server, plus a real cart-price mechanism such as Shopify Cart Transform, Functions, or a draft order. The price ladder is a workaround, and it is insecure.
- **3D approach.** One parametric GLB with named parts, scaled and cloned in three.js, worked well for Pergolux. It loads one 850 KB file, with no per-size assets and no server rendering.
- **Recommended additions:**
  - an explicit validation message layer;
  - a saved-design ID;
  - passing the configuration into the quote form;
  - a sticky price/CTA bar on mobile;
  - a bundle or group key on the cart lines.
