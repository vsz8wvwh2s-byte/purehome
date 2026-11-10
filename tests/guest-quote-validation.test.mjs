import test from 'node:test';
import assert from 'node:assert/strict';
import {validCalendarDate,validateGuestQuoteDraft} from '../src/guest-quote-validation.js';
const base={service:'Standard Cleaning',name:'Jane Doe',email:'jane@example.com',phone:'7045551234',address:'123 Main St',preferredDate:'2026-12-01',description:'Please clean the kitchen and bathrooms.'};
test('guest form accepts complete draft and optional preferred date',()=>{
 assert.equal(validateGuestQuoteDraft(base,'2026-11-10'),null);
 assert.equal(validateGuestQuoteDraft({...base,preferredDate:''},'2026-11-10'),null);
});
test('guest form rejects missing or malformed contact and cleaning details',()=>{
 for(const patch of [{name:' '},{email:'bad email'},{phone:'123'},{address:' '},{description:'short'},{service:'Commercial Cleaning'}])
 assert.notEqual(validateGuestQuoteDraft({...base,...patch},'2026-11-10'),null);
});
test('guest date validation rejects impossible and past dates',()=>{
 for(const date of ['2026-02-30','2026-02-29','2026-11-09','2026-13-01','tomorrow'])
 assert.equal(validCalendarDate(date,'2026-11-10'),false);
 assert.equal(validCalendarDate('2028-02-29','2026-11-10'),true);
});
