## ADDED Requirements

### Requirement: Recruiter candidate identity and engineering tagline
The system SHALL display the candidate name `Gregory Lazatin` in the top header and, on desktop viewports (`>= 768px`), an engineering subtitle tagline (`Software Engineer · Autonomous Agents & Graphics`) to immediately establish candidate identity and technical discipline.

#### Scenario: Desktop visitor views top header
- **WHEN** the page is loaded on a desktop viewport (`>= 768px`)
- **THEN** the brand link displays "Gregory Lazatin" and a monospaced subtitle tagline reads "Software Engineer · Autonomous Agents & Graphics".

#### Scenario: Mobile visitor views top header
- **WHEN** the page is loaded on a mobile viewport (`< 768px`)
- **THEN** the brand link displays "Gregory Lazatin" and the subtitle is hidden to preserve horizontal clearance for action controls.

### Requirement: Progressive top bar scroll scrim
The system SHALL render a progressive gradient backdrop scrim (`from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent`) and subtle backdrop blur behind the top bar controls to preserve high contrast and 100% text legibility when project cards or background elements scroll beneath the top bar in Grid view.

#### Scenario: Scrolling content under the top bar in Grid view
- **WHEN** the user switches to Grid view and scrolls project cards down the page
- **THEN** cards pass smoothly underneath the progressive gradient scrim without colliding illegibly with top bar text or buttons.

### Requirement: Recruiter contact and embedded resume in About modal
The system SHALL provide direct candidate contact actions within the About modal (`role="dialog"`), including email (`mailto:gregory.lazatin2006@gmail.com`), LinkedIn (`https://www.linkedin.com/in/gregory-lazatin/`), GitHub (`https://github.com/slowbutfast`), and an interactive toggleable or inline embedded Google Drive resume viewer (`https://drive.google.com/file/d/1zcDDcEDFt9oXSsbcvQObDyr1py2OjimW/preview`) with a direct open link.

#### Scenario: Recruiter opens About modal and accesses contact channels
- **WHEN** the user opens the About modal
- **THEN** direct links to Email, LinkedIn, GitHub, and Resume are visible and keyboard-navigable.

#### Scenario: Recruiter views embedded resume
- **WHEN** the user triggers the embedded resume preview inside the About modal
- **THEN** an accessible `<iframe>` renders the Google Drive document preview cleanly without CSP console errors.
