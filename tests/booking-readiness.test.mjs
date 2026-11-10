import test from 'node:test';
import assert from 'node:assert/strict';
import {bookingReadiness} from '../src/booking-readiness.js';
test('manual acceptance never marks booking ready without verified deposit and availability',()=>{
 const result=bookingReadiness({status:'accepted',quotedAmount:200,preferredDate:'2026-12-01'});
 assert.equal(result.readyToConfirm,false);
 assert.equal(result.steps.find(x=>x.key==='deposit').done,false);
 assert.equal(result.steps.find(x=>x.key==='availability').done,false);
});
test('a missing accepted quote, invalid price, or absent date prevents confirmation',()=>{
 const base={status:'accepted',quotedAmount:200,preferredDate:'2026-12-01',depositVerified:true,availabilityConfirmed:true};
 assert.equal(bookingReadiness(base).readyToConfirm,true);
 for(const change of [{status:'quoted'},{quotedAmount:NaN},{quotedAmount:0},{preferredDate:null},{depositVerified:false},{availabilityConfirmed:false}])
 assert.equal(bookingReadiness({...base,...change}).readyToConfirm,false);
});
