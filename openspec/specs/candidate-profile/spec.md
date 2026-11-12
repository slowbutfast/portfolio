# candidate-profile Specification

## Purpose

Defines the single source of truth for candidate personal identity, contact endpoints, social links, resume links, bio narrative, and canonical page metadata.

## Requirements

### Requirement: Verified candidate profile dataset
The system SHALL maintain a typed dataset in `src/data/profile.ts` exporting a verified `CandidateProfile` object with valid protocols (`mailto:` for email; `https:` for social, web, and resume links):
- Candidate Name: `Gregory Lazatin`
- Canonical Tagline: `Software Engineer · Autonomous Agents & Graphics`
- Full Title: `Gregory Lazatin — Software Engineer & Creative Technologist`
- Bio: `Gregory Lazatin is currently a Junior at Brown University studying Computer Science. He has worked on applied AI systems, geospatial data engineering, and interactive web apps, built with agentic workflows and test-driven design.`
- Email: `mailto:gregory.lazatin2006@gmail.com`
- LinkedIn: `https://www.linkedin.com/in/gregory-lazatin/`
- GitHub: `https://github.com/slowbutfast`
- Resume URL: `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/view?usp=drive_link`
- Resume Embed URL: `https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview`

#### Scenario: Application imports candidate profile
- **WHEN** the About modal, top controls, or metadata renderers initialize
- **THEN** candidate contact channels and canonical tagline are sourced directly from `src/data/profile.ts`.

#### Scenario: Validating profile URL protocols
- **WHEN** profile dataset is validated by unit tests
- **THEN** email begins with `mailto:` and all external links begin with `https://`.

### Requirement: Canonical page metadata and social link previews
The system SHALL populate `index.html` with canonical page title (`Gregory Lazatin | Portfolio`), description, and social meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`) derived from the candidate profile to ensure link unfurls in LinkedIn, Slack, and message previews display authentic professional identity rather than placeholder strings.

#### Scenario: Inspecting document metadata
- **WHEN** the application is loaded
- **THEN** `document.title` matches `Gregory Lazatin | Portfolio` and Open Graph tags contain non-empty `og:title`, `og:description`, and `og:url`.
