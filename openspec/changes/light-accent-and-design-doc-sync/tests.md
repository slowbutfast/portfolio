# Tests: Light-Mode Accent Contrast & DESIGN.md Sync

## Test Strategy
1. **E2E (`e2e/portfolio.spec.ts`)**:
   - In the desktop Sound toggle test and mobile in-menu Sound test (both defaulting to Light mode), assert that when Sound is enabled, `controls-dropdown-icon` has computed `color === 'rgb(37, 99, 235)'` (`#2563eb`).
2. **Existing Suites & Validation**:
   - `npm run typecheck`
   - `npm run build`
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npx openspec validate light-accent-and-design-doc-sync --strict`
   - `npx openspec validate --specs --strict`
