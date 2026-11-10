-- PROPOSED SCHEMA ONLY: not applied to production.
-- Review existing quote_requests key type, owner authorization, and webhook implementation
-- before deploying. Keep payment records private and inaccessible to browser clients.
create schema if not exists purehome_private;

create table if not exists purehome_private.quote_payment_plans (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null unique,
  quote_total_cents bigint not null check (quote_total_cents between 100 and 10000000),
  currency text not null default 'usd' check (currency = 'usd'),
  deposit_cents bigint generated always as ((quote_total_cents * 30 + 50) / 100) stored,
  balance_cents bigint generated always as (quote_total_cents - ((quote_total_cents * 30 + 50) / 100)) stored,
  state text not null default 'awaiting_deposit' check (state in (
    'awaiting_deposit','deposit_paid','cleaning_completed','awaiting_balance','paid_in_full','cancelled'
  )),
  deposit_checkout_session_id text unique,
  balance_checkout_session_id text unique,
  deposit_paid_at timestamptz,
  balance_paid_at timestamptz,
  cleaning_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deposit_checkout_session_id is distinct from balance_checkout_session_id)
);

create table if not exists purehome_private.stripe_webhook_events (
  stripe_event_id text primary key,
  stripe_event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

-- Defense in depth: no browser role can read or mutate private payment tables.
alter table purehome_private.quote_payment_plans enable row level security;
alter table purehome_private.stripe_webhook_events enable row level security;
revoke all on schema purehome_private from public, anon, authenticated;
revoke all on all tables in schema purehome_private from public, anon, authenticated;
-- No anon/authenticated policies. Access should be through a trusted server-side
-- webhook/owner function after authorization and Stripe signature verification.
-- Stripe events must be deduplicated in the same database transaction as the
-- payment-state update, with a row lock and conditional state transition.
-- Before applying: verify quote_request_id references the correct existing
-- primary key and add a matching foreign key.
