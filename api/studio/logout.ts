import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  clearAuthCookies,
  requireConfig,
  requireMutation,
  type StudioEnv,
} from './_lib/auth.js';
import { HttpError, sanitizeError, sendJson } from './_lib/http.js';

export interface LogoutHandlerDeps {
  env?: StudioEnv;
}

export function createLogoutHandler(deps: LogoutHandlerDeps = {}) {
  return async function logoutHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const config = requireConfig(deps.env);
      // Authentication and CSRF/origin checks run before method dispatch so an
      // unauthenticated request is always 401, never a method-enumeration leak.
      requireMutation(req, config);
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new HttpError(405, 'Method not allowed');
      }
      res.setHeader('Set-Cookie', clearAuthCookies(config));
      sendJson(res, 200, { ok: true });
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
  return createLogoutHandler()(req, res);
}
