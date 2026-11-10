import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/stripe-webhook-preflight/index.ts',import.meta.url),'utf8');
test('webhook preflight defaults off and only accepts signed test events',()=>{
 assert.match(source,/PUREHOME_ENABLE_STRIPE_WEBHOOK_PREFLIGHT/);
 assert.match(source,/STRIPE_WEBHOOK_SECRET_TEST/);
 assert.match(source,/verifyStripeSignature\(/);
 assert.match(source,/parseCheckoutPaymentEvent\(/);
 assert.match(source,/startsWith\('cs_test_'\)/);
});
test('preflight cannot falsely acknowledge payments as processed',()=>{
 assert.match(source,/Verified test event; processing not configured/);
 assert.match(source,/return json\(503,\{error:'Verified test event; processing not configured'\}\)/);
 assert.doesNotMatch(source,/\.from\(['"]quote_payment_plans['"]\)/);
});
