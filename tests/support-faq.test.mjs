import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { helpTopics, filterHelpTopics } from '../src/help-topics.js';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const faq = readFileSync(new URL('../src/components/SupportFAQ.tsx', import.meta.url), 'utf8');

test('help center is imported and accessible in the app navigation', () => {
  assert.match(app, /import SupportFAQ from ['"]\.\/components\/SupportFAQ['"]/);
  assert.match(app, /'support'/);
  assert.match(app, /setView\('support'\)/);
  assert.match(app, /view==='support'\?<SupportFAQ /);
  assert.match(app, /onBrowseServices=\{\(\)=>setView\('home'\)\}/);
  assert.match(app, /onMyBookings=\{\(\)=>setView\(user\?'bookings':'auth'\)\}/);
});

test('help center provides accessible search and results feedback', () => {
  assert.match(faq, /htmlFor="support-search"/);
  assert.match(faq, /id="support-search"/);
  assert.match(faq, /type="search"/);
  assert.match(faq, /role="status"/);
  assert.match(faq, /aria-live="polite"/);
  assert.match(faq, /No matching topics/);
  assert.match(faq, /Clear search/);
});

test('help topics cover core customer workflows without collecting payment details', () => {
  for (const phrase of ['book a cleaning', 'cancel a booking', 'How do I pay', 'leave a review', 'appointment']) {
    assert.ok(JSON.stringify(helpTopics).toLowerCase().includes(phrase.toLowerCase()), 'Missing topic: ' + phrase);
  }
  assert.match(JSON.stringify(helpTopics), /Do not send card information through messages/);
});

test('expand control is disabled when no search results match', () => {
  assert.match(faq, /disabled=\{filtered\.length === 0\}/);
  assert.match(faq, /allVisibleExpanded/);
});

test('FAQ search handles multiple words, case and whitespace', () => {
  assert.equal(filterHelpTopics(helpTopics, '  HOW   PAY ').length, 1);
  assert.equal(filterHelpTopics(helpTopics, 'review cleaning').length, 1);
  assert.equal(filterHelpTopics(helpTopics, 'no-such-topic').length, 0);
  assert.equal(filterHelpTopics(helpTopics, '').length, helpTopics.length);
});

test('FAQ search does not mutate the original topics', () => {
  const original = JSON.stringify(helpTopics);
  filterHelpTopics(helpTopics, 'cleaning');
  assert.equal(JSON.stringify(helpTopics), original);
});

test('booking tips toggle is accessible and explains preparation', () => {
  assert.match(faq, /const \[showTips, setShowTips\] = useState\(false\)/);
  assert.match(faq, /aria-expanded=\{showTips\}/);
  assert.match(faq, /aria-controls="support-tips"/);
  assert.match(faq, /id="support-tips"/);
  assert.match(faq, /preferred date, cleaning address, and service choice/);
});

test('additional customer help topics are searchable', () => {
  assert.equal(filterHelpTopics(helpTopics, 'appointment time').length > 0, true);
  assert.equal(filterHelpTopics(helpTopics, 'valuables pets').length, 1);
  assert.equal(filterHelpTopics(helpTopics, 'sign in').length > 0, true);
  assert.equal(helpTopics.length, 12);
  assert.equal(filterHelpTopics(helpTopics, 'cleaning address').length > 0, true);
  assert.equal(filterHelpTopics(helpTopics, 'notifications').length > 0, true);
  assert.equal(filterHelpTopics(helpTopics, 'cleaner delayed').length, 1);
});

test('help center exposes working booking navigation callbacks', () => {
  assert.match(faq, /onBrowseServices: \(\) => void/);
  assert.match(faq, /onMyBookings: \(\) => void/);
  assert.match(faq, /onClick=\{onBrowseServices\}/);
  assert.match(faq, /onClick=\{onMyBookings\}/);
});
