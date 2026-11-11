## MODIFIED Requirements

### Requirement: Accessible project inspector drawer
The system SHALL display an accessible inspection drawer (`role="dialog"`, `aria-modal="true"`, focus trap, sliding from the right on desktop and presenting as a bottom sheet on mobile) with zero border radius (`rounded-none`), sharp 1px hairline dividers, preserving `aria-label={`${title} project details`}` and the semantic `<h2>` heading node without duplicating the root `<h1>`.

#### Scenario: User opens the drawer
- **WHEN** a project is activated
- **THEN** the drawer mounts with `aria-modal="true"`, traps focus inside the drawer container, and displays project metadata, preview tabs, and direct links within a sharp 0px radius layout.

#### Scenario: User closes the drawer
- **WHEN** the user clicks the close button, clicks the backdrop, or presses the Escape key
- **THEN** the drawer unmounts, keyboard focus returns cleanly to the triggering element, and the URL hash is cleared.

### Requirement: Interactive terminal simulation
The system SHALL provide a client-side terminal simulator for projects declaring a terminal demo, dynamically resolving commands against the project's own command table (`TerminalDemo.commands`), displaying a surgical cyan `>_` prompt, and highlighting diagnostic exit codes with an amber warning chip on non-zero exit codes (e.g. exit code 127) and green/neutral on exit code 0.

#### Scenario: Running a recognized per-project command
- **WHEN** the user types or clicks a command chip defined in the active project's `terminalDemo.commands` (e.g., '--schema' for Resume Builder or 'npm test' for Transcribe Plus)
- **THEN** the terminal executes the command client-side, records it to command history, and displays the formatted output with exit code 0 in neutral/green status.

#### Scenario: Running an unrecognized command or command with non-zero exit code
- **WHEN** the user enters an unrecognized command or runs a command returning non-zero status
- **THEN** the terminal displays exit code 127 with an amber diagnostic chip (`#eab308`) without executing arbitrary external code.

## ADDED Requirements

### Requirement: Accessible stepped character decoding title overlay
The system SHALL animate the project title upon drawer open using a rapid, non-interpolated stepped character decode effect running strictly inside an `aria-hidden="true"` visual container placed in the same CSS grid cell as the permanent semantic `<h2 className="sr-only">` to prevent layout width jitter, while clearing all timers upon component unmount or project switching.

#### Scenario: User opens drawer with animations enabled
- **WHEN** a project drawer opens under standard motion preferences
- **THEN** a visual scramble animation cycles through random glyphs at 12fps for no longer than 350ms before resolving to the exact project title, while screen readers immediately receive the static, uncorrupted title from the semantic `<h2>`.

#### Scenario: User opens drawer with reduced motion enabled
- **WHEN** the user opens a project drawer with `prefers-reduced-motion: reduce` active
- **THEN** the title immediately renders in its final resolved state without executing the stepped decoding timer.

#### Scenario: Component unmounts or project changes during scramble
- **WHEN** the drawer is dismissed or another project is selected via deep-link hash while the 350ms animation is in progress
- **THEN** the interval timer is immediately cleared without memory leaks or state updates on an unmounted component.

### Requirement: Architectural blueprint specimen layout
The system SHALL format the project drawer as an engineering blueprint featuring an oversized watermark numeral (`01`–`06`) in the background, sharp 1px hairline separators, monospaced metadata headers with portfolio build SHA, and surgical cyan accents for active tabs.

#### Scenario: Viewing the blueprint drawer
- **WHEN** the project drawer is displayed
- **THEN** it renders with zero corner radius, an oversized translucent watermark index numeral, and sharp monospaced section headers.
