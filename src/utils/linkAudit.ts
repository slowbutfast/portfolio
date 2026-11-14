/**
 * Shared link auditor used by both `scripts/audit-links.mjs` and the dev-only
 * Studio plugin. Performs manual redirect traversal with DNS resolution and
 * blocks loopback / private / link-local / reserved targets on every hop.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const URL_PATTERN = /https?:\/\/[^\s"'`<>]+/g;

export type LinkOutcome = 'pass' | 'warning' | 'fail';

export interface LinkCheckResult {
  url: string;
  status: number;
  outcome: LinkOutcome;
  attempts: number;
  latencyMs: number;
  finalUrl?: string;
  blocked?: boolean;
  error?: string;
}

export interface LinkCheckOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retries?: number;
  maxRedirects?: number;
  resolveImpl?: (hostname: string) => Promise<string[]>;
  userAgent?: string;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; portfolio-link-auditor/1.0; +https://github.com/slowbutfast)';

/** Extract absolute http(s) URLs from TypeScript/JSON source text. */
export function extractUrlsFromSource(source: string): string[] {
  const matches = source.match(URL_PATTERN) ?? [];
  return matches
    .map((url) => url.replace(/[.,;:)\]}]+$/, ''))
    .filter((url) => url.startsWith('http://') || url.startsWith('https://'));
}

export function extractUniqueUrls(sources: readonly string[]): string[] {
  const urls = new Set<string>();
  for (const source of sources) {
    for (const url of extractUrlsFromSource(source)) urls.add(url);
  }
  return [...urls].sort();
}

/** Classify an HTTP status as pass, warning, or fail. */
export function classifyStatus(status: number): LinkOutcome {
  if (status >= 200 && status < 400) return 'pass';
  if (status === 999 || status === 429 || status === 403 || status === 401) {
    return 'warning';
  }
  return 'fail';
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function ipv4Octets(address: string): number[] | null {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
}

function isPrivateIpv4(octets: number[]): boolean {
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const value = address.toLowerCase().split('%')[0];
  if (value === '::' || value === '::1') return true;
  if (value.startsWith('fc') || value.startsWith('fd')) return true;
  if (value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')) {
    return true;
  }
  if (value.startsWith('ff')) return true;
  if (value.startsWith('2001:db8')) return true;
  // IPv4-mapped forms: `::ffff:127.0.0.1` and the normalized `::ffff:7f00:1`.
  const mapped = value.match(/^::ffff:(.+)$/);
  if (mapped) {
    const tail = mapped[1];
    if (isIP(tail) === 4) {
      const octets = ipv4Octets(tail);
      return octets ? isPrivateIpv4(octets) : true;
    }
    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const high = parseInt(hex[1], 16);
      const low = parseInt(hex[2], 16);
      return isPrivateIpv4([high >> 8, high & 0xff, low >> 8, low & 0xff]);
    }
  }
  return false;
}

/** True when a literal host or resolved address must never be fetched. */
export function isBlockedAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, '');
  const family = isIP(normalized);
  if (family === 4) {
    const octets = ipv4Octets(normalized);
    return octets ? isPrivateIpv4(octets) : true;
  }
  if (family === 6) return isPrivateIpv6(normalized);
  // Non-IP values (e.g. decimal/integer hosts) are treated conservatively.
  return /^\d+$/.test(normalized) || /^0x[0-9a-f]+$/i.test(normalized);
}

async function defaultResolve(hostname: string): Promise<string[]> {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

async function assertSafeUrl(url: URL, resolveImpl: (hostname: string) => Promise<string[]>): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`blocked protocol ${url.protocol}`);
  }
  if (url.username || url.password) throw new Error('blocked credentialed URL');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  // Integer and decimal IPv4 notations (e.g. http://2130706433) bypass naive
  // string checks; reject them before DNS resolution.
  if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
    throw new Error('blocked numeric host');
  }
  const literalFamily = isIP(hostname);
  if (literalFamily) {
    if (isBlockedAddress(hostname)) throw new Error(`blocked private address ${hostname}`);
    return;
  }
  const addresses = await resolveImpl(hostname);
  if (addresses.length === 0) throw new Error(`could not resolve ${hostname}`);
  for (const address of addresses) {
    if (isBlockedAddress(address)) throw new Error(`blocked private address ${address}`);
  }
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  method: string,
  timeoutMs: number,
  userAgent: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': userAgent, accept: 'text/html,*/*' },
    });
  } finally {
    clearTimeout(timer);
  }
}

function redirectTarget(response: Response, current: string): string | null {
  const status = response.status;
  if (status < 300 || status >= 400) return null;
  const location = response.headers?.get?.('location');
  if (!location) return null;
  try {
    return new URL(location, current).href;
  } catch {
    return null;
  }
}

/**
 * Check a single URL. `fetchImpl`/`resolveImpl` are injectable so unit tests
 * never touch the network. Returns status, classification and latency.
 */
export async function checkUrl(
  url: string,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = 5000,
    retries = 2,
    maxRedirects = 5,
    resolveImpl = defaultResolve,
    userAgent = DEFAULT_USER_AGENT,
  }: LinkCheckOptions = {},
): Promise<LinkCheckResult> {
  const started = Date.now();
  const result = (partial: Partial<LinkCheckResult>): LinkCheckResult => ({
    url,
    status: 0,
    outcome: 'fail',
    attempts: 0,
    latencyMs: Date.now() - started,
    ...partial,
  });

  if (typeof fetchImpl !== 'function') {
    return result({ error: 'fetch unavailable' });
  }

  let lastError: string | null = null;
  const attempts = Math.max(1, retries + 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let current = url;
    try {
      for (let hop = 0; hop <= maxRedirects; hop += 1) {
        const parsed = new URL(current);
        await assertSafeUrl(parsed, resolveImpl);

        let response = await fetchWithTimeout(fetchImpl, current, 'HEAD', timeoutMs, userAgent);
        if (response.status === 405 || response.status === 403) {
          response = await fetchWithTimeout(fetchImpl, current, 'GET', timeoutMs, userAgent);
        }

        const next = redirectTarget(response, current);
        if (next) {
          if (hop >= maxRedirects) throw new Error(`too many redirects (max ${maxRedirects})`);
          current = next;
          continue;
        }

        const outcome = classifyStatus(response.status);
        if (outcome === 'pass' || outcome === 'warning') {
          return result({
            status: response.status,
            outcome,
            attempts: attempt,
            finalUrl: current,
          });
        }
        lastError = `HTTP ${response.status}`;
        if (response.status < 500) {
          return result({
            status: response.status,
            outcome,
            attempts: attempt,
            finalUrl: current,
          });
        }
        break;
      }
      if (lastError === null) {
        lastError = `too many redirects (max ${maxRedirects})`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith('blocked ')) {
        return result({ attempts: attempt, blocked: true, error: message });
      }
      lastError = message;
      if (error instanceof Error && error.name === 'AbortError') continue;
      // DNS failures are retryable, but protocol/URL errors are terminal.
      if (!/could not resolve/.test(message)) break;
    }
  }

  return result({ error: lastError ?? 'unknown error', attempts });
}
