import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('accepted quotes have a manual next-steps email',()=>{
 assert.match(src,/const acceptedNextStepsEmail=/);
 assert.match(src,/Prepare accepted-quote email/);
 assert.match(src,/Copy accepted-quote next steps/);
 assert.match(src,/r\.status==='accepted'&&r\.quoted_amount!=null/);
});
test('accepted email disclaims collection and confirmation',()=>{
 assert.match(src,/Please do not send card information by email/);
 assert.match(src,/Your appointment will only be confirmed after availability is agreed and the deposit is verified/);
 assert.match(src,/No deposit or booking has been processed/);
});
