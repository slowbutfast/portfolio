## Why

At rest, `bridgeGeometry.ts` produces zero handle length (`handleForWaist === 0`) when `distance <= restDistance`, causing bridges to render as straight rigid lines piercing sharp circles rather than unified ferrofluid menisci. Meanwhile, active `forceLink` coupling hauls neighbors during drag, and immediate hover activation pops open preview cards mid-gesture across the graph center.

## What Changes

- **Rest Hourglass & Gradient Blending**: Introduce `REST_WAIST_RATIO` (`0.58`) with wider perimeter attachment flares so permanent bridges form $C^1$ concave hourglass fillets even at rest, and blend visited/active cobalt node colors smoothly along the bridge axis via `createLinearGradient`.
- **Decoupled Drag, Persistent Pinning & Reset Layout**: Zero `link` force on `dragNode` links during active drag so neighbors stay settled (`< 15px` displacement), persist user-placed node positions after drag release, and add a `"Reset layout"` action inside the 3-dot controls dropdown to restore `PLANAR_NODE_SEEDS` equilibrium.
- **Snap Recoil, Cooldown & Proximity-Only Bridges**: Lower `SNAP_MULTIPLIER` to `1.6` (`RECONNECT_MULTIPLIER = 1.25`), render retracting droplet recoil tips on snap, enforce a `350ms` post-release `reconnectCooldownUntil` before permanent edges reform, and render zero-force proximity-only bridges exclusively for non-permanent-edge pairs within `PROXIMITY_MAX_DIST`.
- **Unified Hover Dwell & Peripheral Card**: Gate both `sim.hover` physics and `NodeHoverCard` opening behind a single `200ms` dwell timer (cancelled synchronously on `pointerdown`, `dragStart`, `pointerleave`, `focusedId`, `reduceMotion`, or `coasting`), soften hover drift with a radial exclusion zone, and anchor `NodeHoverCard` peripherally away from the canvas center using measured `ResizeObserver` bounds.
- **3-Dot Controls Menu**: Replace the header `"Filters"` trigger in `ControlsOverlay.tsx` with a 3-dot menu button, move the `"Filters"` title inside the dropdown panel, and add `"Reset layout"` below the filter controls.
- **Spec Reconciliation**: Align stale `18px` radius, `forceX/Y(w/2)`, and `guide rings` wording in `graph-simulation/spec.md` with the implemented `22px` flat circle + `PLANAR_NODE_SEEDS` model.

## Capabilities

### New Capabilities
<!-- None; all changes extend existing graph-simulation and portfolio-controls capabilities. -->

### Modified Capabilities
- `graph-simulation`: Update bridge rest-waist geometry, gradient transitions, proximity-only non-edge bridges, `1.6x`/`1.25x` snap recoil + cooldown, decoupled drag + persistent user pinning with layout reset, unified `200ms` hover dwell + peripheral measured card placement, and reconcile stale spec text.
- `portfolio-controls`: Replace the header `"Filters"` trigger with a 3-dot menu trigger, move the `"Filters"` heading inside the dropdown, and add a `"Reset layout"` action under the filter section.

## Impact

- **Geometry & Physics**: `src/utils/bridgeGeometry.ts`, `src/physics/graphSimulation.ts`, `src/utils/bridgeGeometry.test.ts`, `src/physics/graphSimulation.test.ts`, `src/physics/graphPlanarity.test.ts`
- **UI & Canvas**: `src/components/GraphCanvas.tsx`, `src/components/NodeHoverCard.tsx`, `src/components/ControlsOverlay.tsx`, `src/App.tsx`
- **E2E & Specs**: `tests/` Playwright suites, `openspec/specs/graph-simulation/spec.md`, `openspec/specs/portfolio-controls/spec.md`
