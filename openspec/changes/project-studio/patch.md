# Patch Log: `project-studio`

### [PATCH-01] PR #18 Review Fixes (PUT Race, Canonical Catalog & ALL_TAGS, Node 22 Audit, CSPRNG Token, Edge Deduplication, DNS Pinning, Verification Count)
- **Date**: 2026-11-14 19:18:00 UTC
- **Feedback Source**: Code Review (PR #18 `3160146`, Agent 1 & Agent 2)
- **Reported Issue**:
  1. **PUT lost-update race**: Two concurrent `PUT /__studio/api/state` requests with the same `expectedRevision` both pass the revision check before entering `writeQueue` and overwrite each other.
  2. **`ALL_TAGS` pill order & non-canonical committed catalog**: `ALL_TAGS` uses `catalog.tags` instead of project-appearance order, and committed `src/data/projects.catalog.json` is not formatted by `serializeCatalog`, causing the first Studio Save to reorder tags/seeds.
  3. **`scripts/audit-links.mjs` imports `.ts` under Node `22.x` & `npm run test:links` unverified**: Importing `../src/utils/linkAudit.ts` directly from `.mjs` relies on Node 22.18+ type-stripping, and `npm run test:links` was not run/recorded in `verification.md`.
  4. **Studio token generation**: `vite-studio-plugin.ts` hashes `Math.random()` instead of using `crypto.randomBytes(32)` (and `GET` should issue per-session/CSPRNG tokens cleanly).
  5. **Edge derivation duplicated**: `src/data/catalogSchema.ts` duplicates `deriveEdges` instead of reusing `src/utils/graphTopology.ts`.
  6. **DNS rebinding gap in `linkAudit.ts`**: `checkUrl` resolves DNS to validate the IP, then calls `fetch(current)` which re-resolves DNS instead of pinning the validated IP for the socket connection.
  7. **Verification report count**: `verification.md` says `5 passed` while listing 6 checks under Isolated Studio E2E Coverage.
- **Root Cause**:
  - `vite-studio-plugin.ts` reads and compares `expectedRevision` at L229-L233 outside `writeQueue` (L243-L252), and constructs `token` with `Math.random()` at L54.
  - `src/data/tagRegistry.ts:11` sets `ALL_TAGS = catalog.tags` instead of `Array.from(new Set(catalog.projects.flatMap((p) => p.tags)))`, and `src/data/projects.catalog.json` was not normalized with `serializeCatalog`.
  - `src/data/catalogSchema.ts:280-292` hand-rolls edge derivation instead of importing `deriveEdges` from `../utils/graphTopology`.
  - `scripts/audit-links.mjs:20` imports `.ts` directly, and `src/utils/linkAudit.ts:224-230` uses `fetch` by hostname after `assertSafeUrl` rather than pinning the resolved IP on the connection.
- **Target Files**: `vite-studio-plugin.ts`, `src/utils/studioPlugin.test.ts`, `src/data/tagRegistry.ts`, `src/data/catalogSchema.ts`, `src/data/projects.catalog.json`, `src/data/projects.test.ts`, `src/utils/linkAudit.mjs` (or `.js`), `src/utils/linkAudit.ts`, `scripts/audit-links.mjs`, `src/utils/auditLinks.test.ts`, `openspec/changes/project-studio/verification.md`
- **Expected Resolution**: Concurrent `PUT` with identical `expectedRevision` returns one `200` and one `409`; `ALL_TAGS` matches pre-refactor order and `projects.catalog.json` equals `serializeCatalog(catalog)`; `npm run test:links` executes cleanly on Node `22.x`; `randomBytes(32)` is used for Studio tokens; `catalogSchema.ts` calls `deriveEdges`; `linkAudit` pins the validated IP on default Node HTTP/HTTPS requests; `verification.md` E2E count and `npm run test:links` output are reconciled.
- **Status**: RESOLVED (2026-11-14 19:25 UTC)
- **Resolution**: PUT read/check/validate/serialize/write now run inside `writeQueue` (concurrent same-revision PUTs yield one `200` + one `409`); tokens use `randomBytes(32)`; `ALL_TAGS` follows project-appearance order and `projects.catalog.json` is committed via `serializeCatalog`; `catalogSchema` reuses `deriveEdges`; link audit ships as pure ESM `src/utils/linkAudit.mjs` + `.d.mts` with IOC-pinned Node HTTP/HTTPS requests; verification records 237 unit tests, 5 Studio E2E cases, and the `npm run test:links` result (13 pass / 1 warning / 2 pre-existing 404s).
