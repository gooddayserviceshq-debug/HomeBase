# Good Day Services — Project Context

> Paste this into Claude at the start of every new session.

---

## Business Overview

**Company:** Good Day Services (affiliated with All Clean Power Wash)
**Owner:** Blake McConnell
**Phone:** (615) 390-9779
**Email:** Blake@gooddaypressurewashing.com
**Address:** 1205 Macey Peri Way, Smyrna, TN 37167
**Service Area:** Nashville, Brentwood, Franklin, Murfreesboro, Smyrna & surrounding Middle Tennessee
**Hours:** Mon–Sat 7am–6pm, Sunday by appointment

**Services:**
- Residential exterior / house washing
- Driveways & sidewalks (concrete, pavers)
- Decks & patios
- Commercial properties
- Roof soft wash
- Fences & retaining walls
- **Paver & concrete restoration** (premium niche — polymeric sand + sealing)

**Positioning:** Restoration specialist (not commodity cleaner). Average ticket target $600–$1,800 vs. market average $250.

**Competitors:** Sanders Pressure Washing, Top Shot Pressure Wash, Mid Tenn Pressure Washing, Outdoor ProWash. None have online self-serve booking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter routing |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL via Neon serverless, Drizzle ORM |
| Auth | Replit Auth (OpenID Connect / Passport.js) |
| Payments | Stripe (installed, awaiting API keys) |
| Email | SendGrid (`@sendgrid/mail` installed, awaiting `SENDGRID_API_KEY`) |
| SMS | Twilio (awaiting secrets) |
| Hosting | Replit Deployments (port 5000) |
| Static page | `landing.html` at repo root (zero-dependency deploy) |

---

## Environment Variables Required

