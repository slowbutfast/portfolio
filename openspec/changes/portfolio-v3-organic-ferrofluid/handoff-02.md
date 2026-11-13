# Surgical Patch Handoff: OpenSpec Change 'portfolio-v3-organic-ferrofluid' [PATCH-02]

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `portfolio-v3-organic-ferrofluid` (Target Branch: `feat/portfolio-v3-organic-ferrofluid` / PR #12)
- **Patch ID**: `PATCH-02`
- **Objective**: Consolidate the 3-dot dropdown to a singular `"Reset"` button (clearing filters, layout, and visited node colors), restrict crosshair cursor to node hover/drag, switch edge filtering to active-pair-only (`||`), draw 1–3 stacked shared-tag pills on focal edges, remove `[CLI Specimen]` badges, reorder Grid card header/subtitle layout (codified in `DESIGN.md`), and append updated media specs to GitHub Issue `#9`.
- **Feedback & Diagnostic Trace**:
  ```
  1. 3-dot dropdown shows two reset buttons; keep a single "Reset" button that resets filters, layout, AND visited node colors.
  2. Canvas cursor should turn into crosshair ONLY when hovering/dragging a node.
  3. Filtering should illuminate an edge ONLY when both endpoint nodes are active (not all outgoing edges from one active node).
  4. Display 1–3 shared tags stacked vertically and center-aligned in pill style (LABEL_FONT + tokens.bg) on focal/hovered edges.
  5. In Grid view, place project title inline to the right of the index ("01  OpenDungeon"), summary directly below, and codify in DESIGN.md.
  6. Remove [CLI Specimen] from inset terminals in ListView & NodeHoverCard, and append the updated project media list (without [CLI Specimen]) to GitHub Issue #9.
  ```
- **Root Cause Analysis**:
  - `ControlsOverlay.tsx` renders both `reset-filters` and `reset-layout`; `App.tsx` `resetFilters` does not reset `visitedIds` or `layoutResetVersion`.
  - `src/styles.css` applies `cursor: crosshair` to the entire `.canvas-interactive`.
  - `GraphCanvas.tsx` computes `isDim = dimmed.has(edge.source) && dimmed.has(edge.target)` instead of `||`, and omits focal edge tag pills.
  - `ListView.tsx` renders `index` -> `CardPreview` -> `title` -> `summary`, and `ListView.tsx`/`NodeHoverCard.tsx` render `[CLI Specimen]`.

## 2. Strict Target Context Map (on `feat/portfolio-v3-organic-ferrofluid`)
| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `src/components/ControlsOverlay.tsx` | `L1`, `L201-L222` | Remove `RotateCcw` import (if unused) and duplicate `"Reset"` (`data-testid="reset-filters"`) button; rename `"Reset layout"` button text and `aria-label` to `"Reset"` (keep `data-testid="reset-layout"` or update tests consistently). |
| `src/App.tsx` | `L51`, `L249-L253`, `L283` | Update reset handler passed to `ControlsOverlay` so clicking `"Reset"` resets filters/search (`setActiveTags(new Set())`, `setSearch('')`), increments `layoutResetVersion`, and clears `visitedIds` (`setVisitedIds(new Set())` + localStorage visited key if stored). |
| `src/styles.css` | `L111-L113` | Change `.canvas-interactive` from `cursor: crosshair` to `cursor: default`. |
| `src/components/GraphCanvas.tsx` | `L418`, `L455-L465`, `L910-L970` | Change `isDim` to `dimmed.has(edge.source) \|\| dimmed.has(edge.target)`; for focal (`isFocal && !isDim`) non-detached permanent edges, draw `edge.tags.slice(0, 3)` stacked vertically centered at `((a.x + b.x) / 2, (a.y + b.y) / 2)` using `LABEL_FONT`, `tokens.bg` `roundRect` pill, and `tokens.accent` text (after bridges, before nodes); set `canvas.style.cursor = 'crosshair'` only when `hitNode(p.x, p.y) !== null` or `sim.state === 'drag'`, else `'default'`. |
| `src/components/ListView.tsx` | `L70-L72`, `L103-L121` | Remove `[CLI Specimen]` pill; move `<h2>{project.title}</h2>` inline to the right of `{index}` (`01`) in the header row, and move `<p>{project.summary}</p>` directly below the number + title row, above `<CardPreview />`. |
| `src/components/NodeHoverCard.tsx` | `L65-L69` | Remove `CLI specimen` subtitle from the fallback terminal preview. |
| `DESIGN.md` | `L166-L167`, `L209`, `L236-L237`, `L258` | Codify Grid card hierarchy (`index + title` row -> `summary` subtitle -> `16:9` media -> `tags`), 3-dot overflow menu with singular `"Reset"`, and node-hover-only crosshair cursor. |
| `e2e/portfolio.spec.ts` | Relevant assertions | Update reset button selectors/assertions (filters + layout + visited colors), node-hover-only crosshair cursor, active-pair (`||`) edge filtering, and Grid layout order. |
| GitHub Issue `#9` | `gh issue comment 9` | Append comment with updated media requirements: `open-dungeon` (screenshot of main game page + node view), `pict-climate-risk-viz-chatbot` (screenshot w/ map view of main + side project), `transcribe-plus` (demo video navigating menus & clicking buttons), `sandwave-sim` (demo video replacing static screenshot), `attention-max` (updated non-bugged app screenshot), `kintsugi-fracture` (demo video replacing terminal, incl. inspector window), `ivy-film-festival-2026` (demo video replacing terminal). |

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the files specified in the Target Context Map (plus `tasks.md`, `patch.md`, and `verification.md`).
- **FORBIDDEN**:
  - Do NOT alter the physics/bridge curvature math from `PATCH-01`.
  - Do NOT modify `.env` or credential files.
- **INVARIANTS TO PRESERVE**:
  - All 8 nodes and 13 permanent edges remain intact; `prefers-reduced-motion` continues to work cleanly; zero Axe accessibility violations.

## 4. Visual & UI Impact
- **Canvas**: Edge tag pills reuse `LABEL_FONT` (`500 12px "Helvetica Neue", ...`), `tokens.bg` pill fill, `pillHeight = 20`, and `tokens.accent` text; cursor is `'crosshair'` only over nodes.
- **Grid (`ListView`)**: `01  Title` inline header -> `summary` subtitle -> `16:9` preview -> tag pills.

## 5. Reproduction & Verification Protocol
1. **Reproduce First**: Update/add `P02.1` E2E tests in `e2e/portfolio.spec.ts` and confirm they fail before implementation.
2. **Apply Minimal Fix**: Implement `P02.2`–`P02.4` strictly within the Target Context Map and post the `gh issue comment 9` media update.
3. **Full Regression Suite**: Run `npm run typecheck && npm run test:unit && npm run build && npm run test:e2e && npx openspec validate --changes` and confirm 100% pass.

## 6. Surgical Patch Checklist
- [ ] P02.1 Scaffold/update failing tests in `e2e/portfolio.spec.ts` and confirm failure.
- [ ] P02.2 Implement `P02.2` in `ControlsOverlay.tsx` and `App.tsx`.
- [ ] P02.3 Implement `P02.3` in `src/styles.css` and `GraphCanvas.tsx`.
- [ ] P02.4 Implement `P02.4` in `ListView.tsx`, `NodeHoverCard.tsx`, `DESIGN.md`, and post `gh issue comment 9`.
- [ ] P02.5 Run full verification suite, update `verification.md`, mark `PATCH-02` `RESOLVED` in `patch.md`, and check off `tasks.md`.
