import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function verify(html, files = { 'assets/app.js': 'console.log("ok")' }) {
  const dir = mkdtempSync(join(tmpdir(), 'purehome-assets-'));
  try {
    writeFileSync(join(dir, 'index.html'), html);
    for (const [name, content] of Object.entries(files)) {
      const path = join(dir, name);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, content);
    }
    return spawnSync(process.execPath, ['scripts/verify-pages-assets.mjs', dir], { encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('accepts a local nonempty JavaScript bundle', () => {
  const result = verify('<script type="module" src="/purehome/assets/app.js"></script>');
  assert.equal(result.status, 0, result.stderr);
});

test('accepts a homepage with both JavaScript and CSS assets', () => {
  const html = '<script type="module" src="/purehome/assets/app.js"></script><link rel="stylesheet" href="/purehome/assets/app.css">';
  const result = verify(html, { 'assets/app.js': 'console.log("ok")', 'assets/app.css': 'body{margin:0}' });
  assert.equal(result.status, 0, result.stderr);
});

test('rejects missing CSS even when JavaScript is present', () => {
  const html = '<script src="/purehome/assets/app.js"></script><link rel="stylesheet" href="/purehome/assets/missing.css">';
  const result = verify(html);
  assert.notEqual(result.status, 0);
});

test('accepts relative asset paths resolved under the Pages base', () => {
  const result = verify('<script type="module" src="./assets/app.js"></script>');
  assert.equal(result.status, 0, result.stderr);
});

test('rejects protocol-relative, traversal and encoded asset paths', () => {
  for (const src of [
    '//evil.example/purehome/assets/app.js',
    '/purehome/../assets/app.js',
    '/purehome/%2e%2e/assets/app.js',
    '/purehome/assets/%2e%2e%2fsecret.js',
    '/purehome/assets/%2Fapp.js'
  ]) {
    const result = verify('<script src="' + src + '"></script>');
    assert.notEqual(result.status, 0, src);
  }
});

test('rejects missing, empty, external and wrong-base bundles', () => {
  for (const html of [
    '<script src="/purehome/assets/missing.js"></script>',
    '<script src="/purehome/assets/app.js"></script>',
    '<script src="https://evil.example/purehome/assets/app.js"></script>',
    '<script src="/other/assets/app.js"></script>',
    '<link href="/purehome/assets/app.css" rel="stylesheet">'
  ]) {
    const files = html.includes('missing') ? {} : html.includes('app.js') && !html.includes('evil') && !html.includes('/other') ? { 'assets/app.js': '' } : {};
    const result = verify(html, files);
    assert.notEqual(result.status, 0, html);
  }
});
