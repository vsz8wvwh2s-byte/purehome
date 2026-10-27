import React, { useState } from 'react';

type QuoteStatus = 'New request' | 'Need more details' | 'Quote drafted' | 'Quote sent' | 'Accepted' | 'Declined';

export default function OwnerQuoteWorkspace() {
  const [status, setStatus] = useState<QuoteStatus>('New request');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState('One-time');
  const [duration, setDuration] = useState('');
  return <section className="section" aria-labelledby="owner-quotes">
    <p className="eyebrow">Private owner workspace</p>
    <h1 id="owner-quotes">Cleaning requests and estimates</h1>
    <p role="status"><strong>Workflow preview:</strong> This screen uses no customer records. Quotes are not sent or saved. The database is not connected.</p>
    <div className="cards">
      <article><h3>New requests</h3><p>Review property information and photos before estimating.</p><strong>Not connected</strong></article>
      <article><h3>Awaiting customer</h3><p>Request missing details or send a personalized quote.</p><strong>Not connected</strong></article>
      <article><h3>Upcoming cleanings</h3><p>Only owner-approved appointments will appear here.</p><strong>Not connected</strong></article>
    </div>
    <div className="authCard">
      <h2>Quote editor preview</h2>
      <p>Use this mock editor to see the planned quote workflow. It does not send anything.</p>
      <label>Request status<select value={status} onChange={e=>setStatus(e.target.value as QuoteStatus)}>
        {(['New request','Need more details','Quote drafted','Quote sent','Accepted','Declined'] as QuoteStatus[]).map(s=><option key={s}>{s}</option>)}
      </select></label>
      <label>Estimated price in dollars<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Enter custom price" /></label>
      <label>Estimated duration (hours)<input type="number" min="0.5" step="0.5" value={duration} onChange={e=>setDuration(e.target.value)} /></label>
      <label>Cleaning frequency<select value={frequency} onChange={e=>setFrequency(e.target.value)}>{['One-time','Weekly','Every two weeks','Monthly'].map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Message to customer<textarea rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Describe included tasks, exclusions, and any questions." /></label>
      <p><strong>Draft summary:</strong> {status} · {frequency} · {price ? '$'+Number(price).toFixed(2) : 'Price not set'} · {duration || '—'} hours.</p>
      <p>Sending a quote, verifying the customer, accepting a quote, and reserving a calendar slot will require secure server-side workflows.</p>
      <button className="primary full" type="button" disabled>Send quote (coming soon)</button>
    </div>
  </section>;
}
