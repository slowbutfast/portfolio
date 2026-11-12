/**
 * Pure bilateral bridge geometry for the ferrofluid canvas connections.
 *
 * Every bridge is built in edge-local coordinates from the center-to-center
 * unit vector `u` and its normal `n = (-u.y, u.x)`. Both boundary curves leave
 * their circle perimeters along exact tangent rays, which makes the attachment
 * C1-continuous, and the lower curve is the mathematical reflection of the
 * upper curve across the centerline axis.
 */

export interface Point {
  x: number;
  y: number;
}

export interface BridgeOptions {
  /**
   * Natural center distance for this edge, derived from its scaled planar
   * seeds. Cinching only begins once the current distance exceeds it.
   */
  restDistance?: number;
  /** Number of tags shared by the endpoint projects. */
  sharedTagCount?: number;
  /** Lateral oscillator displacement injected along the bridge normal. */
  sag?: number;
}

export interface BridgeGeometry {
  /** Perimeter anchors on circle A (top/bottom relative to the edge axis). */
  aTop: Point;
  aBottom: Point;
  /** Perimeter anchors on circle B. */
  bTop: Point;
  bBottom: Point;
  /** Cubic control handles for the upper boundary curve A -> B. */
  cp1Top: Point;
  cp2Top: Point;
  /** Exact normal reflections of the upper handles for B -> A. */
  cp1Bottom: Point;
  cp2Bottom: Point;
  /** Center-to-center distance in canvas units. */
  distance: number;
  /** Half-width of the attachment spread at the narrower node. */
  halfWidth: number;
  /** Full semantic bridge width before any drag cinching. */
  baseWidth: number;
  /** Full midpoint width after rest-normalized cinching. */
  waistWidth: number;
  /** Signed clearance of the upper curve at its midpoint (positive = open waist). */
  waist: number;
  restDistance: number;
  sag: number;
}

/** Fraction of the smaller radius used for the perimeter attachment spread. */
const HALF_WIDTH_RATIO = 0.65;
/** Keep adjacent bridges around the 5-degree hub from merging. */
const MAX_SPREAD_ANGLE = Math.PI / 6.5;
/** Base handle length fraction of the free gap between the circles. */
const HANDLE_GAP_RATIO = 0.45;
/** Upper bound on handle length relative to the smaller radius. */
const HANDLE_RADIUS_RATIO = 1.2;
/** Meniscus never becomes thinner than this many pixels. */
const MIN_WAIST_WIDTH = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mirrorAcrossAxis(point: Point, origin: Point, ux: number, uy: number): Point {
  const nx = -uy;
  const ny = ux;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const axial = dx * ux + dy * uy;
  const normal = dx * nx + dy * ny;
  return {
    x: origin.x + ux * axial - nx * normal,
    y: origin.y + uy * axial - ny * normal,
  };
}

/**
 * Semantic base width from shared tag count:
 * `min(R_A, R_B) * 0.65` clamped to `6 + 4 (n - 1)` px. A single shared tag
 * yields the narrowest ribbon; additional shared tags thicken it.
 */
export function bridgeBaseWidth(
  radiusA: number,
  radiusB: number,
  sharedTagCount = 1,
): number {
  const tags = Math.max(1, Math.floor(sharedTagCount));
  const raw = Math.min(radiusA, radiusB) * HALF_WIDTH_RATIO;
  return Math.max(4, Math.min(raw, 6 + 4 * (tags - 1)));
}

/**
 * Rest-normalized cinching curve. The bridge keeps full semantic width until
 * the nodes are pulled beyond their natural seed distance, then necks down to
 * a minimum 2px meniscus at (or past) the snap threshold.
 */
export function bridgeWaistWidth(
  baseWidth: number,
  distance: number,
  restDistance: number,
): number {
  const rest = Math.max(1, restDistance);
  if (distance <= rest) return baseWidth;
  const snap = 2 * rest;
  const progress = clamp((distance - rest) / Math.max(1, snap - rest), 0, 1);
  return Math.max(MIN_WAIST_WIDTH, baseWidth * Math.pow(1 - progress, 1.25));
}

/**
 * Compute the top and normal-mirrored bottom cubic boundaries between two
 * nodes. Returns `null` when the circles touch or overlap (d <= R_A + R_B) or
 * when the centers coincide, so callers can omit the bridge without drawing
 * inverted or self-crossing geometry.
 */
