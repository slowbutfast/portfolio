# Visual & Interaction Design: Node Cursor & Swell Gain

## 1. Visual Aesthetic & Scope

No color palette, typography, or layout changes are introduced. This change refines desktop tactile cursor feedback on the interactive graph `<canvas>` and balances the procedural node interaction sound cue relative to the ambient drone.

---

## 2. Component Anatomy & States

### Component: `GraphCanvas` (`data-testid="graph-canvas"`)

- **Visual Hierarchy & Placement**: Full-bleed interactive `<canvas>` inside `.drafting-grid`.
- **Pointer Cursor States (Desktop / fine pointer)**:
  - **Default / Empty Canvas**: `cursor: default` (inherited from `.canvas-interactive` and restored on empty-canvas hover, `pointerleave`, and `pointercancel`).
  - **Hovering a Project Node (`r = 22px`)**: `cursor: grab`, signaling that the node can be picked up and dragged.
  - **Pressing / Dragging a Project Node (`pointerdown` through `sim.state === 'drag'`)**: `cursor: grabbing`, signaling active manipulation.
  - **Pointer Release (`pointerup`)**: `cursor: grab` if the pointer remains over a node; `cursor: default` if released over empty canvas.

---

## 3. Responsive Layout & Breakpoints

| Viewport | Breakpoint | Behavior |
| :--- | :--- | :--- |
| **Mobile / Touch** | `< 768px` / coarse pointer | Touch pointers do not render CSS cursors; existing touch drag, tap, and `pointercancel` behaviors remain unchanged. |
| **Desktop** | `≥ 768px` / fine pointer | Cursor transitions cleanly between `default`, `grab`, and `grabbing` as the pointer enters, presses/drags, and releases nodes. |

---

## 4. Interaction, Motion & Sound

- **Transitions**: Cursor transitions are synchronous on pointer hit-testing (`setCanvasCursor`) with zero delay and zero React re-renders.
- **Audio Affordance**:
  - Default sound state remains **off** (`DEFAULT_SOUND_ENABLED = false`) for first-time visits, with `localStorage` preference persistence intact.
  - Node interaction resonance swell (`HOVER_SWELL_GAIN`) is reduced by **50%** from `1.0` to `0.5`, so hovering, clicking/inspecting, or dragging a node swells gently (`0.5` peak, `0.175` sustained plateau after `1.2 s`) without overpowering the 65Hz ambient drone (`BASE_DRONE_GAIN = 0.063`) or pink noise floor (`NOISE_FLOOR_GAIN = 0.016`).

---

## 5. Do's and Don'ts

- **DO** keep `canvas.style.cursor` mutations inside `setCanvasCursor` with the redundant-write check (`canvas.style.cursor !== cursor`).
- **DO** keep `ProjectDrawer` border drag cursor (`move`) and Studio `SeedMiniMap` cursor (`cursor-grab`) untouched.
- **DON'T** introduce React state for cursor tracking on `pointermove`.
- **DON'T** alter `BASE_DRONE_GAIN`, `NOISE_FLOOR_GAIN`, `MASTER_GAIN`, or `DEFAULT_SOUND_ENABLED`.
