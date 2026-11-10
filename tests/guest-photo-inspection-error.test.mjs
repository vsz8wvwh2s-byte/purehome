import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('unexpected photo inspector failures leave a recoverable form',()=>{
 assert.match(src,/try \{\s*signatures = await inspectQuotePhotoSignatures\(selected\)/);
 assert.match(src,/catch \{\s*signatures = \{ok:false,message:/);
 assert.match(src,/setInspectingPhotos\(false\);\s*if \(!signatures\.ok\)/);
 assert.match(src,/setPhotoError\(signatures\.message/);
});
