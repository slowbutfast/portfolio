import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Plain Node ESM script; types live in scripts/audit-links.d.mts.
import {
  checkUrl,
  classifyStatus,
  extractUniqueUrls,
  extractUrlsFromSource,
  isValidEmail,
} from '../../scripts/audit-links.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

function readSource(relative: string): string {
  return readFileSync(resolve(repoRoot, relative), 'utf8');
}

function mockResponse(status: number) {
  return { status, ok: status >= 200 && status < 300 };
}

describe('URL extraction', () => {
  it('finds repository, live, and profile URLs in the real TypeScript sources', () => {
    const projectsSource = readSource('src/data/projects.ts');
    const profileSource = readSource('src/data/profile.ts');
    const urls = extractUniqueUrls([projectsSource, profileSource]);

    expect(urls).toContain('https://github.com/slowbutfast/open-dungeon');
    expect(urls).toContain('https://github.com/slowbutfast/kintsugi-fracture');
    expect(urls).toContain('https://kintsugi-fracture.vercel.app/');
    expect(urls).toContain('https://www.ivyfilmfestival.org/');
    expect(urls).toContain('https://github.com/slowbutfast');
    expect(urls).toContain('https://www.linkedin.com/in/gregory-lazatin/');
    expect(urls.some((url) => url.startsWith('mailto:'))).toBe(false);
  });

  it('deduplicates repeated URLs and strips trailing punctuation', () => {
    const source = `{ a: 'https://example.com/a', b: 'https://example.com/a', c: 'https://example.com/b).' }`;
    expect(extractUrlsFromSource(source)).toEqual([
      'https://example.com/a',
      'https://example.com/a',
      'https://example.com/b',
    ]);
    expect(extractUniqueUrls([source])).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ]);
  });
});

describe('status classification', () => {
  it('passes 2xx/3xx, warns on rate limits and unauthenticated walls, fails 404/5xx', () => {
    expect(classifyStatus(200)).toBe('pass');
    expect(classifyStatus(301)).toBe('pass');
    expect(classifyStatus(999)).toBe('warning');
    expect(classifyStatus(429)).toBe('warning');
    expect(classifyStatus(403)).toBe('warning');
    expect(classifyStatus(404)).toBe('fail');
    expect(classifyStatus(500)).toBe('fail');
  });
});

describe('checkUrl with injected fetch', () => {
  it('classifies 200 and 301 as pass', async () => {
    const ok = await checkUrl('https://example.com', {
      fetchImpl: async () => mockResponse(200),
      retries: 0,
    });
    expect(ok).toMatchObject({ status: 200, outcome: 'pass', attempts: 1 });

    const redirect = await checkUrl('https://example.com/redirect', {
      fetchImpl: async () => mockResponse(301),
      retries: 0,
    });
    expect(redirect.outcome).toBe('pass');
  });

  it('classifies 999 and 429 as warnings and 404 as a failure', async () => {
    const linkedin = await checkUrl('https://www.linkedin.com/in/example', {
      fetchImpl: async () => mockResponse(999),
      retries: 0,
    });
    expect(linkedin.outcome).toBe('warning');
    expect(linkedin.status).toBe(999);

    const limited = await checkUrl('https://example.com/limited', {
      fetchImpl: async () => mockResponse(429),
      retries: 0,
    });
    expect(limited.outcome).toBe('warning');

    const missing = await checkUrl('https://example.com/missing', {
      fetchImpl: async () => mockResponse(404),
      retries: 2,
    });
    expect(missing.outcome).toBe('fail');
    expect(missing.status).toBe(404);
  });

  it('falls back from HEAD to GET when HEAD is rejected', async () => {
    const methods: string[] = [];
    const result = await checkUrl('https://example.com/head-blocked', {
      fetchImpl: async (_url: string, init?: { method?: string }) => {
        const method = init?.method ?? 'GET';
        methods.push(method);
        return mockResponse(method === 'HEAD' ? 405 : 200);
      },
      retries: 0,
    });
    expect(methods).toEqual(['HEAD', 'GET']);
    expect(result.outcome).toBe('pass');
    expect(result.status).toBe(200);
  });

  it('retries transient server failures and eventually fails', async () => {
    let calls = 0;
    const result = await checkUrl('https://example.com/flaky', {
      fetchImpl: async () => {
        calls += 1;
        return mockResponse(503);
      },
      retries: 2,
    });
    expect(calls).toBe(3);
    expect(result.outcome).toBe('fail');
  });

  it('honors the timeout without making a live request', async () => {
    const fetchImpl = (_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<{ status: number }>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    const result = await checkUrl('https://example.com/slow', {
      fetchImpl,
      timeoutMs: 5,
      retries: 0,
    });
    expect(result.outcome).toBe('fail');
    expect(result.error).toBeTruthy();
  });
});

describe('email validation', () => {
  it('accepts the real candidate email and rejects malformed values', () => {
    const profile = readSource('src/data/profile.ts');
    const email = profile.match(/mailto:([^\s'"]+)/)?.[1] ?? '';
    expect(isValidEmail(email)).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });
});
