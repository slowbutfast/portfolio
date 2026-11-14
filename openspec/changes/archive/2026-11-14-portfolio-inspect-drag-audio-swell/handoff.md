# OpenCode Orchestration Handoff: OpenSpec Change 'portfolio-inspect-drag-audio-swell'

You are the orchestration agent for OpenSpec change `portfolio-inspect-drag-audio-swell` running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: `portfolio-inspect-drag-audio-swell`
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub portfolio-inspect-drag-audio-swell`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments and avoid horizontal abstractions.

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/audio/audioConstants.ts` | `L14` | Lower `HOVER_SWELL_GAIN` from `2.0` to `1.0` so bandpass swell peaks stay below `0 dBFS`. |
| `src/audio/ambientSynth.ts` | `L211-222`, `L448-476` | Add `swellActive` + `swellPlateauTimer` (`1200 ms` decay to `HOVER_SWELL_GAIN * 0.35`); make `onNodeHover(true)` idempotent while already active; clear timer on `onNodeHover(false)` and `dispose()`. |
| `src/utils/audioSwell.ts` | `[NEW]` | Export pure `deriveSwellActive(hovered: boolean, selected: boolean, dragging: boolean): boolean`. |
| `src/utils/audioSwell.test.ts` | `[NEW]` | Unit test all 8 combinations of `deriveSwellActive`. |
| `src/audio/ambientSynth.test.ts` | Existing unit tests | Add tests for `HOVER_SWELL_GAIN = 1.0`, `1.2 s` plateau settle to `0.35`, and idempotent `onNodeHover(true)`. |
| `src/components/GraphCanvas.tsx` | `L321-340`, `L680-687`, `L1055-1072`, `L1167-1185`, `L1307-1394` | Add `draggingNodeRef` and `syncSynthSwell()` calling `deriveSwellActive(...)`, updating `synthRef.current?.onNodeHover(active)` and `data-audio-swell` on `<canvas>`; route all 4 call sites (`handleMotionChange` at `L684` resetting `draggingNodeRef`, `focusedId` effect at `L1062`, `emitHover` at `L1172`/`L1176`), `initialSelectedId` effect, `onPointerDown`/`Up`/`Cancel`/`Leave`, and unmount cleanup. |
| `src/App.tsx` | `L305-325`, `L351` | Add `useEffect` syncing `synth.onNodeHover(selectedId !== null)` when `view === 'list'` so Grid-view inspection also triggers the swell. |
| `e2e/portfolio.spec.ts` | Audio / inspect E2E tests | Add E2E assertion verifying `data-audio-swell="true"` during inspect and drag, and `"false"` after close/release. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - `deriveSwellActive(hovered, selected, dragging)` pure helper in `src/utils/audioSwell.ts`.
  - `HOVER_SWELL_GAIN = 1.0` + `1200 ms` plateau settle to `0.35` (`idempotent` `onNodeHover(true)`).
  - `data-audio-swell="true" | "false"` attribute on `<canvas data-testid="graph-canvas">`.
  - `App.tsx` handles `view === 'list'` inspection swell while `GraphCanvas` is unmounted.
- **Hard Exclusions / No-Go**:
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies.
  - Do NOT modify `BASE_DRONE_GAIN`, `BASE_LOWPASS_FREQ`, or add iOS `audioSession` workarounds.

## 4. Visual & UI Design Specifications
**Status: Non-visual / Audio behavior change.** No user-facing components, layout, or styling affected. Do NOT generate UI components or CSS rules.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runner**:
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:unit` (`vitest run`)
  - `npm run test:e2e` (`playwright test`)
  - `npm test` (`npm run test:unit && npm run test:e2e`)
- **TDD Requirement**: Task group `## 1` MUST scaffold failing unit/E2E tests before touching implementation code. Verify they fail initially.

## 6. Implementation Task Checklist
- [ ] 1.1 Scaffold failing unit tests in `src/utils/audioSwell.test.ts` (for `deriveSwellActive`) and `src/audio/ambientSynth.test.ts` (for `HOVER_SWELL_GAIN = 1.0`, `1.2 s` plateau settle to `0.35`, and idempotent `onNodeHover(true)`), plus failing E2E assertion in `e2e/portfolio.spec.ts` checking `data-audio-swell` on `graph-canvas` during inspect and drag
- [ ] 2.1 Update `HOVER_SWELL_GAIN` from `2.0` to `1.0` in `src/audio/audioConstants.ts` and add idempotent `swellActive` + `1200 ms` `0.35` plateau timer (cleared on `onNodeHover(false)` and `dispose()`) in `src/audio/ambientSynth.ts`
- [ ] 2.2 Create `src/utils/audioSwell.ts` exporting `deriveSwellActive(hovered, selected, dragging)`
- [ ] 2.3 Add `draggingNodeRef` and `syncSynthSwell()` (updating `synthRef.current?.onNodeHover(active)` and `data-audio-swell` on `<canvas>`) in `src/components/GraphCanvas.tsx`, routing all 4 existing call sites (`handleMotionChange` at `L684` resetting `draggingNodeRef`, `focusedId` effect at `L1062`, and `emitHover` at `L1172`/`L1176`), plus `initialSelectedId` effect, `onPointerDown`/`Up`/`Cancel`/`Leave`, and unmount cleanup
- [ ] 2.4 Sync `synth.onNodeHover(selectedId !== null)` when `view === 'list'` in `src/App.tsx` so Grid-view inspection also triggers the swell
- [ ] 3.1 Run `npm run typecheck`, `npm run build`, `npm test`, and `npx openspec validate portfolio-inspect-drag-audio-swell --strict --json` to verify clean passes
- [ ] 3.2 Populate `verification.md` with Requirement Adherence Matrix and verbatim execution logs

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Ensure `openspec/changes/portfolio-inspect-drag-audio-swell/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
3. Automatically run verification via `openspec-verify-change`.
4. If clean with no critical issues, sync specs: `openspec specs apply --change "portfolio-inspect-drag-audio-swell"`.
5. **Open a Pull Request**:
   - Ensure your work is on a dedicated feature branch (`feat/portfolio-inspect-drag-audio-swell`).
   - Stage and commit the implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` and report the PR URL.
