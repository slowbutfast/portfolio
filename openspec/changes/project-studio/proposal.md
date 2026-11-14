# Proposal: `project-studio`

## Why
Maintaining portfolio projects, paradigm tags, live/repo URLs, media previews, and planar node seeds currently requires editing TypeScript files by hand (`src/data/projects.ts`, `src/data/graphSeeds.ts`) and running a separate CLI script (`npm run test:links`) to detect broken URLs or crossing edges.

## What Changes
- **Phase 1 — Foundation & Equivalence Guard**:
  - Snapshot the pre-refactor `projects`, `PLANAR_NODE_SEEDS`, `HIDDEN_TAGS`, and `getVisibleTags` exports in TDD scaffolding first so hydration from JSON is proven 100% equivalent before replacing the source of truth.
  - Consolidate `{ tags, hiddenTags, projects, seeds }` into a single canonical JSON document (`src/data/projects.catalog.json`), replacing the static 9-row literal catalog table in `project-catalog/spec.md` with the canonical schema contract while preserving all `art-wip` product behavior.
  - Hydrate `src/data/projects.ts` and `src/data/graphSeeds.ts` from `projects.catalog.json` using a narrowed `import.meta.glob` for image/video asset keys and `captured/*.json` terminal demos, with runtime tag validation against `catalog.tags`.
  - Parameterize `deriveEdges(projects, hiddenTags?)` and `getVisibleTags(tags, hiddenTags?)` so live Studio draft previews can compute edges and crossings without mutating module state.
  - Extract shared link-auditing (`src/utils/linkAudit.ts`) and planarity geometry (`src/utils/graphPlanarity.ts`) utilities so CLI scripts, unit tests, and the Studio share one implementation.
- **Phase 2 — Hardened Dev Plugin & Project Studio Shell (`/#/studio`)**:
  - Add `vite-studio-plugin.ts` (active only in `configureServer` during `vite` dev mode) exposing `GET /__studio/api/state`, `PUT /__studio/api/state`, and `POST /__studio/api/audit-links` with strict Host/Origin/token/body-size/revision/SSRF/reserved-ID protections and canonical atomic writes.
  - Add lazy-loaded `StudioApp` mounted behind `import.meta.env.DEV && window.location.hash === '#/studio'` for full project CRUD, preview asset picking, `terminalDemo` key/prompt editing, dirty/discard tracking, and inline link-health checks.
- **Phase 3 — Visual Seed Mini-Map & Tag Manager**:
  - Add an interactive `[0..1] × [0..1]` planar seed mini-map (`SeedMiniMap`) that highlights crossings, auto-places new project seeds safely, and blocks saving non-planar layouts.
  - Add `TagManager` for creating, renaming, deleting, and toggling `hiddenTags` (protecting reserved `'art'`) with a live edge-diff preview.

## Sequencing Note (`portfolio-test-suite-streamlining`)
- The unimplemented `openspec/changes/portfolio-test-suite-streamlining/` change pins literal catalog counts (`9` projects / `13` edges). Once `project-studio` lands, catalog counts are dynamic and validated by structural invariants (`seeds` key parity, `0` crossings, reserved `art-wip`/`art` presence); `portfolio-test-suite-streamlining` must be amended to use invariant checks if applied after `project-studio`.

## Impact
- **Production Safety**: Zero Studio UI or API code is included in `dist/` or deployed to Vercel.
- **Specs**: Adds `project-studio` capability and updates `project-catalog`.
