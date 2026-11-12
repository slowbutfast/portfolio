## 1. Test Scaffolding (TDD)

- [ ] 1.1 Scaffold unit tests for `src/data/profile.ts` (valid protocols, non-empty bio, canonical tagline) and `src/data/projects.ts` (mandatory `shortTitle: string`)
- [ ] 1.2 Scaffold unit tests in `src/physics/graphSimulation.test.ts` for `SimulationNode` input type and label passthrough
- [ ] 1.3 Update CSP unit guard in `src/utils/edgeConfig.test.ts` and `src/utils/csp.ts` (`SPEC_CSP`) to include `frame-src 'self' https://drive.google.com;`
- [ ] 1.4 Scaffold E2E tests for `AboutModal` baseline (role, focus trap, `#/about`, Escape) and top-mounted contact links
- [ ] 1.5 Scaffold E2E tests for click-to-load Google Drive preview iframe (`title`, `referrerpolicy`, `sandbox`)
- [ ] 1.6 Scaffold E2E tests for elevated `Code ↗` and `Visit ↗` actions in `ProjectDrawer` header
- [ ] 1.7 Scaffold E2E tests for `NodeHoverCard` transfer rules (150ms leave delay, cancel-on-enter, dismiss-on-drag)
- [ ] 1.8 Scaffold E2E tests for mobile bottom sheet (`max-h-[85dvh]`) and `ListView` thumbnails with terminal fallback

## 2. Candidate Profile & Infrastructure Configuration

- [ ] 2.1 Implement `src/data/profile.ts` exporting strongly typed `CandidateProfile`
- [ ] 2.2 Update `vercel.json` CSP to include `frame-src 'self' https://drive.google.com;` and sync `SPEC_CSP`
- [ ] 2.3 Update `index.html` title, description, and social Open Graph / Twitter metadata

## 3. Project Catalog & Physics Simulation Types

- [ ] 3.1 Update `src/types/portfolio.ts` with mandatory `shortTitle: string` on `ProjectData` and `CandidateProfile` interface
- [ ] 3.2 Add mandatory `shortTitle` to all 6 projects in `src/data/projects.ts`
- [ ] 3.3 Extend `SimulationNode` in `src/physics/graphSimulation.ts` to accept `label?: string` and pass to `GraphNode`
- [ ] 3.4 Implement full rectangular pill bounds clamping and vertical collision offsets in `src/components/GraphCanvas.tsx`

## 4. Recruiter Fast-Paths & About Modal

- [ ] 4.1 Mount contact links (Email, LinkedIn, GitHub, Resume) at the top of `src/components/AboutModal.tsx`
- [ ] 4.2 Implement click-to-load sandboxed Google Drive preview iframe in `src/components/AboutModal.tsx`

## 5. Elevated Project Actions & Interactive Hover Cards

- [ ] 5.1 Elevate `Code ↗` and `Visit ↗` into sticky header of `src/components/ProjectDrawer.tsx`
- [ ] 5.2 Style `ProjectDrawer` as a mobile bottom sheet with `max-h-[85dvh]` on `< 768px` viewports
- [ ] 5.3 Enable `pointer-events-auto` and add pinned `Code ↗` and `Visit ↗` in `src/components/NodeHoverCard.tsx`
- [ ] 5.4 Implement 150ms transfer zone state machine (cancel-on-enter, dismiss-on-drag) in `src/App.tsx` and `src/components/GraphCanvas.tsx`

## 6. Controls Overlay & Grid View Polish

- [ ] 6.1 Display canonical tagline at 12px on desktop and mobile in `src/components/ControlsOverlay.tsx`
- [ ] 6.2 Implement progressive gradient scrim in `src/components/ControlsOverlay.tsx`
- [ ] 6.3 Embed 16:9 thumbnails and terminal specimen fallback in `src/components/ListView.tsx`

## 7. Verification & Empirical Audit

- [ ] 7.1 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npx @google/design.md lint DESIGN.md`, `npm run build`), verify clean passes, and check for metric/data regressions
- [ ] 7.2 Populate verification.md with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs
