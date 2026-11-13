# Patch Log: `portfolio-v3-organic-ferrofluid`

### [PATCH-01] Organic Bridge Curvature, Render-Clock Recoil, Soft Home Anchors, Force-Isolated Drag & Live Reduced-Motion
- **Date**: 2026-11-12 23:06:33 UTC
- **Feedback Source**: Manual Playtest (Screen Recording) + Code Review (Agent 1 `REQUEST CHANGES`, Agent 2 `APPROVE` w/ follow-ups) on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**:
  1. Bridges at rest and under stretch still read as straight, sharp-edged tapers rather than curved concave hourglass fillets.
  2. Recoil tips draw as fixed-position perimeter ellipses and `recoilProgress` / `reconnectCooldownUntil` freeze when `d3` ticks stop; stretched bridges appeared to stall/dangle mid-air.
  3. Hard `fx/fy` pinning and `alphaTarget = 0` make idle nodes completely static; `dragNeighborPins` freezes neighbors and causes pops on `dragEnd`.
  4. `GraphCanvas.tsx:431-448` live `prefers-reduced-motion` transition fails to populate `staticPosRef` and stop `sim` when switching to reduced motion (and fails to restart when switching back).
  5. `App.tsx` passes `window.innerWidth / 2, window.innerHeight / 2` instead of measured canvas container center; `render()` sorts node IDs every frame.
- **Root Cause**:
  - `bridgeGeometry.ts` caps `baseHandle` by `HANDLE_RADIUS_RATIO = 1.2` (~26px max on 90–150px gaps), forcing straight chords with tight endpoint hooks.
  - `graphSimulation.ts` advances `simClock` and `recoilProgress` only inside `afterTick` (which stops when `sim` cools), and uses hard `fx/fy` locks instead of soft `home` springs + force isolation.
  - `GraphCanvas.tsx` `handleMotionChange` does not sync `staticPosRef` or `sim.sim.stop()`/`wake()`.
- **Target Files**: `src/utils/bridgeGeometry.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/utils/bridgeGeometry.test.ts`, `src/physics/graphSimulation.test.ts`, `openspec/changes/portfolio-v3-organic-ferrofluid/specs/graph-simulation/spec.md`, `openspec/specs/graph-simulation/spec.md`
- **Expected Resolution**: True $C^1$ concave hourglass curves with `cp` normal offsets `>= 0`; render-clock teardrop recoil anchored to live endpoints; soft `(homeX, homeY)` springs + purely visual ~30fps ambient drift (`3.5px`, paused when hidden/off-screen/reduced-motion) shared with `hitNode`; force-isolated viscous drag (`< 15px` neighbor displacement without neighbor `fx/fy`); live reduced-motion transition handling; measured `canvasCenter`.
- **Status**: RESOLVED (2026-11-12 23:32:00 UTC)
- **Resolution**:
  - `bridgeGeometry.ts` now uses a gap-proportional handle capped by `min(R) * tan(MAX_SPREAD_ANGLE)`, solves per-endpoint spread with monotone bisection for the 0.58 rest target (clamped by `alpha >= 1` so all four control-point normal offsets stay non-negative), and smoothsteps the target toward the 2px floor at 1.6x before sag extension.
  - `graphSimulation.ts` replaces `userPinnedIds`/`dragNeighborPins` with alpha-independent damped `home` springs, isolates the dragged node (charge strength 0, collide radius `0.4 * R`), applies 45ms viscous pointer lag, and stores `detachedAt`/`reconnectCooldownUntil` as `performance.now()` timestamps with a reconnect ripple.
  - `GraphCanvas.tsx` draws render-clock teardrop recoil from live endpoints, smoothsteps proximity alpha over `[R_A + R_B, R_A + R_B + 12]`, runs deterministic 3.5px visual drift at ~30fps shared with `hitNode`, handles reduced-motion transitions in both directions, hoists sorted ids/edge keys, and measures `canvasCenter`; `App.tsx` forwards that measured center.
  - Reproducing tests failed first, then passed: 173 unit tests, 88 e2e tests, typecheck/build clean, OpenSpec validation clean.

