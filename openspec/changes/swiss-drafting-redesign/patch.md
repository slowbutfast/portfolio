### [PATCH-01] Ferrofluid Minimalist Design Refinement
- **Date**: 2026-11-11 17:46:00 UTC
- **Feedback Source**: User Visual Review & Design Alignment Critique
- **Reported Issue**:
  > "visually i think the website still looks very maximal in terms of its ui. some examples include the background grid (which i find unnecessary), the bracketted tags around each of the project filter options (which functionally i like a lot, although design-wise i think is too maximal), and even things like the subtitle 'NODE GRAPH SPECIMEN // 06 NODES,' graph icon which i find redundant, and crosshair like node designs, when i was just looking for like a black circle, that moved and interacted with the other nodes almost like ferrofluid with a magnet underneath, but purely in 3D without and shadows/contours."
- **Root Cause**:
  Literal over-interpretation of transient drafting annotations in the inspiration video (CAD crosshairs, concentric rings with ticks, background grid wallpaper, bracketed tags) as persistent UI decorations, violating the Swiss Modernist principle of purposeful negative space (focal vacancy / Ma) and cluttering the organic magnetic interaction of the nodes.
- **Target Files**:
  - `DESIGN.md`: Update tokens to reflect pure obsidian void, unadorned circular primitives, and clean typographic tags.
  - `src/styles.css`: Remove `.drafting-grid` background; remove bracket pseudo-elements from `.bracket-tag`; keep quiet typographic pill styling.
  - `src/components/ControlsOverlay.tsx`: Remove subtitle, corner crop marks, and redundant graph icon; streamline to pure typographic brand mark and clean tag labels.
  - `src/components/GraphCanvas.tsx`: Remove center crosshairs (`+`) and outer tick rings; render nodes as pure, unadorned solid circular primitives; render organic magnetic fluid bridges (metaball meniscus) between connected nodes in proximity; remove mechanical distance callouts (`d: 142px`).
  - `src/components/ListView.tsx`: Remove `.drafting-grid` background styling.
  - `e2e/portfolio.spec.ts`: Update any assertions checking for crop marks or bracket tags while preserving all functional selectors.
- **Expected Resolution**:
  The interface presents a deep, vast, unadorned black void where pure circular node primitives interact with organic magnetic fluid cohesion (ferrofluid behavior), framed by quiet, uncluttered Swiss typography. All unit, e2e, and lint tests pass.
- **Status**: RESOLVED (commit `9b6841d`)

