import {
  CatalogConflictError,
  type CatalogAdapter,
  type CatalogReadResult,
  type CatalogRegistries,
  type CatalogWriteResult,
} from '../../../src/studio/catalogService';
import { assetKeySet, capturedKeySet } from './manifest';

const CATALOG_PATH = 'src/data/projects.catalog.json';
const PROFILE_PATH = 'src/data/profile.ts';
const API_VERSION = '2022-11-28';

export class GitHubApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}

export interface GitHubAdapterOptions {
  repo: string;
  pat: string;
  branch?: string;
  fetchImpl?: typeof fetch;
  apiBase?: string;
}

interface GitRef {
  object: { sha: string };
}

interface ContentsResponse {
  sha: string;
  content?: string;
  encoding?: string;
}

interface ContentsWriteResponse {
  content: { sha: string };
}

interface CompareResponse {
  status: 'ahead' | 'behind' | 'identical' | 'diverged';
}

interface RepoResponse {
  default_branch: string;
}

/**
 * GitHub Contents/Git-Refs adapter implementing the `studio/catalog` preview
 * branch lifecycle:
 * - `GET` reads `studio/catalog` only when it exists and is ahead of the
 *   repository's dynamic `default_branch`.
 * - `PUT` validates `expectedRevision` against the source it was read from,
 *   resets/creates `refs/heads/studio/catalog` to the default-branch head, then
 *   commits the new catalog with the Contents API.
 */
export class GitHubCatalogAdapter implements CatalogAdapter {
  private readonly repo: string;
  private readonly pat: string;
  private readonly targetBranch: string;
  private readonly fetchImpl: typeof fetch;
  private readonly apiBase: string;
  private readonly apiBasePath: string;

  constructor(options: GitHubAdapterOptions) {
    this.repo = options.repo;
    this.pat = options.pat;
    this.targetBranch = options.branch ?? 'studio/catalog';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.apiBase = (options.apiBase ?? 'https://api.github.com').replace(/\/+$/, '');
    this.apiBasePath = `/repos/${this.repo}`;
  }

  private async request(
    path: string,
    init: RequestInit = {},
    accept = 'application/vnd.github+json',
  ): Promise<Response> {
    const response = await this.fetchImpl(`${this.apiBase}${this.apiBasePath}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.pat}`,
        Accept: accept,
        'X-GitHub-Api-Version': API_VERSION,
        'User-Agent': 'portfolio-studio',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new GitHubApiError(
        response.status,
        `GitHub ${init.method ?? 'GET'} ${path} failed (${response.status})${
          detail ? `: ${detail.slice(0, 300)}` : ''
        }`,
      );
    }
    return response;
  }

  private async json<T>(path: string, init: RequestInit = {}): Promise<T> {
    return (await this.request(path, init)).json() as Promise<T>;
  }

  private async raw(path: string): Promise<string> {
    return (await this.request(path, {}, 'application/vnd.github.raw')).text();
  }

  private refPath(branch: string): string {
    return `/git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`;
  }

  private refUpdatePath(branch: string): string {
    return `/git/refs/heads/${branch.split('/').map(encodeURIComponent).join('/')}`;
  }

  private contentsPath(path: string, ref: string): string {
    return `/contents/${path
      .split('/')
      .map(encodeURIComponent)
      .join('/')}?ref=${encodeURIComponent(ref)}`;
  }

  private async defaultBranch(): Promise<string> {
    const repo = await this.json<RepoResponse>('');
    if (!repo.default_branch) throw new GitHubApiError(502, 'Missing default_branch');
    return repo.default_branch;
  }

  private async refSha(branch: string): Promise<string | null> {
    try {
      const ref = await this.json<GitRef>(this.refPath(branch));
      return ref.object.sha;
    } catch (cause) {
      if (cause instanceof GitHubApiError && cause.status === 404) return null;
      throw cause;
    }
  }

  private async resolveSource(): Promise<{
    defaultBranch: string;
    baseSha: string;
    ref: string;
    useTarget: boolean;
  }> {
    const defaultBranch = await this.defaultBranch();
    const baseSha = await this.refSha(defaultBranch);
    if (!baseSha) throw new GitHubApiError(502, 'Missing default branch ref');
    if (defaultBranch === this.targetBranch) {
      return { defaultBranch, baseSha, ref: defaultBranch, useTarget: false };
    }
    const targetSha = await this.refSha(this.targetBranch);
    if (targetSha) {
      try {
        const compare = await this.json<CompareResponse>(
          `/compare/${encodeURIComponent(defaultBranch)}...${encodeURIComponent(
            this.targetBranch,
          )}`,
        );
        if (compare.status === 'ahead') {
          return {
            defaultBranch,
            baseSha,
            ref: this.targetBranch,
            useTarget: true,
          };
        }
      } catch (cause) {
        if (!(cause instanceof GitHubApiError && cause.status === 404)) throw cause;
      }
    }
    return { defaultBranch, baseSha, ref: defaultBranch, useTarget: false };
  }

