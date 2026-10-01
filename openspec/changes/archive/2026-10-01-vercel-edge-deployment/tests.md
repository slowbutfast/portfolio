## Automated Tests

- `node -e 'JSON.parse(fs.readFileSync("vercel.json", "utf8"))'`: Verifies JSON syntax and structural integrity of the Vercel edge deployment configuration.
- `npm run typecheck`: Asserts 0 TypeScript errors with strict typechecking across imported assets and configuration files.
- `npm run build`: Asserts Vite production build succeeds and bundles all media into `dist/assets/*-[hash].[ext]`.
- `npm run test:unit`: Executes 19 Vitest unit tests across 4 test suites (`projects.test.ts`, `graphSimulation.test.ts`, `graphTopology.test.ts`, `terminalCommandResolver.test.ts`), verifying that imported screenshot and video paths resolve to existing files in `src/assets/`.
- `npm run test:e2e`: Executes 16 Playwright end-to-end tests across Chromium desktop and Pixel 7 mobile viewports, verifying zero console errors, card drawer modals, terminal simulation, search filtering, and URL deep-linking.
- `PREVIEW_URL=https://portfolio-git-<branch>.vercel.app npm run test:e2e`: Executes all 16 Playwright tests against the live Vercel preview deployment, validating zero CSP console violations and seamless edge delivery.
- `curl -sI https://portfolio-git-<branch>.vercel.app/assets/missing.png`: Asserts an authentic HTTP 404 response rather than an SPA 200 rewrite.
- `curl -sI https://portfolio-git-<branch>.vercel.app/`: Asserts presence of `Content-Security-Policy` (without `'unsafe-inline'`), `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- `curl -sI https://portfolio-git-<branch>.vercel.app/assets/clip-*.mp4`: Asserts `Cache-Control: public, max-age=31536000, immutable`.

## Manual Verification

- **Real Screenshot Fidelity**:
  - **WHEN** the user opens project drawers for OpenDungeon, PICT Climate Risk, Attention Max, and Sandwave Sim
  - **THEN** high-resolution authentic application screenshots render with captions instead of synthetic title cards.
- **Social Media Link Previews**:
  - **WHEN** the portfolio URL is inspected via an Open Graph debugger (or social card preview tool)
  - **THEN** the title, description, and preview metadata display correctly.
- **Browser Favicon**:
  - **WHEN** the portfolio page is loaded in a web browser tab
  - **THEN** the minimalist node graph SVG favicon renders in the tab title bar.
