# Verification: `studio-remote-oauth`

Executed on 2026-11-15 from the implementation worktree. All commands ran with
Node 22.x after `npm ci`.

## Requirement Adherence Matrix

| Requirement / Scenario | Implementation | Evidence |
|---|---|---|
| Main portfolio chunk excludes Studio UI and all assets exclude secrets | `src/App.tsx` always uses `lazy(() => import('./studio/StudioApp'))`; Studio uses `/api/studio` only in prod | `npm run build` emits `StudioApp-B3g07x3X.js` (28.40 kB); `index-C4Kq4uk-.js` has zero `studio-app` / `Sign in with GitHub` markers; `src/utils/buildOutput.test.ts` asserts both and scans all of `dist/` for `GITHUB_PAT`, `GITHUB_CLIENT_SECRET`, `STUDIO_SESSION_SECRET`, `/__studio/api` |
| Deterministic `503` vs `401` | `requireConfig` runs before auth in every handler | `studioAuth.test.ts` route enumeration: all auth-gated handlers → `401`; empty env → `503` |
| Canonical-domain OAuth, empty scope, PKCE S256, one-time state | `api/studio/login.ts`, `callback.ts`, `_lib/auth.ts` | Unit test asserts `scope=` empty, exact `redirect_uri`, `code_challenge_method=S256`, state mismatch → `403` + `studio_oauth_tx` cleared |
| Immediate user-token disposal, 2h session, session-bound CSRF | `callback.ts` clears the token after `GET /user`; `signSession`/`csrfToken` | Unit test captures all fetch URLs and asserts `user-token-secret` never appears in cookies/body; session cookies carry `Max-Age=7200`; CSRF differs per `sid` |
| `Origin` / `Sec-Fetch-Site` and `X-Studio-CSRF` | `assertSameOrigin`, `assertCsrf`, `requireMutation` | Unit test: missing CSRF → `403`, evil `Origin` → `403`, valid headers reach payload validation (`400`) |
| Dynamic `default_branch` + `studio/catalog` ahead-of-base reads | `GitHubCatalogAdapter.resolveSource` uses repo metadata and the Compare API | Unit test with `main`/`trunk`: ahead → reads target; identical/behind → reads default |
| Ref create/reset + concurrent `422 Reference already exists` | `resetTargetRef` PATCH → POST → PATCH retry | Unit test scripts `PATCH 404`, `POST 422`, `PATCH 200` and expects success |
| Stale revision / SHA mismatch → `409 Conflict` | Revision checked against the source branch before mutation; base-commit file SHA pinned on reset | Unit tests: stale revision never touches refs; `409` and SHA `422` → `CatalogConflictError`; non-SHA `422` preserved |
| Bounded auditing (`retries: 0`, 8s deadline, 50 URLs, concurrency 4) | `runBoundedAudit` in `src/studio/catalogService.ts`; `maxDuration = 10` | Unit tests: 60 URLs → 50 checks, all `retries: 0`, peak concurrency ≤ 4, hanging check resolves as `audit deadline exceeded` |
| Committed manifest, zero drift, no `scripts/` on Vercel | `api/studio/_lib/asset-manifest.json` + static `manifest.ts` import | Unit test walks `src/assets` + `src/data/captured` and compares; `.vercelignore` unchanged |
| Pure server core | `src/utils/graphEdges.ts` | Unit test asserts zero `projects.catalog.json` / `tagRegistry` imports in `graphEdges.ts`, `catalogSchema.ts`, `catalogService.ts` |
| `sessionStorage` draft restore + base-revision drift warning | `StudioApp` `studio_pending_draft` save/restore; pending draft consumed once via a ref to survive StrictMode | `e2e/studio.spec.ts` restores a draft, shows `studio-draft-drift`, keeps “Unsaved changes”, then clears on Discard |
| Production auth shell | `StudioApp` `studio-auth-shell` / `studio-unconfigured` | Rendered on `401` / `503`; covered by handler unit tests; live preview needs deployed OAuth env |

