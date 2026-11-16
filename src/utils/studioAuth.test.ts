import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, relative, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertCsrf,
  assertSameOrigin,
  clearAuthCookies,
  createPkcePair,
  csrfToken,
  openJson,
  pkceChallenge,
  readAuthConfig,
  requireConfig,
  sealJson,
  signSession,
  SESSION_COOKIE,
  TX_COOKIE,
  verifySession,
  type OAuthTransaction,
  type StudioEnv,
  type StudioSession,
} from '../../api/studio/_lib/auth';
import {
  createCallbackHandler,
} from '../../api/studio/callback';
import { createLoginHandler } from '../../api/studio/login';
import { createStateHandler } from '../../api/studio/state';
import { createLogoutHandler } from '../../api/studio/logout';
import { createAuditLinksHandler } from '../../api/studio/audit-links';
import {
  GitHubApiError,
  GitHubCatalogAdapter,
} from '../../api/studio/_lib/githubAdapter';
import { HttpError } from '../../api/studio/_lib/http';
import {
  CatalogConflictError,
  MAX_AUDIT_URLS,
  AuditTimeoutError,
  revisionOf,
  runBoundedAudit,
  type CatalogAdapter,
} from '../studio/catalogService';
import { deriveEdgesPure } from './graphEdges';
import { checkUrl } from './linkAudit.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const OWNER_ID = '424242';
const SECRET = 'unit-test-session-secret';
const CANONICAL_ORIGIN = 'https://studio.example.com';
const BASE_ENV: StudioEnv = {
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  STUDIO_OAUTH_REDIRECT_URI: `${CANONICAL_ORIGIN}/api/studio/callback`,
  STUDIO_OWNER_ID: OWNER_ID,
  STUDIO_SESSION_SECRET: SECRET,
  GITHUB_PAT: 'ghp_test',
  GITHUB_REPO: 'slowbutfast/portfolio',
  STUDIO_TARGET_BRANCH: 'studio/catalog',
};

interface MockResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  setHeader(name: string, value: string | string[]): void;
  end(body?: string): void;
}

function makeRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}): IncomingMessage {
  const request = Readable.from(
    options.body === undefined ? [] : [Buffer.from(options.body, 'utf8')],
  ) as unknown as IncomingMessage;
  request.method = options.method ?? 'GET';
  request.url = options.url ?? '/api/studio/state';
  request.headers = options.headers ?? {};
  return request;
}

function makeResponse(): MockResponse {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(body) {
      this.body = body ?? '';
    },
  };
}

function headersOf(response: MockResponse): string[] {
  const value = response.headers['set-cookie'];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function cookieValue(response: MockResponse, name: string): string | null {
  for (const cookie of headersOf(response)) {
    const match = cookie.match(new RegExp(`^${name}=([^;]*)`));
    if (match) return match[1];
  }
  return null;
}

async function invoke(
  handler: (req: IncomingMessage, res: ServerResponse) => unknown,
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<MockResponse> {
  const response = makeResponse();
  await handler(
    makeRequest(options),
    response as unknown as ServerResponse,
  );
  return response;
}

function sessionFixture(overrides: Partial<StudioSession> = {}): StudioSession {
  return {
    sub: OWNER_ID,
    sid: 'session-id-1',
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

function authHeaders(
  session: StudioSession = sessionFixture(),
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    host: 'studio.example.com',
    cookie: `${SESSION_COOKIE}=${signSession(session, SECRET)}`,
    origin: CANONICAL_ORIGIN,
    'x-studio-csrf': csrfToken(SECRET, session.sid),
    ...extra,
  };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function textResponse(value: string, status = 200): Response {
  return new Response(value, { status });
}

function walk(dir: string, base = dir): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, base));
    else files.push(relative(base, full).split('\\').join('/'));
  }
  return files;
}

describe('committed asset manifest', () => {
  it('matches src/assets and src/data/captured with zero drift', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(repoRoot, 'api/studio/_lib/asset-manifest.json'), 'utf8'),
    ) as { assetKeys: string[]; capturedKeys: string[] };
    const media = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm']);
    const assetKeys = walk(resolve(repoRoot, 'src/assets'))
      .filter((file) => media.has(extname(file).toLowerCase()))
      .sort();
    const capturedKeys = walk(resolve(repoRoot, 'src/data/captured'))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -'.json'.length))
      .sort();
    expect(manifest.assetKeys).toEqual(assetKeys);
    expect(manifest.capturedKeys).toEqual(capturedKeys);
  });

  it('keeps the pure server core free of catalog JSON and tag registry imports', () => {
    const pure = readFileSync(resolve(repoRoot, 'src/utils/graphEdges.ts'), 'utf8');
    expect(pure).not.toMatch(/projects\.catalog\.json|tagRegistry/);
    for (const file of ['src/data/catalogSchema.ts', 'src/studio/catalogService.ts']) {
      const source = readFileSync(resolve(repoRoot, file), 'utf8');
      expect(source, file).not.toMatch(/projects\.catalog\.json/);
      expect(source, file).not.toMatch(/tagRegistry/);
    }
    expect(readFileSync(resolve(repoRoot, 'src/data/catalogSchema.ts'), 'utf8')).toMatch(
      /from '\.\.\/utils\/graphEdges(?:\.js)?'/,
    );
  });

  it('derives edges without module-level catalog state', () => {
    const edges = deriveEdgesPure(
      [
        { id: 'a', tags: ['x', 'art'] },
        { id: 'b', tags: ['x'] },
        { id: 'c', tags: ['art'] },
      ],
      new Set(['art']),
    );
    expect(edges).toEqual([{ source: 'a', target: 'b', tags: ['x'] }]);
  });
});

