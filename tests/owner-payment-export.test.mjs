import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitCleaningPayment,quoteDollarsToCents} from '../src/payment-split.js';

test('owner CSV export labels deposit and final balance separately',()=>{
 const source=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
 assert.match(source,/Deposit 30% USD/);
 assert.match(source,/Balance 70% USD/);
 assert.match(source,/paymentParts\(r\.quoted_amount\)\.depositCents\/100/);
 assert.match(source,/paymentParts\(r\.quoted_amount\)\.balanceCents\/100/);
 assert.match(source,/const safeCell=/);
});
test('exported amounts add back to exact quote, even with odd cents',()=>{
 for(const amount of [1.01,23.33,149.99,199.95,200,100000]){
  const {depositCents,balanceCents}=splitCleaningPayment(quoteDollarsToCents(amount));
  const deposit=(depositCents/100).toFixed(2);
  const balance=(balanceCents/100).toFixed(2);
  assert.equal(Math.round((Number(deposit)+Number(balance))*100),quoteDollarsToCents(amount));
 }
});
