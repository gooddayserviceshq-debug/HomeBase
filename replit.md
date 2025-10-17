# Good Day Services - Pressure Washing Automation Platform

## Overview

Good Day Services is a professional pressure washing service marketplace that enables customers to book services online with instant quotes and flexible scheduling. The platform features a conversion-focused design inspired by service marketplaces like Thumbtack and Calendly, emphasizing trust and ease of use.

The application is a full-stack TypeScript solution built with React for the frontend and Express for the backend, utilizing a PostgreSQL database through Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Component System:**
- shadcn/ui components (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom CSS variables for theming (light/dark mode support)

**Design System:**
- Primary color palette focused on trust (blue tones) and professionalism
- Inter font family across all weights (400-800)
- Responsive spacing system using 4px base units
- Custom border radius values (3px, 6px, 9px)

**Form Management:**
- React Hook Form for performant form state management
- Zod for schema validation and type inference
- @hookform/resolvers for seamless integration

**Key Pages:**
- Home: Marketing landing page with service showcase and Good Day Services branding
- Book: Multi-step booking flow with Google Maps property measurement (service selection → quote generation with map/manual entry → customer details → scheduling)
- Customer Dashboard: Appointment lookup and management by email
- Admin Dashboard: Service management and booking oversight

**Key Features:**
- **Logo Integration**: Custom Good Day Services logo displayed in header and favicon
- **Google Maps Property Measurement**: Interactive map tool allowing customers to draw property boundaries for automatic square footage calculation
  - Address search and geocoding
  - Polygon drawing tool with real-time area calculation
  - Converts square meters to square feet automatically
  - Alternative manual entry option via tabbed interface
- **Stripe Payment Integration** (configured, awaiting API keys): Ready for secure payment processing when booking appointments

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Custom Vite middleware integration for development hot-reload
- RESTful API design pattern

**API Structure:**
- `/api/services` - Service catalog management
- `/api/quotes` - Real-time price calculation endpoint
- `/api/bookings` - Appointment creation and retrieval
- `/api/bookings/customer/:email` - Customer-specific booking lookup

**Business Logic:**
- Quote calculation: Base price + (square footage × price per square foot)
- Service types: House Siding, Driveway, Deck & Patio, Roof Cleaning
- Booking status workflow: scheduled → in-progress → completed/cancelled

**Data Validation:**
- Zod schemas shared between client and server for type safety
- Request/response validation at API boundaries
- drizzle-zod for automatic schema generation from database models

### Data Storage

**Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and migrations
- Schema-first design with automatic TypeScript type inference

**Database Schema:**

*Services Table:*
- UUID primary key
- Service name, description, and icon identifier
- Decimal pricing: base price + per-square-foot rate

*Customers Table:*
- UUID primary key
- Contact information (name, email, phone, address)
- Unique email constraint for customer lookup
- Timestamp for record creation

*Bookings Table:*
- UUID primary key
- Foreign keys to customer and service
- Square footage and calculated total price
- Scheduled date/time
- Status tracking (scheduled, in-progress, completed, cancelled)
- Optional special instructions field

**Development Storage:**
- In-memory storage implementation (MemStorage) for development/testing
- Pre-seeded with default service offerings
- Maps-based data structure for quick lookups

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migrations stored in `/migrations` directory
- Push-based deployment with `db:push` command

### External Dependencies

**UI Component Libraries:**
- @radix-ui/* - Accessible, unstyled UI primitives (15+ components including Dialog, Dropdown, Select, Toast, Calendar)
- embla-carousel-react - Touch-friendly carousel component
- lucide-react - Icon library for consistent iconography
- react-day-picker - Date selection component
- cmdk - Command palette interface
- vaul - Drawer/bottom sheet component

**State Management & Data Fetching:**
- @tanstack/react-query - Async state management, caching, and synchronization
- React Hook Form - Form state and validation
- @hookform/resolvers - Validation resolver adapters

**Styling & Theming:**
- Tailwind CSS - Utility-first CSS framework
- tailwindcss-animate - Animation utilities
- class-variance-authority - Type-safe component variants
- clsx & tailwind-merge - Conditional className utilities

**Database & ORM:**
- @neondatabase/serverless - PostgreSQL serverless driver
- drizzle-orm - TypeScript ORM with query builder
- drizzle-kit - Schema management and migrations
- drizzle-zod - Zod schema generation from Drizzle tables

**Validation & Type Safety:**
- zod - Schema declaration and validation
- TypeScript - Static type checking across the stack

**Development Tools:**
- @replit/vite-plugin-* - Replit-specific development enhancements
- tsx - TypeScript execution for Node.js
- esbuild - Fast JavaScript bundler for production builds

**Session Management:**
- connect-pg-simple - PostgreSQL session store for Express (prepared for future authentication)

**Utilities:**
- date-fns - Date manipulation and formatting
- nanoid - Unique ID generation

**External API Integrations:**
- Google Maps JavaScript API - For property measurement and geocoding features
  - Requires VITE_GOOGLE_MAPS_API_KEY environment variable
  - Must enable Maps JavaScript API, Drawing Library, Geometry Library, and Places API in Google Cloud Console
- Stripe Payment Processing (ready for integration)
  - Requires VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY environment variables
  - Blueprint configured for one-time payment processing on booking confirmation

## Deployment Notes

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string (configured via Replit)
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (configured)
- `STRIPE_SECRET_KEY` - Stripe secret key (awaiting configuration)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (awaiting configuration)
- `SESSION_SECRET` - Express session secret (configured via Replit)

**Google Maps API Setup:**
1. Create project at https://console.cloud.google.com
2. Enable APIs: Maps JavaScript API, Geocoding API, Places API
3. Create API key and add to Replit Secrets as VITE_GOOGLE_MAPS_API_KEY
4. Restrict key to your domain in production

**Stripe Setup (when ready):**
1. Create account at https://stripe.com
2. Get API keys from https://dashboard.stripe.com/apikeys
3. Add STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY to Replit Secrets

**Production Checklist:**
- [ ] Verify all environment variables are set
- [ ] Enable Google Maps APIs in Cloud Console
- [ ] Configure Stripe webhook endpoints (if using subscriptions)
- [ ] Test complete booking flow end-to-end
- [ ] Verify payment processing (when Stripe is activated)
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (automatic with Replit deployment)