### [PATCH-02] UI Polish, Node-Hover Crosshair, Active-Pair Edge Filtering, Focal Edge Tag Pills & Grid Layout
- **Date**: 2026-11-13 17:48:07 UTC
- **Feedback Source**: Manual Playtest & Design Review on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**:
  1. 3-dot dropdown has two reset buttons (`"Reset"` w/ undo icon and `"Reset layout"`), and visited node colors don't reset.
  2. Canvas cursor stays crosshair everywhere instead of only when hovering/dragging a node.
  3. Filtering highlights all outgoing edges from an active node (`&&`) instead of only edges where both endpoints are active (`||`).
  4. Focal/hovered connections don't show 1–3 stacked shared-tag pills between nodes.
  5. Grid cards place `title` below preview instead of inline next to `01` with `summary` directly below (`DESIGN.md` needs update), and `[CLI Specimen]` badge still renders on terminal fallbacks.
  6. GitHub Issue `#9` needs updated media requirements appended (without `[CLI Specimen]`).
- **Root Cause**:
  - `ControlsOverlay.tsx` renders both `reset-filters` and `reset-layout`, and `App.tsx` doesn't clear `visitedIds` on reset.
  - `src/styles.css` `.canvas-interactive` sets `cursor: crosshair` globally; `GraphCanvas.tsx` uses `&&` for `isDim` and doesn't draw focal edge tag pills.
  - `ListView.tsx` orders `index` -> `CardPreview` -> `title` -> `summary`, and `ListView.tsx`/`NodeHoverCard.tsx` render `[CLI Specimen]`.
- **Target Files**: `src/components/ControlsOverlay.tsx`, `src/App.tsx`, `src/styles.css`, `src/components/GraphCanvas.tsx`, `src/components/ListView.tsx`, `src/components/NodeHoverCard.tsx`, `DESIGN.md`, `e2e/portfolio.spec.ts`, GitHub Issue `#9`
- **Expected Resolution**: Singular `"Reset"` button resets filters + layout + visited node colors; crosshair cursor appears only on node hover/drag; edges illuminate only when both endpoints are active; 1–3 stacked shared-tag pills render on focal non-detached edges; `[CLI Specimen]` removed; Grid cards show `01  Title` -> `Subtitle` -> `CardPreview` -> `Tags` (codified in `DESIGN.md`); Issue `#9` updated.
- **Status**: RESOLVED (2026-11-13 18:05:00 UTC)
- **Resolution**:
  - `ControlsOverlay` now renders one `data-testid="reset-layout"` button labelled/accessible-named `"Reset"`; `App.resetAll` clears active tags, search, layout version, and `visitedIds`.
  - `styles.css` defaults the canvas to `cursor: default`; `GraphCanvas` switches to `crosshair` only when `hitNode` succeeds or `state === 'drag'`.
  - Edge dimming now uses `dimmed.has(source) || dimmed.has(target)`; focal non-detached edges draw up to three stacked shared-tag pills at their midpoint. A `data-dimmed-edges` canvas attribute exposes the deterministic active-pair state for the E2E guard.
  - `ListView` removes the `[CLI Specimen]` badge and reorders every Grid card to `01  Title` row -> summary -> 16:9 preview -> tags; `NodeHoverCard` removes the fallback `CLI specimen` subtitle; `DESIGN.md` codifies the hierarchy, singular Reset, node-hover crosshair, and active-pair filtering.
  - GitHub Issue `#9` received the updated media list without `[CLI Specimen]`.
  - Verification: typecheck clean, 173 unit tests, 92 e2e passed / 24 expected skips, build clean, OpenSpec changes/specs valid.