## Verbatim Execution Logs

### Typecheck and unit tests

```text
$ npx tsc --noEmit
(exit 0)

$ npx vitest run
Test Files  23 passed (23)
     Tests  270 passed (270)
  Duration  6.47s
```

New suites: `src/utils/studioAuth.test.ts` (27 tests) plus three build-output
guards in `src/utils/buildOutput.test.ts`.

### Production build

```text
$ npm run build
✓ 1973 modules transformed.
dist/assets/StudioApp-B3g07x3X.js    28.40 kB │ gzip: 8.07 kB
dist/assets/index-C4Kq4uk-.js       360.40 kB │ gzip: 114.74 kB
✓ built in 3.64s

main chunks: index-C4Kq4uk-.js
index-C4Kq4uk-.js studio-app marker: false
studio chunk: StudioApp-B3g07x3X.js
```

### Link audit

```text
$ npm run test:links
16 URLs: 13 pass, 1 warning, 2 fail
FAIL 404 https://github.com/slowbutfast/sandwave-sim
FAIL 404 https://github.com/slowbutfast/transcribe-plus
WARNING 999 https://www.linkedin.com/in/gregory-lazatin/
```

Both failures are pre-existing repository URLs unrelated to this change (the
catalog was not modified), so the script exits `1`. All other links pass.

### E2E (dev Studio)

```text
$ CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts
7 passed, 7 skipped (19.3s)
```

Desktop: create/rename/save/delete, tags, crossing guard, Check Links, route
open/exit, `sessionStorage` draft restore + drift warning. Mobile: tabs, zero
overflow, ≥44px targets, numeric seed editing.

### E2E (portfolio)

```text
$ CI=1 npx playwright test --config=./playwright.config.ts   # port 5199 occupied by another worktree
$ CI=1 npx playwright test --config=./playwright.temp.config.ts  # same config on 5198
112 passed, 38 skipped (3.9m)
```

## Resolved Assumptions

- **No `e2e/smoke.spec.ts` exists**; draft restoration and route coverage live in
  `e2e/studio.spec.ts`.
- **Revision** is an opaque adapter value: GitHub returns the Contents API blob
  SHA (and passes it back as `sha` on `PUT`), while the local dev adapter keeps
  `sha256(serialized bytes)`. Clients only round-trip it.
- **`studio_session` / `studio_oauth_tx` cookies** use `Path=/api/studio`; the
  CSRF cookie uses `Path=/` so the SPA can echo it. Session/tx stay `HttpOnly`.
- **`STUDIO_TARGET_BRANCH`** is optional and defaults to `studio/catalog`.
- **`STUDIO_OAUTH_REDIRECT_URI`** must be an exact absolute URL ending in
  `/api/studio/callback`; wildcards are rejected during config validation.
- **GitHub token exchange** uses a JSON body with `code_verifier`; GitHub returns
  JSON because `Accept: application/json` is set.
- **`studio/catalog` GET** uses the Compare API and accepts only `status: ahead`;
  `identical`, `behind`, and `diverged` fall back to the default branch.

## Outstanding Owner Actions

1. Register the canonical-domain GitHub OAuth App with the exact callback URL and
   set all Vercel env vars listed in `tasks.md` §5.1 (`GITHUB_CLIENT_ID`,
   `GITHUB_CLIENT_SECRET`, `STUDIO_OAUTH_REDIRECT_URI`, `STUDIO_OWNER_ID`,
   `STUDIO_SESSION_SECRET`, `GITHUB_PAT`, `GITHUB_REPO`, optional
   `STUDIO_TARGET_BRANCH`).
2. Create a repo-scoped PAT with `contents: write` and an expiry, and protect
   `master` with a ruleset requiring PRs (include administrators).
3. Run `vercel build`/preview deploy and the `PREVIEW_URL` E2E auth-shell check;
   confirm `.vercel/output` bundles `asset-manifest.json` and exposes no
   `/api/studio/_lib/*` routes.
