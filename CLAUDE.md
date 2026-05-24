# CLAUDE.md — HomeBase (Good Day Services)

## Project Overview

HomeBase is a full-stack TypeScript web application for **Good Day Services**, a pressure washing and property cleaning marketplace. It combines service quoting, e-commerce, warranty management, and admin dashboards in a single platform.

---

## Architecture

```
/
├── client/          # React 18 frontend (Vite)
├── server/          # Express.js backend
├── shared/          # Shared TypeScript types and Zod schemas
├── attached_assets/ # Static images and documents
├── migrations/      # Drizzle ORM SQL migrations
└── dist/            # Production build output
```

### Stack

| Layer       | Technology                                                     |
|-------------|----------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Wouter (routing), TanStack Query   |
| UI          | shadcn/ui (New York style), Radix UI, Tailwind CSS, Lucide     |
| Forms       | React Hook Form + Zod resolvers                                |
| Backend     | Express.js, TypeScript, tsx (dev runner)                       |
| Database    | PostgreSQL 16 (Neon serverless), Drizzle ORM                   |
| Auth        | Replit Auth via OpenID Connect + Passport.js + express-session |
| Animations  | Framer Motion                                                  |
| Payments    | Stripe (configured, keys required)                             |

---

## Development Commands

```bash
npm run dev        # Start dev server (port 5000, TypeScript via tsx)
npm run build      # Production build: Vite (client) + esbuild (server)
npm run start      # Run production server from dist/
npm run check      # TypeScript type checking (tsc --noEmit)
npm run db:push    # Push schema changes to PostgreSQL (drizzle-kit push)
```

**No test framework is configured.** There are currently no unit or integration tests.

---

## Environment Variables

These must be set (in Replit Secrets or `.env`):

| Variable                  | Purpose                                  |
|---------------------------|------------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string (Neon)      |
| `SESSION_SECRET`          | Express session secret                   |
| `REPLIT_DOMAINS`          | Replit domain for auth callback          |
| `ISSUER_URL`              | OpenID Connect issuer (Replit Auth)      |
| `VITE_GOOGLE_MAPS_API_KEY`| Google Maps address autocomplete         |
| `VITE_STRIPE_PUBLIC_KEY`  | Stripe publishable key                   |
| `STRIPE_SECRET_KEY`       | Stripe secret key                        |

---

## Key Files

| File                       | Purpose                                                |
|----------------------------|--------------------------------------------------------|
| `shared/schema.ts`         | **Source of truth** — all DB tables, Zod schemas, types |
| `server/routes.ts`         | All API route handlers (~967 LOC)                      |
| `server/storage.ts`        | Data access layer (IStorage interface + implementations)|
| `server/db.ts`             | Drizzle ORM database connection                        |
| `server/replitAuth.ts`     | Replit OpenID Connect authentication setup             |
| `server/sendEmail.ts`      | Email sending utilities                                |
| `client/src/App.tsx`       | Client router and route definitions                    |
| `client/src/pages/`        | Page-level components                                  |
| `client/src/components/`   | Reusable UI components                                 |
| `client/src/components/ui/`| shadcn/ui base components (do not modify manually)     |
| `client/src/hooks/useAuth.ts` | Authentication state hook                           |
| `drizzle.config.ts`        | Drizzle ORM configuration                              |
| `vite.config.ts`           | Vite build configuration with path aliases             |
| `tailwind.config.ts`       | Tailwind CSS theme/colors configuration                |
| `replit.md`                | Detailed project history and architecture notes        |
| `design_guidelines.md`     | Brand colors, typography, and UI design system         |

---

## Database Schema

All tables are defined in `shared/schema.ts`. Schema changes require running `npm run db:push`.

| Table                    | Purpose                                             |
|--------------------------|-----------------------------------------------------|
| `sessions`               | Express session storage (connect-pg-simple)         |
| `users`                  | Replit Auth user profiles                           |
| `quoteRequests`          | Paver restoration quotes with tiered pricing        |
| `propertyCleaningQuotes` | Property cleaning service quotes                    |
| `customerInquiries`      | Customer support tickets                            |
| `categories`             | Product categories                                  |
| `products`               | Product catalog with inventory                      |
| `cartItems`              | Shopping cart (user or session-based)               |
| `orders`                 | Order management with status tracking               |
| `orderItems`             | Order line items                                    |
| `warranties`             | Warranty management for products/services           |
| `documents`              | Documents, manuals, and guides                      |

