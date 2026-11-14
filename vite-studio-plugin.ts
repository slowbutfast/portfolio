import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import {
  MAX_CATALOG_BYTES,
  serializeCatalog,
  validateCatalog,
  type ProjectCatalog,
} from './src/data/catalogSchema';
import {
  checkUrl,
  extractUniqueUrls,
  type LinkCheckResult,
} from './src/utils/linkAudit';

const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm']);
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
      options.catalogPath ?? process.env.PORTFOLIO_STUDIO_CATALOG_PATH ?? resolve(root, 'src/data/projects.catalog.json'),
    ),
    profilePath: resolve(options.profilePath ?? resolve(root, 'src/data/profile.ts')),
    assetsDir: resolve(options.assetsDir ?? resolve(root, 'src/assets')),
    capturedDir: resolve(options.capturedDir ?? resolve(root, 'src/data/captured')),
    token: options.token ?? createHash('sha256').update(`${process.pid}:${Date.now()}:${Math.random()}`).digest('hex'),
    writeEnabled:
      options.writeEnabled ??
      (process.env.PORTFOLIO_STUDIO_WRITE !== undefined
        ? process.env.PORTFOLIO_STUDIO_WRITE !== '0'
        : process.env.NODE_ENV !== 'production'),
  };
}

async function walkFiles(dir: string, base = dir): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(full, base)));
    else if (entry.isFile()) files.push(full.slice(base.length + 1).split(sep).join('/'));
  }
  return files;
}

async function loadRegistries(options: ResolvedOptions) {
  if (options.assetKeys && options.capturedKeys) {
    return { assetKeys: options.assetKeys, capturedKeys: options.capturedKeys };
  }
  const assetFiles = await walkFiles(options.assetsDir);
  const capturedFiles = await walkFiles(options.capturedDir);
  return {
    assetKeys:
      options.assetKeys ??
      new Set(assetFiles.filter((file) => ASSET_EXTENSIONS.has(extname(file).toLowerCase()))),
    capturedKeys:
      options.capturedKeys ??
      new Set(
        capturedFiles
          .filter((file) => file.endsWith('.json'))
          .map((file) => file.slice(0, -'.json'.length)),
      ),
  };
}

function revisionOf(bytes: string): string {
  return createHash('sha256').update(bytes, 'utf8').digest('hex');
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

async function readBody(req: IncomingMessage, limit: number): Promise<{ body?: string; tooLarge?: boolean }> {
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

function isCatalogPayload(value: unknown): value is { expectedRevision: string; catalog: ProjectCatalog } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { expectedRevision?: unknown }).expectedRevision === 'string' &&
    typeof (value as { catalog?: unknown }).catalog === 'object' &&
    (value as { catalog?: unknown }).catalog !== null
  );
}

export function createStudioMiddleware(options: StudioPluginOptions = {}) {
  const resolved = resolveOptions(options);
  let writeQueue: Promise<void> = Promise.resolve();

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
        const bytes = await readFile(resolved.catalogPath, 'utf8');
        const catalog = JSON.parse(bytes) as ProjectCatalog;
        const registries = await loadRegistries(resolved);
        sendJson(res, 200, {
          token: resolved.token,
          revision: revisionOf(bytes),
          catalog,
          assetKeys: [...registries.assetKeys].sort(),
          capturedKeys: [...registries.capturedKeys].sort(),
        });
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

      const currentBytes = await readFile(resolved.catalogPath, 'utf8');
      if (payload.expectedRevision !== revisionOf(currentBytes)) {
        sendJson(res, 409, { error: 'Stale expectedRevision' });
        return;
      }
      const registries = await loadRegistries(resolved);
      const errors = validateCatalog(payload.catalog, registries);
      if (errors.length > 0) {
        sendJson(res, 400, { error: errors.join('; '), errors });
        return;
      }

      const serialized = serializeCatalog(payload.catalog);
      const revision = revisionOf(serialized);
      writeQueue = writeQueue
        .catch(() => {
          // A failed write must not poison subsequent attempts.
        })
        .then(async () => {
        await mkdir(dirname(resolved.catalogPath), { recursive: true });
        const tempPath = `${resolved.catalogPath}.tmp`;
        await writeFile(tempPath, serialized, 'utf8');
        await rename(tempPath, resolved.catalogPath);
      });
      try {
        await writeQueue;
      } catch (cause) {
        sendJson(res, 500, { error: cause instanceof Error ? cause.message : String(cause) });
        return;
      }
      sendJson(res, 200, { revision });
      return;
    }

    if (path === '/__studio/api/audit-links' && req.method === 'POST') {
      if (!tokenGuard(req, resolved.token)) {
        sendJson(res, 403, { error: 'Invalid X-Studio-Token' });
        return;
      }
      try {
        // Client-supplied URLs are ignored by design.
        const [catalogText, profileText] = await Promise.all([
          readFile(resolved.catalogPath, 'utf8'),
          readFile(resolved.profilePath, 'utf8').catch(() => ''),
        ]);
        const urls = extractUniqueUrls([catalogText, profileText]);
        const results: LinkCheckResult[] = [];
        for (const target of urls) results.push(await checkUrl(target));
        sendJson(
          res,
          200,
          results.map((result) => ({
            url: result.url,
            status: result.status,
            classification: result.outcome,
            latencyMs: result.latencyMs,
            error: result.error,
            blocked: result.blocked,
          })),
        );
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
