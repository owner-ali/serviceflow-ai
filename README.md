# ServiceFlow AI

> Your entire service business. One intelligent flow.

AI-powered Field Service Management ecosystem: customer + technician Flutter apps,
a Next.js 3D admin/marketing web app, and a Supabase/PostgreSQL backend.

## Monorepo layout

```
/apps
  /web               → Next.js admin dashboard + 3D marketing site (TypeScript, Tailwind, R3F)
  /customer-app       → Flutter customer app
  /technician-app      → Flutter technician app
/packages
  /types              → Shared TypeScript types generated from the DB schema
  /ui                 → Shared React component library
  /api                → Shared API client (Supabase queries, typed)
  /config             → Shared lint/tsconfig/tailwind config
/supabase
  /migrations         → SQL schema, RLS policies (source of truth for the DB)
  /seed               → Demo data seed script
  /functions           → Edge functions (AI proxy, WhatsApp/FCM senders, Stripe webhooks)
/docs                 → Architecture notes per phase
```

## Status

**Phase 1 — Auth + Database + Roles ✅**
- Full multi-tenant schema (28 tables incl. `fcm_tokens`) — `supabase/migrations/0001`–`0011`
- `business_id` on every tenant-owned row; `businesses` is the tenant root
- Roles: `super_admin`, `business_admin`, `manager`, `technician`, `customer`
- Row Level Security on every table — tenant isolation + role scoping (`0008`, `0009`)
- Auto-generated booking codes (`SF-2026-000001`), append-only `booking_status_history`
- `auth.users` → `public.users` sync trigger, `updated_at` auto-triggers

**Phase 2 — Customer booking flow (Flutter) ✅**
- `apps/customer-app`: splash, onboarding, auth, dashboard, 6-step booking wizard
  (service → problem/photos → urgency → schedule → address → confirm), live tracking
  screen (Google Maps + real-time technician position via Supabase Realtime), chat, profile

**Phase 3 — Technician workflow (Flutter) ✅**
- `apps/technician-app`: login, dashboard (today/pending/active/completed + availability
  toggle + earnings), job detail screen with full status stepper (assigned → accepted →
  on the way → arrived → inspection → working → completed → invoiced → paid), before/after
  photo capture, parts entry with auto-totals, digital signature, invoice generation

**Phase 4 — Admin dashboard (Next.js) ✅ complete**
- `apps/web`: sidebar + mobile nav, dashboard (live stat cards + revenue chart, loading/
  error states), bookings, customers (CRM + timeline), technicians (CRUD + activate/
  deactivate), services (CRUD), calendar (day/week/month, drag-drop reschedule), invoices
  (preview panel), payments, reviews (filter + respond), analytics (donut chart + AI
  insights), automations (visual node builder → n8n), notifications, chat, settings
  (business profile, subscription, dark/light mode), login page, auth middleware
- Super admin panel: separate layout/nav, businesses (suspend/reactivate, plan view),
  support tickets (status management)

**Phase 5 — Maps + live tracking ✅ complete (free, no API key)**
- Admin live operations map (`apps/web/components/LiveMap.tsx`) uses Leaflet +
  OpenStreetMap tiles — real, working, zero-cost map with no Google Maps or
  Mapbox key required, wired to a live Supabase Realtime subscription on
  `technician_locations`
- Flutter apps use `google_maps_flutter`, which does need a Google Maps API
  key in production (mobile SDK requirement — see `docs/CREDENTIALS_GUIDE.md`);
  the customer app's tracking screen smoothly tweens the technician marker
  between GPS pings instead of snapping

**Phase 6 — Invoices + payments ✅ (PDF) / 🔶 (checkout UI)**
- Full `invoices`/`invoice_items`/`payments` schema, technician-side invoice
  generation, `stripe-webhook` edge function syncing `payment_intent.succeeded/
  failed` → `payments`/`invoices`
- Invoice PDF download is real and complete — generated entirely client-side
  with jsPDF (`apps/web/lib/generateInvoicePdf.ts`), no external API or key
- Not yet built: Stripe/PayPal checkout UI (needs real Stripe keys to test)

**Phase 7 — Chat + notifications ✅ (architecture) / 🔶 (FCM/WhatsApp wiring)**
- Realtime chat wired end-to-end in the customer app (`chat_rooms`/`chat_messages`)
- `whatsapp-sender` and `fcm-sender` edge functions built (Meta Graph API + FCM HTTP v1
  with service-account JWT signing) — need real credentials + approved WhatsApp templates

