## 1. Test Scaffolding (TDD)

- [ ] 1.1 Scaffold unit test `src/utils/bridgeGeometry.test.ts` verifying bilateral reflection symmetry, tangent angles, and close-node guards
- [ ] 1.2 Scaffold unit test `src/utils/graphPlanarity.test.ts` verifying 0 segment crossings across all 9 edges for `PLANAR_NODE_SEEDS`
- [ ] 1.3 Scaffold unit test `src/data/profile.test.ts` verifying Brown University bio copy and URL protocols (`mailto:`, `https:`)
- [ ] 1.4 Scaffold unit test `src/data/projects.test.ts` verifying mandatory non-empty `shortTitle: string` for all 6 projects
- [ ] 1.5 Scaffold unit test in `src/utils/edgeConfig.test.ts` and update `src/utils/csp.ts` (`SPEC_CSP`) to include `frame-src 'self' https://drive.google.com;`
- [ ] 1.6 Scaffold E2E tests in `e2e/portfolio.spec.ts` for default Light theme, header item sequence (`About`, `GitHub`, `Graph`/`Grid`, `Dark`/`Light`, `Filters`), and theme persistence
- [ ] 1.7 Scaffold E2E tests for About modal DOM structure (Brown University bio, top contact links, no subtitle, no focus areas)
- [ ] 1.8 Scaffold E2E tests for `ProjectDrawer` segmented tabs track and elevated `Code ↗` and `Visit ↗` buttons

## 2. Mathematical Geometry & Planar Topology

- [ ] 2.1 Implement `src/utils/bridgeGeometry.ts` with tangent-continuous Bézier curves, bilateral reflection symmetry, and close-node distance guards
- [ ] 2.2 Implement `src/data/graphSeeds.ts` exporting `PLANAR_NODE_SEEDS` with Sandwave nested inside the $K_4$ triangle
- [ ] 2.3 Wire `computeBridgeGeometry` into `src/components/GraphCanvas.tsx` replacing previous heuristic bridge drawing

## 3. Candidate Profile & Infrastructure Configuration

- [ ] 3.1 Implement `src/data/profile.ts` exporting `CandidateProfile` with Brown University bio, email, social links, and canonical tagline
- [ ] 3.2 Create `public/theme-init.js` to block dark-user theme flash before initial body paint
- [ ] 3.3 Update `vercel.json` CSP to include `frame-src 'self' https://drive.google.com;` and sync `SPEC_CSP`
- [ ] 3.4 Update `index.html` with canonical title, description, social Open Graph tags, and `/theme-init.js` reference

## 4. Project Catalog & Physics Simulation

- [ ] 4.1 Update `src/types/portfolio.ts` with mandatory `shortTitle: string` on `ProjectData` and `CandidateProfile` interface
- [ ] 4.2 Add mandatory `shortTitle` to all 6 projects in `src/data/projects.ts`
- [ ] 4.3 Extend `SimulationNode` in `src/physics/graphSimulation.ts` to accept `label?: string` and bind weak `seedX`/`seedY` homing forces (`strength: 0.02`)
- [ ] 4.4 Update `GraphCanvas.tsx` to initialize simulation and static reduced-motion layout from scaled `PLANAR_NODE_SEEDS`

## 5. Controls Overlay, Header & Theme Default

- [ ] 5.1 Update `src/styles.css` with Helvetica, Helvetica Light, and Menlo font stacks, plus hardened Light theme contrast tokens (`#525257`, `#71717a`)
- [ ] 5.2 Update `readStoredTheme()` in `src/App.tsx` to default to `'light'`
- [ ] 5.3 Implement top-right header controls in `src/components/ControlsOverlay.tsx`: `About`, `GitHub ↗`, `Graph`/`Grid`, `Dark`/`Light`, `Filters ▾`
- [ ] 5.4 Remove redundant theme toggle from inside the Filters dropdown in `src/components/ControlsOverlay.tsx`

## 6. Recruiter Fast-Paths & About Modal

- [ ] 6.1 Update `src/components/AboutModal.tsx` to render the canonical Brown University bio statement
- [ ] 6.2 Remove "Creative Technologist & Software Engineer" subtitle and delete focus areas section in `src/components/AboutModal.tsx`
- [ ] 6.3 Mount Email (`mailto:gregory.lazatin2006@gmail.com`), LinkedIn, GitHub, and Resume directly at the top of `src/components/AboutModal.tsx`
- [ ] 6.4 Implement click-to-load sandboxed Google Drive preview iframe in `src/components/AboutModal.tsx`

## 7. Elevated Actions & Drawer Segmented Tabs

- [ ] 7.1 Elevate `Code ↗` and `Visit ↗` buttons into sticky header of `src/components/ProjectDrawer.tsx`
- [ ] 7.2 Implement distinct segmented container track for `Media` and `Terminal` tabs with $\ge 44\text{px}$ touch targets in `src/components/ProjectDrawer.tsx`
- [ ] 7.3 Enable `pointer-events-auto` on `src/components/NodeHoverCard.tsx` with 150ms transfer zone and direct action buttons
- [ ] 7.4 Embed 16:9 thumbnails and terminal specimen fallback in `src/components/ListView.tsx`

## 8. Verification & Empirical Audit

- [ ] 8.1 Run `npx @google/design.md lint DESIGN.md` and verify 0 errors, 0 warnings
- [ ] 8.2 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npm run build`), verify clean passes
- [ ] 8.3 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs
