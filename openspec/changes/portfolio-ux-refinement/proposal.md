## Why

Evaluations by independent technical reviewers revealed that while the organic constructivist physics and visual aesthetic are strong, the candidate conversion experience lacks crucial recruiter fast-paths. Recruiters and engineering managers cannot quickly find a resume, email, or LinkedIn; project repositories and live demos are hidden inside secondary tabs; hover cards cannot be clicked; graph nodes show raw kebab-case slugs that collide on mobile screens; and scrolling Grid view collides with the top bar.

This change refines the candidate experience into a high-converting, friction-free engineering showcase with instant recruiter actions, elevated project links, and responsive polish.

## What Changes

- **Candidate Contact & Resume Infrastructure**: Adds email (`gregory.lazatin2006@gmail.com`), LinkedIn (`https://www.linkedin.com/in/gregory-lazatin/`), and an embedded Google Drive resume viewer (with direct open link `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/view?usp=drive_link`) to the About modal.
- **Content Security Policy Update**: Updates CSP in `vercel.json` to permit `frame-src 'self' https://drive.google.com;` for secure document embedding.
- **Metadata Polish**: Updates `index.html` page title and Open Graph metadata from `SYS.PORTFOLIO // NODE GRAPH SPECIMEN` to "Gregory Lazatin — Creative Technologist & Software Engineer".
- **Elevated Project Actions**: Pins primary `Code ↗` (GitHub repo) and `Visit ↗` (live demo) buttons directly beneath project titles in both the sticky `ProjectDrawer` header and the `NodeHoverCard`.
- **Interactive Hover Cards**: Enables pointer events on `NodeHoverCard` so visitors can directly click `Code ↗` or `Visit ↗`, or click anywhere on the card to inspect details.
- **Concise Graph Typography**: Emits concise human display titles (`shortTitle`) to canvas nodes (e.g. `Resume Builder`, `Climate Risk`, `OpenDungeon`) while preserving full titles in hover cards, drawer, and grid.
- **Canvas Label Clamping**: Clamps text knockout pill rendering to canvas viewport boundaries to prevent screen clipping.
- **Top Bar Scrim & Tagline**: Adds an engineering subtitle tagline to the top bar and a progressive gradient scrim to prevent collision with scrolled cards in Grid view.
- **Responsive Ergonomics & Thumbnails**: Docks `ProjectDrawer` as a native bottom sheet on mobile screens (`< 768px`) and embeds visual 16:9 thumbnails in `ListView` cards.

## Capabilities

### New Capabilities

<!-- No new isolated standalone subsystems are introduced; changes refine existing portfolio subsystems. -->

### Modified Capabilities

- `portfolio-controls`: Adds progressive gradient backdrop scrim to prevent scroll collision in Grid view, desktop engineering tagline, and direct recruiter contact actions in the About modal.
- `project-drawer`: Elevates `Code ↗` and `Visit ↗` into permanent sticky header actions above tabs, and adapts presentation to a native bottom sheet on mobile viewports.
- `project-catalog`: Extends project metadata with `shortTitle` and integrates recruiter contact channels (email, LinkedIn, Google Drive resume URL and preview embed URL).
- `graph-simulation`: Emits `shortTitle` human labels to simulation nodes instead of raw kebab slugs, and clamps pill rendering inside canvas viewport edges.
- `edge-deployment`: Extends `vercel.json` CSP with `frame-src 'self' https://drive.google.com;` to permit safe embedding of Google Drive resume previews.

## Impact

- **Configuration**: `vercel.json` CSP header modified to allow `https://drive.google.com` frames.
- **Metadata**: `index.html` title and description updated.
- **Components**: `AboutModal.tsx`, `ControlsOverlay.tsx`, `ProjectDrawer.tsx`, `NodeHoverCard.tsx`, `GraphCanvas.tsx`, `ListView.tsx`, `App.tsx`.
- **Data & Types**: `src/types/portfolio.ts`, `src/data/projects.ts`, `src/physics/graphSimulation.ts`.
- **Tests**: `e2e/portfolio.spec.ts` updated and expanded for contact actions, elevated buttons, short labels, and bottom sheet presentation.
