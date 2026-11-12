/**
 * Authoritative planar embedding for the six-project graph.
 *
 * The four nodes `open-dungeon`, `transcribe-plus`, `sandwave-sim`, and
 * `attention-max` form a complete K4 subgraph. A straight-line planar K4
 * requires exactly one vertex inside the triangle formed by the other three;
 * `sandwave-sim` is nested strictly inside
 * triangle(open-dungeon, transcribe-plus, attention-max).
 */
export interface PlanarSeed {
  x: number;
  y: number;
}

export const PLANAR_NODE_SEEDS: Record<string, PlanarSeed> = {
  'agentic-resume-builder': { x: 0.18, y: 0.5 },
  'open-dungeon': { x: 0.4, y: 0.48 },
  'pict-climate-risk-viz-chatbot': { x: 0.56, y: 0.22 },
  'transcribe-plus': { x: 0.72, y: 0.42 },
  'sandwave-sim': { x: 0.56, y: 0.55 },
  'attention-max': { x: 0.52, y: 0.8 },
};

/**
 * Scale normalized seeds to a canvas viewport. Independent x/y scaling is an
 * affine map, so a planar normalized embedding stays planar at every positive
 * viewport size.
 */
export function scaleSeeds(
  seeds: Record<string, PlanarSeed>,
  width: number,
  height: number,
): Record<string, [number, number]> {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const scaled: Record<string, [number, number]> = {};
  for (const [id, seed] of Object.entries(seeds)) {
    scaled[id] = [seed.x * w, seed.y * h];
  }
  return scaled;
}
