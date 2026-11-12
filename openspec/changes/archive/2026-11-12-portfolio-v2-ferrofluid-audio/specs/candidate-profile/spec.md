## MODIFIED Requirements

### Requirement: Canonical page metadata and social link previews
The system SHALL populate `index.html` with canonical page title (`Gregory Lazatin | Portfolio`), description, and social meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`) derived from the candidate profile to ensure link unfurls in LinkedIn, Slack, and message previews display authentic professional identity rather than placeholder strings.

#### Scenario: Inspecting document metadata
- **WHEN** the application is loaded
- **THEN** `document.title` matches `Gregory Lazatin | Portfolio` and Open Graph tags contain non-empty `og:title`, `og:description`, and `og:url`.
