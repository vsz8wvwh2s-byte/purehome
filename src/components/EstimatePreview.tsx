import React, { useState } from 'react';

type EstimateDetails = {
  service: string; property: string; frequency: string; name: string; email: string;
  phone: string; street: string; city: string; state: string; zip: string;
  size: string; bedrooms: string; bathrooms: string; preferredDate: string;
  notes: string; concerns: string;
};

const initial: EstimateDetails = {
  service: 'Regular cleaning', property: 'House', frequency: 'One-time',
  name: '', email: '', phone: '', street: '', city: '', state: '', zip: '',
  size: '', bedrooms: '', bathrooms: '', preferredDate: '', notes: '', concerns: ''
};

export default function EstimatePreview({ back }: { back: () => void }) {
  const [details, setDetails] = useState<EstimateDetails>(initial);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState('');
  const update = (key: keyof EstimateDetails, value: string) =>
    setDetails(current => ({ ...current, [key]: value }));
  const field = (key: keyof EstimateDetails, label: string, type = 'text') =>
    <label>{label}<input type={type} value={details[key]} onChange={event => update(key, event.target.value)} /></label>;

  const onPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (selected.length > 6 || selected.some(file => !validTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setPhotoError('Choose up to six JPG, PNG, or WebP photos, each under 5 MB.');
      setPhotos([]);
      event.target.value = '';
      return;
    }
    setPhotoError('');
    setPhotos(selected);
  };

  return <section className="section" aria-labelledby="estimate-title">
    <button className="switch" type="button" onClick={back}>← Back to PureHome</button>
    <p className="eyebrow">Personalized cleaning, personally handled</p>
    <h1 id="estimate-title">Request your cleaning estimate</h1>
    <p>The owner reviews each request and brings cleaning supplies and equipment.</p>
    <p role="status"><strong>Preview only:</strong> This form does not send or save your information or photos. Please do not enter real personal details yet.</p>
    <form className="authCard" onSubmit={event => event.preventDefault()}>
      <label>Cleaning service<select value={details.service} onChange={event => update('service', event.target.value)}><option>Regular cleaning</option><option>Deep cleaning</option></select></label>
      <label>Property type<select value={details.property} onChange={event => update('property', event.target.value)}><option>House</option><option>Apartment</option><option>Small office</option></select></label>
      <label>Cleaning frequency<select value={details.frequency} onChange={event => update('frequency', event.target.value)}><option>One-time</option><option>Weekly</option><option>Every two weeks</option><option>Monthly</option></select></label>
      <h2>Contact information</h2>
      {field('name', 'Full name')}
      {field('email', 'Email address', 'email')}
      {field('phone', 'Phone number', 'tel')}
      <h2>Property details</h2>
      {field('street', 'Street address')}
      {field('city', 'City')}
      {field('state', 'State')}
      {field('zip', 'ZIP code')}
      {field('size', 'Approximate square footage', 'number')}
      {details.property !== 'Small office' && field('bedrooms', 'Bedrooms', 'number')}
      {field('bathrooms', 'Bathrooms', 'number')}
      {field('preferredDate', 'Preferred cleaning date', 'date')}
      <label>Cleaning instructions<textarea value={details.notes} onChange={event => update('notes', event.target.value)} rows={3} /></label>
      <label>Pets, allergies, delicate surfaces, or product preferences<textarea value={details.concerns} onChange={event => update('concerns', event.target.value)} rows={3} /></label>
      <label>Optional property photos (up to six, 5 MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPhotos} /></label>
      {photoError && <p role="alert">{photoError}</p>}
      {photos.length > 0 && <p>{photos.length} photo{photos.length === 1 ? '' : 's'} selected locally. Nothing has been uploaded.</p>}
      <p><strong>Estimate:</strong> The owner reviews property details and photos before quoting. Any changes to the price or scope must be approved before extra work.</p>
      <p>No automatic charges. All appointments are subject to owner approval.</p>
      <button className="primary full" type="button" disabled>Request submission coming soon</button>
    </form>
  </section>;
}
