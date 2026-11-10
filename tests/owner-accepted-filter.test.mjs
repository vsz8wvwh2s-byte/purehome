import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('accepted quotes can be filtered without implying payment or booking',()=>{
 assert.match(src,/acceptedCount=rows\.filter\(r=>r\.status==='accepted'\)\.length/);
 assert.match(src,/showAccepted=\(\)=>\{setFilter\('accepted'\)/);
 assert.match(src,/Customer-accepted quotes \(\{acceptedCount\}\)/);
 assert.match(src,/accepted requests \(not necessarily paid or booked\)/);
});
