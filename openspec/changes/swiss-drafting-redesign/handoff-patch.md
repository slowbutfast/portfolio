# Surgical Patch Handoff: OpenSpec Change 'swiss-drafting-redesign' [PATCH-01]

You are the surgical patch implementation agent running in OpenCode.
Your directive is to execute **`PATCH-01`** on the `swiss-drafting-redesign` change, strictly refining the visual and design layer to achieve **pure generative minimalism with ferrofluid / magnetic node dynamics**, stripping away maximalist CAD clutter while preserving all existing physics mechanics, routing, and accessibility contracts.

---

## 1. Executive Objective & Diagnostic Feedback
- **Change Name**: `swiss-drafting-redesign`
- **Patch ID**: `PATCH-01`
- **Objective**: Strip maximalist CAD drafting ornaments (background grid, crosshairs, concentric tick rings, bracketed tags, subtitle stamps, corner crop marks) and refine node rendering to **pure, solid circular primitives with organic magnetic fluid bridges (ferrofluid behavior)** in an expansive black void.
- **Feedback & Diagnostic Trace**:
  > "visually i think the website still looks very maximal in terms of its ui. some examples include the background grid (which i find unnecessary), the bracketted tags around each of the project filter options (which functionally i like a lot, although design-wise i think is too maximal), and even things like the subtitle 'NODE GRAPH SPECIMEN // 06 NODES,' graph icon which i find redundant, and crosshair like node designs, when i was just looking for like a black circle, that moved and interacted with the other nodes almost like ferrofluid with a magnet underneath, but purely in 3D without and shadows/contours."
- **Root Cause Analysis**:
  Literal over-interpretation of transient video animation devices as permanent visual UI styling. This violated the core Swiss Modernist tenet of **purposeful negative space (focal vacancy / Ma)** by cluttering the void with grid lines, HUD stamps, and CAD crosshairs, instead of letting pure geometric forms and physical tension serve as the primary visual subject.

---

## 2. Strict Target Context Map

| File Path (relative to repo root) | Target Lines | Modification Summary |
|---|---|---|
| `DESIGN.md` | L30–L130 | Remove grid wallpaper tokens; specify pure black void (`#0a0a0c`), unadorned circular primitives, and organic fluid meniscus bridges |
| `openspec/changes/swiss-drafting-redesign/design.md` | L30–L120 | Mirror updated `DESIGN.md` tokens and ferrofluid aesthetic rationale |
| `src/styles.css` | L36–L80 | Remove `.drafting-grid` background linear-gradients; remove `.bracket-tag::before` and `::after` content brackets; style tags as quiet, clean typography pills |
| `src/components/ControlsOverlay.tsx` | L43–L150 | Remove subtitle `"NODE GRAPH SPECIMEN // 06 NODES"`, remove corner crop mark `<div>`s, remove redundant network icon; keep title clean (`SYS.PORTFOLIO`); preserve all accessible names (`Graph`, `List`, `LLM`) |
| `src/components/GraphCanvas.tsx` | L180–L260 | Remove center crosshairs (`+`) and outer concentric tick rings; render nodes as pure, stark, solid circles ($r = 18\text{px}$); render organic magnetic fluid bridges (metaball meniscus connecting nodes in proximity); remove mechanical distance callouts (`d: 142px`); retain font gate, cached tokens, and rAF ticker |
| `src/components/ListView.tsx` | L25–L35 | Remove `.drafting-grid` class from container; retain asymmetric 2-column Swiss layout |
| `e2e/portfolio.spec.ts` | L20–L110 | Remove any tests expecting bracket glyphs in DOM; ensure clean button queries (`getByRole('button', { name: 'Graph' })`), tag pills, and Axe audit pass with 0 errors |

---

## 3. Blast Radius & Invariant Guardrails
- **STRICT BLAST RADIUS**: Modify ONLY the 7 files listed in the Target Context Map.
- **FORBIDDEN**:
  - Do NOT alter core physics forces (`d3-force` charge, weak centering, velocity decay).
  - Do NOT alter project catalog schemas, IDs, preview mappings, or terminal demo commands.
  - Do NOT modify `package.json`, `package-lock.json`, or install new dependencies.
  - Do NOT break existing functional tests (`data-testid`, focus trapping, Escape dismissal, hash routing).
