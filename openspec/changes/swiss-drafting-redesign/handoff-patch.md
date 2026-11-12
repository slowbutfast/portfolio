# Surgical Patch Handoff: OpenSpec Change 'swiss-drafting-redesign' [PATCH-02]

You are the surgical patch implementation agent.
Your directive is to execute **`PATCH-02`** on the `swiss-drafting-redesign` change, implementing the **Fluid Minimalist & Organic Constructivist UI Refinement** per the user's approved design specifications.

---

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `swiss-drafting-redesign`
- **Patch ID**: `PATCH-02`
- **Title**: Fluid Minimalist & Organic Constructivist UI Refinement
- **Objective**:
  Transition the portfolio interface into an expansive, uncluttered visual void where 20% larger solid circular primitives interact with organic ferrofluid Bézier bridges. Replace the persistent top banner and coordinate ticker with a compact floating carat dropdown (`Filters ▾`), float the project inspector directly adjacent to the clicked node as a video-game HUD tooltip (Option A), apply background knockout pills behind project titles (Option 1), mark visited nodes in hyperlink cobalt (Variant 1), restrict the terminal pane to `agentic-resume-builder` only, adopt Helvetica typography, and introduce a warm off-white Light Theme alongside the dark canvas.
- **Diagnostic Feedback & Design Decisions**:
  ```text
  1. Secondary Accent: Shift from cyan to International Klein Blue (#003399) in Light Mode, with dark-calibrated cobalt (#3d7fff) in Dark Mode to guarantee WCAG AA contrast.
  2. Pure Binary Connections: Remove all grayscale/alpha fading on active connections. Connected nodes render pure white (#ffffff) in Dark Mode and pure black (#000000) in Light Mode.
  3. Cursor: Set canvas cursor to crosshair (+) via `cursor: crosshair`.
  4. Floating Carat Dropdown: Replace top banner and search bar with a compact floating pill button with a carat (▾). Move View Mode (Graph/List), Search Input, Stack Filter Pills, Reset Button, and Theme Toggle into the dropdown popover.
  5. Remove Header & Telemetry: Remove visible `SYS.PORTFOLIO` title (keep `<h1 className="sr-only">Portfolio</h1>` for accessibility) and remove the bottom-left coordinate bar (`X: --- Y: ---`).
  6. Node Scale: Increase canonical node radius by ~20% from 18px to 22px, with proportional collision (36px) and link distance (210px).
  7. Ferrofluid Metaball Bridges: Refine connection geometry to use tangent-continuous cubic Bézier fillets with flared circular attachments and a dynamic pinched waist that thins under tension.
  8. Title Occlusion (Option 1): Render a background-matched rounded pill behind project title text to prevent intersecting connections from obstructing legibility.
  9. Floating Tooltip HUD (Option A): Transform ProjectDrawer into a floating canvas inspector card positioned directly adjacent to the clicked node (with canvas boundary clamping), featuring circular close button and pill controls.
  10. Caption & Classification Removal: Remove "PL-04 // BUILD // 685c065" and "LOCAL AUDIO TRANSCRIPTION // MONOREPO" from the project view.
  11. Terminal Scoping: Render the terminal simulator tab ONLY for `agentic-resume-builder`. For all other projects, display Media and Link tabs directly.
  12. Typography: Switch default website font from Space Grotesk to Helvetica / Helvetica Neue.
  13. Dual Themes: Dark Theme (deep black void #0a0a0c, white nodes) and Light Theme (warm off-white #f6f6f4, black nodes, Klein Blue #003399 accent).
  14. Visited Node Tracking (Variant 1): Mark clicked nodes with hyperlink cobalt (#003399 in light, #3d7fff in dark), persisting in localStorage.
  15. Fluid UI Geometry: Replace sharp rectangular boxes (`rounded-none`) with circular and pill styling (`rounded-full` for chips/pills/buttons, `rounded-2xl` for dropdown/tooltip card).
  ```

---

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `DESIGN.md` | `L1–157` | Update design specification frontmatter and Markdown body to define the Fluid Minimalist system (Helvetica, `#003399`, fluid `rounded-full` pills, dual light/dark themes, metaball physics). Must pass `@google/design.md lint`. |
| `src/styles.css` | `L1–80` | Update font stack to Helvetica, add dual light/dark color tokens, set canvas cursor to `crosshair`, and update `.bracket-tag` to `.fluid-pill` (`rounded-full`). |
| `src/types/portfolio.ts` | `L1–75` | Add `ThemeMode` (`'dark' \| 'light'`), add `visited?: boolean` to `GraphNode`. |
| `src/physics/graphSimulation.ts` | `L45–55, L78–120` | Scale `NODE_RADIUS = 22;`, `COLLIDE_RADIUS = 36;`, `LINK_DISTANCE = 210;`. |
| `src/components/ControlsOverlay.tsx` | `L1–155` | Replace top banner and bottom ticker with a floating pill button with carat (`Filters ▾`) expanding into a floating popover with view toggle, search bar, stack filter pills, reset button, and light/dark theme switch. |
| `src/components/GraphCanvas.tsx` | `L37–69, L76–136, L200–280, L485–499` | Implement tangent-continuous Bézier fillets with dynamic tension waist, render pure white/black connections (no grayscale), draw background knockout pills for project titles, render visited nodes in cobalt, apply `cursor: crosshair`. |
| `src/components/ProjectDrawer.tsx` | `L1–294` | Transform into a floating canvas HUD tooltip positioned adjacent to the clicked node (Option A); remove plate/build/classification captions; restrict terminal tab to `agentic-resume-builder` only; adopt circular/pill buttons. |
| `src/components/ListView.tsx` | `L24–88` | Reduce top padding from `pt-60` to `pt-24`, adopt `.fluid-pill` tags, and integrate theme tokens. |
| `src/App.tsx` | `L14–37, L61–80, L111–168` | Manage theme state (`'dark' \| 'light'`), manage visited node IDs (`Set<string>`), remove coordinate ticker, render `<h1 className="sr-only">Portfolio</h1>`. |
| `e2e/portfolio.spec.ts` | `L22–237` | Update test selectors for carat dropdown, update terminal test to target `agentic-resume-builder`, remove coord ticker test, verify WCAG A/AA across both themes. |

