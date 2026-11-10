import test from 'node:test';
import assert from 'node:assert/strict';
import {validateQuotePhotos} from '../src/quote-photo-validation.js';
const photo=(name,size,type='image/jpeg',lastModified=1)=>({name,size,type,lastModified});
test('valid photo selection and empty optional selection',()=>{
 assert.deepEqual(validateQuotePhotos([]),{ok:true,count:0,totalBytes:0});
 assert.deepEqual(validateQuotePhotos([photo('room.jpg',1024)]),{ok:true,count:1,totalBytes:1024});
});
test('rejects empty, oversized, unsupported, duplicate and excessive files',()=>{
 for(const files of [
  [photo('empty.jpg',0)],
  [photo('oversize.jpg',5*1024*1024+1)],
  [photo('bad.svg',100,'image/svg+xml')],
  [photo('a.jpg',100),photo('a.jpg',100)],
  Array.from({length:6},(_,i)=>photo(i+'.jpg',100)),
  Array.from({length:4},(_,i)=>photo(i+'.jpg',4*1024*1024))
 ])assert.equal(validateQuotePhotos(files).ok,false);
});
test('allows exactly five files at the combined 15MB limit',()=>{
 const files=Array.from({length:5},(_,i)=>photo(i+'.png',3*1024*1024,'image/png'));
 assert.equal(validateQuotePhotos(files).ok,true);
});
