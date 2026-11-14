## MODIFIED Requirements

### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 9 projects with concrete preview mappings, paradigm tags, full descriptive titles, mandatory non-empty `shortTitle: string` entries for graph nodes, optional `repo?: string` handling for design/art works, optional `rainbowOnInteract?: boolean`, and authentic asset sources:

| Project ID | Mandatory Short Title | Paradigm Tags | Previews | Asset Source |
| :--- | :--- | :--- | :--- | :--- |
| `open-dungeon` | `OpenDungeon` | `Express`, `Vanilla JS`, `LLM`, `Agent Tooling` | `terminal`, `screenshot`, `linkout` | Real unit tests, real 1280×720 canvas screenshot, live linkout |
| `agentic-resume-builder` | `Resume Builder` | `Agent Tooling`, `LaTeX`, `Design` | `terminal` | Real CLI outputs (`--help`, `--schema`, `--list`, `--lint`) |
| `pict-climate-risk-viz-chatbot` | `Climate Risk` | `Express`, `LLM`, `Geospatial` | `screenshot`, `linkout` | Real 1920×1080 bivariate risk map, repository link |
| `transcribe-plus` | `Transcribe+` | `Express`, `Vanilla JS`, `Audio` | `video`, `terminal`, `linkout` | Bundled `src/assets/clip.mp4` imported via Vite, real `npm test` output |
| `sandwave-sim` | `Sandwave` | `Vanilla JS`, `Audio` | `screenshot`, `terminal`, `linkout` | Real 1280×720 Chladni plate canvas screenshot, real `npm test` output, live linkout |
| `attention-max` | `AttentionMax` | `Vanilla JS`, `WebExtension`, `Design`, `Graphics` | `screenshot`, `terminal`, `linkout` | Real 700×1040 extension popup UI screenshot, real `npm test` output, repository link |
| `kintsugi-fracture` | `Kintsugi 3D` | `Graphics` | `screenshot`, `linkout` | Real 3D model processor screenshot, repository and Vercel live links |
| `ivy-film-festival-2026` | `Ivy Film Fest` | `Design` | `screenshot`, `linkout` | Real festival landing page screenshot, live linkout (no repo) |
| `art-wip` | `Art (WIP)` | `Design`, `Graphics` | `wip`, `linkout` | Static `/art/` WIP endpoint, `rainbowOnInteract: true` (no repo) |

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads all 9 projects, verifying that every project defines a non-empty `shortTitle: string` and cleanly handles missing `repo` attributes.

### Requirement: Controlled tag vocabulary and tag-derived edge generation
The system SHALL derive undirected graph edges between projects if and only if they share one or more controlled paradigm tags from a strict union (`LLM`, `Express`, `Vanilla JS`, `Audio`, `Agent Tooling`, `LaTeX`, `Geospatial`, `WebExtension`, `Graphics`, `Design`), with a weak link spring strength (0.015) that does not overpower planar seed homing so all nodes float freely without pulling the graph into a central cluster.

#### Scenario: Projects share controlled paradigm tags
- **WHEN** project A and project B share at least one controlled paradigm tag
- **THEN** an undirected link is generated connecting project A and project B labeled with their shared tags.

#### Scenario: Expected exact 17-edge topology across the 9 projects
- **WHEN** the edge derivation utility processes the 9 catalog entries
- **THEN** exactly 17 unique undirected edges are produced (the original 13 edges plus the 4 edges connecting `art-wip` to `agentic-resume-builder`, `attention-max`, `ivy-film-festival-2026`, and `kintsugi-fracture`).

#### Scenario: Projects share no controlled paradigm tags
- **WHEN** two projects share zero common paradigm tags
- **THEN** no direct link is generated between them.

### Requirement: Mandatory engineering classification and stable deterministic catalog formatters
The system SHALL require a non-empty `classification: string` on every `ProjectData` catalog entry (e.g., `"NEURAL ADVENTURE // STATE RUNTIME"`), and derive catalog index codes (`01`–`09`) and plate numbers (`PL-01`–`PL-09`) deterministically via dedicated utility functions (`src/utils/drafting.ts`) adhering to stable catalog order.

#### Scenario: Engineering classification and plate number formatting
- **WHEN** any of the 9 projects is rendered in the catalog, inspector, or grid
- **THEN** it displays its uppercase classification string and deterministic plate number formatted between PL-01 and PL-09.

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
