## MODIFIED Requirements

### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 6 projects with concrete preview mappings, paradigm tags, human display titles, concise `shortTitle` entries for graph nodes, and authentic asset sources:

| Project ID | Short Title | Paradigm Tags | Previews | Asset Source |
| :--- | :--- | :--- | :--- | :--- |
| `open-dungeon` | `OpenDungeon` | `Express`, `Vanilla JS`, `LLM`, `Agent Tooling` | `terminal`, `screenshot`, `linkout` | Real unit tests, real 1280×720 canvas screenshot, live linkout |
| `agentic-resume-builder` | `Resume Builder` | `Agent Tooling`, `LaTeX` | `terminal` | Real CLI outputs (`--help`, `--schema`, `--list`, `--lint`) |
| `pict-climate-risk-viz-chatbot` | `Climate Risk` | `Express`, `LLM`, `Geospatial` | `screenshot`, `linkout` | Real 1920×1080 bivariate risk map, repository link |
| `transcribe-plus` | `Transcribe+` | `Express`, `Vanilla JS`, `Audio` | `video`, `terminal`, `linkout` | Bundled `src/assets/clip.mp4` imported via Vite, real `npm test` output |
| `sandwave-sim` | `Sandwave` | `Vanilla JS`, `Audio` | `screenshot`, `terminal`, `linkout` | Real 1280×720 Chladni plate canvas screenshot, real `npm test` output, live linkout |
| `attention-max` | `AttentionMax` | `Vanilla JS`, `WebExtension` | `screenshot`, `terminal`, `linkout` | Real 700×1040 extension popup UI screenshot, real `npm test` output, repository link |

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads the project catalog containing the 6 verified projects with their typed previews, paradigm tags, full titles, and concise short titles.

## ADDED Requirements

### Requirement: Candidate contact and profile metadata
The system SHALL maintain verified candidate profile contact channels in the codebase, defining:
- Candidate Name: `Gregory Lazatin`
- Title: `Creative Technologist & Software Engineer`
- Email: `mailto:gregory.lazatin2006@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/gregory-lazatin/`
- GitHub: `https://github.com/slowbutfast`
- Resume URL: `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/view?usp=drive_link`
- Resume Embed URL: `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview`

#### Scenario: Rendering candidate contact channels
- **WHEN** the About modal or top-level contact triggers render
- **THEN** the verified candidate links are populated correctly with target="_blank" and rel="noreferrer" where appropriate.
