import {splitCleaningPayment} from './payment-split.js';

// Server-only checkout decision helper. This does not create a Stripe session.
// The server must load the payment plan from trusted storage, authorize the
// request, atomically reserve a checkout attempt, and use a Stripe idempotency key.
export function checkoutStageDecision({state,stage,quoteTotalCents,existingCheckoutSessionId=null}) {
  const {depositCents,balanceCents}=splitCleaningPayment(quoteTotalCents);
  if(stage!=='deposit'&&stage!=='balance')return {allowed:false,reason:'invalid_stage'};
  if(stage==='deposit'&&state!=='awaiting_deposit')return {allowed:false,reason:'deposit_not_due'};
  if(stage==='balance'&&state!=='awaiting_balance')return {allowed:false,reason:'balance_not_due'};
  if(existingCheckoutSessionId!==null) {
    if(typeof existingCheckoutSessionId!=='string'||!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(existingCheckoutSessionId))
      return {allowed:false,reason:'invalid_existing_session'};
    return {allowed:false,reason:'existing_checkout_requires_server_retrieval',checkoutSessionId:existingCheckoutSessionId};
  }
  return {allowed:true,stage,amountCents:stage==='deposit'?depositCents:balanceCents,currency:'usd'};
}

// A stable, non-PII idempotency identifier for one quote stage and version.
// The caller must pass a server-issued immutable UUID, never a customer input.
export function stageIdempotencyKey(paymentPlanId,stage,version=1) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentPlanId))
    throw new TypeError('Expected server-issued payment plan UUID');
  if(stage!=='deposit'&&stage!=='balance')throw new TypeError('Invalid stage');
  if(!Number.isSafeInteger(version)||version<1||version>1000)throw new RangeError('Invalid version');
  return `purehome:${paymentPlanId}:${stage}:v${version}`;
}
