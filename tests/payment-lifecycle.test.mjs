import test from 'node:test';
import assert from 'node:assert/strict';
import {canTransitionPayment, paymentProgress, PAYMENT_STATES} from '../src/payment-lifecycle.js';

test('owner approves quote but cannot mark deposit paid',()=>{
  assert.equal(canTransitionPayment('awaiting_quote','awaiting_deposit','owner_approved_quote'),true);
  assert.equal(canTransitionPayment('awaiting_deposit','deposit_paid','owner_approved_quote'),false);
});
test('only verified Stripe webhook events move payments to paid states',()=>{
  assert.equal(canTransitionPayment('awaiting_deposit','deposit_paid','verified_deposit_webhook'),true);
  assert.equal(canTransitionPayment('awaiting_balance','paid_in_full','verified_balance_webhook'),true);
  for(const event of ['checkout_redirect','customer_clicked_pay','owner_marked_complete','']) {
    assert.equal(canTransitionPayment('awaiting_deposit','deposit_paid',event),false);
    assert.equal(canTransitionPayment('awaiting_balance','paid_in_full',event),false);
  }
});
test('completion is owner-controlled and balance is a separate request',()=>{
  assert.equal(canTransitionPayment('deposit_paid','cleaning_completed','owner_marked_complete'),true);
  assert.equal(canTransitionPayment('deposit_paid','awaiting_balance','balance_request_created'),false);
  assert.equal(canTransitionPayment('cleaning_completed','awaiting_balance','balance_request_created'),true);
  assert.equal(canTransitionPayment('cleaning_completed','paid_in_full','verified_balance_webhook'),false);
});
test('cannot charge after paid or cancelled, and cannot skip deposit',()=>{
  for(const state of [PAYMENT_STATES.PAID_IN_FULL,PAYMENT_STATES.CANCELLED]){
    assert.equal(canTransitionPayment(state,'awaiting_deposit','owner_approved_quote'),false);
  }
  assert.equal(canTransitionPayment('awaiting_quote','paid_in_full','verified_balance_webhook'),false);
  assert.match(paymentProgress('awaiting_deposit'),/not confirmed/);
});
