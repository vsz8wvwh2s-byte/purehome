import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('quote submission uses a synchronous lock to block duplicate requests',()=>{
 assert.match(src,/const submissionLock = useRef\(false\)/);
 assert.match(src,/submissionLock\.current \|\| submitting/);
 const lock=src.indexOf('submissionLock.current = true;');
 const request=src.indexOf("await fetch('https://");
 assert.ok(lock>=0 && request>lock);
});
test('quote submission lock is released on success or failure',()=>{
 assert.match(src,/\} finally \{\s*submissionLock\.current = false;\s*setSubmitting\(false\)/);
 assert.match(src,/\|\| deliveryUncertain \|\| photos\.length/);
});
