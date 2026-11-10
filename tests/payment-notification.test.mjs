import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyPaymentNotification} from '../src/payment-notification.js';
const webhookSecret='whsec_example',nowSeconds=1700000000;
const event={id:'evt_abc123',type:'checkout.session.completed',data:{object:{object:'checkout.session',id:'cs_test_deposit123',mode:'payment',payment_status:'paid',amount_total:6000,currency:'usd'}}};
const rawBody=JSON.stringify(event);
const signatureHeader=`t=${nowSeconds},v1=${createHmac('sha256',webhookSecret).update(`${nowSeconds}.${rawBody}`).digest('hex')}`;
const plan={quoteTotalCents:20000,state:'awaiting_deposit',depositCheckoutSessionId:'cs_test_deposit123',balanceCheckoutSessionId:null};
const base={rawBody,signatureHeader,webhookSecret,nowSeconds,lookupPlan:async()=>plan};
test('accepts valid signed deposit notification after private lookup',async()=>{
 assert.deepEqual(await verifyPaymentNotification(base),{ok:true,eventId:'evt_abc123',sessionId:'cs_test_deposit123',stage:'deposit',nextState:'deposit_paid',alreadyApplied:false});
});
test('rejects tampered signature before any private lookup',async()=>{
 let called=false;
 const result=await verifyPaymentNotification({...base,signatureHeader:'invalid',lookupPlan:async()=>{called=true;return plan;}});
 assert.equal(result.reason,'invalid_signature');
 assert.equal(called,false);
});
test('rejects unknown checkout and wrong amount',async()=>{
 assert.equal((await verifyPaymentNotification({...base,lookupPlan:async()=>null})).reason,'unknown_checkout');
 assert.equal((await verifyPaymentNotification({...base,lookupPlan:async()=>({...plan,quoteTotalCents:30000})})).reason,'amount_mismatch');
});
test('rejects premature and already cancelled payment stages',async()=>{
 assert.equal((await verifyPaymentNotification({...base,lookupPlan:async()=>({...plan,state:'awaiting_quote'})})).reason,'unexpected_state');
 assert.equal((await verifyPaymentNotification({...base,lookupPlan:async()=>({...plan,state:'cancelled'})})).reason,'unexpected_state');
});
