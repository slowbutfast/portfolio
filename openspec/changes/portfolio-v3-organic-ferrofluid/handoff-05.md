# Surgical Patch Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid' [PATCH-05]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v3-organic-ferrofluid` (Target Branch: `feat/portfolio-v3-organic-ferrofluid` / PR #12)
- **Patch ID**: `PATCH-05`
- **Objective**: Place both `NodeHoverCard` and desktop `ProjectDrawer` in the quadrant that collides with the fewest live node connections and nodes, and keep an inspected project's highlighted connections & contiguous tag pills visible after closing `ProjectDrawer` until the `250ms` hover dwell activates on any node (or `Reset` / `Grid` view).
- **Feedback & Diagnostic Trace**:
  ```
  User Request:
  - Calculate where to place the hover popup and inspect popup so they cover/collide with the fewest node connections, keeping the maximum number of connections visible.
  - Keep the inspected project's highlighted connections & tag pills visible after closing the inspector until the user hovers over any node (including the same node, for consistent behavior), at which point the sticky highlight clears.
  - Scoped as PATCH-05 on PR #12 (feat/portfolio-v3-organic-ferrofluid).
  ```
- **Root Cause Analysis**:
  - `NodeHoverCard.tsx` uses a single outward ray (`position - canvasCenter`) and `ProjectDrawer.tsx` hardcodes `anchor.x + 32, anchor.y - 40` on desktop, ignoring live edge segments and neighboring nodes.
  - `GraphCanvas.tsx` `focalId` falls back only to `selectedIdRef.current`, clearing immediately when `ProjectDrawer` closes.

## 2. Strict Target Context Map (on `feat/portfolio-v3-organic-ferrofluid`)
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/utils/popoverPlacement.ts` | `[NEW]` | Pure `chooseBestPopoverPosition` solver generating 8 candidate rectangles around `anchor` (`R, L, T, B, TR, BR, TL, BL` at `NODE_GAP = 36px`), clamped to `[margin, viewport.width - width - margin]` × `[topMargin, viewport.height - height - margin]` (`topMargin = 72`), scoring node circle overlap (`5000` target node, `1000` neighbors), Liang-Barsky segment-AABB intersections (`3x` weight for `isFocal`, `1x` for non-focal), and outward-ray tie-breaker. |
| `src/utils/popoverPlacement.test.ts` | `[NEW]` | Unit tests verifying lowest-collision candidate selection across dense center hubs and corner nodes, focal-edge avoidance, and viewport/header clamping. |
| `src/components/GraphCanvas.tsx` | `L22-L29`, `L398-L419`, `L535-L575` | Emit screen-space `{ nodes, segments }` obstacle snapshot when invoking `onHoverNode`, `onSelect`, and `onResolveAnchor`; accept `stickyFocalId` and `onClearStickyFocal`; compute `focalId = focused ?? sim.hovered?.id ?? selectedIdRef.current ?? stickyFocalRef.current ?? null`; invoke `onClearStickyFocal()` when `250ms` hover dwell activates on **any** node (including the previously inspected node). |
| `src/components/NodeHoverCard.tsx` | `L5-L12`, `L51-L86` | Accept optional `obstacles?: PopoverObstacles` and compute `{ left, top }` via `chooseBestPopoverPosition` using `ResizeObserver`-measured card bounds. |
| `src/components/ProjectDrawer.tsx` | `L16-L20`, `L125-L143`, header/corner | Accept optional `obstacles?: PopoverObstacles` and `canvasCenter?: { x: number; y: number }`; on desktop (`window.innerWidth >= 768`), compute `targetRef.current` via `chooseBestPopoverPosition` using `panel.offsetWidth` / `panel.offsetHeight`. Add pointer drag support on desktop via a corner/header drag handle (`data-testid="drawer-drag-handle"`, showing a subtle `Move` icon + `cursor-grab` / `cursor-grabbing` on hover) that locks user-dragged coordinates clamped within viewport bounds (`hasUserDraggedRef` prevents `anchor` updates from snapping it back). Keep mobile `< 768px` bottom-sheet unchanged. |
| `src/App.tsx` | `L48-L56`, `L200-L221`, `L260-L266`, `L305-L375` | Manage `stickyFocalId` (`openProject` sets it, `closeDrawer` preserves it, `onClearStickyFocal` / `resetAll` / `'list'` view clears it) and `hoverObstacles` / `drawerObstacles` snapshots; wire to `GraphCanvas`, `NodeHoverCard`, and `ProjectDrawer`. |
| `e2e/portfolio.spec.ts` | Relevant suite | E2E tests verifying `stickyFocalId` persists after closing `ProjectDrawer`, clears when `250ms` hover dwell activates on any node (including the same node), clears on `Reset`, desktop `ProjectDrawer` drags via `drawer-drag-handle`, and popups avoid overlapping dense edges. |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files specified in the Target Context Map (plus `tasks.md`, `patch.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT alter `bridgeGeometry.ts` or `graphSimulation.ts` physics/curvature math.
  - Do NOT modify `.env` or credential files.
- **INVARIANTS TO PRESERVE**:
  - `prefers-reduced-motion`, mobile `< 768px` bottom-sheet `ProjectDrawer`, and zero Axe accessibility violations remain intact.

## 4. Visual & UI Impact
- Both `NodeHoverCard` and desktop `ProjectDrawer` keep existing Swiss editorial styling (`rounded-2xl`, `--color-surface`, `--color-outline`) and `72px` top header clearance; focal edges & contiguous `surfaceContainer` tag pills persist after closing `ProjectDrawer` until hover dwell activates on any node.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Run `npm run test:unit -- src/utils/popoverPlacement.test.ts` and `npm run test:e2e` after scaffolding `P05.1` tests and confirm failure.
2. **Apply Minimal Fix**: Implement `P05.2`–`P05.3` strictly within the Target Context Map.
3. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes` and confirm 100% pass.

## 6. Surgical Patch Checklist
- [ ] P05.1 Scaffold/run failing unit & E2E tests and confirm failure.
- [ ] P05.2 Implement `src/utils/popoverPlacement.ts`.
- [ ] P05.3 Implement `P05.3` in `GraphCanvas.tsx`, `NodeHoverCard.tsx`, `ProjectDrawer.tsx`, and `App.tsx`.
- [ ] P05.4 Run full verification suite, update `verification.md`, mark `PATCH-05` `RESOLVED` in `patch.md`, check off `tasks.md`, and push to PR #12.
