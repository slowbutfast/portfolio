# Verification — vercel-preview-gating (partial: local verification complete, deployment verification pending)

Change: `vercel-preview-gating`
Branch: `worktree-vercel-preview-gating` (worktree off `master` at `de357c0`)
Verified: 2026-11-12

> **Status: PARTIAL.** Everything that can be verified without a Vercel deployment is verified below. Tasks 3.4, 3.5, 4.4, 4.5, 4.6, 6.2, 6.3, 6.4 need Vercel team access (MCP approval pending), repository secrets, or branch-protection changes, and are listed under *Open*.

## Outcome Summary

| Command | Result |
| :--- | :--- |
| `npm run typecheck` | **PASS** — 0 diagnostics |
| `npm run build` (`tsc --noEmit && vite build`) | **PASS** — 9 `.woff2` emitted, 0 `data:font` |
| Build with injected type error | **FAILS as intended** — `TS2322`, exit 2, no `dist/` produced; probe file removed afterwards |
| `REQUIRE_DIST=1 npx vitest run` | **PASS** — 9 files, 52/52 tests |
| `npm run test:e2e` (local dev server) | **PASS** — 59 passed, 15 skipped (10 preview-only, 5 desktop-only), 0 failed |
| Full e2e against emulated `vercel.json` headers (strict CSP) | **PASS** — 62 passed, 12 skipped, 0 failed, zero console errors |
| `e2e/preview-headers.spec.ts` against emulated headers | **PASS** — 5/5 |
| Pre-flight vs a fake protected preview (no secret) | **Aborts with one actionable message** naming `VERCEL_AUTOMATION_BYPASS_SECRET` |
| Pre-flight vs fake protected preview (wrong secret) | **Aborts**; secret value appears 0 times in output |
| Pre-flight vs fake protected preview (accepted secret) | **Passes setup**; reaches app assertions (which fail, as expected against a fake server) |
| Workflow YAML | **Parses** (Ruby `YAML.load_file`); `actionlint` not installed |
| Secret-echo scan of workflows | **Clean** — `secrets.*` appears only in `env:` assignments; no `set -x`, no echo of values |

## Requirement Adherence Matrix

### `edge-deployment`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Universal immutable caching (single `/assets/(.*)` rule; font and entry-document scenarios) | `src/utils/edgeConfig.test.ts` (rule count, value, no other `/assets/` rule); header spec checks fonts and entry document against the emulated edge | Met locally; **deployment pending** |
| Automated preview verification (bypass headers, pre-flight, skip of dev-only test) | `playwright.config.ts`, `e2e/global-setup.ts`, `src/utils/previewPreflight.test.ts`; fake-protected-server runs above; Profiler test skips when `PREVIEW_URL` is set | Met locally; **real protected preview pending** |
| Fonts emitted as files | `src/utils/buildOutput.test.ts` with `REQUIRE_DIST=1`: 9 `.woff2`, 0 `data:font` | Met |
| Build provenance resolution order | `src/utils/commitHash.test.ts` (6 tests); `vite.config.ts` uses `resolveCommitHash` with git stderr suppressed | Met (unit); real Vercel env pending |
| Committed config pinned by tests | `src/utils/edgeConfig.test.ts` (11 tests incl. a negative `'unsafe-inline'` fixture) | Met |
| Served headers asserted against spec | `e2e/preview-headers.spec.ts` (5 tests) passes against the emulated edge | Met against emulation; **deployment pending** |
| Console/CSP error tracking across flows | `trackErrors()` now asserted in load, list→drawer, terminal, deep link, unknown deep link, About, and `#/about` tests; all pass under the emulated strict CSP | Met against emulation; **deployment pending** |

### `release-gating`

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Typecheck in the production build | `package.json` build script guard test; deliberate type error failed the build | Met |
| Pull request gate | `workflows/ci.yml` staged and parses | **Staged, not installed** (`.github/` writes denied here) |
| Preview deployment gate | `workflows/preview.yml` staged and parses | **Staged, not installed; unproven on a real event** |
| Production deployment verification | `workflows/preview.yml` production branch of the job | **Staged, not installed** |
| Documented promotion and rollback | `README.md`: Promotion and Rollback, Release Gating, bypass-secret setup | Met |
| Bypass secret never printed or uploaded | Tracing forced off when the secret is set; wrong-secret run printed it 0 times; workflow scan clean | Met locally; artifact scan on a real run pending |

## Findings

1. **The strict committed CSP works with the redesigned app under emulation.** The full suite, including every console-error assertion, passes against `dist/` served with the `vercel.json` headers. This removes the main concern that an earlier, uncommitted looser `vercel.json` had been loosened for a reason. It is still an emulation; a real preview run remains the authoritative check.
2. **My earlier "drift" finding was wrong.** The `'unsafe-inline'` / `data:` / `blob:` policy I reported came from an uncommitted working copy that no longer exists. The committed `vercel.json` already matched the spec (see `research.md`, Superseded claims). The guard tests now make that permanent.
3. **Two e2e tests are skipped against a deployment**: the Profiler zero-commit test (React production builds never call `onRender`, so it would pass vacuously). The CPU-throttle frame-rate test still runs on desktop against a deployment and may be noisy over a network.
4. **The workflow files are not under `.github/`.** Writes to that directory are denied in this session, so `ci.yml` and `preview.yml` are staged under `openspec/changes/vercel-preview-gating/workflows/` for you to install.

## Resolved Assumptions

| Assumption | Resolution |
| :--- | :--- |
| Strict CSP might break the redesigned app | Not in emulation: 62 passed, zero console errors |
| `.woff2` subsets might be inlined as `data:` | No: 9 emitted as files, 0 `data:font` in built JS/CSS |
| A type error might not fail the build | It fails: exit 2 before `vite build`, no `dist/` |
| Missing-secret runs would fail confusingly | They abort once with a message naming the secret |
| `.vercelignore` affects Git-integration builds | Not relevant; resolver lives under `src/` regardless |

