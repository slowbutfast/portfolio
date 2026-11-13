## 1. Test Scaffolding (TDD)

- [x] 1.1 Write failing unit tests in `src/utils/bridgeGeometry.test.ts` for `REST_WAIST_RATIO` (`0.58`) concave rest silhouettes (`waistWidth < 2 * averageHalf`, `handleForWaist > 0`), short-gap `baseHandle` $C^1$ bounds, and `1.6x` stretch cinching
- [x] 1.2 Write failing unit tests in `src/physics/graphSimulation.test.ts` for deterministic decoupled drag (`20` fixed `sim.tick()` steps over a `160px` `dragMove` -> `< 15px` neighbor displacement), persistent user pinning (`fx/fy` retained after `dragEnd` and proportionally clamped on `resize()`), `resetLayout()`, `1.6x`/`1.25x` snap & reconnect hysteresis, `350ms` post-release cooldown, `220ms` recoil progress, and `393x852` mobile snap reachability
- [x] 1.3 Write failing Playwright E2E tests for 3-dot controls menu (`"Filters"` heading inside dropdown, `"Reset layout"` button), `200ms` unified hover dwell & drag/coasting suppression, and peripheral `NodeHoverCard` placement

## 2. Stage 1: Rest Hourglass Silhouettes & Decoupled Drag

- [x] 2.1 Update `src/utils/bridgeGeometry.ts` with wider perimeter attachment spread (`HALF_WIDTH_RATIO = 0.85`, `MAX_SPREAD_ANGLE = Math.PI / 6.2`) and `REST_WAIST_RATIO = 0.58` so rest bridges form concave $C^1$ hourglass fillets
- [x] 2.2 Update `drawFluidBridge` in `src/components/GraphCanvas.tsx` to use axis-aligned `createLinearGradient` blending endpoint node colors (`tokens.accent` / `tokens.nodeVisited` / `tokens.nodeUnvisited`) smoothly through `tokens.connection`
- [x] 2.3 Update `src/physics/graphSimulation.ts` to explicitly refresh `forceLink.strength` on `dragStart` and `dragEnd` (zeroing strength on `dragNode` links during `drag`), persist user-placed `fx/fy` coordinates on `dragEnd`, proportionally scale/clamp pinned `fx/fy` on `resize()`, apply viscous coasting damping, and implement `resetLayout()`

## 3. Stage 2: Snap Recoil, Cooldown & Proximity-Only Bridges

- [x] 3.1 Update `SNAP_MULTIPLIER` (`1.6`) and `RECONNECT_MULTIPLIER` (`1.25`) in `src/physics/graphSimulation.ts` with `recoilProgress` (`220ms`) and `reconnectCooldownUntil` (`350ms` post-`dragEnd`) on `BridgeLinkState`
- [x] 3.2 Render retracting droplet recoil tips for snapped bridges and add the deterministic sorted-pair non-edge-only zero-force proximity bridge pass (`PROXIMITY_MAX_DIST = 96px`) underneath permanent bridges and nodes in `src/components/GraphCanvas.tsx`

## 4. Stage 3: Unified Hover Dwell, Peripheral Card & 3-Dot Controls Menu

- [x] 4.1 Add a unified `200ms` `hoverDwellTimer` in `src/components/GraphCanvas.tsx` gating both `sim.hover` and `emitHover`, with synchronous cancellation on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, `reduceMotion`, and `coasting`
- [x] 4.2 Replace snappy `hoverAttraction` in `src/physics/graphSimulation.ts` with a slow ramped drift (`0 -> 0.025`) outside a `110px` soft radial exclusion zone around the hovered node
- [x] 4.3 Update `src/components/NodeHoverCard.tsx` and `src/App.tsx` to measure actual card bounds via `ResizeObserver` and anchor peripherally outward from the canvas center with viewport + safe-area clamping
- [x] 4.4 Update `src/components/ControlsOverlay.tsx`, `src/App.tsx`, and `src/components/GraphCanvas.tsx` to replace the `"Filters"` button with a 3-dot trigger (`data-testid="controls-dropdown-trigger"`), move the `"Filters"` title inside the dropdown, and wire `"Reset layout"` (`data-testid="reset-layout"`) via `layoutResetVersion` in `App.tsx` to `simRef.current?.resetLayout()` + `wakeRef.current()`

