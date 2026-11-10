// PureHome two-stage payment state machine. These helpers never create charges.
// Server-side Stripe webhooks must verify payments before persisting transitions.
export const PAYMENT_STATES = Object.freeze({
  AWAITING_QUOTE: 'awaiting_quote',
  AWAITING_DEPOSIT: 'awaiting_deposit',
  DEPOSIT_PAID: 'deposit_paid',
  CLEANING_COMPLETED: 'cleaning_completed',
  AWAITING_BALANCE: 'awaiting_balance',
  PAID_IN_FULL: 'paid_in_full',
  CANCELLED: 'cancelled',
});

const allowed = Object.freeze({
  awaiting_quote: ['awaiting_deposit', 'cancelled'],
  awaiting_deposit: ['deposit_paid', 'cancelled'],
  deposit_paid: ['cleaning_completed', 'cancelled'],
  cleaning_completed: ['awaiting_balance'],
  awaiting_balance: ['paid_in_full'],
  paid_in_full: [],
  cancelled: [],
});

export function canTransitionPayment(from, to, event) {
  if (!allowed[from]?.includes(to)) return false;
  if (to === 'deposit_paid') return event === 'verified_deposit_webhook';
  if (to === 'paid_in_full') return event === 'verified_balance_webhook';
  if (to === 'cleaning_completed') return event === 'owner_marked_complete';
  if (to === 'awaiting_balance') return event === 'balance_request_created';
  if (to === 'awaiting_deposit') return event === 'owner_approved_quote';
  if (to === 'cancelled') return event === 'owner_cancelled';
  return false;
}

export function paymentProgress(state) {
  switch (state) {
    case 'awaiting_quote': return 'Owner is reviewing the quote';
    case 'awaiting_deposit': return '30% deposit required; appointment not confirmed';
    case 'deposit_paid': return 'Deposit paid; appointment requires owner availability confirmation';
    case 'cleaning_completed': return 'Cleaning complete; 70% balance to be requested';
    case 'awaiting_balance': return '70% balance due';
    case 'paid_in_full': return 'Paid in full';
    case 'cancelled': return 'Cancelled; refunds must be handled separately';
    default: return 'Payment status unavailable';
  }
}
