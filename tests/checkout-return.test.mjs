import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutReturn} from '../src/checkout-return.js';
const id='123e4567-e89b-12d3-a456-426614174000';
test('valid successful checkout retains unrelated parameters and fragment',()=>{assert.deepEqual(checkoutReturn('?payment=success&booking_id='+id+'&source=email','/purehome/','#help'),{payment:'success',bookingId:id,url:'/purehome/?source=email#help'})});
test('cancelled checkout removes callback parameters',()=>{assert.deepEqual(checkoutReturn('?payment=cancelled&booking_id='+id,'/purehome/'),{payment:'cancelled',bookingId:'',url:'/purehome/'})});
test('invalid and duplicate booking references cannot trigger lookup',()=>{for(const search of ['?payment=success&booking_id=bad','?payment=success&booking_id='+id+'&booking_id=bad'])assert.equal(checkoutReturn(search,'/').bookingId,'')});
test('duplicate payment statuses are not accepted',()=>{assert.deepEqual(checkoutReturn('?payment=success&payment=cancelled','/'),{payment:null,bookingId:'',url:null})});
test('unrecognized query remains unchanged',()=>{assert.equal(checkoutReturn('?source=ad','/').url,null)});

test('encoded checkout keys are recognized and removed',()=>{const result=checkoutReturn('?%70ayment=success&booking_id=bad&ref=hello%20world','/purehome/','#top');assert.equal(result.payment,'success');assert.equal(result.bookingId,'');assert.equal(result.url,'/purehome/?ref=hello+world#top')});
test('duplicate identical payment values are still ambiguous',()=>{assert.equal(checkoutReturn('?payment=success&payment=success','/').payment,null)});
test('payment status matching is strict',()=>{for(const value of ['SUCCESS','success%20','refunded',''])assert.equal(checkoutReturn('?payment='+value,'/').payment,null)});
test('valid uppercase booking UUID is accepted',()=>{const upper=id.toUpperCase();assert.equal(checkoutReturn('?payment=success&booking_id='+upper,'/').bookingId,upper)});

test('missing or empty booking ID is always an empty string',()=>{for(const search of ['?payment=success','?payment=success&booking_id=']){const result=checkoutReturn(search,'/');assert.equal(result.bookingId,'');assert.equal(typeof result.bookingId,'string')}});

test('encoded duplicate callback keys cannot bypass ambiguity checks',()=>{assert.equal(checkoutReturn('?payment=success&%70ayment=cancelled','/').payment,null);assert.equal(checkoutReturn('?payment=success&booking_id='+id+'&%62ooking_id='+id,'/').bookingId,'')});

test('booking UUID must have a valid version and variant',()=>{for(const invalid of ['123e4567-e89b-02d3-a456-426614174000','123e4567-e89b-12d3-7456-426614174000'])assert.equal(checkoutReturn('?payment=success&booking_id='+invalid,'/').bookingId,'')});

test('non-checkout query and hash are never modified',()=>{assert.deepEqual(checkoutReturn('?source=summer&booking_id='+id,'/purehome/','#pricing'),{payment:null,bookingId:'',url:null})});
test('cancelled callback ignores even a valid booking ID',()=>{assert.equal(checkoutReturn('?payment=cancelled&booking_id='+id,'/').bookingId,'')});

test('checkout callback cleanup preserves repeated unrelated query values',()=>{const result=checkoutReturn('?source=one&payment=success&source=two&booking_id='+id,'/purehome/','#faq');assert.equal(result.url,'/purehome/?source=one&source=two#faq')});
