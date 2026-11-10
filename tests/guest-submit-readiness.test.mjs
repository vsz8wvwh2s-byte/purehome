import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('guest submit requires complete valid draft and all security gates',()=>{
 assert.match(src,/const draftError = validateGuestQuoteDraft\(\{ \.\.\.form, service \}, today\)/);
 assert.match(src,/const canSubmit = submissionsEnabled && Boolean\(token\) && contactConsent/);
 assert.match(src,/!inspectingPhotos && photos\.length === 0 && !photoError && !draftError/);
 assert.match(src,/disabled=\{!canSubmit\}/);
});
test('request preview shares the same validation result as submit readiness',()=>{
 assert.match(src,/showReview && draftError &&/);
 assert.match(src,/const validationError = validateGuestQuoteDraft\(\{ \.\.\.form, service \}, today\)/);
});
