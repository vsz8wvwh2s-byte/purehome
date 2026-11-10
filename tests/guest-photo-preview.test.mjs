import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/GuestQuoteRequestDraft.tsx',import.meta.url),'utf8');
test('photo previews use temporary browser object URLs and revoke them',()=>{
 assert.match(src,/URL\.createObjectURL\(file\)/);
 assert.match(src,/URL\.revokeObjectURL\(preview\.url\)/);
 assert.match(src,/\}, \[photos\]\)/);
});
test('preview labels disclose local-only status and HEIC limitation',()=>{
 assert.match(src,/Local photo previews \(not uploaded\)/);
 assert.match(src,/HEIC photos are selected but cannot be previewed/);
 assert.match(src,/Selected cleaning photo:/);
});
