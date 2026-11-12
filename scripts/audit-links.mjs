#!/usr/bin/env node
/**
 * Standalone ESM link auditor.
 *
 * Browser-side link checking is blocked by CORS and the deployment CSP, so this
 * script runs in Node 22 with native `fetch`. It performs a HEAD request first,
 * falls back to GET for servers that reject HEAD, retries transient failures,
 * and treats LinkedIn's unauthenticated 999 response as a warning rather than
 * an outage.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const TARGET_FILES = ['src/data/projects.ts', 'src/data/profile.ts'];
const USER_AGENT =
  'Mozilla/5.0 (compatible; portfolio-link-auditor/1.0; +https://github.com/slowbutfast)';

export const URL_PATTERN = /https?:\/\/[^\s"'`<>]+/g;

/** Extract absolute http(s) URLs from TypeScript source text. */
export function extractUrlsFromSource(source) {
  const matches = source.match(URL_PATTERN) ?? [];
  return matches
    .map((url) => url.replace(/[.,;:)\]}]+$/, ''))
    .filter((url) => url.startsWith('http://') || url.startsWith('https://'));
}

export function extractUniqueUrls(sources) {
  const urls = new Set();
  for (const source of sources) {
    for (const url of extractUrlsFromSource(source)) urls.add(url);
  }
  return [...urls].sort();
}

/** Classify an HTTP status as pass, warning, or fail. */
export function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'pass';
  if (status === 999 || status === 429 || status === 403 || status === 401) {
    return 'warning';
  }
  return 'fail';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function fetchWithTimeout(fetchImpl, url, method, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check a single URL. `fetchImpl` is injectable so unit tests never touch the
 * network. Returns `{ url, status, outcome, attempts, error }`.
 */
export async function checkUrl(
  url,
  { fetchImpl = globalThis.fetch, timeoutMs = 5000, retries = 2 } = {},
) {
  if (typeof fetchImpl !== 'function') {
    return { url, status: 0, outcome: 'fail', attempts: 0, error: 'fetch unavailable' };
  }

  let lastError = null;
  const attempts = Math.max(1, retries + 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      let response = await fetchWithTimeout(fetchImpl, url, 'HEAD', timeoutMs);
      if (response.status === 405 || response.status === 403) {
        response = await fetchWithTimeout(fetchImpl, url, 'GET', timeoutMs);
      }
      const outcome = classifyStatus(response.status);
      if (outcome === 'pass' || outcome === 'warning') {
        return { url, status: response.status, outcome, attempts: attempt };
      }
      lastError = `HTTP ${response.status}`;
      if (response.status < 500) {
        return { url, status: response.status, outcome, attempts: attempt };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (error?.name === 'AbortError') continue;
    }
  }

  return {
    url,
    status: 0,
    outcome: 'fail',
    attempts,
    error: lastError ?? 'unknown error',
  };
}

export async function loadSourceUrls(root = ROOT) {
  const sources = await Promise.all(
    TARGET_FILES.map((file) => readFile(resolve(root, file), 'utf8')),
  );
  return extractUniqueUrls(sources);
}

async function main() {
  const urls = await loadSourceUrls();
  if (urls.length === 0) {
    console.error('No URLs found to audit.');
    process.exitCode = 1;
    return;
  }

  const profileSource = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
  const emailMatch = profileSource.match(/mailto:([^\s'"]+)/);
  const email = emailMatch?.[1] ?? '';
  if (!isValidEmail(email)) {
    console.error(`FAIL invalid profile email: ${email || '(missing)'}`);
    process.exitCode = 1;
  }

  const results = [];
  for (const url of urls) {
    const result = await checkUrl(url);
    results.push(result);
    const label = result.outcome.toUpperCase().padEnd(7);
    const status = result.status || 'ERR';
    console.log(`${label} ${String(status).padEnd(4)} ${url}${result.error ? ` (${result.error})` : ''}`);
  }

  const failures = results.filter((result) => result.outcome === 'fail');
  const warnings = results.filter((result) => result.outcome === 'warning');
  console.log(
    `\n${results.length} URLs: ${results.length - failures.length - warnings.length} pass, ${warnings.length} warning, ${failures.length} fail`,
  );
  if (failures.length > 0) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
