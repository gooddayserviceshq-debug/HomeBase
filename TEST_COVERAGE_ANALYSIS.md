# Test Coverage Analysis

**Date:** 2026-03-22
**Repository:** HomeBase (Good Day Services HQ)

---

## Summary

**Current test coverage: 0%**

The codebase has no test files, no test framework installed, and no CI/CD pipeline. Every line of production code (~14,700 lines across server and client) is completely untested.

---

## Codebase Overview

| Area | Files | Approx. LOC |
|------|-------|-------------|
| Server (routes, storage, email, auth) | 8 | ~2,650 |
| Shared schemas | 1 | ~300 |
| Client pages | 15 | ~6,800 |
| Custom components | 8 | ~1,800 |
| Hooks & utilities | 7 | ~500 |
| **Total** | **39** | **~12,050** |

---

## Recommended Testing Strategy

Given that this is a React + Express.js app with Drizzle ORM, the recommended stack is:

- **Unit/Integration tests:** [Vitest](https://vitest.dev/) — works seamlessly with Vite, requires minimal config
- **API integration tests:** [Supertest](https://github.com/ladjs/supertest) — test Express routes without a running server
- **Component tests:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) — test UI components with user-centric queries
- **End-to-end tests (optional, later):** [Playwright](https://playwright.dev/) — full browser automation

---

## Priority Areas for Test Improvement

### Priority 1 — Critical Business Logic (High Impact, Easiest to Test)

#### 1.1 `calculateQuoteTiers()` — `server/routes.ts:38`

This pure function computes the three pricing tiers (Basic / Recommended / Premium) that customers see. Pricing bugs directly cost or lose revenue.

**What to test:**
- Correct base rate is applied per `surfaceType` (`interlocking_pavers: $0.35/sqft`, `poured_concrete: $0.25`, etc.)
- Correct condition multipliers (`lightly_dirty: 1.0x`, `heavily_soiled: 1.25x`, `stained_damaged: 1.5x`)
- `includePolymericSand` only adds the $0.50/sqft sand cost to Recommended and Premium, not Basic
- Premium always uses the penetrating sealer rate ($1.25), Basic/Recommended use acrylic ($0.75)
- Prices are rounded to 2 decimal places
- Edge cases: minimum dimensions (1×1), maximum dimensions (500×500)

```ts
// Example test cases
calculateQuoteTiers(100, "poured_concrete", "lightly_dirty", false)
// basic = 100 * 0.25 * 1.0 + 100 * 0.75 = $100
// recommended = $100 (no sand, no diff from basic)
// premium = 100 * 0.25 + 100 * 1.25 = $150

calculateQuoteTiers(100, "interlocking_pavers", "stained_damaged", true)
// base = 100 * 0.40 * 1.5 = $60
// basic = $60 + 100 * 0.75 = $135 (no sand in basic)
// recommended = $60 + 100 * 0.50 + 100 * 0.75 = $185
// premium = $60 + 100 * 0.50 + 100 * 1.25 = $235
```

---

#### 1.2 Property Cleaning Quote Calculation — `server/routes.ts:209`

The `/api/property-cleaning/calculate` endpoint calculates itemized totals and applies a minimum service charge. The minimum charge logic is easy to get wrong.

**What to test:**
- Single services produce the correct itemized price
- Multiple services sum correctly
- Minimum service charge is applied when `itemizedTotal < minimumService`
- Minimum is NOT applied when total is already above the threshold
- Fence pricing: `fencePricePerSide * fenceSides` with 0, 1, and multiple sides
- `minimumApplied` flag is `true`/`false` correctly

---

#### 1.3 Shared Zod Schemas — `shared/schema.ts`

Zod schemas define the contract between client and server. Broken validation means invalid data reaches the database.

**What to test:**
- `quoteCalculationSchema` rejects out-of-range `length`/`width` (0, 501, negative)
- `quoteCalculationSchema` rejects unknown `surfaceType` and `condition` enum values
- `insertQuoteRequestSchema` correctly omits server-computed fields (`id`, `squareFootage`, prices)
- `propertyCleaningCalculationSchema` validates all boolean fields and numeric `fenceSides`

---

### Priority 2 — API Route Integration Tests

#### 2.1 Quote API Endpoints

The quote system is the core business flow. Integration tests using Supertest would verify the full request→validation→calculation→response pipeline.

**Endpoints to test:**
- `POST /api/calculate-quote` — valid body returns correct tiers; invalid body returns 400 with Zod errors
- `POST /api/quote-requests` — creates a quote and returns `quoteId` + tiers
- `GET /api/quote-requests` — returns list of quotes
- `GET /api/quote-requests/:id` — returns single quote; 404 for missing ID

---

#### 2.2 Auth Middleware — `server/replitAuth.ts`

The `isAuthenticated` middleware guards admin and user routes. A bug here could expose sensitive data or block legitimate users.

**What to test:**
- Unauthenticated requests to protected routes (`/api/auth/user`) return 401
- Requests with missing `claims.sub` return 401 (the defensive check at `routes.ts:103`)
- Authenticated requests with a valid session pass through

---

#### 2.3 Property Cleaning Quote API

- `POST /api/property-cleaning/calculate` — correct breakdown and total returned
- `POST /api/property-cleaning/quotes` — quote is saved and confirmation returned
- `GET /api/property-cleaning/quotes` (admin) — requires auth

---

### Priority 3 — Storage Layer

#### 3.1 `IStorage` Interface — `server/storage.ts`

The storage layer is an in-memory implementation (for development) backed by a real Drizzle/PostgreSQL database in production. Testing the in-memory implementation would catch logic bugs before they hit the DB.

**What to test:**
- `createQuoteRequest()` — stores the correct `squareFootage` and tier prices
- `getQuoteRequest(id)` — returns `undefined` for a non-existent ID
- `upsertUser()` — creates a new user on first call; updates on second call with same ID
- Cart operations: add → update quantity → remove → clear flow
- Order creation: `createOrder()` correctly links `OrderItem` records to the `Order`
- `updateOrderStatus()` — only valid status values are persisted; returns `undefined` for missing order

---

### Priority 4 — Custom React Components

#### 4.1 `CustomerInquiryForm` — `client/src/components/CustomerInquiryForm.tsx` (306 LOC)

This is a form that customers fill out. It has validation logic and an API submission.

**What to test:**
- Required fields show validation errors when empty on submit
- Form submits correctly with all required fields filled
- Error state is displayed when the API call fails
- Success state is shown after submission

#### 4.2 `QuoteSendDialog` — `client/src/components/QuoteSendDialog.tsx` (209 LOC)

**What to test:**
- Dialog opens/closes correctly
- Email address validation before sending
- Loading state during the send operation
- Success/error feedback to the user

#### 4.3 `property-measurement` — `client/src/components/property-measurement.tsx` (263 LOC)

**What to test:**
- Square footage updates reactively when length/width inputs change
- Non-numeric input is rejected or handled gracefully
- Boundary values (min/max dimensions) are enforced

---

### Priority 5 — Custom React Hooks

#### 5.1 `useAuth` — `client/src/hooks/useAuth.ts`

**What to test:**
- Returns the correct `user` object when authenticated
- Returns `null`/`undefined` when unauthenticated
- `isLoading` is `true` during the fetch, `false` afterwards

#### 5.2 `use-mobile` — `client/src/hooks/use-mobile.tsx`

**What to test:**
- Returns `true` when viewport width is below the mobile breakpoint
- Returns `false` above the breakpoint
- Responds to window resize events

---

### Priority 6 — Email Templates

#### 6.1 `generatePropertyCleaningQuoteEmail()` — `server/emailService.ts:17`

This is a pure function that accepts a quote object and returns `{ subject, html, text }`.

**What to test:**
- Subject line contains the truncated quote ID
- HTML and text include each selected service with correct prices
- Fence price is correctly calculated (`fencePricePerSide * fenceSides`) in the output
- Services with `false` flags do not appear in the output
- No services selected → output gracefully handles an empty services list

---

## Suggested File Structure

```
HomeBase/
├── tests/
│   ├── unit/
│   │   ├── calculateQuoteTiers.test.ts       ← Priority 1.1
│   │   ├── propertyCleaningCalc.test.ts      ← Priority 1.2
│   │   ├── schemas.test.ts                   ← Priority 1.3
│   │   └── emailTemplates.test.ts            ← Priority 6.1
│   ├── integration/
│   │   ├── quoteRoutes.test.ts               ← Priority 2.1
│   │   ├── authMiddleware.test.ts            ← Priority 2.2
│   │   └── propertyCleaningRoutes.test.ts    ← Priority 2.3
│   └── components/
│       ├── CustomerInquiryForm.test.tsx      ← Priority 4.1
│       ├── QuoteSendDialog.test.tsx          ← Priority 4.2
│       └── property-measurement.test.tsx     ← Priority 4.3
├── vitest.config.ts
└── package.json  ← add vitest, @testing-library/react, supertest
```

---

## Setup Steps

1. Install test dependencies:
   ```bash
   npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom supertest @types/supertest
   ```

2. Add `vitest.config.ts`:
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   import path from "path";

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: "jsdom",
       globals: true,
       coverage: { provider: "v8", reporter: ["text", "html"] },
     },
     resolve: {
       alias: { "@shared": path.resolve(__dirname, "shared") },
     },
   });
   ```

3. Add scripts to `package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:coverage": "vitest run --coverage"
   ```

4. Start with Priority 1 unit tests — they require no mocking and will give immediate confidence.

---

## Coverage Targets (Suggested)

| Phase | Target | Focus |
|-------|--------|-------|
| Phase 1 | 20% | All unit tests (pure functions + schemas) |
| Phase 2 | 45% | All API route integration tests |
| Phase 3 | 65% | Storage layer + hooks |
| Phase 4 | 80% | Key components (quote flow, forms) |
