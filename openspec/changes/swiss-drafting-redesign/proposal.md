## Why

The portfolio currently presents as a conventional warm-gray web application with soft rounded pill cards (`rounded-xl`) and generic filled circle nodes, diverging significantly from the high-precision Swiss Modernist and technical drafting aesthetic envisioned for the project. This change transforms the site into a mathematically authoritative typographic specimen and engineering drafting instrument, elevating internal construction mechanics into visual art while strictly maintaining performance, CSP compliance, and WCAG accessibility contracts.

## What Changes

- **Typography & Self-Hosted Variable Fonts**: Migrate away from system sans-serif to self-hosted `@fontsource-variable/space-grotesk` (editorial headings) and `@fontsource-variable/jetbrains-mono` (computational drafting micro-data) bundled locally, satisfying strict local CSP without external network requests.
- **Visual Identity & Design Tokens**: Adopt the machine-validated [`DESIGN.md`](file:///home/node/global-sandbox/projects/portfolio/DESIGN.md) system: stark binary monochrome (`#0a0a0c` obsidian canvas, `#f4f4f5` ink), zero-radius borders (`rounded: 0px`), 3:1 WCAG 1.4.11 interactive boundaries (`#52525b`), and surgical color discipline (cyan `#00f0ff` for active selection; amber `#eab308` for terminal anomalies).
- **Deconstructed Drafting Canvas Engine**: Enhance `GraphCanvas` with center crosshairs (`+`), concentric outer rings with 4 cardinal ticks, focal-only dashed tangent projection lines to connected neighbors, and incident distance callouts (`d: 142px`), gated on `document.fonts.ready` with invariant physics hit testing at $r = 18\text{px}$.
- **Peripheral HUD & Architectural Frame**: Replace floating rounded control bars with a viewport perimeter HUD featuring 4 DOM hairline corner crop marks, running headers, CSS pseudo-element bracketed tag pills (`[ TAG ]` keeping clean accessible names), and a zero-re-render direct DOM ref coordinate ticker.
- **Specimen Blueprint Drawer**: Re-architect `ProjectDrawer` into an engineering blueprint with monumental watermark numerals (`01`–`06`), deterministic plate numbers (`PL-01`–`PL-06`), build-time injected Git commit SHA, and an accessible scrambled title decoder running strictly once on open (12fps, 350ms max duration) over a permanent semantic DOM heading.
- **Swiss Editorial Publication List**: Reformat `ListView` into an asymmetric two-column academic/editorial specimen layout with monumental index numerals and monospaced technical metadata blocks.

## Capabilities

### New Capabilities
*(None; all changes evolve existing portfolio capabilities.)*

### Modified Capabilities
- `graph-simulation`: Adds technical drafting visual geometries (center crosshairs, cardinal ticks, focal-only tangent projections), gates canvas rendering on `document.fonts.ready`, and maintains invariant $r = 18\text{px}$ physics hit boundaries.
- `portfolio-controls`: Transforms overlay controls into an architectural margin HUD with DOM crop marks, unbracketed accessible button names with CSS pseudo-element brackets, and a direct DOM ref hover coordinate ticker.
- `project-catalog`: Enriches `ProjectData` with a curated `classification` string, deterministic catalog index and plate number formatters, and build-injected `__COMMIT_HASH__`.
- `project-drawer`: Introduces architectural blueprint styling, accessible scrambled title decoding via `aria-hidden` overlay, and watermark macro numerals with surgical color accents.

## Impact

- **Dependencies**: Adds `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`, and `@axe-core/playwright`.
- **Build Tooling**: Updates `vite.config.ts` to define `__COMMIT_HASH__` at build time from `git rev-parse --short HEAD`.
- **Security & Headers**: Retains full compatibility with the strict CSP in `vercel.json` with zero third-party font requests.
- **Test Suite**: Preserves all existing `data-testid` attributes and keyboard/hash routing contracts, augmented by an automated axe-core accessibility audit and reduced-motion tests.
