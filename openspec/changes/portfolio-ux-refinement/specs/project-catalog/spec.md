## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Grid card visual thumbnails and terminal specimen fallback
The system SHALL display a 16:9 visual preview inside each `ListView` card (using `loading="lazy"` with explicit aspect ratio to prevent cumulative layout shift), displaying the video or screenshot where available, and rendering an authentic terminal CLI specimen fallback (`>_ prompt [CLI Specimen]`) for projects declaring only terminal demos (`agentic-resume-builder`), while styling the catalog index numeral as a clean, understated monospaced stamp (`text-lg font-mono text-[var(--color-muted)]`).

#### Scenario: Rendering Grid card with screenshot or video
- **WHEN** the user switches to Grid view and views a project with visual previews (e.g. OpenDungeon, Transcribe Plus, Sandwave Sim)
- **THEN** a responsive 16:9 thumbnail renders above the project summary with lazy loading enabled.

#### Scenario: Rendering Grid card for terminal-only project
- **WHEN** the user views the card for `agentic-resume-builder` in Grid view
- **THEN** a dark terminal container displays the command prompt in monospaced cyan typography with `[CLI Specimen]` badge without broken image placeholders.
