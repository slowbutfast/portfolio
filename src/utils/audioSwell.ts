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
