# OpenCode Orchestration Handoff: OpenSpec Change 'node-cursor-and-swell-gain'

You are the orchestration agent for OpenSpec change 'node-cursor-and-swell-gain' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: node-cursor-and-swell-gain
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub node-cursor-and-swell-gain`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments (`src/audio/` and `src/components/GraphCanvas.tsx`) and avoid horizontal abstractions.

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/audio/ambientSynth.test.ts` | `L184` | TDD Task 1.1: Update constant assertion `expect(HOVER_SWELL_GAIN).toBe(1.0)` → `expect(HOVER_SWELL_GAIN).toBe(0.5)`. |
| `e2e/portfolio.spec.ts` | `L1197-L1227` | TDD Task 1.2: Update desktop cursor E2E test to assert `default` on empty canvas, `grab` on node hover, `grabbing` on `pointerdown` and during drag, and `grab` after `pointerup` over the node. |
| `src/audio/audioConstants.ts` | `L14` | Task 2.1: Change `export const HOVER_SWELL_GAIN = 1.0;` → `export const HOVER_SWELL_GAIN = 0.5;` (halves both peak swell and 35% sustained plateau `0.175`). |
| `src/components/GraphCanvas.tsx` | `L1530-L1533`, `L1549`, `L1562`, `L1581`, `L1620` | Task 2.2: Widen `setCanvasCursor` union to `'default' \| 'grab' \| 'grabbing'`; set `'grabbing'` on drag `onPointerMove` (`L1549`) and node `onPointerDown` (`L1581`), `'grab'` on idle node hover (`L1562`) and node `onPointerUp` (`L1620`); keep `'default'` on empty canvas, `onPointerCancel` (`L1641`), and `onPointerLeave` (`L1647`). |
| `openspec/changes/node-cursor-and-swell-gain/tasks.md` | `L1-L21` | Check off completed tasks (`- [x]`) only after each genuinely runs and passes. |
| `openspec/changes/node-cursor-and-swell-gain/verification.md` | `[NEW]` | Task 3.2: Populate Requirement Adherence Audit Matrix, resolved assumptions, nomenclature audit, and verbatim execution logs. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Adjust `HOVER_SWELL_GAIN` (`1.0 -> 0.5`) directly in `src/audio/audioConstants.ts` so `AmbientSynth.onNodeHover()` scales both peak swell (`0.5`) and sustained plateau (`0.5 * 0.35 = 0.175`) from the single source of truth.
  - Keep `setCanvasCursor` as direct DOM mutation (`canvas.style.cursor`) with redundant-write guard (`if (canvas.style.cursor !== cursor)`) to avoid React re-renders on `pointermove`.
- **Hard Exclusions / No-Go**:
  - Do NOT modify `DEFAULT_SOUND_ENABLED` (already `false`), `localStorage` persistence, `BASE_DRONE_GAIN`, `NOISE_FLOOR_GAIN`, `MASTER_GAIN`, or `HOVER_SWELL_PLATEAU`.
  - Do NOT modify `ProjectDrawer` border drag cursor (`move`) or Studio `SeedMiniMap` cursor styling.
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies.
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage.

## 4. Visual & UI Design Specifications & Vision Verification
- **Visual Scope**: No color palette, typography, or layout changes. Refine desktop pointer cursor states on `GraphCanvas` (`data-testid="graph-canvas"`) and audio swell gain.
- **Component Anatomy & States (`GraphCanvas`)**:
  - **Default / Empty Canvas / Leave / Cancel**: `cursor: default`
  - **Hovering a Project Node (`r = 22px`)**: `cursor: grab`
  - **Pressing / Dragging a Project Node (`pointerdown` through `sim.state === 'drag'`)**: `cursor: grabbing`
  - **Pointer Release (`pointerup`)**: `cursor: grab` if still over a node, `cursor: default` if over empty canvas.
- **Responsive Layout**:
  - Desktop (`≥ 768px` / fine pointer): transitions `default` → `grab` → `grabbing` → `grab` → `default`.
  - Mobile / Touch (`< 768px` / coarse pointer): touch pointers ignore CSS cursors; existing touch drag/tap/`pointercancel` behavior remains unchanged.
- **Multi-Modal Vision Verification**:
  - Cursor state transitions are verified programmatically via Playwright `getComputedStyle(canvas).cursor` in `e2e/portfolio.spec.ts`. Subjective audio loudness balance remains a manual maintainer check; complete all automated unit, typecheck, and Playwright cursor assertions.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runners**:
  - Unit tests (narrow): `npx vitest run src/audio/ambientSynth.test.ts`
  - Unit tests (full): `npm run test:unit` (`vitest run`)
  - Typecheck: `npm run typecheck` (`tsc --noEmit`)
  - Desktop cursor E2E (narrow): `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor" --workers=1`
