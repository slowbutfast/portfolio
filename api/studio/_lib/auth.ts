import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { HttpError, readCookie, readHeader, serializeCookie } from './http';

export const SESSION_COOKIE = 'studio_session';
export const CSRF_COOKIE = 'studio_csrf';
export const TX_COOKIE = 'studio_oauth_tx';
export const SESSION_TTL_SECONDS = 2 * 60 * 60;
export const TX_TTL_SECONDS = 10 * 60;
export const CSRF_HEADER = 'x-studio-csrf';

const REQUIRED_ENV = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'STUDIO_OAUTH_REDIRECT_URI',
  'STUDIO_OWNER_ID',
  'STUDIO_SESSION_SECRET',
  'GITHUB_PAT',
  'GITHUB_REPO',
] as const;

export interface StudioEnv {
  [key: string]: string | undefined;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  canonicalOrigin: string;
  ownerId: string;
  sessionSecret: string;
  pat: string;
  repo: string;
  branch: string;
}

export interface StudioSession {
  sub: string;
  sid: string;
  exp: number;
}

function value(env: StudioEnv, key: string): string {
  return (env[key] ?? '').trim();
}

/**
 * Reject target branches that would clobber the deploy branch or that GitHub
 * cannot accept as a ref name. `studio/catalog` remains the default.
 */
export function isValidTargetBranch(branch: string): boolean {
  if (branch === '' || branch === 'master' || branch === 'main' || branch === 'HEAD') {
    return false;
  }
  if (branch.length > 200) return false;
  // Control chars and characters Git refs forbid.
  if (/[\u0000-\u001f\u007f\s~^:?*\[\\]/.test(branch)) return false;
  if (
    branch.startsWith('-') ||
    branch.startsWith('/') ||
    branch.endsWith('/') ||
    branch.endsWith('.') ||
    branch.endsWith('.lock') ||
    branch === '@' ||
    branch.includes('..') ||
    branch.includes('//')
  ) {
    return false;
  }
  return true;
}

/**
 * Resolve OAuth/GitHub configuration. Returns `null` when any required secret
 * is absent or the owner id / redirect URI is malformed, which callers map to a
 * deterministic `503` (never a partial-auth `401`).
 */
export function readAuthConfig(env: StudioEnv = process.env): AuthConfig | null {
  const values = Object.fromEntries(
    REQUIRED_ENV.map((key) => [key, value(env, key)]),
  ) as Record<(typeof REQUIRED_ENV)[number], string>;
  if (REQUIRED_ENV.some((key) => values[key] === '')) return null;
  if (!/^\d+$/.test(values.STUDIO_OWNER_ID)) return null;
  if (values.STUDIO_OAUTH_REDIRECT_URI.includes('*')) return null;

  let redirect: URL;
  try {
    redirect = new URL(values.STUDIO_OAUTH_REDIRECT_URI);
  } catch {
    return null;
  }
  if (!redirect.pathname.endsWith('/api/studio/callback')) return null;
  if (redirect.protocol !== 'https:' && redirect.hostname !== 'localhost') return null;
  if (!/^[\w.-]+\/[\w.-]+$/.test(values.GITHUB_REPO)) return null;
  const branch = value(env, 'STUDIO_TARGET_BRANCH') || 'studio/catalog';
  if (!isValidTargetBranch(branch)) return null;

  return {
    clientId: values.GITHUB_CLIENT_ID,
    clientSecret: values.GITHUB_CLIENT_SECRET,
    redirectUri: values.STUDIO_OAUTH_REDIRECT_URI,
    canonicalOrigin: redirect.origin,
    ownerId: values.STUDIO_OWNER_ID,
    sessionSecret: values.STUDIO_SESSION_SECRET,
    pat: values.GITHUB_PAT,
    repo: values.GITHUB_REPO,
    branch,
  };
}

export function requireConfig(env: StudioEnv = process.env): AuthConfig {
  const config = readAuthConfig(env);
  if (!config) throw new HttpError(503, 'Studio is not configured');
  return config;
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function hmac(value: string, secret: string, domain: 'session' | 'tx' | 'csrf'): string {
  return createHmac('sha256', secret)
    .update(`${domain}:${value}`, 'utf8')
    .digest('base64url');
}

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'utf8').digest('base64url');
}

export function createPkcePair(): PkcePair {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: pkceChallenge(verifier) };
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}

export function signSession(
  session: StudioSession,
  secret: string,
): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return `${payload}.${hmac(payload, secret, 'session')}`;
}