---

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the 10 files specified in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT modify project IDs, summaries, preview URLs, or topological links in `src/data/projects.ts` or `src/utils/graphTopology.ts`.
  - Do NOT break keyboard accessibility (Escape to dismiss tooltip, Tab focus trapping, arrow navigation).
  - Do NOT introduce un-themed hardcoded colors; bind all visual elements to CSS variables or cached tokens.
- **INVARIANTS TO PRESERVE**:
  - All existing unit tests (19/19) must pass.
  - All e2e tests must pass, with 0 Axe-core WCAG A/AA violations in Graph view, List view, and open Project tooltip across both Dark and Light themes.
  - `npx @google/design.md lint DESIGN.md` must pass with 0 errors.

---

## 4. Implementation Details by Component

### A. Design Tokens & CSS (`DESIGN.md` & `src/styles.css`)
- **Font Stack**:
  ```css
  --font-sans: 'Helvetica Neue', Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;
  ```
- **Dark Theme (`:root`)**:
  - `--color-bg: #0a0a0c;`
  - `--color-surface: #121316;`
  - `--color-surface-container: #18191e;`
  - `--color-text: #ffffff;`
  - `--color-muted: #8e8e93;`
  - `--color-outline: #71717a;`
  - `--color-accent: #3d7fff;` /* Electric cobalt (5.4:1 contrast on #0a0a0c) */
  - `--color-brand: #003399;`
  - `--color-node-unvisited: #ffffff;`
  - `--color-node-visited: #3d7fff;`
  - `--color-connection: #ffffff;`
- **Light Theme (`[data-theme='light']`)**:
  - `--color-bg: #f6f6f4;` /* Warm Swiss museum paper */
  - `--color-surface: #ffffff;`
  - `--color-surface-container: #eae9e5;`
  - `--color-text: #0a0a0c;`
  - `--color-muted: #6c6c70;`
  - `--color-outline: #c7c7cc;`
  - `--color-accent: #003399;` /* Klein Blue (9.2:1 contrast on #f6f6f4) */
  - `--color-brand: #003399;`
  - `--color-node-unvisited: #0a0a0c;`
  - `--color-node-visited: #003399;`
  - `--color-connection: #000000;`
- **Canvas Cursor**:
  ```css
  .canvas-interactive {
    cursor: crosshair;
  }
  ```
- **Fluid Pill Styling**:
  ```css
  .fluid-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 150ms ease;
  }
  ```

### B. Physics Scaling (`src/physics/graphSimulation.ts`)
- Update parameters:
  ```ts
  const NODE_RADIUS = 22; // ~20% larger than 18px
  const BOUNDARY_MARGIN = 48;
  const COLLIDE_RADIUS = 36;
  const LINK_DISTANCE = 210;
  const CHARGE_SCALE = 0.65;
  ```

### C. Controls & Floating Carat Dropdown (`src/components/ControlsOverlay.tsx`)
- Strip the top banner, `SYS.PORTFOLIO` heading, and bottom coordinate ticker.
- Add a floating trigger button in the top-right corner:
  - Accessible name: `Filters & Navigation`
  - Test ID: `controls-dropdown-trigger`
  - Contains label (e.g. `Filters ▾`) with carat SVG that rotates on open.
- Dropdown Popover (`rounded-2xl`, border, shadow, backdrop-blur):
  - Segmented View Mode Toggle: `Graph` (`data-testid="view-toggle-graph"`) and `List` (`data-testid="view-toggle-list"`).
  - Search Input (`data-testid="search-input"`): Pill-shaped with search icon.
  - Paradigm Filter Pills (`data-testid="tag-pill-${tag}"`): `.fluid-pill` rounded tags.
  - Theme Switcher: Toggle between Dark and Light mode (`data-testid="theme-toggle"`).
  - Reset Filters button (`data-testid="reset-filters"`).

