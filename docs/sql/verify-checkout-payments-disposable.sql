-- Disposable test database only. Run AFTER the proposed payment schema and three function files.
-- This transaction rolls back every fixture and payment event it creates.
-- Requires a trusted administrative SQL session and all FOUR proposed SQL files.
-- Never run with live Stripe IDs.
begin;
do $$
declare
 v_id uuid:=gen_random_uuid();
 v_result record;
 v_deposit bigint;
 v_balance bigint;
 v_unpaid_id uuid:=gen_random_uuid();
begin
 insert into purehome_private.quote_payment_plans
   (id,quote_request_id,quote_total_cents,deposit_checkout_session_id)
 values(v_id,gen_random_uuid(),20001,'cs_test_purehomeDepositFixture');
 select deposit_cents,balance_cents into v_deposit,v_balance
 from purehome_private.quote_payment_plans where id=v_id;
 -- A second, unpaid plan must never be marked complete.
 insert into purehome_private.quote_payment_plans
   (id,quote_request_id,quote_total_cents)
 values(v_unpaid_id,gen_random_uuid(),10000);
 begin
  perform * from purehome_private.mark_cleaning_completed(v_unpaid_id);
  raise exception 'Unpaid cleaning completion was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'Cannot complete cleaning before verified deposit payment' then raise; end if;
 end;
 begin
  perform * from purehome_private.mark_balance_requested(v_unpaid_id,'cs_test_purehomeUnpaidBalanceFixture');
  raise exception 'Unpaid balance request was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'Balance cannot be requested before cleaning is completed' then raise; end if;
 end;
 if v_deposit<>6000 or v_balance<>14001 then
   raise exception '30/70 rounding failed';
 end if;

 begin
  perform * from purehome_private.apply_verified_checkout_event(
   'evt_purehomeWrongAmountFixture','checkout.session.completed',
   'cs_test_purehomeDepositFixture',5999,'usd');
  raise exception 'Incorrect deposit amount was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'Payment amount mismatch' then raise; end if;
 end;
 begin
  perform * from purehome_private.apply_verified_checkout_event(
   'evt_purehomeWrongCurrencyFixture','checkout.session.completed',
   'cs_test_purehomeDepositFixture',6000,'eur');
  raise exception 'Incorrect currency was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'Invalid verified Stripe event input' then raise; end if;
 end;

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
  if sqlstate <> 'P0001' or sqlerrm <> 'Event ID collision or unfinished event processing' then raise; end if;
 end;

 -- A valid session reference is deliberately not stored yet: no balance
 -- request can be paid until the owner records cleaning completion.
 begin
  perform * from purehome_private.apply_verified_checkout_event(
   'evt_purehomeBalanceFixture','checkout.session.completed',
   'cs_test_purehomeBalanceFixture',14001,'usd');
  raise exception 'Premature balance was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'Unknown checkout session' then raise; end if;
 end;

 -- Exercise the proposed owner completion function after verified deposit.
 perform * from purehome_private.mark_cleaning_completed(v_id);
 perform * from purehome_private.mark_balance_requested(v_id,'cs_test_purehomeBalanceFixture');
 -- Repeated requests for the same Checkout session must be safe.
 perform * from purehome_private.mark_balance_requested(v_id,'cs_test_purehomeBalanceFixture');
 begin
  perform * from purehome_private.mark_balance_requested(v_id,'cs_test_purehomeOtherBalanceFixture');
  raise exception 'Different balance checkout was accepted';
 exception when others then
  if sqlstate <> 'P0001' or sqlerrm <> 'A different balance checkout already exists' then raise; end if;
 end;
 select * into v_result from purehome_private.apply_verified_checkout_event(
  'evt_purehomeBalanceFixture','checkout.session.completed',
  'cs_test_purehomeBalanceFixture',14001,'usd');
 if v_result.payment_state<>'paid_in_full' then raise exception 'Balance transition failed'; end if;
end $$;
rollback;
