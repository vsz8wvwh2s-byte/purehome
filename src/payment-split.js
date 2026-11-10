// All amounts are integer cents to avoid floating-point payment rounding errors.
// A 30% deposit is rounded to the nearest cent; the balance is the exact remainder.
export function splitCleaningPayment(totalCents) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 100 || totalCents > 10000000) {
    throw new RangeError('Quote total must be between $1 and $100,000 in whole cents.');
  }
  const depositCents = Math.round(totalCents * 0.3);
  return { totalCents, depositCents, balanceCents: totalCents - depositCents };
}

export function quoteDollarsToCents(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 1 || amount > 100000) {
    throw new RangeError('Invalid quote total.');
  }
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 0.000001) throw new RangeError('Quote must have at most two decimal places.');
  return cents;
}
