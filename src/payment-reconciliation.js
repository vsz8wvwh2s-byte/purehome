import {splitCleaningPayment} from './payment-split.js';

// A pure validation boundary for a future server-side Stripe webhook handler.
// The caller MUST verify Stripe's webhook signature, retrieve the quote and
// payment intent from trusted storage, and commit changes atomically.
export function validateStagePayment({quoteTotalCents,stage,expectedCurrency='usd',receivedAmountCents,receivedCurrency,receivedStatus,expectedCheckoutId,receivedCheckoutId}) {
  const {depositCents,balanceCents}=splitCleaningPayment(quoteTotalCents);
  if(stage!=='deposit'&&stage!=='balance')return {ok:false,reason:'unknown_stage'};
  if(typeof expectedCheckoutId!=='string'||!expectedCheckoutId||expectedCheckoutId!==receivedCheckoutId)return {ok:false,reason:'checkout_mismatch'};
  if(receivedStatus!=='paid')return {ok:false,reason:'not_paid'};
  if(receivedCurrency!==expectedCurrency)return {ok:false,reason:'currency_mismatch'};
  const expectedAmountCents=stage==='deposit'?depositCents:balanceCents;
  if(!Number.isSafeInteger(receivedAmountCents)||receivedAmountCents!==expectedAmountCents)return {ok:false,reason:'amount_mismatch'};
  return {ok:true,stage,expectedAmountCents};
}

export function reconcilePaymentStage({currentState,stage,validation}) {
  if(!validation?.ok||validation.stage!==stage)return {ok:false,reason:'unverified_payment'};
  const expectedState=stage==='deposit'?'awaiting_deposit':'awaiting_balance';
  const nextState=stage==='deposit'?'deposit_paid':'paid_in_full';
  if(currentState===nextState)return {ok:true,nextState,alreadyApplied:true};
  if(currentState!==expectedState)return {ok:false,reason:'unexpected_state'};
  return {ok:true,nextState,alreadyApplied:false};
}
