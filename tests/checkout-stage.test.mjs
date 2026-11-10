import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutStageDecision,stageIdempotencyKey} from '../src/checkout-stage.js';
const id='0f8fad5b-d9cb-469f-a165-70867728950e';
test('only unpaid deposit is eligible for a deposit checkout',()=>{
 assert.deepEqual(checkoutStageDecision({state:'awaiting_deposit',stage:'deposit',quoteTotalCents:20000}),{allowed:true,stage:'deposit',amountCents:6000,currency:'usd'});
 for(const state of ['awaiting_quote','deposit_paid','cleaning_completed','awaiting_balance','paid_in_full','cancelled']){
  assert.equal(checkoutStageDecision({state,stage:'deposit',quoteTotalCents:20000}).allowed,false);
 }
});
test('balance checkout is only eligible after owner completion and balance request',()=>{
 assert.deepEqual(checkoutStageDecision({state:'awaiting_balance',stage:'balance',quoteTotalCents:20000}),{allowed:true,stage:'balance',amountCents:14000,currency:'usd'});
 for(const state of ['awaiting_deposit','deposit_paid','cleaning_completed','paid_in_full']){
  assert.equal(checkoutStageDecision({state,stage:'balance',quoteTotalCents:20000}).allowed,false);
 }
});
test('existing checkout must be retrieved by server, not duplicated',()=>{
 const d=checkoutStageDecision({state:'awaiting_deposit',stage:'deposit',quoteTotalCents:20000,existingCheckoutSessionId:'cs_test_12345'});
 assert.equal(d.allowed,false);
 assert.equal(d.reason,'existing_checkout_requires_server_retrieval');
 assert.equal(checkoutStageDecision({state:'awaiting_deposit',stage:'deposit',quoteTotalCents:20000,existingCheckoutSessionId:'javascript:alert(1)'}).reason,'invalid_existing_session');
});
test('idempotency keys are stable and separated by stage and version',()=>{
 assert.equal(stageIdempotencyKey(id,'deposit'),stageIdempotencyKey(id,'deposit'));
 assert.notEqual(stageIdempotencyKey(id,'deposit'),stageIdempotencyKey(id,'balance'));
 assert.notEqual(stageIdempotencyKey(id,'deposit',1),stageIdempotencyKey(id,'deposit',2));
 assert.throws(()=>stageIdempotencyKey('customer-email@example.com','deposit'));
 assert.throws(()=>stageIdempotencyKey(id,'refund'));
});
