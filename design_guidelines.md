# Design Guidelines: Good Day Services - Pressure Washing Automation Platform

## Design Approach: Reference-Based (Service Marketplace)
**Primary References:** Thumbtack (booking flow), Calendly (scheduling UX), ServiceTitan (professional service dashboard)

**Core Principle:** Build immediate trust through clean professionalism while making booking effortless. This is a conversion-focused platform where clarity and confidence drive action.

---

## Color Palette

**Primary Brand Colors:**
- Primary Blue: 210 85% 45% (trust, reliability, water association)
- Deep Navy: 215 30% 20% (text, headers, professionalism)
- Clean White: 0 0% 100% (backgrounds, cleanliness)

**Accent & Supporting:**
- Success Green: 145 65% 45% (completed services, positive actions)
- Warning Amber: 38 92% 55% (pending appointments, attention items)
- Light Gray: 210 20% 95% (subtle backgrounds, cards)
- Border Gray: 215 15% 85% (dividers, input borders)

**Dark Mode:**
- Background: 215 25% 12%
- Card Surface: 215 20% 18%
- Primary Adjusted: 210 75% 55%

---

## Typography

**Font Families:**
- Headings: 'Inter', sans-serif (700, 600 weights) - modern, professional
- Body: 'Inter', sans-serif (400, 500 weights)
- Accent/Stats: 'Inter', sans-serif (800 weight)

**Scale:**
- Hero Headline: text-5xl md:text-6xl, font-bold
- Section Headers: text-3xl md:text-4xl, font-semibold
- Card Titles: text-xl md:text-2xl, font-semibold
- Body: text-base md:text-lg
- Small/Meta: text-sm

---

## Layout System

**Spacing Units:** Primarily use 4, 6, 8, 12, 16, 20 units (p-4, m-8, gap-6, etc.)

**Container Strategy:**
- Marketing sections: max-w-7xl with px-4 md:px-8
- Dashboard content: max-w-6xl
- Forms: max-w-2xl
- Cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**Section Rhythm:**
- Marketing sections: py-16 md:py-24
- Dashboard sections: py-8 md:py-12
- Card padding: p-6 md:p-8

---

## Component Library

### Navigation
- Sticky header with Good Day Services logo left, navigation center, "Book Now" CTA right
- Mobile: hamburger menu with slide-in panel
- Secondary admin nav: sidebar with service icons and labels

### Booking Flow Components
- **Service Selector Cards:** Large clickable cards (min-h-32) with service icon, name, starting price, brief description
- **Quote Calculator:** Interactive form with real-time price display, inputs for square footage, service add-ons
- **Time Slot Picker:** Calendar grid view with available slots highlighted in primary blue, selected in deep navy
- **Progress Indicator:** Multi-step booking with numbered steps (1-4) showing Service → Details → Schedule → Confirm

### Dashboard Elements
- **Appointment Cards:** Horizontal layout with service image left, details center, status badge right
- **Admin Service Manager:** Table view with sortable columns (customer, service, date, status, actions)
- **Status Badges:** Rounded-full px-4 py-1 with color-coded backgrounds (green=completed, amber=pending, blue=scheduled)
- **Quick Stats Cards:** Grid of 4 cards showing key metrics (pending jobs, completed this week, revenue, customer satisfaction)

### Forms & Inputs
- All inputs: Consistent border-2 border-gray-300 dark:border-gray-600, rounded-lg, px-4 py-3
- Focus states: border-primary-blue ring-2 ring-primary-blue/20
- Textarea for special instructions: min-h-32
- Submit buttons: Full-width on mobile, auto-width on desktop

### Trust Elements
- Before/After image sliders for service showcase
- Customer review cards with 5-star ratings, customer name, service type
- Service guarantees with checkmark icons and bold promises
- "Trusted by 500+ homeowners" social proof badges

---

## Page-Specific Layouts

### Marketing/Landing Page (Customer-Facing)

**Hero Section (80vh):**
- Background: Large hero image of clean driveway/house exterior with subtle overlay (dark:bg-navy-900/70)
- Content: Centered, max-w-4xl
- Headline: "Crystal Clear Results, Every Time" (text-5xl md:text-6xl font-bold text-white)
- Subheading: Concise value prop with booking CTA (variant="default" large button)
- Quick service selector: 4 icon buttons for popular services below CTA

**Services Grid (3 columns lg, 2 md, 1 mobile):**
- Cards with service icon, name, "Starting at $X", description, "Learn More" link
- Hover: subtle scale and shadow transform

**How It Works (4 steps, horizontal timeline):**
- Numbered circles connected by lines
- Step icon, title, brief description below

**Before/After Gallery:**
- Masonry grid or comparison slider showcasing transformations
- Captions with service type and property size

**Testimonials (2 columns):**
- Customer photo (circular), quote, name, service date, 5-star rating

**Final CTA Section:**
- Full-width background (light-gray or primary-blue/10)
- "Ready for a Fresh Clean?" headline with prominent booking button

### Customer Dashboard

**Layout:** Sidebar navigation (Service History, Upcoming, Book New, Profile)

**Main Content:**
- Welcome header with customer name and quick action button
- Upcoming appointments: Timeline view with date markers and appointment cards
- Service history: Filterable table/card view with invoice download links
- Quick rebooking: "Book Again" buttons on past service cards

### Admin Dashboard

**Layout:** Left sidebar with metrics, main content area for management

**Key Sections:**
- Today's Schedule: Calendar day view with appointment blocks
- Service Queue: Kanban board (Scheduled → In Progress → Completed)
- Customer Management: Searchable table with communication tools
- Invoice Generator: Form with auto-calculation and PDF generation

---

## Images

**Hero Image:** Professional photograph of freshly pressure-washed modern home exterior or driveway, bright daylight, "after" quality showcasing pristine results (Dimensions: 1920x1080, position: center, overlay: subtle dark gradient for text readability)

**Service Icons:** Simple line icons representing each service (driveway, deck, siding, roof, etc.) in primary blue color

**Before/After Gallery:** 6-8 high-quality comparison images showing dramatic transformations of driveways, decks, home exteriors

**Testimonial Photos:** Professional headshots or authentic customer photos (circular cropped, 80x80px)

---

## Key UX Patterns

- **Instant Feedback:** Real-time quote calculations, immediate booking confirmations
- **Progressive Disclosure:** Multi-step booking reveals complexity gradually
- **Mobile-First Booking:** Thumb-friendly form inputs, large tap targets (min 44px)
- **Trust Indicators:** Visible throughout - guarantees, reviews, certifications
- **Clear Hierarchy:** Service > Action > Details pattern on all pages
- **Accessibility:** High contrast text, ARIA labels on interactive elements, keyboard navigation support