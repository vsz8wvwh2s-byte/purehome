import { useState, type FormEvent } from 'react';
import TurnstileChallenge from './TurnstileChallenge';

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
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
  const submissionsEnabled = import.meta.env.VITE_ENABLE_GUEST_QUOTES === 'true' && Boolean(siteKey);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  function selectPhotos(files: FileList | null) {
    const selected = Array.from(files ?? []);
    const totalBytes = selected.reduce((sum, file) => sum + file.size, 0);
    const signatures = selected.map(file => `${file.name}:${file.size}:${file.lastModified}`);
    if (new Set(signatures).size !== signatures.length) {
      setPhotoError('The same photo was selected more than once. Please choose unique photos.');
      setPhotos([]);
      setPhotoInputKey(previous => previous + 1);
      return;
    }
    if (totalBytes > 15 * 1024 * 1024) {
      setPhotoError('Your photos are too large together. Please keep the total under 15 MB.');
      setPhotos([]);
      setPhotoInputKey(previous => previous + 1);
      return;
    }
    if (selected.length > 5 || selected.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setPhotoError('Choose up to five JPG, PNG, WebP, or HEIC photos, each no larger than 5 MB.');
      setPhotos([]);
      setPhotoInputKey(previous => previous + 1);
      return;
    }
    setPhotoError('');
    setPhotos(selected);
  }
  const update = (key: keyof QuoteRequestDraft, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!submissionsEnabled || !token || submitting || photos.length || photoError) return;
    setSubmitting(true);
    setSubmissionMessage('');
    try {
      const response = await fetch('https://iphxpqycoaqwjhecfajp.supabase.co/functions/v1/submit-guest-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service, turnstileToken: token, website: '' }),
      });
      if (!response.ok) throw new Error('Unable to send your request. Please try again later.');
      setSubmissionMessage('Your quote request was received. The PureHome owner will review it before any payment or booking.');
    } catch {
      setSubmissionMessage('Unable to send your request. Please try again later.');
    } finally { setSubmitting(false); setToken(''); }
  }
  return <section className="booking">
    <button type="button" className="back" onClick={onBack}>← Back</button>
    <h1>Request a {service} quote</h1>
    <p>Tell us about your home. The PureHome owner will personally review your request and send a custom quote before any payment.</p>
    <p role="note">{submissionsEnabled ? 'Submit your request for a personal quote. Photo uploads are not available yet.' : 'This is a preview form. Submissions and photo uploads are not yet enabled.'}</p>
    <form onSubmit={submit}>
      <label>Full name<input required maxLength={120} autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></label>
      <label>Email<input required maxLength={254} type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
      <label>Phone<input required minLength={7} maxLength={30} type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
      <label>Cleaning address<input required maxLength={300} autoComplete="street-address" value={form.address} onChange={e => update('address', e.target.value)} /></label>
      <label>Preferred date<input type="date" min={today} value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} /></label>
      <label>What needs cleaning?<textarea required minLength={10} maxLength={3000} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us the number of rooms, approximate home size, pets, and areas needing extra attention." /></label>
      <p aria-live="polite">{form.description.length} / 3000 characters</p>
      <label>Photos (optional)<input type="file" key={photoInputKey} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={e => selectPhotos(e.target.files)} /></label>
      {photoError && <p role="alert">{photoError}</p>}
      {photos.length > 0 && <div><p>{photos.length} photo(s) selected ({(photos.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB total). They have not been uploaded.</p><ul>{photos.map((file, index) => <li key={`${file.name}-${index}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB) <button type="button" onClick={() => { setPhotos(previous => previous.filter((_, i) => i !== index)); setPhotoInputKey(previous => previous + 1); }}>Remove</button></li>)}</ul><button type="button" onClick={() => {setPhotos([]);setPhotoInputKey(previous => previous + 1);}}>Remove all photos</button></div>}
      <button type="button" onClick={() => setShowReview(previous => !previous)} aria-expanded={showReview}>{showReview ? 'Hide request preview' : 'Preview my request'}</button>
      {showReview && <section aria-label="Request preview"><h2>Review your details</h2><p>Service: {service}</p><p>Name: {form.name || 'Not entered'}</p><p>Email: {form.email || 'Not entered'}</p><p>Phone: {form.phone || 'Not entered'}</p><p>Address: {form.address || 'Not entered'}</p><p>Preferred date: {form.preferredDate || 'Flexible'}</p><p>Cleaning details: {form.description || 'Not entered'}</p><p>Photos selected: {photos.length}</p><p>This is only a local preview. Nothing has been submitted.</p></section>}
      {submissionsEnabled && <TurnstileChallenge siteKey={siteKey} onToken={setToken} />}
      <p role="status">{submissionMessage || (submissionsEnabled ? photos.length ? 'Remove selected photos to submit without photos for now.' : 'Complete security verification to submit.' : 'Quote requests are not accepting submissions yet. Your information has not been sent.')}</p>
      <button type="submit" className="primary" disabled={!submissionsEnabled || !token || submitting || photos.length > 0 || Boolean(photoError)}>{submitting ? 'Sending request…' : submissionsEnabled ? 'Send quote request' : 'Quote requests coming soon'}</button>
    </form>
  </section>;
}
