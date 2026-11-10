// Validate Stripe Checkout event structure before any database mutation.
// Must be called only AFTER raw-body webhook signature verification.
// A signed event alone does not prove that it belongs to a PureHome quote.
export function parseCheckoutPaymentEvent(event) {
  if(!event||typeof event!=='object'||typeof event.id!=='string'||!/^evt_[A-Za-z0-9]+$/.test(event.id))return {ok:false,reason:'invalid_event'};
  if(event.type!=='checkout.session.completed'&&event.type!=='checkout.session.async_payment_succeeded')return {ok:false,reason:'unsupported_event'};
  const session=event.data?.object;
  if(!session||session.object!=='checkout.session'||typeof session.id!=='string'||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session.id))return {ok:false,reason:'invalid_session'};
  if(session.mode!=='payment'||session.payment_status!=='paid')return {ok:false,reason:'not_paid'};
  if(!Number.isSafeInteger(session.amount_total)||session.amount_total<100||session.amount_total>10000000)return {ok:false,reason:'invalid_amount'};
  if(session.currency!=='usd')return {ok:false,reason:'invalid_currency'};
  // Intentionally do not trust customer-editable metadata to identify the
  // quote. Look up the session ID in the private database instead.
  return {ok:true,eventId:event.id,eventType:event.type,sessionId:session.id,amountCents:session.amount_total,currency:session.currency};
}
