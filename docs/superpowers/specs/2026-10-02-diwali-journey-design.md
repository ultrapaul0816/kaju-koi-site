# Kaju Koi Diwali 2026 — automated customer journey (design)

Date: 2 Oct 2026 · Owner: Varun · Status: draft for approval

## 1. Goal and constraints

Sell Kaju Koi for Diwali to **corporate buyers first, individual gifters second**, and collect **distributor/partner leads**, with a journey that runs **without anyone handling customers one by one**.

- Delivery area: **Delhi NCR and Mumbai only** (pincode-gated). Everyone else joins a city waitlist.
- Fulfilment: **courier from Goa** via Shiprocket (2–4 days).
- Diwali (Lakshmi Puja) is assumed to be **Sun 8 Nov 2026** — confirm before launch.
- Deliveries run **20 Oct → 1 Nov**. Corporate orders close **24 Oct**, individual orders **28 Oct** (courier buffer for Diwali-week backlog).
- Ready by 15 Oct (per Varun): FSSAI number, payment gateway (Razorpay), WhatsApp Business number, domain + business email.
- Promotion: online ads, mass mailers, WhatsApp forwards. No offline sales force; "offline" = the physical box, sleeve and inserts.

**Success:** paid orders delivered inside their promised window; zero orders accepted beyond baking capacity; every order tagged with its marketing source; a list of Diwali buyers and partner leads to re-market at Christmas.

## 2. Decisions taken on Varun's behalf (all editable settings, not code)

| Setting | Default | Reasoning |
|---|---|---|
| Corporate price, box of 12 (MRP ₹749) | 25–99: **₹699** · 100–249: **₹649** · 250+: **₹599** | 7% / 13% / 20% off MRP; 20% is a normal ceiling for festive B2B gifting |
| Corporate price, box of 24 (MRP ₹1,399) | 25–99: **₹1,299** · 100–249: **₹1,199** · 250+: **₹1,099** | Same percentages, rounded |
| Corporate minimum | **25 boxes**, one SKU size per order | Below 25, use the individual checkout |
| Logo sleeve | **Included** at 25+ | Removes a pricing question; sleeve print cost is small |
| Tasting box | Box of 6 at **₹399**, refunded as a **₹399 credit code** on a corporate order placed within 30 days | Replaces the sales visit; self-qualifies serious buyers |
| Individual delivery | **Free above ₹1,000**, otherwise **₹99** | Covers courier on a single box of 6 |
| Corporate delivery | **Free**, one address per order | Bulk consignment |
| Daily packing capacity | **200 boxes/day** (Mon–Sat) | Placeholder — Varun to correct; the system enforces whatever is set |
| Delivery windows | **20–24 Oct**, **25–28 Oct**, **29 Oct–1 Nov** | Each window's capacity = sum of its packing days; sells out automatically |
| Replacement policy | Damaged/missing reported **with a photo within 48 h of delivery** → one automatic free replacement per order, up to **₹1,500**; above that, flagged for Varun | Handles the common case with no human |
| Delivery area | Delhi NCR: 110xxx, 121xxx (Faridabad), 122xxx (Gurugram), 201xxx (Noida/Ghaziabad). Mumbai: 400xxx (incl. Thane, Navi Mumbai), 401101–401107 (Mira-Bhayandar), 410206–410218 (Panvel/Kharghar) | Prefix rules in one config list |

## 3. Approach

**Fully automated store on the existing stack** (static site on GitHub Pages + Supabase), chosen over hands-on concierge (no capacity to handle customers individually) and over migrating to Shopify (redesign and switching risk three weeks before launch). Revisit Shopify after Diwali if individual volume justifies it.

## 4. Journey

### 4.1 Before purchase

