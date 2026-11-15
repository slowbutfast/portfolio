import type { IncomingMessage, ServerResponse } from 'node:http';
import { MAX_CATALOG_BYTES } from '../../src/data/catalogSchema';
import {
  getState,
  isCatalogPayload,
  putState,
  type CatalogAdapter,
} from '../../src/studio/catalogService';
import {
  requireConfig,
  requireMutation,
  requireOwner,
  type AuthConfig,
  type StudioEnv,
} from './_lib/auth';
import { GitHubCatalogAdapter } from './_lib/githubAdapter';
import { HttpError, readJsonBody, sanitizeError, sendJson } from './_lib/http';

export interface StateHandlerDeps {
  env?: StudioEnv;
  createAdapter?: (config: AuthConfig) => CatalogAdapter;
}

export function defaultAdapter(config: AuthConfig): CatalogAdapter {
  return new GitHubCatalogAdapter({
    repo: config.repo,
    pat: config.pat,
    branch: config.branch,
  });
}

export function createStateHandler(deps: StateHandlerDeps = {}) {
  return async function stateHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const config = requireConfig(deps.env);
      const adapter = (deps.createAdapter ?? defaultAdapter)(config);

      if (req.method === 'GET') {
        requireOwner(req, config);
        sendJson(res, 200, await getState(adapter));
        return;
      }

      if (req.method === 'PUT') {
        requireMutation(req, config);
        const payload = await readJsonBody(req, MAX_CATALOG_BYTES);
        if (!isCatalogPayload(payload)) {
          throw new HttpError(400, 'Expected { expectedRevision, catalog }');
        }
        sendJson(
          res,
          200,
          await putState(adapter, payload.expectedRevision, payload.catalog),
        );
        return;
      }

      res.setHeader('Allow', 'GET, PUT');
      throw new HttpError(405, 'Method not allowed');
    } catch (cause) {
      const { status, body } = sanitizeError(cause);
      sendJson(res, status, body);
    }
  };
}

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return createStateHandler()(req, res);
}
