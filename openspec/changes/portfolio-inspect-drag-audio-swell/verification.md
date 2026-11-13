# Verification: portfolio-inspect-drag-audio-swell

## Executive Summary & Environment

- **Status**: All automated specs verified passing. `typecheck`, production build, unit suite, and the full desktop + mobile Playwright suite are green; `openspec validate --strict` reports zero issues. The user also confirmed on-device sound quality manually (`"the sound looks good on my end"`, 2026-11-13) and requested that the 3-dot settings glyph itself carry the sound-active accent instead of a separate dot. `PATCH-02` also adds the missing live demo URLs so the Transcribe Plus and Sandwave Sim inspectors render `Visit ↗` actions.
- **Date**: 2026-11-13
- **Branch**: `feat/portfolio-inspect-drag-audio-swell` (branched from `ca2a15d`)
- **Environment**:
  - OS: Linux `7db21b94c3fa` 5.15.0-1081-oracle, `aarch64`
  - Node: `v22.23.2`; npm: `10.9.8`
  - Test runners: Vitest `3.2.7`; Playwright `1.63.0`
  - OpenSpec CLI: `1.7.0`
  - Browsers: Chromium `desktop` (`Desktop Chrome`) and `mobile` (`Pixel 7`, touch)

## Requirement Adherence Audit Matrix

Delta capability: `ambient-audio` → `### Requirement: Node hover harmonic resonance swell`.

