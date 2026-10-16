/** Group booking statuses for the payment return screen. */
export function paymentReturnState(status) {
  if (['confirmed', 'assigning', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'].includes(status)) return 'confirmed';
  if (['cancelled', 'declined', 'no_show', 'refunded'].includes(status)) return 'inactive';
  return 'pending';
}