### [PATCH-03] Contiguous Edge Tags, Inspector Persistence, Kintsugi Media Cleanup & 250ms Hover Dwell
- **Date**: 2026-11-13 18:20:00 UTC
- **Feedback Source**: Manual Design Review (PR #12 follow-up)
- **Reported Issue**:
  1. Edge connection tags have vertical gaps; multiple shared tags should read as one contiguous rounded rectangle.
  2. Connection tags disappear when the project inspector opens; they should persist for the inspected node.
  3. The Kintsugi Fracture hover popup still shows a terminal placeholder.
  4. Set the hover-card initiation timer to the requested `0.25s` (`250ms`); the previous value was `200ms`.
- **Root Cause**:
  - `drawEdgeTagPills` rendered a separate rounded pill per tag with a `4px` gap.
  - `GraphCanvas` focal id only considered `focusedId`/hover, not the active inspector selection.
  - `NodeHoverCard` rendered its terminal fallback for any project without video/screenshot, including linkout-only Kintsugi.
  - `HOVER_DWELL_MS` was `200`.
- **Target Files**: `src/components/GraphCanvas.tsx`, `src/components/NodeHoverCard.tsx`, `e2e/portfolio.spec.ts`, graph-simulation specs, `design.md`, `tests.md`, `DESIGN.md`, `patch.md`, `tasks.md`, `verification.md`.
- **Expected Resolution**: One contiguous rounded rectangle with flush tag rows; tags persist while the inspector is open and clear on close; Kintsugi (and other linkout-only projects) omit the terminal placeholder; hover dwell is `250ms`; covering E2E and documentation updated.
- **Status**: RESOLVED (2026-11-13 18:10:00 UTC)
- **Resolution**:
  - `drawEdgeTagPills` now measures the widest tag and paints one `roundRect` of total height `n * 20px`; all rows are flush with zero inter-row spacing, so two or three shared tags read as one rounded rectangle.
  - `GraphCanvas` now uses `selectedIdRef` as the final focal fallback (`focused ?? hovered ?? selected`), so connection labels persist for the inspected node while the drawer is open and clear when it closes.
  - `NodeHoverCard` only renders the terminal specimen when `project.terminalDemo` exists; linkout-only Kintsugi and Ivy omit the media block entirely.
  - `HOVER_DWELL_MS` is now `250ms` (`0.25s`), with graph-simulation specs, `design.md`, `tests.md`, and `DESIGN.md` updated.
  - Added `data-focal-tag-pills` dataset and E2E coverage for inspector persistence; dwell E2E now asserts no card at ~180ms and visibility after `250ms`.
  - Verification: typecheck clean, 173 unit tests, 93 e2e passed / 25 expected skips, build clean, OpenSpec changes/specs valid.

### [PATCH-04] Vertical Sound Volume Slider Popover
- **Date**: 2026-11-13 18:08:13 UTC
- **Feedback Source**: Feature Request / UI Enhancement on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**: Add a vertical volume slider popover to the `Sound` toggle that appears when sound is enabled and the user hovers (or toggles on / focuses) `Sound`, and disappears ~`500ms` after the pointer leaves. Dragging to `0%` keeps `Sound` enabled (`aria-pressed="true"`) at `0` master gain.
- **Root Cause**: `AmbientSynth` hardcodes `MASTER_GAIN = 1` on `start()` / `resumeFromGesture()` and has no `volume` state or UI slider control.
- **Target Files**: `src/audio/audioConstants.ts`, `src/audio/ambientSynth.ts`, `src/components/ControlsOverlay.tsx`, `src/App.tsx`, `src/styles.css`, `src/audio/ambientSynth.test.ts`, `e2e/portfolio.spec.ts`
- **Expected Resolution**: `AmbientSynth` persists `volume` (`[0, 1]`) under `portfolio_sound_volume` and scales `master.gain`; `ControlsOverlay` renders a vertical volume popover (`data-testid="volume-popover"`, `data-testid="volume-slider"`) only when `soundEnabled` is `true`, revealing on hover/focus and auto-hiding `500ms` after pointer leave; dragging to `0` keeps `Sound` enabled at `0` gain.
- **Status**: RESOLVED (2026-11-13 18:35:00 UTC)
- **Resolution**:
  - Added `VOLUME_STORAGE_KEY = 'portfolio_sound_volume'` and `DEFAULT_SOUND_VOLUME = 1`; `readVolumePreference` / `writeVolumePreference` clamp and persist `[0, 1]`.
  - `AmbientSynth` now stores `volume`, exposes `getVolume()` / `setVolume()`, and ramps `master.gain` to `volume * MASTER_GAIN` in `start()`, `resumeFromGesture()`, and live volume changes. Volume `0` leaves `isEnabled()` true.
  - `ControlsOverlay` wraps `Sound` in a hover/focus wrapper, shows the vertical popover when enabled, keeps it open while pointer/focus remains inside or the slider is dragged, and hides it `500ms` after pointer leave or immediately when Sound turns off.
  - `App` tracks `soundVolume`, wires `synth.setVolume`, and forwards `soundVolume` / `onVolumeChange`; `styles.css` adds the vertical range slider with `--color-accent`.
  - Verification: typecheck clean, 176 unit tests, 94 e2e passed / 26 expected skips, build clean, OpenSpec changes/specs valid.

### [PATCH-05A] Edge Tag Line Spacing 1.15
- **Date**: 2026-11-13 18:45:00 UTC
- **Feedback Source**: Manual Design Review on PR #12 follow-up
- **Reported Issue**: The connection-tag rows still used a `20px` row pitch; request was to set the tag line spacing to `1.15`.
- **Root Cause**: `drawEdgeTagPills` used a fixed `pillHeight = 20` for both the row pitch and text baseline offset, independent of the `12px` label font size.
- **Target Files**: `src/components/GraphCanvas.tsx`, `DESIGN.md`, `patch.md`, `tasks.md`, `verification.md`.
- **Expected Resolution**: Edge tags use `EDGE_TAG_LINE_SPACING = 1.15` so row pitch is `13.8px` for the `12px` label size, with `4px` vertical padding inside the single rounded rectangle; no inter-row gap.
- **Status**: RESOLVED (2026-11-13 18:47:00 UTC)
- **Resolution**:
  - Introduced `LABEL_FONT_SIZE = 12`, `EDGE_TAG_LINE_SPACING = 1.15`, and `EDGE_TAG_VERTICAL_PADDING = 4`.
  - `drawEdgeTagPills` now computes `lineHeight = LABEL_FONT_SIZE * EDGE_TAG_LINE_SPACING` (`13.8px`), total height `n * 13.8 + 8`, and stacks text at that pitch inside one contiguous `roundRect`.
  - `DESIGN.md` documents "no inter-row gap, 1.15 line spacing"; verification addendum records the visual check and regression logs.

### [PATCH-05] Collision-Aware Popups & Sticky Inspected Connections
- **Date**: 2026-11-13 18:41:31 UTC
- **Feedback Source**: Feature Request / UX Refinement on PR #12 (`feat/portfolio-v3-organic-ferrofluid`)
- **Reported Issue**:
  1. `NodeHoverCard` and desktop `ProjectDrawer` need to calculate placement where they cover/collide with the fewest node connections (especially focal edges) and nodes.
  2. Highlighted connections & focal tag pills from an inspected project should stay visible after closing `ProjectDrawer` until the user hovers over any node (including the same node) or clicks `Reset`.
  3. Desktop `ProjectDrawer` inspect popup should be draggable via a subtle `Move`/grab handle, clamped within viewport bounds.
- **Root Cause**:
  - `NodeHoverCard.tsx` uses a single outward ray (`position - canvasCenter`), and `ProjectDrawer.tsx` hardcodes `anchor.x + 32, anchor.y - 40`, ignoring live connection segments and neighboring nodes.
  - `GraphCanvas.tsx` `focalId` drops `selectedId` as soon as `ProjectDrawer` closes.
- **Target Files**: `src/utils/popoverPlacement.ts`, `src/utils/popoverPlacement.test.ts`, `src/components/GraphCanvas.tsx`, `src/components/NodeHoverCard.tsx`, `src/components/ProjectDrawer.tsx` (including header drag handle), `src/App.tsx`, `e2e/portfolio.spec.ts`
- **Expected Resolution**: `chooseBestPopoverPosition` scores 8 candidate quadrants against live screen-space node circles and Liang-Barsky segment-AABB intersections (weighting `isFocal` edges `3x`), placing both `NodeHoverCard` and desktop `ProjectDrawer` with minimal connection overlap; `stickyFocalId` preserves inspected focal edges & contiguous tag pills after closing `ProjectDrawer` until `250ms` hover dwell activates on any node (or `Reset` / `Grid` view); desktop `ProjectDrawer` gains a hover-revealed `Move`/grab handle with pointer-captured, viewport-clamped dragging and a `hasUserDraggedRef` lock so anchor updates cannot snap it back.
- **Status**: RESOLVED (2026-11-13 19:03:00 UTC)
- **Resolution**:
  - Added `src/utils/popoverPlacement.ts` with 8 candidate rectangles, viewport/72px header clamping, circle-rect node penalties (`5000` target / `1000` neighbor), Liang-Barsky segment-AABB intersection scoring (`3x` focal), and an outward-ray tie-breaker; unit tests cover hub, corner, focal-edge, neighbor-node, and clamping cases.
  - `GraphCanvas` emits live screen-space `{ nodes, segments }` snapshots through `onHoverNode`, `onSelect`, and `onResolveAnchor`; both `NodeHoverCard` and desktop `ProjectDrawer` place through `chooseBestPopoverPosition`.
  - Added `stickyFocalId`: `openProject` sets it, `closeDrawer` preserves it, `Reset` / `Grid` view clear it, and the unified `250ms` hover dwell clears it on any node (including the same inspected node). Sticky focal connections and contiguous tag pills remain visible after the drawer closes.
  - Kept the last obstacle snapshot during the 150ms hover-card transfer grace period so the card cannot re-place itself away from the pointer mid-transfer.
  - Desktop `ProjectDrawer` now exposes a hover-revealed `Move` / `cursor-grab` / `cursor-grabbing` header handle (`data-testid="drawer-drag-handle"`) with pointer capture, viewport-clamped dragging, and a `hasUserDraggedRef` lock that prevents anchor updates from snapping the panel back. Mobile remains an unchanged bottom sheet.
  - Verification: typecheck clean, 181 unit tests, 96 e2e passed / 28 expected skips, build clean, OpenSpec changes/specs valid.

### [PATCH-06] Mid-Drag Reduced-Motion Guard, Frame-Clock Drag Follower, 30fps Idle Throttle & Spec Sync
- **Date**: 2026-11-13 19:34:08 UTC
- **Feedback Source**: Code Review on PR #12 (`afc0751`, Agent 1 `REQUEST CHANGES`, Agent 2 `APPROVE` w/ Important follow-ups)
- **Reported Issue**:
  1. `GraphCanvas.tsx:618-643, 1121-1132`: Switching to `prefers-reduced-motion: reduce` mid-drag stops `sim.sim` without ending the active drag, and `onPointerUp` skips `sim.dragEnd()` while reduced motion is active, leaving `sim.state === 'drag'` with a pinned node if motion is re-enabled.
  2. `graphSimulation.ts:542-561`: Viscous follower `dragMove` runs per `pointermove` event instead of on the frame clock, causing polling-rate-dependent drag speed and stalling short of a stationary cursor.
  3. `GraphCanvas.tsx:690-718`: `loop` runs `render()` at full 60–120 Hz even when `sim.isIdle && !cameraMoving` and only 30 fps ambient drift is active.
  4. `openspec/specs/portfolio-controls/spec.md` & `openspec/specs/graph-simulation/spec.md` are out of sync with the shipped singular `Reset`, volume slider, `stickyFocalId`, collision-aware popups, draggable drawer, and live reduced-motion freeze.
- **Root Cause**:
  - `handleMotionChange` does not call `sim.dragEnd()` when transitioning to reduced motion, and `onPointerUp` gates `sim.dragEnd()` behind `!reduceMotionRef.current`.
  - `dragMove` integrates `DRAG_LAG_MS` inside pointer events rather than storing `dragTarget` for `afterTick(dtMs)`.
  - `loop` calls `render()` unconditionally on every rAF tick when `ambientRunning` is true.
- **Target Files**: `src/components/GraphCanvas.tsx`, `src/physics/graphSimulation.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`, `openspec/specs/portfolio-controls/spec.md`, `openspec/specs/graph-simulation/spec.md`
- **Expected Resolution**: Active drag is cleanly ended on mid-drag reduced-motion transition and `pointerup`; `dragMove` stores `dragTarget` and `afterTick` advances the viscous follower at frame `dt`; idle ambient redraws throttle to 30 fps (`>= 33ms`); specs are synced and validated.
- **Status**: RESOLVED (2026-11-13 19:42:00 UTC)
- **Resolution**:
  - `GraphCanvas.handleMotionChange` now finalizes an active drag (`sim.dragEnd()`, clear pointer samples, zero drag velocity) before freezing `staticPosRef` and stopping the simulation; `onPointerUp` always calls `sim.dragEnd()` when `state === 'drag'` regardless of reduced motion.
  - `graphSimulation.dragMove` now stores a rubber-band `dragTarget`; `afterTick(dtMs)` advances the critically damped follower (`1 - exp(-clampedDt / 45ms)`) on the frame clock, so high-polling mice and stationary cursors behave identically. Drag end/reset clear the target.
  - The idle ambient loop now renders at ~30 fps (`>= 33ms`) when the sim is idle and only ambient drift is active; node maps, active positions, ambient offsets, and dimmed-edge keys are reused/cached instead of reallocated each frame. `data-sim-state` exposes the current state for regression testing.
  - Synced `openspec/specs/portfolio-controls/spec.md` (singular Reset, 500ms volume popover, persisted gain) and `openspec/specs/graph-simulation/spec.md` (initial vs live reduced-motion behavior, collision-aware popups, sticky inspected focus, draggable desktop drawer).
  - Verification: typecheck clean, 182 unit tests, 97 e2e passed / 29 expected skips, build clean, `openspec validate --changes` and `--specs` clean.
