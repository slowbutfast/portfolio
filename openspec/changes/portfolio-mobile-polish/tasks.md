## 1. Test Scaffolding (TDD)

- [x] 1.1 Run baseline Playwright mobile/landscape diagnostic check across `393×852`, `852×393`, `375×667`, `320×568`, and `768×1024` to confirm whether `BOUNDARY_MARGIN = 48` causes landscape node overlap (if overlap is observed, add a conditional follow-up task to adjust landscape boundary margin/layout)
- [x] 1.2 Scaffold failing unit test in `src/physics/graphSimulation.test.ts` for `dragEnd({ cancel: true })` (zero fling velocity, unmoved `home`) and failing E2E tests in `e2e/portfolio.spec.ts` for touch `pointercancel` mid-drag recovery and empty-canvas tap (`downNodeId === null`) clearing `stickyFocalId`
- [x] 1.3 Scaffold failing E2E tests in `e2e/portfolio.spec.ts` for mobile header (`About · Dark/Light · Grid/Graph · ...`, no `nav-github` or top-bar `audio-toggle`), `mobile-audio-toggle` + `mobile-volume-slider` (including touch drag & cancel) inside scrollable `#portfolio-controls` with `Reset` reachable, and `about-github` in `AboutModal`
- [x] 1.4 Scaffold failing E2E tests in `e2e/portfolio.spec.ts` for `ProjectDrawer` Half (`56dvh`) default detent, `sheet-drag-handle` snapping (`86dvh` Full, `28dvh` Peek, `< 16dvh` dismiss), slim mobile sticky header, measured upper-strip camera pan (including resize/rotation and `(0, 0)` return on close), and `393×852` / `852×393` / `375×667` / `320×568` / `768×1024` reachability checks

## 2. Graph Interaction, Camera Pan & Power Efficiency

- [x] 2.1 Add `onClearFocal?: () => void` prop to `src/components/GraphCanvas.tsx`, wire `clearStickyFocal` from `src/App.tsx`, record `downNodeIdRef` in `onPointerDown`, and invoke `onClearFocal` in `onPointerUp` only when `downNodeIdRef.current === null && moved < 6 && !hitNode(p.x, p.y)`
- [x] 2.2 Add `cancel?: boolean` option to `dragEnd` in `src/physics/graphSimulation.ts` (zeroing `vx/vy` without fling or `home` commit), and bind `onPointerCancel` on `<canvas>` in `src/components/GraphCanvas.tsx` (releasing pointer capture only if held, calling `sim.dragEnd({ cancel: true })`, zeroing drag audio velocity, and clearing `downPosRef`, `downNodeIdRef`, `lastDragPointRef`)
- [x] 2.3 Update the camera-target `useEffect` (and `resize` handler) in `src/components/GraphCanvas.tsx` to pan using measured `headerBottom`, `sheetTop`, and `scale` (`goal.y = targetY - n.y * scale`) when `initialSelectedId` is active (with `< 120px` minimum-strip fallback to Peek detent, returning to `(0, 0)` on close even while `stickyFocalId` persists)
- [x] 2.4 Cap canvas DPR at `2` (`getEffectiveDpr()`) and schedule `idleAmbientOnly` redraws on `(pointer: coarse)` via a `15 fps` (`66.7 ms`) `setTimeout` instead of spinning `requestAnimationFrame` at display refresh rate in `src/components/GraphCanvas.tsx`
- [x] 2.5 Dismiss `stickyFocalId` on a clean tap/click of the already-focused node while the inspector is closed, reopen the drawer on the next tap, and open a different node immediately; cover the tap policy with a unit test and the full click → inspect → close → clear → reopen cycle with E2E tests on desktop and mobile

## 3. Single-Row Mobile Header & In-Menu Sound

- [x] 3.1 Update `src/components/ControlsOverlay.tsx` to tighten mobile header spacing (`gap-x-3 sm:gap-x-4 md:gap-x-6`), hide `nav-github` on `< sm` (`hidden sm:inline-flex`), hide desktop `Sound` + `volume-popover` on `< sm` or `(hover: none)`, and show a `6px` `--color-accent` dot on `controls-dropdown-trigger` when sound is enabled in that mode
- [x] 3.2 Add the Sound toggle (`data-testid="mobile-audio-toggle"`, `min-h-11`) and horizontal volume slider (`data-testid="mobile-volume-slider"`) inside `#portfolio-controls` for `< sm` or `(hover: none)` (with `max-h-[calc(100dvh-5rem)] overflow-y-auto` so `Reset` remains reachable) in `src/components/ControlsOverlay.tsx`
- [x] 3.3 Add `touch-action: none;` to `.volume-slider` and define `.volume-slider-horizontal` (`height: 2.75rem`, `touch-action: none`) in `src/styles.css`

## 4. Bottom Sheet Ergonomics & Detent Drag

- [x] 4.1 Update `isSheet` in `src/components/ProjectDrawer.tsx` to `width < 768 || (isCoarse && height < 500)` and guard `updateBorderCursor` with `if (isSheet) return;` so sheets never display `cursor: move`
- [x] 4.2 Add `sheetDetent` (`'peek' | 'half' | 'full'` at `28`/`56`/`86dvh`, default `'half'`) and `liveSheetHeightPx` state to `src/components/ProjectDrawer.tsx`, plus the `touch-none` `data-testid="sheet-drag-handle"` bar with velocity/threshold detent snapping and `< 16dvh` dismiss
- [x] 4.3 Slim the mobile sticky `<header>` in `src/components/ProjectDrawer.tsx` to `[handle] + index badge + title + Close` (`hidden md:block` for `summary` and `Code`/`Visit` in `<header>`, rendered in the scrollable body for `md:hidden`), and add `pb-[calc(1rem+env(safe-area-inset-bottom,0px))]` to the scrollable body

## 5. Verification & Empirical Audit

- [x] 5.1 Run `npm run typecheck`, `npm run build`, `npm test` (`npm run test:unit && npm run test:e2e`), and `npx openspec validate portfolio-mobile-polish` to verify clean passes across desktop and mobile suites
- [x] 5.2 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions (including Phase 1 landscape `BOUNDARY_MARGIN` finding), and verbatim execution logs
