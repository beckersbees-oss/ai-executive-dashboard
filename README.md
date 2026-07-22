# AI Executive — Executive Intelligence Dashboard

A production-oriented React + Supabase MVP for the Executive Intelligence Platform.

## Included

- Passwordless Supabase authentication
- Personalized diagnostic result cards
- Executive Capacity, DNA, stage, and primary constraint
- Secure executive priorities with create and complete actions
- Personalized recommendations
- Behavioral event tracking
- Responsive charcoal and brushed-gold design
- Row Level Security compatible data access

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Run:

```bash
npm install
npm run dev
```

## Supabase configuration

In Supabase:

1. Authentication → URL Configuration
2. Set Site URL to the deployed dashboard URL.
3. Add localhost during development:
   `http://localhost:5173`
4. Enable Email authentication and Magic Links.
5. Create users through checkout/onboarding or let invited users log in by email.

## Important current behavior

The dashboard uses demo diagnostic values when an authenticated user does not yet have a linked `diagnostic_submissions` record. Once the diagnostic saves `user_id`, the real values appear automatically.

## Recommended next integrations

- Checkout webhook to create/invite the user and activate `platform_access`
- Public diagnostic Edge Function to safely accept lead submissions
- GoHighLevel sync worker for `crm_sync_queue`
- AI recommendation generator
- Stripe subscription lifecycle webhook
- Admin intelligence dashboard
