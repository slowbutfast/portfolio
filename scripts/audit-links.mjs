#!/usr/bin/env node
/**
 * Standalone ESM link auditor.
 *
 * Browser-side link checking is blocked by CORS and the deployment CSP, so this
 * script runs in Node 22 with native `fetch`. The shared implementation lives
 * in `src/utils/linkAudit.ts` so the dev-only Studio plugin and this CLI audit
 * with identical DNS/redirect hardening.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildPinnedRequestOptions,
  checkUrl,
  classifyStatus,
  extractUniqueUrls,
  extractUrlsFromSource,
  isValidEmail,
  URL_PATTERN,
} from '../src/utils/linkAudit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const TARGET_FILES = ['src/data/projects.catalog.json', 'src/data/profile.ts'];

export {
  buildPinnedRequestOptions,
  checkUrl,
  classifyStatus,
  extractUniqueUrls,
  extractUrlsFromSource,
  isValidEmail,
  URL_PATTERN,
};

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
    console.log(
      `${label} ${String(status).padEnd(4)} ${url}${result.error ? ` (${result.error})` : ''}`,
    );
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
