#!/usr/bin/env node
/**
 * Serve `dist/` locally with the response headers declared in `vercel.json`,
 * so the strict CSP can be exercised before a real deployment.
 *
 *   npm run build && node scripts/serve-with-vercel-headers.mjs
 *   PREVIEW_URL=http://localhost:5198 npx playwright test
 *
 * This is an approximation of the Vercel edge, not a replacement for it:
 *   - `vercel.json` header rules are applied (path patterns with `(.*)`).
 *   - No rewrites: unknown paths return a real 404 (matches the spec).
 *   - Entry documents get `Cache-Control: public, max-age=0, must-revalidate`,
 *     which is Vercel's documented default for static HTML (not verified here).
 */
import { createServer } from 'node:http';
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = join(root, 'dist');
const port = Number(process.env.PORT ?? 5198);
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

const escapeRegex = (text) => text.replace(/[.+?^${}|[\]\\]/g, '\\$&');
const toRegex = (source) =>
  new RegExp(`^${source.split('(.*)').map(escapeRegex).join('(.*)')}$`);
const rules = (config.headers ?? []).map((rule) => ({
  regex: toRegex(rule.source),
  headers: rule.headers,
}));

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const wanted = decoded === '/' ? '/index.html' : decoded;
  const file = normalize(join(dist, wanted));
  if (!file.startsWith(dist)) return null;
  try {
    return statSync(file).isFile() ? file : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0];
  const file = resolveFile(urlPath);
  const status = file ? 200 : 404;

  const headers = {};
  for (const rule of rules) {
    if (!rule.regex.test(urlPath)) continue;
    for (const { key, value } of rule.headers) headers[key] = value;
  }
  if (file) {
    headers['Content-Type'] = types[extname(file)] ?? 'application/octet-stream';
    if (!headers['Cache-Control'] && extname(file) === '.html') {
      headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    }
  } else {
    headers['Content-Type'] = 'text/plain; charset=utf-8';
  }

  res.writeHead(status, headers);
  if (!file) {
    res.end('Not Found');
    return;
  }
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving dist/ with vercel.json headers at http://localhost:${port}`);
});