- **Traffic sources:** mass mailers, Meta/Instagram ads, Google search, WhatsApp forwards. Every outbound link carries UTM tags; the site stores `utm_source / medium / campaign` (first-touch, 30 days) and attaches them to every order, tasting box and partner lead.
- **Homepage** switches to Diwali: Diwali hero (`life-diwali` image), the delivery-cities chip, cut-off countdown, and two clear routes: "Corporate gifts" and "Gift a box". Out-of-season Kokum/Bebinca cards are hidden until after Diwali.
- **Site-wide banner** (replaces the "preview / FSSAI" bar): "Diwali orders open · Delhi NCR & Mumbai · Corporate closes 24 Oct, gifts close 28 Oct".
- **`/diwali` (individuals):** pincode checker first; box cards with prices; unboxing photos; ingredients/allergens; countdown; "Order now".
- **`/diwali-corporate`:** headline promise (logo sleeve, GST invoice, delivered by 1 Nov); the price-tier table; a live sleeve preview teaser; FSSAI + eggless/vegetarian marks; the tasting box offer; "Build your order".
- **`/partners`:** for gifting agencies, hamper makers, premium stores and distributors: what Kaju Koi offers (margins "shared on approval"), cities wanted, short application form.
- **`/faq`:** delivery dates and areas, sleeve artwork rules, invoices/GST, shelf life and storage, allergens, what happens if a box arrives damaged, cancellations.
- **Out-of-area pincode:** "We don't deliver to [city] yet" + one-field waitlist (email + pincode). This feeds the distributor search.

### 4.2 Purchase

**Individual checkout (`/order`, rebuilt):**
1. Pincode (pre-filled if checked earlier) → delivery-window picker showing only windows with capacity left.
2. Choose boxes (Original 6/12/24, single, mixed). Running total incl. delivery charge.
3. "This is a gift": recipient name/phone/address, gift-message card, price hidden on the packing slip.
4. Buyer name, phone, email. Optional GSTIN for a business invoice.
5. Pay via **Razorpay Checkout** (UPI, cards, netbanking, wallets).
6. Success page + email + WhatsApp with order number, window, and GST invoice PDF.

**Corporate order builder (`/diwali-corporate#build`):**
1. Box size (12 or 24) and quantity (min 25) → tier price applies live; total, savings vs MRP shown.
2. Sleeve: upload logo (PNG/SVG/JPG; checks ≥ 600 px wide for raster, file ≤ 5 MB), pick message line ("With warm wishes from {Company}" or custom ≤ 60 chars), optional per-box card line. **Live preview** renders on the actual sleeve artwork. Buyer ticks "I approve this sleeve exactly as shown".
3. Company name, GSTIN (format-validated), billing address; delivery address (one) + contact person + window (corporate windows end 1 Nov but orders close 24 Oct).
4. Optional tasting-box credit code.
5. Razorpay payment → success + email + WhatsApp with tax invoice PDF and sleeve proof PDF.

**Tasting box:** a normal individual order for the box of 6 flagged `tasting`; on payment, the system issues a single-use ₹399 corporate credit code (valid 30 days) and emails it.

**Capacity guard:** each order reserves boxes against its window when payment starts (15-minute hold); paid orders commit; failed/expired payments release. A window shows "Full" when committed + held ≥ capacity. Corporate and individual orders draw from the same pool.

### 4.3 After purchase

