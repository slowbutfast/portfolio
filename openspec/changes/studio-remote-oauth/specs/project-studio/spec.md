# project-studio Specification

## RENAMED Requirements
- FROM: `### Requirement: Dev-only Project Studio route and zero production exposure`
- TO: `### Requirement: Authenticated production Studio route and zero secret exposure`

## MODIFIED Requirements

### Requirement: Authenticated production Studio route and zero secret exposure
The system SHALL keep the main portfolio bundle (`dist/assets/index-*.js`) free of Studio UI markers (e.g., `data-testid="studio-app"` / `studio-app`) via a dynamic `import('./studio/StudioApp')` at `/#/studio`, keep zero credentials, secrets, or server-only code (`api/studio/*`, `vite-studio-plugin.ts`) in any client bundle, and protect all production catalog reads and writes behind owner-authenticated `/api/studio/*` endpoints (returning `503 Service Unavailable` when OAuth/GitHub environment variables are absent, and `401 Unauthorized` otherwise when unauthenticated), while dev mode continues serving `/__studio/api/*` locally via `vite-studio-plugin.ts`.

#### Scenario: Main portfolio bundle excludes Studio UI and all assets exclude secrets
- **WHEN** `npm run build` produces `dist/`
- **THEN** the main application chunk contains zero `studio-app` UI code, and no file in `dist/` contains `GITHUB_PAT`, `GITHUB_CLIENT_SECRET`, `STUDIO_SESSION_SECRET`, or `/__studio/api` local-dev middleware code.

#### Scenario: Unauthenticated production users receive deterministic 503 or 401
- **WHEN** an unauthenticated user visits `/#/studio` or requests `/api/studio/state` in production
- **THEN** `/#/studio` renders the sign-in or unconfigured shell without catalog data, and `/api/studio/state` deterministically returns `503` if OAuth/GitHub env vars are missing, or `401` otherwise.
