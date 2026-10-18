import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const faq = readFileSync(new URL('../src/components/SupportFAQ.tsx', import.meta.url), 'utf8');

test('help center is imported and accessible in the app navigation', () => {
  assert.match(app, /import SupportFAQ from ['"]\.\/components\/SupportFAQ['"]/);
  assert.match(app, /'support'/);
  assert.match(app, /setView\('support'\)/);
  assert.match(app, /view==='support'\?<SupportFAQ\/>/);
});

test('help center provides accessible search and results feedback', () => {
  assert.match(faq, /htmlFor="support-search"/);
  assert.match(faq, /id="support-search"/);
  assert.match(faq, /type="search"/);
  assert.match(faq, /role="status"/);
  assert.match(faq, /No matching topics/);
  assert.match(faq, /Clear search/);
});

test('help topics cover core customer workflows without collecting payment details', () => {
  for (const phrase of ['book a cleaning', 'cancel a booking', 'How do I pay', 'leave a review', 'appointment']) {
    assert.ok(faq.toLowerCase().includes(phrase.toLowerCase()), 'Missing topic: ' + phrase);
  }
  assert.match(faq, /Do not send card information through messages/);
});

test('expand control is disabled when no search results match', () => {
  assert.match(faq, /disabled=\{filtered\.length === 0\}/);
  assert.match(faq, /allVisibleExpanded/);
});
