# OpenCode Orchestration Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid'

You are the orchestration agent for OpenSpec change 'portfolio-v3-organic-ferrofluid' running in OpenCode.
Your primary directive is to execute this change using the **`openspec-apply-sub`** skill, which delegates task implementation to the `spec-coder-sub` subagent.

## 1. Orchestration Directive
- **Change Name**: `portfolio-v3-organic-ferrofluid`
- **Target Skill**: `openspec-apply-sub` (or `/opsx:apply-sub portfolio-v3-organic-ferrofluid`)
- **Architecture Paradigm**: Vertical Slice Architecture (VSA). Maintain strict isolation between pure geometry (`src/utils/bridgeGeometry.ts`), headless physics (`src/physics/graphSimulation.ts`), 2D canvas rendering (`src/components/GraphCanvas.tsx`), and React HUD overlays (`src/components/ControlsOverlay.tsx`, `src/components/NodeHoverCard.tsx`).

## 2. Target Context Map
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/utils/bridgeGeometry.ts` | `L55-L65`, `L88-L114`, `L182-L213` | Add `REST_WAIST_RATIO = 0.58` and wider perimeter `HALF_WIDTH_RATIO = 0.85` (capped by `MAX_SPREAD_ANGLE = Math.PI / 6.2`); compute concave rest waist in `bridgeWaistWidth` so `handleForWaist > 0` at rest while preserving $C^1$ tangent continuity and short-gap `baseHandle` bounds. |
| `src/physics/graphSimulation.ts` | `L42-L53`, `L80-L93`, `L259-L268`, `L298-L318`, `L359-L377`, `L447-L503` | Add `recoilProgress` (`220ms`) and `reconnectCooldownUntil` (`350ms` post-`dragEnd`) to `BridgeLinkState`; update `SNAP_MULTIPLIER = 1.6` & `RECONNECT_MULTIPLIER = 1.25`; explicitly refresh `forceLink.strength` on `dragStart` and `dragEnd` (zeroing strength on `dragNode` links during `drag`); persist user-placed `fx/fy` on `dragEnd`; proportionally scale/clamp pinned `fx/fy` on `resize(nw, nh)`; implement `resetLayout()`; soften `hoverAttraction` with `0 -> 0.025` ramp outside a `110px` radial exclusion zone. |
| `src/components/GraphCanvas.tsx` | `L14-L29`, `L90-L124`, `L233-L282`, `L504-L627` | Update `drawFluidBridge` to paint axis-aligned `createLinearGradient` between endpoint node colors and render `220ms` recoil tips; add deterministic sorted-pair non-edge-only zero-force proximity bridge pass (`PROXIMITY_MAX_DIST = 96px`) underneath permanent bridges and nodes; add unified `200ms` `hoverDwellTimer` gating both `sim.hover` and `emitHover` with synchronous cancellation on `pointerdown`, `dragStart`, `pointerleave`, `focusedId`, `reduceMotion`, and `coasting`; wire `layoutResetVersion` prop to `simRef.current?.resetLayout()` + `wakeRef.current()`. |
| `src/components/NodeHoverCard.tsx` | `L13-L46` | Measure actual rendered card bounds via `ResizeObserver`; project placement outward from canvas center along `(nodeScreenPos - canvasCenter)` and clamp to viewport + `20px` safe-area margins with inward fallback on narrow viewports (`393x852`). |
| `src/components/ControlsOverlay.tsx` | `L1-L22`, `L140-L216` | Replace the header `"Filters"` trigger with a 3-dot overflow button (`MoreHorizontal`, `data-testid="controls-dropdown-trigger"`, `aria-label="Filters & Layout"`); move the `"Filters"` heading inside the dropdown above search/tags; add `"Reset layout"` (`data-testid="reset-layout"`) wired to `onResetLayout`. |
| `src/App.tsx` | `L54`, `L155-L167`, `L295-L350` | Add `layoutResetVersion` state connecting `ControlsOverlay` (`onResetLayout`) to `GraphCanvas` (`layoutResetVersion`); pass canvas center context to `NodeHoverCard` and clear hover state immediately on drag/click/focus changes. |
| `src/utils/bridgeGeometry.test.ts` | `[TDD]` | Add unit tests for `REST_WAIST_RATIO = 0.58`, `handleForWaist > 0` at rest across short/long gaps and hubs, short-gap `baseHandle` $C^1$ bounds, and `1.6x` stretch cinching. |
| `src/physics/graphSimulation.test.ts` | `[TDD]` | Add unit tests for deterministic decoupled drag (`20` fixed `sim.tick()` steps over `160px` `dragMove` -> `< 15px` neighbor displacement), persistent `fx/fy` + proportional clamped `resize()`, `resetLayout()`, `1.6x`/`1.25x` snap/reconnect, `350ms` cooldown, `220ms` recoil, zero proximity force, and `393x852` snap reachability. |
| `tests/` (Playwright E2E) | `[TDD]` | Add E2E coverage for 3-dot dropdown (`"Filters"` heading + `"Reset layout"`), `200ms` hover dwell & drag/coasting suppression, and peripheral `NodeHoverCard` placement on desktop (`1440x900`) and mobile (`393x852`). |

## 3. Technical & Architectural Boundaries
- **In-Scope Decisions**:
  - Explicitly refresh `forceLink.strength(...)` inside `dragStart` and `dragEnd` (`d3-force` caches per-link strengths internally).
  - Persist user-placed positions on `node.fx`/`node.fy`, scale/clamp proportionally on `resize(nw, nh)` to `[BOUNDARY_MARGIN, dim - BOUNDARY_MARGIN]`, and clear via `sim.resetLayout()`.
  - Connect `ControlsOverlay` -> `App.tsx` -> `GraphCanvas` via `layoutResetVersion` state counter.
  - Non-edge-only sorted-pair proximity pass (`Set<string>` of permanent edge keys) so detached permanent edges never spawn duplicate proximity bridges.
- **Hard Exclusions / No-Go**:
  - Do NOT implement elliptical node squash/stretch deformation (explicitly deferred to Stage 4).
  - Do NOT modify `.env`, `.env.*`, or credential files.
  - Do NOT introduce unapproved external dependencies.
  - Do NOT perform code modifications outside the Target Context Map without prior task coverage.

## 4. Visual & UI Design Specifications
- **Theme**: Swiss Editorial Ferrofluid
- **Key Tokens**:
  - Primary (`--color-accent`): `#003399` | Background (`--color-bg`): `#f6f6f4` | Surface (`--color-surface`): `#eae9e5`
  - Text: Primary `#0a0a0c`, Muted `#525257`
