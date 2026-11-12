## ADDED Requirements

### Requirement: Mandatory engineering classification and stable deterministic catalog formatters
The system SHALL require a non-empty `classification: string` on every `ProjectData` catalog entry (e.g., `"NEURAL ADVENTURE // STATE RUNTIME"`), and derive catalog index codes (`01`–`06`) and plate numbers (`PL-01`–`PL-06`) deterministically via dedicated utility functions (`src/utils/drafting.ts`) adhering to stable catalog order.

#### Scenario: Displaying project index and classification
- **WHEN** project metadata is rendered in list view, drawer, or annotations
- **THEN** the system displays the deterministic two-digit index code and uppercase plate number alongside the mandatory classification string.

### Requirement: Build-injected portfolio build commit SHA with fallback
The system SHALL inject the portfolio site build commit SHA via a build-time global `__COMMIT_HASH__` declared in `src/vite-env.d.ts` and populated in `vite.config.ts` from `git rev-parse --short HEAD` with fallback to `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)` or `'dev'`, representing the portfolio build provenance rather than showcased repository commit history.

#### Scenario: Rendering build provenance in technical specs
- **WHEN** the technical specification header or drawer renders
- **THEN** it displays the authentic portfolio build commit SHA provided by `__COMMIT_HASH__`.

#### Scenario: Building in an environment without .git directory
- **WHEN** the application builds in an environment lacking a `.git` repository (such as Vercel CLI tarball deploys)
- **THEN** the build does not throw an unhandled exception, falling back gracefully to `VERCEL_GIT_COMMIT_SHA` or `'dev'`.
