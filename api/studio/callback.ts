import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  clearTxCookie,
  csrfCookie,
  openJson,
  randomToken,
  requireConfig,
  safeEqual,
  sessionCookie,
  SESSION_TTL_SECONDS,
  TX_COOKIE,
  type OAuthTransaction,
  type StudioEnv,
  type StudioSession,
} from './_lib/auth.js';
import {
  HttpError,
  readCookie,
  redirect,
  sanitizeError,
  sendJson,
} from './_lib/http.js';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login?: string;
}

export interface CallbackHandlerDeps {
  env?: StudioEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/**
 * Finish GitHub OAuth. The transaction cookie is always cleared; the user
 * access token is used only for `GET /user` and then dropped immediately, so
 * no GitHub credential ever reaches the client or persistent storage.
 */
export function createCallbackHandler(deps: CallbackHandlerDeps = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());

  return async function callbackHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let config: ReturnType<typeof requireConfig>;
    try {
      config = requireConfig(deps.env);
    } catch (cause) {
      const { status, body } = sanitizeError(cause);
      sendJson(res, status, body);
      return;
    }

    const clearTx = clearTxCookie(config);
    try {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        throw new HttpError(405, 'Method not allowed');
      }

      const transaction = readCookie(req, TX_COOKIE);
      const parsed = transaction
        ? openJson<OAuthTransaction>(transaction, config.sessionSecret)
        : null;
      const nowSeconds = Math.floor(now() / 1000);
      const query = new URL(req.url ?? '/', config.canonicalOrigin).searchParams;
      const state = query.get('state') ?? '';
      const code = query.get('code') ?? '';
      if (
        !parsed ||
        typeof parsed.exp !== 'number' ||
        !Number.isFinite(parsed.exp) ||
        parsed.exp <= nowSeconds ||
        !state ||
        !safeEqual(state, parsed.state)
      ) {
        throw new HttpError(403, 'Invalid OAuth state');
      }
      if (!code) throw new HttpError(400, 'Missing OAuth code');

      const tokenResponse = await fetchImpl('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          code_verifier: parsed.verifier,
        }),
      });
      if (!tokenResponse.ok) throw new HttpError(502, 'GitHub token exchange failed');
      const token = (await tokenResponse.json()) as TokenResponse;
      if (!token.access_token) {
        throw new HttpError(401, token.error ? 'GitHub authorization failed' : 'Missing access token');
      }

      let accessToken: string = token.access_token;
      // Drop the only reference as soon as it is copied, before any further
      // awaits can retain it.
      token.access_token = undefined;
      let user: GitHubUser;
      try {
        const userResponse = await fetchImpl('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'portfolio-studio',
          },
        });
        if (!userResponse.ok) throw new HttpError(502, 'GitHub user lookup failed');
        user = (await userResponse.json()) as GitHubUser;
      } finally {
        // Immediate disposal: never persist or return the user token.
        accessToken = '';
      }

      if (String(user.id) !== config.ownerId) {
        throw new HttpError(403, 'Not the repository owner');
      }

      const session: StudioSession = {
        sub: String(user.id),
        sid: randomToken(18),
        exp: Math.floor(now() / 1000) + SESSION_TTL_SECONDS,
      };
      redirect(res, `${config.canonicalOrigin}/#/studio`, [
        clearTx,
        sessionCookie(config, session),
        csrfCookie(config, session),
      ]);
    } catch (cause) {
      const { status, body } = sanitizeError(cause);
      res.setHeader('Set-Cookie', clearTx);
      sendJson(res, status, body);
    }
  };
}

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return createCallbackHandler()(req, res);
}
