## Executive Summary & Environment

- **Status**: All specs verified passing. `npm run typecheck`, `npm run build`, `npm run test:unit`, and the full Playwright desktop + mobile matrix pass; `openspec validate --strict` reports `valid: true` with zero issues.
- **Date**: 2026-11-13
- **Environment**: Linux (OpenCode worktree `vivid-gecko`), Node `v22.23.2`, npm `10.9.8`, Vitest `3.2.7`, Playwright `1.63` (`Desktop Chrome` + `Pixel 7`, DPR 2.625, coarse pointer).
- **Change root**: `openspec/changes/portfolio-mobile-polish`

## Requirement Adherence Audit Matrix

| Capability | Requirement & Scenario | Verification Method / Test | Status |
| :--- | :--- | :--- | :--- |
| `graph-simulation` | `### Requirement: Touch pointer cancellation cleanup` | `src/physics/graphSimulation.test.ts` → `cancels a drag with zero fling velocity and an unmoved home anchor`; `e2e/portfolio.spec.ts` → `pointercancel ends a drag cleanly and empty-canvas tap clears sticky focal` | **PASS** |
| `graph-simulation` | `#### Scenario: Touch drag interrupted by pointercancel` | Same E2E test: asserts `data-sim-state` leaves `drag` for `idle`, drag audio is zeroed in the handler, and a subsequent tap opens `project-drawer` | **PASS** |
| `graph-simulation` | `### Requirement: Mobile sheet upper-strip camera pan` | `e2e/portfolio.spec.ts` → `mobile sheet pans the selected node into the measured strip and snaps detents`; `data-selected-screen-y` is asserted between measured `headerBottom` and `sheetTop` | **PASS** |
| `graph-simulation` | `#### Scenario: User taps a node on mobile` | Same test: tapped node midpoint assertion (`< 30px` from measured strip midpoint) and `(0, 0)` return after close once semantic-nav focus is released | **PASS** |
| `graph-simulation` | `#### Scenario: Viewport resizes or rotates while sheet is open` | Same test: resizes `393×852 → 852×393`, then re-asserts the selected node remains inside the new measured strip | **PASS** |
| `graph-simulation` | `### Requirement: Coarse-pointer DPR cap and idle render budget` | `e2e/portfolio.spec.ts` → `coarse pointers cap DPR at 2 and idle ambient at 15fps`; asserts `data-render-dpr="2"` and 8–25 renders/second while idle | **PASS** |
| `graph-simulation` | `#### Scenario: High-DPR mobile device renders idle ambient drift` | Same test on Pixel 7 (`devicePixelRatio = 2.625`) verifies backing store uses `2` and timed idle frames, not display-rate rAF | **PASS** |
| `graph-simulation` | `### Requirement: Sticky inspected focal context and draggable inspector` (modified) | `e2e/portfolio.spec.ts` → `pointercancel...clears sticky focal`, `Reset clears the sticky inspected focus`, `desktop inspector drags from its border...` | **PASS** |
| `graph-simulation` | `#### Scenario: User closes the inspector` | `focal edge tag pills persist while the inspector is open` (desktop) and `pointercancel...` (mobile) | **PASS** |
| `graph-simulation` | `#### Scenario: Touch user taps empty canvas to clear sticky focus` | `pointercancel ends a drag cleanly and empty-canvas tap clears sticky focal`; `data-focal-tag-pills` drops to `0` after an empty-corner tap | **PASS** |
| `graph-simulation` | `#### Scenario: User drags the desktop inspector` | `desktop inspector drags from its border and stays inside the viewport`; cursor `move` and clamped geometry verified | **PASS** |
| `portfolio-controls` | `### Requirement: Top-right header navigation sequence and theme toggle` (modified) | `header controls follow the canonical top-right sequence`; `loads on desktop and mobile...`; `mobile header is a single row at 393...` | **PASS** |
| `portfolio-controls` | `#### Scenario: Desktop visitor views top-right header options` | Desktop project: visible order `About`, `GitHub ↗`, `Grid`, `Sound`, `Dark`, `...`; `Sound` exposes `aria-pressed` | **PASS** |
| `portfolio-controls` | `#### Scenario: Mobile visitor views top-right header options` | Mobile project: visible order `About`, `Grid`, `Dark`, `...`; `nav-github`/top-bar `audio-toggle` hidden; accent dot shows when sound is enabled | **PASS** |
| `portfolio-controls` | `#### Scenario: User opens the 3-dot menu and resets graph layout` | `mobile 3-dot menu hosts Sound, volume, and a reachable Reset`; `3-dot menu exposes one Reset...`; asserts `max-h-[calc(100dvh-5rem)]` + `overflow-y-auto` | **PASS** |
| `portfolio-controls` | `### Requirement: Sound volume popover and persisted gain` (modified) | `volume popover appears only while Sound is enabled...` (desktop); `mobile 3-dot menu hosts Sound, volume...` | **PASS** |
| `portfolio-controls` | `#### Scenario: User adjusts sound volume on hover-capable desktop` | Desktop popover test: vertical slider reflects persisted volume, updates gain, `0` keeps `aria-pressed="true"` | **PASS** |
| `portfolio-controls` | `#### Scenario: User adjusts sound and volume on mobile or coarse-hover tablet` | Mobile test: `mobile-audio-toggle` and `mobile-volume-slider` each `>= 44px`, value persists under `portfolio_sound_volume`; a canceled slider gesture preserves the value | **PASS** |
| `portfolio-controls` | `#### Scenario: User leaves the desktop volume control` | Desktop popover hides after `500ms`; turning Sound off hides it immediately | **PASS** |
| `project-drawer` | `### Requirement: Accessible project inspector drawer` (modified) | `mobile drawer opens at the Half detent with a slim sticky header`; `mobile sheet pans...snaps detents`; accessibility drawer tests (dark/light) | **PASS** |
| `project-drawer` | `#### Scenario: User opens the drawer on desktop` | Existing desktop anchored-drawer + accessibility tests; `>= 768px` keeps the floating card and header `Code ↗`/`Visit ↗` | **PASS** |
| `project-drawer` | `#### Scenario: User opens the drawer on mobile` | Mobile drawer test: `56dvh` Half default, `sheet-drag-handle`, sticky header `< 120px`, safe-area padding, body scrolling, actions in body | **PASS** |
| `project-drawer` | `#### Scenario: User drags the mobile sheet handle between detents` | Mobile detent test: Full `86dvh`, Peek `28dvh`, dismiss below `16dvh`; handle tracks the pointer 1:1 via `liveSheetHeightPx` | **PASS** |
| `project-drawer` | `#### Scenario: User closes the drawer` | `Escape closes the project drawer`, `deep link ... closing clears the hash`, backdrop tap in `#/about`/existing tests; focus return + camera reset verified | **PASS** |

