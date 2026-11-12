## MODIFIED Requirements

### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 8 projects with concrete preview mappings, paradigm tags, full descriptive titles, mandatory non-empty `shortTitle: string` entries for graph nodes, optional `repo?: string` handling for design-only works, and authentic asset sources:

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

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads all 8 projects, verifying that every project defines a non-empty `shortTitle: string` and cleanly handles missing `repo` attributes.

### Requirement: Controlled tag vocabulary and tag-derived edge generation
The system SHALL derive undirected graph edges between projects if and only if they share one or more controlled paradigm tags from a strict union (`LLM`, `Express`, `Vanilla JS`, `Audio`, `Agent Tooling`, `LaTeX`, `Geospatial`, `WebExtension`, `Graphics`, `Design`), with a weak link spring strength (0.015) that does not overpower planar seed homing so all nodes float freely without pulling the graph into a central cluster.

#### Scenario: Projects share controlled paradigm tags
- **WHEN** project A and project B share at least one controlled paradigm tag
- **THEN** an undirected link is generated connecting project A and project B labeled with their shared tags.

#### Scenario: Expected exact 13-edge topology across the 8 projects
- **WHEN** the edge derivation utility processes the 8 catalog entries
- **THEN** exactly the following 13 unique undirected edges are produced:
  1. `open-dungeon` <-> `pict-climate-risk-viz-chatbot` (shared: `Express`, `LLM`)
  2. `open-dungeon` <-> `transcribe-plus` (shared: `Express`, `Vanilla JS`)
  3. `open-dungeon` <-> `sandwave-sim` (shared: `Vanilla JS`)
  4. `open-dungeon` <-> `attention-max` (shared: `Vanilla JS`)
  5. `open-dungeon` <-> `agentic-resume-builder` (shared: `Agent Tooling`)
  6. `agentic-resume-builder` <-> `attention-max` (shared: `Design`)
  7. `agentic-resume-builder` <-> `ivy-film-festival-2026` (shared: `Design`)
  8. `pict-climate-risk-viz-chatbot` <-> `transcribe-plus` (shared: `Express`)
  9. `transcribe-plus` <-> `sandwave-sim` (shared: `Vanilla JS`, `Audio`)
  10. `transcribe-plus` <-> `attention-max` (shared: `Vanilla JS`)
  11. `sandwave-sim` <-> `attention-max` (shared: `Vanilla JS`)
  12. `attention-max` <-> `kintsugi-fracture` (shared: `Graphics`)
  13. `attention-max` <-> `ivy-film-festival-2026` (shared: `Design`)

#### Scenario: Projects share no controlled paradigm tags
- **WHEN** two projects share zero common paradigm tags
- **THEN** no direct link is generated between them.

### Requirement: Mandatory engineering classification and stable deterministic catalog formatters
The system SHALL require a non-empty `classification: string` on every `ProjectData` catalog entry (e.g., `"NEURAL ADVENTURE // STATE RUNTIME"`), and derive catalog index codes (`01`–`08`) and plate numbers (`PL-01`–`PL-08`) deterministically via dedicated utility functions (`src/utils/drafting.ts`) adhering to stable catalog order.

#### Scenario: Engineering classification and plate number formatting
- **WHEN** any of the 8 projects is rendered in the catalog, inspector, or grid
- **THEN** it displays its uppercase classification string and deterministic plate number formatted between PL-01 and PL-08.
