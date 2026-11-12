## 1. Test Scaffolding (TDD)

- [ ] 1.1 Scaffold failing E2E tests in `e2e/portfolio.spec.ts` for candidate identity, page metadata, and recruiter contact channels in About modal
- [ ] 1.2 Scaffold failing E2E tests for embedded Google Drive resume viewer iframe and CSP validation
- [ ] 1.3 Scaffold failing E2E tests for elevated `Code ↗` and `Visit ↗` actions in `ProjectDrawer` header
- [ ] 1.4 Scaffold failing E2E tests for interactive `NodeHoverCard` direct action buttons and pointer selection
- [ ] 1.5 Scaffold failing E2E tests for concise node labeling (`shortTitle`) and canvas label boundary clamping
- [ ] 1.6 Scaffold failing E2E tests for mobile bottom sheet inspector presentation on `< 768px` viewports

## 2. Infrastructure & Metadata Configuration

- [ ] 2.1 Update `vercel.json` CSP to include `frame-src 'self' https://drive.google.com;`
- [ ] 2.2 Update `index.html` title and Open Graph metadata to "Gregory Lazatin — Creative Technologist & Software Engineer"

## 3. Data Layer & Contact Profiles

- [ ] 3.1 Extend `ProjectData` in `src/types/portfolio.ts` with `shortTitle?: string`
- [ ] 3.2 Update `src/data/projects.ts` with concise `shortTitle` entries (`OpenDungeon`, `Resume Builder`, `Climate Risk`, `Transcribe+`, `Sandwave`, `AttentionMax`) and recruiter contact channels

## 4. Recruiter Fast-Paths & About Modal

- [ ] 4.1 Implement Email, LinkedIn, GitHub, and Resume actions in `src/components/AboutModal.tsx`
- [ ] 4.2 Implement toggleable/embedded Google Drive resume viewer iframe in `src/components/AboutModal.tsx`

## 5. Elevated Project Actions & Interactive Hover Cards

- [ ] 5.1 Elevate `Code ↗` and `Visit ↗` buttons into sticky header of `src/components/ProjectDrawer.tsx`
- [ ] 5.2 Style `ProjectDrawer` as a docked bottom sheet on mobile screens (`< 768px`)
- [ ] 5.3 Enable `pointer-events-auto` and add pinned `Code ↗` and `Visit ↗` buttons in `src/components/NodeHoverCard.tsx`
- [ ] 5.4 Wire hover card selection and retention delay in `src/App.tsx` and `src/components/GraphCanvas.tsx`

## 6. Physics Simulation Typography & Canvas Clamping

- [ ] 6.1 Bind `label: n.label` in `src/physics/graphSimulation.ts` to consume `shortTitle`
- [ ] 6.2 Implement canvas label viewport boundary clamping in `src/components/GraphCanvas.tsx`

## 7. Controls Overlay & Grid View Polish

- [ ] 7.1 Add desktop engineering subtitle tagline to `src/components/ControlsOverlay.tsx`
- [ ] 7.2 Implement progressive gradient scrim in `src/components/ControlsOverlay.tsx`
- [ ] 7.3 Embed 16:9 thumbnail previews and replace 96px numerals with `text-xl font-mono` in `src/components/ListView.tsx`

## 8. Verification & Empirical Audit

- [ ] 8.1 Run full regression test suite (`npm run typecheck`, `npm run test:unit`, `npm run test:e2e`, `npx @google/design.md lint DESIGN.md`, `npm run build`), verify clean passes, and check for metric/data regressions
- [ ] 8.2 Populate verification.md with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs
