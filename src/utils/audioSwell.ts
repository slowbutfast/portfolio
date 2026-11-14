/**
 * The resonance swell is active whenever a node is hovered, being dragged, or
 * open in the inspector. Keeping this truth table pure lets the canvas mirror
 * it onto `data-audio-swell` and lets the synth stay idempotent.
 */
export function deriveSwellActive(
  hovered: boolean,
  selected: boolean,
  dragging: boolean,
): boolean {
  return hovered || selected || dragging;
}

/**
 * True only on the transition into inspection. The synth uses this single
 * retrigger to restart the full swell when `ProjectDrawer` opens, so desktop
 * matches the fresh swell a mobile tap produces even when hover had already
 * settled to the plateau.
 */
export function deriveSwellRetrigger(
  selected: boolean,
  wasSelected: boolean,
): boolean {
  return selected && !wasSelected;
}
