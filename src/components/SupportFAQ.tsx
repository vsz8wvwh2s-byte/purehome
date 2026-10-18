import { useState } from 'react';
import { helpTopics, filterHelpTopics } from '../help-topics.js';

export default function SupportFAQ() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const filtered = filterHelpTopics(helpTopics, query);
  const allVisibleExpanded = filtered.length > 0 && filtered.every(item => expanded.includes(item.question));

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
      <button type="button" className="switch" disabled={filtered.length === 0} onClick={() => setExpanded(previous => allVisibleExpanded ? previous.filter(question => !filtered.some(item => item.question === question)) : Array.from(new Set([...previous, ...filtered.map(item => item.question)])))}>{allVisibleExpanded ? "Collapse matching answers" : "Expand matching answers"}</button>
      <p role="status">{filtered.length} help {filtered.length === 1 ? "topic" : "topics"} found</p>
      {query && <button type="button" className="switch" onClick={() => setQuery("")}>Clear search</button>}
      <div>
        {filtered.length === 0 ? <p>No matching topics. Try a different search.</p> :
          filtered.map(item => (
            <details key={item.question} open={expanded.includes(item.question)} onToggle={event => { const isOpen = event.currentTarget.open; setExpanded(previous => isOpen ? (previous.includes(item.question) ? previous : [...previous, item.question]) : previous.filter(question => question !== item.question)); }} style={{ padding: '16px 0', borderBottom: '1px solid #d9e5e1' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
      </div>
    </section>
  );
}
