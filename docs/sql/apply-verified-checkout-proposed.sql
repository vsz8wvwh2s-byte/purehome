-- PROPOSED ONLY. Do not run before validating the existing private payment
-- schema and service-role access in a disposable Supabase test project.
-- This function must only be invoked by a trusted server AFTER Stripe's
-- raw-body signature is verified and event/session fields are validated.
-- Its transaction locks the plan, validates the amount, and deduplicates
-- Stripe events atomically. It NEVER creates a Stripe charge.
create or replace function purehome_private.apply_verified_checkout_event(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_amount_cents bigint,
  p_currency text
)
returns table (payment_plan_id uuid, payment_state text, duplicate_event boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan purehome_private.quote_payment_plans%rowtype;
  v_stage text;
  v_expected bigint;
  v_next text;
begin
  if p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_event_type not in ('checkout.session.completed','checkout.session.async_payment_succeeded')
    or p_session_id !~ '^cs_test_[A-Za-z0-9]+$'
    or p_currency is distinct from 'usd'
    or p_amount_cents is null then
    raise exception 'Invalid verified Stripe event input';
  end if;

  -- Serialize duplicate deliveries for this event ID, including retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_event_id, 0));
  if exists(select 1 from purehome_private.stripe_webhook_events where stripe_event_id=p_event_id and processed_at is not null) then
    select q.id,q.state into v_plan.id,v_plan.state
    from purehome_private.quote_payment_plans q
    where q.deposit_checkout_session_id=p_session_id or q.balance_checkout_session_id=p_session_id;
    if not found then raise exception 'Previously processed event has no matching payment plan'; end if;
    return query select v_plan.id,v_plan.state,true;
    return;
  end if;

  select * into v_plan
  from purehome_private.quote_payment_plans q
  where q.deposit_checkout_session_id=p_session_id or q.balance_checkout_session_id=p_session_id
  for update;
  if not found then raise exception 'Unknown checkout session'; end if;
  if v_plan.currency is distinct from p_currency then raise exception 'Currency mismatch'; end if;

  if v_plan.deposit_checkout_session_id=p_session_id then
    v_stage:='deposit';v_expected:=v_plan.deposit_cents;v_next:='deposit_paid';
    if v_plan.state not in ('awaiting_deposit','deposit_paid') then
      raise exception 'Deposit is not due for this payment plan';
    end if;
  elsif v_plan.balance_checkout_session_id=p_session_id then
    v_stage:='balance';v_expected:=v_plan.balance_cents;v_next:='paid_in_full';
    if v_plan.state not in ('awaiting_balance','paid_in_full') then
      raise exception 'Balance is not due for this payment plan';
    end if;
  else
    raise exception 'Checkout session does not match payment plan';
  end if;
  if p_amount_cents<>v_expected then raise exception 'Payment amount mismatch'; end if;

  insert into purehome_private.stripe_webhook_events(stripe_event_id,stripe_event_type,processed_at)
  values(p_event_id,p_event_type,pg_catalog.now());
  if v_plan.state<>v_next then
    update purehome_private.quote_payment_plans
    set state=v_next,
        deposit_paid_at=case when v_stage='deposit' then pg_catalog.now() else deposit_paid_at end,
        balance_paid_at=case when v_stage='balance' then pg_catalog.now() else balance_paid_at end,
        updated_at=pg_catalog.now()
    where id=v_plan.id;
  end if;
  return query select v_plan.id,v_next,false;
end;
$$;

revoke all on function purehome_private.apply_verified_checkout_event(text,text,text,bigint,text)
  from public,anon,authenticated;
grant execute on function purehome_private.apply_verified_checkout_event(text,text,text,bigint,text)
  to service_role;
-- IMPORTANT: restrict the function owner and schema grants in the target
-- environment; never expose this RPC to browser clients.
