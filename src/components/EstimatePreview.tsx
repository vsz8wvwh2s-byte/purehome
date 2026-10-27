import React, { useState } from 'react';

export default function EstimatePreview({ back }: { back: () => void }) {
  const [service, setService] = useState('Regular cleaning');
  const [property, setProperty] = useState('House');
  const [frequency, setFrequency] = useState('One-time');
  return <section className="section" aria-labelledby="estimate-title">
    <button className="switch" type="button" onClick={back}>← Back to PureHome</button>
    <p className="eyebrow">Personalized cleaning, personally handled</p>
    <h1 id="estimate-title">Request your cleaning estimate</h1>
    <p>Choose what you need. PureHome's owner personally reviews each request and provides cleaning supplies and equipment.</p>
    <p role="status"><strong>Preview only:</strong> This form is not accepting or storing requests yet. Secure submissions and photo uploads are being built.</p>
    <form className="authCard" onSubmit={e => e.preventDefault()}>
      <label>Cleaning service<select value={service} onChange={e => setService(e.target.value)}><option>Regular cleaning</option><option>Deep cleaning</option></select></label>
      <label>Property type<select value={property} onChange={e => setProperty(e.target.value)}><option>House</option><option>Apartment</option><option>Small office</option></select></label>
      <label>Cleaning frequency<select value={frequency} onChange={e => setFrequency(e.target.value)}><option>One-time</option><option>Weekly</option><option>Every two weeks</option><option>Monthly</option></select></label>
      <p><strong>Your selection:</strong> {service} · {property} · {frequency}</p>
      <p>Next: contact information, property details, optional photos, preferred dates, and a private estimate from the owner. No automatic charges.</p>
      <button className="primary full" type="button" disabled aria-disabled="true">Requests opening soon</button>
    </form>
  </section>;
}
