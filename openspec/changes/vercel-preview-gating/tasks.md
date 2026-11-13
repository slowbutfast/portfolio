## 1. Test Scaffolding (TDD)

- [x] 1.1 Add `src/utils/commitHash.test.ts` with failing tests for the `resolveCommitHash` resolution order (Vercel SHA, git fallback, `dev`, empty string, short SHA, blank git output)
- [x] 1.2 Add `vercel.json` guard tests (single `/assets/(.*)` immutable rule, CSP directive map equals the spec policy, required security headers, negative fixture for `'unsafe-inline'`) and a `package.json` build-script guard that fails until `build` typechecks first
- [x] 1.3 Add a build-output guard test (at least one `.woff2` in `dist/assets/`, no `data:font` in built JS/CSS)
- [x] 1.4 Scaffold `e2e/preview-headers.spec.ts` (skipped unless `PREVIEW_URL` is set) asserting served CSP as a directive set, the other security headers, font cache headers discovered from page load, root revalidation, and a 404 for a missing asset
- [x] 1.5 Extend the drawer-open, deep-link, About, and terminal e2e tests to assert `trackErrors()` is empty, and skip the Profiler zero-commit test when `PREVIEW_URL` is set
- [x] 1.6 Scaffold the `e2e/global-setup.ts` auth-wall pre-flight expectations (fails with a message naming `VERCEL_AUTOMATION_BYPASS_SECRET`)

## 2. Build and Config

- [x] 2.1 Implement `src/utils/commitHash.ts` and wire it into `vite.config.ts` with an `execSync` runner that cannot throw and suppresses git stderr
- [x] 2.2 Change `package.json` `build` to `tsc --noEmit && vite build` and verify once that an injected type error fails it, then revert the error
- [x] 2.3 Confirm `vercel.json` and `assetsInlineLimit: 0` already satisfy the guard tests; change them only if a guard fails
- [x] 2.4 Run the build-output guard against a real `npm run build` and record the `.woff2` count and the `data:font` result

## 3. Preview Access and Test Hardening

- [x] 3.1 Update `playwright.config.ts`: when `VERCEL_AUTOMATION_BYPASS_SECRET` is set, add `extraHTTPHeaders` (`x-vercel-protection-bypass`, `x-vercel-set-bypass-cookie`) and force tracing off
- [x] 3.2 Implement `e2e/global-setup.ts` (runs only when `PREVIEW_URL` is set) and register it in `playwright.config.ts`
- [x] 3.3 Locally emulate the deployed headers (serve `dist/` with `vercel.json` headers) and run the e2e suite against it; record any CSP console errors as findings
- [x] 3.4 Make the scaffolded header spec pass against a protected preview (needs a deployment; blocked on Vercel access and bypass secret) (done: full suite 62 passed / 12 skipped and header spec green against a protected preview with the bypass secret, after ignoring Vercel's injected toolbar script)
- [x] 3.5 Confirm Chromium reports a deliberate CSP violation as a `console` error on a deployment and record the result (blocked on a deployment) (done: a CSP violation on a real preview surfaced as a console error: the blocked vercel.live toolbar script)

## 4. CI Workflows and Repository Settings

- [x] 4.1 Add `ci.yml` (staged in `openspec/changes/vercel-preview-gating/workflows/` because writes to `.github/` are denied here; copy to `.github/workflows/`): on `pull_request`, Node 22, `npm ci`, `typecheck`, `test:unit`, Playwright browser install, `test:e2e`, upload report on failure
- [x] 4.2 Add `preview.yml` (staged alongside `ci.yml`): on `repository_dispatch` `vercel.deployment.success`; branch on the payload environment; checkout the payload SHA; run the preview suite (Preview) or header + load test (Production); post `preview-e2e` / `production-smoke` commit status; least-privilege permissions; per-SHA concurrency; no secret echo; no trace artifacts
- [x] 4.3 Validate both workflows (actionlint if available, otherwise YAML parse) and grep for secret echoes
- [x] 4.4 Read Vercel project state through the Vercel MCP (project link, production branch, Deployment Protection, system-env exposure) and record findings (done: project `portfolio`, production branch `master`, SSO protection `all_except_custom_domains`, only the production alias is public; system-env exposure is not shown by `get_project`, so `VERCEL_GIT_COMMIT_SHA` availability in builds remains unverified)
- [x] 4.5 Add the `VERCEL_AUTOMATION_BYPASS_SECRET` repository secret and land `ci.yml` and `preview.yml` on the default branch (workflows landed via PR #3; `preview.yml` needs a `repository_dispatch` rewrite via `.github/` which is write-denied here; the bypass secret exists in Vercel but `gh secret set` was denied, so storing it in GitHub is user-owned) (done by the user: the secret is set and the repository_dispatch preview.yml is on master)
- [ ] 4.6 After each context has reported once, mark `ci` and `preview-e2e` as required checks in branch protection (partial: `ci` is required on `master`; `preview-e2e` is deliberately NOT required because Vercel is not emitting the dispatch events that produce it, so requiring it would block every merge)

## 5. Documentation

- [x] 5.1 Update `README.md` deployment section: production branch, merge-to-promote flow, bypass-secret setup, Instant Rollback steps (including plan limits), rollback triggers, and header spot-check commands
- [x] 5.2 Note the strict-CSP follow-up path in the README if task 3.3 or 3.4 finds the policy needs changing

## 6. Verification & Empirical Audit

- [x] 6.1 Run `npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, and `npm run build`; record pass counts
- [ ] 6.2 Push the branch, confirm the preview deployment triggers the gate, and record the run URL, commit status, and header assertion results (partial: proven with synthetic dispatches carrying real deployment data; a real Vercel-emitted event has not been observed)
- [x] 6.3 Run the secret-leak scan over the preview run's logs and artifacts (blocked on 6.2) (done: logs show only the masked value; the failed run's 28 uploaded files contain no traces, no bypass header names, and no secret-shaped tokens)
- [x] 6.4 Perform an Instant Rollback drill on a non-critical deployment with the user's explicit approval (done: rolled back to `dpl_5yUJ…`, header spec 5/5, promoted `dpl_3XnSJi83…` back, header spec 5/5; user approved)
- [x] 6.5 Populate `verification.md` with the Requirement Adherence Matrix for both specs, the resolved unverified assumptions from `research.md`, and verbatim execution logs
