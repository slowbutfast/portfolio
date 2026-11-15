import type { IncomingMessage, ServerResponse } from 'node:http';
import catalog from '../../src/data/projects.catalog.json';
import { validateCatalog } from '../../src/data/catalogSchema';
import { requireConfig, type StudioEnv } from './_lib/auth';
import { HttpError, sanitizeError, sendJson } from './_lib/http';

export interface PingHandlerDeps {
  env?: StudioEnv;
}

/**
 * Minimal Vercel deploy spike. Importing the shared schema and the real catalog
 * proves ESM + JSON bundling works before the full authenticated handler set is
 * deployed. It exposes no secrets or catalog content, and returns `503` until
 * the Studio env is configured.
 */
export function createPingHandler(deps: PingHandlerDeps = {}) {
  return function pingHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): void {
    try {
      requireConfig(deps.env);
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        throw new HttpError(405, 'Method not allowed');
      }
      const errors = validateCatalog(catalog);
      sendJson(res, 200, {
        ok: errors.length === 0,
        service: 'studio',
        projects: catalog.projects.length,
        errors: errors.slice(0, 5),
      });
    } catch (cause) {
      const { status, body } = sanitizeError(cause);
      sendJson(res, status, body);
    }
  };
}

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  createPingHandler()(req, res);
}
