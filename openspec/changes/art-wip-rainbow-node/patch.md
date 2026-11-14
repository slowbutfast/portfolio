# Patch Ledger: `art-wip-rainbow-node`

## Patch Ledger
| Patch ID | Date | Trigger / Feedback Source | Target Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH-01` | 2026-11-14 | User Review Feedback on PR #16 | `src/types/portfolio.ts`, `src/data/projects.ts`, `src/utils/rainbowPulse.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/App.tsx`, `src/components/ProjectDrawer.tsx`, `src/components/ListView.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |
| `PATCH-02` | 2026-11-14 | User Review Follow-up on PR #16 | `src/types/portfolio.ts`, `src/data/projects.ts`, `src/physics/graphSimulation.ts`, `src/components/GraphCanvas.tsx`, `src/data/projects.test.ts`, `src/physics/graphSimulation.test.ts`, `e2e/portfolio.spec.ts` | APPLIED |

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
