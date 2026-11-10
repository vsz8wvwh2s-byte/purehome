import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../docs/sql/mark-cleaning-completed-proposed.sql',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../docs/sql/verify-checkout-payments-disposable.sql',import.meta.url),'utf8');
test('owner completion requires deposit payment and locks the plan',()=>{
 assert.match(sql,/where q\.id=p_payment_plan_id for update/);
 assert.match(sql,/v_plan\.state<>'deposit_paid' or v_plan\.deposit_paid_at is null/);
 assert.match(sql,/state='cleaning_completed',cleaning_completed_at=pg_catalog\.now\(\)/);
 assert.match(sql,/revoke all on function purehome_private\.mark_cleaning_completed\(uuid\)/);
 assert.match(sql,/to service_role/);
});
test('disposable scenario uses completion function before requesting balance',()=>{
 assert.match(smoke,/mark_cleaning_completed\(v_id\)/);
 assert.match(smoke,/mark_balance_requested\(v_id,'cs_test_purehomeBalanceFixture'\)/);
});
