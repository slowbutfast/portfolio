## Automated Tests

- `npm run typecheck`: Verifies compile-time type safety across all extended models (`shortTitle?: string`, contact URLs, and `NodeHoverCardProps`).
- `npm run test:unit`: Executes Vitest unit tests verifying edge derivation, catalog formatters, and physics coordinate damping.
- `npx @google/design.md lint DESIGN.md`: Verifies adherence to Google design token guidelines with 0 errors and 0 warnings.
- `npm run test:e2e`: Runs Playwright E2E suite across Chromium, Firefox, WebKit, and Mobile Chrome viewports verifying:
  - `index.html` title matches "Gregory Lazatin — Creative Technologist & Software Engineer".
  - `AboutModal` renders Email, LinkedIn, GitHub, and Resume links, with iframe loading the Google Drive preview.
  - `ProjectDrawer` renders elevated `Code ↗` and `Visit ↗` buttons in the sticky header.
  - `NodeHoverCard` is interactive (`pointer-events-auto`), rendering clickable `Code ↗` and `Visit ↗` links.
  - Graph canvas renders concise labels (`Resume Builder`, `Climate Risk`, `OpenDungeon`) rather than kebab slugs.
  - Mobile viewport (`393x852`) renders `ProjectDrawer` as a docked bottom sheet.
  - Axe WCAG 2.0 A/AA audit produces 0 accessibility violations in dark and light themes.
- `npm run build`: Verifies clean production bundling with 0 `data:font` occurrences and valid asset hashes.

## Manual Verification

- **Candidate Contact & Resume Preview**:
  - **WHEN** user clicks "About" and toggles the resume preview
  - **THEN** the About modal expands to display the embedded Google Drive document preview, and clicking "Resume (Drive) ↗" opens the document in a new tab.

- **Elevated Project Actions in Inspector**:
  - **WHEN** user opens any project drawer (e.g. OpenDungeon)
  - **THEN** `Code ↗` and `Visit ↗` buttons are immediately visible in the sticky header below the title without needing to click the "Link" tab.

- **Interactive Hover Card Actions**:
  - **WHEN** user hovers over a node on desktop and moves cursor onto the hover card
  - **THEN** the card remains visible, and clicking `Code ↗` or `Visit ↗` opens the external URL without opening the full drawer. Clicking the card body opens the inspector.

- **Concise Graph Node Typography**:
  - **WHEN** viewing the canvas graph
  - **THEN** nodes render concise labels (`Resume Builder`, `Climate Risk`, `Sandwave`, `Transcribe+`, `AttentionMax`, `OpenDungeon`) without overlapping or clipping offscreen.

- **Top Bar Scrim on Scroll**:
  - **WHEN** switching to Grid view and scrolling down through project cards
  - **THEN** the top bar maintains 100% legibility via the progressive backdrop blur and gradient scrim.

- **Mobile Bottom Sheet Presentation**:
  - **WHEN** viewing the site on a mobile device and clicking a project
  - **THEN** the inspector opens docked to the bottom of the screen with a rounded top edge and full-width touch ergonomics.
