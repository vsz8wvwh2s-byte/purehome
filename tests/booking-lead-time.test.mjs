import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const form = readFileSync(new URL('../src/components/BookingForm.tsx', import.meta.url), 'utf8');

test('booking lead-time validation precedes network writes', () => {
  const validation = form.indexOf('if(start.getTime()<Date.now()+leadHours*3600000)');
  const coverage = form.indexOf('await checkServiceZip(zip.trim())');
  const addressWrite = form.indexOf('await addAddress(');
  const bookingWrite = form.indexOf('await createBooking(');
  assert.ok(validation > 0, 'missing booking lead-time validation');
  assert.ok(coverage > validation, 'coverage check should follow lead-time validation');
  assert.ok(addressWrite > validation, 'address should not be saved before time validation');
  assert.ok(bookingWrite > validation, 'booking should not be created before time validation');
});

test('booking time is calculated once and used for appointment end', () => {
  assert.equal((form.match(/const start=new Date/g) ?? []).length, 1);
  assert.match(form, /const end=new Date\(start\.getTime\(\)\+service\.estimated_minutes\*60000\)/);
});
