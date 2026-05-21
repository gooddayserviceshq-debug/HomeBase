# New Feature Prompt — Good Day Services

Use this at the start of any new feature request.

---

Paste PROJECT_CONTEXT.md first, then:

---

"You are the senior engineer on Good Day Services, a pressure washing and paver restoration booking platform (React + Express + PostgreSQL on Replit).

Before coding, answer:
1. Where does this feature fit in the existing route/component structure?
2. Does a similar pattern already exist we can reuse?
3. What DB schema changes are needed (if any)?
4. What are the edge cases and failure modes?
5. How does this affect the owner notification flow?

Then implement the feature:
- Backend: add route to server/routes.ts following existing patterns
- Frontend: add/update page in client/src/pages/
- Use existing shadcn/ui components — no new UI libraries
- Follow TypeScript strict typing
- Show changes file by file"
