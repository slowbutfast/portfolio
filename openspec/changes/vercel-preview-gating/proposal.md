## Why

The redesign is merged, but nothing proves it behaves correctly under the real Vercel headers. There is no CI (research.md, Verified facts), `npm run build` is `vite build` so type errors do not fail a deploy, local e2e runs against `vite dev` which applies none of the `vercel.json` headers, and the Vercel preview that would apply them sits behind Deployment Protection so Playwright cannot reach it. The committed `vercel.json` already matches `openspec/specs/edge-deployment/spec.md` (strict CSP, universal immutable `/assets/*` caching) and fonts are already never inlined, but no test pins any of that, so it can drift silently. We need the preview deployment to be a reachable, automated gate.

## What Changes

- **Guard tests for config that is already correct**: assert in Vitest that `vercel.json` has the single `/assets/(.*)` immutable rule and a CSP equal to the spec policy, and that a production build emits fonts as files with no `data:font` in `dist/`.
- **Make `__COMMIT_HASH__` fail-soft and testable**: replace the inline `execSync` in `vite.config.ts` with `resolveCommitHash(env, runGit)` in `src/utils/`, resolving `VERCEL_GIT_COMMIT_SHA` (first 7 chars), then `git rev-parse --short HEAD`, then `dev`, never throwing and never printing git stderr.
- **Typecheck before build**: `npm run build` becomes `tsc --noEmit && vite build`.
- **Make previews reachable by Playwright**: when `VERCEL_AUTOMATION_BYPASS_SECRET` is set, `playwright.config.ts` sends `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie`, forces tracing off, and a `globalSetup` pre-flight aborts with a clear message if the response is the Vercel authentication page.
- **Broaden error tracking**: assert zero console/page errors in the drawer-open, deep-link, About, and terminal flows, not only load; skip the Profiler-based zero-commit test when `PREVIEW_URL` is set because React production builds do not fire `onRender`.
- **Add a served-header assertion spec** (`e2e/preview-headers.spec.ts`, preview-only): compares the deployed CSP as a directive set, checks the other security headers, discovered `.woff2` cache headers, root revalidation, and a real 404.
- **Add GitHub Actions**: a PR gate (`typecheck`, `test:unit`, local `test:e2e`) and a deployment gate triggered by Vercel's `repository_dispatch` (`vercel.deployment.success`) events for Preview and Production deployments that posts commit statuses.
- **Document promotion and rollback** in `README.md`.

**Deferred decision**: whether the strict committed CSP works end-to-end in a real deployment is verified by the first preview-gate run. An uncommitted local `vercel.json` seen earlier was looser (`'unsafe-inline'`, `data:`, `blob:`) for an unknown reason; if the strict policy breaks the app, the fix is a follow-up change, not a silent loosening here.

## Capabilities

### New Capabilities
- `release-gating`: CI workflows (PR gate and deployment gate), Deployment Protection bypass for automation, and the documented promotion/rollback procedure.

### Modified Capabilities
- `edge-deployment`: caching gains explicit font and entry-document scenarios; preview verification gains bypass headers, a pre-flight, and broader error tracking; added requirements for fonts emitted as files, fail-soft build provenance, and a served-header assertion.

## Impact

- **Files**: `vite.config.ts`, new `src/utils/commitHash.ts` (+ unit test; under `src/` because `.vercelignore` excludes `scripts/`), `package.json` (build script), `playwright.config.ts`, `e2e/portfolio.spec.ts`, new `e2e/preview-headers.spec.ts`, new `e2e/global-setup.ts`, new config guard tests under `src/`, new `.github/workflows/ci.yml` and `.github/workflows/preview.yml`, `README.md`. `vercel.json` is expected to need no change.
- **Dependencies**: none added.
- **Secrets / settings** (outside the repo): a GitHub Actions secret `VERCEL_AUTOMATION_BYPASS_SECRET` sourced from the Vercel project's Protection Bypass for Automation; confirmation of production branch and system-env exposure in Vercel Project Settings (via the Vercel MCP once team access is approved).
- **Ordering**: assumes `swiss-drafting-redesign` is merged (it is, `de357c0`).
- **Risk**: the deployment gate is only as good as the unverified assumptions in research.md (dispatch payload shape, bypass behaviour on a real run); the first workflow run is the verification.