- **TDD Requirement**: Task group `## 1` MUST scaffold failing unit and E2E tests BEFORE touching `src/audio/audioConstants.ts` or `src/components/GraphCanvas.tsx`. Verify both fail initially.
- **Resource & Concurrency Rules**:
  - During task implementation, run ONLY the narrowest test file corresponding to the modified code. Do NOT run full test discovery or headless browser E2E suites on every task checkbox.
  - When running test verification, wrap commands with `safe-test` (if available) or run with single worker (`--workers=1`) to serialize execution and prevent memory thrashing.

## 6. Implementation Task Checklist
- [ ] 1.1 Update the `HOVER_SWELL_GAIN` assertion in `src/audio/ambientSynth.test.ts` (line 184) from `1.0` to `0.5` and run `npx vitest run src/audio/ambientSynth.test.ts` to confirm it fails before the constant change.
- [ ] 1.2 Update the desktop cursor E2E test in `e2e/portfolio.spec.ts` (lines 1197–1227) to assert `default` on empty canvas, `grab` on node hover, `grabbing` on `pointerdown` and during drag, and `grab` after `pointerup` over the node, and run `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor"` to confirm it fails before the cursor change.
- [ ] 2.1 Change `HOVER_SWELL_GAIN` from `1.0` to `0.5` in `src/audio/audioConstants.ts` (line 14), leaving `DEFAULT_SOUND_ENABLED = false`, `HOVER_SWELL_PLATEAU = 0.35`, `BASE_DRONE_GAIN`, and `NOISE_FLOOR_GAIN` unchanged.
- [ ] 2.2 Widen `setCanvasCursor` in `src/components/GraphCanvas.tsx` (lines 1530–1533) to `'default' | 'grab' | 'grabbing'` and update cursor transitions: `'grabbing'` while dragging (`onPointerMove`, line 1549) and on node `onPointerDown` (line 1581), `'grab'` on idle node hover (`onPointerMove`, line 1562) and node `onPointerUp` (line 1620), keeping `'default'` on empty canvas, `onPointerCancel` (line 1641), and `onPointerLeave` (line 1647).
- [ ] 3.1 Run `npm run typecheck`, `npx vitest run`, and `npx playwright test e2e/portfolio.spec.ts --project=desktop -g "canvas cursor"` and confirm all checks pass cleanly.
- [ ] 3.2 Populate `verification.md` with the Requirement Adherence Audit Matrix, resolved assumptions, and verbatim execution logs.

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `openspec/changes/node-cursor-and-swell-gain/tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm no project catalog entries, sound preference keys, or unrelated graph behaviors changed.
3. Ensure `openspec/changes/node-cursor-and-swell-gain/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.

## 8. Verification Review & Single-Pass Automated Repair (Max Retries = 1)
- **If verification succeeds with zero critical issues**:
  1. Sync specs: `openspec specs apply --change "node-cursor-and-swell-gain"`.
  2. **Open a Pull Request**:
     - Ensure your work is on a dedicated feature branch (create/switch to `feat/node-cursor-and-swell-gain` if currently on `main`/`master`).
     - Stage and commit all implementation code and every artifact within the change directory (`git add openspec/changes/node-cursor-and-swell-gain openspec/specs src/audio/audioConstants.ts src/audio/ambientSynth.test.ts src/components/GraphCanvas.tsx e2e/portfolio.spec.ts`), then push the branch (`git push -u origin HEAD`).
     - Open a Pull Request using `gh pr create --fill` (or with a concise title and a body summarizing `openspec/changes/node-cursor-and-swell-gain/proposal.md` and `openspec/changes/node-cursor-and-swell-gain/verification.md`) and report the PR URL.
- **If CRITICAL issues or failed test verification errors are detected on initial pass**:
  1. Announce: "Verification failed on initial pass. Attempting a single bounded repair pass via subagent..."
  2. Delegate a single-pass repair task to `spec-coder-sub` with the verification failure context:
     > "Fix the specific verification failures and test errors reported for change 'node-cursor-and-swell-gain'. Refer to the error log, make minimal targeted patches to resolve the failures, run verification commands, and update tasks.md."
  3. Re-run verification via `openspec-verify-change`.
  4. **If verification passes after repair**:
     - Sync specs: `openspec specs apply --change "node-cursor-and-swell-gain"`.
     - Stage, commit, push branch, and open PR via `gh pr create --fill`.
  5. **If verification STILL fails after the single repair pass**:
     - **HALT**: Do NOT loop or re-run again. Present the Verification Report and remaining blockers to the user for manual guidance.
