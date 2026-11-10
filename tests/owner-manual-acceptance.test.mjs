import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner records customer acceptance only for previously sent quotes',()=>{
 assert.match(src,/nextStatus==='accepted'&&request\.status!=='quoted'/);
 assert.match(src,/customer has explicitly agreed to the saved price/);
 assert.match(src,/nextStatus==='quoted'\|\|nextStatus==='accepted'/);
 assert.match(src,/status!=='accepted'\|\|r\.status==='quoted'/);
 assert.match(src,/Customer acceptance recorded manually\. Deposit has not been collected and the appointment is not confirmed/);
});
