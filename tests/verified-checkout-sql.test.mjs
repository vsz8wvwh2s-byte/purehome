import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../docs/sql/apply-verified-checkout-proposed.sql',import.meta.url),'utf8');
test('transactional event handler locks session and deduplicates events',()=>{
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/for update;/i);
 assert.match(sql,/v_existing\.processed_at is null/);
 assert.match(sql,/insert into purehome_private\.stripe_webhook_events/);
 assert.match(sql,/update purehome_private\.quote_payment_plans/);
});
test('proposed RPC restricts clients and verifies expected stage amount',()=>{
 assert.match(sql,/p_amount_cents<>v_expected/);
 assert.match(sql,/p_currency is distinct from 'usd'/);
 assert.match(sql,/p_session_id !~ '\^cs_test_/);
 assert.match(sql,/revoke all on function purehome_private\.apply_verified_checkout_event/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
});
