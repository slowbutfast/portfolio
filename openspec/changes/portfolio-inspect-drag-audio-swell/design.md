## Overview

**Status: Audio behavior change with one control-surface affordance.**
No canvas, drawer, card, or layout changes. The only visual change is how the top-right settings trigger communicates that sound is active.

## Visual Design

- The `Filters & Layout` trigger renders its three-dot `MoreHorizontal` glyph in `--color-accent` whenever `soundEnabled` is `true`.
- No separate indicator dot or badge is rendered; the glyph itself is the active-state indicator.
- When sound is disabled, the glyph returns to the muted header text color.
- The desktop `Sound` control keeps its existing accent underline; the accent glyph applies on both desktop and mobile.