### D. Canvas Rendering & Ferrofluid Bézier Bridges (`src/components/GraphCanvas.tsx`)
- **Connection Geometry**:
  - Implement tangent-continuous cubic Bézier fillets.
  - Tangent points are calculated on each circle's perimeter at angle $\theta = \pm \arcsin(\text{halfWidth} / r)$.
  - Dynamic waist formula:
    $$\text{waist} = \text{halfWidth} \times \max\left(0.12, 1 - \frac{d}{d_{\text{max}}}\right)$$
  - Pure binary colors:
    - In Dark Theme: connected edges fill with `#ffffff` (alpha 1.0).
    - In Light Theme: connected edges fill with `#000000` (alpha 1.0).
    - Dimmed edges render with alpha 0.12.
- **Node Primitives**:
  - Pure filled circles with radius $r = 22\text{px}$.
  - Unvisited: `tokens.nodeUnvisited` (`#ffffff` dark, `#0a0a0c` light).
  - Visited: `tokens.nodeVisited` (`#3d7fff` dark, `#003399` light).
  - Active/Hovered: highlighted accent.
- **Project Title Occlusion Pills**:
  - Measure label width: `w = ctx.measureText(label).width + 16`.
  - Draw rounded pill capsule: `ctx.roundRect(x - w/2, y + r + 8, w, 20, 10)` filled with `tokens.bg` and 1px border with `tokens.outline`.
  - Draw text inside pill using `ctx.fillText(label, x, y + r + 22)` in `tokens.text`.

### E. Floating Video-Game HUD Tooltip (`src/components/ProjectDrawer.tsx`)
- Anchor the inspector card adjacent to the clicked node in canvas space:
  - Convert node world coordinates $(x, y)$ to screen coordinates.
  - Offset card by $(+32\text{px}, -40\text{px})$ relative to the node, with viewport collision clamping so it stays fully visible.
  - Max dimensions: `max-w-[420px] max-h-[85vh]`, `rounded-2xl`, `border border-outline`, `bg-surface/95 backdrop-blur-md shadow-2xl`.
  - Keep `data-testid="project-drawer"`, `role="dialog"`, `aria-modal="true"`, Escape key dismiss, and Tab focus trap.
- Remove caption: strip `{plateLabel} // BUILD // {__COMMIT_HASH__}` and `{project.classification}`.
- Restrict terminal tab:
  ```ts
  if (project.id === 'agentic-resume-builder' && project.terminalDemo) {
    list.push({ kind: 'terminal', label: 'Terminal' });
  }
  ```
  All other projects show only Media and Link tabs.

### F. Application State & Accessibility (`src/App.tsx`)
- Manage `theme` state (`'dark' | 'light'`) initialized from `localStorage.getItem('portfolio_theme') || 'dark'`. Apply `data-theme` attribute to `document.documentElement`.
- Manage `visitedIds` state (`Set<string>`) initialized from `localStorage.getItem('portfolio_visited')`. On `openProject(id)`, add `id` to `visitedIds` and persist to `localStorage`.
- Provide `<h1 className="sr-only">Portfolio</h1>` for heading structure.
- Remove `coordTickerRef` and associated ticker synchronization.

### G. List View (`src/components/ListView.tsx`)
- Reduce top padding from `pt-60` to `pt-24`.
- Apply `.fluid-pill` tags and theme-aware colors.

---

## 5. Verification Protocol

### Step 1: Design System Lint
```bash
npx @google/design.md lint DESIGN.md
```
*Expected: 0 errors, 0 warnings.*

### Step 2: TypeScript Typecheck
```bash
npm run typecheck
```
*Expected: 0 diagnostics.*

### Step 3: Unit Tests
```bash
npm run test:unit
```
*Expected: 19/19 passing tests.*

### Step 4: Playwright E2E & Accessibility Tests
```bash
npm run test:e2e
```
*Expected: All tests pass, including Axe WCAG A/AA audits in Dark and Light themes.*

### Step 5: Production Build
```bash
npm run build
```
*Expected: Clean build with zero `data:font` inlined assets.*

---

## 6. Surgical Patch Checklist
- [ ] P02.1 Update `DESIGN.md` with Fluid Minimalist specification and verify `@google/design.md lint` passes.
- [ ] P02.2 Update `src/styles.css` with Helvetica stack, dual theme tokens, `cursor: crosshair`, and fluid pill classes.
- [ ] P02.3 Update `src/physics/graphSimulation.ts` with 20% larger node radius (22px), collision radius (36px), and link distance (210px).
- [ ] P02.4 Redesign `src/components/ControlsOverlay.tsx` to floating carat dropdown (`Filters ▾`).
- [ ] P02.5 Refactor `src/components/GraphCanvas.tsx` with tangent Bézier bridges, binary connection colors, text knockout pills, and visited node styling.
- [ ] P02.6 Redesign `src/components/ProjectDrawer.tsx` to floating adjacent HUD tooltip with caption and terminal restrictions.
- [ ] P02.7 Update `src/App.tsx` and `src/components/ListView.tsx` with theme state, visited tracking, and fluid pill styling.
- [ ] P02.8 Update `e2e/portfolio.spec.ts` and verify all tests and builds pass.
