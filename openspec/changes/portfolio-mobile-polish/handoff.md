# OpenCode Orchestration Handoff: OpenSpec Change 'portfolio-mobile-polish'

You are the orchestration agent for OpenSpec change `portfolio-mobile-polish` running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: `portfolio-mobile-polish`
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub portfolio-mobile-polish`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between feature compartments and avoid horizontal abstractions.

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/physics/graphSimulation.ts` | `L72`, `L560-595` | Add `dragEnd(options?: { cancel?: boolean })` to exit `drag` state with zero `vx/vy` without computing fling velocity or committing `home` when `cancel` is true. |
| `src/physics/graphSimulation.test.ts` | Unit tests | Add regression test verifying `dragEnd({ cancel: true })` exits `drag` state with zero fling velocity and unmoved `home` anchor. |
| `src/components/GraphCanvas.tsx` | `L45-55`, `L275-285`, `L348-355`, `L723-736`, `L773-795`, `L870-886`, `L911-917`, `L1125-1197` | Add `onClearFocal?: () => void`; record `downNodeIdRef` on `pointerdown` and call `onClearFocal` on `pointerup` only when `downNodeIdRef.current === null && moved < 6 && !hitNode`; add `onPointerCancel` calling `sim.dragEnd({ cancel: true })`, releasing capture only if held, zeroing audio drag velocity, and clearing gesture refs; cap DPR at `2` and schedule `idleAmbientOnly` via `15 fps` `setTimeout` (`66.7 ms`) on `(pointer: coarse)`; pan camera using measured `headerBottom`, `sheetTop`, and `scale` (`goal.y = targetY - n.y * scale`) on sheet viewports, recomputing on `resize` and returning to `(0, 0)` on close. |
| `src/App.tsx` | `L295-302`, `L360-375` | Pass `onClearFocal={clearStickyFocal}` to `<GraphCanvas />`. |
| `src/components/ControlsOverlay.tsx` | `L145-239`, `L240-312` | Tighten mobile gap (`gap-x-3 sm:gap-x-4 md:gap-x-6`); hide `nav-github` on `< sm`; hide desktop `Sound` + `volume-popover` on `< sm` or `(hover: none)`; render a `6px` `--color-accent` dot on `controls-dropdown-trigger` when sound is enabled in in-menu mode; render `mobile-audio-toggle` (`min-h-11`) + horizontal `mobile-volume-slider` inside `#portfolio-controls` with `max-h-[calc(100dvh-5rem)] overflow-y-auto`. |
| `src/styles.css` | `L115-124` | Add `touch-action: none;` to `.volume-slider` and define `.volume-slider-horizontal` (`height: 2.75rem`, `touch-action: none`). |
| `src/components/ProjectDrawer.tsx` | `L69-85`, `L311-319`, `L345-352`, `L395-498`, `L549-583` | Set `isSheet` to `width < 768 \|\| (isCoarse && height < 500)`; guard `updateBorderCursor` when `isSheet`; implement 3-detent (`28dvh` Peek / `56dvh` Half default / `86dvh` Full, `< 16dvh` dismiss) `sheet-drag-handle` with `< 120px` strip fallback to Peek; slim mobile sticky `<header>` to `[handle] + index + title + Close` (moving `summary` and `Code`/`Visit` into the scrollable body); add `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]`. |
| `e2e/portfolio.spec.ts` | Mobile & desktop suites | Update mobile header expectations (`About · Dark/Light · Grid/Graph · ...`, `mobile-audio-toggle` + `mobile-volume-slider` in `#portfolio-controls`, `about-github` in `AboutModal`); add `pointercancel` recovery, empty-tap `stickyFocalId` clear, 3-detent sheet drag, measured camera pan + resize + `(0, 0)` return, and `393×852` / `852×393` / `375×667` / `320×568` / `768×1024` matrix tests. |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Dedicated `dragEnd({ cancel: true })` path (never fling or commit `home` on `pointercancel`).
  - Empty-canvas tap guard requires `downNodeIdRef.current === null && moved < 6 && !hitNode(p.x, p.y)`.
  - Measured-geometry camera pan (`targetY = headerBottom + (sheetTop - headerBottom) / 2`, `goal.y = targetY - n.y * scale`, `< 120px` strip fallback to Peek `28dvh`).
  - Timed `15 fps` (`setTimeout(..., 1000 / 15)`) idle scheduling on `(pointer: coarse)` instead of spinning `requestAnimationFrame` at display refresh rate.
  - Hybrid `< sm` / `< md` + `(hover: none)` / `(pointer: coarse)` gating for in-menu Sound and landscape-phone sheet mode.
  - Scrollable `#portfolio-controls` (`max-h-[calc(100dvh-5rem)] overflow-y-auto`).
