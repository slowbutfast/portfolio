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

interface RepoResponse {
  default_branch: string;
}

/**
 * GitHub Contents/Git-Refs adapter implementing the `studio/catalog` preview
 * branch lifecycle:
 * - `GET` reads `studio/catalog` whenever its catalog blob differs from the
 *   default branch's blob (ahead *or* diverged), so pending edits stay visible.
 * - `PUT` commits directly on top of an existing divergent target using the
 *   Contents API `sha` guard, and only creates/resets the target ref when it is
 *   absent or still points at the default branch's catalog blob.
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
    const targetRefSha = await this.refSha(this.targetBranch);
    if (targetRefSha) {
      const [defaultFile, targetFile] = await Promise.all([
        this.readContents(defaultBranch),
        this.readContents(this.targetBranch),
      ]);
      if (defaultFile.sha !== targetFile.sha) {
        return { defaultBranch, baseSha, ref: this.targetBranch, useTarget: true };
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
    if (source.defaultBranch === this.targetBranch) {
      throw new GitHubApiError(400, 'STUDIO_TARGET_BRANCH must differ from default_branch');
    }

    const current = await this.readContents(source.ref);
    if (current.sha !== expectedRevision) {
      throw new CatalogConflictError();
    }

    if (!source.useTarget) {
      // Only an absent target, or one whose catalog blob still matches the
      // default branch, is reset. A divergent target is committed on top of
      // its existing head via the Contents API `sha` guard (no force push).
      await this.resetTargetRef(source.baseSha);
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
            sha: expectedRevision,
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