| Capability | Requirement & Scenario | Verification Method / Test | Status |
| :--- | :--- | :--- | :--- |
| `ambient-audio` | **Requirement: Node hover harmonic resonance swell** — non-clipping `HOVER_SWELL_GAIN = 1.0`, `50ms` ramps, `35%` plateau after `1.2s`, active on hover/drag/Graph+Grid inspect | `src/audio/audioConstants.ts:14-17`; `src/audio/ambientSynth.ts:452-479`; `src/utils/audioSwell.ts`; `src/audio/ambientSynth.test.ts` (18 tests); `src/utils/audioSwell.test.ts` (9 tests) | **PASS** |
| `ambient-audio` | **Scenario: Pointer hovers over a canvas node** — opens to `1.0` with a `50ms` time constant, no clipping | `src/audio/ambientSynth.test.ts:347` `swells the hover bandpass gain to HOVER_SWELL_GAIN and returns to zero`; `src/audio/ambientSynth.test.ts:280` `uses setTargetAtTime for every parameter ramp` (asserts `RAMP_TIME_CONSTANT = 0.05`); `src/audio/ambientSynth.test.ts:184` `HOVER_SWELL_GAIN` is `1.0` | **PASS** |
| `ambient-audio` | **Scenario: Pointer leaves a canvas node** — gain decays to zero when no drag/inspect remains | `src/audio/ambientSynth.test.ts:347` (asserts `hoverGain.gain.value === 0` after `onNodeHover(false)`); `src/utils/audioSwell.test.ts` (8-combination truth table, all-false → `false`); `e2e/portfolio.spec.ts:287` (canvas returns to `data-audio-swell="false"` after release/close) | **PASS** |
| `ambient-audio` | **Scenario: User drags a node or inspects a project** — `pointerdown` on a node through release, or `ProjectDrawer` open from Graph or Grid view, settles to `0.35` if held | `e2e/portfolio.spec.ts:287` `canvas mirrors inspect and drag audio swell state` (deep-link inspect → `"true"`, close → `"false"`, drag → `"true"`, release → `"false"`); `src/components/GraphCanvas.tsx:355-367` (`syncSynthSwell` covers hover/select/drag); `src/App.tsx:303-308` (Grid-view inspect while `GraphCanvas` is unmounted); `src/audio/ambientSynth.test.ts:357` (plateau at `1199ms` vs `1200ms`), `:377` (idempotent repeats), `:396` (dispose clears timer) | **PASS** |
| `portfolio-controls` | **Requirement: Top-right header navigation sequence and theme toggle** — sound-active state is carried by the 3-dot `Filters & Layout` glyph itself, not a separate dot | `src/components/ControlsOverlay.tsx` (`data-sound-active`, accent class on `controls-dropdown-icon`); `openspec/specs/portfolio-controls/spec.md`; E2E desktop + mobile assertions | **PASS** |
| `portfolio-controls` | **Scenario: Desktop visitor views top-right header options** — 3-dot glyph renders in `--color-accent` while sound is enabled | `e2e/portfolio.spec.ts` `Sound toggle persists the user preference across reloads` (asserts `data-sound-active="true"` and glyph accent, then reverts after disabling) | **PASS** |
| `portfolio-controls` | **Scenario: Mobile visitor views top-right header options** — 3-dot glyph renders in `--color-accent`, no `controls-sound-indicator` dot | `e2e/portfolio.spec.ts` `mobile 3-dot menu hosts Sound, volume, and a reachable Reset` (asserts `data-sound-active`, glyph accent, and dot count `0`) | **PASS** |
| `portfolio-controls` | **Scenario: User opens the 3-dot menu and resets graph layout** — unchanged `Filters`/Reset behavior | `e2e/portfolio.spec.ts` `3-dot menu exposes one Reset that clears filters, layout, and visited colors` | **PASS** |
| `project-catalog` | **Requirement: Verified project metadata catalog and preview mapping** — `transcribe-plus` and `sandwave-sim` now declare `liveUrl` | `src/data/projects.test.ts` `declares live demo URLs for transcribe-plus and sandwave-sim` | **PASS** |
| `project-drawer` | **Requirement: Elevated primary repository and live project actions** / **Scenario: User inspects a project with a live URL and repository** — both projects now render `Code ↗` and `Visit ↗` | `e2e/portfolio.spec.ts` `Transcribe Plus and Sandwave Sim drawers expose their live demo links` (desktop + mobile, href assertions) | **PASS** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| `onNodeHover` has four call sites in `GraphCanvas.tsx` (`L684`, `L1062`, `L1172`, `L1176`) | `grep -n "onNodeHover" src/components/GraphCanvas.tsx` after refactor shows a single routed call inside `syncSynthSwell`; every original path now calls `syncSynthSwell()` | All four entry points plus pointer lifecycle and effects covered | stable |
| `selectedIdRef` already tracks `initialSelectedId` | `src/components/GraphCanvas.tsx:323-324` assigns `selectedIdRef.current = initialSelectedId ?? null` every render; new effect at `:1093-1096` reconciles on change | Verified by inspection and E2E deep-link inspect (`data-audio-swell="true"`) | stable |
| `HOVER_SWELL_GAIN = 2.0` fits without clipping | Replaced by explicit `1.0`; unit assertion at `src/audio/ambientSynth.test.ts:184`; halving linear gain removes `+6.02 dB`, moving the researched `+1.5 dBFS` peak to approximately `-4.5 dBFS` | Non-clipping (`< 0 dBFS`) by construction | stable |
| Sustained inspection can buzz at full peak | New plateau test advances fake timers to `1199ms` (stays `1.0`) then `1200ms` (settles to `0.35`); repeated `onNodeHover(true)` leaves the ramp count unchanged | Plateau + idempotency proven | stable |
| Phone-speaker audibility and sustained comfort on the user's iPhone | User listened on-device after implementation and confirmed the sound is good; matches the manual check documented in `tests.md` | **User-verified** on 2026-11-13 (`"the sound looks good on my end"`) | stable |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| Resonance swell | `AmbientSynth.onNodeHover(isHovered)` / `nodes.hoverGain` | `src/audio/ambientSynth.ts:452-479` | Yes |
| Derived swell (`hovered \|\| selected \|\| dragging`) | `deriveSwellActive(hovered, selected, dragging)` | `src/utils/audioSwell.ts` | Yes |
| Non-clipping swell gain | `HOVER_SWELL_GAIN` | `src/audio/audioConstants.ts:14` | Yes |
| Sustained plateau | `HOVER_SWELL_PLATEAU` (`0.35`) | `src/audio/audioConstants.ts:16` | Yes |
| Plateau delay | `HOVER_SWELL_PLATEAU_DELAY_MS` (`1200`) | `src/audio/audioConstants.ts:17` | Yes |
| Single swell reconciler | `syncSynthSwell()` | `src/components/GraphCanvas.tsx:355-367` | Yes |
| Drag lifecycle flag | `draggingNodeRef` | `src/components/GraphCanvas.tsx:340` | Yes |
| Observability attribute | `data-audio-swell="true" \| "false"` | set in `syncSynthSwell()` on `<canvas data-testid="graph-canvas">` | Yes |
| 50ms smoothing constant | `RAMP_TIME_CONSTANT = 0.05` used by `ramp()` | `src/audio/audioConstants.ts:18`; `src/audio/ambientSynth.ts:192-198` | Yes |

## Landed Tech Footprint & Patterns

