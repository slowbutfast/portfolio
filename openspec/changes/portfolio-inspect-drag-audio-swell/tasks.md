## 1. Test Scaffolding (TDD)

- [x] 1.1 Scaffold failing unit tests in `src/utils/audioSwell.test.ts` (for `deriveSwellActive`) and `src/audio/ambientSynth.test.ts` (for `HOVER_SWELL_GAIN = 1.0`, `1.2 s` plateau settle to `0.35`, and idempotent `onNodeHover(true)`), plus failing E2E assertion in `e2e/portfolio.spec.ts` checking `data-audio-swell` on `graph-canvas` during inspect and drag

## 2. Audio Gain, Plateau & Derived Swell Implementation

- [x] 2.1 Update `HOVER_SWELL_GAIN` from `2.0` to `1.0` in `src/audio/audioConstants.ts` and add idempotent `swellActive` + `1200 ms` `0.35` plateau timer (cleared on `onNodeHover(false)` and `dispose()`) in `src/audio/ambientSynth.ts`
- [x] 2.2 Create `src/utils/audioSwell.ts` exporting `deriveSwellActive(hovered, selected, dragging)`
- [x] 2.3 Add `draggingNodeRef` and `syncSynthSwell()` (updating `synthRef.current?.onNodeHover(active)` and `data-audio-swell` on `<canvas>`) in `src/components/GraphCanvas.tsx`, routing all 4 existing call sites (`handleMotionChange` at `L684` resetting `draggingNodeRef`, `focusedId` effect at `L1062`, and `emitHover` at `L1172`/`L1176`), plus `initialSelectedId` effect, `onPointerDown`/`Up`/`Cancel`/`Leave`, and unmount cleanup
- [x] 2.4 Sync `synth.onNodeHover(selectedId !== null)` when `view === 'list'` in `src/App.tsx` so Grid-view inspection also triggers the swell
- [x] 2.5 Replace the mobile-only sound indicator dot with an accent-colored 3-dot `Filters & Layout` glyph, remove the unused `.sound-indicator` CSS, and update the `portfolio-controls` spec, design, tests, and E2E assertions

## 3. Verification & Empirical Audit

- [x] 3.1 Run `npm run typecheck`, `npm run build`, `npm test`, and `npx openspec validate portfolio-inspect-drag-audio-swell --strict --json` to verify clean passes
- [x] 3.2 Populate `verification.md` with Requirement Adherence Matrix and verbatim execution logs

## Patch 02: Add Sandwave Sim and Transcribe Plus liveUrl for inspector Visit links

> The external handoff labelled this work `PATCH-01`; it is recorded here as `PATCH-02` because `PATCH-01` is the accent settings-glyph patch already landed in `6581b8c`.

- [x] P02.1 Add failing unit assertion in `src/data/projects.test.ts` and failing desktop/mobile E2E assertion in `e2e/portfolio.spec.ts` for both `liveUrl` values and `drawer-visit` hrefs
- [x] P02.2 Add `liveUrl: 'https://transcribe-plus-frontend.vercel.app/',` and `liveUrl: 'https://sandwave-sim.vercel.app/',` in `src/data/projects.ts`
- [x] P02.3 Verify tests pass (`npm run typecheck && npm run build && npm test`)
- [x] P02.4 Update `verification.md` and mark `PATCH-02` resolved in `patch.md`

## Patch 03: Unify desktop inspector swell with mobile by re-arming on open

- [x] P03.1 Add failing unit tests for the one-shot inspector retrigger (`deriveSwellRetrigger` and `onNodeHover(true, true)`) and a desktop move-away E2E assertion
- [x] P03.2 Implement `deriveSwellRetrigger(selected, wasSelected)` and pass the one-shot retrigger through `GraphCanvas.syncSynthSwell()` so desktop inspect starts a fresh `1.0` swell before settling to `0.35`
- [x] P03.3 Update the `ambient-audio` delta/main specs and `architecture.md` to document the selection-transition retrigger
- [x] P03.4 Verify the full suite and OpenSpec strict validation; update `tests.md`, `verification.md`, and mark `PATCH-03` resolved in `patch.md`
