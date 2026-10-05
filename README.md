# PureHome

PureHome is a cleaning-services booking application.

## Current build

The customer-facing React + TypeScript interface is connected to the live Supabase project for authentication, services, saved addresses, and protected booking creation.

### Active Edge Functions
- `create-booking`
- `cancel-booking`
- `assign-cleaner`
- `accept-assignment`
- `complete-job`

## Deployment

PureHome is configured for GitHub Pages through GitHub Actions. Pushes to `main` automatically build and deploy the web app.

## Payment safety

The connected Stripe account is live-mode. Do not run test transactions against live Stripe. Payment creation and webhook deployment should only be enabled after a Stripe test/sandbox credential path and webhook secret are configured in Supabase.

## Current milestone

Deploy the first browser-testable PureHome build, validate authentication and booking end to end, then add safe Stripe test-mode checkout.
