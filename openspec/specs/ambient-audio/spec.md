# ambient-audio Specification

## Purpose

Synthesizes the procedural Web Audio ambient circuit hum, hover resonance, spatial modulation, and accessible sound toggle without network audio assets.

## Requirements

### Requirement: Real-time Web Audio procedural circuit synthesizer
The system SHALL synthesize an analog circuit ambient hum using the native Web Audio API, combining a 65Hz sawtooth oscillator with subtle pink noise through a 24dB/oct resonant lowpass filter set to 600Hz at -24dBFS master output, producing zero network asset requests and generating harmonic overtones audible on mobile and laptop speakers.

#### Scenario: Audio synthesizer starts upon user gesture
- **WHEN** the visitor activates the Sound toggle or interacts with the canvas while sound is enabled
- **THEN** the Web Audio AudioContext transitions to `running`, starts the 65Hz sawtooth oscillator and noise source, and routes output through the master gain node.

#### Scenario: Audio synthesizer respects initial mute default
- **WHEN** the page first mounts without prior user preference
- **THEN** `localStorage.getItem('portfolio_sound_enabled')` defaults to `'false'`, the AudioContext remains suspended or master gain is set to 0.0, producing strictly 0 dB sound output until explicit user activation.

#### Scenario: Tab visibility suspend and armed autoplay recovery
- **WHEN** the browser tab visibility changes to hidden
- **THEN** the AudioContext is immediately suspended to conserve battery and CPU; when the tab returns to foreground and sound is enabled, the AudioContext is resumed.
- **WHEN** a returning user has `portfolio_sound_enabled === 'true'` but the browser autoplay policy prevents immediate audio playback
- **THEN** the audio engine enters an "armed" state, cleanly resuming audio upon the user's first click or touch without console warnings or playback interruptions.

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

### Requirement: Canvas spatial panning and EQ modulation
The system SHALL map the active canvas pointer coordinates $(x, y)$ to real-time spatialization parameters during interaction:
- Normalized horizontal coordinate $x / W \in [0, 1]$ maps linearly to `StereoPannerNode.pan` $\in [-0.75, 0.75]$.
- Normalized vertical coordinate $y / H \in [0, 1]$ maps linearly to the parallel bandpass center frequency $\in [450\text{Hz}, 1400\text{Hz}]$.
- Drag velocity applies a subtle $\pm 5\%$ frequency modulation to the base oscillator.

#### Scenario: User drags a node across canvas with sound enabled
- **WHEN** a node is dragged from the left side of the canvas to the right side
- **THEN** the stereo pan sweeps smoothly from left to right, and vertical motion sweeps the filter cutoff frequency.

### Requirement: Accessible audio control and user consent
The system SHALL provide an accessible `Sound` toggle button in the top-right header controls with explicit `aria-pressed` state and descriptive label, honoring user choice across visits via `localStorage.getItem('portfolio_sound_enabled')`, independent of visual motion preferences.

#### Scenario: User toggles sound on and off
- **WHEN** the user clicks the Sound button in the top header
- **THEN** the button updates `aria-pressed="true"`, audio playback begins, and subsequent click sets `aria-pressed="false"`, saves the preference to `localStorage`, and ramps master gain to 0.0 within 50ms.
