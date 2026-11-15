# project-studio Specification

## ADDED Requirements

### Requirement: Dev-only Project Studio route and zero production exposure
The system SHALL expose `StudioApp` at `/#/studio` exclusively when `import.meta.env.DEV` is `true`, loaded via a dynamic `import('./studio/StudioApp')` so production builds (`npm run build`) tree-shake all Studio UI and `/__studio/api/*` code out of `dist/` and `vite preview` / Vercel serve only the normal portfolio SPA.

#### Scenario: Production bundle contains zero Studio symbols
- **WHEN** `npm run build` produces `dist/`
- **THEN** no asset in `dist/` contains `StudioApp`, `/__studio/api`, or `#/studio` routing logic, and visiting `/#/studio` in `vite preview` renders the portfolio SPA without Studio controls or `/__studio/api/state` data.

### Requirement: Hardened local Studio API for atomic catalog CRUD
The Vite dev-server plugin (`vite-studio-plugin.ts`, active only inside `configureServer`) SHALL expose `GET /__studio/api/state` and `PUT /__studio/api/state` targeting only the configured canonical JSON path (`src/data/projects.catalog.json`), enforcing:
1. `Host` and `Origin` matching against the dev server origin (allowing omitted `Origin` on `GET` only when `Sec-Fetch-Site` is `'same-origin'`, `'none'`, or absent in local non-browser test calls) and emitting zero CORS headers.
2. Per-dev-server `X-Studio-Token` validation on `PUT`/`POST` requests and a `256KB` maximum request body limit (`413` on overflow).
3. Strict runtime schema validation: unique project `id` matching `/^[a-z0-9-]+$/`, reserved `'art-wip'` project and `'art'` tag (`hiddenTags`) preserved, `seeds` key parity with `projects` and finite coordinates in `[0, 1]`, valid declared tags, `https:` or site-relative `/` URLs for `repo`/`liveUrl`, valid asset/captured keys, and `countSeedCrossings === 0`.
4. Revision conflict detection (`expectedRevision` SHA-256 of canonical JSON returning `409 Conflict` on mismatch).
5. Deterministic canonical JSON formatting (sorted `tags`/`hiddenTags`/`seeds` keys, 2-space indent, trailing newline) written atomically via temp file and `rename` under a write mutex.

#### Scenario: Stale or unauthorized write is rejected
- **WHEN** a `PUT /__studio/api/state` request lacks a valid `X-Studio-Token`, has a mismatched `Origin`, exceeds `256KB`, or supplies a stale `expectedRevision`
- **THEN** the endpoint rejects the write (`403`, `413`, or `409`) without modifying `src/data/projects.catalog.json`.

#### Scenario: Invalid ID, URL, or reserved entity mutation is rejected
- **WHEN** a `PUT /__studio/api/state` payload uses a non-kebab ID (e.g., `__proto__`), a `javascript:` URL, out-of-range seed coordinates, or removes/renames `art-wip` or `'art'`
- **THEN** the endpoint returns `400 Bad Request` without modifying the catalog.

#### Scenario: Non-planar seed save is blocked
- **WHEN** the user drags a seed in `SeedMiniMap` creating `countSeedCrossings > 0`
- **THEN** the Studio highlights the crossing edges and blocks saving until the layout has `0` crossings.

### Requirement: Studio project CRUD, asset/terminal picking, and HMR sync
`StudioApp` SHALL provide master-detail CRUD over `draft.projects` and `draft.seeds` with dirty/discard tracking: creating a project auto-assigns a non-crossing default seed in `[0..1] × [0..1]`; editing supports all `ProjectData` fields, behavior flags, `assetKey` selection from the narrowed asset glob, and `terminalDemo` (`capturedKey` + `prompt`) selection; renaming a project `id` updates its `seeds` key; deleting a project removes its `seeds` entry; reserved `art-wip` cannot be deleted or renamed; and after a successful `PUT`, `StudioApp` refetches state/revision (or syncs with Vite HMR) and clears the dirty indicator.

#### Scenario: Creating and deleting a project updates seeds atomically
- **WHEN** the user creates a new project in `StudioApp`, edits its fields, saves, and later deletes it
- **THEN** a default non-crossing seed is created in `draft.seeds`, persisted atomically with `draft.projects`, and removed cleanly upon deletion.

#### Scenario: Renaming a project ID updates its seed key while protecting art-wip
- **WHEN** the user renames a non-reserved project's `id`
- **THEN** its `seeds` entry moves to the new `id` while `art-wip` has `id` editing and deletion disabled in the UI.

#### Scenario: Saving reloads catalog revision and clears dirty state
- **WHEN** `PUT /__studio/api/state` succeeds
- **THEN** `StudioApp` updates `expectedRevision` to the new canonical revision and clears the unsaved-changes indicator.

### Requirement: Tag Manager CRUD and live edge-diff preview
`TagManager` SHALL allow creating, renaming (cascading to all `projects[].tags` and `hiddenTags`), deleting (cascading from `projects[].tags` and `hiddenTags`), and toggling `hiddenTags`, using pure `deriveEdges(draft.projects, new Set(draft.hiddenTags))` to display the live added/removed edge count before saving, while locking reserved `'art'` against deletion, renaming, or unhiding.

#### Scenario: Renaming or toggling a tag updates live edge diff
- **WHEN** the user creates, renames, deletes, or toggles a non-reserved tag in `TagManager`
- **THEN** `StudioApp` updates `draft.tags`, `draft.hiddenTags`, and `draft.projects` consistently and displays the live edge-count delta and crossing check.

#### Scenario: Reserved art tag cannot be deleted or unhidden
- **WHEN** viewing `'art'` in `TagManager`
- **THEN** delete, rename, and unhide controls for `'art'` are disabled.

### Requirement: SSRF-safe server-side link health auditing
`POST /__studio/api/audit-links` SHALL audit only absolute `http(s)` URLs extracted server-side from `src/data/projects.catalog.json` and `src/data/profile.ts` (ignoring any client-supplied URL list and skipping site-relative paths such as `/art/`), manually resolving DNS and following redirects (`redirect: 'manual'`) to reject loopback, private, link-local, and reserved IPv4/IPv6 addresses (including IPv4-mapped IPv6 and decimal/integer hosts) on every hop, pinning the validated IP on default Node `http`/`https` sockets while preserving the `Host` header and TLS `servername`, enforcing `X-Studio-Token` and `Origin` checks, and returning structured `{ url, status, classification, latencyMs }` entries using `classifyStatus` (`401`/`403`/`429`/`999` as `'warning'`).

#### Scenario: Link check reports live status and warnings in the Studio UI
- **WHEN** the user clicks **"Check Links"** in `StudioApp`
- **THEN** `POST /__studio/api/audit-links` returns per-URL status, classification (`pass`/`warning`/`fail`), and `latencyMs`, displayed inline beside `liveUrl` and `repo`.

#### Scenario: Redirect to private or loopback IP is blocked
- **WHEN** an audited URL responds with a `3xx` redirect targeting a loopback or private IP (e.g., `http://127.0.0.1` or `http://[::ffff:127.0.0.1]`)
- **THEN** `linkAudit.ts` aborts the redirect and reports the URL as blocked/failed without fetching the internal target.
