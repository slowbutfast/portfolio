# Verification: `project-studio`

## Environment
- Node `v22.23.2`, npm `10.9.8`
- Base commit: `0d25b45` (planning artifacts; seeded from `master` `8a9090a`)
- Dependencies: `npm install --no-audit --no-fund` → 130 packages added

## Commands & Empirical Results

| Command | Result |
|---|---|
| `npm run typecheck` | exit `0`, no diagnostics |
| `npm run test:unit` | exit `0`; 22 files, **233 passed**, 0 skipped (233 total) |
| `npm run build` | exit `0`; 1968 modules, single JS chunk `dist/assets/index-kVHxnojU.js` (358.86 kB) |
| `grep -rl "StudioApp\|__studio/api\|#/studio" dist/` | **no matches** (zero Studio symbols in `dist/`) |
| `CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts` | exit `0`; **5 passed** (desktop-only, isolated port `5299`) |
| `CI=1 npx playwright test --config=./playwright.config.ts` | exit `0`; **112 passed**, 38 skipped (skips are pre-existing preview/CPU-throttle gates) |

## Golden Equivalence
- Pre-refactor fixture: `src/data/__fixtures__/projects.pre-refactor.json`, captured from the
  TypeScript catalog before migration.
- `src/data/projects.test.ts` asserts hydrated `projects` (including Vite-resolved asset URLs),
  `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, and per-project `getVisibleTags` are deeply equal to it.

## Production Zero-Exposure
- `npm run build` emits one application chunk and no Studio chunk; the dynamic import is inside the
  compile-time `import.meta.env.DEV` branch, and the `#/studio` literal is dev-only.
- `vite preview` on `:5199`:
  - `GET /__studio/api/state` → SPA fallback HTML, **no** token, `catalog`, or `revision` payload.
  - `GET /` serves the normal portfolio shell.
- `vite-studio-plugin.ts` registers middleware only in `configureServer` and imports no `scripts/`
  module, so Vercel builds (which `.vercelignore` excludes `scripts/`) are unaffected.

## Isolated Studio E2E Coverage
`e2e/playwright.studio.config.ts` copies `src/data/projects.catalog.json` to a temp directory, boots
Vite on port `5299` with `PORTFOLIO_STUDIO_WRITE=1` and `PORTFOLIO_STUDIO_CATALOG_PATH=<temp>`, and
runs desktop-only. The spec verifies:
1. Create → edit → rename `id` (seed key follows) → save → delete → save.
2. Tag create/rename/hide with cascades and reserved `art` controls disabled.
3. Dragging a seed into a crossing disables Save and shows the crossing alert.
4. `Check Links` renders inline `pass` + `latencyMs`.
5. Studio route mounts only in dev; `← Portfolio` exits.
6. `afterAll` asserts the real `src/data/projects.catalog.json` is byte-identical to its start state.

## Notes / Deviations
- `GET /__studio/api/state` intentionally issues the same per-server token for the middleware
  lifetime (single local session); `PUT`/`POST` require it and Origin/Host/Sec-Fetch-Site guards.
- Link audit resolves DNS before each hop and re-validates manual redirects, but Node's `fetch`
  performs its own connection-time resolution (no socket pinning). This matches the documented
  architecture scope.
