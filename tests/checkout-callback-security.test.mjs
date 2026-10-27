import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutReturn } from '../src/checkout-return.js';

const bookingId = '123e4567-e89b-12d3-a456-426614174000';

test('checkout return strips callback credentials while retaining ordinary navigation state', () => {
  const result = checkoutReturn(
    '?campaign=fall&payment=success&booking_id=' + bookingId + '&campaign=repeat',
    '/purehome/',
    '#services'
  );
  assert.deepEqual(result, {
    payment: 'success',
    bookingId,
    url: '/purehome/?campaign=fall&campaign=repeat#services'
  });
});

test('forged checkout callback values cannot trigger a booking lookup', () => {
  for (const query of [
    '?payment=success&booking_id=not-a-uuid',
    '?payment=success&booking_id=' + bookingId + '&booking_id=' + bookingId,
    '?payment=success&payment=cancelled&booking_id=' + bookingId,
    '?payment=success&booking_id=%3Cscript%3E'
  ]) {
    const result = checkoutReturn(query, '/purehome/');
    assert.equal(result.bookingId, '');
  }
});

test('cancelled payment never exposes a booking reference', () => {
  const result = checkoutReturn('?payment=cancelled&booking_id=' + bookingId, '/purehome/');
  assert.equal(result.payment, 'cancelled');
  assert.equal(result.bookingId, '');
  assert.equal(result.url, '/purehome/');
});
