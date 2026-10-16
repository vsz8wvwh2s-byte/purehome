/** Only allow navigation to Stripe's hosted Checkout endpoint. */
export function verifiedStripeCheckoutUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') return null;
    if (url.username || url.password || url.port || url.hash) return null;
    if (!url.pathname.startsWith('/c/')) return null;
    return url.href;
  } catch {
    return null;
  }
}
