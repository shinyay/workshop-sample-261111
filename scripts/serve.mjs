import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, ROOT } from './content.mjs';

export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join('; ');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

export function createPreviewServer(directory = DIST) {
  const root = realpathSync(directory);
  const info = JSON.parse(readFileSync(path.join(root, 'build-info.json'), 'utf8'));
  assert(Array.isArray(info.files), 'preview: missing build file manifest; run npm run build');
  const allowed = new Set(info.files);
  for (const file of allowed) {
    assert(typeof file === 'string' && file && !file.includes('\\')
      && !file.split('/').some((part) => !part || part === '.' || part === '..'), 'preview: invalid manifest path');
  }
  return createServer((request, response) => {
    response.setHeader('Content-Security-Policy', CSP);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (!/^127\.0\.0\.1:\d+$/.test(request.headers.host ?? '')) {
      response.writeHead(403);
      response.end('Use the loopback URL printed by this preview server');
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Read-only preview');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(request.url.split('?')[0]);
    } catch (error) {
      console.error(`Rejected malformed preview URL: ${error.message}`);
      response.writeHead(400);
      response.end('Invalid URL');
      return;
    }
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0')
      || pathname.split('/').some((part) => part === '.' || part === '..')) {
      response.writeHead(400);
      response.end('Invalid path');
      return;
    }
    if (pathname === '/') {
      response.writeHead(302, { Location: '/workshop/workshop.md' });
      response.end();
      return;
    }
    const relative = pathname === '/workshop/workshop.md' ? 'index.html' : pathname.slice(1);
    if (!allowed.has(relative)) {
      response.writeHead(404);
      response.end('Not part of this generated workshop');
      return;
    }
    try {
      const file = realpathSync(path.join(root, ...relative.split('/')));
      assert(file.startsWith(`${root}${path.sep}`), 'preview: file escaped output directory');
      const bytes = readFileSync(file);
      response.writeHead(200, {
        'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream',
        'Content-Length': bytes.length
      });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      console.error(`Preview read failed for ${relative}: ${error.stack ?? error.message}`);
      response.writeHead(500);
      response.end('Cannot read generated workshop; rebuild and retry');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    assert(args.length === 0 || (args.length === 2 && args[0] === '--port'), 'Usage: node scripts/serve.mjs [--port PORT]');
    const port = args.length ? Number(args[1]) : 4445;
    assert(Number.isInteger(port) && port >= 0 && port <= 65535, 'Port must be an integer from 0 to 65535');
    const server = createPreviewServer();
    server.on('error', (error) => {
      console.error(`Preview server failed: ${error.stack ?? error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}/workshop/workshop.md`;
      mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
      writeFileSync(path.join(ROOT, '.cache', 'preview.json'), `${JSON.stringify({ url, pid: process.pid }, null, 2)}\n`);
      console.log(`MOAW preview: ${url}\nPID: ${process.pid}\nStop this server with Ctrl+C.`);
    });
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