- **INVARIANTS TO PRESERVE**:
  - All 27 Vitest unit tests must continue to pass.
  - All 33 Playwright e2e tests must continue to pass (with updated assertions where brackets were removed).
  - `npx @google/design.md lint DESIGN.md` must pass with 0 errors.
  - WCAG AA accessibility compliance (single `<h1>`, 3:1 interactive boundaries, clean button names).

---

## 4. Visual & UI Impact: The "Fluid Precision" Aesthetic

### A. The Void (Negative Space / Ma)
- Strip the 40px grid pattern in `src/styles.css`:
  ```css
  /* Pure, unobstructed black void */
  .drafting-grid {
    background-color: var(--color-bg);
  }
  ```
- Remove all 4 corner crop mark elements from `ControlsOverlay.tsx`.

### B. Clean Typographic Tags (No Brackets)
- Update `.bracket-tag` in `src/styles.css` (or rename to `.tag-pill`):
  - Remove `.bracket-tag::before { content: '['; }` and `::after { content: ']'; }`.
  - Tags are quiet, minimal monospaced typographic labels with a subtle 1px border (`#71717a`).
  - Active tags invert with surgical cyan (`#00f0ff`) text and border.

### C. Pure Circular Primitives & Ferrofluid Meniscus
- In `GraphCanvas.tsx`:
  - **Node Silhouettes**: Draw pure flat filled circles with crisp edges:
    ```ts
    ctx.beginPath();
    ctx.arc(x, y, n.radius, 0, Math.PI * 2);
    ctx.fillStyle = isFocused ? tokens.cyan : tokens.text;
    ctx.fill();
    ```
    *(No inner crosshairs `+`, no outer concentric rings with ticks).*
  - **Ferrofluid / Magnetic Meniscus Bridges**:
    When two connected nodes are in proximity ($d < 160\text{px}$), draw a smooth organic fluid bridge between them using quadratic/cubic Bézier curves connecting the tangent contact points of the two circles (metaball fluid bridge), narrowing at the waist as distance increases.
  - **Focal Hover**: When a node is hovered or focused, highlight the node in surgical cyan and render its incident fluid bridges in luminous cyan, omitting mechanical CAD distance text (`d: 142px`).

### D. Streamlined Header
- In `ControlsOverlay.tsx`:
  - Retain `SYS.PORTFOLIO` in clean Space Grotesk.
  - Remove `"NODE GRAPH SPECIMEN // 06 NODES"` and remove the decorative green/cyan dot.

---

## 5. Reproduction & Verification Protocol

### 1. Targeted Unit Tests
```bash
npm run test:unit
```
*Assert all 27 unit tests pass (including WCAG 1.4.11 boundary contrast assertions).*

### 2. Design System Linting
```bash
npx @google/design.md lint DESIGN.md
```
*Assert 0 errors, 0 warnings.*

### 3. End-to-End Suite
```bash
npm run test:e2e
```
*Assert all Playwright tests pass: axe accessibility scan (0 violations), accessible button queries, tag dimming, and drawer operations.*

### 4. TypeScript Typecheck & Production Build
```bash
npm run typecheck
npm run build
```
*Assert zero TypeScript errors and zero `data:font` occurrences.*

---

## 6. Patch Implementation Tasks

- [ ] P01.1 Update `DESIGN.md` and `design.md` removing background grid, brackets, and crosshairs in favor of pure primitives and fluid magnetic tension
- [ ] P01.2 Purge `.drafting-grid` lines and `.bracket-tag` pseudo-element brackets in `src/styles.css`
- [ ] P01.3 Streamline `src/components/ControlsOverlay.tsx` removing subtitle, corner crop marks, and redundant graph icon
- [ ] P01.4 Refactor `src/components/GraphCanvas.tsx` to strip crosshairs/outer tick rings, render pure solid circular primitives, and implement organic ferrofluid meniscus bridges between connected nodes in proximity
- [ ] P01.5 Strip `.drafting-grid` from `src/components/ListView.tsx`
- [ ] P01.6 Update `e2e/portfolio.spec.ts` for clean tag rendering and run full regression suite (`typecheck`, `unit`, `e2e`, `@google/design.md lint`)

---

## 7. Post-Patch Obligations
When implementation is complete:
1. Ensure all tasks in Section 6 are marked `- [x]`.
2. Update `openspec/changes/swiss-drafting-redesign/patch.md` marking `PATCH-01` as `RESOLVED`.
3. Commit the changes to `feat/swiss-drafting-redesign` and push to GitHub (`git push origin feat/swiss-drafting-redesign`).
4. Update PR #2 with the refined screenshot/diff summary.
