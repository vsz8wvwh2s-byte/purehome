import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentReturnState } from '../src/payment-return-state.js';

test('all confirmed and progressing bookings are successful returns', () => {
  for (const status of ['confirmed', 'assigning', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed']) {
    assert.equal(paymentReturnState(status), 'confirmed', status);
  }
});

test('inactive bookings cannot appear confirmed', () => {
  for (const status of ['cancelled', 'declined', 'no_show', 'refunded']) {
    assert.equal(paymentReturnState(status), 'inactive', status);
  }
});

test('unpaid and unknown statuses remain unconfirmed', () => {
  for (const status of ['draft', 'pending_payment', '', null, undefined, 'unknown']) {
    assert.equal(paymentReturnState(status), 'pending', String(status));
  }
});
