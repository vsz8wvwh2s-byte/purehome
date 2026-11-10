import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner acceptance guidance matches the available status action',()=>{
 assert.match(src,/record acceptance using the status selector after the customer replies/);
 assert.doesNotMatch(src,/this dashboard does not record acceptance/);
});
test('payment breakdown and email actions reject out-of-range stored prices',()=>{
 assert.match(src,/r\.quoted_amount>=1&&r\.quoted_amount<=100000&&<p>Deposit/);
 assert.match(src,/r\.status==='quoted'&&r\.quoted_amount!=null&&Number\.isFinite\(r\.quoted_amount\)&&r\.quoted_amount>=1&&r\.quoted_amount<=100000&&<div>/);
});
