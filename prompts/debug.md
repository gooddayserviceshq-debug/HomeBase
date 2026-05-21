# Debug Prompt — Good Day Services

Use when something is broken.

---

Paste PROJECT_CONTEXT.md first, then describe the bug, then:

---

"Act as a principal engineer debugging this issue in the Good Day Services app.

Analyze systematically:
1. What is the exact error message / unexpected behavior?
2. Which file and line is most likely the root cause?
3. Is this a frontend, backend, or data issue?
4. What changed recently that could have caused this?
5. Are there related issues that will surface later?

Check these common failure points first:
- Environment variable missing (see PROJECT_CONTEXT.md env table)
- Drizzle schema out of sync with storage.ts queries
- Zod validation rejecting a field silently
- ESM import/require conflict (project uses type:module)
- Stripe or SendGrid not configured (graceful no-op vs. actual error)

Then provide the minimal targeted fix. No refactoring unless the bug requires it."
