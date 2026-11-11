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
- **Status**: PENDING
