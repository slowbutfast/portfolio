## Automated Tests

- `npm run typecheck`: Verifies compile-time type safety across all extended models (mandatory `shortTitle: string`, `CandidateProfile`, and `SimulationNode` input type).
- `npm run test:unit`:
  - `src/data/profile.test.ts`: Verifies candidate profile URL protocols (`mailto:` for email, `https:` for social and resume links), canonical tagline, and non-empty fields.
  - `src/data/projects.test.ts`: Verifies mandatory non-empty `shortTitle: string` across all 6 projects.
  - `src/physics/graphSimulation.test.ts`: Verifies `SimulationNode` consumes and preserves `label`.
  - `src/utils/edgeConfig.test.ts`: Verifies `vercel.json` CSP includes `frame-src 'self' https://drive.google.com;` and matches `SPEC_CSP`.
- `npx @google/design.md lint DESIGN.md`: Verifies adherence to Google design token guidelines with 0 errors and 0 warnings.
- `npm run test:e2e`: Runs Playwright E2E suite across Desktop Chrome and Mobile Chrome viewports verifying:
  - `index.html` title matches canonical "Gregory Lazatin — Software Engineer & Creative Technologist" and social meta tags are present.
  - `AboutModal` dialog mounts with `role="dialog"`, traps focus, updates URL hash to `#/about`, and dismisses cleanly via Escape key.
  - About modal displays top-mounted contact links and click-to-load Google Drive preview button with accessible iframe attributes (`title`, `referrerpolicy`, `sandbox`).
  - `ProjectDrawer` renders elevated `Code ↗` and `Visit ↗` buttons in the sticky header with descriptive accessible names.
  - `NodeHoverCard` is interactive (`pointer-events-auto`), maintaining visibility when pointer transfers to card within 150ms, and closing immediately upon canvas node drag.
  - Graph canvas renders concise labels (`Resume Builder`, `Climate Risk`, `OpenDungeon`) and clamps full pill bounds within canvas edges.
  - `ListView` renders visual 16:9 thumbnails and provides an authentic terminal specimen fallback for `agentic-resume-builder`.
  - Mobile viewport (`393x852`) renders `ProjectDrawer` as a docked bottom sheet (`max-h-[85dvh]`) and displays the 12px tagline.
  - Axe WCAG 2.0 A/AA audit produces 0 accessibility violations in dark and light themes.
- `npm run build`: Verifies clean production bundling with 0 `data:font` occurrences and valid asset hashes.

## Manual Verification

- **Candidate Contact & Click-to-Load Resume**:
  - **WHEN** user clicks "About" and clicks "Preview Resume"
  - **THEN** the About modal expands to display the sandboxed Google Drive document preview, and clicking "Resume (Drive) ↗" opens the document in a new tab.

- **Elevated Project Actions in Inspector**:
  - **WHEN** user opens any project drawer (e.g. OpenDungeon)
  - **THEN** `Code ↗` and `Visit ↗` buttons are immediately visible in the sticky header below the title with descriptive accessible announcements.

- **Interactive Hover Card Transfer Zone**:
  - **WHEN** user hovers over a node on desktop, leaves the node, and enters the card within 150ms
  - **THEN** the card remains visible and interactive. Starting a drag on any canvas node dismisses the card immediately.

- **Concise Graph Node Typography & Clamping**:
  - **WHEN** viewing the canvas graph near edges or on mobile viewports
  - **THEN** nodes render concise labels (`Resume Builder`, `Climate Risk`, `Sandwave`, `Transcribe+`, `AttentionMax`, `OpenDungeon`) without overlapping or clipping outside canvas padding.

- **Top Bar Scrim on Scroll & Canonical Tagline**:
  - **WHEN** viewing on desktop or mobile and scrolling Grid view
  - **THEN** the canonical 12px tagline is clearly visible, and the progressive gradient scrim preserves 100% legibility over scrolled cards.

- **Mobile Bottom Sheet Presentation**:
  - **WHEN** viewing the site on a mobile device and opening a project
  - **THEN** the inspector opens docked to the bottom of the screen with `max-h-[85dvh]` avoiding mobile address bar overlap.