| Adopted Pattern / Package | Implementation File(s) | Verification Command / Suite |
| :--- | :--- | :--- |
| Pure state helper mirroring `stickyFocal.ts` | `src/utils/audioSwell.ts`, `src/utils/audioSwell.test.ts` | `npm run test:unit` (`audioSwell.test.ts`, 9 tests) |
| Idempotent envelope + plateau timer | `src/audio/ambientSynth.ts:452-479`; constants in `src/audio/audioConstants.ts:14-17` | `npm run test:unit` (`ambientSynth.test.ts`, 18 tests) |
| DOM observability mirroring `data-sim-state` | `src/components/GraphCanvas.tsx:355-367` (`canvas.dataset.audioSwell`) | `npm run test:e2e` (`canvas mirrors inspect and drag audio swell state`) |
| Glyph-as-indicator (no badge/dot) | `src/components/ControlsOverlay.tsx` (`data-sound-active`, accent class on `controls-dropdown-icon`); `src/styles.css` (unused `.sound-indicator` removed) | `npm run test:e2e` (`Sound toggle persists…`, `mobile 3-dot menu hosts Sound…`) |
| Catalog live-demo metadata | `src/data/projects.ts` (`liveUrl` on `transcribe-plus` and `sandwave-sim`); `src/components/ProjectDrawer.tsx` existing `drawer-visit` render | `npx vitest run src/data/projects.test.ts`; `npx playwright test -g "Transcribe Plus and Sandwave Sim drawers expose"` |
| Single reconciler across hover/drag/inspect | `src/components/GraphCanvas.tsx` (`emitHover`, reduced-motion handler, `focusedId` effect, `initialSelectedId` effect, pointer down/up/cancel/leave, unmount cleanup) | `npm run typecheck`, `npm run test:e2e` |
| Graph/Grid view parity | `src/App.tsx:303-308` | `npm run typecheck`; Grid-view behavior is code-verified (`GraphCanvas` is unmounted in list view) |

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| A test can find the hover gain by looking for `gain.value === HOVER_SWELL_GAIN` | With `HOVER_SWELL_GAIN = 1.0`, the master gain also equals `1.0`, so the old lookup could select the master node and falsely fail the return-to-zero assertion | Added `findHoverGain()`, which captures the only gain still at `0` after `setSoundEnabled(true)` (`src/audio/ambientSynth.test.ts:322-329`) | Keeps the test deterministic without exposing private nodes |
| Reduced-motion `pointerleave`/motion change could return early after clearing hover | Direct `onNodeHover(false)` calls bypassed drag/selected state, which could silence a still-open inspector | All paths now call `syncSynthSwell()`, and the derived helper keeps the swell alive while `selectedId` is set | Satisfies the spec clause for reduced motion with an open inspector |
| Grid-view inspection could be covered only by `GraphCanvas` | `ListView` unmounts `GraphCanvas`, so no canvas attribute exists and no pointer lifecycle runs | `App.tsx` now calls `synth.onNodeHover(selectedId !== null)` when `view === 'list'` | Preserves audio parity across views |
| A separator dot was the right way to signal that sound controls are active | Review feedback preferred the settings glyph itself to carry the state; the dot was mobile-only and visually detached from the three dots | Removed `controls-sound-indicator`; `MoreHorizontal` takes `--color-accent` when `soundEnabled`, with `data-sound-active` on the trigger | Cleaner affordance and desktop/mobile parity |

## Implementation-Discovered Deferrals

- **Deferred Item**: Automated assertion of the Grid-view swell on the canvas.
  - **Reason**: Grid view intentionally unmounts `<canvas>`, so `data-audio-swell` has nowhere to live. The App-level sync is covered by typecheck and code audit; adding a cross-view assertion would require a new persistent observability element outside this change's scope.
- ~~**Deferred Item**: Physical iPhone speaker / 30-second comfort check.~~ **Resolved** on 2026-11-13: the user confirmed on-device sound quality is good, so the manual check is no longer outstanding.

## Empirical Execution Logs & Evidence

All commands were run from the worktree root on 2026-11-13.

### Typecheck

```bash
$ npm run typecheck
> node-portfolio-graph@0.1.0 typecheck
> tsc --noEmit
```

Exit code: `0`.

### Production build

```bash
$ npm run build
> node-portfolio-graph@0.1.0 build
> tsc --noEmit -p tsconfig.build.json && vite build
...
✓ 1962 modules transformed.
dist/assets/index-BER9ftws.css                           30.77 kB │ gzip:   6.63 kB
dist/assets/index-DC_FpmIL.js                           342.51 kB │ gzip: 108.87 kB
✓ built in 4.04s
```

