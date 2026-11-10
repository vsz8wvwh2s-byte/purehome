import test from 'node:test';
import assert from 'node:assert/strict';
import {detectImageType,inspectQuotePhotoSignatures} from '../src/quote-photo-signature.js';
const file=(type,bytes)=>({type,slice:()=>({arrayBuffer:async()=>Uint8Array.from(bytes).buffer})});
test('detects JPEG, PNG, WebP and HEIC signatures',()=>{
 assert.equal(detectImageType(Uint8Array.from([255,216,255])),'image/jpeg');
 assert.equal(detectImageType(Uint8Array.from([137,80,78,71,13,10,26,10])),'image/png');
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('RIFF0000WEBP'))),'image/webp');
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('0000ftypheic'))),'image/heic');
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('0000ftypmif1'))),null);
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('0000ftypmsf1'))),null);
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('0000ftypavif'))),null);
 assert.equal(detectImageType(Uint8Array.from(Buffer.from('not an image'))),null);
});
test('rejects mislabeled and unreadable images',async()=>{
 assert.equal((await inspectQuotePhotoSignatures([file('image/png',[255,216,255])])).ok,false);
 assert.equal((await inspectQuotePhotoSignatures([file('image/jpeg',[255,216,255])])).ok,true);
 assert.equal((await inspectQuotePhotoSignatures([{type:'image/png',slice:()=>({arrayBuffer:async()=>{throw Error('read')}})}])).ok,false);
});
