import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedStripeCheckoutUrl } from '../src/checkout-url.js';

test('accepts a Stripe hosted Checkout payment URL', () => {
  const url = 'https://checkout.stripe.com/c/pay/cs_test_123#fragment';
  assert.equal(verifiedStripeCheckoutUrl(url), url);
  assert.equal(verifiedStripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_123'), 'https://checkout.stripe.com/c/pay/cs_test_123');
});

test('preserves Stripe session query parameters and fragments', () => {
  const url = 'https://checkout.stripe.com/c/pay/cs_test_123?prefilled_email=customer%40example.com#fidkdWxOYHwnPyd1blpxYHZxWjA0T';
  assert.equal(verifiedStripeCheckoutUrl(url), url);
});

test('rejects unsafe checkout redirect destinations', () => {
  for (const value of [
    null, undefined, 123, '', 'javascript:alert(1)',
    'http://checkout.stripe.com/c/pay/123',
    'https://checkout.stripe.com.evil.example/c/pay/123',
    'https://evil.example/c/pay/123',
    'https://checkout.stripe.com@evil.example/c/pay/123',
    'https://user:pass@checkout.stripe.com/c/pay/123',
    'https://checkout.stripe.com:8443/c/pay/123',
    'https://checkout.stripe.com/other/path',
    'https://checkout.stripe.com/c/../evil',
    'https://checkout.stripe.com/c/%2e%2e/evil',
    'https://checkout.stripe.com/c/pay/%2f%2fevil.example',
    'https://checkout.stripe.com/c/pay/123%5cfoo',
    'https://checkout.stripe.com/c/pay/',
    'https://checkout.stripe.com/c/pay/123;redirect=https://evil.example',
    'https://checkout.stripe.com/c/pay/123%00'
  ]) {
    assert.equal(verifiedStripeCheckoutUrl(value), null, String(value));
  }
});
