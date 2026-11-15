# project-catalog Specification

## MODIFIED Requirements

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
