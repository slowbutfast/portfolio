# OpenCode Orchestration Handoff: OpenSpec Change 'project-studio'

## 1. Orchestration Directive
- **Change Name**: `project-studio`
- **Target Skill**: `openspec-apply-sub`
- **Architecture Paradigm**: Vertical Slice Architecture (VSA) — keep `src/studio/` self-contained, shared pure helpers in `src/utils/`, canonical data in `src/data/projects.catalog.json`, and dev-only server logic in `vite-studio-plugin.ts`.
- **Execution Discipline**: You MUST work strictly through `openspec/changes/project-studio/tasks.md` in order. Complete all tasks in `## 1. Test Scaffolding (TDD)` and verify the new/updated tests fail first before implementing Phase 2–4 code.

---

## 2. Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/data/projects.catalog.json` | NEW | Canonical `{ tags, hiddenTags, projects, seeds }` JSON source of truth |
| `src/types/portfolio.ts` | L1–L14 | Change `ParadigmTag` to `string` (runtime-validated against `catalog.tags`) |
| `src/data/projects.ts` | L1–L189 | Hydrate `projects`, `HIDDEN_TAGS`, `getVisibleTags(tags, hiddenTags?)`, `getProjectById` from JSON via narrowed `import.meta.glob` |
| `src/data/graphSeeds.ts` | L1–L67 | Hydrate `PLANAR_NODE_SEEDS` from `projects.catalog.json`; preserve `scaleSeeds` / `scaleSeedPoint` |
| `src/utils/graphTopology.ts` | L1–L34 | Parameterize `deriveEdges(projects, hiddenTags = HIDDEN_TAGS)` for pure draft evaluation |
| `src/App.tsx` | L1–L472 (L24, L80, router) | Derive `ALL_TAGS` from catalog and lazy-mount `StudioApp` at `/#/studio` only when `import.meta.env.DEV` is `true` |
| `src/utils/graphPlanarity.ts` | NEW | Extract shared `countSeedCrossings`, `segmentsCross`, `pointInTriangle` |
| `src/utils/graphPlanarity.test.ts` | L1–L227 | Import shared planarity helpers from `src/utils/graphPlanarity.ts` |
| `src/physics/graphSimulation.test.ts` | L61 (helper) | Deduplicate `countSeedCrossings` to import from `src/utils/graphPlanarity.ts` |
| `src/utils/linkAudit.ts` | NEW | Shared SSRF-safe URL auditor (manual redirects, DNS/IP validation, `classifyStatus`, `latencyMs`) |
| `scripts/audit-links.mjs` | L1–L157 | Import `src/utils/linkAudit.ts` and include `src/data/projects.catalog.json` in `TARGET_FILES` |
| `src/utils/auditLinks.test.ts` | L1–L158 (L27–L29) | Read `projects.catalog.json`; test `latencyMs`, `/art/` skip, and manual-redirect SSRF blocking |
| `src/data/projects.test.ts` | L1–L188 | Add Group 1 golden-equivalence snapshot; replace pinned `9`/`13` counts with dynamic invariants |
| `vite-studio-plugin.ts` | NEW | `configureServer`-only dev plugin (`/__studio/api/state`, `/__studio/api/audit-links`) |
| `vite.config.ts` | L16–L31 | Register `studioDevPlugin()` without any build-time dependency on `scripts/` |
| `src/utils/studioPlugin.test.ts` | NEW | Unit tests for plugin security, validation, `409` conflicts, canonical JSON, and atomic writes |
| `src/studio/StudioApp.tsx` | NEW | Master-detail project CRUD, `assetKey`/`capturedKey` pickers, `Check Links`, dirty/discard, HMR sync |
| `src/studio/SeedMiniMap.tsx` | NEW | Interactive `[0..1] × [0..1]` planar seed mini-map with crossing highlight and save block |
| `src/studio/TagManager.tsx` | NEW | Tag CRUD, cascading rename/delete, `hiddenTags` toggle, reserved `'art'` lock, live edge-diff |
| `e2e/playwright.studio.config.ts` | NEW | Isolated Studio E2E config (port `5299`, `reuseExistingServer: false`, `desktop`-only, temp catalog) |
| `e2e/studio.spec.ts` | NEW | Dev-mode Studio CRUD/planarity/link-audit E2E + `vite preview` zero-exposure verification |

---

## 3. Technical & Architectural Boundaries
- **Production Zero-Exposure**:
  - `StudioApp` MUST be dynamically imported inside `import.meta.env.DEV && window.location.hash === '#/studio'` so `npm run build` tree-shakes `src/studio/*` completely out of `dist/`.
  - `vite-studio-plugin.ts` MUST register routes strictly inside `configureServer(server)` and MUST NOT import `scripts/audit-links.mjs` (which `.vercelignore` excludes from Vercel builds).
- **Narrowed Asset & Captured Globs**:
  - Use `import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', { eager: true, import: 'default' })` and `import.meta.glob('./captured/*.json', { eager: true, import: 'default' })`. Never use `../assets/**/*`.