### [PATCH-02] Fluid Minimalist & Organic Constructivist UI Refinement
- **Date**: 2026-11-12 01:10:00 UTC
- **Feedback Source**: User Design Direction & Visual Brain-Dump Review
- **Reported Issue**:
  > - Change secondary color from cyan to #003399 (International Klein Blue / classic cobalt).
  > - Remove grayscale from node connections, keep connections pure white if connected.
  > - Change cursor to crosshair (+).
  > - Redesign UI: replace filter bar and search bar with a compact dropdown carat (▾); move graph/list view options into that dropdown.
  > - Remove sys.portfolio title and bottom-left coordinate bar.
  > - Make default view of nodes ~20% larger.
  > - Alter animations to use tangent-continuous Bézier fillets / metaballs with dynamic tension and flared attachments.
  > - Improve project titles readability over connections using a background knockout pill (Option 1).
  > - Transform project view window into an interactive floating canvas HUD tooltip directly adjacent to the clicked node (Option A).
  > - Remove caption "PL-04 // BUILD // 685c065 LOCAL AUDIO TRANSCRIPTION // MONOREPO".
  > - Remove terminal pane for all projects except agentic-resume-builder.
  > - Change default font for the whole website to Helvetica.
  > - Add alternate light theme with off-white canvas (#f6f6f4) and black nodes.
  > - Mark visited nodes with hyperlink cobalt scheme (Variant 1: #003399 in light, #3d7fff in dark).
  > - Redesign general UI chips, buttons, menus to be circular and fluid (rounded-full).
- **Root Cause**:
  The user desires a fully distilled, fluid-constructivist aesthetic that merges Swiss typography (Helvetica, binary high contrast, radical reduction of persistent HUD furniture) with organic physics (ferrofluid metaballs, circular primitives, floating HUD inspector tooltips) and full theme versatility.
- **Target Files**:
  - `DESIGN.md`
  - `src/styles.css`
  - `src/types/portfolio.ts`
  - `src/physics/graphSimulation.ts`
  - `src/components/ControlsOverlay.tsx`
  - `src/components/GraphCanvas.tsx`
  - `src/components/ProjectDrawer.tsx`
  - `src/components/ListView.tsx`
  - `src/App.tsx`
  - `e2e/portfolio.spec.ts`
- **Expected Resolution**:
  The portfolio operates in pure Fluid Minimalist mode with a clean void canvas, crosshair cursor, 20% larger circular nodes, pure binary connections, floating carat dropdown for filters/views/theme, floating video-game HUD inspector tooltip, background knockout title pills, Helvetica typography, and dual light/dark themes. All unit, e2e, and lint tests pass.
- **Status**: RESOLVED


### [PATCH-03] Visual Portfolio Showcase, Floating Top Bar & Hover Media Refinement
- **Date**: 2026-11-12 01:42:00 UTC
- **Feedback Source**: User Visual Review & 52-Screenshot Empirical Audit
- **Reported Issue**:
  > 1. Identity & Structure: The site feels like an anonymous art piece rather than an unmistakable portfolio for Gregory Lazatin. Add a floating top bar (with zero pill/background container) with "Gregory Lazatin" on the top-left and "About", "GitHub" (slowbutfast), "Grid" / "Graph", and "Filters ▾" on the top-right.
  > 2. Discoverability: Nodes are visually opaque on first paint. Gliding the cursor across any node should instantly pop up a rich floating media card displaying the video clip/screenshot, title, tags, and summary.
  > 3. About Page: Provide an accessible "About Me" modal dialog with bio, focus areas, contact, and GitHub link.
  > 4. Title Pills: Remove the 1px border stroke around project title pills on the canvas; keep just the solid background knockout fill (tokens.bg).
  > 5. Reduced-Motion Filter Bug: In prefers-reduced-motion mode, toggling filter tags fails to dim non-matching nodes because the animation loop is inactive and no repaint is triggered.
  > 6. Residual CAD Captions: Remove remaining "PROJECT INDEX // 06 ENTRIES", "ASYMMETRIC PUBLICATION", and "PL-01 // ..." lines in ListView.tsx, and figcaptions in MediaView.tsx.
  > 7. Deep-Link Anchoring: Cold-loading #/p/:id centers the tooltip in the viewport instead of anchoring beside the deep-linked node.
- **Root Cause**:
  Lack of visual media exposure up front in the node graph, absence of author branding/navigation, residual drafting labels in secondary views, missing reactive repaint trigger in reduced motion, and uninitialized anchor coordinates on deep-link load.
- **Target Files**:
  - `DESIGN.md`
  - `src/components/AboutModal.tsx` (new)
  - `src/components/NodeHoverCard.tsx` (new)
  - `src/components/ControlsOverlay.tsx`
  - `src/components/GraphCanvas.tsx`
  - `src/components/ProjectDrawer.tsx`
  - `src/components/ListView.tsx`
  - `src/components/MediaView.tsx`
  - `src/App.tsx`
  - `src/types/portfolio.ts`
  - `e2e/portfolio.spec.ts`
- **Expected Resolution**:
  The website acts as an immediate, stunning portfolio for Gregory Lazatin with instant hover media cards on the graph, an uncluttered floating top bar, an About modal, stroke-free title knockout pills, 100% clean reduced-motion filtering, anchored deep links, and zero residual CAD captions. All tests and linter suites pass.
- **Status**: RESOLVED
