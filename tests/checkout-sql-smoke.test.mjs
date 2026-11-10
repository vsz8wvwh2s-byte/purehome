import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../docs/sql/apply-verified-checkout-proposed.sql',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../docs/sql/verify-checkout-payments-disposable.sql',import.meta.url),'utf8');
test('duplicate replay branch reads full payment plan and has complete PL/pgSQL syntax',()=>{
 assert.match(sql,/select \* into v_plan\s+from purehome_private\.quote_payment_plans q/);
 assert.match(sql,/raise exception 'Event ID collision or unfinished event processing';\s+end if;/);
 assert.doesNotMatch(sql,/select q\.id,q\.state into v_plan\.id,v_plan\.state/);
});
test('disposable smoke scenario covers rounding, deposit, replay, premature balance and final payment',()=>{
 assert.match(smoke,/^begin;/m);
 assert.match(smoke,/^rollback;/m);
 for(const fragment of ['v_deposit<>6000 or v_balance<>14001','Idempotency failed','Conflicting event replay was accepted','Premature balance was accepted',"v_result.payment_state<>'paid_in_full'"])assert.ok(smoke.includes(fragment));
});
