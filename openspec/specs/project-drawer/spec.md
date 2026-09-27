# project-drawer Specification

## Purpose

Provides an adaptive project inspection drawer that renders discriminated preview modalities including interactive terminal emulation, media playback, and direct repository links.

## Requirements

### Requirement: Accessible project inspector drawer
The system SHALL display an accessible inspection drawer (`aria-modal="true"`, focus trap, sliding from the right on desktop and presenting as a bottom sheet on mobile) when a project is selected via graph click, list view click, or deep link.

#### Scenario: User opens the drawer
- **WHEN** a project is activated
- **THEN** the drawer mounts with `aria-modal="true"`, traps focus inside the drawer container, and displays project metadata, preview tabs, and direct links.

#### Scenario: User closes the drawer
- **WHEN** the user clicks the close button, clicks the backdrop, or presses the Escape key
- **THEN** the drawer unmounts, keyboard focus returns cleanly to the triggering element, and the URL hash is cleared.

### Requirement: Interactive terminal simulation
The system SHALL provide a client-side terminal simulator for projects declaring a terminal demo, dynamically resolving commands against the project's own command table (`TerminalDemo.commands`) and displaying status-tag highlighted diagnostic outputs with real captured exit codes.

#### Scenario: Running a recognized per-project command
- **WHEN** the user types or clicks a command chip defined in the active project's `terminalDemo.commands` (e.g., '--schema' for Resume Builder or 'npm test' for Transcribe Plus)
- **THEN** the terminal executes the command client-side, records it to command history, and displays the formatted output with its captured exit code.

#### Scenario: Running an unrecognized command
- **WHEN** the user enters an unrecognized command
- **THEN** the terminal displays a 'command not found' notice with suggestions based on the project's available commands and exit code 127 without executing arbitrary external code.

### Requirement: Media preview playback
The system SHALL support video and screenshot preview playback inside the project drawer without requiring external iframe embedding.

#### Scenario: Project declares a video demo
- **WHEN** a project with a video preview (Transcribe Plus) is opened in the drawer
- **THEN** an accessible HTML5 video player renders with playback controls and plays the bundled asset (`clip.mp4`).

#### Scenario: Project declares a screenshot preview
- **WHEN** a project with a screenshot preview (OpenDungeon, PICT Viz, Sandwave Sim, or Attention Max) is opened in the drawer
- **THEN** the high-resolution screenshot renders with an accessible caption.
