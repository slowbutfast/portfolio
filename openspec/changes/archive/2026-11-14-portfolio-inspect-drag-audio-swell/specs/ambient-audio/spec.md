## MODIFIED Requirements

### Requirement: Node hover harmonic resonance swell
The system SHALL route the rich oscillator source into a parallel resonant bandpass filter ($Q = 2.5$) sweepable across 450Hz–1400Hz (resting center 750Hz), applying a non-clipping gain swell (`HOVER_SWELL_GAIN = 1.0`) whenever any canvas node is hovered, pressed/dragged (`pointerdown` on a node through `pointerup`/`pointercancel`/`pointerleave`), or open in `ProjectDrawer` (`selectedId !== null` in either Graph or Grid view), settling to a `35%` plateau (`0.35`) after `1.2 s` of sustained activation, re-arming to `HOVER_SWELL_GAIN` once when `ProjectDrawer` opens even if hover or drag is already active (desktop inspect parity with a fresh mobile tap), and returning to baseline (`0`) only when hover, drag, and inspect are all inactive (including when switching to reduced motion while an inspector remains open), with all gain and frequency changes ramped via `setTargetAtTime(target, ctx.currentTime, 0.05)` (a `50ms` time constant) to eliminate zipper clicks.

#### Scenario: Pointer hovers over a canvas node
- **WHEN** the pointer moves over any project node while sound is enabled
- **THEN** the bandpass filter opens to `HOVER_SWELL_GAIN` (`1.0`) with a `50ms` time constant, producing harmonic excitation without clipping (`< 0 dBFS`).

#### Scenario: Pointer leaves a canvas node
- **WHEN** the pointer leaves the node boundary and no node is actively dragged or open in `ProjectDrawer`
- **THEN** the bandpass filter gain smoothly decays back to zero with a `50ms` time constant.

#### Scenario: User drags a node or inspects a project
- **WHEN** the user presses/drags a node on the graph canvas or opens `ProjectDrawer` for a project (from Graph or Grid view) while sound is enabled
- **THEN** the bandpass filter opens to `HOVER_SWELL_GAIN` (`1.0`), re-arms once on inspector open even if hover had already settled, settles to a `35%` plateau after `1.2 s` if held/open, and remains active until hover, drag, and the inspector are all inactive.