Exit code: `0`.

### Unit suite (Vitest)

Run as the first phase of `npm test`, after `npm run build` created `dist/` (the two `buildOutput` guards run only when `dist/assets` exists):

```bash
$ npm test
...
✓ src/audio/ambientSynth.test.ts (18 tests)
✓ src/utils/audioSwell.test.ts (9 tests)
...
Test Files  19 passed (19)
     Tests  201 passed (201)
```

Exit code: `0`. On a tree without `dist/`, the same command reports `199 passed | 2 skipped (201)`; both skipped cases are the build-output guards.

### Full E2E suite (Playwright, desktop + mobile)

```bash
$ npm run test:e2e
...
✓ [desktop] › e2e/portfolio.spec.ts:287:3 › portfolio graph SPA › canvas mirrors inspect and drag audio swell state
✓ [mobile]  › e2e/portfolio.spec.ts:287:3 › portfolio graph SPA › canvas mirrors inspect and drag audio swell state
✓ [desktop] › e2e/portfolio.spec.ts:386:3 › portfolio graph SPA › Transcribe Plus and Sandwave Sim drawers expose their live demo links
✓ [mobile]  › e2e/portfolio.spec.ts:386:3 › portfolio graph SPA › Transcribe Plus and Sandwave Sim drawers expose their live demo links
...
  36 skipped
  108 passed (3.5m)
```

Exit code: `0`. The 36 skips are pre-existing project-targeted skips (desktop-only or mobile-only cases); no failures.

**Flake note**: One earlier full-suite pass hit a pre-existing timing flake in `hover card stays inside the desktop viewport at 1440x900`, where `hoverCenteredNode()` did not observe a hover card within its fixed waits. That test passed in isolation (`npx playwright test -g "hover card stays inside the desktop viewport at 1440x900"` → `1 passed, 1 skipped`) and in the final full re-run quoted above. No production code in this change touches hover-card layout or placement.

### OpenSpec strict validation

```bash
$ npx openspec validate portfolio-inspect-drag-audio-swell --strict --json
{
  "items": [
    {
      "id": "portfolio-inspect-drag-audio-swell",
      "type": "change",
      "valid": true,
      "issues": [],
      "durationMs": 6
    }
  ],
  "summary": {
    "totals": { "items": 1, "passed": 1, "failed": 0 }
  },
  "version": "1.0"
}
```

Exit code: `0`.

### TDD evidence (initial red state)

Before implementation, the scaffolded tests failed for the intended reasons:

```bash
$ npx vitest run src/utils/audioSwell.test.ts src/audio/ambientSynth.test.ts
FAIL  src/utils/audioSwell.test.ts — Failed to load url ./audioSwell (does the file exist?)
FAIL  src/audio/ambientSynth.test.ts > audio constants > exposes the specified synthesizer topology
      AssertionError: expected 2 to be 1
FAIL  src/audio/ambientSynth.test.ts > parameter modulation > settles a sustained swell to a 35% plateau after 1.2s
FAIL  src/audio/ambientSynth.test.ts > parameter modulation > treats repeated onNodeHover(true) calls while active as no-ops
      AssertionError: expected 3 to be 1
Test Files  2 failed (2)
     Tests  3 failed | 15 passed (18)
```

### Manual on-device verification

- **Date**: 2026-11-13
- **Tester**: User (project owner) on their own device
- **Method**: Played the app with Sound enabled and exercised the inspect/drag paths implemented by this change.
- **Verbatim report**:
  > the sound looks good on my end
- **Result**: **PASS** — the user confirmed the audible result is good; no clipping or harsh sustained buzz was reported.

### PATCH-01 targeted E2E (sound-active glyph)

```bash
$ npx playwright test -g "Sound toggle persists|mobile 3-dot menu hosts Sound"
Running 4 tests using 1 worker
  ✓  1 [desktop] › e2e/portfolio.spec.ts:254:3 › portfolio graph SPA › Sound toggle persists the user preference across reloads
  -  2 [desktop] › e2e/portfolio.spec.ts:635:3 › portfolio graph SPA › mobile 3-dot menu hosts Sound, volume, and a reachable Reset
  -  3 [mobile] › e2e/portfolio.spec.ts:254:3 › portfolio graph SPA › Sound toggle persists the user preference across reloads
  ✓  4 [mobile] › e2e/portfolio.spec.ts:635:3 › portfolio graph SPA › mobile 3-dot menu hosts Sound, volume, and a reachable Reset
  2 skipped
  2 passed (8.3s)
```