describe('PKCE, session, and CSRF primitives', () => {
  it('builds RFC 7636 S256 PKCE challenges', () => {
    const pair = createPkcePair();
    expect(pair.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pair.challenge).toBe(
      createHash('sha256').update(pair.verifier).digest('base64url'),
    );
    expect(
      pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    ).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('signs 2h sessions, binds CSRF to the session id, and rejects tampering', () => {
    const session = sessionFixture();
    const token = signSession(session, SECRET);
    expect(verifySession(token, SECRET)).toEqual(session);
    expect(verifySession(token, 'other-secret')).toBeNull();
    expect(verifySession(`${token}tampered`, SECRET)).toBeNull();
    expect(verifySession(token, SECRET, session.exp + 1)).toBeNull();

    const csrf = csrfToken(SECRET, session.sid);
    expect(csrf).toBe(csrfToken(SECRET, session.sid));
    expect(csrf).not.toBe(csrfToken(SECRET, 'another-sid'));

    const sealed = sealJson({ state: 'state', verifier: 'verifier' }, SECRET);
    expect(openJson<OAuthTransaction>(sealed, SECRET)).toEqual({
      state: 'state',
      verifier: 'verifier',
    });
    expect(openJson(sealed, 'other-secret')).toBeNull();
  });

  it('rejects missing or malformed configuration deterministically', () => {
    expect(readAuthConfig(BASE_ENV)).toMatchObject({
      ownerId: OWNER_ID,
      branch: 'studio/catalog',
      canonicalOrigin: CANONICAL_ORIGIN,
    });
    const missing = { ...BASE_ENV };
    delete missing.STUDIO_SESSION_SECRET;
    expect(readAuthConfig(missing)).toBeNull();
    expect(readAuthConfig({ ...BASE_ENV, STUDIO_OWNER_ID: 'not-numeric' })).toBeNull();
    expect(
      readAuthConfig({
        ...BASE_ENV,
        STUDIO_OAUTH_REDIRECT_URI: 'https://studio.example.com/api/studio/*',
      }),
    ).toBeNull();
    expect(readAuthConfig({ ...BASE_ENV, STUDIO_TARGET_BRANCH: 'master' })).toBeNull();
    expect(readAuthConfig({ ...BASE_ENV, STUDIO_TARGET_BRANCH: 'main' })).toBeNull();
    expect(() => requireConfig(missing)).toThrowError(HttpError);
    try {
      requireConfig(missing);
    } catch (cause) {
      expect((cause as HttpError).status).toBe(503);
    }
  });

  it('enforces exact Origin and session-bound CSRF headers', () => {
    const config = readAuthConfig(BASE_ENV)!;
    const session = sessionFixture();
    const request = makeRequest({ headers: authHeaders(session) });
    expect(() => assertSameOrigin(request, config)).not.toThrow();
    expect(() => assertCsrf(request, config, session)).not.toThrow();

    expect(() =>
      assertSameOrigin(
        makeRequest({ headers: { origin: 'https://evil.example' } }),
        config,
      ),
    ).toThrowError(HttpError);
    expect(() =>
      assertCsrf(
        makeRequest({ headers: { ...authHeaders(session), 'x-studio-csrf': 'wrong' } }),
        config,
        session,
      ),
    ).toThrowError(HttpError);
  });

  it('clears both session and CSRF cookies', () => {
    const config = readAuthConfig(BASE_ENV)!;
    const cookies = clearAuthCookies(config);
    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) expect(cookie).toMatch(/Max-Age=0/);
  });
});

describe('OAuth handlers', () => {
  it('starts login with empty scope, exact redirect URI, and PKCE S256', async () => {
    const response = await invoke(createLoginHandler({ env: BASE_ENV }));
    expect(response.statusCode).toBe(302);
    const location = new URL(String(response.headers.location));
    expect(location.origin).toBe('https://github.com');
    expect(location.pathname).toBe('/login/oauth/authorize');
    expect(location.searchParams.get('scope')).toBe('');
    expect(String(response.headers.location)).toContain('scope=');
    expect(location.searchParams.get('redirect_uri')).toBe(
      BASE_ENV.STUDIO_OAUTH_REDIRECT_URI,
    );
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(location.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(location.searchParams.get('state')).toBeTruthy();
    const tx = cookieValue(response, TX_COOKIE);
    expect(tx).toBeTruthy();
    expect(headersOf(response).join(';')).toMatch(/HttpOnly/);
    expect(headersOf(response).join(';')).toMatch(/Path=\/api\/studio/);
    const parsedTx = openJson<OAuthTransaction & { exp?: number }>(tx!, SECRET)!;
    expect(typeof parsedTx.exp).toBe('number');
    expect(parsedTx.exp as number).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('returns 503 when OAuth/GitHub env is missing', async () => {
    const response = await invoke(createLoginHandler({ env: {} }));
    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body)).toEqual({ error: 'Studio is not configured' });
  });

  it('exchanges the code, discards the user token, and sets a 2h session', async () => {
    const login = await invoke(createLoginHandler({ env: BASE_ENV }));
    const location = new URL(String(login.headers.location));
    const tx = cookieValue(login, TX_COOKIE)!;
    const seen: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      seen.push(url);
      if (url === 'https://github.com/login/oauth/access_token') {
        return jsonResponse({ access_token: 'user-token-secret' });
      }
      if (url === 'https://api.github.com/user') {
        expect((init?.headers as Record<string, string>).Authorization).toBe(
          'Bearer user-token-secret',
        );
        return jsonResponse({ id: Number(OWNER_ID), login: 'slowbutfast' });
      }
      return textResponse('not found', 404);
    }) as typeof fetch;

    const callback = await invoke(
      createCallbackHandler({ env: BASE_ENV, fetchImpl }),
      {
        url: `/api/studio/callback?state=${encodeURIComponent(
          location.searchParams.get('state')!,
        )}&code=oauth-code`,
        headers: { cookie: `${TX_COOKIE}=${tx}` },
      },
    );
    expect(callback.statusCode).toBe(302);
    expect(callback.headers.location).toBe(`${CANONICAL_ORIGIN}/#/studio`);
    const cookies = headersOf(callback).join(';');
    expect(cookies).toMatch(new RegExp(`${SESSION_COOKIE}=`));
    expect(cookies).toMatch(/studio_csrf=/);
    expect(cookies).toMatch(/Max-Age=7200/);
    expect(cookies).toMatch(/studio_session=[^;]+; Path=\/api\/studio/);
    expect(cookies).toMatch(/studio_csrf=[^;]+; Path=\//);
    expect(cookies).not.toContain('user-token-secret');
    expect(callback.body).not.toContain('user-token-secret');
    expect(seen).toEqual([
      'https://github.com/login/oauth/access_token',
      'https://api.github.com/user',
    ]);
  });

  it('rejects a mismatched one-time state and always clears the transaction cookie', async () => {
    const response = await invoke(
      createCallbackHandler({ env: BASE_ENV, fetchImpl: (async () => textResponse('')) as typeof fetch }),
      {
        url: '/api/studio/callback?state=wrong&code=oauth-code',
        headers: {
          cookie: `${TX_COOKIE}=${sealJson(
            { state: 'expected', verifier: 'verifier', exp: Math.floor(Date.now() / 1000) + 600 },
            SECRET,
          )}`,
        },
      },
    );
    expect(response.statusCode).toBe(403);
    expect(headersOf(response).join(';')).toMatch(new RegExp(`${TX_COOKIE}=;`));
  });

  it('rejects an expired studio_oauth_tx with 403 and clears the cookie', async () => {
    const response = await invoke(
      createCallbackHandler({ env: BASE_ENV, fetchImpl: (async () => textResponse('')) as typeof fetch }),
      {
        url: '/api/studio/callback?state=expected&code=oauth-code',
        headers: {
          cookie: `${TX_COOKIE}=${sealJson(
            { state: 'expected', verifier: 'verifier', exp: Math.floor(Date.now() / 1000) - 1 },
            SECRET,
          )}`,
        },
      },
    );
    expect(response.statusCode).toBe(403);
    expect(headersOf(response).join(';')).toMatch(new RegExp(`${TX_COOKIE}=;`));
  });

  it('rejects a non-owner GitHub identity without issuing a session', async () => {
    const login = await invoke(createLoginHandler({ env: BASE_ENV }));
    const location = new URL(String(login.headers.location));
    const tx = cookieValue(login, TX_COOKIE)!;
    const fetchImpl = (async (input: RequestInfo | URL) => {
      if (String(input).includes('access_token')) return jsonResponse({ access_token: 't' });
      return jsonResponse({ id: 999 });
    }) as typeof fetch;
    const response = await invoke(
      createCallbackHandler({ env: BASE_ENV, fetchImpl }),
      {
        url: `/api/studio/callback?state=${location.searchParams.get('state')}&code=c`,
        headers: { cookie: `${TX_COOKIE}=${tx}` },
      },
    );
    expect(response.statusCode).toBe(403);
    expect(headersOf(response).join(';')).not.toMatch(new RegExp(`${SESSION_COOKIE}=[^;]`));
  });
});

describe('route enumeration and CSRF guards', () => {
  const modules = import.meta.glob('../../api/studio/*.ts', { eager: true }) as Record<
    string,
    { default: (req: IncomingMessage, res: ServerResponse) => unknown }
  >;
  const handlers = Object.entries(modules).filter(
    ([file]) => !/\/(login|callback|ping)\.ts$/.test(file),
  );

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('enumerates every auth-gated handler', () => {
    expect(handlers.map(([file]) => file.split('/').pop()).sort()).toEqual([
      'audit-links.ts',
      'logout.ts',
      'state.ts',
    ]);
  });

  it('returns 401 for every handler when unauthenticated', async () => {
    for (const key of Object.keys(BASE_ENV)) {
      vi.stubEnv(key, BASE_ENV[key] ?? '');
    }
    for (const [file, module] of handlers) {
      const response = await invoke(module.default, {
        method: 'GET',
        headers: { host: 'studio.example.com' },
      });
      expect(response.statusCode, file).toBe(401);
    }
  });

  it('returns 503 when configuration is missing', async () => {
    for (const key of Object.keys(BASE_ENV)) vi.stubEnv(key, '');
    const response = await invoke(handlers[0][1].default);
    expect(response.statusCode).toBe(503);
  });

  it('returns 503 for ping when unconfigured', async () => {
    for (const key of Object.keys(BASE_ENV)) vi.stubEnv(key, '');
    const ping = (await import('../../api/studio/ping')).default;
    const response = await invoke(ping);
    expect(response.statusCode).toBe(503);
  });

  it('rejects missing CSRF and cross-origin mutations with 403', async () => {
    vi.stubEnv('STUDIO_OAUTH_REDIRECT_URI', BASE_ENV.STUDIO_OAUTH_REDIRECT_URI!);
    vi.stubEnv('STUDIO_SESSION_SECRET', SECRET);
    vi.stubEnv('STUDIO_OWNER_ID', OWNER_ID);
    const session = sessionFixture();
    const missingCsrf = await invoke(createStateHandler({ env: BASE_ENV }), {
      method: 'PUT',
      headers: {
        host: 'studio.example.com',
        cookie: `${SESSION_COOKIE}=${signSession(session, SECRET)}`,
        origin: CANONICAL_ORIGIN,
      },
      body: '{}',
    });
    expect(missingCsrf.statusCode).toBe(403);

    const badOrigin = await invoke(createStateHandler({ env: BASE_ENV }), {
      method: 'PUT',
      headers: authHeaders(session, { origin: 'https://evil.example' }),
      body: '{}',
    });
    expect(badOrigin.statusCode).toBe(403);

    const accepted = await invoke(createStateHandler({ env: BASE_ENV }), {
      method: 'PUT',
      headers: authHeaders(session),
      body: '{}',
    });
    expect(accepted.statusCode).toBe(400);

    const audit = await invoke(createAuditLinksHandler({ env: BASE_ENV }), {
      method: 'POST',
      headers: {
        host: 'studio.example.com',
        cookie: `${SESSION_COOKIE}=${signSession(session, SECRET)}`,
        origin: CANONICAL_ORIGIN,
      },
    });
    expect(audit.statusCode).toBe(403);
  });

  it('logs out with cleared cookies for an authenticated owner', async () => {
    const response = await invoke(createLogoutHandler({ env: BASE_ENV }), {
      method: 'POST',
      headers: authHeaders(),
    });
    expect(response.statusCode).toBe(200);
    expect(headersOf(response).join(';')).toMatch(/Max-Age=0/);
  });
});

interface RecordedCall {
  method: string;
  path: string;
  search: string;
  body: string;
}

function githubFetch(options: {
  defaultBranch: string;
  targetAhead: boolean;
  targetExists?: boolean;
  patchStatuses?: number[];
  createStatus?: number;
  putStatus?: number;
  putBody?: string;
  catalogBytes: string;
  targetBytes?: string;
}) {
  const calls: RecordedCall[] = [];
  const patchStatuses = [...(options.patchStatuses ?? [200])];
  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    const accept = String(
      (init.headers as Record<string, string> | undefined)?.Accept ?? '',
    );
    calls.push({
      method,
      path: url.pathname,
      search: url.search,
      body: typeof init.body === 'string' ? init.body : '',
    });
    const repo = `/repos/slowbutfast/portfolio`;

    if (method === 'GET' && url.pathname === repo) {
      return jsonResponse({ default_branch: options.defaultBranch });
    }
    if (method === 'GET' && url.pathname === `${repo}/git/ref/heads/${options.defaultBranch}`) {
      return jsonResponse({ object: { sha: 'base-sha' } });
    }
    if (method === 'GET' && url.pathname === `${repo}/git/ref/heads/studio/catalog`) {
      if (options.targetExists === false) return textResponse('Not Found', 404);
      return jsonResponse({ object: { sha: 'target-sha' } });
    }
    if (
      method === 'GET' &&
      url.pathname.startsWith(`${repo}/contents/src/data/projects.catalog.json`)
    ) {
      if (accept.includes('raw')) {
        return textResponse(options.catalogBytes);
      }
      const ref = url.searchParams.get('ref');
      const bytes =
        ref === 'studio/catalog'
          ? options.targetBytes ?? options.catalogBytes
          : options.catalogBytes;
      return jsonResponse({
        sha: revisionOf(bytes),
        content: Buffer.from(bytes, 'utf8').toString('base64'),
        encoding: 'base64',
      });
    }
    if (method === 'GET' && url.pathname.startsWith(`${repo}/contents/src/data/profile.ts`)) {
      return textResponse("export const email = 'a@b.co';");
    }
    if (method === 'PATCH' && url.pathname === `${repo}/git/refs/heads/studio/catalog`) {
      const status = patchStatuses.shift() ?? 200;
      return status === 200
        ? jsonResponse({ object: { sha: 'base-sha' } })
        : textResponse('Not Found', status);
    }
    if (method === 'POST' && url.pathname === `${repo}/git/refs`) {
      const status = options.createStatus ?? 201;
      return status < 300
        ? jsonResponse({ ref: 'refs/heads/studio/catalog' }, status)
        : textResponse(
            status === 422 ? 'Reference already exists' : 'failed',
            status,
          );
    }
    if (method === 'PUT' && url.pathname.startsWith(`${repo}/contents/src/data/projects.catalog.json`)) {
      const status = options.putStatus ?? 201;
      return status < 300
        ? jsonResponse({ content: { sha: 'new-file-sha' } }, status)
        : textResponse(options.putBody ?? 'conflict', status);
    }
    return textResponse(`unhandled ${method} ${url.pathname}`, 404);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const CATALOG_BYTES = '{\n  "projects": []\n}\n';

describe('GitHubCatalogAdapter branch lifecycle', () => {
  it('reads studio/catalog only when it is ahead of the dynamic default branch', async () => {
    const ahead = githubFetch({
      defaultBranch: 'main',
      targetAhead: true,
      catalogBytes: CATALOG_BYTES,
      targetBytes: '{"ahead":true}',
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: ahead.fetchImpl,
    });
    const result = await adapter.readCatalog();
    expect(result.branch).toBe('studio/catalog');
    expect(result.bytes).toBe('{"ahead":true}');
    expect(result.revision).toBe(revisionOf('{"ahead":true}'));
    expect(ahead.calls.some((call) => call.path.endsWith('/git/ref/heads/main'))).toBe(true);

    const behind = githubFetch({
      defaultBranch: 'trunk',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
    });
    const fallback = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: behind.fetchImpl,
    });
    const fallbackResult = await fallback.readCatalog();
    expect(fallbackResult.branch).toBe('trunk');
    expect(fallbackResult.revision).toBe(revisionOf(CATALOG_BYTES));
  });

  it('resets the preview ref to the base head then commits the catalog', async () => {
    const script = githubFetch({
      defaultBranch: 'main',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: script.fetchImpl,
    });
    const result = await adapter.writeCatalog(revisionOf(CATALOG_BYTES), CATALOG_BYTES);
    expect(result).toMatchObject({ revision: 'new-file-sha', branch: 'studio/catalog' });
    const patch = script.calls.find(
      (call) => call.method === 'PATCH' && call.path.endsWith('/git/refs/heads/studio/catalog'),
    );
    expect(patch?.body).toContain('"sha":"base-sha"');
    expect(patch?.body).toContain('"force":true');
    const put = script.calls.find((call) => call.method === 'PUT');
    expect(put?.body).toContain(Buffer.from(CATALOG_BYTES).toString('base64'));
    expect(put?.body).toContain(`"sha":"${revisionOf(CATALOG_BYTES)}"`);
    expect(put?.body).toContain('"branch":"studio/catalog"');
  });

  it('treats a concurrent 422 Reference already exists as success', async () => {
    const script = githubFetch({
      defaultBranch: 'main',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
      patchStatuses: [404, 200],
      createStatus: 422,
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: script.fetchImpl,
    });
    await expect(
      adapter.writeCatalog(revisionOf(CATALOG_BYTES), CATALOG_BYTES),
    ).resolves.toMatchObject({ branch: 'studio/catalog' });
    expect(script.calls.filter((call) => call.method === 'PATCH')).toHaveLength(2);
    expect(script.calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it('maps 409 and SHA-mismatch 422 to CatalogConflictError, preserving other 422s', async () => {
    for (const [status, body] of [
      [409, 'conflict'],
      [422, 'sha does not match'],
    ] as const) {
      const script = githubFetch({
        defaultBranch: 'main',
        targetAhead: false,
        catalogBytes: CATALOG_BYTES,
        putStatus: status,
        putBody: body,
      });
      const adapter = new GitHubCatalogAdapter({
        repo: 'slowbutfast/portfolio',
        pat: 'pat',
        fetchImpl: script.fetchImpl,
      });
      await expect(
        adapter.writeCatalog(revisionOf(CATALOG_BYTES), CATALOG_BYTES),
      ).rejects.toBeInstanceOf(CatalogConflictError);
    }

    const validation = githubFetch({
      defaultBranch: 'main',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
      putStatus: 422,
      putBody: 'Validation Failed',
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: validation.fetchImpl,
    });
    await expect(
      adapter.writeCatalog(revisionOf(CATALOG_BYTES), CATALOG_BYTES),
    ).rejects.toBeInstanceOf(GitHubApiError);
  });

  it('rejects a stale expectedRevision before touching the preview ref', async () => {
    const script = githubFetch({
      defaultBranch: 'main',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: script.fetchImpl,
    });
    await expect(adapter.writeCatalog('stale', CATALOG_BYTES)).rejects.toBeInstanceOf(
      CatalogConflictError,
    );
    expect(script.calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('refuses to write when STUDIO_TARGET_BRANCH equals the default branch', async () => {
    const script = githubFetch({
      defaultBranch: 'studio/catalog',
      targetAhead: false,
      catalogBytes: CATALOG_BYTES,
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: script.fetchImpl,
    });
    await expect(
      adapter.writeCatalog(revisionOf(CATALOG_BYTES), CATALOG_BYTES),
    ).rejects.toMatchObject({ status: 503 });
    expect(script.calls.some((call) => call.method === 'PATCH')).toBe(false);
  });
});

describe('PATCH-02: external cancellation and error extraction', () => {
  it('aborts a real checkUrl request and stops retries on the external signal', async () => {
    const controller = new AbortController();
    let seenSignal: AbortSignal | undefined;
    const abortError = () => Object.assign(new Error('request aborted'), { name: 'AbortError' });
    const fetchImpl = ((_url: RequestInfo | URL, init?: RequestInit) => {
      seenSignal = init?.signal ?? undefined;
      if (seenSignal?.aborted) return Promise.reject(abortError());
      return new Promise((_resolve, reject) => {
        seenSignal?.addEventListener('abort', () => reject(abortError()), { once: true });
      });
    }) as typeof fetch;

    const pending = checkUrl('https://example.com', {
      fetchImpl,
      resolveImpl: async () => ['93.184.216.34'],
      retries: 2,
      timeoutMs: 500,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 20);
    const result = await pending;

    expect(result.outcome).toBe('fail');
    expect(result.error).toMatch(/abort/i);
    expect(result.attempts).toBe(1);
    expect(seenSignal?.aborted).toBe(true);
  });

  it('aborts slow adapter reads at the shared audit deadline', async () => {
    const signals: Array<AbortSignal | undefined> = [];
    const slowRead = (options?: { signal?: AbortSignal }) => {
      signals.push(options?.signal);
      return new Promise<string>((_resolve, reject) => {
        const abort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        if (!options?.signal) {
          setTimeout(abort, 300);
          return;
        }
        if (options.signal.aborted) abort();
        else options.signal.addEventListener('abort', abort, { once: true });
      });
    };
    const adapter: CatalogAdapter = {
      readCatalog: async (options) => ({
        revision: 'rev',
        bytes: await slowRead(options),
      }),
      writeCatalog: async () => ({ revision: 'rev' }),
      readProfile: (options) => slowRead(options),
      loadRegistries: async () => ({ assetKeys: new Set(), capturedKeys: new Set() }),
    };
    const { auditLinks } = await import('../studio/catalogService');
    await expect(
      auditLinks(adapter, {
        deadlineMs: 30,
        checkImpl: async (url) => ({
          url,
          status: 200,
          outcome: 'pass',
          attempts: 1,
          latencyMs: 1,
        }),
      }),
    ).rejects.toBeInstanceOf(AuditTimeoutError);

    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal?.aborted)).toBe(true);
  });

  it('exposes GitHubApiError from a standalone errors module', async () => {
    const { GitHubApiError: Extracted } = await import('../../api/studio/_lib/errors');
    expect(Extracted).toBe(GitHubApiError);
  });
});

describe('bounded link auditing', () => {
  const fakeResult = (url: string) => ({
    url,
    status: 200,
    outcome: 'pass' as const,
    attempts: 1,
    latencyMs: 1,
  });

  it('caps the batch at 50 URLs and uses retries: 0', async () => {
    const options: Array<{ retries?: number }> = [];
    const urls = Array.from({ length: 60 }, (_value, index) => `https://example.com/${index}`);
    const results = await runBoundedAudit(urls, {
      checkImpl: async (url, init) => {
        options.push(init);
        return fakeResult(url);
      },
    });
    expect(results).toHaveLength(MAX_AUDIT_URLS);
    expect(options).toHaveLength(MAX_AUDIT_URLS);
    expect(options.every((entry) => entry.retries === 0)).toBe(true);
  });

  it('never exceeds concurrency 4', async () => {
    let active = 0;
    let peak = 0;
    await runBoundedAudit(
      Array.from({ length: 20 }, (_value, index) => `https://example.com/${index}`),
      {
        checkImpl: async (url) => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return fakeResult(url);
        },
      },
    );
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });

  it('resolves in-flight checks at the shared deadline instead of hanging', async () => {
    const results = await runBoundedAudit(['https://example.com/slow'], {
      deadlineMs: 40,
      checkImpl: () => new Promise(() => {}),
    });
    expect(results[0].outcome).toBe('fail');
    expect(results[0].error).toBe('audit deadline exceeded');
  });

  it('aborts timed-out checks with an AbortSignal', async () => {
    let signal: AbortSignal | undefined;
    const results = await runBoundedAudit(['https://example.com/slow'], {
      deadlineMs: 30,
      checkImpl: (_url, init) =>
        new Promise((resolve) => {
          signal = (init as { signal?: AbortSignal }).signal;
          void resolve;
        }),
    });
    expect(results[0].outcome).toBe('fail');
    expect(signal?.aborted).toBe(true);
  });

  it('audits the catalog and profile sources, ignoring client URLs', async () => {
    const adapter: CatalogAdapter = {
      readCatalog: async () => ({
        revision: 'rev',
        bytes: 'https://example.com/a https://example.com/b',
      }),
      writeCatalog: async () => ({ revision: 'rev' }),
      readProfile: async () => 'https://example.com/b https://example.com/c',
      loadRegistries: async () => ({ assetKeys: new Set(), capturedKeys: new Set() }),
    };
    const { auditLinks } = await import('../studio/catalogService');
    const results = await auditLinks(adapter, {
      checkImpl: async (url) => fakeResult(url),
    });
    expect(results.map((result) => result.url)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ]);
  });

  it('starts the deadline before reading catalog/profile when startedAt is provided', async () => {
    let clock = 0;
    const adapter: CatalogAdapter = {
      readCatalog: async () => {
        clock += 7000;
        return { revision: 'rev', bytes: 'https://example.com/a' };
      },
      writeCatalog: async () => ({ revision: 'rev' }),
      readProfile: async () => {
        clock += 2000;
        return '';
      },
      loadRegistries: async () => ({ assetKeys: new Set(), capturedKeys: new Set() }),
    };
    const { auditLinks } = await import('../studio/catalogService');
    const results = await auditLinks(adapter, {
      startedAt: 0,
      deadlineMs: 8000,
      now: () => clock,
      checkImpl: async (url) => fakeResult(url),
    });
    expect(results[0].classification).toBe('fail');
    expect(results[0].error).toBe('audit deadline exceeded');
  });
});

describe('PATCH-01: github adapter and error mapping', () => {
  it('commits directly on top of an ahead target branch without force-reset', async () => {
    const script = githubFetch({
      defaultBranch: 'main',
      targetAhead: true,
      catalogBytes: CATALOG_BYTES,
      targetBytes: '{"ahead":true}',
    });
    const adapter = new GitHubCatalogAdapter({
      repo: 'slowbutfast/portfolio',
      pat: 'pat',
      fetchImpl: script.fetchImpl,
    });
    const result = await adapter.writeCatalog(revisionOf('{"ahead":true}'), CATALOG_BYTES);
    expect(result).toMatchObject({ revision: 'new-file-sha', branch: 'studio/catalog' });
    expect(script.calls.some((call) => call.method === 'PATCH' || call.method === 'POST')).toBe(false);
    const put = script.calls.find((call) => call.method === 'PUT');
    expect(put?.body).toContain(`"sha":"${revisionOf('{"ahead":true}')}"`);
  });

  it('commits directly on top of a diverged target branch when catalog blobs differ', async () => {
    const calls: RecordedCall[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = new URL(String(input));
      const method = init.method ?? 'GET';
      calls.push({ method, path: url.pathname, search: url.search, body: typeof init.body === 'string' ? init.body : '' });
      const repo = `/repos/slowbutfast/portfolio`;
      if (method === 'GET' && url.pathname === repo) return jsonResponse({ default_branch: 'main' });
      if (method === 'GET' && url.pathname === `${repo}/git/ref/heads/main`) return jsonResponse({ object: { sha: 'base-sha' } });
      if (method === 'GET' && url.pathname === `${repo}/git/ref/heads/studio/catalog`) return jsonResponse({ object: { sha: 'target-sha' } });
      if (method === 'GET' && url.pathname.startsWith(`${repo}/contents/src/data/projects.catalog.json`)) {
        const ref = url.searchParams.get('ref');
        if (ref === 'main' || ref === 'base-sha') {
          return jsonResponse({ sha: 'default-file-sha', content: Buffer.from(CATALOG_BYTES, 'utf8').toString('base64'), encoding: 'base64' });
        }
        if (ref === 'studio/catalog') {
          return jsonResponse({ sha: 'target-file-sha', content: Buffer.from('{"diverged":true}', 'utf8').toString('base64'), encoding: 'base64' });
        }
      }
      if (method === 'PUT' && url.pathname.startsWith(`${repo}/contents/src/data/projects.catalog.json`)) {
        return jsonResponse({ content: { sha: 'new-file-sha' } }, 201);
      }
      return textResponse(`unhandled ${method} ${url.pathname}${url.search}`, 404);
    }) as typeof fetch;
    const adapter = new GitHubCatalogAdapter({ repo: 'slowbutfast/portfolio', pat: 'pat', fetchImpl });
    const result = await adapter.writeCatalog('target-file-sha', CATALOG_BYTES);
    expect(result).toMatchObject({ revision: 'new-file-sha', branch: 'studio/catalog' });
    expect(calls.some((call) => call.method === 'PATCH' || call.method === 'POST')).toBe(false);
    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.body).toContain('"sha":"target-file-sha"');
  });

  it('maps GitHubApiError statuses in sanitizeError and redacts upstream detail', async () => {
    const { sanitizeError } = await import('../../api/studio/_lib/http');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(sanitizeError(new GitHubApiError(429, 'rate limit body')).status).toBe(429);
    expect(sanitizeError(new GitHubApiError(422, 'sha mismatch detail')).status).toBe(400);
    expect(sanitizeError(new GitHubApiError(400, 'bad')).status).toBe(400);
    const server = sanitizeError(new GitHubApiError(500, 'secret upstream'));
    expect(server.status).toBe(502);
    expect(JSON.stringify(server.body)).not.toContain('secret upstream');
    errorSpy.mockRestore();
  });
});

describe('PATCH-03: Vercel ESM specifiers and audit timeout status', () => {
  it('uses explicit ESM extensions and JSON import attributes for server modules', () => {
    const shared = [
      'src/data/catalogSchema.ts',
      'src/utils/graphEdges.ts',
      'src/studio/catalogService.ts',
    ];
    const files = [
      ...walk(resolve(repoRoot, 'api'))
        .filter((file) => file.endsWith('.ts'))
        .map((file) => `api/${file}`),
      ...shared,
    ];
    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(resolve(repoRoot, file), 'utf8');
      const statements = source.match(/^\s*import\s+[^;]+;/gm) ?? [];
      for (const statement of statements) {
        if (/^\s*import\s+type\b/.test(statement)) continue;
        const specifier = statement.match(/\bfrom\s+['"](\.[^'"]+)['"]/)?.[1];
        if (!specifier) continue;
        if (!/\.(?:js|mjs|json)$/.test(specifier)) {
          offenders.push(`${file} -> ${specifier}`);
        }
        if (
          specifier.endsWith('.json') &&
          !/with\s*\{\s*type:\s*['"]json['"]\s*\}/.test(statement)
        ) {
          offenders.push(`${file} -> ${specifier} (missing with { type: 'json' })`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('preserves non-abort adapter read failures', async () => {
    const adapter: CatalogAdapter = {
      readCatalog: async () => {
        throw new Error('github down');
      },
      writeCatalog: async () => ({ revision: 'rev' }),
      readProfile: async () => '',
      loadRegistries: async () => ({ assetKeys: new Set(), capturedKeys: new Set() }),
    };
    const { auditLinks } = await import('../studio/catalogService');
    await expect(
      auditLinks(adapter, { deadlineMs: 1000, checkImpl: async () => {
        throw new Error('unreachable');
      } }),
    ).rejects.toThrow('github down');
  });

  it('maps AuditTimeoutError to HTTP 504', async () => {
    const { sanitizeError } = await import('../../api/studio/_lib/http');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = sanitizeError(new AuditTimeoutError());
    expect(response).toEqual({ status: 504, body: { error: 'Link audit timed out' } });
    errorSpy.mockRestore();
  });

  it('returns 504 when audit adapter reads time out', async () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const slow = (options?: { signal?: AbortSignal }) =>
        new Promise<string>((_resolve, reject) => {
          const abort = () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          if (options?.signal?.aborted) abort();
          else options?.signal?.addEventListener('abort', abort, { once: true });
        });
      const adapter: CatalogAdapter = {
        readCatalog: async (options) => ({ revision: 'rev', bytes: await slow(options) }),
        writeCatalog: async () => ({ revision: 'rev' }),
        readProfile: (options) => slow(options),
        loadRegistries: async () => ({ assetKeys: new Set(), capturedKeys: new Set() }),
      };
      const handler = createAuditLinksHandler({
        env: BASE_ENV,
        createAdapter: () => adapter,
      });
      const pending = invoke(handler, { method: 'POST', headers: authHeaders() });
      await vi.advanceTimersByTimeAsync(8000);
      const response = await pending;
      expect(response.statusCode).toBe(504);
      expect(JSON.parse(response.body)).toEqual({ error: 'Link audit timed out' });
    } finally {
      errorSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
