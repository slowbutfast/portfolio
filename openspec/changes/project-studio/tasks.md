# Tasks: `project-studio`

## 1. Test Scaffolding (TDD)
- [ ] 1.1 Capture golden-equivalence snapshot tests in `src/data/projects.test.ts` covering current `projects` (comparing assets by resolved URL), `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, and `getVisibleTags` before migrating to JSON.
- [ ] 1.2 Add failing unit test scaffolding for pure `deriveEdges(projects, hiddenTags)` / `getVisibleTags(tags, hiddenTags)` in `src/utils/graphTopology.test.ts` and extracted planarity helpers in `src/utils/graphPlanarity.test.ts`.
- [ ] 1.3 Add failing unit test scaffolding in `src/utils/auditLinks.test.ts` for `projects.catalog.json` source scanning, `latencyMs`, relative-path skipping (`/art/`), and manual redirect + IPv4-mapped/decimal SSRF blocking.
- [ ] 1.4 Add failing unit test scaffolding in `src/utils/studioPlugin.test.ts` for `Host`/`Origin`/`Sec-Fetch-Site`/no-CORS, `X-Studio-Token`, `256KB` body limit, `expectedRevision` `409`, `/^[a-z0-9-]+$/` ID regex, reserved `art-wip`/`'art'` protection, `https:`/`/` URL validation, canonical JSON formatting, and `countSeedCrossings === 0`.

## 2. Foundation (Canonical JSON, Hydrator, Shared Utils)
- [ ] 2.1 Create `src/data/projects.catalog.json` with canonical `{ tags, hiddenTags, projects, seeds }` matching `ProjectData` (`repo`, `liveUrl`, `assetKey`, `capturedKey`, behavior flags, and `art-wip`/`'art'`).
- [ ] 2.2 Update `src/types/portfolio.ts` (`ParadigmTag = string`), `src/data/projects.ts` (narrowed `import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', { eager: true, import: 'default' })`, `./captured/*.json` glob, runtime tag/seed validation), and `src/data/graphSeeds.ts` to hydrate from `projects.catalog.json`, passing the 1.1 golden-equivalence snapshot.
- [ ] 2.3 Update `src/utils/graphTopology.ts` so `deriveEdges(projects, hiddenTags = HIDDEN_TAGS)` and `getVisibleTags(tags, hiddenTags = HIDDEN_TAGS)` accept `hiddenTags` purely without mutating module state, and derive `ALL_TAGS` in `src/App.tsx` cleanly from the catalog.
- [ ] 2.4 Extract shared planarity helpers (`src/utils/graphPlanarity.ts`) out of `src/utils/graphPlanarity.test.ts` (and deduplicate `src/physics/graphSimulation.test.ts`) and extract SSRF-safe `src/utils/linkAudit.ts` (manual redirects, DNS/IP validation, `classifyStatus`, `latencyMs`) for both `scripts/audit-links.mjs` and the Studio plugin.
- [ ] 2.5 Replace pinned `9`/`13` count assertions in `src/data/projects.test.ts` with dynamic catalog invariants (unique kebab IDs, `seeds` parity, `0` crossings, reserved `art-wip`/`'art'` presence).

## 3. Hardened Dev Plugin & Project Studio Shell (`/#/studio`)
- [ ] 3.1 Implement `vite-studio-plugin.ts` (`configureServer`-only, gated by `PORTFOLIO_STUDIO_WRITE` or dev defaults, configurable `catalogPath`) with `Host`/`Origin`/`Sec-Fetch-Site`, zero CORS headers, per-session `X-Studio-Token`, `256KB` cap, `expectedRevision` `409`, strict schema & reserved-entity validator, canonical JSON serializer + atomic temp-file/`rename` write mutex, and SSRF-safe `POST /__studio/api/audit-links`.
- [ ] 3.2 Register `studioDevPlugin()` in `vite.config.ts` (ensuring zero Vercel/build-time dependency on `scripts/`) and verify `src/utils/studioPlugin.test.ts` passes.
- [ ] 3.3 Build `src/studio/StudioApp.tsx` (master-detail project CRUD, auto non-crossing default seed placement, `id` rename cascading to `seeds`, delete cascading, reserved `art-wip` protection, `repo`/`liveUrl` + inline `Check Links`, behavior flags, narrowed `assetKey` preview picker, `terminalDemo` `capturedKey`/`prompt` editor, dirty/discard state, and post-save HMR revision sync) and lazy-mount at `/#/studio` behind `import.meta.env.DEV`.

## 4. Seed Mini-Map & Tag Manager
- [ ] 4.1 Build `src/studio/SeedMiniMap.tsx` with `[0..1] × [0..1]` seed dragging, live crossing highlight, and save blocking when `countSeedCrossings > 0`.
- [ ] 4.2 Build `src/studio/TagManager.tsx` for tag CRUD, cascading rename/delete across `projects[].tags` and `hiddenTags`, `hiddenTags` toggling, reserved `'art'` lock, and live edge-diff preview via pure `deriveEdges`.

## 5. Verification & Empirical Audit
- [ ] 5.1 Add isolated dev-mode Studio E2E suite (`e2e/playwright.studio.config.ts` on port `5299`, `reuseExistingServer: false`, `desktop`-only, skipped under `PREVIEW_URL`, temp `PORTFOLIO_STUDIO_CATALOG_PATH`) and verify real `src/data/projects.catalog.json` remains clean.
- [ ] 5.2 Add `npm run build` `dist/` grep check and `vite preview` verification confirming zero `StudioApp`, `/__studio/api`, or `#/studio` exposure in production.
- [ ] 5.3 Run full verification suite (`npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`) and record empirical results in `verification.md`.
