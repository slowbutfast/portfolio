import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { createStudioMiddleware } from '../../vite-studio-plugin';
import type { ProjectCatalog } from '../data/catalogSchema';
import realCatalog from '../data/projects.catalog.json';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const TOKEN = 'test-studio-token';
const ASSET_KEYS = new Set([
  'clip.mp4',
  'screenshots/attention-max.png',
  'screenshots/open-dungeon.png',
  'screenshots/pict-climate-risk-viz-chatbot.png',
  'screenshots/sandwave-sim.png',
]);
const CAPTURED_KEYS = new Set([
  'agentic-resume-builder',
  'attention-max',
  'open-dungeon',
  'sandwave-sim',
  'transcribe-plus',
]);

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
}

function makeRequest(options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
}): IncomingMessage {
  const request = Readable.from(
    options.body === undefined ? [] : [Buffer.from(options.body, 'utf8')],
  ) as unknown as IncomingMessage;
  request.method = options.method;
  request.url = options.url;
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
      this.body = body;
    },
  };
}

async function invoke(
  middleware: ReturnType<typeof createStudioMiddleware>,
  options: {
    method: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) {
  const response = makeResponse();
  let nextCalled = false;
  await middleware(
    makeRequest({
      method: options.method,
      url: options.url ?? '/__studio/api/state',
      headers: options.headers ?? { host: 'localhost:5199' },
      body: options.body,
    }),
    response as unknown as ServerResponse,
    () => {
      nextCalled = true;
    },
  );
  return {
    status: response.statusCode,
    headers: response.headers,
    body: response.body ? (JSON.parse(response.body) as unknown) : null,
    nextCalled,
  };
}

function revisionOf(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

describe('studio dev plugin', () => {
  let dir: string;
  let catalogPath: string;
  let catalog: ProjectCatalog;
  let catalogText: string;
  let middleware: ReturnType<typeof createStudioMiddleware>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'studio-plugin-'));
    catalogPath = join(dir, 'projects.catalog.json');
    catalog = structuredClone(realCatalog) as ProjectCatalog;
    catalogText = `${JSON.stringify(catalog, null, 2)}\n`;
    await writeFile(catalogPath, catalogText, 'utf8');
    middleware = createStudioMiddleware({
      root: dir,
      catalogPath,
      profilePath: resolve(repoRoot, 'src/data/profile.ts'),
      token: TOKEN,
      writeEnabled: true,
      assetKeys: ASSET_KEYS,
      capturedKeys: CAPTURED_KEYS,
    });
  });

  it('serves state with a token, revision, registries, and zero CORS headers', async () => {
    const result = await invoke(middleware, { method: 'GET' });
    expect(result.status).toBe(200);
    const body = result.body as {
      token: string;
      revision: string;
      catalog: ProjectCatalog;
      assetKeys: string[];
    };
    expect(body.token).toBe(TOKEN);
    expect(body.revision).toBe(revisionOf(catalogText));
    expect(body.catalog.projects).toHaveLength(catalog.projects.length);
    expect(body.assetKeys).toContain('clip.mp4');
    expect(Object.keys(result.headers).some((name) => name.startsWith('access-control'))).toBe(
      false,
    );
  });

  it('rejects non-local Host, mismatched Origin, and cross-site fetch metadata', async () => {
    expect(
      (await invoke(middleware, { method: 'GET', headers: { host: 'evil.example:5199' } })).status,
    ).toBe(403);
    expect(
      (
        await invoke(middleware, {
          method: 'GET',
          headers: { host: 'localhost:5199', origin: 'http://evil.example' },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await invoke(middleware, {
          method: 'GET',
          headers: { host: 'localhost:5199', 'sec-fetch-site': 'cross-site' },
        })
      ).status,
    ).toBe(403);
  });

  it('rejects writes without a valid token and leaves the catalog untouched', async () => {
    const result = await invoke(middleware, {
      method: 'PUT',
      body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog }),
    });
    expect(result.status).toBe(403);
    expect(await readFile(catalogPath, 'utf8')).toBe(catalogText);
  });

  it('rejects payloads above 256KB with 413', async () => {
    const result = await invoke(middleware, {
      method: 'PUT',
      headers: {
        host: 'localhost:5199',
        'x-studio-token': TOKEN,
        'content-length': String(300 * 1024),
      },
      body: '{}',
    });
    expect(result.status).toBe(413);
  });

  it('returns 409 for a stale expectedRevision', async () => {
    const result = await invoke(middleware, {
      method: 'PUT',
      headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
      body: JSON.stringify({ expectedRevision: 'stale', catalog }),
    });
    expect(result.status).toBe(409);
  });

  it('rejects malformed catalogs without crashing the middleware', async () => {
    const result = await invoke(middleware, {
      method: 'PUT',
      headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
      body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog: {} }),
    });
    expect(result.status).toBe(400);

    // The server still serves state after the malformed payload.
    const after = await invoke(middleware, { method: 'GET' });
    expect(after.status).toBe(200);
  });

  it('does not treat prototype keys as present seeds', async () => {
    const shadow = structuredClone(catalog);
    const originalId = shadow.projects[0].id;
    shadow.projects[0].id = 'constructor';
    delete shadow.seeds[originalId];

    const result = await invoke(middleware, {
      method: 'PUT',
      headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
      body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog: shadow }),
    });
    expect(result.status).toBe(400);
  });

  it('rejects invalid IDs, unsafe URLs, reserved-entity removal, and non-planar seeds', async () => {
    const put = (payload: ProjectCatalog) =>
      invoke(middleware, {
        method: 'PUT',
        headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
        body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog: payload }),
      });

    const proto = structuredClone(catalog);
    proto.projects[0].id = '__proto__';
    expect((await put(proto)).status).toBe(400);

    const javascript = structuredClone(catalog);
    javascript.projects[0].liveUrl = 'javascript:alert(1)';
    expect((await put(javascript)).status).toBe(400);

    const missingArt = structuredClone(catalog);
    missingArt.projects = missingArt.projects.filter((project) => project.id !== 'art-wip');
    expect((await put(missingArt)).status).toBe(400);

    const missingArtTag = structuredClone(catalog);
    missingArtTag.tags = missingArtTag.tags.filter((tag) => tag !== 'art');
    missingArtTag.hiddenTags = [];
    expect((await put(missingArtTag)).status).toBe(400);

    const crossing = structuredClone(catalog);
    crossing.seeds['attention-max'] = { x: 0.01, y: 0.99 };
    expect((await put(crossing)).status).toBe(400);
  });

  it('writes canonical JSON atomically and advances the revision', async () => {
    const edited = structuredClone(catalog);
    edited.projects[0].summary = 'Updated from Studio';
    const result = await invoke(middleware, {
      method: 'PUT',
      headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
      body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog: edited }),
    });
    expect(result.status).toBe(200);
    const body = result.body as { revision: string };
    const written = await readFile(catalogPath, 'utf8');
    expect(body.revision).toBe(revisionOf(written));
    expect(written.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(written) as ProjectCatalog;
    expect(parsed.projects[0].summary).toBe('Updated from Studio');
    expect(parsed.tags).toEqual([...parsed.tags].sort());

    const stale = await invoke(middleware, {
      method: 'PUT',
      headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
      body: JSON.stringify({ expectedRevision: revisionOf(catalogText), catalog: edited }),
    });
    expect(stale.status).toBe(409);
  });

  it('serializes concurrent writes with the same expectedRevision', async () => {
    const edited = structuredClone(catalog);
    edited.projects[0].summary = 'Concurrent write';
    const request = () =>
      invoke(middleware, {
        method: 'PUT',
        headers: { host: 'localhost:5199', 'x-studio-token': TOKEN },
        body: JSON.stringify({
          expectedRevision: revisionOf(catalogText),
          catalog: edited,
        }),
      });

    const [first, second] = await Promise.all([request(), request()]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);

    const written = JSON.parse(await readFile(catalogPath, 'utf8')) as ProjectCatalog;
    expect(written.projects[0].summary).toBe('Concurrent write');
  });

  it('requires the token for link auditing and ignores client-supplied URLs', async () => {
    expect((await invoke(middleware, { method: 'POST', url: '/__studio/api/audit-links' })).status).toBe(
      403,
    );
  });

  it('leaves unrelated requests to the next middleware', async () => {
    const result = await invoke(middleware, { method: 'GET', url: '/index.html' });
    expect(result.nextCalled).toBe(true);
    expect(result.status).toBe(0);
  });
});
