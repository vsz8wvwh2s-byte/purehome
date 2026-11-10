import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const smoke=readFileSync(new URL('../docs/sql/verify-checkout-payments-disposable.sql',import.meta.url),'utf8');
test('rollback scenario rejects unpaid cleaning completion and balance request',()=>{
 assert.match(smoke,/mark_cleaning_completed\(v_unpaid_id\)/);
 assert.match(smoke,/mark_balance_requested\(v_unpaid_id,'cs_test_purehomeUnpaidBalanceFixture'\)/);
 assert.match(smoke,/Unpaid cleaning completion was accepted/);
 assert.match(smoke,/Unpaid balance request was accepted/);
 assert.match(smoke,/^rollback;/m);
});
