import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner search tolerates incomplete request fields',()=>{
 assert.match(src,/const normalizedSearch=search\.trim\(\)\.toLowerCase\(\)/);
 assert.match(src,/String\(value\?\?''\)\.toLowerCase\(\)\.includes\(normalizedSearch\)/);
});