- **Component Anatomy & States**:
  - `ControlsOverlay` 3-dot trigger (`data-testid="controls-dropdown-trigger"`): `bareText` muted color (`text-[var(--color-muted)]`), `min-h-11 md:min-h-0`, `aria-expanded={open}`; dropdown contains `"Filters"` heading, search + tag pills, `"Reset"` (filters), and `"Reset layout"` (`data-testid="reset-layout"`).
  - `NodeHoverCard`: `ResizeObserver`-measured bounds anchored outward from canvas center with `20px` viewport/safe-area clamping.
  - Bridges: concave hourglass at rest (`REST_WAIST_RATIO = 0.58`), smooth axis-aligned `createLinearGradient`, `220ms` retracting droplet recoil tips on snap, and zero-force proximity webbing beneath permanent bridges and nodes.
- **Responsive Layout**: Mobile (`< 768px`) touch targets $\ge 44\text{px}$ (`min-h-11`); Desktop (`>= 768px`) `200ms` hover dwell enabled.

## 5. Test Scaffolding & Verification Commands
- **Primary Test Runner**: `npm run test:unit` (Vitest), `npm run test:e2e` (Playwright), `npm run typecheck`, `npm run build`
- **TDD Requirement**: Task group `## 1` MUST scaffold failing unit/E2E tests before touching implementation code. Verify they fail initially.

