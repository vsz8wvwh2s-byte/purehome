import test from 'node:test';
import assert from 'node:assert/strict';
import {readLimitedBody} from '../src/limited-webhook-body.js';
const stream=(chunks)=>new ReadableStream({start(c){for(const chunk of chunks)c.enqueue(chunk);c.close();}});
test('reads webhook bytes exactly including multi-chunk UTF-8',async()=>{
 const input=new TextEncoder().encode('{"message":"café"}');
 const result=await readLimitedBody(stream([input.slice(0,13),input.slice(13)]),100);
 assert.equal(result.ok,true);
 assert.deepEqual(result.bytes,input);
});
test('rejects oversized body without buffering full stream',async()=>{
 const result=await readLimitedBody(stream([new Uint8Array(6),new Uint8Array(5)]),10);
 assert.deepEqual(result,{ok:false,reason:'too_large'});
});
test('accepts exact byte limit and rejects invalid limits',async()=>{
 assert.equal((await readLimitedBody(stream([new Uint8Array(10)]),10)).ok,true);
 await assert.rejects(readLimitedBody(stream([]),0),RangeError);
});
test('rejects missing body and non-byte chunks',async()=>{
 assert.deepEqual(await readLimitedBody(null),{ok:false,reason:'missing_body'});
 assert.deepEqual(await readLimitedBody(stream(['not bytes'])),{ok:false,reason:'invalid_chunk'});
});

test('cancels an oversized stream before consuming further chunks',async()=>{
 let cancelled=false;
 const source=new ReadableStream({
  start(controller){controller.enqueue(new Uint8Array(11));},
  cancel(){cancelled=true;}
 });
 const result=await readLimitedBody(source,10);
 assert.deepEqual(result,{ok:false,reason:'too_large'});
 assert.equal(cancelled,true);
});
test('cancels a malformed chunk stream',async()=>{
 let cancelled=false;
 const source=new ReadableStream({
  start(controller){controller.enqueue('invalid');},
  cancel(){cancelled=true;}
 });
 const result=await readLimitedBody(source,10);
 assert.deepEqual(result,{ok:false,reason:'invalid_chunk'});
 assert.equal(cancelled,true);
});
