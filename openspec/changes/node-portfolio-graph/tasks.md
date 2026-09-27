## 1. Test Scaffolding (TDD)

- [ ] 1.1 Write failing headless physics unit test in `src/physics/graphSimulation.test.ts` verifying node clearance >= 60px, boundary containment, and OD centroid freedom across 1440x900 and 390x844.
- [ ] 1.2 Write failing topology unit test in `src/utils/graphTopology.test.ts` verifying the exact 9 pinned edges derived from paradigm tags.
- [ ] 1.3 Write failing terminal command resolver test in `src/utils/terminalCommandResolver.test.ts` verifying per-project command execution, exit codes, and unknown command 127.
- [ ] 1.4 Write failing project catalog contract test in `src/data/projects.test.ts` verifying unique IDs, public asset file existence, and command resolution.
- [ ] 1.5 Scaffold Playwright smoke test in `e2e/portfolio.spec.ts` for desktop/mobile load, `data-dimmed` tag filter, list view toggle, and deep link navigation.

## 2. Project Data, Asset Capture & Topology Engine

- [ ] 2.1 Implement `scripts/capture-demos.sh` to copy `clip.mp4` from sibling repo to `public/assets/clip.mp4`, capture real test suite outputs into `src/data/captured/`, and save project screenshots into `public/assets/screenshots/`.
- [ ] 2.2 Implement `src/types/portfolio.ts` with `ProjectData`, `Preview` union, `TerminalDemo`, `ParadigmTag`, and `GraphNode`.
- [ ] 2.3 Implement `src/data/projects.ts` with the 6 verified projects using `satisfies ProjectData[]`.
- [ ] 2.4 Implement `src/utils/graphTopology.ts` deriving edges from shared `ParadigmTag` items, making unit tests pass.
- [ ] 2.5 Implement `src/utils/terminalCommandResolver.ts` resolving per-project commands and exit codes, making unit tests pass.

## 3. Physics Simulation & High-DPI Canvas

- [ ] 3.1 Implement `src/physics/graphSimulation.ts` using `d3-force` with weak centering (0.035), adaptive charge, soft link springs (0.05), boundary damping, and dynamic velocity decay (0.4 / 0.18).
- [ ] 3.2 Implement `GraphCanvas` in `src/components/GraphCanvas.tsx` with high-DPI scaling, ResizeObserver re-centering, 2D view transform, inverse hit testing, and pointer state machine (`idle -> hover -> drag -> coasting`).
- [ ] 3.3 Implement accessible focus mirroring on the canvas (focus ring and camera pan) when tabbing through semantic DOM links.
- [ ] 3.4 Implement `prefers-reduced-motion` detection and static ring fallback layout.

## 4. Project Drawer, Media Player & Terminal Simulator

- [ ] 4.1 Implement `src/components/TerminalSimulator.tsx` with dynamic command chips from active project, history navigation, and status-tag highlighter.
- [ ] 4.2 Implement `src/components/MediaView.tsx` supporting HTML5 video player (`clip.mp4`) and high-resolution screenshot cards.
- [ ] 4.3 Implement `src/components/ProjectDrawer.tsx` with `aria-modal="true"`, focus trap, Escape to close, focus return, and mobile bottom sheet styling.

## 5. Controls HUD, List View & App Integration

- [ ] 5.1 Implement `src/components/ControlsOverlay.tsx` with Graph/List view toggle, paradigm tag pills (OR-combined), search bar, and view reset.
- [ ] 5.2 Implement `src/components/ListView.tsx` as a responsive card grid alternative for instant scanning.
- [ ] 5.3 Assemble `src/App.tsx` coordinating layout, URL hash deep linking (`#/p/:id`), `data-dimmed` tag/search attributes, and hidden semantic `<nav aria-label="Projects">`.
- [ ] 5.4 Configure `vercel.json` with SPA routing rewrite and clean URL handling.

## 6. Verification & Empirical Audit

- [ ] 6.1 Run full regression test suite (`npm run test:unit && npm run test:e2e`), verify clean passes, and check for regressions.
- [ ] 6.2 Run `npm run typecheck && npm run build` to confirm zero compiler errors and production asset bundle under 120KB gzipped.
- [ ] 6.3 Populate `verification.md` with Requirement Adherence Audit Matrix, resolved assumptions, and verbatim execution logs.
