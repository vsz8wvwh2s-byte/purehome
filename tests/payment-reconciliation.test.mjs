import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStagePayment,reconcilePaymentStage} from '../src/payment-reconciliation.js';
const base={quoteTotalCents:20000,stage:'deposit',expectedCurrency:'usd',receivedAmountCents:6000,receivedCurrency:'usd',receivedStatus:'paid',expectedCheckoutId:'cs_test_known',receivedCheckoutId:'cs_test_known'};
test('validates deposit against original quote and expected checkout',()=>{
 assert.deepEqual(validateStagePayment(base),{ok:true,stage:'deposit',expectedAmountCents:6000});
 assert.equal(validateStagePayment({...base,receivedAmountCents:20000}).reason,'amount_mismatch');
 assert.equal(validateStagePayment({...base,receivedCheckoutId:'cs_test_other'}).reason,'checkout_mismatch');
 assert.equal(validateStagePayment({...base,receivedCurrency:'eur'}).reason,'currency_mismatch');
 assert.equal(validateStagePayment({...base,receivedStatus:'unpaid'}).reason,'not_paid');
});
test('balance is 70% and cannot be accepted as deposit',()=>{
 const balance={...base,stage:'balance',receivedAmountCents:14000};
 assert.equal(validateStagePayment(balance).ok,true);
 assert.equal(validateStagePayment({...balance,stage:'deposit'}).ok,false);
});
test('state reconciliation is idempotent and does not skip stages',()=>{
 const validation=validateStagePayment(base);
 assert.deepEqual(reconcilePaymentStage({currentState:'awaiting_deposit',stage:'deposit',validation}),{ok:true,nextState:'deposit_paid',alreadyApplied:false});
 assert.deepEqual(reconcilePaymentStage({currentState:'deposit_paid',stage:'deposit',validation}),{ok:true,nextState:'deposit_paid',alreadyApplied:true});
 assert.equal(reconcilePaymentStage({currentState:'awaiting_quote',stage:'deposit',validation}).reason,'unexpected_state');
 assert.equal(reconcilePaymentStage({currentState:'awaiting_balance',stage:'balance',validation}).reason,'unverified_payment');
});
test('invalid totals and stages are rejected',()=>{
 assert.equal(validateStagePayment({...base,stage:'refund'}).reason,'unknown_stage');
 assert.throws(()=>validateStagePayment({...base,quoteTotalCents:0}));
});