**Admin (`/admin`, Supabase magic-link login, Varun's email only):**
- Today's paid orders by window, with packing slips (PDF) and print-ready **sleeve files** (PDF at print size, logo placed).
- "Create shipment" (single or bulk) → Shiprocket order + label + AWB. Order status → Packed / Shipped.
- Settings screen for the editable values in §2 (prices, capacity, windows, cut-offs, policies).
- Lists: problem reports, partner leads, waitlist (by city), tasting-box credits.

**Customer updates (email + WhatsApp templates via AiSensy):**
Confirmed → Packed → Shipped (tracking link) → Out for delivery → Delivered, driven by Shiprocket webhooks.

**Day 3 after delivery:** "How was it?" one-tap 1–5 rating + "Send one to someone" link (pre-filled gift checkout) + Instagram handle.

**Report a problem (`/help`):** order number + phone, issue type, photo. Within policy → replacement order created automatically into the next open window, customer told by email/WhatsApp. Outside policy → flagged in admin, customer told "we'll reply within 24 h".

**In the box (print):**
- Individual: thank-you card, QR → "Send one to someone / reorder", teaser "Bebinca Koi, Christmas edition — pre-orders in December".
- Corporate recipients: card "A Diwali gift from {Company}" and QR "Who made this?" → a short Kaju Koi story page with a gift-order link. Every corporate box is a sampling event for new buyers.
- Corporate sleeve template (print master) with the logo panel.

**Re-marketing:**
- Early December: Bebinca Christmas pre-order email/WhatsApp to all Diwali buyers and recipients who scanned the QR.
- Corporate: "Your sleeve is saved — reorder in one click" (stored logo + message).
- Partner leads: automatic acknowledgement; list sorted by city for Varun's distributor search.

## 5. System design

| Unit | Responsibility | Depends on |
|---|---|---|
| Static pages (`src/*.html` → `build.py`) | Landing pages, checkout UIs, admin UI shell | Public config, edge functions |
| `site/js/*.js` | UTM capture, pincode check, cart, sleeve preview (canvas), Razorpay Checkout | `config.js`, edge functions |
| Edge fn `catalog` | Public read: products, prices, tiers, open windows + remaining capacity, cut-offs, delivery-area rules | `settings`, `windows` |
| Edge fn `checkout` | Validates cart/pincode/window/tier, reserves capacity, creates Razorpay order, returns order id | Razorpay API |
| Edge fn `razorpay-webhook` | Verifies signature; marks paid; commits capacity; issues credit codes; generates invoice PDF; sends confirmations | Resend, AiSensy, Storage |
| Edge fn `shiprocket-webhook` | Maps courier status → order status; sends updates | Resend, AiSensy |
| Edge fn `admin` | Authenticated: order lists, PDFs, create Shiprocket shipments, settings edits | Supabase Auth, Shiprocket |
| Edge fn `submit` (existing, extended) | Partner applications, waitlist, problem reports (with photo upload URL) | Storage |
| Scheduled job (pg_cron) | Expire holds every 5 min; day-3 follow-ups; daily summary email to Varun | — |
| Postgres tables | `products`, `price_tiers`, `settings`, `windows`, `orders`, `order_items`, `capacity_holds`, `credit_codes`, `shipments`, `messages_log`, `partner_leads`, `waitlist`, `problem_reports` (existing `orders`/`enquiries` kept as legacy) | RLS: no public access; functions use service role |
| Storage buckets (private) | `logos`, `invoices`, `sleeves`, `problem-photos` | Signed URLs only |

**Money and tax:** all prices are MRP inclusive of GST; invoices show the GST breakup (rate set in settings — confirm the HSN/rate for cookies with the accountant). Amounts stored in paise. Razorpay webhook is the single source of truth for "paid".

**Failure handling:**
- Payment succeeds but the browser closes → webhook still marks paid and sends confirmations.
- Webhook arrives twice → idempotent on Razorpay payment id.
- Capacity sold out between page load and pay → `checkout` rejects and the UI offers the next window.
- Email/WhatsApp provider down → logged in `messages_log` with retry by the scheduled job; order is never blocked on messaging.
- Shiprocket API down → admin shows the error; retry button.

**Security:** secrets only in Supabase function secrets; admin restricted to an allow-listed email; uploads type/size-checked and stored privately; rate limit per IP on `checkout` and `submit`; honeypot fields kept.

## 6. Testing

- Unit tests for pricing/tiers, pincode rules, capacity arithmetic, GSTIN validation, invoice totals.
- Razorpay **test mode** end to end (Playwright, extending `tools/e2e*.js`): individual gift order, corporate order with logo upload, tasting box → credit → corporate order, sold-out window, duplicate webhook.
- Shiprocket staging/sandbox for shipment creation; webhook replay for status messages.
- Mobile (iPhone 13) and desktop screenshot pass on every new page.
- Test orders keep the existing `TEST` name prefix → `is_test = true`, excluded from capacity and reports.

## 7. Launch sequence

| By | Milestone |
|---|---|
| 8 Oct | Pages + catalogue + pincode gate + UTM live on the domain (orders still disabled) — mailers/ads can be prepared |
| 12 Oct | Razorpay checkout (test mode), capacity, confirmations, invoices |
| 15 Oct | Razorpay live, corporate builder + sleeve proofs, admin, Shiprocket |
| 17 Oct | Problem reports, day-3 follow-up, print files for cards/sleeves sent to printer |
| 18 Oct | Mailers and ads go out |
| 20 Oct | First deliveries |

## 8. Out of scope (for now)

Multi-address corporate shipping (CSV upload), cities beyond Delhi NCR/Mumbai, cash on delivery, customer accounts/login, discount campaigns beyond the tasting credit, Shopify migration, non-Diwali seasonal editions.

## 9. Needed from Varun

Razorpay, Shiprocket and AiSensy credentials; Resend sender domain verified; WhatsApp number; domain; FSSAI number; GSTIN and registered address; GST rate/HSN confirmation; corrected daily capacity; confirmation of the Diwali date.
