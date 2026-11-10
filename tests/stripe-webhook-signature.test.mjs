import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyStripeSignature} from '../src/stripe-webhook-signature.js';
const secret='whsec_test_example',rawBody='{"id":"evt_123","type":"checkout.session.completed"}',timestamp=1700000000;
const signature=(body=rawBody,time=timestamp)=>createHmac('sha256',secret).update(`${time}.${body}`).digest('hex');
const args={rawBody,webhookSecret:secret,nowSeconds:timestamp,signatureHeader:`t=${timestamp},v1=${signature()}`};
test('valid Stripe raw-body signature accepted',async()=>{
 assert.equal(await verifyStripeSignature(args),true);
 assert.equal(await verifyStripeSignature({...args,signatureHeader:`t=${timestamp},v0=old,v1=${signature()}`}),true);
});
test('tampered body, wrong secret and missing signature rejected',async()=>{
 assert.equal(await verifyStripeSignature({...args,rawBody:rawBody+' '}),false);
 assert.equal(await verifyStripeSignature({...args,webhookSecret:'whsec_other'}),false);
 assert.equal(await verifyStripeSignature({...args,signatureHeader:`t=${timestamp},v1=abc`}),false);
 assert.equal(await verifyStripeSignature({...args,signatureHeader:''}),false);
});
test('replayed, future, and duplicate timestamps rejected',async()=>{
 assert.equal(await verifyStripeSignature({...args,nowSeconds:timestamp+301}),false);
 assert.equal(await verifyStripeSignature({...args,nowSeconds:timestamp-301}),false);
 assert.equal(await verifyStripeSignature({...args,signatureHeader:`t=${timestamp},t=${timestamp},v1=${signature()}`}),false);
 assert.equal(await verifyStripeSignature({...args,signatureHeader:`t=${timestamp+10},v1=${signature()}`}),false);
});
