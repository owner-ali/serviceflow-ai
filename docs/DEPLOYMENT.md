# Deployment Guide

## 1. Supabase project

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies all migrations in order
psql <connection-string> -f supabase/seed/seed.sql   # optional demo data
```

## 2. Storage buckets

Buckets are declared in `supabase/config.toml` and created automatically by
`supabase db push` in a linked project (or create them manually in the Studio
UI): `profile-images`, `service-images` (public), `booking-attachments`,
`before-after-media`, `invoices`, `signatures` (private — access via signed URLs).

## 3. Edge function secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set WHATSAPP_API_TOKEN=...
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=...
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='{...}'
supabase secrets set N8N_WEBHOOK_BASE=https://n8n.yourdomain.com/webhook

supabase functions deploy ai-proxy whatsapp-sender fcm-sender stripe-webhook automation-trigger
```

## 4. Database Webhooks (triggers automation-trigger)

In the Supabase dashboard → Database → Webhooks, create three webhooks pointing
at the deployed `automation-trigger` function URL:

| Table    | Events         | Condition                     |
|----------|----------------|--------------------------------|
| bookings | INSERT, UPDATE | —                              |
| invoices | INSERT         | —                              |
| payments | UPDATE         | `status` changes to `paid`     |

The function itself figures out the specific `trigger_type` from the payload
(see `resolveTriggerType` in `supabase/functions/automation-trigger/index.ts`).

## 5. Stripe webhook

Point a Stripe webhook endpoint at:
`https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
Subscribe to `payment_intent.succeeded` and `payment_intent.payment_failed`.

## 6. n8n

Import `docs/n8n-example-workflow.json` as a starting workflow. Each
`automations` row created in the admin app's automation builder should have a
matching n8n workflow whose webhook path is the automation's `id` — the
`automation-trigger` function POSTs to `${N8N_WEBHOOK_BASE}/${automation.id}`.

## 7. Web app (Next.js)

```bash
cd apps/web
npm install
cp ../../.env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / etc.
npm run dev
```

Deploy to Vercel (recommended) — set the same env vars in the Vercel project
settings, and add `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` (your project's
`https://<project-ref>.supabase.co/functions/v1`).

## 8. Flutter apps

```bash
cd apps/customer-app   # or apps/technician-app
flutter pub get
flutter run --dart-define=SUPABASE_URL=https://<project-ref>.supabase.co \
            --dart-define=SUPABASE_ANON_KEY=<anon-key>
```

For release builds, also wire Firebase (`flutterfire configure`) for FCM push,
and add your Google Maps API key to the platform-specific config
(`android/app/src/main/AndroidManifest.xml`, `ios/Runner/AppDelegate.swift`).

## 9. First super_admin user

New signups default to `role: customer`. Promote your own account manually
after signing up once:

```sql
update users set role = 'super_admin', business_id = null where email = 'you@yourcompany.com';
```
