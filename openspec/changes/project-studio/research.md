# Research: `project-studio`

## Verified Facts (Post-PR #16, `master` at `8a9090a`)
- **`src/data/projects.ts` (189 lines)** — Verified by `wc -l` and `grep -rn`: mixes static Vite asset imports (`screenshots/*.png`, `clip.mp4`, `captured/*.json`) with `ProjectData[]`, exports `HIDDEN_TAGS: ReadonlySet<ParadigmTag> = new Set(['art'])` (`L182`) and `getVisibleTags(tags)` (`L184`).
- **`src/data/graphSeeds.ts` (67 lines)** — Verified by `wc -l` and `grep -rn`: stores `PLANAR_NODE_SEEDS: Record<string, PlanarSeed>` (`L19`) separately from `projects.ts`.
- **`src/types/portfolio.ts` (97 lines)** — Verified by `read_file`: defines `ParadigmTag` (11-member union including `'art'`), `TerminalDemo`, `Preview`, and `ProjectData` (`id`, `title`, `shortTitle`, `summary`, `classification`, `tags`, `repo?`, `liveUrl?`, `rainbowOnInteract?`, `omitIndex?`, `hideOverview?`, `revealLabelOnInspect?`, `previews`, `terminalDemo?`).
- **`src/utils/graphTopology.ts` (34 lines)** — Verified by `read_file`: `deriveEdges(projects)` (`L17`) imports `getVisibleTags` directly from `../data/projects` (`L1`, `L23`) rather than accepting a `hiddenTags` parameter.
- **`src/utils/graphPlanarity.test.ts` (227 lines)** — Verified by `wc -l` and `grep -rn`: `countSeedCrossings`, `segmentsCross`, and `pointInTriangle` live inside the test file (and `countSeedCrossings` is duplicated in `src/physics/graphSimulation.test.ts:61`), not in a shared runtime utility.
- **`src/assets/` tree** — Verified by `find src/assets -maxdepth 3 -type f`: contains `clip.mp4` and `screenshots/{attention-max,open-dungeon,pict-climate-risk-viz-chatbot,sandwave-sim}.png`.
- **`scripts/audit-links.mjs` (157 lines) & `src/utils/auditLinks.test.ts` (158 lines)** — Verified by `read_file` and `wc -l`: `audit-links.mjs` regex-scans `src/data/projects.ts` and `src/data/profile.ts`; `scripts/` is excluded from Vercel builds via `.vercelignore`; `auditLinks.test.ts` imports `{ checkUrl, classifyStatus, extractUniqueUrls, extractUrlsFromSource, isValidEmail }` from `../../scripts/audit-links.mjs` and reads `src/data/projects.ts` + `src/data/profile.ts` (`L27-L29`).
- **`src/App.tsx` (472 lines) & `src/components/GraphCanvas.tsx`** — Verified by `grep -rn` and `wc -l`: `App.tsx` derives `ALL_TAGS` from `projects` (`L24`), computes `deriveEdges(projects)` (`L80`), and hard-codes `'art-wip'` and `'art'` tag behavior across `App.tsx` and `GraphCanvas.tsx`.
- **`playwright.config.ts` (50 lines)** — Verified by `read_file`: runs `desktop` and `mobile` against `http://localhost:5199` with `reuseExistingServer: !process.env.CI` when `PREVIEW_URL` is unset.
- **`openspec/changes/portfolio-test-suite-streamlining/`** — Verified via `openspec` status check: exists as an unimplemented OpenSpec change that pins literal catalog counts (`9` projects / `13` edges).

## Unverified Assumptions
- Exact runtime latency of `POST /__studio/api/audit-links` against external URLs when invoked locally from the Studio UI (depends on network conditions and target server responsiveness; bounded by per-URL fetch timeout).
- Whether `portfolio-test-suite-streamlining` will be applied before or after `project-studio`; if applied after, its literal `9`/`13` count pins will need to be reconciled with dynamic catalog invariants.

## Glossary
- **Canonical Catalog (`src/data/projects.catalog.json`)**: Single JSON document holding `{ tags, hiddenTags, projects, seeds }` as the sole source of truth for portfolio data and Studio CRUD.
- **Asset Key (`assetKey`)**: Relative path under `src/assets/` (e.g., `screenshots/open-dungeon.png`, `clip.mp4`) resolved via a narrowed `import.meta.glob`.
- **Captured Key (`capturedKey`)**: Filename stem under `src/data/captured/` (e.g., `open-dungeon`) resolved via `import.meta.glob('./captured/*.json', ...)`.
- **Reserved Entities**: `art-wip` project ID and `'art'` tag (in `hiddenTags`), which are coupled to runtime canvas/easter-egg behavior and protected from deletion/renaming in both the validator and Studio UI.
- **Studio Revision**: SHA-256 hex digest of the canonical serialized bytes of `projects.catalog.json`, used for optimistic concurrency (`expectedRevision` → `409 Conflict`).

## Superseded Claims
- *Prior claim (stale checkout)*: `HIDDEN_TAGS`, `getVisibleTags`, `omitIndex`, `hideOverview`, `revealLabelOnInspect`, `rainbowOnInteract`, and `'art'` do not exist in `src/`. **Superseded**: PR #16 (`art-wip-rainbow-node`, merged at `8a9090a`) added all of these symbols; `projects.ts` is 189 lines and `graphSeeds.ts` is 67 lines.
- *Prior claim (`import.meta.glob('../assets/**/*')`)*: Broad wildcard glob for assets. **Superseded**: Narrowed to `../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}` so non-asset files are never bundled as modules.
- *Prior claim (pinned `9` projects / `13` edges)*: `projects.test.ts` and `project-catalog/spec.md` asserting fixed counts `9` and `13`. **Superseded**: Replaced with dynamic catalog invariants (unique IDs, `seeds` parity, `0` crossings, reserved `art-wip`/`art` presence) once Studio enables CRUD.

## Key Risks & Mitigations
1. **Vercel Build Breakage**: Importing `scripts/audit-links.mjs` from `vite.config.ts` fails on Vercel because `.vercelignore` excludes `scripts/`. **Mitigation**: Extract shared link-audit logic into `src/utils/linkAudit.ts` and have both `vite-studio-plugin.ts` and `scripts/audit-links.mjs` import it.
2. **Partial HMR Reloads**: Writing `projects` and `seeds` to separate JSON files causes Vite to reload between writes. **Mitigation**: Store `{ tags, hiddenTags, projects, seeds }` in a single atomic `src/data/projects.catalog.json` document.
3. **Localhost Security & SSRF**: A local `PUT` endpoint is reachable by any browser tab, and `redirect: 'follow'` can bypass initial IP checks. **Mitigation**: Enforce `Host`/`Origin` matching, `Sec-Fetch-Site` check on `GET` when `Origin` is absent, no CORS headers, `256KB` `PUT` body cap, per-session `X-Studio-Token`, `expectedRevision` (`409`), atomic temp-file + `rename` writes, and manual redirect traversal (`redirect: 'manual'`) with DNS resolution + private/IPv4-mapped IPv6/decimal-host blocking.
4. **E2E Mutation of Working Tree**: Running Studio CRUD E2E tests against port `5199` (`reuseExistingServer: true`) could mutate the developer's repo files. **Mitigation**: Run Studio E2E on a dedicated Playwright config/port (`5299`, `reuseExistingServer: false`) with explicit `PORTFOLIO_STUDIO_WRITE=1` and a temp `PORTFOLIO_STUDIO_CATALOG_PATH`, gated to `desktop` and skipped under `PREVIEW_URL`.
