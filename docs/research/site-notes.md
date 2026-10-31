# Verified live-site notes (captured in browser, 2026-10-31)

## Pergolux custom-design configurator (pergoluxshop.com/products/pergola-custom-design)
- Shopify store. 3D viewer = Google `<model-viewer>` (id threeDViewer; camera-controls; environment-image=neutral; exposure 1.3; fov 45deg; max-camera-orbit "auto 95deg auto"; shadow-intensity 1) loading ONE glTF https://js.charpstar.net/Pergolux/PX.glb + vendor helper https://js.charpstar.net/Pergolux/mv2.js (Charpstar). The model is scaled parametrically to the chosen size (data-initial-dimensions-applied). Theme logic: /cdn/shop/t/359/assets/de-pergola-product.js (petite-vue). window.constants FEET_TO_MM 304.8 / INCHES_TO_MM 25.4.
- Price = Shopify variant matrix (product 14818760196462, sku TM_SUN_04, variants carry numeric size codes e.g. 2249=$2024, 2434=$3211). Displayed $12,457 for 3000x3080x2620mm Anthracite freestanding.
- URL state: ?width=3000&length=3080&height=2620&color=Anthracite&mounting=freestanding|wallmount (mm in URL, UI in ft+in).
- Layout (desktop): sticky viewer card left (~60%), options column right. Viewer card has two toggles below the model: "Open Louvers" (animates louvers) and "Show Dimensions" (mm labels drawn on the model). Thumbnail strip under viewer (3D icon, lifestyle photos). Mobile: viewer on top, options stacked.
- Options order: Size (Width ft 3–13 + in 0–11, slider; Length ft 5–19 + in; Height ft 4–9 + in, slider) → Color (Anthracite / White / Anthracite with white louvers, swatch cards) → Mounting (Freestanding / Wall mounted, illustrated cards; wall-mounted swaps a brick wall into the 3D scene) → Sidewall per side (Left / Right / Front / Back; each: Screen $2,526–2,604, Sliding glass without frame $4,415–4,545, "No Expansion") → Accessories (LED Stripes Warm white $872, LED Stripes RGB $872) → sticky summary with name + price + delivery lead time (Anthracite 10–12 wks, White 12–14) + "Add to cart" + "Schedule a Consultation".
- Lead capture: "THIS MODEL, YOUR SPACE – Let's price this one for your space. Four details is all we need..." first name/phone/email/zip style mini-form; HubSpot chat; Affirm financing script present.
- Screenshots: research/shots/pergolux-0*.jpg

## 99pergolas.com
- WordPress + Divi (builder 4.27.4, theme 7.1.3), Contact Form 7 v6.1.6 + reCAPTCHA v3, Popups for Divi, Google Site Kit (GT-TX587CNG), tawk.to chat (6801a649bcd193190f5b18ab/1ip3733o1), TrustedSite, GoDaddy hosting hints. No cart. Lead forms only.
- Brand: bg #171A18, surface #20241F / #101311, bone #F2F1EC, gold #B4863B; fonts Archivo (headings), Instrument Sans, Open Sans. Logo https://99pergolas.com/wp-content/uploads/2026/07/logo-white.png. Buttons: gold pill with arrow; outline pill secondary. Tagline hero "Premium Outdoor Living, Built for North Texas."
- Contact (682) 241-5877 · info@99pergolas.com · Addison TX. Service area: Celina, Prosper, Frisco, McKinney, Plano, Allen, Little Elm, Aubrey, The Colony, Denton, Flower Mound, Southlake, Grapevine, Highland Park, University Park, Dallas, Fort Worth.
- CF7 form on /contact-us/: your-name, your-phone, your-email, your-city, your-service (select: Custom Aluminum Pergola | Motorized Patio Screens | Motorized Indoor Blinds | Sliding Glass Systems | Aluminum Shutters / Privacy Panels | Outdoor Kitchen | Not sure yet — help me choose), your-message. Form id wpcf7-f1864-p112-o1.
- Process: We measure → We design → We build → We install. Claims: Made in USA, 20-yr structural warranty, financing (no-down-payment options), 14+ yrs experience.

### Pergola catalog (/pergolas/)
- Lines: **Lux Line** (flagship: motorized louvers, rain sensors, LED & RGB, ceiling-fan ready, screens compatible, sliding glass compatible, custom sizes, 20-yr warranty, app/voice per brand brief) and **Prestige Line** (motorized adjustable louvers, powder-coated, LED options, screens & privacy walls compatible, custom sizes/colors, smart remote control).
- Colors: standard colors plus any RAL color (powder-coated to order). Brand brief: matte black, bronze, white typical.
- Designs: Freestanding · Wall-Mounted · Floating (concealed structural support / cantilever look) · Custom configurations (oversized, L-shaped, multi-zone, connected structures).
- Accessories: Integrated LED (warm white), RGB lighting, Rain sensor, Electric infrared heater, Ceiling fan.
- Enclosures (per side): Motorized patio screens (fabrics: Blackout, 99%, 97%, 95%, 90%, 70%, 60% sun block; wind sensor), Sliding glass systems (frameless), Sliding aluminum shutters, Bifold aluminum shutters, Fixed aluminum privacy panels.
- Also sold: solid-roof aluminum patio covers (per brand brief), carports.

### Motorized screens (/motorized-screens/) — standalone product
- Custom-built per opening; installs on brick openings, aluminum/wood/metal frames, covered patios, pergolas, kitchens. Estimate form asks: location, installation type, number of openings, colors, fabric, control options, photos. Fabrics as above. Remote/smart control, wind sensor.

### Indoor blinds (/indoor-blinds/)
- Collections: Shangri-La, Vertical Drapery, Roman, Zebra, Honeycomb, Roller. Manual/motorized. Custom per window.

### Outdoor kitchens — mentioned on home; no dedicated detail captured.