- **Hard Exclusions / No-Go**:
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies (no external gesture libraries).
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage (Phase 1 spike determines whether `BOUNDARY_MARGIN = 48` needs a conditional task).

## 4. Visual & UI Design Specifications
- **Theme**: Ferrofluid Editorial Drafting (Mobile Polish) — reuses `var(--color-bg)`, `var(--color-surface)`, `var(--color-text)`, `var(--color-muted)`, `var(--color-accent)`, `var(--color-outline)`, `var(--color-divider)`.
- **Component Anatomy & States**:
  - Mobile top bar (`< 640px`): single row at `>= 360px` (`Gregory Lazatin` left; `About · Dark/Light · Grid/Graph · ...` right), wrapping gracefully at `320px` without truncating the wordmark; `6px` `--color-accent` dot on `controls-dropdown-trigger` when sound is enabled in in-menu mode.
  - In-menu Sound & Volume (`< sm` or `(hover: none)`): `mobile-audio-toggle` (`fluid-pill min-h-11`, `aria-pressed`) + horizontal `mobile-volume-slider` (`height: 2.75rem`, `touch-action: none`).
  - Mobile Bottom Sheet (`isSheet`): 3 detents (`28dvh` Peek / `56dvh` Half default / `86dvh` Full, `< 16dvh` dismiss), `sheet-drag-handle` (`touch-none`, `min-h-8`, `h-1 w-10 rounded-full`), slim sticky `<header>` (`[handle] + index + title + Close`), scrollable body (`summary`, `Code`/`Visit`, tags, tabs, overview) with `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]`, and `drawer-backdrop` tap-to-close active across all detents.
- **Responsive Layout**: Touch targets `>= 44px` (`min-h-11`); `(pointer: coarse)` DPR capped at `2` and `15 fps` timed ambient drift.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runner**:
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:unit` (`vitest run`)
  - `npm run test:e2e` (`playwright test`)
  - `npm test` (`npm run test:unit && npm run test:e2e`)
- **TDD Requirement**: Task group `## 1` MUST run the Phase 1 diagnostic spike and scaffold failing unit/E2E tests before touching implementation code. Verify they fail initially.

