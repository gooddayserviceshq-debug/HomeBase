# Security Review — Good Day Services

Run this before any production deployment.

---

Paste PROJECT_CONTEXT.md first, then:

---

"Perform a security audit of the Good Day Services Express + React app.

Priority checks for this stack:
1. API routes — which are protected by isAuthenticated? Which should be but aren't?
2. Input validation — every POST body goes through Zod schema before DB write?
3. Stripe — is the PaymentIntent amount calculated server-side (not trusted from client)?
4. Environment variables — any secrets accidentally exposed to the frontend (VITE_ prefix)?
5. SQL injection — all DB queries use Drizzle ORM parameterized queries?
6. CORS — is Express configured to restrict origins in production?
7. Session security — SESSION_SECRET set? Cookie flags (httpOnly, secure, sameSite)?
8. CSV export route — is it behind auth so customers can't download all leads?
9. Admin routes — /api/admin/* all require isAuthenticated?
10. Rate limiting — any on quote/contact form submissions to prevent spam?

Rank findings: Critical / High / Medium / Low
Provide a specific fix for each Critical and High issue."
