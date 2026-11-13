## Automated Tests

- `npm run typecheck`: Verifies TypeScript types across `GraphSimulation`, `GraphCanvas`, `App`, `ControlsOverlay`, and `ProjectDrawer`.
- `npm run build`: Verifies Vite production bundle builds cleanly (`tsc --noEmit -p tsconfig.build.json && vite build`).
- `npm run test:unit`: Runs Vitest unit suites (`src/physics/graphSimulation.test.ts` + existing suites), including a new regression test verifying `dragEnd({ cancel: true })` exits `drag` state with zero fling velocity and unmoved `home` anchor.
- `npm run test:e2e`: Runs desktop and mobile (`Pixel 7`) Playwright E2E suites in `e2e/portfolio.spec.ts`, verifying:
  - **Mobile header (`< 640px`)**: `About`, `theme-toggle`, `view-toggle`, and `controls-dropdown-trigger` render cleanly; `nav-github` and desktop `audio-toggle` are hidden; `AboutModal` exposes `about-github`.
  - **In-menu mobile Sound & horizontal volume**: Opening `...` on mobile exposes `mobile-audio-toggle` (`>= 44px` height) and `mobile-volume-slider`, toggles `aria-pressed`, persists `portfolio_sound_volume` across touch drag, and handles canceled slider drags cleanly. Also verifies `Reset` remains reachable inside `#portfolio-controls` on short viewports (`568px`, `393px` height).
  - **Touch `pointercancel` recovery**: Dispatching `pointercancel` mid-drag on `graph-canvas` exits drag cleanly without fling and a subsequent tap opens `project-drawer`.
  - **Empty-canvas tap clears sticky focal**: Closing `project-drawer` on mobile retains focal highlight and returns camera to `(0, 0)`; tapping empty canvas (`downNodeId === null`) clears `stickyFocalId`.
  - **Draggable 3-detent sheet, slim header & measured upper-strip visibility**: Tapping a node on `393×852` opens `[data-testid="project-drawer"]` at Half detent (`~56dvh`) with `[data-testid="sheet-drag-handle"]` visible, a compact sticky header (`< 120px`), and the selected node visible above the sheet's top edge (and re-centered on resize/rotation); dragging the handle snaps to Full (`~86dvh`), Peek (`~28dvh`), or dismisses below `16dvh`.
  - **Portrait, landscape & iPad matrix**: Reachability, non-overlapping controls, and layout assertions across `393×852`, `852×393`, `375×667`, `320×568`, and `768×1024`.

## Manual Verification

- **iOS Safari real-device check**:
  - **WHEN** opening the portfolio on an iPhone with the hardware silent switch toggled off/on
  - **THEN** WebAudio plays as expected with silent switch off and volume slider responsiveness matches `portfolio_sound_volume`.
- **iOS Safari dynamic viewport, keyboard & safe-area check**:
  - **WHEN** opening `ProjectDrawer` on mobile, dragging between Peek/Half/Full, scrolling to the final Overview link, or focusing the `TerminalSimulator` input (triggering the on-screen keyboard / `visualViewport` resize)
  - **THEN** the sheet handle tracks 1:1 without inner-scroll fighting, `env(safe-area-inset-bottom)` keeps the bottom link clear of the home indicator, and the terminal input remains visible above the keyboard.
- **Orientation rotation check**:
  - **WHEN** rotating a phone between portrait and landscape
  - **THEN** all 8 graph nodes and header controls remain visible and interactive without clipping.
