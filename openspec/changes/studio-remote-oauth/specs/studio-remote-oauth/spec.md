# studio-remote-oauth Specification

## ADDED Requirements

### Requirement: Canonical-domain GitHub OAuth with PKCE, one-time state, and session-bound CSRF
The serverless auth endpoints (`api/studio/login.ts`, `api/studio/callback.ts`, `api/studio/logout.ts`) SHALL authenticate only the configured repository owner (`String(user.id) === process.env.STUDIO_OWNER_ID`) on the canonical/production Studio origin using exact `STUDIO_OAUTH_REDIRECT_URI` matching (no wildcards), empty OAuth scope (`""`), immediate disposal of the GitHub user access token after fetching `GET https://api.github.com/user`, PKCE (`S256` `code_challenge`/`code_verifier`), and a short-lived HMAC-signed one-time `studio_oauth_tx` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/api/studio`) whose `state` is verified in constant time and **always cleared** on callback (whether valid, mismatched, or expired). On success, `callback.ts` SHALL issue an `HttpOnly; Secure; SameSite=Lax; Path=/api/studio` HMAC-SHA256 `studio_session` cookie (`{ sub, sid, exp }`, 2h TTL, revocable via `STUDIO_SESSION_SECRET` rotation) and a session-bound `studio_csrf` cookie (`HMAC-SHA256(STUDIO_SESSION_SECRET, sid)`, `Secure; SameSite=Lax; Path=/`). Missing required env vars SHALL deterministically return `503 Service Unavailable`, and all error payloads SHALL be generic without filesystem paths, raw GitHub bodies, or env details.

#### Scenario: Callback verifies state, clears one-time cookie, and rejects non-owners
- **WHEN** `/api/studio/callback` receives a mismatched/reused `state` or an authenticated GitHub user whose numeric `id` does not equal `STUDIO_OWNER_ID`
- **THEN** it clears `studio_oauth_tx`, issues no `studio_session` cookie, and rejects the request (`400`/`403`) with a generic error payload.

#### Scenario: All protected Studio API handlers reject unauthenticated or CSRF-invalid requests
- **WHEN** any `/api/studio/*` handler other than `login`, `callback`, or `ping` is called without a valid `studio_session` cookie, or a `PUT`/`POST` lacks a session-bound `X-Studio-CSRF` header or valid `Origin`/`Sec-Fetch-Site`
- **THEN** the handler rejects the request (`401` or `403`, or `503` if unconfigured) without reading or mutating GitHub state.

### Requirement: GitHub-backed catalog persistence with branch lifecycle and revision mapping
`GitHubCatalogAdapter` (`api/studio/_lib/githubAdapter.ts`) SHALL discover the repository's `default_branch` from GitHub metadata (never hard-coding `master`), read `src/data/projects.catalog.json` from `STUDIO_TARGET_BRANCH` (`studio/catalog`) **only if that branch exists and is ahead of `default_branch`** (otherwise reading from `default_branch`), and validate writes with pure `validateCatalog` and `serializeCatalog`. During `PUT`, if `studio/catalog` does not exist or is behind/merged into `default_branch`, the adapter SHALL create or reset `refs/heads/studio/catalog` to `default_branch` HEAD SHA via the Git References API (treating `422 Reference already exists` from a concurrent first save as success/re-read) before executing Contents `PUT` with `sha: expectedRevision`. GitHub `409` responses and `422` responses indicating a `sha`/branch-tip mismatch SHALL map to `409 Conflict`, while validation or rate-limit `422` responses SHALL surface accurately.

#### Scenario: Merged or absent studio/catalog reads from default_branch and resets before next save
- **WHEN** `studio/catalog` is absent or already merged into `default_branch`
- **THEN** `GET /api/studio/state` reads from `default_branch`, and the next `PUT` creates/resets `refs/heads/studio/catalog` to `default_branch` HEAD via Git Refs API (handling concurrent `422 Reference already exists`) before committing.

#### Scenario: Stale SHA maps to 409 while non-SHA 422 is preserved
- **WHEN** GitHub Contents `PUT` returns `409`, or `422` with a `sha` mismatch message
- **THEN** `/api/studio/state` returns `409 Conflict`, whereas a validation or rate-limit `422` returns an accurate generic error.

### Requirement: Pure server-side schema core, committed asset manifest, and route isolation
`catalogSchema.ts` and `catalogService.ts` SHALL import pure `deriveEdgesPure(projects, hiddenTags)` from `src/utils/graphEdges.ts` with zero `projects.catalog.json` imports. `api/studio/_lib/asset-manifest.json` SHALL be committed in git, statically imported by `api/studio/_lib/manifest.ts`, and guarded by a unit drift test against `src/assets/` and `src/data/captured/`, while `_lib/*` paths emit no public HTTP routes.

#### Scenario: Manifest drift is caught by unit tests and _lib emits no routes
- **WHEN** an asset or captured demo is added/removed without updating `api/studio/_lib/asset-manifest.json`
- **THEN** the unit drift test fails, and Vercel build output bundles `asset-manifest.json` into `/api/studio/*` without exposing `/api/studio/_lib/*` routes.

### Requirement: Bounded serverless link auditing and sessionStorage draft persistence
`POST /api/studio/audit-links` SHALL enforce `requireOwner`, session-bound `X-Studio-CSRF`, `maxDuration = 10`, and best-effort per-instance rate limiting, and execute SSRF-safe pinned-IP `linkAudit` with `retries: 0`, a shared `8000ms` `AbortSignal`/deadline, max `50` URLs, and concurrency `4`. `StudioApp` SHALL auto-select `/__studio/api` in `import.meta.env.DEV` vs `/api/studio` in production, persist `{ draft, baseRevision }` to `sessionStorage` (`studio_pending_draft`) on `401` / before OAuth navigation, restore and compare `baseRevision` against the fetched `revision` after callback (warning if the base moved while keeping edits), keep the mobile sticky Save/Discard bar active when authenticated, and display the `studio/catalog` branch/commit link after Save.

#### Scenario: Draft survives full-page OAuth re-authentication and warns on base revision drift
- **WHEN** the owner edits a project in production `StudioApp`, hits `401`, clicks **Sign in with GitHub**, and returns from `/api/studio/callback`
- **THEN** `StudioApp` restores the unsaved `draft` from `sessionStorage`, warns if `baseRevision !== revision`, and preserves all edits until saved or discarded.
