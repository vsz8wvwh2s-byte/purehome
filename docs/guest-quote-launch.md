# Guest quote launch checklist

The guest quote endpoint is **not live** merely because its code is committed. Keep `VITE_ENABLE_GUEST_QUOTES` unset or `false` until all checks pass.

## Configuration

1. Create a Cloudflare Turnstile widget for the exact public PureHome hostname. Obtain the **site key** (public) and **secret key** (server only). Do not commit the secret.
2. Configure the Supabase Edge Function secrets: `TURNSTILE_SECRET_KEY` and `PUREHOME_ALLOWED_ORIGINS` (comma-separated, exact origins including scheme, e.g. `https://your-domain.example`). Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function environment; confirm they are available. **Never** place the service role key in a Vite variable or frontend file.
3. Deploy `submit-guest-quote` with the project config: `[functions.submit-guest-quote] verify_jwt = false`. This is intentional because customers book as guests; Turnstile, server-side validation and strict origin checking are mandatory. Confirm deployment configuration before exposing the endpoint.
4. Configure the frontend deployment with `VITE_TURNSTILE_SITE_KEY` and, **only after testing**, `VITE_ENABLE_GUEST_QUOTES=true`. Rebuild/redeploy the frontend after changing Vite variables.

## Verification before enabling

- Check OPTIONS preflight for an allowed origin and rejection of unapproved origins.
- Submit a real Turnstile challenge from the approved domain; confirm exactly one new `quote_requests` row with the selected service and `pending` status.
- Verify the owner dashboard can read the request and an unauthenticated visitor cannot read customer details.
- Reject a missing, expired, reused, or wrong-host Turnstile token; malformed JSON; invalid service/date; and oversized payloads.
- Confirm a successful request displays the confirmation screen, without charging a card or reserving a date.
- Confirm the UI does not claim photo upload: selected photos currently block submission.
- Check the Edge Function and browser logs for errors, but never log customer PII, tokens, or secret keys.

## Known limitations

- No private photo storage or upload yet.
- No persisted/sent owner quote approval workflow yet.
- No guest payment/Stripe checkout integration yet.
- No automatic email or SMS notifications yet.
- Network interruption may leave delivery uncertain; customers should contact PureHome before retrying.

Do not enable live submissions until an authorized owner verifies all launch checks.

## Updated payment policy: 30% before / 70% after

- Owner sets the total quote; deposit is 30% rounded to the nearest cent, and the final balance is total minus deposit.
- Customer must explicitly accept the quote and pay the 30% deposit through a verified Stripe checkout before the owner confirms the appointment and availability.
- After the owner marks the cleaning completed, collect the remaining 70% using a separate, secure Stripe payment request. Do not automatically charge a saved card without separately authorized consent and compliant setup.
- Both payment stages require server-side authorization, idempotency, Stripe webhook signature verification, and persisted payment states; the client-side calculator is display-only and is never the source of truth for amounts.
- Handle failed payments, cancellations, refunds, and disputes before launch. Never treat a redirect or a client-provided status as proof of payment.
- **Not implemented yet:** customer acceptance, either Stripe guest checkout, payment tracking, or completion-triggered balance request. Keep guest payment features disabled until end-to-end testing with Stripe sandbox credentials.

## Proposed payment persistence (not deployed)

The draft at `docs/sql/quote-payments-proposed.sql` defines private payment plans, exact cent-denominated deposit/balance amounts, unique Stripe Checkout session identifiers, and webhook-event deduplication. **This SQL has not been applied.** The live Supabase table inspection timed out, so confirm the quote ID type, owner authorization, foreign keys, and RLS before deploying the schema. No payment webhook is running, and no checkout should be enabled yet.

## Stripe webhook preflight (source only, not deployed)

The optional `supabase/functions/stripe-webhook-preflight/index.ts` is a **disabled, read-only, test-only** preflight for raw Stripe signature checks. It requires `PUREHOME_ENABLE_STRIPE_WEBHOOK_PREFLIGHT=true` and `STRIPE_WEBHOOK_SECRET_TEST`, and only recognizes `cs_test_` Checkout sessions. It returns HTTP 503 even for valid events because no payment event has been persisted; never register this preflight as a production Stripe webhook endpoint or enable it in live mode. Before implementing a real handler, deploy the private payment schema, ensure idempotent event processing and state changes happen in one database transaction, and test Stripe retry behavior. Keep secrets in server-side Supabase secrets, never in `VITE_` environment variables.
