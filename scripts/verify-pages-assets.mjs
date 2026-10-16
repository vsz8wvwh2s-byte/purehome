import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const html = readFileSync('dist/index.html', 'utf8');
const references = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)]
  .map(match => match[1])
  .filter(url => /\.(?:js|css)(?:[?#]|$)/i.test(url));

if (!references.some(url => /\.js(?:[?#]|$)/i.test(url))) {
  throw new Error('Homepage has no JavaScript bundle reference');
}
const base = '/purehome/';
for (const reference of references) {
  const parsed = new URL(reference, 'https://example.test' + base);
  if (parsed.origin !== 'https://example.test') {
    throw new Error('External asset reference is not allowed: ' + reference);
  }
  const pathname = parsed.pathname;
  if (!pathname.startsWith(base)) {
    throw new Error('Asset path is outside the GitHub Pages base: ' + pathname);
  }
  const relative = decodeURIComponent(pathname.slice(base.length));
  if (!relative || relative.split('/').includes('..')) {
    throw new Error('Invalid asset path: ' + pathname);
  }
  const target = resolve('dist', relative);
  if (!target.startsWith(resolve('dist') + sep) || !existsSync(target) || !statSync(target).isFile() || statSync(target).size === 0) {
    throw new Error('Referenced asset is missing or empty: ' + pathname);
  }
}
console.log('Verified ' + references.length + ' homepage JS/CSS asset references');
