import test from 'node:test';
import assert from 'node:assert/strict';
import { splitCleaningPayment, quoteDollarsToCents } from '../src/payment-split.js';

test('30 percent deposit and 70 percent remaining balance', () => {
  assert.deepEqual(splitCleaningPayment(20000), {totalCents:20000,depositCents:6000,balanceCents:14000});
});
test('rounding never loses or creates a cent', () => {
  for (const cents of [100,101,999,10001,12345,9999999,10000000]) {
    const result=splitCleaningPayment(cents);
    assert.equal(result.depositCents+result.balanceCents,cents);
  }
});
test('quote conversion enforces two decimals and valid range', () => {
  assert.equal(quoteDollarsToCents(199.99),19999);
  for(const amount of [0,-1,100000.01,12.345,Infinity,NaN]) assert.throws(()=>quoteDollarsToCents(amount));
});
test('invalid cent totals are rejected',()=>{
  for(const cents of [0,99,-100,10000001,123.5,NaN]) assert.throws(()=>splitCleaningPayment(cents));
});