## 6. Implementation Task Checklist
- [ ] 1.1 Write failing unit tests in `src/utils/bridgeGeometry.test.ts` for `REST_WAIST_RATIO` (`0.58`) concave rest silhouettes (`waistWidth < 2 * averageHalf`, `handleForWaist > 0`), short-gap `baseHandle` $C^1$ bounds, and `1.6x` stretch cinching
- [ ] 1.2 Write failing unit tests in `src/physics/graphSimulation.test.ts` for deterministic decoupled drag (`20` fixed `sim.tick()` steps over a `160px` `dragMove` -> `< 15px` neighbor displacement), persistent user pinning (`fx/fy` retained after `dragEnd` and proportionally clamped on `resize()`), `resetLayout()`, `1.6x`/`1.25x` snap & reconnect hysteresis, `350ms` post-release cooldown, `220ms` recoil progress, and `393x852` mobile snap reachability
- [ ] 1.3 Write failing Playwright E2E tests for 3-dot controls menu (`"Filters"` heading inside dropdown, `"Reset layout"` button), `200ms` unified hover dwell & drag/coasting suppression, and peripheral `NodeHoverCard` placement
- [ ] 2.1 Update `src/utils/bridgeGeometry.ts` with wider perimeter attachment spread (`HALF_WIDTH_RATIO = 0.85`, `MAX_SPREAD_ANGLE = Math.PI / 6.2`) and `REST_WAIST_RATIO = 0.58` so rest bridges form concave $C^1$ hourglass fillets
- [ ] 2.2 Update `drawFluidBridge` in `src/components/GraphCanvas.tsx` to use axis-aligned `createLinearGradient` blending endpoint node colors (`tokens.accent` / `tokens.nodeVisited` / `tokens.nodeUnvisited`) smoothly through `tokens.connection`
- [ ] 2.3 Update `src/physics/graphSimulation.ts` to explicitly refresh `forceLink.strength` on `dragStart` and `dragEnd` (zeroing strength on `dragNode` links during `drag`), persist user-placed `fx/fy` coordinates on `dragEnd`, proportionally scale/clamp pinned `fx/fy` on `resize()`, apply viscous coasting damping, and implement `resetLayout()`
- [ ] 3.1 Update `SNAP_MULTIPLIER` (`1.6`) and `RECONNECT_MULTIPLIER` (`1.25`) in `src/physics/graphSimulation.ts` with `recoilProgress` (`220ms`) and `reconnectCooldownUntil` (`350ms` post-`dragEnd`) on `BridgeLinkState`
- [ ] 3.2 Render retracting droplet recoil tips for snapped bridges and add the deterministic sorted-pair non-edge-only zero-force proximity bridge pass (`PROXIMITY_MAX_DIST = 96px`) underneath permanent bridges and nodes in `src/components/GraphCanvas.tsx`
- [ ] 4.1 Add a unified `200ms` `hoverDwellTimer` in `src/components/GraphCanvas.tsx` gating both `sim.hover` and `emitHover`, with synchronous cancellation on `pointerdown`, `dragStart`, `pointerleave`, `focusedId` change, `reduceMotion`, and `coasting`
- [ ] 4.2 Replace snappy `hoverAttraction` in `src/physics/graphSimulation.ts` with a slow ramped drift (`0 -> 0.025`) outside a `110px` soft radial exclusion zone around the hovered node
- [ ] 4.3 Update `src/components/NodeHoverCard.tsx` and `src/App.tsx` to measure actual card bounds via `ResizeObserver` and anchor peripherally outward from the canvas center with viewport + safe-area clamping
- [ ] 4.4 Update `src/components/ControlsOverlay.tsx`, `src/App.tsx`, and `src/components/GraphCanvas.tsx` to replace the `"Filters"` button with a 3-dot trigger (`data-testid="controls-dropdown-trigger"`), move the `"Filters"` title inside the dropdown, and wire `"Reset layout"` (`data-testid="reset-layout"`) via `layoutResetVersion` in `App.tsx` to `simRef.current?.resetLayout()` + `wakeRef.current()`
- [ ] 5.1 Run `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:e2e`, and `npx openspec validate --changes`, verifying clean passes and capturing desktop (`1440x900`) and mobile (`393x852`) visual checks
- [ ] 5.2 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs

## 7. Post-Implementation & Verification Obligations
When `spec-coder-sub` finishes:
1. Verify all checkboxes in `tasks.md` are marked `- [x]`. Only tick boxes that genuinely ran and passed.
2. Check data preservation: confirm all 8 project nodes and 13 permanent edges remain intact.
3. Ensure `openspec/changes/portfolio-v3-organic-ferrofluid/verification.md` is populated with:
   - Executive Summary & Environment
   - Requirement Adherence Audit Matrix (mapping every spec scenario to its verifying test)
   - Resolved Assumptions & Empirical Proof
   - Nomenclature & Code Symbol Audit
   - Verbatim Execution Logs
4. Automatically run verification via `openspec-verify-change`.
5. If clean with no critical issues, sync specs: `openspec specs apply --change "portfolio-v3-organic-ferrofluid"`.
6. **Open a Pull Request**: Once implementation is complete and `openspec/changes/portfolio-v3-organic-ferrofluid/verification.md` is written and verified with zero critical issues:
   - Ensure your work is on a dedicated feature branch (create/switch to `feat/portfolio-v3-organic-ferrofluid` if currently on `main`/`master`).
   - Stage and commit the implementation and OpenSpec artifacts (`tasks.md`, `verification.md`, synced specs), then push the branch (`git push -u origin HEAD`).
   - Open a Pull Request using `gh pr create --fill` and report the PR URL.
