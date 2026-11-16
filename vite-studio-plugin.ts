import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { MAX_CATALOG_BYTES } from './src/data/catalogSchema';
import {
  auditLinks,
  CatalogConflictError,
  CatalogTooLargeError,
  CatalogValidationError,
  getState,
  isCatalogPayload,
  LocalFsCatalogAdapter,
  putState,
} from './src/studio/catalogService';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export interface StudioPluginOptions {
  root?: string;
  catalogPath?: string;
  profilePath?: string;
  assetsDir?: string;
  capturedDir?: string;
  token?: string;
  writeEnabled?: boolean;
  assetKeys?: ReadonlySet<string>;
  capturedKeys?: ReadonlySet<string>;
}

interface ResolvedOptions extends StudioPluginOptions {
  root: string;
  catalogPath: string;
  profilePath: string;
  assetsDir: string;
  capturedDir: string;
  token: string;
  writeEnabled: boolean;
}

function resolveOptions(options: StudioPluginOptions): ResolvedOptions {
  const root = resolve(options.root ?? process.cwd());
  return {
    ...options,
    root,
    catalogPath: resolve(
      options.catalogPath ??
        process.env.PORTFOLIO_STUDIO_CATALOG_PATH ??
        resolve(root, 'src/data/projects.catalog.json'),
    ),
    profilePath: resolve(options.profilePath ?? resolve(root, 'src/data/profile.ts')),
    assetsDir: resolve(options.assetsDir ?? resolve(root, 'src/assets')),
    capturedDir: resolve(options.capturedDir ?? resolve(root, 'src/data/captured')),
    token: options.token ?? randomBytes(32).toString('hex'),
    writeEnabled:
      options.writeEnabled ??
      (process.env.PORTFOLIO_STUDIO_WRITE !== undefined
        ? process.env.PORTFOLIO_STUDIO_WRITE !== '0'
        : process.env.NODE_ENV !== 'production'),
  };
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  // Deliberately no Access-Control-* headers: this API is same-origin only.
  res.end(body);
}

function hostGuard(req: IncomingMessage): string | null {
  const host = req.headers.host;
  if (!host) return 'missing Host header';
  const hostname = host.replace(/:\d+$/, '').toLowerCase();
  if (!LOCAL_HOSTS.has(hostname)) return 'Host must be localhost or 127.0.0.1';
  const origin = req.headers.origin;
  if (origin !== undefined && origin !== `http://${host}`) return 'Origin mismatch';
  if (origin === undefined) {
    const site = req.headers['sec-fetch-site'];
    if (site !== undefined && site !== 'same-origin' && site !== 'none') {
      return 'cross-site request blocked';
    }
  }
  return null;
}

function tokenGuard(req: IncomingMessage, expected: string): boolean {
  const supplied = req.headers['x-studio-token'];
  if (typeof supplied !== 'string' || supplied.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function readBody(
  req: IncomingMessage,
  limit: number,
): Promise<{ body?: string; tooLarge?: boolean }> {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > limit) return { tooLarge: true };
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) return { tooLarge: true };
    chunks.push(buffer);
  }
  return { body: Buffer.concat(chunks).toString('utf8') };
}

export function createStudioMiddleware(options: StudioPluginOptions = {}) {
  const resolved = resolveOptions(options);
  const adapter = new LocalFsCatalogAdapter({
    catalogPath: resolved.catalogPath,
    profilePath: resolved.profilePath,
    assetsDir: resolved.assetsDir,
    capturedDir: resolved.capturedDir,
    assetKeys: resolved.assetKeys,
    capturedKeys: resolved.capturedKeys,
  });

  return async function studioMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ): Promise<void> {
    const url = req.url ?? '';
    if (!url.startsWith('/__studio/api/')) {
      next();
      return;
    }

    const guardError = hostGuard(req);
    if (guardError) {
      sendJson(res, 403, { error: guardError });
      return;
    }

    const path = url.split('?')[0];

    if (path === '/__studio/api/state' && req.method === 'GET') {
      try {
        const state = await getState(adapter);
        sendJson(res, 200, { token: resolved.token, ...state });
      } catch (cause) {
        sendJson(res, 500, { error: cause instanceof Error ? cause.message : String(cause) });
      }
      return;
    }

    if (path === '/__studio/api/state' && req.method === 'PUT') {
      if (!resolved.writeEnabled) {
        sendJson(res, 403, { error: 'Studio writes are disabled' });
        return;
      }
      if (!tokenGuard(req, resolved.token)) {
        sendJson(res, 403, { error: 'Invalid X-Studio-Token' });
        return;
      }
      const { body, tooLarge } = await readBody(req, MAX_CATALOG_BYTES);
      if (tooLarge) {
        sendJson(res, 413, { error: `Payload exceeds ${MAX_CATALOG_BYTES} bytes` });
        return;
      }
      let payload: unknown;
      try {
        payload = JSON.parse(body ?? '');
      } catch {
        sendJson(res, 400, { error: 'Malformed JSON body' });
        return;
      }
      if (!isCatalogPayload(payload)) {
        sendJson(res, 400, { error: 'Expected { expectedRevision, catalog }' });
        return;
      }

      try {
        const outcome = await putState(adapter, payload.expectedRevision, payload.catalog);
        sendJson(res, 200, outcome);
      } catch (cause) {
        if (cause instanceof CatalogConflictError) {
          sendJson(res, 409, { error: cause.message });
        } else if (cause instanceof CatalogValidationError) {
          sendJson(res, 400, { error: cause.message, errors: cause.errors });
        } else if (cause instanceof CatalogTooLargeError) {
          sendJson(res, 413, { error: cause.message });
        } else {
          sendJson(res, 500, { error: cause instanceof Error ? cause.message : String(cause) });
        }
      }
      return;
    }

    if (path === '/__studio/api/audit-links' && req.method === 'POST') {
      if (!tokenGuard(req, resolved.token)) {
        sendJson(res, 403, { error: 'Invalid X-Studio-Token' });
        return;
      }
      try {
        // Client-supplied URLs are ignored by design.
        sendJson(res, 200, await auditLinks(adapter));
      } catch (cause) {
        sendJson(res, 500, { error: cause instanceof Error ? cause.message : String(cause) });
      }
      return;
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    sendJson(res, 405, { error: `${req.method ?? 'UNKNOWN'} not allowed` });
  };
}

/** Dev-only Vite plugin: all routes live inside `configureServer`. */
export function studioDevPlugin(options: StudioPluginOptions = {}): Plugin {
  return {
    name: 'portfolio-studio-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        createStudioMiddleware({ root: server.config.root, ...options }),
      );
    },
  };
}
