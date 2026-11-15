import type { IncomingMessage, ServerResponse } from 'node:http';
import { auditLinks, type CatalogAdapter } from '../../src/studio/catalogService';
import {
  requireConfig,
  requireMutation,
  type AuthConfig,
  type StudioEnv,
} from './_lib/auth';
import { defaultAdapter } from './state';
import { HttpError, sanitizeError, sendJson } from './_lib/http';

export const maxDuration = 10;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;

export interface AuditHandlerDeps {
  env?: StudioEnv;
  createAdapter?: (config: AuthConfig) => CatalogAdapter;
  now?: () => number;
}

/**
 * Best-effort per-instance rate limiting. Serverless instances are ephemeral,
 * so this only blunts accidental repeat clicks; it is not a security boundary.
 */
const hits = new Map<string, number[]>();

function rateLimited(sid: string, now: number): boolean {
  const recent = (hits.get(sid) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(sid, recent);
    return true;
  }
  recent.push(now);
  hits.set(sid, recent);
  return false;
}

export function createAuditLinksHandler(deps: AuditHandlerDeps = {}) {
  const now = deps.now ?? (() => Date.now());

  return async function auditLinksHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const config = requireConfig(deps.env);
      const session = requireMutation(req, config);
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new HttpError(405, 'Method not allowed');
      }
      if (rateLimited(session.sid, now())) {
        throw new HttpError(429, 'Too many audit requests');
      }

      const adapter = (deps.createAdapter ?? defaultAdapter)(config);
      // Client-supplied URLs are ignored by design.
      sendJson(res, 200, await auditLinks(adapter));
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
  return createAuditLinksHandler()(req, res);
}
