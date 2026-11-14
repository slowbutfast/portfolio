# Patch Ledger: `art-wip-rainbow-node`

## Patch Ledger
| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-14 | User Review Feedback on PR #16 | `src/types/portfolio.ts`, `src/data/projects.ts`, `src/utils/rainbowPulse.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |
| `PATCH-02` | 2026-11-14 | User Review Follow-up on PR #16 | `src/types/portfolio.ts`, `src/data/projects.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |
| `PATCH-03` | 2026-11-14 | User Review Follow-up on PR #16 | `src/types/portfolio.ts`, `src/data/projects.ts`, `src/data/graphSeeds.ts`, `src/utils/graphTopology.ts`, `src/components/GraphCanvas.tsx`, `src/utils/graphPlanarity.test.ts`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |
| `PATCH-04` | 2026-11-14 | User Review Follow-up on PR #16 | `src/data/projects.ts`, `src/utils/graphTopology.ts`, `src/components/NodeHoverCard.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/App.tsx`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |
| `PATCH-05` | 2026-11-14 | User Review Follow-up on PR #16 | `src/utils/artDiscovery.ts`, `src/utils/artDiscovery.test.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `e2e/portfolio.spec.ts` | APPLIED |

---

### [PATCH-01] Art Node Mystery Reveal, Minimal WIP Inspector, Weighted Gravity, White Stroke, 200ms Dwell & Two-Line Ivy Label
- **Date**: 2026-11-14 06:42:00 UTC
- **Feedback Source**: User Review Feedback (PR #16)
- **Reported Issue**:
  1. Keep the `1.5px` outline/stroke on the Art node, using `#ffffff` (white) in both light and dark modes.
  2. Speed up rainbow cycling by 20%.
  3. Set `art-wip` summary to `WIP`.
  4. Set `art-wip` title and `shortTitle` to `ART`.
  5. Omit the `09` index stamp from `art-wip` so `09` stays reserved for the next personal project.
  6. Hide the `ART` canvas label pill until the node is clicked, then reveal it normally until page refresh.
  7. Remove the `WIP` media preview from `art-wip`.
  8. Remove the `Overview` section at the bottom of `ProjectDrawer` for `art-wip`.
  9. Set hover dwell reaction time to `200ms`.
  10. Change `ivy-film-festival-2026` `shortTitle` to `"Ivy Film\nFestival"` rendered with `1.0` line spacing.
  11. Increase gravitational attraction toward `art-wip` and document the intentional departure from equal-mass distribution in `specs/graph-simulation/spec.md`.
- **Root Cause**: Post-PR review refinements for aesthetic minimalism, mystery discovery, and typography.
- **Target Files**: `src/types/portfolio.ts`, `src/data/projects.ts`, `src/utils/rainbowPulse.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-02] Restore Equal-Mass Node Physics & Lowercase `art` Title
- **Date**: 2026-11-14 07:28:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Restore equal-mass/charge/link physics on `art-wip` (remove `gravityWeight`, `gravityPullForce`, and `linkStrengthFor` overrides so `art-wip` behaves identically to all other nodes).
  2. Change `art-wip` `title` and `shortTitle` from `ART` to lowercase `art`.
- **Root Cause**: Follow-up aesthetic & physics balance preference after `PATCH-01`.
- **Target Files**: `src/types/portfolio.ts`, `src/data/projects.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-05] Drag-to-Unlock `art` Node, `450ms` Rainbow Fade-In & Persistent Discovery
- **Date**: 2026-11-14 08:33:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Keep `art-wip` locked (no title pill, no color change, no hover card, no inspector drawer even on hover/click) until it is dragged to make at least one connection with an `'art'`-tagged node.
  2. Allow `art-wip` to create proximity connections while still unrevealed and in motion.
  3. On its first connection, quickly fade in the rainbow color (`450ms`) and unlock normal title, hover, and inspector behavior.
  4. Persist the unlocked state and discovered connections in `localStorage` (`portfolio_art_state`) so neither `"Reset layout"` nor page reloads reset it.
- **Root Cause**: `PATCH-04` gated proximity latching on prior click (`revealedRef`) and cleared `art-wip` reveal/connections on reset/reload.
- **Target Files**: `src/utils/artDiscovery.ts`, `src/utils/artDiscovery.test.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-04] Hidden `'art'` Tag, Progressive `forceLink` Latching (`1 -> 2 -> 3 -> 4`), Rainbow Gradient Bridges & Resettable Reveal
- **Date**: 2026-11-14 08:13:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Restore cycling rainbow RGB connection gradients on `art-wip` bridges.
  2. Replace zero-force visual-only proximity lines with real `d3-force` link springs (`connectLink`) so `art-wip` is pulled into normal spring equilibrium instead of being repelled by `chargeForce`/`collideForce`, growing its connection limit `1 -> 2 -> 3 -> 4` as it connects to each new `'art'`-tagged node.
  3. Give `art-wip` `tags: ['art']` and centralize `HIDDEN_TAGS` / `getVisibleTags(...)` so `'art'` is invisible in hover cards, the inspector panel, list view, and `deriveEdges()`.
  4. Reset `inspectedIds` (`revealedIds`) inside `resetAll()` so the `art` node reveal resets on both page reloads and canvas resets (`Reset layout`).
- **Root Cause**: `PATCH-03`'s separate zero-force `artProximityIds` render path omitted `d3-force` springs and `LinearGradient` fills, and `resetAll()` did not clear `inspectedIds`.
- **Target Files**: `src/data/projects.ts`, `src/utils/graphTopology.ts`, `src/components/NodeHoverCard.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/App.tsx`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-05] Drag-to-Unlock `art` Node, `450ms` Rainbow Fade-In & Persistent Discovery
- **Date**: 2026-11-14 08:33:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Keep `art-wip` locked (no title pill, no color change, no hover card, no inspector drawer even on hover/click) until it is dragged to make at least one connection with an `'art'`-tagged node.
  2. Allow `art-wip` to create proximity connections while still unrevealed and in motion.
  3. On its first connection, quickly fade in the rainbow color (`450ms`) and unlock normal title, hover, and inspector behavior.
  4. Persist the unlocked state and discovered connections in `localStorage` (`portfolio_art_state`) so neither `"Reset layout"` nor page reloads reset it.
- **Root Cause**: `PATCH-04` gated proximity latching on prior click (`revealedRef`) and cleared `art-wip` reveal/connections on reset/reload.
- **Target Files**: `src/utils/artDiscovery.ts`, `src/utils/artDiscovery.test.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-03] Top-Left Isolated `art` Node & Post-Click Proximity Connections
- **Date**: 2026-11-14 07:50:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Give `art-wip` zero explicit tags (`tags: []`) and place it in the top-left empty space (`{ x: 0.16, y: 0.22 }`) with zero permanent edges on initial load (preserving the 13-edge planar graph with 0 crossings).
  2. Add the invisible `'art'` tag to `open-dungeon`, `transcribe-plus`, `sandwave-sim`, and `kintsugi-fracture` (excluded from pairwise `deriveEdges` and edge-tag pills).
  3. Once `art-wip` is clicked (`revealedRef.current.has('art-wip')`), dragging it within `180px` of any of those 4 `'art'`-tagged projects draws a proximity fluid bridge (`data-art-proximity-links`) with no tag pill on the connection.
