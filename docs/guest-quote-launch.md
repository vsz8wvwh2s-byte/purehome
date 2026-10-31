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
