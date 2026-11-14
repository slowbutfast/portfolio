## ADDED Requirements

### Requirement: Static WIP art endpoint
The system SHALL serve a static HTML document at `/art/` (`public/art/index.html` emitted to `dist/art/index.html`) whose `<title>` is `WIP` and whose visible body content is `WIP`, with no inline `<script>` or `<style>` tags so it complies with the site's `default-src 'self'` Content Security Policy.

#### Scenario: Navigating to the WIP art endpoint
- **WHEN** a user or test navigates to `/art/`
- **THEN** the response returns HTML with document title `WIP` and body text `WIP` without CSP violations.