**Phase 8 — AI ✅**
- `ai-proxy` edge function calls Claude server-side for service analysis + the business
  assistant; `analyzeServiceRequestMock` in `packages/api` lets the UI work before the
  edge function is deployed; every AI response carries the required accuracy disclaimer

**Phase 9 — n8n automation ✅ (architecture)**
- `automations`/`automation_nodes`/`automation_logs` schema, `automation-trigger` edge
  function (fed by Postgres Database Webhooks) dispatches to n8n by `business_id` +
  trigger type; example workflow JSON in `docs/n8n-example-workflow.json`

**Phase 10 — 3D website + carousel ✅**
- `AiOrbHero.tsx`: R3F icosahedron orb with distort material, sparkles, mouse parallax,
  floating glassmorphism cards for each core feature
- `ProductCarousel.tsx`: 10-slide 3D perspective carousel — autoplay, drag/swipe, keyboard nav
- Scroll-reveal animations + scroll progress bar on the marketing page

**Phase 11 — Testing, security, performance ✅ (what's possible without a live deployment)**
- Security: RLS default-deny everywhere, all secrets server-side only, service-role key
  never shipped to client/mobile, auth middleware gating admin/super-admin routes
- Automated tests: Vitest + Testing Library for the web app (`apps/web/tests`) covering
  the demo mock client's filters/embeds/insert/update/realtime and the animated counter;
  Flutter widget/unit tests for both apps (`apps/*/test`) covering the marker-tween math,
  onboarding flow, and theme setup
- CI: `.github/workflows/ci.yml` runs lint + tests + a Demo Mode build for the web app,
  `flutter analyze`/`flutter test` for both Flutter apps, and applies every SQL migration
  against a throwaway Postgres instance to catch schema errors — all on every push/PR
- Still needs a real deployment to test: load testing, image/asset optimization tuned to
  real traffic, and a security review of the live, credentialed system

🔶 = architecture and core logic in place; needs real provider credentials (Stripe,
WhatsApp, Firebase) that only you can create — see `docs/CREDENTIALS_GUIDE.md`. Everything
marked ✅ is real, runnable code — either against Demo Mode (zero credentials) or, once
you add real Supabase credentials, against the live schema.

See `docs/DEPLOYMENT.md` for the full setup guide (Supabase project, storage buckets,
edge function secrets, database webhooks, Stripe/n8n wiring, running both Flutter apps,
promoting your first super_admin).

## Demo Mode — run the admin app with zero credentials

```bash
cd apps/web
npm install
echo "NEXT_PUBLIC_DEMO_MODE=true" > .env.local
npm run dev
```

Open `http://localhost:3000/dashboard` — you're straight in, no login required
(the login page also accepts literally anything). Everything is real app code
running against seeded in-memory data (`packages/api/src/demoData.ts`) through
a mock Supabase client (`packages/api/src/mockClient.ts`) that implements the
same `.from().select().eq().order()...`, `.insert()`, `.update()`, `.channel()`
realtime, and `.auth` surface the real pages call — so every page, filter,
and realtime subscription behaves like the real thing, including:

- Bookings quietly auto-advance status every few seconds (dashboard + bookings
  page update live, with the same flash/slide-in animations as the real build)
- Chat, reviews, notifications, and any other insert/update you make in the UI
  reflects immediately, including across open tabs' realtime subscriptions
  within the same browser session
- The AI Assistant page answers a fixed set of demo questions instantly,
  no network call

Nothing in demo mode touches a real database, and no data persists across a
page reload — it's for demoing the UI and flows, not for real bookings.
Flip `NEXT_PUBLIC_DEMO_MODE` to `false` (or remove it) and fill in real
Supabase credentials to go live — see `docs/CREDENTIALS_GUIDE.md` for where
to get each key, and `docs/DEPLOYMENT.md` for full deployment steps. Demo
Mode only covers the Next.js admin app — the Flutter customer/technician apps
always need a real Supabase project since they use the native
`supabase_flutter` SDK directly.

## Running the database locally

```bash
supabase init
supabase start
supabase db reset   # applies all migrations in supabase/migrations in order
```

## Security notes

- AI provider keys, payment secrets, and WhatsApp/FCM credentials are **never**
  referenced from client code — they live only in `supabase/functions/*` as
  edge function secrets, called via authenticated RPC.
- All RLS policies default-deny: a table with RLS enabled and no matching
  policy returns zero rows rather than erroring, so gaps fail closed.