## 5. Verification & Empirical Audit

- [x] 5.1 Run `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, and `npx openspec validate --changes`, verifying clean passes and capturing desktop (`1440x900`) and mobile (`393x852`) visual checks
- [x] 5.2 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs

## 6. PATCH-01: Organic Curvature, Render-Clock Recoil & Soft Anchors

- [x] P01.1 Scaffold reproducing tests for non-negative control-point offsets, force-isolated drag (`< 15px` / `< 12px` follow-through without neighbor `fx/fy`), soft `home` settling, render-clock recoil/cooldown, live reduced-motion transitions, and ambient-offset planarity; confirm failure first
- [x] P01.2 Replace the radius-capped bridge handle with gap-proportional handle-first geometry, monotone spread bisection, and the non-negative control-point guard
- [x] P01.3 Replace hard user pins and neighbor freezing with soft `home` springs, isolated charge/collision footprint during drag, viscous pointer lag, and `performance.now()` recoil/cooldown timestamps plus reconnect ripple
- [x] P01.4 Add render-clock teardrop recoil, smoothstep proximity fade, visual-only ~30fps ambient drift shared with hit testing, bidirectional reduced-motion transitions, hoisted sorted ids, and measured `canvasCenter`
- [x] P01.5 Sync specs, run the full verification suite, update `verification.md`, resolve `PATCH-01` in `patch.md`, and push to PR #12

## Patch 02: UI Polish, Node-Hover Crosshair, Active-Pair Edge Filtering, Focal Edge Tag Pills & Grid Layout

- [x] P02.1 Scaffold/update failing Playwright E2E / unit tests in `e2e/portfolio.spec.ts` for singular `"Reset"` (clearing filters, layout, and visited node colors), node-hover-only crosshair cursor, active-pair (`||`) edge dimming, and Grid card header/subtitle hierarchy
- [x] P02.2 Update `src/components/ControlsOverlay.tsx` (`L1`, `L201-L222`) and `src/App.tsx` (`L51`, `L249-L253`, `L283`) to remove the duplicate undo `"Reset"` button and wire the singular `"Reset"` button (`data-testid="reset-layout"`) to reset filters, layout, and `visitedIds`
- [x] P02.3 Update `src/styles.css` (`L111-L113`) and `src/components/GraphCanvas.tsx` (`L418`, `L455-L465`, `L910-L970`) for node-hover-only `'crosshair'` cursor, strict active-pair (`||`) edge dimming, and focal-only (`isFocal && !isDim`) 1–3 stacked shared-tag pills
- [x] P02.4 Update `src/components/ListView.tsx` (`L70-L72`, `L103-L121`), `src/components/NodeHoverCard.tsx` (`L65-L69`), and `DESIGN.md` (`L166-L167`, `L209`, `L236-L237`, `L258`) to remove `[CLI Specimen]` and move Grid `title` inline right of `01` with `summary` directly below; append updated media list to GitHub Issue `#9` (`gh issue comment 9`)
- [x] P02.5 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`, update `verification.md`, and mark `PATCH-02` `RESOLVED` in `patch.md`

## Patch 03: Contiguous Edge Tags, Inspector Persistence, Kintsugi Cleanup & 250ms Dwell

- [x] P03.1 Update edge tag rendering to stack 1–3 shared tags with no inter-row spacing inside one rounded rectangle, and keep focal tags active while the inspector selection is open
- [x] P03.2 Remove the terminal placeholder from linkout-only hover cards (Kintsugi/Ivy) and raise the unified hover dwell to `250ms`
- [x] P03.3 Update E2E coverage for 250ms dwell and inspector tag persistence, then run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`
- [x] P03.4 Update graph-simulation specs, `design.md`, `tests.md`, `DESIGN.md`, `verification.md`, and mark `PATCH-03` `RESOLVED` in `patch.md`

## Patch 04: Vertical Sound Volume Slider Popover

