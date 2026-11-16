import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createPkcePair,
  randomToken,
  requireConfig,
  txCookie,
  TX_TTL_SECONDS,
  type StudioEnv,
} from './_lib/auth.js';
import { HttpError, redirect, sanitizeError, sendJson } from './_lib/http.js';

export interface LoginHandlerDeps {
  env?: StudioEnv;
}

/**
 * Start GitHub OAuth on the canonical domain. Scope is deliberately empty: the
 * Studio only needs the authenticated user's numeric id, and the user access
 * token is discarded by the callback.
 */
export function createLoginHandler(deps: LoginHandlerDeps = {}) {
  return async function loginHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const config = requireConfig(deps.env);
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        throw new HttpError(405, 'Method not allowed');
      }

      const { verifier, challenge } = createPkcePair();
      const state = randomToken(24);
      const exp = Math.floor(Date.now() / 1000) + TX_TTL_SECONDS;
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.searchParams.set('client_id', config.clientId);
      authorize.searchParams.set('redirect_uri', config.redirectUri);
      authorize.searchParams.set('scope', '');
      authorize.searchParams.set('state', state);
      authorize.searchParams.set('code_challenge', challenge);
      authorize.searchParams.set('code_challenge_method', 'S256');

      redirect(res, authorize.toString(), [txCookie(config, { state, verifier, exp })]);
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
  return createLoginHandler()(req, res);
}
