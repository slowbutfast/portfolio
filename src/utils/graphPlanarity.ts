export type Point = [number, number];
export type Positions = Record<string, Point>;

export interface GraphEdgeLike {
  source: string;
  target: string;
  tags?: string[];
}

function cross(origin: Point, a: Point, b: Point): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

/**
 * True only for a proper crossing. Segments sharing an endpoint (or collinear
 * overlaps) do not count, matching the planar-embedding invariant.
 */
export function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Inclusive point-in-triangle test used to assert nested K4 embeddings. */
export function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const d1 = cross(a, b, p);
  const d2 = cross(b, c, p);
  const d3 = cross(c, a, p);
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNegative && hasPositive);
}

/**
 * Count proper straight-segment crossings for a set of graph edges. When
 * `knownIds` is supplied, unknown keys in `positions` are a hard error so a
 * stale seed map cannot silently pass.
 */
export function countSeedCrossings(
  positions: Positions,
  edges: readonly GraphEdgeLike[],
  knownIds?: readonly string[],
): number {
  if (knownIds) {
    const known = new Set(knownIds);
    for (const id of Object.keys(positions)) {
      if (!known.has(id)) throw new Error(`Unknown project id in position map: ${id}`);
    }
  }

  const segments = edges.map((edge) => {
    const a = positions[edge.source];
    const b = positions[edge.target];
    if (!a || !b) {
      throw new Error(`Missing position for edge ${edge.source} <-> ${edge.target}`);
    }
    return { ...edge, a, b };
  });

  let crossings = 0;
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const left = segments[i];
      const right = segments[j];
      const sharesEndpoint =
        left.source === right.source ||
        left.source === right.target ||
        left.target === right.source ||
        left.target === right.target;
      if (sharesEndpoint) continue;
      if (segmentsCross(left.a, left.b, right.a, right.b)) crossings += 1;
    }
  }
  return crossings;
}
