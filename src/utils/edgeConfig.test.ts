import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMMUTABLE_CACHE_CONTROL, SPEC_CSP, cspEquals, parseCsp } from './csp';

interface HeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

const root = process.cwd();
const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
  headers: HeaderRule[];
};
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

function headerValue(rule: HeaderRule | undefined, key: string): string | undefined {
  return rule?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
}

const globalRule = vercel.headers.find((r) => r.source === '/(.*)');

describe('vercel.json matches the edge-deployment spec', () => {
  it('has exactly one /assets/(.*) rule with the immutable Cache-Control value', () => {
    const rules = vercel.headers.filter((r) => r.source === '/assets/(.*)');
    expect(rules).toHaveLength(1);
    expect(headerValue(rules[0], 'Cache-Control')).toBe(IMMUTABLE_CACHE_CONTROL);
  });

  it('has no other rule that sets Cache-Control for assets', () => {
    const others = vercel.headers.filter(
      (r) => r.source !== '/assets/(.*)' && r.source.includes('/assets/'),
    );
    expect(others).toEqual([]);
  });

  it('serves the specified Content-Security-Policy as a directive set', () => {
    const csp = headerValue(globalRule, 'Content-Security-Policy');
    expect(csp, 'vercel.json must define a Content-Security-Policy').toBeDefined();
    expect(cspEquals(csp as string, SPEC_CSP)).toBe(true);
  });

  it('restricts script-src to exactly self', () => {
    const csp = headerValue(globalRule, 'Content-Security-Policy') as string;
    expect(parseCsp(csp).get('script-src')).toEqual(["'self'"]);
  });

  it('allows only self and Google Drive frames', () => {
    const csp = headerValue(globalRule, 'Content-Security-Policy') as string;
    expect(parseCsp(csp).get('frame-src')).toEqual(["'self'", 'https://drive.google.com']);
    expect(csp).toContain("frame-src 'self' https://drive.google.com;");
    expect(cspEquals(csp, SPEC_CSP)).toBe(true);
  });

  it('serves the other specified security headers', () => {
    expect(headerValue(globalRule, 'X-Content-Type-Options')).toBe('nosniff');
    expect(headerValue(globalRule, 'X-Frame-Options')).toBe('DENY');
    expect(headerValue(globalRule, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerValue(globalRule, 'Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
  });

  it('declares no catch-all rewrites', () => {
    expect((vercel as { rewrites?: unknown }).rewrites).toBeUndefined();
  });
});

describe('CSP comparison helper', () => {
  it('ignores directive order and whitespace', () => {
    const shuffled = SPEC_CSP.split(';').reverse().join(' ;  ');
    expect(cspEquals(shuffled, SPEC_CSP)).toBe(true);
  });

  it('rejects a policy that loosens style-src with unsafe-inline', () => {
    const loosened = SPEC_CSP.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
    expect(cspEquals(loosened, SPEC_CSP)).toBe(false);
  });

  it('rejects a policy that gains an extra directive', () => {
    expect(cspEquals(`${SPEC_CSP}; font-src 'self' data:`, SPEC_CSP)).toBe(false);
  });

  it('rejects a policy that drops a directive', () => {
    expect(cspEquals(SPEC_CSP.replace("object-src 'none'; ", ''), SPEC_CSP)).toBe(false);
  });
});

describe('package.json build script', () => {
  it('typechecks before building so a type error fails the deploy', () => {
    expect(pkg.scripts.build).toMatch(/^tsc --noEmit\s*&&\s*vite build$/);
  });
});
