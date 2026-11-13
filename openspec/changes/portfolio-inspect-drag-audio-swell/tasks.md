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
