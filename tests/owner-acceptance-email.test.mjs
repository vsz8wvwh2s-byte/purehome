import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner can prepare acceptance instructions without changing payment or booking state',()=>{
 assert.match(source,/const acceptanceStepsEmail=/);
 assert.match(source,/Prepare acceptance email/);
 assert.match(source,/Copy acceptance instructions/);
 assert.match(source,/r\.status!=='quoted'/);
 assert.match(source,/30% deposit/);
 assert.match(source,/remaining 70%/);
 assert.match(source,/Your appointment is not booked yet/);
 assert.match(source,/no payment link has been created/);
 assert.match(source,/Review and send manually; no quote was accepted, payment collected, or booking confirmed/);
});
