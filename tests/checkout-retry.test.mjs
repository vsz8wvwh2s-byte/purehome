import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const form = readFileSync(new URL('../src/components/BookingForm.tsx', import.meta.url), 'utf8');

test('failed checkout retains booking ID for retry', () => {
  assert.match(form, /const \[pendingBookingId,setPendingBookingId\]=useState<string\|null>\(null\)/);
  assert.match(form, /setPendingBookingId\(bookingId\)/);
  assert.match(form, /Retry secure checkout/);
});

test('checkout retry happens before any booking creation', () => {
  const retry = form.indexOf('if(pendingBookingId){');
  const create = form.indexOf('await createBooking(');
  assert.ok(retry > 0 && create > retry);
  assert.match(form, /await createPayment\(pendingBookingId\)/);
});

test('checkout exceptions keep retry path available', () => {
  assert.match(form, /Booking saved, but checkout could not start/);
  assert.match(form, /finally\{setBusy\(false\)\}/);
});

test('saved booking can be viewed after checkout fails', () => {
  assert.match(form, /onClick=\{viewBookings\}/);
  assert.match(form, /viewBookings:\(\)=>void/);
  assert.match(form, /View saved booking/);
  assert.match(form, /Your booking has been saved/);
});

test('coverage loading does not disable payment retry', () => {
  assert.match(form, /disabled=\{busy\|\|\(!pendingBookingId&&coverageLoading\)\}/);
  assert.ok(form.indexOf("pendingBookingId?'Retry secure checkout'") < form.indexOf("coverageLoading?'Checking service area…'"));
});

test('saved booking navigation opens bookings, not payment confirmation', () => {
  const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.match(app, /viewBookings=\{\(\)=>setView\('bookings'\)\}/);
});
