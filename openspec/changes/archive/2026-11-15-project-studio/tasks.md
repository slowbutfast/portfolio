# Tasks: `project-studio`

## 1. Test Scaffolding (TDD)
- [x] 1.1 Capture golden-equivalence snapshot tests in `src/data/projects.test.ts` covering current `projects` (comparing assets by resolved URL), `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, and `getVisibleTags` before migrating to JSON.
- [x] 1.2 Add failing unit test scaffolding for pure `deriveEdges(projects, hiddenTags)` / `getVisibleTags(tags, hiddenTags)` in `src/utils/graphTopology.test.ts` and extracted planarity helpers in `src/utils/graphPlanarity.test.ts`.
- [x] 1.3 Add failing unit test scaffolding in `src/utils/auditLinks.test.ts` for `projects.catalog.json` source scanning, `latencyMs`, relative-path skipping (`/art/`), and manual redirect + IPv4-mapped/decimal SSRF blocking.
- [x] 1.4 Add failing unit test scaffolding in `src/utils/studioPlugin.test.ts` for `Host`/`Origin`/`Sec-Fetch-Site`/no-CORS, `X-Studio-Token`, `256KB` body limit, `expectedRevision` `409`, `/^[a-z0-9-]+$/` ID regex, reserved `art-wip`/`'art'` protection, `https:`/`/` URL validation, canonical JSON formatting, and `countSeedCrossings === 0`.

## 2. Foundation (Canonical JSON, Hydrator, Shared Utils)
- [x] 2.1 Create `src/data/projects.catalog.json` with canonical `{ tags, hiddenTags, projects, seeds }` matching `ProjectData` (`repo`, `liveUrl`, `assetKey`, `capturedKey`, behavior flags, and `art-wip`/`'art'`).
- [x] 2.2 Update `src/types/portfolio.ts` (`ParadigmTag = string`), `src/data/projects.ts` (narrowed `import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', { eager: true, import: 'default' })`, `./captured/*.json` glob, runtime tag/seed validation), and `src/data/graphSeeds.ts` to hydrate from `projects.catalog.json`, passing the 1.1 golden-equivalence snapshot.
- [x] 2.3 Update `src/utils/graphTopology.ts` so `deriveEdges(projects, hiddenTags = HIDDEN_TAGS)` and `getVisibleTags(tags, hiddenTags = HIDDEN_TAGS)` accept `hiddenTags` purely without mutating module state, and derive `ALL_TAGS` in `src/App.tsx` cleanly from the catalog.
- [x] 2.4 Extract shared planarity helpers (`src/utils/graphPlanarity.ts`) out of `src/utils/graphPlanarity.test.ts` (and deduplicate `src/physics/graphSimulation.test.ts`) and extract SSRF-safe `src/utils/linkAudit.ts` (manual redirects, DNS/IP validation, `classifyStatus`, `latencyMs`) for both `scripts/audit-links.mjs` and the Studio plugin.
- [x] 2.5 Replace pinned `9`/`13` count assertions in `src/data/projects.test.ts` with dynamic catalog invariants (unique kebab IDs, `seeds` parity, `0` crossings, reserved `art-wip`/`'art'` presence).

## 3. Hardened Dev Plugin & Project Studio Shell (`/#/studio`)
- [x] 3.1 Implement `vite-studio-plugin.ts` (`configureServer`-only, gated by `PORTFOLIO_STUDIO_WRITE` or dev defaults, configurable `catalogPath`) with `Host`/`Origin`/`Sec-Fetch-Site`, zero CORS headers, per-session `X-Studio-Token`, `256KB` cap, `expectedRevision` `409`, strict schema & reserved-entity validator, canonical JSON serializer + atomic temp-file/`rename` write mutex, and SSRF-safe `POST /__studio/api/audit-links`.
- [x] 3.2 Register `studioDevPlugin()` in `vite.config.ts` (ensuring zero Vercel/build-time dependency on `scripts/`) and verify `src/utils/studioPlugin.test.ts` passes.
- [x] 3.3 Build `src/studio/StudioApp.tsx` (master-detail project CRUD, auto non-crossing default seed placement, `id` rename cascading to `seeds`, delete cascading, reserved `art-wip` protection, `repo`/`liveUrl` + inline `Check Links`, behavior flags, narrowed `assetKey` preview picker, `terminalDemo` `capturedKey`/`prompt` editor, dirty/discard state, and post-save HMR revision sync) and lazy-mount at `/#/studio` behind `import.meta.env.DEV`.

## 4. Seed Mini-Map & Tag Manager
- [x] 4.1 Build `src/studio/SeedMiniMap.tsx` with `[0..1] × [0..1]` seed dragging, live crossing highlight, and save blocking when `countSeedCrossings > 0`.
- [x] 4.2 Build `src/studio/TagManager.tsx` for tag CRUD, cascading rename/delete across `projects[].tags` and `hiddenTags`, `hiddenTags` toggling, reserved `'art'` lock, and live edge-diff preview via pure `deriveEdges`.

