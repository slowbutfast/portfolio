import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import {
  MAX_CATALOG_BYTES,
  serializeCatalog,
  validateCatalog,
  type ProjectCatalog,
} from '../data/catalogSchema';
import {
  checkUrl,
  extractUniqueUrls,
  type LinkCheckResult,
  type LinkCheckOptions,
} from '../utils/linkAudit.mjs';

export const MAX_AUDIT_URLS = 50;
export const AUDIT_CONCURRENCY = 4;
export const AUDIT_DEADLINE_MS = 8000;

const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm']);

export interface CatalogRegistries {
  assetKeys: ReadonlySet<string>;
  capturedKeys: ReadonlySet<string>;
}

export interface CatalogReadOptions {
  signal?: AbortSignal;
}

export interface CatalogReadResult {
  revision: string;
  bytes: string;
  branch?: string;
  repo?: string;
  branchUrl?: string;
}

export interface CatalogWriteResult {
  revision: string;
  branch?: string;
  repo?: string;
  branchUrl?: string;
}

/**
 * Transport-agnostic catalog storage contract shared by the dev-only Vite
 * plugin (`LocalFsCatalogAdapter`) and production (`GitHubCatalogAdapter`).
 */
export interface CatalogAdapter {
  readCatalog(options?: CatalogReadOptions): Promise<CatalogReadResult>;
  writeCatalog(expectedRevision: string, bytes: string): Promise<CatalogWriteResult>;
  readProfile(options?: CatalogReadOptions): Promise<string>;
  loadRegistries(): Promise<CatalogRegistries>;
}

export interface CatalogState {
  revision: string;
  catalog: ProjectCatalog;
  assetKeys: string[];
  capturedKeys: string[];
  branch?: string;
  repo?: string;
  branchUrl?: string;
}

export class CatalogConflictError extends Error {
  constructor(message = 'Stale expectedRevision') {
    super(message);
    this.name = 'CatalogConflictError';
  }
}

export class CatalogValidationError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join('; '));
    this.name = 'CatalogValidationError';
    this.errors = errors;
  }
}

export class CatalogTooLargeError extends Error {
  constructor(limit = MAX_CATALOG_BYTES) {
    super(`Payload exceeds ${limit} bytes`);
    this.name = 'CatalogTooLargeError';
  }
}

export function revisionOf(bytes: string): string {
  return createHash('sha256').update(bytes, 'utf8').digest('hex');
}

export function isCatalogPayload(
  value: unknown,
): value is { expectedRevision: string; catalog: ProjectCatalog } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { expectedRevision?: unknown }).expectedRevision === 'string' &&
    typeof (value as { catalog?: unknown }).catalog === 'object' &&
    (value as { catalog?: unknown }).catalog !== null
  );
}

export async function getState(adapter: CatalogAdapter): Promise<CatalogState> {
  const [{ revision, bytes, branch, repo, branchUrl }, registries] = await Promise.all([
    adapter.readCatalog(),
    adapter.loadRegistries(),
  ]);
  let catalog: ProjectCatalog;
  try {
    catalog = JSON.parse(bytes) as ProjectCatalog;
  } catch {
    throw new CatalogValidationError(['catalog is not valid JSON']);
  }
  return {
    revision,
    catalog,
    assetKeys: [...registries.assetKeys].sort(),
    capturedKeys: [...registries.capturedKeys].sort(),
    branch,
    repo,
    branchUrl,
  };
}

export async function putState(
  adapter: CatalogAdapter,
  expectedRevision: string,
  catalog: ProjectCatalog,
): Promise<CatalogWriteResult> {
  const registries = await adapter.loadRegistries();
  const errors = validateCatalog(catalog, registries);
  if (errors.length > 0) throw new CatalogValidationError(errors);

  const serialized = serializeCatalog(catalog);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_CATALOG_BYTES) {
    throw new CatalogTooLargeError();
  }
  const written = await adapter.writeCatalog(expectedRevision, serialized);
  return written;
}

export interface BoundedAuditOptions {
  deadlineMs?: number;
  concurrency?: number;
  maxUrls?: number;
  now?: () => number;
  /** Wall-clock start used to charge adapter reads against the shared deadline. */
  startedAt?: number;
  checkImpl?: (url: string, options: LinkCheckOptions) => Promise<LinkCheckResult>;
}

/**
 * Audit at most `maxUrls` links with bounded concurrency and one shared
 * deadline. `retries: 0` keeps the whole batch inside a 10s serverless budget;
 * a link that outlives the deadline resolves as a fail instead of hanging.
 */