## Resolved Assumptions & Empirical Proof

| Assumption from research.md | How Verified in Code/Tests | Result / Value | Volatility |
| :--- | :--- | :--- | :--- |
| `BOUNDARY_MARGIN = 48` may cause landscape node overlap at `852×393` / `667×375` | Phase 1 Playwright screenshot diagnostic across all five matrix viewports before implementation | No node-node overlap observed at `852×393`; all 8 labels/nodes remain inside the viewport. `src/physics/graphSimulation.ts` boundary constant was left unchanged. | stable |
| `GraphCanvas` lacks `onPointerCancel` | Read + implementation; E2E dispatch of `pointercancel` mid-drag | Added handler releases capture only if held, calls `dragEnd({ cancel: true })`, zeroes drag audio, clears `downPosRef`/`downNodeIdRef`/`lastDragPointRef` | stable |
| Unmodified `ProjectDrawer` uses `85dvh` sheet | E2E asserts `56dvh` Half default and 3 detents | `data-sheet-detent` reports `half`/`full`/`peek`; measured ratios `~0.56`/`~0.86`/`~0.28` | stable |
| DPR/ambient budget needs coarse-pointer gating | E2E `coarse pointers cap DPR at 2 and idle ambient at 15fps` | Pixel 7 DPR `2.625` renders at backing DPR `2`; idle frames 8–25/s (timed `15 fps`) | stable |
| Header can stay single-row once GitHub + Sound are removed on `< sm` | E2E `mobile header is a single row at 393...` | Header height at `393×852`: `88px → 60px`; no horizontal overflow; `320px` wraps without truncating the wordmark | stable |
| iOS Safari silent-switch, dynamic viewport, and real-device keyboard behavior | Deferred (not automatable on Linux Playwright) — documented in `tests.md` manual verification | Manual device check required | decays |

