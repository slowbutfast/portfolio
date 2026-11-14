# Tests: `project-studio`

## 1. Golden Equivalence & Catalog Invariant Tests (`src/data/projects.test.ts`)
- **Pre-Refactor Equivalence Snapshot**: Snapshot the current pre-refactor exports (`projects` metadata + resolved asset URLs, `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, `getVisibleTags`) before migrating to `projects.catalog.json`, and assert that hydrated exports deep-equal the snapshot.
- **Dynamic Invariants**: Verify every entry in `projects.catalog.json` hydrates cleanly, every `assetKey` and `capturedKey` resolves, all project IDs match `/^[a-z0-9-]+$/`, `seeds` keys match `projects` IDs 1:1 with finite `[0, 1]` coordinates, every project tag is declared in `catalog.tags`, and reserved `'art-wip'` and `'art'` (`hiddenTags`) are present (dropping pinned `9`/`13` count assertions).

## 2. Shared Planarity & Topology Tests (`src/utils/graphPlanarity.test.ts`, `src/utils/graphTopology.test.ts`)
- Import extracted `countSeedCrossings`, `segmentsCross`, `pointInTriangle` from `src/utils/graphPlanarity.ts` and verify `0` crossings on the catalog seeds.
- Verify `deriveEdges(projects, hiddenTags)` and `getVisibleTags(tags, hiddenTags)` operate purely against custom `hiddenTags` sets for live Studio edge-diff previews.

## 3. Link Audit & SSRF Hardening Tests (`src/utils/auditLinks.test.ts`)
- Update source reads (`L27-L29`) to include `src/data/projects.catalog.json`.
- Verify `classifyStatus` (`401`/`403`/`429`/`999` → `'warning'`), `latencyMs`, relative path skipping (`/art/`), and manual redirect + DNS IP blocking (loopback, private, link-local, IPv4-mapped IPv6 `::ffff:127.0.0.1`, decimal/integer hosts).

## 4. Studio Dev Plugin Tests (`src/utils/studioPlugin.test.ts`)
- Test `vite-studio-plugin.ts`: missing/invalid `X-Studio-Token` (`403`), `Origin`/`Host` mismatch (`403`), `Sec-Fetch-Site` check on `GET`, zero CORS headers, `>256KB` body rejection (`413`), stale `expectedRevision` (`409`), invalid ID (`__proto__`), `javascript:` URL, reserved `art-wip`/`'art'` removal (`400`), non-planar `seeds` rejection (`400`), canonical deterministic JSON formatting, and atomic write to a temp `catalogPath`.

## 5. Build, Preview & Isolated E2E (`e2e/playwright.studio.config.ts`)
- **Production Bundle & Preview Check**: `npm run build` + grep check confirming `dist/` contains zero `StudioApp`, `/__studio/api`, or `#/studio` references, plus `vite preview` check confirming `/#/studio` renders the normal SPA and `/__studio/api/state` exposes no Studio API.
- **Isolated Dev E2E (`desktop`-only, port `5299`, `reuseExistingServer: false`, skipped under `PREVIEW_URL`)**: Boot Vite with `PORTFOLIO_STUDIO_WRITE=1` and a temp `PORTFOLIO_STUDIO_CATALOG_PATH`; open `/#/studio`, create/edit/rename/delete a project, pick an `assetKey`/`capturedKey`, toggle tags in `TagManager`, test crossing blocker in `SeedMiniMap`, run **Check Links**, save, verify HMR revision sync, and confirm the repo's real `src/data/projects.catalog.json` is untouched.
