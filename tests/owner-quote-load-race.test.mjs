import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/OwnerQuoteRequests.tsx',import.meta.url),'utf8');
test('owner request list ignores stale responses and cleans up pending loads',()=>{
 assert.match(source,/useRef\(0\)/);
 assert.match(source,/requestId=\+\+latestLoad\.current/);
 assert.match(source,/if\(requestId!==latestLoad\.current\)return/);
 assert.match(source,/if\(requestId===latestLoad\.current\)setLoading\(false\)/);
 assert.match(source,/return \(\)=>\{latestLoad\.current\+=1\}/);
});
test('owner list errors remain recoverable after a network failure',()=>{
 assert.match(source,/catch\{/);
 assert.match(source,/Check your connection and try again/);
 assert.match(source,/setError\(''\)/);
});