- **Hardened Studio API (`vite-studio-plugin.ts`)**:
  - `Host` and `Origin` must match the dev server (`http://localhost:<port>` / `http://127.0.0.1:<port>`); allow omitted `Origin` on `GET` only when `Sec-Fetch-Site` is `'same-origin'`, `'none'`, or absent in local non-browser calls. Never emit CORS headers.
  - Require per-session `X-Studio-Token` on `PUT`/`POST`, `256KB` max `PUT` body (`413`), and `expectedRevision` SHA-256 (`409 Conflict`).
  - Validate project `id` (`/^[a-z0-9-]+$/`), reserved `'art-wip'` project + `'art'` tag (`hiddenTags`), `seeds` 1:1 parity and finite `[0, 1]` coordinates, `https:` or `/` URLs, declared tags, valid asset/captured keys, and `countSeedCrossings === 0`.
  - Serialize `projects.catalog.json` deterministically (sorted `tags`, `hiddenTags`, `seeds` keys, 2-space indent, trailing `\n`) and write atomically via temp file + `rename` under a promise mutex.
- **SSRF-Safe Link Audit (`src/utils/linkAudit.ts`)**:
  - Ignore client-supplied URLs; read only from `projects.catalog.json` + `src/data/profile.ts` (skipping relative paths like `/art/`).
  - Resolve DNS manually and follow redirects manually (`redirect: 'manual'`), re-validating every hop and blocking loopback, private, link-local, reserved, IPv4-mapped IPv6 (`::ffff:127.0.0.1`), and decimal/integer hosts. Classify `401`/`403`/`429`/`999` as `'warning'`.
- **Pure Draft Evaluation**:
  - `getVisibleTags(tags, hiddenTags = HIDDEN_TAGS)` and `deriveEdges(projects, hiddenTags = HIDDEN_TAGS)` must accept `hiddenTags` without mutating module state.

---

## 4. Visual & UI Design Specifications
- Non-visual / dev-tool surface; reuse the portfolio's existing fluid/drafting CSS tokens (`--color-bg`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-accent`, `--color-border`) from `src/index.css`.
- **Layout (`StudioApp`)**:
  - `StudioHeader`: `PROJECT STUDIO // DEV`, dirty/synced pill, `Check Links`, `Discard`, `Save` (disabled with clear reason when clean, invalid, or `countSeedCrossings > 0`), `← Portfolio`.
  - Left rail: project list + `+ New Project` + lock badge on `art-wip`.
  - Center pane: Identity & Behavior (`id` locked on `art-wip`), Links & inline `pass`/`warning`/`fail` + `latencyMs`, Tags picker, Previews (`kind`, `assetKey` dropdown, `caption`), `terminalDemo` (`capturedKey` dropdown + `prompt`), Delete button (disabled on `art-wip`).
  - Right pane: interactive `[0..1] × [0..1]` `SeedMiniMap` (red highlight on crossing edges) + `TagManager` (create/rename/delete/toggle `hiddenTags`, `'art'` locked, live edge-diff count).

---

## 5. Test Scaffolding & Verification Commands
Run TDD Group 1 first, confirm failures, then implement Groups 2–5 and verify:
- Typecheck & Build: `npm run typecheck && npm run build`
- Unit Suite: `npm run test:unit`
- Existing Portfolio E2E: `CI=1 npx playwright test --config=./playwright.config.ts`
- Isolated Studio E2E (port `5299`, `reuseExistingServer: false`, temp `PORTFOLIO_STUDIO_CATALOG_PATH`, `desktop`-only, skipped under `PREVIEW_URL`): `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`
- Production Exposure Check: grep `dist/` for zero `StudioApp`, `/__studio/api`, or `#/studio` symbols + `vite preview` check.

---

