# Update Pricing — Good Day Services

Use when adjusting service rates.

---

Paste PROJECT_CONTEXT.md first, then:

---

"Update pricing in the Good Day Services app.

Current pricing is defined in two places:
1. shared/schema.ts → cleaningServicePrices (flat rates per service)
2. server/routes.ts → BASE_RATES, SEALER_RATES, POLYMERIC_SAND_COST_PER_SQ_FT (per-sqft restoration rates)

Changes needed:
[LIST YOUR PRICE CHANGES HERE]

After updating, also check:
- server/emailService.ts hardcodes some prices in the HTML templates — update those to match
- The quote calculation in /api/property-cleaning/calculate should reflect new totals

Show changes file by file."
