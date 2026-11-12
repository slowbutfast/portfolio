## Why

Evaluations by independent technical reviewers revealed that while the organic constructivist physics and visual aesthetic are strong, the candidate conversion experience lacks crucial recruiter fast-paths. Recruiters and engineering managers cannot quickly find a resume, email, or LinkedIn; project repositories and live demos are hidden inside secondary tabs; hover cards cannot be clicked; graph nodes show raw kebab-case slugs that collide on mobile screens; and scrolling Grid view collides with the top bar.

This change refines the candidate experience into a high-converting, friction-free engineering showcase with instant recruiter actions, elevated project links, and responsive polish.

## What Changes

- **Dedicated Candidate Profile**: Introduces `src/data/profile.ts` with typed candidate metadata (email, LinkedIn, GitHub, resume links, bio, and canonical tagline: "Software Engineer · Autonomous Agents & Graphics").
- **Canonical Metadata & Previews**: Updates `index.html` with canonical `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, `og:url`, and `twitter:card`.
- **Top Bar Tagline & Scrim**: Displays the canonical tagline at 12px on both desktop and mobile, with a progressive gradient scrim to prevent collision with scrolled cards in Grid view.
- **Top-Mounted Contact & Click-to-Load Resume**: Places Email, LinkedIn, GitHub, and Resume directly at the top of the About modal; provides an accessible, click-to-load sandboxed Google Drive document preview (`https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview`).
- **Content Security Policy Update**: Updates CSP in `vercel.json` (and coordinates `SPEC_CSP` in guard tests) to permit `frame-src 'self' https://drive.google.com;`.
- **Elevated Project Actions**: Pins primary `Code ↗` (GitHub repo) and `Visit ↗` (live demo) buttons directly beneath project titles in both the sticky `ProjectDrawer` header and the `NodeHoverCard`, with explicit `aria-label` accessibility annotations.
- **Interactive Hover Cards with Transfer Rules**: Enables pointer events on `NodeHoverCard`, with robust 150ms transfer grace period between node and card, cancel-on-entry, and dismiss-on-drag.
- **Mandatory Concise Graph Typography**: Requires `shortTitle: string` on all 6 projects (`OpenDungeon`, `Resume Builder`, `Climate Risk`, `Transcribe+`, `Sandwave`, `AttentionMax`), passing it through `SimulationNode` input types.
- **Canvas Label Clamping & Collision Offsets**: Clamps text knockout pill full bounds inside canvas margins and offsets labels to prevent multi-node overlap.
- **Responsive Bottom Sheet & Grid Thumbnails**: Docks `ProjectDrawer` as a mobile bottom sheet using `max-h-[85dvh]` to avoid mobile address bar clipping, and embeds 16:9 visual thumbnails in `ListView` with a terminal specimen fallback for CLI projects.

## Capabilities

### New Capabilities

- `candidate-profile`: Defines the typed candidate identity schema and profile records (`src/data/profile.ts`), supplying canonical branding, contact endpoints, social links, resume URLs, and bio text across the application.

### Modified Capabilities

- `portfolio-controls`: Adds top bar progressive gradient scrim, canonical 12px engineering tagline on desktop and mobile, baseline specification for the About dialog (`role="dialog"`, focus trap, `#/about`, Escape), and top-mounted recruiter contact pathways.
- `project-drawer`: Elevates `Code ↗` and `Visit ↗` into permanent sticky header actions above tabs, adapts presentation to a mobile bottom sheet with `max-h-[85dvh]`, and specifies interactive `NodeHoverCard` behavior with pointer transfer rules.
- `project-catalog`: Requires mandatory `shortTitle: string` across all catalog items, and defines visual 16:9 thumbnail previews with CLI fallback for `ListView`.
- `graph-simulation`: Extends `SimulationNode` input types to accept `label`, emits `shortTitle` to canvas nodes, and clamps pill boundaries with collision offsets.
- `edge-deployment`: Extends `vercel.json` CSP with `frame-src 'self' https://drive.google.com;` and coordinates with `SPEC_CSP` guard assertions.

## Impact

- **Configuration**: `vercel.json` CSP header modified to allow `https://drive.google.com` frames; coordinated with `src/utils/csp.ts` `SPEC_CSP`.
- **Metadata**: `index.html` title, Open Graph, and Twitter card metadata populated.
- **Data Layer**: New `src/data/profile.ts`; updated `src/types/portfolio.ts` with required `shortTitle: string` and `CandidateProfile` type.
- **Components**: `AboutModal.tsx`, `ControlsOverlay.tsx`, `ProjectDrawer.tsx`, `NodeHoverCard.tsx`, `GraphCanvas.tsx`, `ListView.tsx`, `App.tsx`.
- **Physics**: `src/physics/graphSimulation.ts` input types and node construction updated.
- **Tests**: Config guards, unit tests for profile and catalog, and Playwright E2E suite updated.