export function verifySession(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): StudioSession | null {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, hmac(payload, secret, 'session'))) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Partial<StudioSession>;
    if (
      typeof parsed.sub !== 'string' ||
      typeof parsed.sid !== 'string' ||
      typeof parsed.exp !== 'number' ||
      !Number.isFinite(parsed.exp)
    ) {
      return null;
    }
    if (parsed.exp <= nowSeconds) return null;
    return { sub: parsed.sub, sid: parsed.sid, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function csrfToken(secret: string, sid: string): string {
  return hmac(sid, secret, 'csrf');
}

/** Seal a short-lived OAuth transaction (state + PKCE verifier) into a cookie. */
export function sealJson(value: unknown, secret: string): string {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  return `${payload}.${hmac(payload, secret, 'tx')}`;
}

export function openJson<T>(token: string, secret: string): T | null {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, hmac(payload, secret, 'tx'))) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export interface OAuthTransaction {
  state: string;
  verifier: string;
  exp: number;
}

const cookieBasics = (config: AuthConfig, path = '/') => ({
  path,
  secure: config.canonicalOrigin.startsWith('https://'),
  sameSite: 'Lax' as const,
});

const AUTH_COOKIE_PATH = '/api/studio';
const CSRF_COOKIE_PATH = '/';

export function sessionCookie(config: AuthConfig, session: StudioSession): string {
  return serializeCookie(SESSION_COOKIE, signSession(session, config.sessionSecret), {
    ...cookieBasics(config, AUTH_COOKIE_PATH),
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function csrfCookie(config: AuthConfig, session: StudioSession): string {
  return serializeCookie(CSRF_COOKIE, csrfToken(config.sessionSecret, session.sid), {
    ...cookieBasics(config, CSRF_COOKIE_PATH),
    httpOnly: false,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAuthCookies(config: AuthConfig): string[] {
  return [
    serializeCookie(SESSION_COOKIE, '', {
      ...cookieBasics(config, AUTH_COOKIE_PATH),
      httpOnly: true,
      maxAge: 0,
    }),
    serializeCookie(CSRF_COOKIE, '', {
      ...cookieBasics(config, CSRF_COOKIE_PATH),
      httpOnly: false,
      maxAge: 0,
    }),
  ];
}

export function txCookie(config: AuthConfig, transaction: OAuthTransaction): string {
  return serializeCookie(
    TX_COOKIE,
    sealJson(transaction, config.sessionSecret),
    { ...cookieBasics(config, AUTH_COOKIE_PATH), httpOnly: true, maxAge: TX_TTL_SECONDS },
  );
}

export function clearTxCookie(config: AuthConfig): string {
  return serializeCookie(TX_COOKIE, '', {
    ...cookieBasics(config, AUTH_COOKIE_PATH),
    httpOnly: true,
    maxAge: 0,
  });
}

/**
 * Owner authentication: valid 2h session cookie whose `sub` equals the numeric
 * `STUDIO_OWNER_ID`. Missing config is a `503`; anything else is `401`.
 */
export function requireOwner(
  req: IncomingMessage,
  config: AuthConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
): StudioSession {
  const token = readCookie(req, SESSION_COOKIE);
  const session = token ? verifySession(token, config.sessionSecret, nowSeconds) : null;
  if (!session || session.sub !== config.ownerId) {
    throw new HttpError(401, 'Unauthorized');
  }
  return session;
}

/**
 * Same-origin enforcement for state-changing requests. The canonical origin is
 * derived from `STUDIO_OAUTH_REDIRECT_URI`; browsers must supply a matching
 * `Origin` or `Sec-Fetch-Site: same-origin`.
 */
export function assertSameOrigin(req: IncomingMessage, config: AuthConfig): void {
  const origin = readHeader(req, 'origin');
  if (origin && origin !== 'null') {
    if (origin !== config.canonicalOrigin) {
      throw new HttpError(403, 'Origin mismatch');
    }
    return;
  }
  const site = readHeader(req, 'sec-fetch-site');
  if (site === 'same-origin' || site === 'none') return;
  throw new HttpError(403, 'Cross-site request blocked');
}

/** Session-bound CSRF token echoed from the `studio_csrf` cookie header. */
export function assertCsrf(
  req: IncomingMessage,
  config: AuthConfig,
  session: StudioSession,
): void {
  const supplied = readHeader(req, CSRF_HEADER);
  if (!supplied || !safeEqual(supplied, csrfToken(config.sessionSecret, session.sid))) {
    throw new HttpError(403, 'Invalid X-Studio-CSRF');
  }
}

export function requireMutation(
  req: IncomingMessage,
  config: AuthConfig,
): StudioSession {
  const session = requireOwner(req, config);
  assertSameOrigin(req, config);
  assertCsrf(req, config, session);
  return session;
}
