# project-catalog Specification

## Purpose

Manages the verified project portfolio data, runtime schemas, and automated derivation of graph links based on shared technical tags.

## Requirements

### Requirement: Verified project metadata catalog and preview mapping
The system SHALL maintain a typed dataset in `src/data/projects.ts` using `satisfies ProjectData[]` to guarantee compile-time verification across all 6 projects with concrete preview mappings, paradigm tags, and real asset sources:

| Project ID | Paradigm Tags | Previews | Asset Source |
| :--- | :--- | :--- | :--- |
| `open-dungeon` | `Express`, `Vanilla JS`, `LLM`, `Agent Tooling` | `terminal`, `screenshot`, `linkout` | Captured MCP test output (`scripts/mcp-smoke.js`), local web screenshot, live linkout |
| `agentic-resume-builder` | `Agent Tooling`, `LaTeX` | `terminal` | Real CLI outputs (`--help`, `--schema`, `--list`, `--lint`) |
| `pict-climate-risk-viz-chatbot` | `Express`, `LLM`, `Geospatial` | `screenshot`, `linkout` | Geospatial architecture screenshot, repository link |
| `transcribe-plus` | `Express`, `Vanilla JS`, `Audio` | `video`, `terminal`, `linkout` | Bundled `clip.mp4` copied from sibling repo, `npm test` (72 tests) output |
| `sandwave-sim` | `Vanilla JS`, `Audio` | `screenshot`, `terminal`, `linkout` | Acoustic Chladni canvas screenshot, `npm test` (vitest) output, live linkout |
| `attention-max` | `Vanilla JS`, `WebExtension` | `screenshot`, `terminal`, `linkout` | Extension popup screenshot, `npm test` (jest) output, repository link |

#### Scenario: Loading the project catalog
- **WHEN** the portfolio initializes
- **THEN** the system loads the project catalog containing the 6 verified projects with their typed previews, paradigm tags, and metadata.

### Requirement: Controlled tag vocabulary and tag-derived edge generation
The system SHALL derive undirected graph edges between projects if and only if they share one or more controlled paradigm tags from a strict union (`LLM`, `Express`, `Vanilla JS`, `Audio`, `Agent Tooling`, `LaTeX`, `Geospatial`, `WebExtension`), with link spring strength set to 0.05 so the degree-5 node (`open-dungeon`) floats freely without pulling the graph into a central cluster.

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
