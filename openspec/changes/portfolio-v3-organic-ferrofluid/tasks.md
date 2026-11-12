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
