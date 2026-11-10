import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('request preview surfaces validation problems before submit',()=>{
 assert.match(src,/showReview && validateGuestQuoteDraft\(\{ \.\.\.form, service \}, today\)/);
 assert.match(src,/Before submitting:/);
 assert.match(src,/showReview && !contactConsent/);
});
test('photo preview makes disabled upload limitation explicit',()=>{
 assert.match(src,/showReview && photos\.length > 0/);
 assert.match(src,/Remove the selected photos to submit this request/);
});
