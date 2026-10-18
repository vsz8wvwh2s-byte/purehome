import { useState } from 'react';

type FAQ = { question: string; answer: string };

const questions: FAQ[] = [
  { question: 'How do I book a cleaning?', answer: 'Choose a cleaning service, select your preferred appointment details, and follow the booking steps. Sign in or create an account if prompted.' },
  { question: 'Where can I find my appointment?', answer: 'Sign in and open My bookings to view your scheduled and previous cleaning appointments.' },
  { question: 'Can I cancel a booking?', answer: 'Open My bookings and select an eligible appointment. Cancellation availability depends on the cancellation policy and how soon your appointment begins.' },
  { question: 'How do I pay?', answer: 'If online payment is available for your booking, follow the secure checkout link provided in My bookings. Do not send card information through messages.' },
  { question: 'What happens after I book?', answer: 'You can follow your appointment status in My bookings. Cleaner assignment and status updates will appear when available.' },
  { question: 'How do I leave a review?', answer: 'After a cleaning is completed, open My bookings and use the review option if it is available for that appointment.' }
];

export default function SupportFAQ() {
  const [query, setQuery] = useState('');
  const [openAll, setOpenAll] = useState(false);
  const filtered = questions.filter(item =>
    (item.question + ' ' + item.answer).toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section className="section" aria-labelledby="support-heading">
      <p className="eyebrow">Help center</p>
      <h2 id="support-heading">Frequently asked questions</h2>
      <p>Answers to common questions about your PureHome cleaning.</p>
      <label htmlFor="support-search">Search help topics</label>
      <input id="support-search" type="search" value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search bookings, payments, cancellations..."
        style={{ display: 'block', width: '100%', maxWidth: 480, padding: 12, margin: '12px 0 24px' }} />
      <button type="button" className="switch" onClick={() => setOpenAll(value => !value)}>{openAll ? "Collapse all answers" : "Expand all answers"}</button>
      <div aria-live="polite">
        {filtered.length === 0 ? <p>No matching topics. Try a different search.</p> :
          filtered.map(item => (
            <details key={item.question} open={openAll ? true : undefined} style={{ padding: '16px 0', borderBottom: '1px solid #d9e5e1' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
      </div>
    </section>
  );
}