## 6. Implementation Task Checklist
- [ ] 1.1 Capture golden-equivalence snapshot tests in `src/data/projects.test.ts` covering current `projects` (comparing assets by resolved URL), `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, and `getVisibleTags` before migrating to JSON.
- [ ] 1.2 Add failing unit test scaffolding for pure `deriveEdges(projects, hiddenTags)` / `getVisibleTags(tags, hiddenTags)` in `src/utils/graphTopology.test.ts` and extracted planarity helpers in `src/utils/graphPlanarity.test.ts`.
- [ ] 1.3 Add failing unit test scaffolding in `src/utils/auditLinks.test.ts` for `projects.catalog.json` source scanning, `latencyMs`, relative-path skipping (`/art/`), and manual redirect + IPv4-mapped/decimal SSRF blocking.
- [ ] 1.4 Add failing unit test scaffolding in `src/utils/studioPlugin.test.ts` for `Host`/`Origin`/`Sec-Fetch-Site`/no-CORS, `X-Studio-Token`, `256KB` body limit, `expectedRevision` `409`, `/^[a-z0-9-]+$/` ID regex, reserved `art-wip`/`'art'` protection, `https:`/`/` URL validation, canonical JSON formatting, and `countSeedCrossings === 0`.
- [ ] 2.1 Create `src/data/projects.catalog.json` with canonical `{ tags, hiddenTags, projects, seeds }` matching `ProjectData` (`repo`, `liveUrl`, `assetKey`, `capturedKey`, behavior flags, and `art-wip`/`'art'`).
- [ ] 2.2 Update `src/types/portfolio.ts` (`ParadigmTag = string`), `src/data/projects.ts` (narrowed `import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', { eager: true, import: 'default' })`, `./captured/*.json` glob, runtime tag/seed validation), and `src/data/graphSeeds.ts` to hydrate from `projects.catalog.json`, passing the 1.1 golden-equivalence snapshot.
- [ ] 2.3 Update `src/utils/graphTopology.ts` so `deriveEdges(projects, hiddenTags = HIDDEN_TAGS)` and `getVisibleTags(tags, hiddenTags = HIDDEN_TAGS)` accept `hiddenTags` purely without mutating module state, and derive `ALL_TAGS` in `src/App.tsx` cleanly from the catalog.
- [ ] 2.4 Extract shared planarity helpers (`src/utils/graphPlanarity.ts`) out of `src/utils/graphPlanarity.test.ts` (and deduplicate `src/physics/graphSimulation.test.ts`) and extract SSRF-safe `src/utils/linkAudit.ts` (manual redirects, DNS/IP validation, `classifyStatus`, `latencyMs`) for both `scripts/audit-links.mjs` and the Studio plugin.
- [ ] 2.5 Replace pinned `9`/`13` count assertions in `src/data/projects.test.ts` with dynamic catalog invariants (unique kebab IDs, `seeds` parity, `0` crossings, reserved `art-wip`/`'art'` presence).
- [ ] 3.1 Implement `vite-studio-plugin.ts` (`configureServer`-only, gated by `PORTFOLIO_STUDIO_WRITE` or dev defaults, configurable `catalogPath`) with `Host`/`Origin`/`Sec-Fetch-Site`, zero CORS headers, per-session `X-Studio-Token`, `256KB` cap, `expectedRevision` `409`, strict schema & reserved-entity validator, canonical JSON serializer + atomic temp-file/`rename` write mutex, and SSRF-safe `POST /__studio/api/audit-links`.
- [ ] 3.2 Register `studioDevPlugin()` in `vite.config.ts` (ensuring zero Vercel/build-time dependency on `scripts/`) and verify `src/utils/studioPlugin.test.ts` passes.
- [ ] 3.3 Build `src/studio/StudioApp.tsx` (master-detail project CRUD, auto non-crossing default seed placement, `id` rename cascading to `seeds`, delete cascading, reserved `art-wip` protection, `repo`/`liveUrl` + inline `Check Links`, behavior flags, narrowed `assetKey` preview picker, `terminalDemo` `capturedKey`/`prompt` editor, dirty/discard state, and post-save HMR revision sync) and lazy-mount at `/#/studio` behind `import.meta.env.DEV`.
- [ ] 4.1 Build `src/studio/SeedMiniMap.tsx` with `[0..1] × [0..1]` seed dragging, live crossing highlight, and save blocking when `countSeedCrossings > 0`.
- [ ] 4.2 Build `src/studio/TagManager.tsx` for tag CRUD, cascading rename/delete across `projects[].tags` and `hiddenTags`, `hiddenTags` toggling, reserved `'art'` lock, and live edge-diff preview via pure `deriveEdges`.
- [ ] 5.1 Add isolated dev-mode Studio E2E suite (`e2e/playwright.studio.config.ts` on port `5299`, `reuseExistingServer: false`, `desktop`-only, skipped under `PREVIEW_URL`, temp `PORTFOLIO_STUDIO_CATALOG_PATH`) and verify real `src/data/projects.catalog.json` remains clean.
- [ ] 5.2 Add `npm run build` `dist/` grep check and `vite preview` verification confirming zero `StudioApp`, `/__studio/api`, or `#/studio` exposure in production.
- [ ] 5.3 Run full verification suite (`npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`) and record empirical results in `verification.md`.

---

## 7. Post-Implementation & Verification Obligations
1. Mark all completed items in `openspec/changes/project-studio/tasks.md` as `- [x]`.
2. Ensure `src/data/projects.catalog.json` is unmutated by E2E tests and passes the golden-equivalence snapshot against pre-refactor data.
3. Populate `openspec/changes/project-studio/verification.md` with exact commands run, exit codes, test counts, and `dist/`/`vite preview` grep outputs.
4. Run `openspec verify project-studio` (or `openspec-verify-change`) and `npx openspec specs apply --change "project-studio"` (if applicable before PR) without archiving.
5. Create feature branch `feat/project-studio`, commit all changes cleanly, push to `origin`, and open a Pull Request via `gh pr create --fill`.
