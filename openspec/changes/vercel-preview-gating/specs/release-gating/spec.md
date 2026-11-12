## ADDED Requirements

### Requirement: Typecheck is part of the production build
The system SHALL run `tsc --noEmit` before `vite build` in the `build` script so that a TypeScript error fails the Vercel build.

#### Scenario: Build with a type error
- **WHEN** a source file contains a TypeScript error and `npm run build` runs
- **THEN** the command exits non-zero before `vite build` produces `dist/`.

#### Scenario: Build with no type errors
- **WHEN** the project typechecks cleanly and `npm run build` runs
- **THEN** `dist/` is produced and the command exits zero.

### Requirement: Pull request gate
The system SHALL run `npm run typecheck`, `npm run test:unit`, and `npm run test:e2e` (against the local server, desktop and mobile projects) on every pull request targeting the production branch, and the workflow SHALL be configured as a required check.

#### Scenario: Pull request opened
- **WHEN** a pull request is opened or updated against the production branch
- **THEN** the workflow runs the three commands in order and reports a single pass/fail status.

#### Scenario: Any gate command fails
- **WHEN** typecheck, unit tests, or E2E tests fail
- **THEN** the workflow fails, uploads the Playwright report as an artifact, and the pull request cannot merge while the check is required.

### Requirement: Preview deployment gate
The system SHALL run the E2E suite and the header assertion test against the deployment URL whenever Vercel reports a successful Preview deployment through a `repository_dispatch` event of type `vercel.deployment.success`, passing `PREVIEW_URL` from the event's `client_payload.url` and the bypass secret from repository secrets.

#### Scenario: Successful preview deployment
- **WHEN** a `vercel.deployment.success` `repository_dispatch` event for a Preview deployment is received
- **THEN** the workflow runs the preview E2E suite against the deployment URL and reports the result on the deployed commit.

#### Scenario: Event lacks the data needed to verify
- **WHEN** the dispatch payload has no deployment URL or no commit SHA
- **THEN** the job fails with a message pointing at the payload recorded in the run summary, instead of testing the wrong target.

#### Scenario: Bypass secret is not configured
- **WHEN** `VERCEL_AUTOMATION_BYPASS_SECRET` is empty
- **THEN** the job fails with an explicit message instead of testing the authentication page, and the secret value is never printed to logs.

#### Scenario: Failure artifacts do not expose the bypass secret
- **WHEN** a preview gate run fails and uploads its artifacts
- **THEN** Playwright tracing is disabled for the run and no uploaded file or log line contains the bypass secret value.

### Requirement: Production deployment verification
The system SHALL run the header assertion test and the load-time console-error test against the production URL whenever Vercel reports a successful Production deployment.

#### Scenario: Successful production deployment
- **WHEN** a `vercel.deployment.success` `repository_dispatch` event for a Production deployment is received
- **THEN** the header assertion test and the load-time console-error test run against its deployment URL and report the result on the deployed commit.

### Requirement: Documented promotion and rollback procedure
The system SHALL document in `README.md` the production branch, the promotion path (merge to the production branch), the Instant Rollback procedure, and the conditions that call for a rollback.

#### Scenario: Reader looks for the rollback procedure
- **WHEN** a maintainer reads the README's deployment section
- **THEN** it names the Vercel production branch, states that merging promotes to production, gives the Instant Rollback steps, and lists the rollback triggers (CSP violations in production, fonts falling back, accessibility regression).
