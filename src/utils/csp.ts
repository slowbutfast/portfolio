/**
 * Content Security Policy specified by `openspec/specs/edge-deployment/spec.md`
 * ("Strict Content Security Policy and security headers"). `vercel.json` and the
 * deployed response headers are both compared against this single constant.
 */
export const SPEC_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; frame-src 'self' https://drive.google.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'";

export type CspDirectives = Map<string, string[]>;

/** Parse a CSP header value into directive name -> sorted source list. */
export function parseCsp(value: string): CspDirectives {
  const directives: CspDirectives = new Map();
  for (const raw of value.split(';')) {
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    const [name, ...sources] = parts;
    directives.set(name.toLowerCase(), [...sources].sort());
  }
  return directives;
}

/** True when both policies declare the same directives with the same sources, ignoring order. */
export function cspEquals(a: string, b: string): boolean {
  const left = parseCsp(a);
  const right = parseCsp(b);
  if (left.size !== right.size) return false;
  for (const [name, sources] of left) {
    const other = right.get(name);
    if (!other || other.length !== sources.length) return false;
    if (sources.some((source, i) => source !== other[i])) return false;
  }
  return true;
}

/** Cache-Control value required for content-hashed assets under /assets/. */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
