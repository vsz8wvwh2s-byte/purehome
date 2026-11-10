import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('guest quote requires explicit contact consent',()=>{
 assert.match(src,/const \[contactConsent, setContactConsent\] = useState\(false\)/);
 assert.match(src,/type="checkbox" checked=\{contactConsent\}/);
 assert.match(src,/I agree that PureHome may contact me/);
 assert.match(src,/!contactConsent \|\| submitting/);
});
test('guest quote rejects stale dates and blank descriptions before submission',()=>{
 assert.match(src,/form\.preferredDate < today/);
 assert.match(src,/form\.description\.trim\(\)\.length < 10/);
 assert.match(src,/form\.address\.trim\(\)/);
});