export async function runBoundedAudit(
  urls: readonly string[],
  options: BoundedAuditOptions = {},
): Promise<LinkCheckResult[]> {
  const deadlineMs = options.deadlineMs ?? AUDIT_DEADLINE_MS;
  const concurrency = Math.max(1, options.concurrency ?? AUDIT_CONCURRENCY);
  const maxUrls = Math.max(0, options.maxUrls ?? MAX_AUDIT_URLS);
  const now = options.now ?? Date.now;
  const check = options.checkImpl ?? checkUrl;

  const targets = urls.slice(0, maxUrls);
  const started = options.startedAt ?? now();
  const results: LinkCheckResult[] = new Array(targets.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= targets.length) return;
      const url = targets[index];
      const remaining = deadlineMs - (now() - started);
      if (remaining <= 0) {
        results[index] = {
          url,
          status: 0,
          outcome: 'fail',
          attempts: 0,
          latencyMs: 0,
          error: 'audit deadline exceeded',
        };
        continue;
      }
      const timeoutMs = Math.max(250, Math.min(4000, remaining));
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const pending = check(url, {
          retries: 0,
          timeoutMs,
          signal: controller.signal,
        }).catch((cause: unknown) => ({
          url,
          status: 0,
          outcome: 'fail' as const,
          attempts: 0,
          latencyMs: Math.max(0, now() - started),
          error: cause instanceof Error ? cause.message : String(cause),
        }));
        results[index] = await Promise.race([
          pending,
          new Promise<LinkCheckResult>((resolvePromise) => {
            timer = setTimeout(() => {
              controller.abort();
              resolvePromise({
                url,
                status: 0,
                outcome: 'fail',
                attempts: 0,
                latencyMs: Math.max(0, deadlineMs - (now() - started)),
                error: 'audit deadline exceeded',
              });
            }, remaining);
          }),
        ]);
      } catch (cause) {
        results[index] = {
          url,
          status: 0,
          outcome: 'fail',
          attempts: 0,
          latencyMs: 0,
          error: cause instanceof Error ? cause.message : String(cause),
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, () => worker()),
  );
  return results;
}

export interface AuditLinkResponse {
  url: string;
  status: number;
  classification: LinkCheckResult['outcome'];
  latencyMs: number;
  error?: string;
  blocked?: boolean;
  finalUrl?: string;
}

export async function auditLinks(
  adapter: CatalogAdapter,
  options: BoundedAuditOptions = {},
): Promise<AuditLinkResponse[]> {
  const now = options.now ?? Date.now;
  const deadlineMs = options.deadlineMs ?? AUDIT_DEADLINE_MS;
  const startedAt = options.startedAt ?? now();
  const controller = new AbortController();
  const remaining = startedAt + deadlineMs - now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (remaining <= 0) controller.abort();
  else timer = setTimeout(() => controller.abort(), remaining);

  let catalog: { revision: string; bytes: string };
  let profile: string;
  try {
    [catalog, profile] = await Promise.all([
      adapter.readCatalog({ signal: controller.signal }),
      adapter.readProfile({ signal: controller.signal }),
    ]);
  } catch (cause) {
    // A read that loses the shared deadline yields an empty audit rather than
    // a 500 or a hanging function.
    if (controller.signal.aborted) return [];
    throw cause;
  } finally {
    if (timer) clearTimeout(timer);
  }

  const urls = extractUniqueUrls([catalog.bytes, profile]);
  const results = await runBoundedAudit(urls, { ...options, startedAt });
  return results.map((result) => ({
    url: result.url,
    status: result.status,
    classification: result.outcome,
    latencyMs: result.latencyMs,
    ...(result.error === undefined ? {} : { error: result.error }),
    ...(result.blocked === undefined ? {} : { blocked: result.blocked }),
    ...(result.finalUrl === undefined ? {} : { finalUrl: result.finalUrl }),
  }));
}

export interface LocalFsAdapterOptions {
  catalogPath: string;
  profilePath: string;
  assetsDir: string;
  capturedDir: string;
  assetKeys?: ReadonlySet<string>;
  capturedKeys?: ReadonlySet<string>;
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

/** Local filesystem adapter used only by the Vite dev middleware. */
export class LocalFsCatalogAdapter implements CatalogAdapter {
  private readonly options: LocalFsAdapterOptions;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: LocalFsAdapterOptions) {
    this.options = options;
  }

  async readCatalog(_options?: CatalogReadOptions): Promise<CatalogReadResult> {
    const bytes = await readFile(this.options.catalogPath, 'utf8');
    return { revision: revisionOf(bytes), bytes };
  }

  async readProfile(_options?: CatalogReadOptions): Promise<string> {
    return readFile(this.options.profilePath, 'utf8').catch(() => '');
  }

  async loadRegistries(): Promise<CatalogRegistries> {
    if (this.options.assetKeys && this.options.capturedKeys) {
      return {
        assetKeys: this.options.assetKeys,
        capturedKeys: this.options.capturedKeys,
      };
    }
    const [assetFiles, capturedFiles] = await Promise.all([
      walkFiles(this.options.assetsDir),
      walkFiles(this.options.capturedDir),
    ]);
    return {
      assetKeys:
        this.options.assetKeys ??
        new Set(assetFiles.filter((file) => ASSET_EXTENSIONS.has(extname(file).toLowerCase()))),
      capturedKeys:
        this.options.capturedKeys ??
        new Set(
          capturedFiles
            .filter((file) => file.endsWith('.json'))
            .map((file) => file.slice(0, -'.json'.length)),
        ),
    };
  }

  async writeCatalog(expectedRevision: string, bytes: string): Promise<CatalogWriteResult> {
    const outcome: { value: CatalogWriteResult | null } = { value: null };
    this.writeQueue = this.writeQueue
      .catch(() => {
        // A failed write must not poison subsequent attempts.
      })
      .then(async () => {
        const current = await readFile(this.options.catalogPath, 'utf8');
        if (expectedRevision !== revisionOf(current)) {
          throw new CatalogConflictError();
        }
        await mkdir(dirname(this.options.catalogPath), { recursive: true });
        const tempPath = `${this.options.catalogPath}.tmp`;
        await writeFile(tempPath, bytes, 'utf8');
        await rename(tempPath, this.options.catalogPath);
        outcome.value = { revision: revisionOf(bytes) };
      });
    await this.writeQueue;
    if (!outcome.value) throw new Error('Write completed without an outcome');
    return outcome.value;
  }
}
