import type { IncomingMessage, ServerResponse } from 'node:http';
import catalog from '../../src/data/projects.catalog.json';
import { validateCatalog } from '../../src/data/catalogSchema';
import { HttpError, sanitizeError, sendJson } from './_lib/http';

/**
 * Minimal Vercel deploy spike. Importing the shared schema and the real catalog
 * proves ESM + JSON bundling works before the full authenticated handler set is
 * deployed. It exposes no secrets or catalog content.
 */
export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  try {
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
}
