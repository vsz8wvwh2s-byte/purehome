-- Disposable test database only. Run AFTER both proposed schema files.
-- This transaction rolls back every fixture and payment event it creates.
-- Requires a trusted administrative SQL session. Never run with live Stripe IDs.
begin;
do $$
declare
 v_id uuid:=gen_random_uuid();
 v_result record;
 v_deposit bigint;
 v_balance bigint;
begin
 insert into purehome_private.quote_payment_plans
   (id,quote_request_id,quote_total_cents,deposit_checkout_session_id,balance_checkout_session_id)
 values(v_id,gen_random_uuid(),20001,'cs_test_purehomeDepositFixture','cs_test_purehomeBalanceFixture');
 select deposit_cents,balance_cents into v_deposit,v_balance
 from purehome_private.quote_payment_plans where id=v_id;
 if v_deposit<>6000 or v_balance<>14001 then
   raise exception '30/70 rounding failed';
 end if;

 select * into v_result from purehome_private.apply_verified_checkout_event(
  'evt_purehomeDepositFixture','checkout.session.completed',
  'cs_test_purehomeDepositFixture',6000,'usd');
 if v_result.payment_state<>'deposit_paid' or v_result.duplicate_event then
   raise exception 'Deposit state transition failed';
 end if;
 select * into v_result from purehome_private.apply_verified_checkout_event(
  'evt_purehomeDepositFixture','checkout.session.completed',
  'cs_test_purehomeDepositFixture',6000,'usd');
 if not v_result.duplicate_event then raise exception 'Idempotency failed'; end if;

 begin
  perform * from purehome_private.apply_verified_checkout_event(
   'evt_purehomeDepositFixture','checkout.session.completed',
   'cs_test_purehomeDepositFixture',6001,'usd');
  raise exception 'Conflicting event replay was accepted';
 exception when others then
  if sqlerrm='Conflicting event replay was accepted' then raise; end if;
 end;

 begin
  perform * from purehome_private.apply_verified_checkout_event(
   'evt_purehomeBalanceFixture','checkout.session.completed',
   'cs_test_purehomeBalanceFixture',14001,'usd');
  raise exception 'Premature balance was accepted';
 exception when others then
  if sqlerrm='Premature balance was accepted' then raise; end if;
 end;

 update purehome_private.quote_payment_plans set state='awaiting_balance' where id=v_id;
 select * into v_result from purehome_private.apply_verified_checkout_event(
  'evt_purehomeBalanceFixture','checkout.session.completed',
  'cs_test_purehomeBalanceFixture',14001,'usd');
 if v_result.payment_state<>'paid_in_full' then raise exception 'Balance transition failed'; end if;
end $$;
rollback;
