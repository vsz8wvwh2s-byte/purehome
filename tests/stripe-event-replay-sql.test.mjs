import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ledger=readFileSync(new URL('../docs/sql/quote-payments-proposed.sql',import.meta.url),'utf8');
const apply=readFileSync(new URL('../docs/sql/apply-verified-checkout-proposed.sql',import.meta.url),'utf8');
test('proposed event ledger binds event ID to session, amount and currency',()=>{
 for(const field of ['checkout_session_id text not null','amount_cents bigint not null','currency text not null'])assert.ok(ledger.includes(field));
 for(const check of ['v_existing.checkout_session_id is distinct from p_session_id','v_existing.amount_cents is distinct from p_amount_cents','v_existing.currency is distinct from p_currency'])assert.ok(apply.includes(check));
 assert.match(apply,/values\(p_event_id,p_event_type,p_session_id,p_amount_cents,p_currency,pg_catalog.now\(\)\)/);
});
