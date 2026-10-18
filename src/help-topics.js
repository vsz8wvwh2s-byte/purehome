export const helpTopics = [
  { question: 'How do I book a cleaning?', answer: 'Choose a cleaning service, select your preferred appointment details, and follow the booking steps. Sign in or create an account if prompted.' },
  { question: 'Where can I find my appointment?', answer: 'Sign in and open My bookings to view your scheduled and previous cleaning appointments.' },
  { question: 'Can I cancel a booking?', answer: 'Open My bookings and select an eligible appointment. Cancellation availability depends on the cancellation policy and how soon your appointment begins.' },
  { question: 'How do I pay?', answer: 'If online payment is available for your booking, follow the secure checkout link provided in My bookings. Do not send card information through messages.' },
  { question: 'What happens after I book?', answer: 'You can follow your appointment status in My bookings. Cleaner assignment and status updates will appear when available.' },
  { question: 'Can I change my appointment time?', answer: 'Check My bookings for available options. If changing the appointment is not offered, review the cancellation terms before making a new booking.' },
  { question: 'What should I do before the cleaner arrives?', answer: 'Make sure the cleaning address and access instructions are accurate. Secure valuables and pets, and keep areas that need cleaning accessible.' },
  { question: 'What if I cannot sign in?', answer: 'Confirm you are using the email address linked to your account. Check for typing mistakes and use the available sign-in or recovery options.' },
  { question: 'How do I leave a review?', answer: 'After a cleaning is completed, open My bookings and use the review option if it is available for that appointment.' }
];

export function filterHelpTopics(topics, query) {
  const terms = String(query ?? '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return topics.filter(item => {
    const haystack = (item.question + ' ' + item.answer).toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
