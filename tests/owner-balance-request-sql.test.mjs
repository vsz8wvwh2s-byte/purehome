import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../docs/sql/mark-balance-requested-proposed.sql',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../docs/sql/verify-checkout-payments-disposable.sql',import.meta.url),'utf8');
test('balance request is restricted to completed, deposit-paid jobs',()=>{
 assert.match(sql,/where q\.id=p_payment_plan_id for update/);
 assert.match(sql,/v_plan\.state<>'cleaning_completed'/);
 assert.match(sql,/v_plan\.cleaning_completed_at is null/);
 assert.match(sql,/v_plan\.deposit_paid_at is null/);
 assert.match(sql,/v_plan\.balance_checkout_session_id is not null/);
 assert.match(sql,/p_checkout_session_id !~ '\^cs_test_/);
});
test('repeated request only permits the same checkout session',()=>{
 assert.match(sql,/v_plan\.balance_checkout_session_id is distinct from p_checkout_session_id/);
 assert.match(sql,/state='awaiting_balance'/);
 assert.match(sql,/revoke all on function purehome_private\.mark_balance_requested/);
 assert.match(sql,/to service_role/);
 assert.equal(smoke.match(/mark_balance_requested\(v_id,'cs_test_purehomeBalanceFixture'\)/g)?.length,2);
});
