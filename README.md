# PureHome

PureHome is a cleaning-services booking application.

## Current backend

The live Supabase backend includes authentication-ready profiles, customer addresses, services, bookings, cleaner assignments, payments, notifications, audit logs, Row Level Security, protected booking/payment RPCs, and Edge Functions.

### Active Edge Functions
- `create-booking`
- `cancel-booking`
- `assign-cleaner`
- `accept-assignment`
- `complete-job`

## Payment safety

The connected Stripe account is live-mode. Do not run test transactions against live Stripe. Payment creation and webhook deployment should only be enabled after a Stripe test/sandbox credential path and webhook secret are configured in Supabase.

## Next milestone

Build the customer-facing PureHome frontend, connect authentication and booking screens to Supabase, then add safe Stripe test-mode checkout and end-to-end testing.
