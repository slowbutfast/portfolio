# project-catalog Specification

## Purpose

Manages the verified project portfolio data, runtime schemas, and automated derivation of graph links based on shared technical tags.
## Requirements
### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 6 projects with concrete preview mappings, paradigm tags, full descriptive titles, mandatory non-empty `shortTitle: string` entries for graph nodes, and authentic asset sources:

| Project ID | Mandatory Short Title | Paradigm Tags | Previews | Asset Source |
| :--- | :--- | :--- | :--- | :--- |
| `open-dungeon` | `OpenDungeon` | `Express`, `Vanilla JS`, `LLM`, `Agent Tooling` | `terminal`, `screenshot`, `linkout` | Real unit tests, real 1280×720 canvas screenshot, live linkout |
| `agentic-resume-builder` | `Resume Builder` | `Agent Tooling`, `LaTeX` | `terminal` | Real CLI outputs (`--help`, `--schema`, `--list`, `--lint`) |
| `pict-climate-risk-viz-chatbot` | `Climate Risk` | `Express`, `LLM`, `Geospatial` | `screenshot`, `linkout` | Real 1920×1080 bivariate risk map, repository link |
| `transcribe-plus` | `Transcribe+` | `Express`, `Vanilla JS`, `Audio` | `video`, `terminal`, `linkout` | Bundled `src/assets/clip.mp4` imported via Vite, real `npm test` output |
| `sandwave-sim` | `Sandwave` | `Vanilla JS`, `Audio` | `screenshot`, `terminal`, `linkout` | Real 1280×720 Chladni plate canvas screenshot, real `npm test` output, live linkout |
| `attention-max` | `AttentionMax` | `Vanilla JS`, `WebExtension` | `screenshot`, `terminal`, `linkout` | Real 700×1040 extension popup UI screenshot, real `npm test` output, repository link |

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads all 6 projects, verifying that every project defines a non-empty `shortTitle: string`.
### Requirement: Controlled tag vocabulary and tag-derived edge generation
The system SHALL derive undirected graph edges between projects if and only if they share one or more controlled paradigm tags from a strict union (`LLM`, `Express`, `Vanilla JS`, `Audio`, `Agent Tooling`, `LaTeX`, `Geospatial`, `WebExtension`), with a weak link spring strength (0.015) that does not overpower planar seed homing so the degree-5 node (`open-dungeon`) floats freely without pulling the graph into a central cluster.

#### Scenario: Projects share controlled paradigm tags
- **WHEN** project A and project B share at least one controlled paradigm tag
- **THEN** an undirected link is generated connecting project A and project B labeled with their shared tags.

#### Scenario: Expected exact 9-edge topology across the 6 projects
- **WHEN** the edge derivation utility processes the 6 catalog entries
- **THEN** exactly the following 9 unique undirected edges are produced:
  1. `open-dungeon` <-> `pict-climate-risk-viz-chatbot` (shared: `Express`, `LLM`)
  2. `open-dungeon` <-> `transcribe-plus` (shared: `Express`, `Vanilla JS`)
  3. `open-dungeon` <-> `sandwave-sim` (shared: `Vanilla JS`)
  4. `open-dungeon` <-> `attention-max` (shared: `Vanilla JS`)
  5. `open-dungeon` <-> `agentic-resume-builder` (shared: `Agent Tooling`)
  6. `pict-climate-risk-viz-chatbot` <-> `transcribe-plus` (shared: `Express`)
  7. `transcribe-plus` <-> `sandwave-sim` (shared: `Vanilla JS`, `Audio`)
  8. `transcribe-plus` <-> `attention-max` (shared: `Vanilla JS`)
  9. `sandwave-sim` <-> `attention-max` (shared: `Vanilla JS`)

#### Scenario: Projects share no controlled paradigm tags
- **WHEN** two projects share zero common paradigm tags
- **THEN** no direct link is generated between them.

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

### Requirement: Grid card visual thumbnails and terminal specimen fallback
The system SHALL display a 16:9 visual preview inside each `ListView` card (using `loading="lazy"` with explicit aspect ratio to prevent cumulative layout shift), displaying the video or screenshot where available, and rendering an authentic terminal CLI specimen fallback (`>_ prompt [CLI Specimen]`) for projects declaring only terminal demos (`agentic-resume-builder`), while styling the catalog index numeral as a clean, understated monospaced stamp (`text-lg font-mono text-[var(--color-muted)]`).

#### Scenario: Rendering Grid card with screenshot or video
- **WHEN** the user switches to Grid view and views a project with visual previews (e.g. OpenDungeon, Transcribe Plus, Sandwave Sim)
- **THEN** a responsive 16:9 thumbnail renders above the project summary with lazy loading enabled.

#### Scenario: Rendering Grid card for terminal-only project
- **WHEN** the user views the card for `agentic-resume-builder` in Grid view
- **THEN** a dark terminal container displays the command prompt in monospaced cyan typography with `[CLI Specimen]` badge without broken image placeholders.
