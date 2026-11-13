## Why

The `v2` and `v3` portfolio updates introduced hover-dependent volume controls, sticky focal edge highlights, an `85dvh` inspect sheet, and uncapped high-DPR ambient rendering that create friction on mobile and touch devices. Polishing touch interaction, header density, sheet visibility, and mobile power usage makes the graph-first experience cohesive on phones without regressing desktop.

## What Changes

- **Touch graph recovery & sticky-focal escape**: Handle `pointercancel` on the graph `<canvas>` identically to `pointerleave` so OS interruptions cannot strand a drag state or drag audio; allow tapping empty canvas (`moved < 6`, no node hit) to clear `stickyFocalId`.
- **Single-row mobile top bar & touch-aware in-menu Sound**: On `< sm` (`< 640px`) viewports, omit `GitHub ↗` from the top bar (already present in `AboutModal` as `about-github`), leaving `About · Light/Dark · Grid/Graph · ...` on a single row at `>= 360px` (allowing graceful wrap at `320px` rather than truncating the wordmark). On `< sm` OR `(hover: none)` devices (covering iPad and landscape phones), move `Sound` + a horizontal volume slider inside `#portfolio-controls` and display a subtle `--color-accent` indicator dot on `controls-dropdown-trigger` when sound is enabled.
- **Draggable 3-detent bottom sheet & slim header**: Use `isSheet` for `width < 768` or `(pointer: coarse)` landscape phones (`height < 500`), turning `ProjectDrawer` into a draggable bottom sheet with a top handle (`sheet-drag-handle`) snapping to **Peek (`28dvh`)**, **Half (`56dvh`, default)**, and **Expanded (`86dvh`)** plus swipe-down-to-dismiss (`< 16dvh`), slim the mobile sticky header to `[handle] + index + title + Close` (moving `summary` and `Code ↗`/`Visit ↗` into the scrollable body), add `env(safe-area-inset-bottom)` clearance, suppress `cursor: move` border hints on `isSheet`, and pan the `GraphCanvas` camera so the tapped node remains centered in the measured upper strip.
- **Mobile fill-rate & battery cap**: Cap canvas DPR at `2` and throttle idle ambient drift to `15 fps` on `(pointer: coarse)` devices.
- **Mobile & landscape E2E matrix**: Add Playwright regression tests for `pointercancel`, empty-tap focal clearing, in-menu mobile sound/volume, `62dvh` sheet visibility, and `393×852` / `852×393` / `375×667` / `320×568` layouts.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `graph-simulation`: Add `pointercancel` drag cleanup, empty-canvas tap to clear sticky focal, `< 768px` selected-node upper-strip camera panning, and coarse-pointer DPR/ambient-fps throttling.
- `portfolio-controls`: Keep `< sm` top bar single-row (`About · Light/Dark · Grid/Graph · ...`), omit `nav-github` on `< sm`, and move `Sound` + horizontal volume slider inside `#portfolio-controls` on `< sm`.
- `project-drawer`: Replace fixed `85dvh` `isSheet` with a draggable 3-detent sheet (`28dvh` Peek / `56dvh` Half default / `86dvh` Full + swipe-down dismiss), slim the mobile sticky header (moving `summary` and action pills into the scrollable body), add bottom safe-area inset padding, and suppress `updateBorderCursor` when `isSheet` is true.

## Impact

- **Components & Styles**: `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/components/ControlsOverlay.tsx`, `src/components/ProjectDrawer.tsx`, `src/styles.css`.
- **Tests**: `e2e/portfolio.spec.ts` (updated mobile header expectations + new touch/landscape regression cases).
- **Physics**: `src/physics/graphSimulation.ts` remains unchanged unless the Phase 1 landscape screenshot spike reveals node overlap under `BOUNDARY_MARGIN = 48`.