## Nomenclature & Code Symbol Audit

| Glossary Term | Final Code Identifier | Location / File | Verified Compliant? |
| :--- | :--- | :--- | :--- |
| `isSheet` | `computeIsSheet()` + `isSheet` state | `src/components/ProjectDrawer.tsx` | Yes |
| Sticky focal | `stickyFocalId` / `onClearFocal` | `src/App.tsx`, `src/components/GraphCanvas.tsx` | Yes |
| Empty-canvas tap guard | `downNodeIdRef`, `moved < 6`, `hitNode(...)` | `src/components/GraphCanvas.tsx` | Yes |
| Canceled drag | `dragEnd({ cancel: true })` | `src/physics/graphSimulation.ts` | Yes |
| Sheet detents | `sheetDetent: 'peek' \| 'half' \| 'full'`, `SHEET_DETENT_VH` | `src/components/ProjectDrawer.tsx` | Yes |
| Live sheet drag height | `liveSheetHeightPx`, `sheetDragRef` | `src/components/ProjectDrawer.tsx` | Yes |
| Effective DPR | `getEffectiveDpr()` | `src/components/GraphCanvas.tsx` | Yes |
| In-menu Sound | `mobile-audio-toggle`, `mobile-volume-slider` | `src/components/ControlsOverlay.tsx` | Yes |
| Camera target | `targetRef.current`, `goal.y = targetY - n.y * scale` | `src/components/GraphCanvas.tsx` | Yes |

## Landed Tech Footprint & Patterns

| Adopted Pattern / Package | Implementation File(s) | Verification Command / Suite |
| :--- | :--- | :--- |
| Dedicated `pointercancel`/canceled-drag path | `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx` | `vitest run src/physics/graphSimulation.test.ts`; mobile `pointercancel` E2E |
| Measured-geometry camera pan + sheet detents | `src/components/GraphCanvas.tsx`, `src/components/ProjectDrawer.tsx` | Mobile `mobile sheet pans...snaps detents` E2E |
| Coarse-pointer DPR cap + 15fps timed idle loop | `src/components/GraphCanvas.tsx` | Mobile `coarse pointers cap DPR...` E2E |
| Hybrid `< sm` / `(hover: none)` in-menu Sound, scrollable panel | `src/components/ControlsOverlay.tsx`, `src/styles.css` | Mobile `mobile 3-dot menu...` E2E; desktop popover E2E |
| Mobile 3-detent bottom sheet, slim sticky header, safe-area padding | `src/components/ProjectDrawer.tsx` | Mobile drawer/detent/matrix E2E |
| Empty-canvas sticky-focal clear | `src/App.tsx`, `src/components/GraphCanvas.tsx` | Mobile `pointercancel...clears sticky focal` E2E |

## Invalidated Hypotheses & Mid-Build Adjustments

| Original Belief | What Proved Wrong | Final Resolution | Rationale |
| :--- | :--- | :--- | :--- |
| Camera can pan using `height * 0.22` and a static detent | Landscape resize left the node above the measured strip while the sheet transition settled | Measure `headerBottom` + `sheetTop` continuously (ResizeObserver + resize/orientation listeners + 120ms poll) and set `goal.y = targetY - n.y * scale` | Fulfils the spec's measured-geometry requirement and survives CSS detent transitions |
| `hidden sm:inline-flex` removes `nav-github` on mobile | `.inline-flex` from the shared bare-text class compiled after `.hidden`, so the link stayed visible | Moved control visibility into source-ordered `.nav-github-link` / `.desktop-sound` / `.mobile-sound-row` CSS rules | Equal-specificity utilities depend on source order; explicit rules are deterministic |
| `62dvh` sheet from exploration notes | Adopted spec settled on **Half `56dvh`** with Peek/Full detents | Implemented `28/56/86dvh` plus `< 16dvh` dismiss and `< 120px` strip fallback | Matches the finalized `project-drawer` delta spec |
| A plain border-only drag would suffice on mobile | Handle needs 1:1 tracking without fighting inner scroll | Added dedicated `touch-none` `sheet-drag-handle` with pointer capture and velocity snapping | Prevented body-scroll/gesture conflicts |

