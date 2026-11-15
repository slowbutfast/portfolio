# project-catalog Specification

## Purpose

Manages the verified project portfolio data, runtime schemas, and automated derivation of graph links based on shared technical tags.
## Requirements
### Requirement: Verified project metadata catalog and preview mapping
The system SHALL store the canonical project metadata, tag registry (`tags`, `hiddenTags`), and planar node seeds (`seeds`) in a single atomic JSON document (`src/data/projects.catalog.json`)—replacing the static 9-row literal catalog table with this schema contract—hydrated at build/runtime by `src/data/projects.ts` (`projects`, `HIDDEN_TAGS`, `getVisibleTags`, `getProjectById`) and `src/data/graphSeeds.ts` (`PLANAR_NODE_SEEDS`). `projects.ts` SHALL resolve `screenshot` and `video` `assetKey` values via a narrowed `import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,mp4,webm}', { eager: true, import: 'default' })` and `terminalDemo` `{ capturedKey, prompt }` descriptors via `import.meta.glob('./captured/*.json', { eager: true, import: 'default' })`, validate that every project's `tags` exist in `catalog.tags` and `seeds` keys match `projects` IDs 1:1, and preserve the `ProjectData` runtime contract (`repo?: string`, `liveUrl?: string`, `rainbowOnInteract?: boolean`, `omitIndex?: boolean`, `hideOverview?: boolean`, `revealLabelOnInspect?: boolean`) including the reserved `art-wip` entry (`liveUrl: '/art/'`, `tags: ['art']`, `rainbowOnInteract: true`, `omitIndex: true`, `hideOverview: true`, `revealLabelOnInspect: true`).

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** `src/data/projects.ts` hydrates every project from `src/data/projects.catalog.json`, resolving every `assetKey` and `capturedKey` to a valid bundled asset or captured terminal demo and ensuring `seeds` keys match `projects` IDs.

#### Scenario: Preserving art-wip metadata and behavior flags
- **WHEN** the catalog is hydrated
- **THEN** the reserved `art-wip` project retains `liveUrl: '/art/'`, `tags: ['art']` (with `'art'` in `HIDDEN_TAGS`), `wip` preview, and `rainbowOnInteract`, `omitIndex`, `hideOverview`, and `revealLabelOnInspect` all `true`.

### Requirement: Controlled tag vocabulary and tag-derived edge generation
The system SHALL derive undirected graph edges between projects via `deriveEdges(projects, hiddenTags?)` (and `getVisibleTags(tags, hiddenTags?)`, both defaulting `hiddenTags` to catalog `HIDDEN_TAGS`) if and only if they share one or more visible controlled paradigm tags from the catalog's `tags` registry excluding `hiddenTags` (e.g., `'art'`), keeping `hiddenTags` omitted from `deriveEdges` and UI tag chips (`NodeHoverCard`, `ProjectDrawer`, `ListView`) while preserving `art-wip`'s progressive behavior (starting disconnected in the top-left and connecting by proximity to `'art'`-tagged projects only after user interaction).

#### Scenario: Projects share controlled paradigm tags
- **WHEN** project A and project B share at least one visible tag in `tags` not listed in `hiddenTags`
- **THEN** an undirected link is generated connecting project A and project B labeled with their shared visible tags.

#### Scenario: Projects share no controlled paradigm tags
- **WHEN** two projects share zero common visible paradigm tags
- **THEN** no direct link is generated between them.

#### Scenario: Planar topology invariant across catalog edits
- **WHEN** `deriveEdges(projects)` processes the catalog entries
- **THEN** the derived permanent edge set has `0` straight-segment crossings under `countSeedCrossings` against `PLANAR_NODE_SEEDS`, without pinning a fixed project or edge count.

#### Scenario: Art WIP node starts disconnected until interacted
- **WHEN** the graph initializes with `'art'` in `hiddenTags`
- **THEN** `art-wip` has zero permanent edges from `deriveEdges(projects)` and connects to `'art'`-tagged projects only progressively after user interaction.

### Requirement: Mandatory engineering classification and stable deterministic catalog formatters
The system SHALL require a non-empty `classification: string` on every `ProjectData` catalog entry (e.g., `"NEURAL ADVENTURE // STATE RUNTIME"`), and derive catalog index codes (`01`–`08`) and plate numbers (`PL-01`–`PL-08`) deterministically via dedicated utility functions (`src/utils/drafting.ts`) adhering to stable catalog order, while allowing `omitIndex: true` projects (`art-wip`) to suppress the index stamp in `ProjectDrawer` and `ListView` so `09` remains reserved.

#### Scenario: Engineering classification and plate number formatting
- **WHEN** any numbered project is rendered in the catalog, inspector, or grid
- **THEN** it displays its uppercase classification string and deterministic plate number formatted between PL-01 and PL-08, while `art-wip` omits the `09` index stamp.

### Requirement: Build-injected portfolio build commit SHA with fallback
The system SHALL inject the portfolio site build commit SHA via a build-time global `__COMMIT_HASH__` declared in `src/vite-env.d.ts` and populated in `vite.config.ts` from `git rev-parse --short HEAD` with fallback to `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)` or `'dev'`, representing the portfolio build provenance rather than showcased repository commit history.

#### Scenario: Rendering build provenance in technical specs
- **WHEN** the technical specification header or drawer renders
- **THEN** it displays the authentic portfolio build commit SHA provided by `__COMMIT_HASH__`.

#### Scenario: Building in an environment without .git directory
- **WHEN** the application builds in an environment lacking a `.git` repository (such as Vercel CLI tarball deploys)
- **THEN** the build does not throw an unhandled exception, falling back gracefully to `VERCEL_GIT_COMMIT_SHA` or `'dev'`.

### Requirement: Grid card visual thumbnails and terminal specimen fallback
The system SHALL display a 16:9 visual preview inside each `ListView` card (using `loading="lazy"` with explicit aspect ratio to prevent cumulative layout shift), displaying the video or screenshot where available, rendering a `WIP` placeholder card for projects declaring a `wip` preview (`art-wip`), and rendering an authentic terminal CLI specimen fallback (`>_ prompt [CLI Specimen]`) for projects declaring only terminal demos (`agentic-resume-builder`), while styling the catalog index numeral as a clean, understated monospaced stamp (`text-lg font-mono text-[var(--color-muted)]`).

#### Scenario: Rendering Grid card with screenshot or video
- **WHEN** the user switches to Grid view and views a project with visual previews (e.g. OpenDungeon, Transcribe Plus, Sandwave Sim)
- **THEN** a responsive 16:9 thumbnail renders above the project summary with lazy loading enabled.

#### Scenario: Rendering Grid card for WIP project
- **WHEN** the user views the card for `art-wip` in Grid view
- **THEN** a 16:9 WIP placeholder container displays `WIP` without broken image placeholders or terminal fallback text.

#### Scenario: Rendering Grid card for terminal-only project
- **WHEN** the user views the card for `agentic-resume-builder` in Grid view
- **THEN** a dark terminal container displays the command prompt in monospaced cyan typography with `[CLI Specimen]` badge without broken image placeholders.

