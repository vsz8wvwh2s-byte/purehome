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
  const [photoError, setPhotoError] = useState('');
  const [showReview, setShowReview] = useState(false);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  function selectPhotos(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (selected.length > 5 || selected.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setPhotoError('Choose up to five JPG, PNG, WebP, or HEIC photos, each no larger than 5 MB.');
      setPhotos([]);
      return;
    }
    setPhotoError('');
    setPhotos(selected);
  }
  const update = (key: keyof QuoteRequestDraft, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Submission stays disabled until the server endpoint has bot checks and verified persistence.
  }
  return <section className="booking">
    <button type="button" className="back" onClick={onBack}>← Back</button>
    <h1>Request a {service} quote</h1>
    <p>Tell us about your home. The PureHome owner will personally review your request and send a custom quote before any payment.</p>
    <p role="note">This is a preview form. Submissions and photo uploads are not yet enabled.</p>
    <form onSubmit={submit}>
      <label>Full name<input required maxLength={120} autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></label>
      <label>Email<input required maxLength={254} type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
      <label>Phone<input required minLength={7} maxLength={30} type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
      <label>Cleaning address<input required maxLength={300} autoComplete="street-address" value={form.address} onChange={e => update('address', e.target.value)} /></label>
      <label>Preferred date<input type="date" min={today} value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} /></label>
      <label>What needs cleaning?<textarea required minLength={10} maxLength={3000} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us the number of rooms, approximate home size, pets, and areas needing extra attention." /></label>
      <p aria-live="polite">{form.description.length} / 3000 characters</p>
      <label>Photos (optional)<input type="file" accept="image/*" multiple onChange={e => selectPhotos(e.target.files)} /></label>
      {photoError && <p role="alert">{photoError}</p>}
      {photos.length > 0 && <p>{photos.length} photo(s) selected. They have not been uploaded.</p>}
      <button type="button" onClick={() => setShowReview(previous => !previous)} aria-expanded={showReview}>{showReview ? 'Hide request preview' : 'Preview my request'}</button>
      {showReview && <section aria-label="Request preview"><h2>Review your details</h2><p>Service: {service}</p><p>Name: {form.name || 'Not entered'}</p><p>Email: {form.email || 'Not entered'}</p><p>Phone: {form.phone || 'Not entered'}</p><p>Address: {form.address || 'Not entered'}</p><p>Preferred date: {form.preferredDate || 'Flexible'}</p><p>Cleaning details: {form.description || 'Not entered'}</p><p>Photos selected: {photos.length}</p><p>This is only a local preview. Nothing has been submitted.</p></section>}
      <p role="status">Quote requests are not accepting submissions yet. Your information has not been sent.</p>
      <button type="submit" className="primary" disabled>Quote requests coming soon</button>
    </form>
  </section>;
}
