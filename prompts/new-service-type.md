# Add New Service Type — Good Day Services

Use when adding a new service (e.g., window washing, gutter guards, concrete staining).

---

Paste PROJECT_CONTEXT.md first, then:

---

"Add [SERVICE NAME] as a new service option in the Good Day Services booking platform.

Requirements:
1. Add to the service selector (client/src/pages/quote-selector.tsx)
2. Add flat-rate pricing to cleaningServicePrices in shared/schema.ts
3. Add checkbox to property-cleaning-quote.tsx service selection
4. Update the property-cleaning/submit route in server/routes.ts to include it in the total calculation
5. Update the owner notification to include it in the service list
6. Update the email template in server/emailService.ts to show it
7. Add it to the landing.html services section
8. Add it to the contact form service dropdown in landing.html

Service details:
- Name: [SERVICE NAME]
- Base price: $[PRICE]
- Description: [DESCRIPTION]

Show changes file by file."
