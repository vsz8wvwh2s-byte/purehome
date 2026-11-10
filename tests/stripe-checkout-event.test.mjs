import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCheckoutPaymentEvent} from '../src/stripe-checkout-event.js';
const event={id:'evt_123',type:'checkout.session.completed',data:{object:{object:'checkout.session',id:'cs_test_123',mode:'payment',payment_status:'paid',amount_total:6000,currency:'usd',metadata:{quote_id:'attacker_value'}}}};
test('extracts paid checkout identifiers without trusting metadata',()=>{
 assert.deepEqual(parseCheckoutPaymentEvent(event),{ok:true,eventId:'evt_123',eventType:'checkout.session.completed',sessionId:'cs_test_123',amountCents:6000,currency:'usd'});
 assert.equal(parseCheckoutPaymentEvent({...event,type:'checkout.session.async_payment_succeeded'}).ok,true);
});
test('rejects unpaid, unsupported, malformed or zero-amount events',()=>{
 for(const [change,reason] of [
  [{type:'checkout.session.expired'},'unsupported_event'],
  [{data:{object:{...event.data.object,payment_status:'unpaid'}}},'not_paid'],
  [{data:{object:{...event.data.object,mode:'subscription'}}},'not_paid'],
  [{data:{object:{...event.data.object,amount_total:0}}},'invalid_amount'],
  [{data:{object:{...event.data.object,currency:'eur'}}},'invalid_currency'],
  [{data:{object:{...event.data.object,id:'invalid'}}},'invalid_session'],
 ]){
  assert.equal(parseCheckoutPaymentEvent({...event,...change}).reason,reason);
 }
 assert.equal(parseCheckoutPaymentEvent(null).ok,false);
});