- **Root Cause**: Avoid $K_5$ non-planarity while giving `art-wip` a playful mystery discovery mechanic.
- **Target Files**: `src/types/portfolio.ts`, `src/data/projects.ts`, `src/data/graphSeeds.ts`, `src/utils/graphTopology.ts`, `src/components/GraphCanvas.tsx`, `src/utils/graphPlanarity.test.ts`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-05] Drag-to-Unlock `art` Node, `450ms` Rainbow Fade-In & Persistent Discovery
- **Date**: 2026-11-14 08:33:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Keep `art-wip` locked (no title pill, no color change, no hover card, no inspector drawer even on hover/click) until it is dragged to make at least one connection with an `'art'`-tagged node.
  2. Allow `art-wip` to create proximity connections while still unrevealed and in motion.
  3. On its first connection, quickly fade in the rainbow color (`450ms`) and unlock normal title, hover, and inspector behavior.
  4. Persist the unlocked state and discovered connections in `localStorage` (`portfolio_art_state`) so neither `"Reset layout"` nor page reloads reset it.
- **Root Cause**: `PATCH-04` gated proximity latching on prior click (`revealedRef`) and cleared `art-wip` reveal/connections on reset/reload.
- **Target Files**: `src/utils/artDiscovery.ts`, `src/utils/artDiscovery.test.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-04] Hidden `'art'` Tag, Progressive `forceLink` Latching (`1 -> 2 -> 3 -> 4`), Rainbow Gradient Bridges & Resettable Reveal
- **Date**: 2026-11-14 08:13:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Restore cycling rainbow RGB connection gradients on `art-wip` bridges.
  2. Replace zero-force visual-only proximity lines with real `d3-force` link springs (`connectLink`) so `art-wip` is pulled into normal spring equilibrium instead of being repelled by `chargeForce`/`collideForce`, growing its connection limit `1 -> 2 -> 3 -> 4` as it connects to each new `'art'`-tagged node.
  3. Give `art-wip` `tags: ['art']` and centralize `HIDDEN_TAGS` / `getVisibleTags(...)` so `'art'` is invisible in hover cards, the inspector panel, list view, and `deriveEdges()`.
  4. Reset `inspectedIds` (`revealedIds`) inside `resetAll()` so the `art` node reveal resets on both page reloads and canvas resets (`Reset layout`).
- **Root Cause**: `PATCH-03`'s separate zero-force `artProximityIds` render path omitted `d3-force` springs and `LinearGradient` fills, and `resetAll()` did not clear `inspectedIds`.
- **Target Files**: `src/data/projects.ts`, `src/utils/graphTopology.ts`, `src/components/NodeHoverCard.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/App.tsx`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED


---

### [PATCH-05] Drag-to-Unlock `art` Node, `450ms` Rainbow Fade-In & Persistent Discovery
- **Date**: 2026-11-14 08:33:00 UTC
- **Feedback Source**: User Review Follow-up (PR #16)
- **Reported Issue**:
  1. Keep `art-wip` locked (no title pill, no color change, no hover card, no inspector drawer even on hover/click) until it is dragged to make at least one connection with an `'art'`-tagged node.
  2. Allow `art-wip` to create proximity connections while still unrevealed and in motion.
  3. On its first connection, quickly fade in the rainbow color (`450ms`) and unlock normal title, hover, and inspector behavior.
  4. Persist the unlocked state and discovered connections in `localStorage` (`portfolio_art_state`) so neither `"Reset layout"` nor page reloads reset it.
- **Root Cause**: `PATCH-04` gated proximity latching on prior click (`revealedRef`) and cleared `art-wip` reveal/connections on reset/reload.
- **Target Files**: `src/utils/artDiscovery.ts`, `src/utils/artDiscovery.test.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `e2e/portfolio.spec.ts`.
- **Verification Command**: `npm run typecheck && npm run build && npm run test:unit && CI=1 npx playwright test --config=./playwright.config.ts && npx openspec validate "art-wip-rainbow-node" --strict`
- **Status**: APPLIED
