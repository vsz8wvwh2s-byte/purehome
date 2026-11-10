import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../docs/sql/verify-checkout-payments-disposable.sql',import.meta.url),'utf8');
test('negative SQL cases must check expected failure reason rather than catch arbitrary errors',()=>{
 const cases=[
  'Cannot complete cleaning before verified deposit payment',
  'Balance cannot be requested before cleaning is completed',
  'Payment amount mismatch',
  'Invalid verified Stripe event input',
  'Event ID collision or unfinished event processing',
  'Unknown checkout session',
  'A different balance checkout already exists',
 ];
 for(const reason of cases)assert.ok(sql.includes("sqlerrm <> '"+reason+"'"),'Missing expected error check: '+reason);
 assert.match(sql,/^rollback;/m);
});
