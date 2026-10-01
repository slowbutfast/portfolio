## 1. Test Scaffolding (TDD)

- [x] 1.1 Update `src/data/projects.test.ts` to assert that all preview media files exist under `src/assets/`
- [x] 1.2 Update `playwright.config.ts` to support `PREVIEW_URL` parameterization for remote preview testing

## 2. Media Pipeline & Authentic Sibling Screenshot Ingest

- [x] 2.1 Update `scripts/capture-demos.sh` to extract real screenshots from sibling directories (`open-dungeon`, `pict-climate-risk-viz-chatbot`, `attention-max`) and capture `sandwave-sim` headlessly via Playwright
- [x] 2.2 Delete `scripts/generate-screenshots.mjs` and run `npm run capture` to populate genuine assets into `src/assets/`
- [x] 2.3 Update `src/data/projects.ts` to import media via ES modules so Vite emits content-hashed URLs

## 3. Edge Configuration & Metadata Hardening

- [x] 3.1 Configure `vercel.json` with strict CSP (no `'unsafe-inline'`), nosniff, DENY, and single immutable cache rule without rewrites
- [x] 3.2 Create `.vercelignore` to exclude non-production tooling, tests, and specs
- [x] 3.3 Pin `package.json` `"engines"` to `{"node": "22.x"}`
- [x] 3.4 Create `public/favicon.svg` and update `index.html` with description, Open Graph tags, and favicon link
- [x] 3.5 Update `README.md` with project documentation and Vercel GitHub integration instructions

## 4. Verification & Empirical Audit

- [x] 4.1 Run full regression test suite (`npm test`, `npm run typecheck`, `npm run build`) and assert 19 Vitest tests pass and 16 Playwright tests pass
- [x] 4.2 Verify authentic 404 behavior and bundle immutability locally
- [x] 4.3 Populate `verification.md` with Requirement Adherence Matrix, resolved assumptions, and verbatim execution logs