  private branchUrl(branch: string): string {
    return `https://github.com/${this.repo}/tree/${branch}`;
  }

  private async readContents(
    ref: string,
  ): Promise<{ sha: string; bytes: string }> {
    const contents = await this.json<ContentsResponse>(this.contentsPath(CATALOG_PATH, ref));
    if (typeof contents.content !== 'string') {
      throw new GitHubApiError(502, 'Missing catalog content');
    }
    const encoded = contents.content.replace(/\n/g, '');
    const bytes =
      contents.encoding === 'base64'
        ? Buffer.from(encoded, 'base64').toString('utf8')
        : contents.content;
    return { sha: contents.sha, bytes };
  }

  async readCatalog(): Promise<CatalogReadResult> {
    const source = await this.resolveSource();
    const contents = await this.readContents(source.ref);
    return {
      revision: contents.sha,
      bytes: contents.bytes,
      branch: source.ref,
      repo: this.repo,
      branchUrl: this.branchUrl(source.ref),
    };
  }

  async readProfile(): Promise<string> {
    try {
      return await this.raw(this.contentsPath(PROFILE_PATH, await this.defaultBranch()));
    } catch (cause) {
      if (cause instanceof GitHubApiError && cause.status === 404) return '';
      throw cause;
    }
  }

  async loadRegistries(): Promise<CatalogRegistries> {
    return { assetKeys: assetKeySet, capturedKeys: capturedKeySet };
  }

  private async resetTargetRef(sha: string): Promise<void> {
    const patch = () =>
      this.json(this.refUpdatePath(this.targetBranch), {
        method: 'PATCH',
        body: JSON.stringify({ sha, force: true }),
      });
    try {
      await patch();
      return;
    } catch (cause) {
      if (
        !(cause instanceof GitHubApiError) ||
        (cause.status !== 404 && cause.status !== 422)
      ) {
        throw cause;
      }
    }

    try {
      await this.json('/git/refs', {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${this.targetBranch}`, sha }),
      });
    } catch (cause) {
      // A concurrent writer may have created the ref between PATCH and POST.
      if (
        cause instanceof GitHubApiError &&
        cause.status === 422 &&
        /already exists/i.test(cause.message)
      ) {
        await patch();
        return;
      }
      throw cause;
    }
  }

  async writeCatalog(expectedRevision: string, bytes: string): Promise<CatalogWriteResult> {
    const source = await this.resolveSource();
    const current = await this.readContents(source.ref);
    if (current.sha !== expectedRevision) {
      throw new CatalogConflictError();
    }

    let sha: string;
    if (source.defaultBranch !== this.targetBranch) {
      // Pin the immutable base-commit blob SHA before resetting. A concurrent
      // writer that commits after the reset makes this SHA stale, so GitHub
      // rejects the update and we map the 422 to 409.
      const baseFile = await this.readContents(source.baseSha);
      sha = baseFile.sha;
      await this.resetTargetRef(source.baseSha);
    } else {
      sha = expectedRevision;
    }

    let updated: ContentsWriteResponse;
    try {
      updated = await this.json<ContentsWriteResponse>(
        this.contentsPath(CATALOG_PATH, this.targetBranch),
        {
          method: 'PUT',
          body: JSON.stringify({
            message: 'Studio: update project catalog',
            content: Buffer.from(bytes, 'utf8').toString('base64'),
            branch: this.targetBranch,
            sha,
          }),
        },
      );
    } catch (cause) {
      if (cause instanceof GitHubApiError) {
        if (cause.status === 409) throw new CatalogConflictError();
        if (cause.status === 422 && /\bsha\b/i.test(cause.message)) {
          throw new CatalogConflictError('Catalog changed on the preview branch');
        }
      }
      throw cause;
    }

    return {
      revision: updated.content.sha,
      branch: this.targetBranch,
      repo: this.repo,
      branchUrl: this.branchUrl(this.targetBranch),
    };
  }
}
