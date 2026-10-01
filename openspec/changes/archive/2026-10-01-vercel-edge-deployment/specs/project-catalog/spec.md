## MODIFIED Requirements

### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 6 projects with concrete preview mappings, paradigm tags, and authentic, bundler-imported content-hashed asset sources:

| Project ID | Paradigm Tags | Previews | Asset Source |
| :--- | :--- | :--- | :--- |
| `open-dungeon` | `Express`, `Vanilla JS`, `LLM`, `Agent Tooling` | `terminal`, `screenshot`, `linkout` | Captured real unit tests, real 1280×720 canvas screenshot (`src/assets/screenshots/open-dungeon.png`), live linkout |
| `agentic-resume-builder` | `Agent Tooling`, `LaTeX` | `terminal` | Real CLI outputs (`--help`, `--schema`, `--list`, `--lint`) |
| `pict-climate-risk-viz-chatbot` | `Express`, `LLM`, `Geospatial` | `screenshot`, `linkout` | Real 1920×1080 bivariate risk map (`src/assets/screenshots/pict-climate-risk-viz-chatbot.png`), repository link |
| `transcribe-plus` | `Express`, `Vanilla JS`, `Audio` | `video`, `terminal`, `linkout` | Bundled `src/assets/clip.mp4` imported via Vite, real `npm test` output |
| `sandwave-sim` | `Vanilla JS`, `Audio` | `screenshot`, `terminal`, `linkout` | Real 1280×720 Chladni plate canvas screenshot (`src/assets/screenshots/sandwave-sim.png`), real `npm test` output, live linkout |
| `attention-max` | `Vanilla JS`, `WebExtension` | `screenshot`, `terminal`, `linkout` | Real 700×1040 extension popup UI screenshot (`src/assets/screenshots/attention-max.png`), real `npm test` output, repository link |

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads the project catalog containing the 6 verified projects with their typed previews, paradigm tags, and metadata.
