## ADDED Requirements

### Requirement: Accessible About modal dialog
The system SHALL provide an accessible About dialog (`role="dialog"`, `aria-modal="true"`, `aria-label="About Gregory Lazatin"`, with focus trap, backdrop dismissal, Escape key handler, and `#/about` deep-link routing) presenting the candidate's bio narrative, focus areas, and prominent top-mounted contact channels.

#### Scenario: User opens About dialog via navigation or deep link
- **WHEN** the user clicks "About" in the top navigation or visits `#/about`
- **THEN** the About dialog mounts with focus trapped inside, and the URL hash updates to `#/about`.

#### Scenario: User dismisses About dialog
- **WHEN** the user presses Escape, clicks the close button, or clicks the backdrop
- **THEN** the dialog unmounts, focus returns to the triggering "About" button, and the URL hash is cleared.

### Requirement: Recruiter candidate identity and canonical engineering tagline
The system SHALL display the candidate name `Gregory Lazatin` in the top header alongside a canonical engineering tagline (`Software Engineer · Autonomous Agents & Graphics`) rendered at 12px with high contrast on both desktop and mobile viewports, ensuring immediate candidate identity recognition.

#### Scenario: Viewing top header across viewports
- **WHEN** the page is loaded on any viewport (desktop or mobile)
- **THEN** the brand button displays "Gregory Lazatin" and the subtitle tagline displays "Software Engineer · Autonomous Agents & Graphics" at 12px without horizontal collision.

### Requirement: Progressive top bar scroll scrim
The system SHALL render a progressive gradient backdrop scrim (`from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent`) and subtle backdrop blur behind the top bar controls to preserve high contrast and 100% text legibility when project cards or background elements scroll beneath the top bar in Grid view.

#### Scenario: Scrolling content under the top bar in Grid view
- **WHEN** the user switches to Grid view and scrolls project cards down the page
- **THEN** cards pass smoothly underneath the progressive gradient scrim without colliding illegibly with top bar text or buttons.

### Requirement: Top-mounted recruiter contact and click-to-load resume embed
The system SHALL mount prominent candidate contact buttons (Email, LinkedIn, GitHub, Resume) at the top of the About modal body, and provide an interactive click-to-load toggle revealing a sandboxed Google Drive document viewer (`<iframe>` with `title="Resume - Gregory Lazatin"`, `referrerpolicy="no-referrer"`, and `sandbox="allow-scripts allow-same-origin allow-popups"`), while preserving the direct `Resume (Drive) ↗` link as the primary action.

#### Scenario: Recruiter views top of About dialog
- **WHEN** the About dialog opens
- **THEN** direct links for Email (`mailto:`), LinkedIn, GitHub, and Resume are immediately visible at the top of the modal before long bio text.

#### Scenario: Recruiter activates click-to-load resume preview
- **WHEN** the user clicks the "Preview Resume" button
- **THEN** the sandboxed iframe loads `https://drive.google.com/file/d/.../preview` with explicit `title` and `referrerpolicy` without executing unverified third-party scripts on initial modal mount.
