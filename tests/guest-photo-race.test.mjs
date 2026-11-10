import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('new selections immediately remove old photo previews while validation runs',()=>{
 const start=src.indexOf('async function selectPhotos(');
 const end=src.indexOf('const update =',start);
 const selection=src.slice(start,end);
 assert.match(selection,/setPhotos\(\[\]\)/);
 assert.ok(selection.indexOf('setPhotos([])')<selection.indexOf('await inspectQuotePhotoSignatures(selected)'));
 assert.match(selection,/if \(selected\.length === 0\) return/);
});
test('unmount invalidates asynchronous photo checks and releases preview URLs',()=>{
 assert.match(src,/useEffect\(\(\) => \(\) => \{ photoSelectionVersion\.current \+= 1; \}, \[\]\)/);
 assert.match(src,/selectionVersion !== photoSelectionVersion\.current/);
 assert.match(src,/URL\.revokeObjectURL\(preview\.url\)/);
});