Exit code: `0`. Desktop verifies the accent glyph on the desktop trigger; mobile verifies it inside the 3-dot menu flow, including `controls-sound-indicator` count `0`.

### PATCH-02 targeted verification (live demo links)

Initial red state before adding `liveUrl`:

```bash
$ npx vitest run src/data/projects.test.ts
FAIL  src/data/projects.test.ts > project catalog contract > declares live demo URLs for transcribe-plus and sandwave-sim
AssertionError: expected undefined to be 'https://transcribe-plus-frontend.vercel.app/'
Test Files  1 failed (1)
     Tests  1 failed | 11 passed (12)

$ npx playwright test -g "Transcribe Plus and Sandwave Sim drawers expose"
2 failed
  [desktop] › … Transcribe Plus and Sandwave Sim drawers expose their live demo links
  [mobile]  › … Transcribe Plus and Sandwave Sim drawers expose their live demo links
```

After adding both `liveUrl` entries:

```bash
$ npx vitest run src/data/projects.test.ts
✓ src/data/projects.test.ts (12 tests)
Test Files  1 passed (1)
     Tests  12 passed (12)

$ npx playwright test -g "Transcribe Plus and Sandwave Sim drawers expose"
Running 2 tests using 1 worker
  ✓  1 [desktop] › e2e/portfolio.spec.ts:386:3 › portfolio graph SPA › Transcribe Plus and Sandwave Sim drawers expose their live demo links (838ms)
  ✓  2 [mobile] › e2e/portfolio.spec.ts:386:3 › portfolio graph SPA › Transcribe Plus and Sandwave Sim drawers expose their live demo links (698ms)
  2 passed (4.5s)
```

Exit code: `0`.

### Metrics & Data Invariants

| Metric / Count | Before | After | Delta / Observation |
| :--- | :--- | :--- | :--- |
| `HOVER_SWELL_GAIN` linear gain | `2.0` | `1.0` | `-6.02 dB`; researched peak `+1.5 dBFS` → ≈`-4.5 dBFS` (non-clipping) |
| Sustained hover gain after `1.2s` | `2.0` (frozen) | `0.35` | `-15.1 dB` plateau, prevents a stuck loud buzz |
| Hover-gain test lookup | value matched `HOVER_SWELL_GAIN` | zero-valued gain after start | Avoids collision with master gain at `1.0` |
| New unit tests | `0` | `12` | +9 `deriveSwellActive` truth-table cases, +3 envelope/idempotency/dispose cases |
| New E2E scenarios | `0` | `2` | Desktop + mobile `data-audio-swell` inspect/drag coverage |
| On-device sound check | Manual pending | User-confirmed good | Manual **PASS** on 2026-11-13 |
| Sound-active affordance | Mobile-only corner dot (`controls-sound-indicator`) | Accent 3-dot settings glyph on desktop + mobile | One fewer DOM node; `.sound-indicator` CSS removed |
| Sound-state E2E assertions | Dot visibility/width | `data-sound-active` + accent class + dot count `0` | Covers both enabled and disabled states |
| Catalog `liveUrl` entries | `3` (open-dungeon, kintsugi, ivy) | `5` | +`transcribe-plus`, +`sandwave-sim` |
| Transcribe/Sandwave inspector `Visit ↗` actions | `0` | `1` each | New `drawer-visit` hrefs match the live demos |
| New live-link E2E scenarios | `0` | `2` | Desktop + mobile href assertions |
| Persistent data / storage schema | — | — | No storage or catalog schema changes; no data-loss surface |

## Quick Re-Verification (60-Second Audit)

```bash
npm run typecheck && npm run test:unit && npx openspec validate portfolio-inspect-drag-audio-swell --strict
```

Expected output:

```text
> tsc --noEmit
...
Test Files  19 passed (19)
     Tests  201 passed (201)   # 199 passed | 2 skipped when dist/ is absent
...
Change 'portfolio-inspect-drag-audio-swell' is valid
```

To re-check the browser behavior only:

```bash
npx playwright test -g "canvas mirrors inspect and drag audio swell state|Sound toggle persists|mobile 3-dot menu hosts Sound"
```

Expected: `4 passed, 2 skipped` (desktop + mobile audio-swell, desktop sound persistence, mobile 3-dot menu).

To re-check the live demo links only:

```bash
npx vitest run src/data/projects.test.ts
npx playwright test -g "Transcribe Plus and Sandwave Sim drawers expose"
```

Expected: `12 passed` unit tests; `2 passed` E2E tests (desktop + mobile).
