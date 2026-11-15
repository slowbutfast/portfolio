/**
 * Shared link auditor used by both `scripts/audit-links.mjs` and the dev-only
 * Studio plugin. Pure ESM JavaScript so the CLI runs on any Node 22.x without
 * relying on TypeScript type stripping.
 *
 * Performs manual redirect traversal with DNS resolution, blocks loopback /
 * private / link-local / reserved targets on every hop, and pins the validated
 * IP on default Node HTTP/HTTPS connections to close the DNS-rebinding window.
 */
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';

export const URL_PATTERN = /https?:\/\/[^\s"'`<>]+/g;

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; portfolio-link-auditor/1.0; +https://github.com/slowbutfast)';

/** Extract absolute http(s) URLs from TypeScript/JSON source text. */
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

function ipv4Octets(address) {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
}

function isPrivateIpv4(octets) {
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

function isPrivateIpv6(address) {
  const value = address.toLowerCase().split('%')[0];
  if (value === '::' || value === '::1') return true;
  if (value.startsWith('fc') || value.startsWith('fd')) return true;
  if (
    value.startsWith('fe8') ||
    value.startsWith('fe9') ||
    value.startsWith('fea') ||
    value.startsWith('feb')
  ) {
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
export function isBlockedAddress(address) {
  const normalized = address.replace(/^\[|\]$/g, '');
  const family = isIP(normalized);
  if (family === 4) {
    const octets = ipv4Octets(normalized);
    return octets ? isPrivateIpv4(octets) : true;
  }
  if (family === 6) return isPrivateIpv6(normalized);
  return /^\d+$/.test(normalized) || /^0x[0-9a-f]+$/i.test(normalized);
}

/**
 * Prefer IPv4 addresses while preserving relative order. Some environments
 * resolve AAAA first without an IPv6 route; trying IPv4 first avoids reporting
 * a healthy link as failed, with IPv6 still available as a fallback.
 */
export function preferIpv4Addresses(addresses) {
  return [...addresses].sort((left, right) => {
    const leftV4 = isIP(left) === 4 ? 0 : 1;
    const rightV4 = isIP(right) === 4 ? 0 : 1;
    return leftV4 - rightV4;
  });
}

async function defaultResolve(hostname) {
  const records = await lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

/**
 * Validate a URL and return the address the socket must connect to. The
 * returned address is pinned for the actual request, so a second DNS lookup
 * cannot redirect the connection to a private range.
 */
async function resolveSafeTarget(url, resolveImpl) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`blocked protocol ${url.protocol}`);
  }
  if (url.username || url.password) throw new Error('blocked credentialed URL');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
    throw new Error('blocked numeric host');
  }
  const literalFamily = isIP(hostname);
  if (literalFamily) {
    if (isBlockedAddress(hostname)) throw new Error(`blocked private address ${hostname}`);
    return { addresses: [hostname] };
  }
  const addresses = await resolveImpl(hostname);
  if (addresses.length === 0) throw new Error(`could not resolve ${hostname}`);
  for (const address of addresses) {
    if (isBlockedAddress(address)) throw new Error(`blocked private address ${address}`);
  }
  return { addresses: preferIpv4Addresses(addresses) };
}

/**
 * Build Node `http`/`https` request options that connect to a validated IP while
 * preserving the URL's `Host` header and TLS SNI `servername`.
 */
export function buildPinnedRequestOptions(url, address) {
  const parsed = url instanceof URL ? url : new URL(url);
  const secure = parsed.protocol === 'https:';
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  return {
    module: secure ? 'https' : 'http',
    options: {
      hostname: address,
      port: parsed.port || (secure ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      headers: {
        Host: parsed.host,
        accept: 'text/html,*/*',
      },
      ...(secure ? { servername: hostname } : {}),
    },
  };
}

function responseLike(status, headers) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        const value = headers[name.toLowerCase()];
        return Array.isArray(value) ? value[0] ?? null : value ?? null;
      },
    },
  };
}

function abortError(message = 'request aborted') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function requestPinned(method, url, address, timeoutMs, userAgent, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const { module, options } = buildPinnedRequestOptions(url, address);
    const transport = module === 'https' ? https : http;
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const onAbort = () => request.destroy(abortError());
    const request = transport.request(
      {
        ...options,
        method,
        headers: { ...options.headers, 'user-agent': userAgent },
      },
      (response) => {
        response.resume();
        response.on('end', () => {
          cleanup();
          resolve(responseLike(response.statusCode ?? 0, response.headers));
        });
      },
    );
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) request.destroy(abortError());
    request.setTimeout(timeoutMs, () => {
      // Preserve the retry path used for internal timeout controllers.
      request.destroy(abortError('request timeout'));
    });
    request.on('error', (error) => {
      cleanup();
      reject(error);
    });
    request.end();
  });
}

async function fetchWithTimeout(fetchImpl, url, method, timeoutMs, userAgent, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onAbort, { once: true });
  try {
    return await fetchImpl(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': userAgent, accept: 'text/html,*/*' },
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function redirectTarget(response, current) {
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
 * never touch the network. Without a custom `fetchImpl`, the validated IP is
 * pinned on the Node HTTP/HTTPS socket.
 */
export async function checkUrl(
  url,
  {
    fetchImpl,
    timeoutMs = 5000,
    retries = 2,
    maxRedirects = 5,
    resolveImpl = defaultResolve,
    userAgent = DEFAULT_USER_AGENT,
    signal,
  } = {},
) {
  const started = Date.now();
  const result = (partial) => ({
    url,
    status: 0,
    outcome: 'fail',
    attempts: 0,
    latencyMs: Date.now() - started,
    ...partial,
  });

  if (signal?.aborted) return result({ error: 'request aborted' });

  let lastError = null;
  const attempts = Math.max(1, retries + 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) return result({ attempts: attempt, error: 'request aborted' });
    let current = url;
    try {
      for (let hop = 0; hop <= maxRedirects; hop += 1) {
        if (signal?.aborted) throw abortError();
        const parsed = new URL(current);
        const target = await resolveSafeTarget(parsed, resolveImpl);
        if (signal?.aborted) throw abortError();
        const request = async (method) => {
          if (fetchImpl) {
            return fetchWithTimeout(fetchImpl, current, method, timeoutMs, userAgent, signal);
          }
          let lastError = null;
          for (const address of target.addresses) {
            try {
              return await requestPinned(
                method,
                current,
                address,
                timeoutMs,
                userAgent,
                signal,
              );
            } catch (error) {
              lastError = error;
              if (error instanceof Error && error.name === 'AbortError') throw error;
            }
          }
          throw lastError ?? new Error('no address to connect');
        };

        let response = await request('HEAD');
        if (response.status === 405 || response.status === 403) {
          response = await request('GET');
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
      if (signal?.aborted) {
        return result({ attempts: attempt, error: 'request aborted' });
      }
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith('blocked ')) {
        return result({ attempts: attempt, blocked: true, error: message });
      }
      lastError = message;
      if (error instanceof Error && error.name === 'AbortError') continue;
      if (!/could not resolve/.test(message)) break;
    }
  }

  return result({ error: lastError ?? 'unknown error', attempts });
}
