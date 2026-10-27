import { useState, type FormEvent } from 'react';

export type QuoteRequestDraft = {
  service: 'Standard Cleaning' | 'Deep Cleaning';
  name: string;
  email: string;
  phone: string;
  address: string;
  preferredDate: string;
  description: string;
};

type Props = { service: QuoteRequestDraft['service']; onBack: () => void };

// Draft only. Do not connect to a live booking flow until secure guest
// submission, owner review, photo storage and notifications are implemented.
export default function GuestQuoteRequestDraft({ service, onBack }: Props) {
  const [form, setForm] = useState<QuoteRequestDraft>({
    service, name: '', email: '', phone: '', address: '',
    preferredDate: '', description: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const update = (key: keyof QuoteRequestDraft, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Intentionally no submission: customer details must not be silently lost.
  }
  return <section className="booking">
    <button type="button" className="back" onClick={onBack}>← Back</button>
    <h1>Request a {service} quote</h1>
    <p>Tell us about your home. We'll review your request and send a personalized quote before any payment.</p>
    <form onSubmit={submit}>
      <label>Full name<input required autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></label>
      <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
      <label>Phone<input required type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
      <label>Cleaning address<input required autoComplete="street-address" value={form.address} onChange={e => update('address', e.target.value)} /></label>
      <label>Preferred date<input type="date" value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} /></label>
      <label>What needs cleaning?<textarea required maxLength={3000} value={form.description} onChange={e => update('description', e.target.value)} /></label>
      <label>Photos (optional)<input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))} /></label>
      <p role="status">Quote requests are not accepting submissions yet. Your information has not been sent.</p>
      <button type="submit" className="primary" disabled>Quote requests coming soon</button>
    </form>
  </section>;
}
