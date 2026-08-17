# Getting Real Credentials

Every credential below has to come from your own account on that service —
no one, including an AI assistant, can generate a real API key on your
behalf. This is a security requirement of every provider listed here. This
guide walks through exactly where to get each one, in the order you'll
actually need them.

You don't need all of these at once. Start with Supabase — everything else
is optional until you're ready for that specific feature (payments,
WhatsApp, etc.), and the app runs in **Demo Mode** (see README.md) with
none of them at all.

---

## 1. Supabase (required first — the database + auth)

1. Go to **supabase.com** → Sign up (free tier is enough to start)
2. Click **New Project** → pick a name, a database password (save it
   somewhere), and a region close to your users
3. Once it's created, go to **Project Settings → API**
4. Copy two values into `apps/web/.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (same page, click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`
     — **never** put this one in any client-facing code, only server/edge functions
5. Set `NEXT_PUBLIC_DEMO_MODE=false`
6. From your terminal: `supabase login`, then `supabase link --project-ref <ref>`
   (the ref is in your project URL, e.g. `abcdefgh` from `abcdefgh.supabase.co`)
7. Run `supabase db push` to apply every migration in `supabase/migrations/`

Cost: free tier covers development and small production use.

## 2. Anthropic API key (for the AI service analysis + business assistant)

1. Go to **console.anthropic.com** → sign up
2. Go to **API Keys** → **Create Key**
3. Copy it, then set it as a Supabase edge function secret (not a `.env` file
   — this key must never reach the browser or mobile app):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

Cost: pay-as-you-go, billed per token; a few dollars of credit covers a lot
of testing.

## 3. Google Maps or Mapbox (for live technician tracking)

Pick one — the map integration point in `apps/web/app/(admin)/map/page.tsx`
and the Flutter apps are written to be provider-agnostic.

**Google Maps:**
1. Go to **console.cloud.google.com** → create a project (or use an existing one)
2. **APIs & Services → Library** → enable "Maps SDK for Android", "Maps SDK
   for iOS", and "Maps JavaScript API"
3. **APIs & Services → Credentials** → **Create Credentials → API Key**
4. Restrict the key to those three APIs (recommended) and set it as
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Mapbox (alternative, simpler pricing):**
1. Go to **mapbox.com** → sign up
2. Your default public token is on the account homepage — copy it into
   `NEXT_PUBLIC_MAPBOX_TOKEN`

Cost: both have generous free tiers (thousands of map loads/month free).

## 4. Stripe (for payments)

1. Go to **stripe.com** → sign up (you can build against test mode without
   any business verification)
2. Dashboard → **Developers → API keys** → copy the **Secret key** (starts
   `sk_test_...` in test mode) → set as a Supabase secret:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   ```
3. Deploy the webhook function first: `supabase functions deploy stripe-webhook`
4. Dashboard → **Developers → Webhooks → Add endpoint** → URL:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook` → select
   events `payment_intent.succeeded` and `payment_intent.payment_failed`
5. Copy the **Signing secret** shown after creating the endpoint → set as:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

Test mode uses fake card numbers (e.g. `4242 4242 4242 4242`) — no real
money moves until you switch to live keys, which requires Stripe to verify
your business.

## 5. WhatsApp Business API (for automated notifications)

This one has the most setup — budget an hour, and expect a review step.

1. Go to **developers.facebook.com** → create a Meta developer account
2. Create an app → type "Business" → add the **WhatsApp** product
3. In the WhatsApp product setup, you'll get a temporary access token and a
   test phone number immediately — good enough for development
4. Copy the **Phone number ID** and a generated token:
   ```bash
   supabase secrets set WHATSAPP_API_TOKEN=...
   supabase secrets set WHATSAPP_PHONE_NUMBER_ID=...
   ```
5. For production you'll need to verify a real business and submit message
   **templates** for approval (booking_confirmation, technician_assigned,
   etc. — the exact set used in `supabase/functions/whatsapp-sender/index.ts`)
   under **WhatsApp Manager → Message Templates**

Cost: free for a limited number of conversations/month, then per-conversation
pricing.

## 6. Firebase (for push notifications)

1. Go to **console.firebase.google.com** → **Add project**
2. **Project settings → Service accounts → Generate new private key** —
   downloads a JSON file
3. Set its full contents as a secret:
   ```bash
   supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<paste the whole JSON file>'
   ```
4. For the Flutter apps: install the FlutterFire CLI and run
   `flutterfire configure` inside `apps/customer-app` and
   `apps/technician-app` — this generates the platform config files and
   registers each app with your Firebase project

Cost: free tier is generous for push notifications specifically.

## 7. n8n (for the automation builder)

Two options:
- **n8n Cloud** (n8n.io) — hosted, paid, zero server setup
- **Self-hosted** — free, run via Docker: `docker run -it --rm -p 5678:5678 n8nio/n8n`

Either way, once it's running:
1. Import `docs/n8n-example-workflow.json` as a starting workflow
2. Copy your n8n instance's webhook base URL → set as:
   ```bash
   supabase secrets set N8N_WEBHOOK_BASE=https://your-n8n-url/webhook
   ```

## After you have credentials

Deploy the edge functions so they pick up the secrets you just set:
```bash
supabase functions deploy ai-proxy whatsapp-sender fcm-sender stripe-webhook automation-trigger
```

Then see `docs/DEPLOYMENT.md` for database webhooks, storage buckets, and
running the web + Flutter apps against your real project.
