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

  it.skipIf(!hasDist)('emits at least one .woff2 font as a separate asset', () => {
    const fonts = readdirSync(assets).filter((f) => f.endsWith('.woff2'));
    expect(fonts.length).toBeGreaterThan(0);
  });

  it.skipIf(!hasDist)('never inlines font data as a data: URI', () => {
    const built = readdirSync(assets).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
    expect(built.length).toBeGreaterThan(0);
    for (const file of built) {
      const text = readFileSync(resolve(assets, file), 'utf8');
      expect(text, `${file} contains an inlined font`).not.toMatch(/data:(application\/(x-)?font|font\/)/);
    }
  });
});