| Variable | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection | Set in Replit |
| `STRIPE_SECRET_KEY` | Stripe server-side key | **MISSING** |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe client-side key | **MISSING** |
| `SENDGRID_API_KEY` | Email notifications | **MISSING** |
| `SENDGRID_FROM_EMAIL` | From address override | Optional (defaults to Blake@gooddaypressurewashing.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | Property measurement map | Set in Replit |
| `VITE_GOOGLE_PLACE_ID` | Google Review generator | **MISSING** |
| `TWILIO_ACCOUNT_SID` | SMS notifications | **MISSING** |
| `TWILIO_AUTH_TOKEN` | SMS notifications | **MISSING** |
| `TWILIO_PHONE_NUMBER` | SMS from number | **MISSING** |
| `SESSION_SECRET` | Express session | Set in Replit |

---

## Repository Structure

```
HomeBase/
├── client/src/
│   ├── pages/
│   │   ├── home.tsx              # Marketing landing page
│   │   ├── quote-selector.tsx    # Service type picker
│   │   ├── quote.tsx             # Paver restoration quote
│   │   ├── property-cleaning-quote.tsx  # House wash/cleaning quote
│   │   ├── checkout.tsx          # Stripe payment (fully wired)
│   │   ├── customer-dashboard.tsx
│   │   ├── admin/dashboard.tsx   # Admin booking management
│   │   ├── ceo-dashboard.tsx
│   │   └── Contact.tsx
│   └── components/
│       ├── CustomerInquiryForm.tsx
│       ├── QuoteSendDialog.tsx   # Send quote via email/SMS to customer
│       ├── google-review-generator.tsx
│       └── address-autocomplete.tsx
├── server/
│   ├── routes.ts                 # All API endpoints
│   ├── sendEmail.ts              # Email + SMS send functions + notifyOwner()
│   ├── emailService.ts           # HTML email templates
│   ├── storage.ts                # DB queries
│   └── schema (shared)
├── shared/schema.ts              # DB schema + Zod validators + cleaningServicePrices
├── landing.html                  # Static site (deploy instantly, no build needed)
├── docs/                         # ← You are here
└── prompts/                      # Reusable prompt library
```

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/create-payment-intent` | Stripe PaymentIntent for checkout |
| POST | `/api/quote-requests` | Save restoration quote + notify Blake |
| POST | `/api/property-cleaning/submit` | Save cleaning quote + notify Blake |
| POST | `/api/contact/inquiries` | Save inquiry + notify Blake |
| POST | `/api/send-quote/email` | Send quote email to customer |
| POST | `/api/send-quote/sms` | Send quote SMS to customer |
| GET | `/api/property-cleaning/quotes` | List all cleaning quotes |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/customers/export` | CSV export for email marketing |
| PATCH | `/api/bookings/:id/status` | Update booking status |

---

## Pricing Configuration

**File:** `shared/schema.ts` → `cleaningServicePrices`

| Service | Price |
|---|---|
| Driveway | $350 |
| Roof | $425 |
| Siding | $375 |
| Gutters | $200 |
| Fence (small, per side) | $100 |
| Fence (large, per side) | $200 |
| Minimum service | $975 |

**Paver restoration rates** (`server/routes.ts` → `BASE_RATES`):

| Surface | Per sq ft |
|---|---|
| Interlocking pavers | $0.35 |
| Poured concrete | $0.25 |
| Stamped concrete | $0.30 |
| Brick pavers | $0.40 |

Condition multipliers: Lightly dirty ×1.0 / Heavily soiled ×1.25 / Stained & damaged ×1.50

---

## Database Schema (Key Tables)

- **quoteRequests** — paver restoration quotes (name, email, phone, address, sqft, surface type, condition, tier prices)
- **propertyCleaningQuotes** — house wash quotes (customer info, service checkboxes, totals)
- **customerInquiries** — contact form submissions
- **orders** — checkout orders (stripePaymentIntentId wired)
- **products / cartItems** — service catalog for cart flow

---

## Notification Flow

Every quote or inquiry submission triggers `notifyOwner()` in `server/sendEmail.ts`:
1. Email → `Blake@gooddaypressurewashing.com`
2. SMS → `+16153909779`

Both fire in parallel. Gracefully no-ops if env vars not set (logs to console instead).

---

## What's Built vs. What's Pending

### Done
- [x] Full booking + quote flow (restoration + cleaning)
- [x] Stripe checkout (needs keys to go live)
- [x] Owner email + SMS notifications on all lead submissions
- [x] Admin dashboard (manage bookings, export CSV, send quote via email/SMS)
- [x] CEO dashboard
- [x] Google Review generator
- [x] Customer dashboard (look up appointments by email)
- [x] Static landing page (`landing.html`) with real contact info
- [x] Before/after photo gallery (stock images wired)
- [x] Real contact info throughout: (615) 390-9779, Blake@gooddaypressurewashing.com

### Pending (in priority order)
- [ ] Add `STRIPE_SECRET_KEY` + `VITE_STRIPE_PUBLIC_KEY` to Replit Secrets
- [ ] Add `SENDGRID_API_KEY` + verify sender domain in SendGrid
- [ ] Add `VITE_GOOGLE_PLACE_ID` for Review generator
- [ ] Add Twilio secrets for SMS
- [ ] Add real job photos to gallery as they're completed
- [ ] Set up Google Business Profile at gooddaypressurewashing.com domain

---

## Known Architecture Decisions

- **No shipping address** in checkout — simplified to "service address" (pressure washing = on-site service)
- **Stripe PaymentElement** used (not CardElement) — handles all card types automatically
- **In-memory storage** (`MemStorage`) used in development; PostgreSQL in production via `DATABASE_URL`
- **Google Places Autocomplete** temporarily disabled — manual address entry always enabled as fallback
- **Replit Auth** (OpenID Connect) used for admin routes — no custom auth built
- **ESM module format** throughout (`"type": "module"` in package.json)

---

## Development Branch

Active work: `claude/startup-data-analysis-7rnfi`
