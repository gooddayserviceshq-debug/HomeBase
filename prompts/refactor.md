# Refactor Pass — Good Day Services

Run this after a feature is working, before considering it "done."

---

Paste PROJECT_CONTEXT.md + the relevant file(s), then:

---

"Refactor the attached code for the Good Day Services app.

Do NOT change functionality. Improve:
1. Remove any duplicate logic (especially in routes.ts which has grown organically)
2. Extract repeated DB patterns into reusable storage.ts methods
3. Ensure all async routes have try/catch (none should crash the server silently)
4. Confirm all Zod validation happens before any DB write
5. Remove any console.log statements left from debugging
6. Ensure TypeScript types are explicit — no implicit any
7. Check that notifyOwner() is called consistently across all lead-generating routes

Show changes file by file. Explain each change in one sentence."