## Deployment Findings (2026-11-12)

| Finding | Evidence |
| :--- | :--- |
| The Vercel project is `portfolio` (`prj_W6EpbJ3ZH6cxKxsQIhhGC45WFX8a`), linked to `slowbutfast/portfolio`, production branch `master` | Vercel MCP `get_project`, `list_deployments` |
| Deployment Protection is `all_except_custom_domains`: the production alias is public (200), per-deployment and branch URLs return 302 to Vercel SSO, including production deployment URLs | `get_project`; anonymous `fetch` |
| **Real production edge passes the header spec 5/5 and the full suite 62/62 with zero console errors** under the actual strict CSP | `PREVIEW_URL=https://portfolio-two-dusky-55.vercel.app npx playwright test` |
| **`deployment_status` never fires for this project**: Vercel creates no GitHub Deployments (`gh api .../deployments` empty after four deployments; no `deployment-gate` run started). Vercel's documented trigger is `repository_dispatch` (`vercel.deployment.success`) | `gh api`, `gh run list`, Vercel docs via MCP |
| `ci` passed on its first real run (PR #3, 1m23s) | `gh pr checks 3` |
| `ci` is now a required check on `master`; admins are not restricted | `gh api -X PUT .../branches/master/protection` |
| **Rollback drill passed**: rollback to `dpl_5yUJ…` moved all three production aliases and the header spec passed (5/5); promoting `dpl_3XnSJi83…` restored them and the header spec passed again | `request_rollback`, `request_promote`, `get_deployment`, Playwright |
| Project Node setting is `26.x` while `package.json` `engines.node` is `22.x` and CI uses 22 | `get_project`; `package.json` |

## Still Open

- **`preview.yml` must be replaced on `master`.** The merged version listens for `deployment_status`, which never fires. The corrected `repository_dispatch` version is staged in `openspec/changes/vercel-preview-gating/workflows/preview.yml`; `.github/` is write-denied in this session, so it needs to be copied to `.github/workflows/preview.yml` and merged to `master`.
- **Bypass secret in GitHub.** Created in Vercel (`isEnvVar: true`); `gh secret set` was denied. Until `VERCEL_AUTOMATION_BYPASS_SECRET` exists as a repository secret, every gate run fails fast by design.
- **Real gate proof** (tasks 3.4, 3.5, 6.2, 6.3): a dispatch-triggered run, the recorded payload shape, a commit status, and the artifact secret scan.
- **`preview-e2e` as a required check** (after it has reported once).
- **Node version**: decide whether the project's `26.x` setting should match `engines` (`22.x`).

## Open (superseded by *Still Open* above where noted)

- **Vercel project state** (task 4.4): link to `slowbutfast/portfolio`, production branch, Deployment Protection, system-env exposure. The Vercel MCP returns 403 for team scope `joeshmo` until team access is approved via the one-time link.
- **`repository_dispatch` payload shape**: environment values, `git.sha`/`git.ref`, whether `url` has a scheme. Recorded in the first run's summary.
- **Chromium reports CSP violations as console errors** on a real deployment (task 3.5).
- **Real preview run** (3.4, 6.2): header spec and full suite against a protected preview with the bypass secret.
- **Default-branch constraint**: confirm `preview.yml` must live on `jammy-falcon` for the gate to fire.
- **Required checks** (4.6) and the **Instant Rollback drill** (6.4, needs explicit approval).
- **`actionlint`** was not available; workflow validation is YAML parse plus manual review only.

## Verbatim Execution Logs

### `npm run build` with a deliberate type error

```text
> node-portfolio-graph@0.1.0 build
> tsc --noEmit && vite build

src/__typeerror_probe.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.
BUILD_EXIT=2
ls: cannot access 'dist': No such file or directory
```

### `REQUIRE_DIST=1 npx vitest run`

```text
 ✓ src/data/projects.test.ts (7 tests)
 ✓ src/physics/graphSimulation.test.ts (6 tests)
 ✓ src/utils/commitHash.test.ts (6 tests)
 ✓ src/utils/edgeConfig.test.ts (11 tests)
 ✓ src/utils/graphTopology.test.ts (4 tests)
 ✓ src/utils/terminalCommandResolver.test.ts (4 tests)
 ✓ src/utils/drafting.test.ts (6 tests)
 ✓ src/utils/buildOutput.test.ts (3 tests)
 ✓ src/utils/previewPreflight.test.ts (5 tests)

 Test Files  9 passed (9)
      Tests  52 passed (52)
```

### Header spec against the emulated edge (`PREVIEW_URL=http://localhost:5198`)

```text
  ✓ served edge headers › serves the specified Content-Security-Policy as a directive set
  ✓ served edge headers › serves the other specified security headers
  ✓ served edge headers › serves every font as an immutable woff2 asset
  ✓ served edge headers › does not long-cache the entry document
  ✓ served edge headers › returns a real 404 for a missing asset
  5 passed (1.6s)
```

### Full suite against the emulated edge

```text
  12 skipped
  62 passed (48.5s)
```

### Pre-flight against a fake protected preview (no secret)

```text
Error: Preview pre-flight failed: Preview returned 401. The preview is protected by Vercel Deployment Protection. Set VERCEL_AUTOMATION_BYPASS_SECRET (the project's "Protection Bypass for Automation" secret) so requests carry x-vercel-protection-bypass.
```

### `npm run test:e2e` (local dev server)

```text
  15 skipped
  59 passed (56.4s)
```