## Implementation-Discovered Deferrals

- **Deferred Item**: Real iOS Safari silent-switch, dynamic viewport keyboard, and safe-area verification.
  - **Reason**: Not automatable in Linux Playwright; covered by the manual checklist in `tests.md`.
- **Deferred Item**: `openspec archive` / main-spec sync at merge time.
  - **Reason**: OpenSpec CLI `1.7.0` has no `openspec specs apply` command; delta specs are applied and archived by `openspec archive portfolio-mobile-polish` after review/merge, per the standard OpenSpec flow.
- **Deferred Item**: `BOUNDARY_MARGIN` landscape tuning.
  - **Reason**: Phase 1 diagnostic found no landscape node overlap; no conditional task was required.

## Empirical Execution Logs & Evidence

### Phase 1 baseline diagnostic (pre-implementation)

```text
393x852  coarse=true  dpr=3  canvas=1179x2556  header.bottom=88
852x393  coarse=true  dpr=3  canvas=2556x1179  header.bottom=44
375x667  coarse=true  dpr=3  canvas=1125x2001  header.bottom=88
320x568  coarse=true  dpr=3  canvas=960x1704   header.bottom=136
768x1024 coarse=false dpr=1  canvas=768x1024   header.bottom=44
```

`852×393` screenshot inspection: all 8 nodes (`OpenDungeon`, `Resume Builder`, `Climate Risk`, `Transcribe+`, `Sandwave`, `AttentionMax`, `Ivy Film Fest`, `Kintsugi 3D`) visible and non-overlapping. `BOUNDARY_MARGIN = 48` retained.

### Post-implementation geometry evidence

```text
393×852: header.bottom=60, sheet top=374.9, sheet height=477.1 (56dvh),
         sheet header=95px, selected node screen Y=214.6 vs strip midpoint=217.5
         backing DPR=2 (device DPR=2.625)
852×393: selected node screen Y inside measured strip after resize
320×568: Half strip=114px < 120px → Peek (28dvh) fallback
```

### Typecheck / build / unit

```text
$ npm run typecheck
> tsc --noEmit
(clean, exit 0)

$ npm run build
> tsc --noEmit -p tsconfig.build.json && vite build
✓ 1960 modules transformed.
✓ built in 3.30s

$ npm run test:unit
Test Files  17 passed (17)
     Tests  183 passed (183)
```

### E2E (desktop + mobile)

```text
$ npx playwright test
102 passed (2.9m)
36 skipped
```

Selected new mobile regressions (all passed):

```text
✓ mobile drawer opens at the Half detent with a slim sticky header
✓ mobile header is a single row at 393 and wraps without clipping at 320
✓ coarse pointers cap DPR at 2 and idle ambient at 15fps
✓ mobile 3-dot menu hosts Sound, volume, and a reachable Reset
✓ pointercancel ends a drag cleanly and empty-canvas tap clears sticky focal
✓ mobile sheet pans the selected node into the measured strip and snaps detents
✓ portrait, landscape, and tablet matrix stays reachable without overflow
```

### Data invariants

```text
$ grep -c "id: '" src/data/projects.ts
8
```

All 8 project ids remain: `open-dungeon`, `agentic-resume-builder`, `pict-climate-risk-viz-chatbot`, `transcribe-plus`, `sandwave-sim`, `attention-max`, `kintsugi-fracture`, `ivy-film-festival-2026`. No `src/data/*` file was modified.

### OpenSpec validation

```json
{
  "items": [
    {
      "id": "portfolio-mobile-polish",
      "type": "change",
      "valid": true,
      "issues": [],
      "durationMs": 7
    }
  ],
  "summary": { "totals": { "items": 1, "passed": 1, "failed": 0 } }
}
```

## Quick Re-Verification (60-Second Audit)

```bash
npm run typecheck
npm run test:unit
npx playwright test --project=mobile -g "mobile drawer opens|mobile header is|coarse pointers cap|mobile 3-dot|pointercancel|mobile sheet pans|portrait, landscape"
npx openspec validate portfolio-mobile-polish --strict --json
```

Expected output:

```text
tsc --noEmit: clean
Test Files  17 passed (17)
Tests       183 passed
~7 mobile tests passed
"valid": true, "issues": []
```
