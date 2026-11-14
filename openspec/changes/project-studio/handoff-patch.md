# Surgical Patch Handoff: OpenSpec Change 'project-studio' [PATCH-01]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `project-studio`
- **Patch ID**: `PATCH-01`
- **Objective**: Fix all 7 review findings on PR #18 (`feat/project-studio`, `3160146`) before merging: PUT lost-update race, `ALL_TAGS` order & non-canonical committed catalog, Node 22 `.ts` import in `scripts/audit-links.mjs`, CSPRNG `randomBytes` Studio token, duplicated edge derivation in `catalogSchema.ts`, DNS-rebinding IP pinning in `linkAudit`, and `verification.md` E2E count mismatch.
- **Feedback & Diagnostic Trace**:
  ```
  1. PUT lost-update race: `vite-studio-plugin.ts` reads `currentBytes` and checks `expectedRevision` at L229-L233 BEFORE entering `writeQueue` (L243-L252). Two concurrent PUTs with the same `expectedRevision` both pass and overwrite each other.
  2. `ALL_TAGS` pill order & canonical catalog: `src/data/tagRegistry.ts:11` exports `catalog.tags` instead of project-appearance order, and `src/data/projects.catalog.json` does not match `serializeCatalog(catalog)` output.
  3. `scripts/audit-links.mjs:20` imports `../src/utils/linkAudit.ts` directly under `engines: { node: "22.x" }`, and `npm run test:links` was not run/recorded.
  4. Studio token: `vite-studio-plugin.ts:54` uses `Math.random()` instead of `crypto.randomBytes(32).toString('hex')`.
  5. Edge derivation duplicated: `src/data/catalogSchema.ts:280-292` duplicates `deriveEdges` from `src/utils/graphTopology.ts`.
  6. DNS pinning: `src/utils/linkAudit.ts:224-230` resolves DNS to validate the IP, then calls `fetch(current)` which re-resolves DNS (TOCTOU / DNS rebinding).
  7. `openspec/changes/project-studio/verification.md`: L16 reports `5 passed` while L38-L43 lists 6 checks.
  ```
- **Root Cause Analysis**: Revision checking ran outside the serialized write mutex; `ALL_TAGS` switched from `projects.flatMap` order to `catalog.tags`; `catalogSchema.ts` re-implemented `deriveEdges`; `audit-links.mjs` imported a `.ts` module; `linkAudit.ts` did not pin the resolved IP on the socket; and `verification.md` had a stale summary count.

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `vite-studio-plugin.ts` | L1, L54, L228–L260 | Use `randomBytes(32).toString('hex')` for token; move `readFile` + `expectedRevision` check + validation + atomic write *inside* `writeQueue` so concurrent stale PUTs return `409` |
| `src/utils/studioPlugin.test.ts` | Add concurrency test | Send two parallel `PUT /__studio/api/state` requests with identical `expectedRevision`; assert one returns `200` and the second returns `409` |
| `src/data/tagRegistry.ts` | L10–L12 | Derive `ALL_TAGS` as `Array.from(new Set<ParadigmTag>(catalog.projects.flatMap((p) => p.tags)))` to preserve pre-refactor pill order |
| `src/data/catalogSchema.ts` | L1–L3, L279–L293 | Import `deriveEdges` from `../utils/graphTopology` and replace the duplicate edge-derivation loop |
| `src/data/projects.catalog.json` | L1–L299 | Format/commit using exact `serializeCatalog(catalog)` output (keeping `tags` order or canonicalizing consistently so Studio Save is a zero-diff no-op) |
| `src/data/projects.test.ts` | Golden equivalence block | Assert `ALL_TAGS` matches pre-refactor order and `JSON.stringify`/raw `projects.catalog.json` matches `serializeCatalog(catalog)` |
| `src/utils/linkAudit.ts` / `scripts/audit-links.mjs` | `scripts/audit-links.mjs:20`, `src/utils/linkAudit.ts:193-275` | Move runtime link-audit implementation to pure ESM JS (`src/utils/linkAudit.mjs` or `.js` + `.d.ts` re-exported/typed for TS) so `node scripts/audit-links.mjs` runs on any Node `22.x`; pin the validated IP via Node `http`/`https` (`host: pinnedIp, servername: parsed.hostname, headers: { Host: parsed.host }`) when using default transport while preserving injectable `fetchImpl` for unit tests |
| `src/utils/auditLinks.test.ts` | Add pinning test | Verify pinned IP transport passes `servername` / `Host` for the hostname while connecting to the validated IP |
| `openspec/changes/project-studio/verification.md` | L10–L18, L34–L50 | Reconcile Studio E2E count (`5 passed` / 5 test cases covering 6 assertions), record `npm run test:links` result, and update DNS pinning note |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files and concerns listed in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT refactor `StudioApp.tsx`, `SeedMiniMap.tsx`, or `TagManager.tsx` UI components.
  - Do NOT reintroduce pinned `9`/`13` literal counts in `projects.test.ts`.
  - Do NOT weaken any existing SSRF, `Origin`/`Host`, `X-Studio-Token`, or `countSeedCrossings === 0` checks.
- **INVARIANTS TO PRESERVE**: All existing unit tests (233+), golden equivalence against `projects.pre-refactor.json`, `npm run build` zero-exposure `dist/` check, and Studio E2E tests MUST pass.

## 4. Visual & UI Impact
- `ALL_TAGS` pill order in `ControlsOverlay` is restored to match `master` (`projects.flatMap((p) => p.tags)`). No other visual or CSS changes permitted.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Add the concurrent-PUT test in `src/utils/studioPlugin.test.ts` and canonical-catalog / `ALL_TAGS` order assertion in `src/data/projects.test.ts`; run `npx vitest run src/utils/studioPlugin.test.ts src/data/projects.test.ts` and confirm failure.
2. **Apply Minimal Fix**: Implement P01.2–P01.4 in the mapped files.
3. **Verify Fix**: Re-run `npx vitest run src/utils/studioPlugin.test.ts src/data/projects.test.ts src/utils/auditLinks.test.ts` and `npm run test:links`.
4. **Full Regression Suite**: Run `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && CI=1 npx playwright test --config=./e2e/playwright.studio.config.ts`.

## 6. Surgical Patch Checklist
- [ ] P01.1 Scaffold/run reproducing tests in `studioPlugin.test.ts`, `projects.test.ts`, and `auditLinks.test.ts` and confirm failure.
- [ ] P01.2 Fix `vite-studio-plugin.ts` (`writeQueue` revision check + `randomBytes(32)` token).
- [ ] P01.3 Fix `tagRegistry.ts` (`ALL_TAGS` order), `catalogSchema.ts` (`deriveEdges` reuse), and canonical `projects.catalog.json`.
- [ ] P01.4 Fix Node `22.x` ESM import in `scripts/audit-links.mjs` and IP-pinned Node HTTP/HTTPS transport in `linkAudit`.
- [ ] P01.5 Verify all tests + `npm run test:links` pass, update `verification.md`, mark `tasks.md` checkboxes `- [x]`, and mark `PATCH-01` `RESOLVED` in `patch.md`.
