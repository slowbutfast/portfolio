import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the production build output. These tests inspect `dist/`, so they run
 * after `npm run build`. Set REQUIRE_DIST=1 (CI does) to fail instead of skip
 * when `dist/` is absent.
 */
const dist = resolve(process.cwd(), 'dist');
const assets = resolve(dist, 'assets');
const hasDist = existsSync(assets);
const requireDist = process.env.REQUIRE_DIST === '1';

describe('production build output', () => {
  it('has a dist/assets directory when a build is required', () => {
    if (requireDist) expect(hasDist, 'run `npm run build` before this test').toBe(true);
  });

  it.skipIf(!hasDist)('ships no bundled webfonts after the native-font migration', () => {
    const fonts = readdirSync(assets).filter(
      (f) => f.endsWith('.woff2') || f.endsWith('.woff') || f.endsWith('.ttf'),
    );
    expect(fonts).toEqual([]);
  });

  it.skipIf(!hasDist)('never inlines font data as a data: URI', () => {
    const built = readdirSync(assets).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
    expect(built.length).toBeGreaterThan(0);
    for (const file of built) {
      const text = readFileSync(resolve(assets, file), 'utf8');
      expect(text, `${file} contains an inlined font`).not.toMatch(/data:(application\/(x-)?font|font\/)/);
    }
  });

  it.skipIf(!hasDist)('keeps Studio UI out of the main portfolio chunk', () => {
    const mainChunks = readdirSync(assets).filter(
      (file) => /^index-.*\.js$/.test(file),
    );
    expect(mainChunks.length).toBeGreaterThan(0);
    for (const file of mainChunks) {
      const text = readFileSync(resolve(assets, file), 'utf8');
      expect(text, `${file} contains Studio UI`).not.toContain('studio-app');
      expect(text, `${file} contains Studio UI`).not.toContain('Sign in with GitHub');
    }
    const studioChunk = readdirSync(assets).find((file) => /^StudioApp-.*\.js$/.test(file));
    expect(studioChunk, 'StudioApp must remain a lazy chunk').toBeTruthy();
  });

  it.skipIf(!hasDist)('ships no secrets or dev middleware in dist', () => {
    const files = readdirSync(dist, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => resolve(entry.parentPath, entry.name));
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(
        /GITHUB_PAT|GITHUB_CLIENT_SECRET|STUDIO_SESSION_SECRET|\/__studio\/api/,
      );
    }
  });

  it('keeps the deployment CSP unchanged', () => {
    const config = JSON.parse(readFileSync(resolve(dist, '..', 'vercel.json'), 'utf8')) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const global = config.headers.find((entry) => entry.source === '/(.*)');
    const csp = global?.headers.find((header) => header.key === 'Content-Security-Policy');
    expect(csp?.value).toContain("connect-src 'self'");
    expect(csp?.value).toContain("img-src 'self'");
    expect(csp?.value).toContain("media-src 'self'");
    expect(csp?.value).toContain("default-src 'self'");
  });
});
