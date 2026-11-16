# Research: `studio-remote-oauth`

## Source material
- **User direction (2026-11-15)**: Remote access to `/#/studio` on Vercel via GitHub OAuth + GitHub-backed catalog persistence, defaulting to:
  1. Saving to a dedicated `studio/catalog` branch (Vercel preview + PR merge).
  2. Keeping `/#/studio` as a lazy-loaded chunk in the same Vercel project.
  3. Deferring media uploads to v2 so `vercel.json` CSP (`img-src 'self'`, `media-src 'self'`) stays untouched.
- **Architectural & deployment review (2026-11-15)**:
  - `.vercelignore` (`L10`) excludes `scripts/`, so `npm run build` on Vercel cannot invoke `scripts/generate-asset-manifest.mjs`, and gitignoring the manifest breaks fresh-clone `npm run typecheck`. Commit `api/studio/_lib/asset-manifest.json` and guard it with a unit drift test against `src/assets` and `src/data/captured`.
  - GitHub OAuth Apps bind one exact callback URL and cookies are host-scoped: Studio OAuth sign-in is **production/canonical-domain only** (not arbitrary Vercel preview URLs); preview deployments of `studio/catalog` are for visual review after Save.
  - Full-page OAuth redirects clear React memory: persist unsaved `draft` + `baseRevision` in `sessionStorage` (`studio_pending_draft`) and restore/reconcile on return.
  - `catalogSchema.ts` currently imports `graphTopology.ts` → `tagRegistry.ts` → `projects.catalog.json`. Extract a pure `deriveEdgesPure(projects, hiddenTags)` in `src/utils/graphEdges.ts` so serverless functions never drag JSON imports, and run a `ping.ts` Vercel deploy spike first.
  - `studio/catalog` branch lifecycle: read from `studio/catalog` only if it exists and is ahead of `default_branch` (never hard-coded `master`); otherwise read `default_branch`, and recreate/reset `studio/catalog` from `default_branch` before the next save (treating concurrent `422 Reference already exists` as success).
  - Use empty OAuth scope (`""`), session-bound CSRF (`HMAC(secret, sessionId)`), 2h TTL with `STUDIO_SESSION_SECRET` rotation kill-switch, shared `AbortSignal`/deadline + `retries: 0` + `maxDuration = 10` for `audit-links`, and `master` branch protection/ruleset for PAT blast-radius control.

### Raised but not acted on
- **Separate Vercel project for Studio**: Rejected for v1 in favor of a lazy-loaded `/#/studio` chunk + `/api/studio/*` functions in the same project.
- **Image/video uploads from Studio UI**: Deferred to v2 to keep `vercel.json` CSP (`img-src 'self'`, `media-src 'self'`) unmodified.
- **GitHub App installation tokens**: Noted as a future upgrade over `GITHUB_PAT` (`contents: write` scoped to `slowbutfast/portfolio`); deferred for v1 simplicity.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| `studio/catalog` branch | Target Git branch where `PUT /api/studio/state` commits `src/data/projects.catalog.json` | Direct commits to `default_branch` (`master`) |
| `default_branch` | Repository default branch queried from GitHub repo metadata (fallback `STUDIO_BASE_BRANCH`) | Hard-coded `master` literal |
| `expectedRevision` (prod) | Git blob `sha` of `src/data/projects.catalog.json` on the active base ref | Local SHA-256 file hash used in dev mode |
| `studio_session` cookie | `HttpOnly; Secure; SameSite=Lax; Path=/api/studio` HMAC-SHA256 `{ sub, sid, exp }` (2h TTL) | Client-readable token or `localStorage` secret |
| `studio_csrf` cookie | `Secure; SameSite=Lax; Path=/` HMAC of `sid` echoed in `X-Studio-CSRF` | Independent un-bound random token |
| `studio_oauth_tx` cookie | Short-lived HMAC-signed one-time cookie holding `{ state, codeVerifier, exp }` | Reusable OAuth state |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| GitHub OAuth Apps (`authorizing-oauth-apps`) | Recommends unguessable `state`, PKCE, and exact callback URLs (no wildcards) | Public docs | 2026-11-15 |
| GitHub REST Git Refs, Compare & Contents API | Explicit branch creation (`POST .../git/refs`), `compare` ahead-by check, and `409`/`422` semantics | Public docs | 2026-11-15 |
| Vercel Serverless Functions | Static JSON imports are traced by `@vercel/nft`; `scripts/` is excluded by `.vercelignore` | Public docs | 2026-11-15 |

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Hand-rolled GitHub OAuth + PKCE (`node:crypto`) | Adopted | Zero runtime dependencies; matches `node:crypto` usage in `vite-studio-plugin.ts` | 2026-11-15 |
| Committed `api/studio/_lib/asset-manifest.json` + unit drift test | Adopted | Avoids `.vercelignore` `scripts/` exclusion and fresh-clone `typecheck` failure | 2026-11-15 |
| Build-time `scripts/generate-asset-manifest.mjs` | Rejected | Fails on Vercel because `.vercelignore` excludes `scripts/` | 2026-11-15 |