export function computeBridgeGeometry(
  a: Point,
  b: Point,
  radiusA: number,
  radiusB: number,
  options: BridgeOptions = {},
): BridgeGeometry | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.0001 || distance <= radiusA + radiusB) return null;

  const ux = dx / distance;
  const uy = dy / distance;
  const nx = -uy;
  const ny = ux;

  const restDistance = Math.max(1, options.restDistance ?? distance);
  const sag = Number.isFinite(options.sag) ? (options.sag as number) : 0;
  const baseWidth = bridgeBaseWidth(radiusA, radiusB, options.sharedTagCount);
  const waistWidth = bridgeWaistWidth(baseWidth, distance, restDistance);

  // Attachment spread: half of the semantic base width, capped by the maximum
  // hub angle so neighbouring bridges never merge.
  const targetHalf = baseWidth / 2;
  const thetaA = Math.min(
    Math.asin(clamp(targetHalf / radiusA, 0, 1)),
    MAX_SPREAD_ANGLE,
  );
  const thetaB = Math.min(
    Math.asin(clamp(targetHalf / radiusB, 0, 1)),
    MAX_SPREAD_ANGLE,
  );

  const halfA = radiusA * Math.sin(thetaA);
  const halfB = radiusB * Math.sin(thetaB);
  const halfWidth = Math.min(halfA, halfB);

  const cosA = Math.cos(thetaA);
  const cosB = Math.cos(thetaB);
  const sinA = Math.sin(thetaA);
  const sinB = Math.sin(thetaB);

  // Perimeter anchors. The normal component is mirrored exactly for the
  // bottom anchors, setting up the reflected lower curve.
  const aTop: Point = {
    x: a.x + radiusA * (cosA * ux + sinA * nx),
    y: a.y + radiusA * (cosA * uy + sinA * ny),
  };
  const aBottom = mirrorAcrossAxis(aTop, a, ux, uy);
  const bTop: Point = {
    x: b.x - radiusB * (cosB * ux - sinB * nx),
    y: b.y - radiusB * (cosB * uy - sinB * ny),
  };
  const bBottom = mirrorAcrossAxis(bTop, a, ux, uy);

  const gap = distance - radiusA - radiusB;
  const baseHandle = Math.min(
    Math.max(0, gap) * HANDLE_GAP_RATIO,
    Math.min(radiusA, radiusB) * HANDLE_RADIUS_RATIO,
  );
  const averageHalf = (halfA + halfB) / 2;
  const waistDenominator = (3 / 8) * (cosA + cosB);
  const desiredWaistHalf = waistWidth / 2;
  // The midpoint normal offset of a symmetric cubic is
  //   (hA + hB) / 2 - (3L / 8)(cosA + cosB) + (3/4) sag.
  // Choose L to land exactly on the rest-normalized waist width, capped by the
  // natural handle length.
  const handleForWaist =
    waistDenominator > 0
      ? Math.max(0, (averageHalf - desiredWaistHalf) / waistDenominator)
      : baseHandle;
  // Inject lateral sag through the tangent-line handle length. Moving a handle
  // off its tangent ray would break C1 continuity at the circle perimeter, so
  // the sag is expressed as the only remaining degree of freedom: signed
  // handle extension. Negative handles bow the ribbon outward.
  const sagHandle = waistDenominator > 0 ? -sag / waistDenominator : 0;
  const handle = clamp(handleForWaist + sagHandle, -baseHandle, baseHandle);
  const waist = averageHalf - (3 / 8) * handle * (cosA + cosB);

  // Circle tangents: rotate the radial vector by +/- 90 degrees.
  const tangentATop: Point = { x: sinA * ux - cosA * nx, y: sinA * uy - cosA * ny };
  const tangentBForward: Point = { x: sinB * ux + cosB * nx, y: sinB * uy + cosB * ny };

  const cp1Top: Point = {
    x: aTop.x + handle * tangentATop.x,
    y: aTop.y + handle * tangentATop.y,
  };
  const cp2Top: Point = {
    x: bTop.x - handle * tangentBForward.x,
    y: bTop.y - handle * tangentBForward.y,
  };
  const cp1Bottom = mirrorAcrossAxis(cp1Top, a, ux, uy);
  const cp2Bottom = mirrorAcrossAxis(cp2Top, a, ux, uy);

  return {
    aTop,
    aBottom,
    bTop,
    bBottom,
    cp1Top,
    cp2Top,
    cp1Bottom,
    cp2Bottom,
    distance,
    halfWidth,
    baseWidth,
    waistWidth: Math.abs(waist) * 2,
    waist,
    restDistance,
    sag,
  };
}
