## Source material

### User request (2026-11-11)

> "can you propose a vercel deployment plan, assuming this last openspec change gets implemented correctly?"

"This last openspec change" was `swiss-drafting-redesign` (self-hosted variable fonts, `__COMMIT_HASH__`, axe audit). It has since merged (PR #2) and been archived (`de357c0`). The follow-up `/openspec-ff-change` invocation carried no description, so the scope of this change was **inferred** from the deployment plan given in reply. Flagged so a later reader can audit whether the inference was fair.

### Apply request (2026-11-12)

> "the vercel deployment change. and can you do it on a worktree. and use the vercel mcp that i have enabled."

Implementation happens in a git worktree on branch `worktree-vercel-preview-gating`, based on `master` (`de357c0`). The Vercel MCP is used for reading project, deployment, and settings state.

### Deployment plan summary (assistant response, 2026-11-11)

1. Close deployment gaps the redesign opens (font cache headers, no inlined fonts, commit-SHA fallback, typecheck in the build).
2. Confirm branch/environment setup (production branch vs repo default).
3. Make the preview deployment the real test gate (protection bypass for Playwright, broader error tracking, GitHub Actions).
4. Define promotion and rollback.

### Raised but not acted on

- **Preloading the primary Latin font subset**: Vite hashes filenames; needs a plugin or `?url` import. Deferred until Lighthouse shows a measurable first-paint cost.
- **Vercel Web Analytics / Speed Insights**: would work under the current CSP; not needed here.
- **Lighthouse CI as a required check**: scores are recorded once as a baseline, not enforced.
- **Tightening or loosening the CSP**: out of scope. The committed policy already matches the spec; the preview gate verifies it works in a real deployment.

## Glossary

| Term | Means | Does NOT mean |
| :--- | :--- | :--- |
| **Preview deployment** | A Vercel deployment built from a non-production branch push, at a unique `*.vercel.app` URL, serving the same build output and `vercel.json` headers as production | A local `vite dev` or `vite preview` server. Neither applies `vercel.json` headers |
| **Deployment Protection** | Vercel access control (Vercel Authentication / password) in front of preview URLs | Application-level auth. Playwright receives the Vercel login page, not the app, when it is active |
| **Protection Bypass for Automation** | A project secret sent as `x-vercel-protection-bypass` so automated clients can reach protected previews | A way to disable protection for human visitors |
| **Production branch** | The Git branch whose pushes Vercel promotes to the production alias | The local branch you consider "main". Defaults to the repo's default branch (`jammy-falcon`), not necessarily `master` |
| **Instant Rollback** | Repointing the production alias to a previous successful deployment without rebuilding | A `git revert` |
| **PR gate** | The GitHub Actions job running typecheck, unit tests, and local-server e2e on pull requests | The Vercel build. Vercel runs the `build` script only |
| **Preview gate** | The GitHub Actions job running e2e against `PREVIEW_URL` after a successful preview deployment | The PR gate. Only this job exercises the real CSP headers |
| **CSP drift** | A difference between the CSP in `openspec/specs/edge-deployment/spec.md` and the header actually served | A CSP violation in the browser |

## External research

| Source | What it establishes | Licence | Accessed |
| :--- | :--- | :--- | :--- |
| Vite 7.3.6 type declarations (`node_modules/vite/dist/node/index.d.ts`) | `build.assetsInlineLimit` accepts a number or a callback; `0` disables inlining | MIT | 2026-11-11 |
| Vercel MCP: `list_teams` / `list_projects` | `list_teams` returned no teams; `list_projects` failed 403 for team scope `joeshmo` (`team_dYlLIM0vHe3anzqlJsfzbOjL`) until the user approves access via `authorize_team_access` | n/a | 2026-11-12 |
| Vercel docs via MCP `search_vercel_documentation` (Vercel for GitHub) | `deployment_status` is the legacy trigger; use `repository_dispatch` type `vercel.deployment.success`, deployment URL at `github.event.client_payload.url`; the workflow file must exist on the default branch; bypass secret is passed as `VERCEL_AUTOMATION_BYPASS_SECRET` | Proprietary docs, excerpts not reproduced | 2026-11-12 |

Failed lookup recorded: project listing via the Vercel MCP was blocked pending team authorization (above).

## Candidate tech

| Option | Decision | Reason | Date |
| :--- | :--- | :--- | :--- |
| Keep the single `/assets/(.*)` immutable rule already in `vercel.json` | **Adopted** (no change) | Bundled media is imported from `src/assets/` so every file under `/assets/` is content-hashed; the rule covers fonts, scripts, styles, media | 2026-11-12 |
| Separate `/assets/(.*\.woff2)` rule | **Rejected** | Redundant with the universal rule | 2026-11-11 |
| Keep `assetsInlineLimit: 0` (global) already in `vite.config.ts` | **Adopted** (no change) | Prevents fonts becoming `data:` URIs, which `default-src 'self'` blocks; a `.woff2`-only callback is not needed | 2026-11-12 |
| `font-src 'self' data:` | **Rejected** | Loosens the CSP to suit a bundler optimisation | 2026-11-11 |
| GitHub Actions for the PR gate and preview gate | **Adopted** | Repo is on GitHub, no CI exists, `PREVIEW_URL` support exists in `playwright.config.ts` | 2026-11-11 |
| Vercel build as the only gate | **Rejected** | `vite build` does not typecheck or run tests | 2026-11-11 |
| Disabling Deployment Protection on previews | **Rejected** | Exposes unreleased work; the bypass header achieves the same for CI only | 2026-11-11 |
| Inline `execSync('git rev-parse')` only (current) | **Replaced** | Untestable, prints git stderr on failure, ignores `VERCEL_GIT_COMMIT_SHA` unless git throws | 2026-11-12 |
| Pure `resolveCommitHash(env, runGit)` in `src/utils/` | **Adopted** | Testable; `scripts/` is excluded by `.vercelignore`, so the resolver must live elsewhere | 2026-11-11 |

## Patterns adopted

- **Preview-URL e2e**: from the archived `vercel-edge-deployment` change (`PREVIEW_URL` in `playwright.config.ts`); this change adds authentication and a CI trigger.
- **Header assertion over documentation**: a test fetches deployed headers and compares them to the specified policy.
- **Fail-soft build metadata**: provenance resolves through an ordered fallback chain and never throws.

## Verified facts

All rows verified against `master` at `de357c0` in the worktree on 2026-11-12 unless noted.

| Claim | Value | How verified | Date | Volatility |
| :--- | :--- | :--- | :--- | :--- |
| Committed CSP | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'` | Read worktree `vercel.json` | 2026-11-12 | decays |
| Committed header set | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; no HSTS, no `cleanUrls`, no `/index.html` rule | Read worktree `vercel.json` | 2026-11-12 | decays |
| Committed cache rules | One rule: `/assets/(.*)` → `public, max-age=31536000, immutable` | Read worktree `vercel.json` | 2026-11-12 | decays |
| Main spec matches committed config | CSP and cache requirement text agree with `vercel.json` | Read `openspec/specs/edge-deployment/spec.md` against `vercel.json` | 2026-11-12 | decays |
| `vercel.json` history | Two commits: `de25889`, `46876d4` ("strict CSP, immutable caching") | `git log --oneline -- vercel.json` | 2026-11-12 | stable |
| Fonts never inlined | `build.assetsInlineLimit: 0` | Read `vite.config.ts` | 2026-11-12 | decays |
| Commit hash order today | `git rev-parse` first; `VERCEL_GIT_COMMIT_SHA` only if git throws; then `dev` | Read `vite.config.ts` | 2026-11-12 | decays |
| No CI exists | No `.github/` in the worktree | `git ls-files` / directory listing at checkout | 2026-11-12 | decays |
| `build` script | `vite build` (no typecheck) | Read `package.json` | 2026-11-12 | decays |
| `PREVIEW_URL` support | Skips local `webServer` when set; no `extraHTTPHeaders`; `trace: 'on-first-retry'` | Read `playwright.config.ts` | 2026-11-12 | decays |
| Error tracking scope | `trackErrors()` asserted in 2 tests: the load test and the unknown-deep-link test | Read `e2e/portfolio.spec.ts` | 2026-11-12 | decays |
| Default remote branch | `origin/jammy-falcon`; `master` is ahead of it | `git remote`/branch listing | 2026-11-12 | decays |
| Redesign merged and archived | PR #2 merged; `openspec/changes/archive/2026-11-12-swiss-drafting-redesign/` exists | `git log` on `master` | 2026-11-12 | stable |
| `.vercelignore` entries | `.git/`, `.agent/`, `.claude/`, `.codex/`, `.opencode/`, `openspec/`, `e2e/`, `test-results/`, `playwright-report/`, `scripts/`, `dist/`, `node_modules/`, `*.log`, `.DS_Store` | Read file | 2026-11-12 | decays |
| Repo remote | `https://github.com/slowbutfast/portfolio` | Earlier `git remote -v` | 2026-11-11 | stable |
| GitHub default branch is now `master`; repo is public | `{"default":"master","private":false}` | `gh repo view slowbutfast/portfolio --json defaultBranchRef,isPrivate` | 2026-11-12 | decays |
| Vercel MCP access works for team `joeshmo` (`team_dYlLIM0vHe3anzqlJsfzbOjL`) | `list_projects` returned 4 projects | Vercel MCP `list_projects` after the user approved access | 2026-11-12 | decays |
| No Vercel project exists for this repo | Projects present: `kintsugi-fracture`, `sandwave-sim`, `open-dungeon`, `transcribe-plus-frontend`; `list_projects` filtered by `repoUrl` returned none | Vercel MCP `list_projects` (filtered and unfiltered) | 2026-11-12 | decays |
| Installed workflows equal the staged copies | `.github/workflows/ci.yml` and `preview.yml` identical to `openspec/changes/vercel-preview-gating/workflows/*` | `diff` | 2026-11-12 | decays |
| Vercel project exists and is linked to `slowbutfast/portfolio` | `portfolio` (`prj_W6EpbJ3ZH6cxKxsQIhhGC45WFX8a`), framework `vite`, deployments carry `githubRepo: portfolio`, `githubOrg: slowbutfast`, `githubCommitRef: master`, target `production` | Vercel MCP `get_project`, `list_deployments` after the user imported it | 2026-11-12 | decays |
| Production branch is `master` | Both production deployments are from `master`; the project record exposes no explicit branch field | `list_deployments` (`target: production`, `githubCommitRef: master`) | 2026-11-12 | decays |
| Deployment Protection | `ssoProtection: { enabled: true, deploymentType: "all_except_custom_domains" }`, password protection off | Vercel MCP `get_project` | 2026-11-12 | decays |
| Which URLs are protected | `portfolio-two-dusky-55.vercel.app` (production alias) returns 200 anonymously; the per-deployment URL and `portfolio-git-master-joeshmo.vercel.app` return 302 to `vercel.com/sso-api` | Anonymous `fetch` with `redirect: 'manual'` | 2026-11-12 | decays |
| Project Node setting | `nodeVersion: "26.x"` in the project record, while `package.json` `engines.node` is `22.x` and CI uses 22 | Vercel MCP `get_project`; `package.json` | 2026-11-12 | decays |
| Rollback candidates | Two READY production deployments: `dpl_5yUJ4YgWC2ULJAqjuq5Jv5Kyqh8m` (`b8bac53`, current) and `dpl_62cscbC3NGPzjS557tXx9ujth5mK` (`c386dd1`), both `isRollbackCandidate: true` | Vercel MCP `list_deployments` | 2026-11-12 | decays |
| Real production edge matches the spec | `e2e/preview-headers.spec.ts` passes 5/5 against `https://portfolio-two-dusky-55.vercel.app` (CSP directive set equal to the spec, other security headers, immutable `.woff2`, entry document not long-cached, real 404) | `PREVIEW_URL=<prod> npx playwright test e2e/preview-headers.spec.ts --project=desktop` | 2026-11-12 | decays |
| Strict CSP works with the app on the real edge | Full suite: 62 passed, 12 skipped, 0 failed, every console-error assertion green | `PREVIEW_URL=<prod> npx playwright test` | 2026-11-12 | decays |
| Bypass secret created | `automation-bypass` secret with `isEnvVar: true`, note "GitHub Actions deployment-gate (vercel-preview-gating)" | Vercel MCP `update_project_protection_bypass` | 2026-11-12 | decays |
| Workflow PR opened | PR #3 `ci/deployment-workflows` → `master`; first `ci` run pending at the time of writing | `gh pr create`, `gh pr checks 3` | 2026-11-12 | decays |
| Vercel creates no GitHub Deployments for this repo | `gh api repos/slowbutfast/portfolio/deployments` returned nothing after 4 Vercel deployments, and no `deployment-gate` run started after a preview and a production deployment completed | `gh api`, `gh run list` | 2026-11-12 | decays |
| Workflow PRs | PR #3 (workflows) merged; `ci` passed in 1m23s on its first run; PR #4 carries the implementation | `gh pr checks`, `gh pr merge` | 2026-11-12 | decays |

## Unverified assumptions

- **Vercel production branch, protection state, system-env exposure.** The project does not exist yet (see Verified facts); the user is importing it in the dashboard. Checking costs one `get_project` call afterwards. The GitHub default branch is `master`, so the default-branch constraint for dispatch-triggered workflows is satisfied once the workflow is merged to `master`.
- **Whether the Vercel GitHub integration can see `slowbutfast/portfolio`.** Confirmed implicitly when the dashboard import succeeds.
- **Whether `master` (remote) contains `.github/workflows/*`.** The files exist only in the worktree and as untracked files in the repository root; `deployment_status` workflows are read from the default branch, so they must be merged to `master` first.
- **Whether the strict committed CSP works end-to-end in a real deployment.** An uncommitted local `vercel.json` read earlier carried `'unsafe-inline'`, `data:` and `blob:`, which suggests someone may have needed them. The committed policy has not been exercised against the redesigned app in a deployment. Local emulation with `vite preview` plus the same headers is a partial check; a preview deployment is the real one.
- **Why that uncommitted copy was looser.** Unknown; its content is gone from the working tree.
- **Whether the `/index.html` header rule is needed.** The committed config has none; Vercel's default for static HTML is revalidation. Check with `curl -sI` on `/` after a deployment.
- **`repository_dispatch` payload shape.** Only `client_payload.url` is documented in what was retrieved; `environment`, `git.sha`, and `git.ref` are believed. The workflow records the payload so the first run settles it.
- **Chromium reports CSP violations as `console` errors.** Believed; the existing `trackErrors()` relies on it.
- **Instant Rollback limits on this plan.**
- **Fontsource subsets all emitted as files.** Believed given `assetsInlineLimit: 0`; confirmed by the build-output guard test.

## Superseded claims

- *Claim (assistant, 2026-11-11)*: the served CSP and cache rules had drifted from the spec (`'unsafe-inline'` in `style-src`, `data:`/`blob:`, split cache rules, HSTS, `cleanUrls`).
  - *Why wrong*: those values came from an **uncommitted working copy** of `vercel.json` that was dirty at session start. The committed `vercel.json` (`46876d4`) matches the spec exactly.
  - *Replaced by*: no reconciliation is needed; the change adds guard tests so the committed file cannot drift from the spec, and the preview gate checks the real deployment.
- *Claim (assistant, 2026-11-11)*: add a `.woff2`-specific cache rule.
  - *Why wrong*: the universal `/assets/(.*)` rule already exists.
  - *Replaced by*: a guard test asserting that rule.
- *Claim (assistant, 2026-11-11)*: add a `build.assetsInlineLimit` callback for `.woff2`.
  - *Why wrong*: `assetsInlineLimit: 0` already applies globally (merged in PR #2).
  - *Replaced by*: a build-output guard test.
- *Claim (assistant, 2026-11-11)*: add a new CSP assertion test for previews.
  - *Why wrong*: `trackErrors()` already fails tests on CSP console errors; the gaps are narrow coverage and no header comparison.
  - *Replaced by*: extended error tracking plus a header-assertion spec.
- *Claim (assistant, 2026-11-11)*: `.vercelignore`'s `.git/` entry affects Git-integration builds.
  - *Why wrong*: Vercel clones the repo itself; the entry only affects CLI uploads.
  - *Replaced by*: the resolver's fallback chain handles both paths.

- *Claim (assistant, 2026-11-11)*: the deployment gate should trigger on `deployment_status`.
  - *Why wrong*: Vercel does not create GitHub Deployments for this project, so the event never fires; Vercel's documented trigger is `repository_dispatch` (`vercel.deployment.success`), with the URL in `client_payload.url`.
  - *Replaced by*: a `repository_dispatch` workflow that records its payload; `preview.yml` v2.
- *Claim (assistant, 2026-11-11)*: production smoke checks can run against the deployment URL without a bypass secret.
  - *Why wrong*: per-deployment URLs are SSO-protected even for production (`all_except_custom_domains`); only the production alias is public.
  - *Replaced by*: the bypass secret is required for every gate run.

## Links out

- Prior change: `openspec/changes/archive/2026-10-01-vercel-edge-deployment/`
- Redesign (archived): `openspec/changes/archive/2026-11-12-swiss-drafting-redesign/`
- Main spec: `openspec/specs/edge-deployment/spec.md`
- Config under change: `vercel.json`, `vite.config.ts`, `playwright.config.ts`, `package.json`, `e2e/portfolio.spec.ts`
