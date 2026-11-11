import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createPreviewServer } from '../serve.mjs';
import { DIST, ROOT, loadWorkshop, sha256 } from '../content.mjs';
import { presentationSettings } from '../build.mjs';

let server;
let port;
test.before(async () => {
  server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  port = server.address().port;
});
test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

function get(target, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: target, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

test('preview serves the actual workshop with tracking removed and restricted network policy', async () => {
  const root = await get('/');
  assert.equal(root.status, 302);
  assert.equal(root.headers.location, '/workshop/workshop.md');
  const html = await get('/workshop/workshop.md?step=3');
  assert.equal(html.status, 200);
  const settings = presentationSettings(loadWorkshop().meta);
  assert(html.body.includes(`<title>${settings.title}</title>`));
  const config = html.body.match(/<script id="workshop-presentation-settings" type="application\/json">([^<]+)<\/script>/);
  assert(config, 'presentation settings must be included in the shell');
  assert.deepEqual(JSON.parse(config[1]), settings);
  assert(!html.body.includes('clarity.ms'));
  assert.match(html.headers['content-security-policy'], /connect-src 'self'/);
  assert.equal(html.headers['referrer-policy'], 'no-referrer');
  const content = await get('/workshops/workshop.md');
  assert.equal(content.status, 200);
  assert.match(content.body, /^## 8-1\uff5c/m);
  assert.equal(sha256(Buffer.from(content.body)), JSON.parse(readFileSync(path.join(DIST, 'build-info.json'), 'utf8')).contentSha256);
});

test('local presentation assets and the workshop version match the build sources', async () => {
  const info = JSON.parse(readFileSync(path.join(DIST, 'build-info.json'), 'utf8'));
  assert.equal(info.workshopVersion, loadWorkshop().meta.workshop_version);
  assert.deepEqual(Object.keys(info.presentation).sort(), ['workshop-presentation.css', 'workshop-presentation.js']);
  for (const [file, hash] of Object.entries(info.presentation)) {
    assert(info.files.includes(file), `missing served presentation asset: ${file}`);
    const response = await get(`/${file}`);
    assert.equal(response.status, 200);
    assert.match(response.headers['content-type'], file.endsWith('.js') ? /text\/javascript/ : /text\/css/);
    assert.equal(sha256(Buffer.from(response.body)), hash);
    assert.equal(sha256(readFileSync(path.join(ROOT, 'scripts', 'viewer', file))), hash);
  }
});

test('unlisted files, outside paths, writes and untrusted hosts are not served', async () => {
  for (const target of ['/.git/config', '/package.json', '/.cache/preview.json', '/workshops/no-such.md', '/workshop/other.md']) {
    assert.equal((await get(target)).status, 404, target);
  }
  for (const target of ['/../README.md', '/%2e%2e/README.md', '/%5c..%5cREADME.md', '/%00', '/%zz']) {
    assert.equal((await get(target)).status, 400, target);
  }
  assert.equal((await get('/workshops/workshop.md', 'POST')).status, 405);
  assert.equal((await get('/workshops/workshop.md', 'GET', { Host: 'untrusted.example' })).status, 403);
  const head = await get('/workshops/workshop.md', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});

test('all official JS and CSS remain byte-identical to the pinned distribution', () => {
  const info = JSON.parse(readFileSync(path.join(DIST, 'build-info.json'), 'utf8'));
  for (const [relative, hash] of Object.entries(info.upstream)) {
    assert.equal(sha256(readFileSync(path.join(DIST, ...relative.split('/')))), hash);
    assert.equal(sha256(readFileSync(path.join(ROOT, 'node_modules', '@moaw', 'cli', 'dist', 'website', ...relative.split('/')))), hash);
  }
});