## 6. Implementation Task Checklist
- [ ] 1.1 Run baseline Playwright mobile/landscape diagnostic check across `393×852`, `852×393`, `375×667`, `320×568`, and `768×1024` to confirm whether `BOUNDARY_MARGIN = 48` causes landscape node overlap (if overlap is observed, add a conditional follow-up task to adjust landscape boundary margin/layout)
- [ ] 1.2 Scaffold failing unit test in `src/physics/graphSimulation.test.ts` for `dragEnd({ cancel: true })` (zero fling velocity, unmoved `home`) and failing E2E tests in `e2e/portfolio.spec.ts` for touch `pointercancel` mid-drag recovery and empty-canvas tap (`downNodeId === null`) clearing `stickyFocalId`
- [ ] 1.3 Scaffold failing E2E tests in `e2e/portfolio.spec.ts` for mobile header (`About · Dark/Light · Grid/Graph · ...`, no `nav-github` or top-bar `audio-toggle`), `mobile-audio-toggle` + `mobile-volume-slider` (including touch drag & cancel) inside scrollable `#portfolio-controls` with `Reset` reachable, and `about-github` in `AboutModal`
- [ ] 1.4 Scaffold failing E2E tests in `e2e/portfolio.spec.ts` for `ProjectDrawer` Half (`56dvh`) default detent, `sheet-drag-handle` snapping (`86dvh` Full, `28dvh` Peek, `< 16dvh` dismiss), slim mobile sticky header, measured upper-strip camera pan (including resize/rotation and `(0, 0)` return on close), and `393×852` / `852×393` / `375×667` / `320×568` / `768×1024` reachability checks
- [ ] 2.1 Add `onClearFocal?: () => void` prop to `src/components/GraphCanvas.tsx`, wire `clearStickyFocal` from `src/App.tsx`, record `downNodeIdRef` in `onPointerDown`, and invoke `onClearFocal` in `onPointerUp` only when `downNodeIdRef.current === null && moved < 6 && !hitNode(p.x, p.y)`
- [ ] 2.2 Add `cancel?: boolean` option to `dragEnd` in `src/physics/graphSimulation.ts` (zeroing `vx/vy` without fling or `home` commit), and bind `onPointerCancel` on `<canvas>` in `src/components/GraphCanvas.tsx` (releasing pointer capture only if held, calling `sim.dragEnd({ cancel: true })`, zeroing drag audio velocity, and clearing `downPosRef`, `downNodeIdRef`, `lastDragPointRef`)
- [ ] 2.3 Update the camera-target `useEffect` (and `resize` handler) in `src/components/GraphCanvas.tsx` to pan using measured `headerBottom`, `sheetTop`, and `scale` (`goal.y = targetY - n.y * scale`) when `initialSelectedId` is active (with `< 120px` minimum-strip fallback to Peek detent, returning to `(0, 0)` on close even while `stickyFocalId` persists)
- [ ] 2.4 Cap canvas DPR at `2` (`getEffectiveDpr()`) and schedule `idleAmbientOnly` redraws on `(pointer: coarse)` via a `15 fps` (`66.7 ms`) `setTimeout` instead of spinning `requestAnimationFrame` at display refresh rate in `src/components/GraphCanvas.tsx`
- [ ] 3.1 Update `src/components/ControlsOverlay.tsx` to tighten mobile header spacing (`gap-x-3 sm:gap-x-4 md:gap-x-6`), hide `nav-github` on `< sm` (`hidden sm:inline-flex`), hide desktop `Sound` + `volume-popover` on `< sm` or `(hover: none)`, and show a `6px` `--color-accent` dot on `controls-dropdown-trigger` when sound is enabled in that mode
- [ ] 3.2 Add the Sound toggle (`data-testid="mobile-audio-toggle"`, `min-h-11`) and horizontal volume slider (`data-testid="mobile-volume-slider"`) inside `#portfolio-controls` for `< sm` or `(hover: none)` (with `max-h-[calc(100dvh-5rem)] overflow-y-auto` so `Reset` remains reachable) in `src/components/ControlsOverlay.tsx`
- [ ] 3.3 Add `touch-action: none;` to `.volume-slider` and define `.volume-slider-horizontal` (`height: 2.75rem`, `touch-action: none`) in `src/styles.css`
- [ ] 4.1 Update `isSheet` in `src/components/ProjectDrawer.tsx` to `width < 768 || (isCoarse && height < 500)` and guard `updateBorderCursor` with `if (isSheet) return;` so sheets never display `cursor: move`
- [ ] 4.2 Add `sheetDetent` (`'peek' | 'half' | 'full'` at `28`/`56`/`86dvh`, default `'half'`) and `liveSheetHeightPx` state to `src/components/ProjectDrawer.tsx`, plus the `touch-none` `data-testid="sheet-drag-handle"` bar with velocity/threshold detent snapping and `< 16dvh` dismiss
- [ ] 4.3 Slim the mobile sticky `<header>` in `src/components/ProjectDrawer.tsx` to `[handle] + index badge + title + Close` (`hidden md:block` for `summary` and `Code`/`Visit` in `<header>`, rendered in the scrollable body for `md:hidden`), and add `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` to the scrollable body
- [ ] 5.1 Run `npm run typecheck`, `npm run build`, `npm test` (`npm run test:unit && npm run test:e2e`), and `npx openspec validate portfolio-mobile-polish` to verify clean passes across desktop and mobile suites
- [ ] 5.2 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions (including Phase 1 landscape `BOUNDARY_MARGIN` finding), and verbatim execution logs

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm all 8 project nodes and catalog entries remain intact.
3. Ensure `openspec/changes/portfolio-mobile-polish/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.
5. If clean with no critical issues, sync specs: `openspec specs apply --change "portfolio-mobile-polish"`.
6. **Open a Pull Request**: Once implementation is complete and `verification.md` is written and verified with zero critical issues:
   - Ensure your work is on a dedicated feature branch (`feat/portfolio-mobile-polish`).
   - Stage and commit the implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` and report the PR URL.