**Conventions:**
- UUID primary keys via `gen_random_uuid()`
- `createdAt` / `updatedAt` timestamps on all tables
- Decimal pricing with `precision: 10, scale: 2`
- JSONB for flexible nested data (addresses, specs, image arrays)

---

## API Conventions

- All API routes are prefixed with `/api/`
- Authentication is session-cookie-based
- Request/response bodies are JSON
- Zod validation occurs at the API boundary in `server/routes.ts`
- Consistent error format: `{ message: string }` with appropriate HTTP status codes

**Authentication middleware:**
- `req.isAuthenticated()` — check session auth
- `req.user` — typed as `Express.User` from Replit Auth profile

---

## Frontend Conventions

### Routing
Uses **Wouter** (not React Router). Routes are defined in `client/src/App.tsx`.

```tsx
import { Route, Switch } from "wouter";
```

### Data Fetching
Use **TanStack Query** (`useQuery`, `useMutation`) for all server state. The query client is configured in `client/src/lib/queryClient.ts`.

```tsx
const { data, isLoading } = useQuery({ queryKey: ["/api/products"], queryFn: ... });
```

### Forms
Use **React Hook Form** with Zod resolvers:

```tsx
const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

### Path Aliases
Configured in `tsconfig.json` and `vite.config.ts`:

```ts
@/*        → client/src/*
@shared/*  → shared/*
@assets/*  → attached_assets/*
```

### Component Organization
- `client/src/components/ui/` — shadcn/ui primitives (generated, avoid manual edits)
- `client/src/components/` — custom app components
- `client/src/pages/` — full page components mapped to routes
- `client/src/hooks/` — custom React hooks
- `client/src/lib/` — utility functions and client config

---

## Code Conventions

### Naming
- `camelCase` — variables, functions, component props
- `PascalCase` — React components, TypeScript classes/types
- `UPPER_SNAKE_CASE` — constants (e.g., `BASE_RATES`, `CONDITION_MULTIPLIERS`)
- `snake_case` — database column names
- `kebab-case` — route paths and file names

### TypeScript
- Strict mode is enabled — no implicit `any`
- Infer types from Drizzle tables using `$inferSelect` / `$inferInsert`
- Infer types from Zod schemas using `z.infer<typeof schema>`
- All shared types belong in `shared/schema.ts`

### Styling
- Use Tailwind utility classes; avoid inline styles
- Dark mode via class-based toggle (`dark:` prefix)
- Colors defined as CSS HSL variables in `tailwind.config.ts` and `client/src/index.css`
- Use `cn()` from `client/src/lib/utils.ts` to merge class names conditionally

### Storage Layer
The `IStorage` interface in `server/storage.ts` abstracts database access. Always add new data operations to this interface and both implementations (`MemStorage` and `DatabaseStorage`).

---

## Business Logic Notes

- **Quote pricing** uses tiered rate tables (`BASE_RATES`, `CONDITION_MULTIPLIERS`) defined in `client/src/pages/quote.tsx` and `property-cleaning-quote.tsx`
- **Admin dashboard** (`/admin`) and **CEO dashboard** (`/ceo-dashboard`) show business analytics and are role-gated
- **Customer dashboard** (`/dashboard`) allows customers to track orders, warranties, and documents
- **Google Maps autocomplete** is used for address input in quote forms (requires `VITE_GOOGLE_MAPS_API_KEY`)
- **Email notifications** are sent via `server/sendEmail.ts` and `server/emailService.ts` for quote submissions and inquiries

---

## Deployment

The app is deployed on **Replit** via `.replit` configuration:
- Dev: `npm run dev` on port 5000
- Build: `npm run build`
- Production: `npm run start`

The server serves the built Vite assets statically in production mode and proxies API requests.