- [x] P04.1 Scaffold failing unit tests in `src/audio/ambientSynth.test.ts` (`getVolume`/`setVolume`, `[0, 1]` clamping, `portfolio_sound_volume` persistence, `master.gain` scaling, `0` volume keeping `enabled === true`) and failing Playwright E2E tests in `e2e/portfolio.spec.ts` (hidden when sound off, opens on hover when sound enabled, adjusts volume, auto-hides ~`500ms` after `pointerleave`)
- [x] P04.2 Update `src/audio/audioConstants.ts` (`L18-L23`) and `src/audio/ambientSynth.ts` (`L110-L130`, `L344-L382`) to persist `volume` (`[0, 1]`, default `1`) and scale `master.gain` by `this.volume * MASTER_GAIN`
- [x] P04.3 Update `src/components/ControlsOverlay.tsx` (`L8-L22`, `L116-L129`), `src/App.tsx` (`L55-L58`, `L264-L289`), and `src/styles.css` to wire `soundVolume`/`onVolumeChange` and render the `500ms` auto-hiding vertical volume popover (`data-testid="volume-popover"`, `data-testid="volume-slider"`)
- [x] P04.4 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`, update `verification.md`, and mark `PATCH-04` `RESOLVED` in `patch.md`

## Patch 05A: Edge Tag Line Spacing 1.15

- [x] P05A.1 Set connection-tag row pitch to 1.15 line spacing (`13.8px`) inside the contiguous rounded rectangle and document it in `DESIGN.md`
- [x] P05A.2 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`, update `verification.md`, and mark `PATCH-05A` `RESOLVED`

## Patch 05: Collision-Aware Popups & Sticky Inspected Connections

- [x] P05.1 Scaffold failing unit tests in `src/utils/popoverPlacement.test.ts` (8-candidate scoring, heavy node-overlap penalty, `3x` focal-edge intersection penalty, viewport/top-margin clamping) and failing Playwright E2E tests in `e2e/portfolio.spec.ts` (`stickyFocalId` persists after closing `ProjectDrawer`, clears when `250ms` hover dwell activates on any node including the same node, clears on `Reset`, and desktop `ProjectDrawer` drags cleanly via its corner/header handle)
- [x] P05.2 Create `src/utils/popoverPlacement.ts` implementing `chooseBestPopoverPosition` with circle-rect overlap and Liang-Barsky segment-AABB intersection
- [x] P05.3 Update `src/components/GraphCanvas.tsx` (`L22-L29`, `L398-L419`, `L535-L575`), `src/components/NodeHoverCard.tsx` (`L5-L12`, `L51-L86`), `src/components/ProjectDrawer.tsx` (`L16-L20`, `L125-L143`, header/corner drag handle), and `src/App.tsx` (`L48-L56`, `L200-L221`, `L260-L266`, `L305-L375`) to emit live screen-space obstacle snapshots, place both popups via `chooseBestPopoverPosition`, make desktop `ProjectDrawer` draggable with a hover `Move`/grab corner cue, and manage `stickyFocalId`
- [x] P05.4 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes`, update `verification.md`, and mark `PATCH-05` `RESOLVED` in `patch.md`

## Patch 06: Mid-Drag Reduced-Motion Guard, Frame-Clock Drag Follower, 30fps Idle Throttle & Spec Sync

- [x] P06.1 Scaffold failing tests in `src/physics/graphSimulation.test.ts` (frame-clock `dragTarget` converges smoothly across `sim.tick()` even without repeated `dragMove` calls) and `e2e/portfolio.spec.ts` (toggling `prefers-reduced-motion` on mid-drag -> releasing -> toggling off leaves `sim` cleanly idle/unpinned)
- [x] P06.2 Update `src/components/GraphCanvas.tsx` (`L618-L645`, `L690-L718`, `L1121-L1132`) to finalize active drag on reduced-motion transition & `pointerup`, throttle idle ambient `render()` calls to ~30 fps (`>= 33ms`), and hoist per-frame allocations
- [x] P06.3 Update `src/physics/graphSimulation.ts` (`L460-L470`, `L542-L561`) to store `dragTarget` in `dragMove` and advance the critically damped viscous follower in `afterTick(dtMs)`
- [x] P06.4 Sync `openspec/specs/portfolio-controls/spec.md` and `openspec/specs/graph-simulation/spec.md` with singular `Reset`, volume popover, `stickyFocalId`, collision-aware popups, draggable drawer, and initial vs. live reduced-motion behavior
- [x] P06.5 Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes && npx openspec validate --specs`, update `verification.md`, and mark `PATCH-06` `RESOLVED` in `patch.md`
