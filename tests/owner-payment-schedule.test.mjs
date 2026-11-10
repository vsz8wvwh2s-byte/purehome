import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner dashboard provides explicit 30/70 payment schedule copy',()=>{
 assert.match(source,/Copy 30\/70 payment schedule/);
 assert.match(source,/paymentParts\(amount\)/);
 assert.match(source,/30% deposit due after quote acceptance/);
 assert.match(source,/70% balance due after completed cleaning/);
 assert.match(source,/No payment has been requested or collected by this message/);
});
test('copy action is limited to valid saved quote totals',()=>{
 assert.match(source,/r\.quoted_amount>=1&&r\.quoted_amount<=100000&&<button/);
 assert.match(source,/navigator\.clipboard\.writeText\(paymentSchedule\(r\)\)/);
});
