## Why

Evaluations by independent technical reviewers and user design directives identified that while the organic constructivist physics and visual aesthetic are strong, the portfolio requires both candidate conversion improvements and aesthetic geometric refinement:
1. Recruiters lack quick contact actions, while the About screen carried redundant subtitles and empty focus area tags.
2. The initial force graph settled into tangled link crossings due to an unnested $K_4$ seed layout.
3. Fluid bridge connections suffered from asymmetric, lopsided bowing because control points were not mirrored across edge axes.
4. The site defaulted to dark theme with contrast deficiencies on light container surfaces, while the theme toggle was buried inside a dropdown.
5. Typography lacked a standardized Swiss hierarchy (Helvetica, Helvetica Light, and Menlo for monospace).

This change refines the portfolio into a high-converting, aesthetically balanced engineering showcase with bilateral fluid geometry, planar resting states, default light theme, and clean recruiter conversion paths.

## What Changes

- **Typography Standardization**: Sets primary font to Helvetica / Helvetica Neue, secondary font to Helvetica Light (`font-weight: 300`), and monospace font to Menlo across technical displays and terminals.
- **Default Light Theme & High-Contrast Tokens**: Defaults new visitors to Light theme, hardens contrast tokens (`--color-muted: #525257`, `--color-outline: #71717a`, dark `--color-brand: #3d7fff`), and prevents dark-user flash via `public/theme-init.js`.
- **Top-Right Header Sequence**: Elevates the theme toggle to the top-right header, following the order: `About` &bull; `GitHub ↗` &bull; `Graph` / `Grid` &bull; `Dark` / `Light` &bull; `Filters ▾`.
- **Canonical About Me Screen**: Replaces placeholder/statement text with canonical Brown University bio, removes the subtitle and focus areas, and mounts Email, LinkedIn, GitHub, and Resume directly at the top.
- **Inspect Modal Tab Separation**: Separates `Media` and `Terminal` tabs into a distinct segmented pill track, while elevating `Code ↗` and `Visit ↗` directly into the sticky header.
- **Planar Initial Graph Embedding**: Implements proven planar seeds (`PLANAR_NODE_SEEDS`) with `sandwave-sim` nested inside the $K_4$ triangle, backed by weak seed-homing forces (`strength: 0.02`) and shared with reduced-motion static layouts.
- **Bilateral Symmetrical Bézier Bridges**: Implements pure mathematical bridge geometry (`computeBridgeGeometry`) with true C1 tangent continuity, normal-mirrored control points, waist clamping, and close-node inversion guards.
- **CSP & Content Security**: Updates `vercel.json` CSP with `frame-src 'self' https://drive.google.com;` and synchronizes with `SPEC_CSP` guard tests.
- **Global Design System Documentation**: Formally documents all typography scales, theme tokens, and bridge geometry rules in `DESIGN.md`.

## Capabilities

### New Capabilities

- `candidate-profile`: Defines the typed candidate identity schema and profile records (`src/data/profile.ts`), supplying canonical branding, contact endpoints, social links, resume URLs, and the verified Brown University bio narrative.

### Modified Capabilities

- `portfolio-controls`: Adds default Light theme initialization, top-right header controls (`About`, `GitHub`, `Graph`/`Grid`, `Dark`/`Light`, `Filters`), progressive scroll scrim, first-paint flash prevention (`public/theme-init.js`), and top-mounted recruiter contact links in About modal.
- `project-drawer`: Elevates `Code ↗` and `Visit ↗` into permanent sticky header actions, separates preview tabs into a distinct segmented container track, and applies `max-h-[85dvh]` on mobile.
- `project-catalog`: Requires mandatory `shortTitle: string` across all catalog items, and defines visual 16:9 thumbnail previews with CLI fallback for `ListView`.
- `graph-simulation`: Establishes planar seed coordinates (`PLANAR_NODE_SEEDS`), weak seed-homing forces (`strength: 0.02`), reduced-motion static layout from seeds, and bilaterally symmetric C1-tangent fluid bridge geometry with close-node guards.
- `edge-deployment`: Extends `vercel.json` CSP with `frame-src 'self' https://drive.google.com;` and coordinates with `SPEC_CSP` guard assertions.

## Impact

- **Configuration**: `vercel.json` CSP header modified to allow `https://drive.google.com` frames; synchronized with `src/utils/csp.ts` `SPEC_CSP`.
- **Global Design**: `DESIGN.md` updated with Helvetica, Helvetica Light, Menlo, contrast tokens, and bilateral bridge geometry.
- **Data Layer**: New `src/data/profile.ts` and `src/data/graphSeeds.ts`; updated `src/types/portfolio.ts` with required `shortTitle: string`.
- **Math & Physics**: New `src/utils/bridgeGeometry.ts`; updated `src/physics/graphSimulation.ts` with seed homing forces and `SimulationNode` typing.
- **Components**: `AboutModal.tsx`, `ControlsOverlay.tsx`, `ProjectDrawer.tsx`, `GraphCanvas.tsx`, `ListView.tsx`, `App.tsx`.
- **Tests**: New unit tests for bridge geometry and graph planarity; updated E2E tests for light default and header sequence.