## Patterns adopted
- **Adapter pattern (`CatalogAdapter`)**: Shared HTTP-agnostic `catalogService.ts` separating `LocalFsCatalogAdapter` (dev) from `GitHubCatalogAdapter` (Vercel prod).
- **Session-bound double-submit CSRF**: `studio_csrf` is `HMAC-SHA256(STUDIO_SESSION_SECRET, session.sid)`, binding CSRF protection directly to the authenticated session.
- **Pure graph edge derivation**: `deriveEdgesPure(projects, hiddenTags)` in `src/utils/graphEdges.ts` with zero JSON imports.

## Verified facts

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| `.vercelignore` excludes `scripts/` | Line 10: `scripts/` | `read_file` on `.vercelignore` | 2026-11-15 | stable |
| `tsconfig.json` includes | `["src", "e2e", "vite.config.ts", "playwright.config.ts"]` (`api/` missing) | `read_file` on `tsconfig.json` | 2026-11-15 | stable |
| `vercel.json` CSP | `connect-src 'self'`, `img-src 'self'`, `media-src 'self'` (`L12`) | `read_file` on `vercel.json` | 2026-11-15 | stable |
| `src/App.tsx` Studio gating | `StudioRoute` & `STUDIO_HASH` gated behind `import.meta.env.DEV` (`L26-L28`) | `read_file` on `src/App.tsx` | 2026-11-15 | stable |
| `d327261` mobile Studio on `master` | `StudioApp.tsx` has `lg:` 3-tab layout & bottom action bar | `git log` + `read_file` on `StudioApp.tsx` | 2026-11-15 | stable |

## Unverified assumptions
- Whether GitHub OAuth Apps (as opposed to GitHub Apps) accept and validate PKCE `code_challenge` / `code_verifier` on `login/oauth/access_token`; treated as belt-and-suspenders alongside `client_secret` and one-time `state`.
- Live GitHub OAuth round-trip and Vercel serverless deployment require Vercel env vars and `master` branch protection configured by the repo owner; automated tests mock GitHub HTTP endpoints and inspect `vercel build` / `.vercel/output`.

## Superseded claims
- *Prior assumption*: Build-time `scripts/generate-asset-manifest.mjs` runs during `npm run build` on Vercel. **Superseded**: `.vercelignore` (`L10`) excludes `scripts/`; replaced with committed `api/studio/_lib/asset-manifest.json` + unit drift test.
- *Prior assumption*: OAuth login works from arbitrary `https://<vercel-preview>/#/studio` URLs and in-memory React `draft` survives `401` re-auth. **Superseded**: OAuth login is canonical-domain only, and `StudioApp` persists pending `draft` + `baseRevision` in `sessionStorage` across full-page OAuth navigation.
- *Prior assumption*: `catalogSchema.ts` can be imported directly by serverless functions without dragging `projects.catalog.json`. **Superseded**: `graphTopology.ts` imports `tagRegistry.ts` → `projects.catalog.json`; replaced by pure `src/utils/graphEdges.ts` + a `ping.ts` deploy spike first.

## Links out
- Archived local Studio change: `openspec/changes/archive/2026-11-15-project-studio/`
- Current Studio spec: `openspec/specs/project-studio/spec.md`
