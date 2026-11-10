-- PROPOSED ONLY: private owner workflow for marking cleaning complete.
-- Deploy only after confirming the owner identity and quote schema in a test DB.
-- This function is for a trusted backend that has already authenticated the
-- owner; never expose it to guest clients or invoke it from the browser.
create or replace function purehome_private.mark_cleaning_completed(
 p_payment_plan_id uuid
)
returns table(payment_plan_id uuid,payment_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_plan purehome_private.quote_payment_plans%rowtype;
begin
 if p_payment_plan_id is null then raise exception 'Payment plan required'; end if;
 select * into v_plan
 from purehome_private.quote_payment_plans q
 where q.id=p_payment_plan_id for update;
 if not found then raise exception 'Payment plan not found'; end if;
 if v_plan.state='cleaning_completed' then
   return query select v_plan.id,v_plan.state;
   return;
 end if;
 if v_plan.state<>'deposit_paid' or v_plan.deposit_paid_at is null then
   raise exception 'Cannot complete cleaning before verified deposit payment';
 end if;
 update purehome_private.quote_payment_plans
 set state='cleaning_completed',cleaning_completed_at=pg_catalog.now(),
     updated_at=pg_catalog.now()
 where id=v_plan.id;
 return query select v_plan.id,'cleaning_completed'::text;
end;
$$;

revoke all on function purehome_private.mark_cleaning_completed(uuid)
 from public,anon,authenticated;
grant execute on function purehome_private.mark_cleaning_completed(uuid)
 to service_role;

-- Balance checkout creation is a separate authorized action. This function
-- must not generate a payment link or mark a balance as paid.
