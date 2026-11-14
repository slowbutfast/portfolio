/**
 * Authoritative planar embedding for the nine-project graph.
 *
 * The four nodes `open-dungeon`, `transcribe-plus`, `sandwave-sim`, and
 * `attention-max` form a complete K4 subgraph. A straight-line planar K4
 * requires exactly one vertex inside the triangle formed by the other three;
 * `sandwave-sim` is nested strictly inside
 * triangle(open-dungeon, transcribe-plus, attention-max). The perimeter
 * nodes—including `art-wip` on the bottom-left outer face—attach only to
 * vertices on the outer face so all 17 tag-derived edges remain crossing-free.
 */
export interface PlanarSeed {
  x: number;
  y: number;
}

export const SAFE_CANVAS_MARGIN = 48;

export const PLANAR_NODE_SEEDS: Record<string, PlanarSeed> = {
  'agentic-resume-builder': { x: 0.18, y: 0.5 },
  'open-dungeon': { x: 0.4, y: 0.48 },
  'pict-climate-risk-viz-chatbot': { x: 0.56, y: 0.22 },
  'transcribe-plus': { x: 0.72, y: 0.42 },
  'sandwave-sim': { x: 0.56, y: 0.55 },
  'attention-max': { x: 0.52, y: 0.8 },
  'kintsugi-fracture': { x: 0.84, y: 0.72 },
  'ivy-film-festival-2026': { x: 0.15, y: 0.75 },
  'art-wip': { x: 0.05, y: 0.97 },
};

/**
 * Map a single normalized seed into the safe interior canvas box
 * `[margin, width - margin] x [margin, height - margin]`. Because this is a
 * uniform affine transform, straight-line planarity is preserved without
 * per-node boundary clamping introducing edge crossings on narrow viewports.
 */
export function scaleSeedPoint(
  seed: PlanarSeed,
  width: number,
  height: number,
  margin: number = SAFE_CANVAS_MARGIN,
): [number, number] {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const useSafeX = w > margin * 2;
  const useSafeY = h > margin * 2;
  const x = useSafeX ? margin + seed.x * (w - margin * 2) : seed.x * w;
  const y = useSafeY ? margin + seed.y * (h - margin * 2) : seed.y * h;
  return [x, y];
}

/**
 * Scale normalized seeds to a canvas viewport using the shared safe-canvas
 * affine transform.
 */
export function scaleSeeds(
  seeds: Record<string, PlanarSeed>,
  width: number,
  height: number,
  margin: number = SAFE_CANVAS_MARGIN,
): Record<string, [number, number]> {
  const scaled: Record<string, [number, number]> = {};
  for (const [id, seed] of Object.entries(seeds)) {
    scaled[id] = scaleSeedPoint(seed, width, height, margin);
  }
  return scaled;
}
