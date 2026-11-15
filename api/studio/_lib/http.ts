import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  CatalogConflictError,
  CatalogTooLargeError,
  CatalogValidationError,
} from '../../../src/studio/catalogService';

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function redirect(res: ServerResponse, location: string, cookies: string[] = []): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.end('');
}

export interface CookieOptions {
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  maxAge?: number;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path ?? '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`);
  return parts.join('; ');
}

export function clearCookie(name: string, options: CookieOptions = {}): string {
  return serializeCookie(name, '', { ...options, maxAge: 0 });
}

/** Parse a single cookie from the request. Values are not URL-decoded. */
export function readCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (typeof header !== 'string' || header.length === 0) return null;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    if (trimmed.slice(0, separator) === name) {
      return trimmed.slice(separator + 1);
    }
  }
  return null;
}

export function readHeader(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

export async function readBody(req: IncomingMessage, limit: number): Promise<string> {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > limit) {
    throw new HttpError(413, `Payload exceeds ${limit} bytes`);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new HttpError(413, `Payload exceeds ${limit} bytes`);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readJsonBody(req: IncomingMessage, limit: number): Promise<unknown> {
  const body = await readBody(req, limit);
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Malformed JSON body');
  }
}

export interface ErrorResponse {
  status: number;
  body: { error: string; errors?: string[] };
}

/**
 * Map internal failures to client-safe responses. Unknown errors never leak
 * stack traces, upstream bodies, or secrets.
 */
export function sanitizeError(cause: unknown): ErrorResponse {
  if (cause instanceof HttpError) {
    return { status: cause.status, body: { error: cause.message } };
  }
  if (cause instanceof CatalogConflictError) {
    return { status: 409, body: { error: 'Stale expectedRevision' } };
  }
  if (cause instanceof CatalogValidationError) {
    return { status: 400, body: { error: cause.message, errors: cause.errors } };
  }
  if (cause instanceof CatalogTooLargeError) {
    return { status: 413, body: { error: cause.message } };
  }
  return { status: 500, body: { error: 'Internal error' } };
}

/** Request origin derived from Vercel's forwarded headers, for diagnostics. */
export function requestOrigin(req: IncomingMessage): string | null {
  const host = readHeader(req, 'x-forwarded-host') ?? readHeader(req, 'host');
  if (!host) return null;
  const proto = readHeader(req, 'x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export function isSecureRequest(req: IncomingMessage): boolean {
  return (requestOrigin(req) ?? '').startsWith('https://');
}
