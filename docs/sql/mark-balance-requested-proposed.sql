-- PROPOSED ONLY: transition completed cleaning into balance-due state.
-- Call from a trusted, owner-authorized backend only AFTER recording the
-- corresponding Stripe test-mode balance Checkout session on this plan.
-- This function neither creates Stripe sessions nor charges a customer.
create or replace function purehome_private.mark_balance_requested(
 p_payment_plan_id uuid,
 p_checkout_session_id text
)
returns table(payment_plan_id uuid,payment_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_plan purehome_private.quote_payment_plans%rowtype;
begin
 if p_payment_plan_id is null or p_checkout_session_id !~ '^cs_test_[A-Za-z0-9]+$' then
   raise exception 'Invalid balance request';
 end if;
 select * into v_plan from purehome_private.quote_payment_plans q
 where q.id=p_payment_plan_id for update;
 if not found then raise exception 'Payment plan not found'; end if;

 if v_plan.state='awaiting_balance' then
   if v_plan.balance_checkout_session_id is distinct from p_checkout_session_id then
     raise exception 'A different balance checkout already exists';
   end if;
   return query select v_plan.id,v_plan.state;
   return;
 end if;

 if v_plan.state<>'cleaning_completed'
   or v_plan.cleaning_completed_at is null
   or v_plan.deposit_paid_at is null
   or v_plan.balance_paid_at is not null
   or v_plan.balance_checkout_session_id is not null then
   raise exception 'Balance cannot be requested before cleaning is completed';
 end if;

 update purehome_private.quote_payment_plans
 set state='awaiting_balance',
     balance_checkout_session_id=p_checkout_session_id,
     updated_at=pg_catalog.now()
 where id=v_plan.id;
 return query select v_plan.id,'awaiting_balance'::text;
end;
$$;

revoke all on function purehome_private.mark_balance_requested(uuid,text)
 from public,anon,authenticated;
grant execute on function purehome_private.mark_balance_requested(uuid,text)
 to service_role;
-- Important: use an idempotency key when creating the Stripe Checkout
-- session. If the DB call fails, reconcile the session before retrying;
-- never create a second Checkout session without checking Stripe first.
