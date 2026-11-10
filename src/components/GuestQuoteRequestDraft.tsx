import { useEffect, useRef, useState, type FormEvent } from 'react';
import TurnstileChallenge from './TurnstileChallenge';
import {validateQuotePhotos} from '../quote-photo-validation.js';
import {inspectQuotePhotoSignatures} from '../quote-photo-signature.js';
import {validateGuestQuoteDraft} from '../guest-quote-validation.js';

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

// Guest submissions are feature-gated until server deployment and verification.
// Photos and payments are not submitted by this component.
export default function GuestQuoteRequestDraft({ service, onBack }: Props) {
  const [form, setForm] = useState<QuoteRequestDraft>({
    service, name: '', email: '', phone: '', address: '',
    preferredDate: '', description: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<{name:string;url:string}[]>([]);
  useEffect(() => {
    const previews = photos.filter(file => ['image/jpeg','image/png','image/webp'].includes(file.type)).map(file => ({name:file.name,url:URL.createObjectURL(file)}));
    setPhotoPreviews(previews);
    return () => previews.forEach(preview => URL.revokeObjectURL(preview.url));
  }, [photos]);
  const [photoError, setPhotoError] = useState('');
  const [inspectingPhotos, setInspectingPhotos] = useState(false);
  const photoSelectionVersion = useRef(0);
  useEffect(() => () => { photoSelectionVersion.current += 1; }, []);
  const [showReview, setShowReview] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [token, setToken] = useState('');
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [deliveryUncertain, setDeliveryUncertain] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
  const submissionsEnabled = import.meta.env.VITE_ENABLE_GUEST_QUOTES === 'true' && Boolean(siteKey);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const draftError = validateGuestQuoteDraft({ ...form, service }, today);
  const canSubmit = submissionsEnabled && Boolean(token) && contactConsent && !submitting && !submitted && !deliveryUncertain && !inspectingPhotos && photos.length === 0 && !photoError && !draftError;
  async function selectPhotos(files: FileList | null) {
    const selectionVersion = ++photoSelectionVersion.current;
    const selected = Array.from(files ?? []);
    setInspectingPhotos(false);
    setPhotos([]);
    setPhotoError('');
    const validation = validateQuotePhotos(selected);
    if (!validation.ok) {
      setPhotoError(validation.message ?? 'Invalid photo selection.');
      setPhotoInputKey(previous => previous + 1);
      return;
    }
    if (selected.length === 0) return;
    setInspectingPhotos(true);
    const signatures = await inspectQuotePhotoSignatures(selected);
    if (selectionVersion !== photoSelectionVersion.current) return;
    setInspectingPhotos(false);
    if (!signatures.ok) {
      setPhotoError(signatures.message ?? 'A photo format could not be verified.');
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
    if (!submissionsEnabled || !token || submissionLock.current || submitting || submitted || deliveryUncertain || photos.length || inspectingPhotos || photoError || !contactConsent) return;
    const validationError = validateGuestQuoteDraft({ ...form, service }, today);
    if (validationError) {
      setSubmissionMessage(validationError);
      return;
    }
    submissionLock.current = true;
    setSubmitting(true);
    setSubmissionMessage('');
    setDeliveryUncertain(false);
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      let response: Response;
      try {
        response = await fetch('https://iphxpqycoaqwjhecfajp.supabase.co/functions/v1/submit-guest-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service, contactConsent, turnstileToken: token, website: '' }),
        signal: controller.signal,
      });
      } finally { window.clearTimeout(timeout); }
      if (!response.ok) {
        if (response.status === 403 || response.status === 400) throw new Error('Verification or request details were rejected. Please check your information and try again.');
        throw new Error('The service is temporarily unavailable. Please try again later.');
      }
      setSubmitted(true);
      setSubmissionMessage('Your quote request was received. The PureHome owner will review it before any payment or booking.');
    } catch (error) {
      if (error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError')) {
        setDeliveryUncertain(true);
        setSubmissionMessage('We could not confirm whether your request was received. Please contact PureHome before submitting again to avoid duplicates.');
      } else {
        setSubmissionMessage(error instanceof Error ? error.message : 'Unable to send your request. Please try again later.');
      }
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
      setToken('');
      // A Turnstile response is single-use. Render a fresh challenge after every attempt.
      setChallengeAttempt(previous => previous + 1);
    }
  }
  return <section className="booking">
    <button type="button" className="back" onClick={onBack}>← Back</button>
    <h1>Request a {service} quote</h1>
    <p>Tell us about your home. The PureHome owner will personally review your request and send a custom quote. If you accept, the planned payment schedule is 30% before cleaning and 70% after the job is complete. Online payments are not enabled yet.</p>
    <p role="note">{submissionsEnabled ? 'Submit your request for a personal quote. Photo uploads are not available yet.' : 'This is a preview form. Submissions and photo uploads are not yet enabled.'}</p>
    {submitted ? <section role="status" aria-label="Quote request received"><h2>Request received</h2><p>{submissionMessage}</p><p>We will review the details and contact you using the email or phone you provided. Your preferred date is not a confirmed appointment.</p><button type="button" onClick={onBack}>Return to services</button></section> : <form onSubmit={submit}>
      <label>Full name<input required maxLength={120} autoComplete="name" value={form.name} onChange={e => update('name', e.target.value)} /></label>
      <label>Email<input required maxLength={254} type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} /></label>
      <label>Phone<input required minLength={7} maxLength={30} type="tel" autoComplete="tel" value={form.phone} onChange={e => update('phone', e.target.value)} /></label>
      <label>Cleaning address<input required maxLength={300} autoComplete="street-address" value={form.address} onChange={e => update('address', e.target.value)} /></label>
      <p>A preferred date is a request only. Your appointment is not reserved until your quote is accepted, the 30% deposit is paid, and availability is confirmed. The remaining 70% is due after cleaning is completed.</p>
      <label>Preferred date<input type="date" min={today} value={form.preferredDate} onChange={e => update('preferredDate', e.target.value)} /></label>
      <label>What needs cleaning?<textarea required minLength={10} maxLength={3000} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us the number of rooms, approximate home size, pets, and areas needing extra attention." /></label>
      <p aria-live="polite">{form.description.length} / 3000 characters</p>
      <label>Photos (optional)<input type="file" key={photoInputKey} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={e => void selectPhotos(e.target.files)} /></label>
      {inspectingPhotos && <p role="status">Checking selected photo formats…</p>}
      {photoError && <p role="alert">{photoError}</p>}
      {photoPreviews.length > 0 && <div aria-label="Selected photo previews"><p>Local photo previews (not uploaded):</p><ul>{photoPreviews.map(preview => <li key={preview.url}><img src={preview.url} alt={`Selected cleaning photo: ${preview.name}`} width="120" height="90" style={{objectFit:'cover',borderRadius:8}} /></li>)}</ul></div>}
      {photos.some(file => ['image/heic','image/heif'].includes(file.type)) && <p role="note">HEIC photos are selected but cannot be previewed in every browser.</p>}

      {photos.length > 0 && <div><p>{photos.length} photo(s) selected ({(photos.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB total). They have not been uploaded.</p><ul>{photos.map((file, index) => <li key={`${file.name}-${index}`}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB) <button type="button" onClick={() => { photoSelectionVersion.current += 1; setInspectingPhotos(false); setPhotos(previous => previous.filter((_, i) => i !== index)); setPhotoInputKey(previous => previous + 1); }}>Remove</button></li>)}</ul><button type="button" onClick={() => {photoSelectionVersion.current += 1;setInspectingPhotos(false);setPhotos([]);setPhotoInputKey(previous => previous + 1);}}>Remove all photos</button></div>}
      <label><input type="checkbox" checked={contactConsent} onChange={e => setContactConsent(e.target.checked)} required /> I agree that PureHome may contact me about this cleaning quote by email or phone. I understand this is not an appointment confirmation or a payment request.</label>
      <button type="button" onClick={() => setShowReview(previous => !previous)} aria-expanded={showReview}>{showReview ? 'Hide request preview' : 'Preview my request'}</button>
      {showReview && draftError && <p role="alert">Before submitting: {draftError}</p>}
      {showReview && !contactConsent && <p role="note">Please agree to be contacted about this quote before submitting.</p>}
      {showReview && photos.length > 0 && <p role="note">Remove the selected photos to submit this request. Secure photo uploads are not available yet.</p>}
      {showReview && <section aria-label="Request preview"><h2>Review your details</h2><p>Service: {service}</p><p>Name: {form.name || 'Not entered'}</p><p>Email: {form.email || 'Not entered'}</p><p>Phone: {form.phone || 'Not entered'}</p><p>Address: {form.address || 'Not entered'}</p><p>Preferred date: {form.preferredDate || 'Flexible'}</p><p>Cleaning details: {form.description || 'Not entered'}</p><p>Photos selected: {photos.length}</p><p>This is only a local preview. Nothing has been submitted.</p></section>}
      {submissionsEnabled && <TurnstileChallenge key={challengeAttempt} siteKey={siteKey} onToken={setToken} />}
      {deliveryUncertain && <p role="alert">The connection was interrupted. Your request may have arrived; please check with PureHome before trying again.</p>}
      {submitting && <p role="status">Sending securely… Please keep this page open.</p>}
      <p role="status">{submissionMessage || (submissionsEnabled ? photos.length ? 'Remove selected photos to submit without photos for now.' : 'Complete security verification to submit.' : 'Quote requests are not accepting submissions yet. Your information has not been sent.')}</p>
      <button type="submit" className="primary" disabled={!canSubmit}>{submitting ? 'Sending request…' : submissionsEnabled ? 'Send quote request' : 'Quote requests coming soon'}</button>
    </form>}
  </section>;
}
