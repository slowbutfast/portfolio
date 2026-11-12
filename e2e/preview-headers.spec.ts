import { test, expect } from '@playwright/test';
import { SPEC_CSP, cspEquals } from '../src/utils/csp';

/**
 * Asserts the headers a real Vercel deployment serves against the
 * edge-deployment spec. `vite dev` applies no `vercel.json` headers, so this
 * only means something against a deployment: it runs when PREVIEW_URL is set.
 */
test.describe('served edge headers', () => {
  test.skip(!process.env.PREVIEW_URL, 'preview-only: requires PREVIEW_URL');

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'headers do not depend on the viewport');
  });

  test('serves the specified Content-Security-Policy as a directive set', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const csp = response.headers()['content-security-policy'];
    expect(csp, 'Content-Security-Policy header missing').toBeDefined();
    expect(cspEquals(csp, SPEC_CSP), `served CSP differs from spec:\n${csp}`).toBe(true);
  });

  test('serves the other specified security headers', async ({ request }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  });

  test('serves no bundled webfont assets after the native-font migration', async ({ page }) => {
    const fonts: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (!url.split('?')[0].endsWith('.woff2')) return;
      fonts.push(url);
    });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(fonts, 'native Helvetica/Menlo stacks should not request webfonts').toEqual([]);
  });

  test('does not long-cache the entry document', async ({ request }) => {
    for (const path of ['/', '/index.html']) {
      const cache = (await request.get(path)).headers()['cache-control'] ?? '';
      const maxAge = /max-age=(\d+)/.exec(cache)?.[1];
      expect(Number(maxAge ?? 0), `${path} Cache-Control: ${cache}`).toBeLessThan(3600);
      expect(cache, path).not.toContain('immutable');
    }
  });

  test('returns a real 404 for a missing asset', async ({ request }) => {
    const response = await request.get('/assets/does-not-exist.woff2');
    expect(response.status()).toBe(404);
  });
});