## 5. Verification & Empirical Audit
- [x] 5.1 Add isolated dev-mode Studio E2E suite (`e2e/playwright.studio.config.ts` on port `5299`, `reuseExistingServer: false`, `desktop`-only, skipped under `PREVIEW_URL`, temp `PORTFOLIO_STUDIO_CATALOG_PATH`) and verify real `src/data/projects.catalog.json` remains clean.
- [x] 5.2 Add `npm run build` `dist/` grep check and `vite preview` verification confirming zero `StudioApp`, `/__studio/api`, or `#/studio` exposure in production.
- [x] 5.3 Run full verification suite (`npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`) and record empirical results in `verification.md`.

## Patch 01: Fix PR #18 Review Findings (Concurrency, Canonical Catalog, Node 22 Audit, CSPRNG Token, Edge Deduplication, DNS Pinning)

- [x] P01.1 Scaffold/run reproducing tests in `src/utils/studioPlugin.test.ts` (concurrent `PUT` with same `expectedRevision` → one `200`, one `409`), `src/data/projects.test.ts` (`ALL_TAGS` matches pre-refactor order & `projects.catalog.json` equals `serializeCatalog`), and `src/utils/auditLinks.test.ts` (IP-pinned connection preserves `Host`/TLS `servername`).
- [x] P01.2 Fix `vite-studio-plugin.ts`: move `readFile` + `expectedRevision` check + validation + atomic write inside `writeQueue`, and generate tokens with `randomBytes(32).toString('hex')`.
- [x] P01.3 Fix `src/data/tagRegistry.ts`, `src/data/catalogSchema.ts`, and `src/data/projects.catalog.json`: derive `ALL_TAGS` in project-appearance order matching pre-refactor `App.tsx`, deduplicate edge derivation via `deriveEdges` from `../utils/graphTopology`, and commit `projects.catalog.json` in exact `serializeCatalog` canonical form.
- [x] P01.4 Fix Node `22.x` compatibility & DNS-rebinding pinning in `scripts/audit-links.mjs` / `src/utils/linkAudit.*`: ensure `node scripts/audit-links.mjs` imports pure `.mjs`/`.js` without requiring experimental TS stripping, and pin the validated IP when making default Node `http`/`https` requests (preserving `Host` and TLS `servername`).
- [x] P01.5 Verify reproduction tests pass, run `npm run typecheck && npm run test:unit && npm run build && npm run test:links` + Playwright suites, reconcile the E2E count in `verification.md`, and mark `PATCH-01` `RESOLVED` in `patch.md`.

## Patch 02: PR #18 Follow-up Review (Malformed PUT, IPv6-First Audit, Prototype-Safe Seeds, Spec Sync)

- [x] P02.1 Add a reproducing test that PUTs `{ expectedRevision: <current>, catalog: {} }` and asserts `400`, then confirm `GET /__studio/api/state` still returns `200`.
- [x] P02.2 Move `serializeCatalog` and revision computation inside `writeQueue` **after** validation, so malformed payloads cannot throw outside the queue's error handling.
- [x] P02.3 Add an IPv4-first, IPv6-fallback address strategy in `src/utils/linkAudit.mjs` and a unit test for the ordering helper.
- [x] P02.4 Replace the `in` seed-parity check with `Object.hasOwn` and add a regression test for a `constructor` project id.
- [x] P02.5 Reconcile `spec.md`/`architecture.md` with the per-dev-server token and validated-IP pinning behavior, then record results in `verification.md` and mark `PATCH-02` in `patch.md`.
- [ ] P02.6 (Deferred) Add `// @ts-check`/JSDoc coverage for `src/utils/linkAudit.mjs`.
- [ ] P02.7 (Decision pending) Make `slowbutfast/sandwave-sim` and `slowbutfast/transcribe-plus` public, or remove `repo` from those catalog entries.

## Patch 03: Mobile-Friendly Responsive Project Studio UI & Touch Controls

- [x] P03.1 Add a `mobile` (`Pixel 7`) project to `e2e/playwright.studio.config.ts` and a failing mobile E2E test in `e2e/studio.spec.ts` asserting `Projects | Edit | Map & Tags` tab switching, zero horizontal overflow (`scrollWidth <= innerWidth`), `>= 44px` touch targets on primary actions, and numeric seed coordinate editing.
- [x] P03.2 Update `src/studio/StudioApp.tsx` for responsive `< lg` layout: 3-tab segmented control (`Projects | Edit | Map & Tags` with crossing badge and auto-switch to `Edit` on project tap), `grid-cols-1 sm:grid-cols-2` and `grid-cols-1 sm:grid-cols-[110px_1fr_1fr_auto]` form/preview grids, sticky mobile bottom action bar (`Check Links`, `Discard`, `Save`), `text-base sm:text-sm` inputs, and `>= 44px` (`min-h-11`) mobile touch targets.
- [x] P03.3 Update `src/studio/SeedMiniMap.tsx` and `src/studio/TagManager.tsx`: add transparent `r=7` touch hit circles on nodes, constrain mobile mini-map (`max-w-[360px] mx-auto`), add toggleable numeric `x`/`y` + nudge (`±0.02`) controls for the selected seed, and ensure `44px` mobile touch targets and `text-base sm:text-sm` inputs in `TagManager`.
- [x] P03.4 Re-run `npm run typecheck && npm run test:unit && npm run build` and `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`, record results in `verification.md`, and mark `PATCH-03` `RESOLVED` in `patch.md`.
