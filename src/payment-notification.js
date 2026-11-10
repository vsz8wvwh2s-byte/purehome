import {verifyStripeSignature} from './stripe-webhook-signature.js';
import {parseCheckoutPaymentEvent} from './stripe-checkout-event.js';
import {validateStagePayment,reconcilePaymentStage} from './payment-reconciliation.js';

// Pure, server-side validation pipeline. A caller must fetch the payment plan
// by the Stripe session ID from private storage, then atomically commit a
// deduplicated event and state change. Never pass a plan supplied by a client.
export async function verifyPaymentNotification({rawBody,signatureHeader,webhookSecret,lookupPlan,nowSeconds}) {
 if(typeof lookupPlan!=='function')throw new TypeError('Private payment plan lookup is required');
 const signed=await verifyStripeSignature({rawBody,signatureHeader,webhookSecret,nowSeconds});
 if(!signed)return {ok:false,reason:'invalid_signature'};
 let event;
 try{event=JSON.parse(rawBody);}catch{return {ok:false,reason:'invalid_json'};}
 const parsed=parseCheckoutPaymentEvent(event);
 if(!parsed.ok)return parsed;
 const plan=await lookupPlan(parsed.sessionId);
 if(!plan)return {ok:false,reason:'unknown_checkout'};
 const stage=plan.depositCheckoutSessionId===parsed.sessionId?'deposit':plan.balanceCheckoutSessionId===parsed.sessionId?'balance':null;
 if(!stage)return {ok:false,reason:'checkout_not_linked'};
 const validation=validateStagePayment({
  quoteTotalCents:plan.quoteTotalCents,stage,
  expectedCheckoutId:parsed.sessionId,receivedCheckoutId:parsed.sessionId,
  receivedAmountCents:parsed.amountCents,receivedCurrency:parsed.currency,receivedStatus:'paid'
 });
 if(!validation.ok)return validation;
 const transition=reconcilePaymentStage({currentState:plan.state,stage,validation});
 if(!transition.ok)return transition;
 return {ok:true,eventId:parsed.eventId,sessionId:parsed.sessionId,stage,nextState:transition.nextState,alreadyApplied:transition.alreadyApplied};
}
