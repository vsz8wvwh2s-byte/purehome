import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutReturn} from '../src/checkout-return.js';
const id='123e4567-e89b-12d3-a456-426614174000';
test('valid successful checkout retains unrelated parameters and fragment',()=>{assert.deepEqual(checkoutReturn('?payment=success&booking_id='+id+'&source=email','/purehome/','#help'),{payment:'success',bookingId:id,url:'/purehome/?source=email#help'})});
test('cancelled checkout removes callback parameters',()=>{assert.deepEqual(checkoutReturn('?payment=cancelled&booking_id='+id,'/purehome/'),{payment:'cancelled',bookingId:'',url:'/purehome/'})});
test('invalid and duplicate booking references cannot trigger lookup',()=>{for(const search of ['?payment=success&booking_id=bad','?payment=success&booking_id='+id+'&booking_id=bad'])assert.equal(checkoutReturn(search,'/').bookingId,'')});
test('duplicate payment statuses are not accepted',()=>{assert.deepEqual(checkoutReturn('?payment=success&payment=cancelled','/'),{payment:null,bookingId:'',url:null})});
test('unrecognized query remains unchanged',()=>{assert.equal(checkoutReturn('?source=ad','/').url,null)});
