export type BookingValidationInput = {
  date: string;
  time: string;
  addressId?: string;
  line1?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export function validateBooking(input: BookingValidationInput): string | null {
  if (!input.date) return 'Choose a cleaning date.';
  if (!input.time) return 'Choose a start time.';

  const start = new Date(`${input.date}T${input.time}:00`);
  if (Number.isNaN(start.getTime())) return 'Choose a valid date and time.';
  if (start.getTime() <= Date.now()) return 'Cleaning appointments must be scheduled in the future.';

  if (!input.addressId) {
    if (!input.line1?.trim()) return 'Enter your street address.';
    if (!input.city?.trim()) return 'Enter your city.';
    if (!/^[A-Za-z]{2}$/.test(input.state?.trim() ?? '')) return 'Enter a valid 2-letter state code.';
    if (!/^\d{5}(-\d{4})?$/.test(input.zip?.trim() ?? '')) return 'Enter a valid ZIP code.';
  }

  return null;
}

export function minimumBookingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
