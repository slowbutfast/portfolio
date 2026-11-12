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
  /** Gap-proportional handle before sag extension. */
  handleForWaist: number;
  /** Final C1 handle length after signed sag extension and clamping. */
  handle: number;
  restDistance: number;
  sag: number;
}

/** Fraction of the smaller radius used for the perimeter attachment spread. */
export const HALF_WIDTH_RATIO = 0.85;
/** Keep adjacent bridges around the 5-degree hub from merging. */
export const MAX_SPREAD_ANGLE = Math.PI / 6.2;
/** Rest silhouette waist as a fraction of the full perimeter spread. */
export const REST_WAIST_RATIO = 0.58;
/** Bridges cinch to the 2px floor at this multiple of the rest distance. */
export const SNAP_STRETCH_MULTIPLIER = 1.6;
/** Base handle length fraction of the free gap between the circles. */
const HANDLE_GAP_RATIO = 0.45;
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
 * `min(R_A, R_B) * 0.85` clamped to `6 + 4 (n - 1)` px. A single shared tag
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
 * Target rest-normalized cinching curve. At rest the bridge targets
 * `REST_WAIST_RATIO` of the perimeter spread, then smoothsteps toward the 2px
 * floor at the 1.6x snap threshold. `computeBridgeGeometry` additionally
 * clamps the actual waist against the non-negative control-point constraint,
 * so long gaps can sit below this target.
 *
 * `averageHalf` is the mean normal attachment offset. Callers that only know
 * the semantic width can omit it; the default reconstructs equal-radius
 * geometry (`baseWidth / 2`).
 */
export function bridgeWaistWidth(
  baseWidth: number,
  distance: number,
  restDistance: number,
  averageHalf = baseWidth / 2,
): number {
  const rest = Math.max(1, restDistance);
  const restWaist = Math.max(MIN_WAIST_WIDTH, REST_WAIST_RATIO * 2 * averageHalf);
  if (distance <= rest) return restWaist;
  const snap = SNAP_STRETCH_MULTIPLIER * rest;
  const progress = clamp((distance - rest) / Math.max(1, snap - rest), 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  return Math.max(MIN_WAIST_WIDTH, restWaist * (1 - eased));
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

  const minRadius = Math.min(radiusA, radiusB);
  const gap = Math.max(0, distance - radiusA - radiusB);
  // Handle-first construction: the cubic handles scale with the free gap,
  // capped by the maximum hub angle so crowd-limited bridges cannot push a
  // control point across the centerline. Sag is injected as a signed handle
  // extension later, preserving C1 tangency.
  const handleForWaist = Math.min(
    gap * HANDLE_GAP_RATIO,
    minRadius * Math.tan(MAX_SPREAD_ANGLE),
  );
  const handle = handleForWaist;

  // The rest ratio smoothsteps toward zero at the 1.6x snap distance.
  const stretchProgress =
    distance <= restDistance
      ? 0
      : clamp(
          (distance - restDistance) /
            Math.max(1, SNAP_STRETCH_MULTIPLIER * restDistance - restDistance),
          0,
          1,
        );
  const easedStretch =
    stretchProgress * stretchProgress * (3 - 2 * stretchProgress);
  const targetRatio = REST_WAIST_RATIO * (1 - easedStretch);

  // Solve the shared spread scale alpha by monotone bisection:
  //   theta_i = atan(alpha * handle / R_i), capped at MAX_SPREAD_ANGLE
  //   waist = averageHalf - (3/8) * handle * (cos(theta_A) + cos(theta_B))
  // alpha >= 1 keeps every control-point normal offset non-negative:
  //   CP normal = R sin(theta) - handle cos(theta) >= 0.
  const evaluateSpread = (alpha: number) => {
    const thetaA = Math.min(
      Math.max(0, Math.atan((alpha * handle) / radiusA)),
      MAX_SPREAD_ANGLE,
    );
    const thetaB = Math.min(
      Math.max(0, Math.atan((alpha * handle) / radiusB)),
      MAX_SPREAD_ANGLE,
    );
    const halfA = radiusA * Math.sin(thetaA);
    const halfB = radiusB * Math.sin(thetaB);
    const averageHalf = (halfA + halfB) / 2;
    const cosA = Math.cos(thetaA);
    const cosB = Math.cos(thetaB);
    const waist = averageHalf - (3 / 8) * handle * (cosA + cosB);
    return { thetaA, thetaB, halfA, halfB, averageHalf, cosA, cosB, waist };
  };

  const maxAlpha = Math.min(
    (radiusA * Math.tan(MAX_SPREAD_ANGLE)) / Math.max(handle, 1e-9),
    (radiusB * Math.tan(MAX_SPREAD_ANGLE)) / Math.max(handle, 1e-9),
  );
  const lowerAlpha = 1;
  const upperAlpha = Math.max(lowerAlpha, maxAlpha);
  const waistError = (alpha: number) => {
    const state = evaluateSpread(alpha);
    return state.waist - targetRatio * state.averageHalf;
  };
  let alpha = upperAlpha;
  if (waistError(lowerAlpha) >= 0) {
    alpha = lowerAlpha;
  } else if (waistError(upperAlpha) <= 0) {
    alpha = upperAlpha;
  } else {
    let low = lowerAlpha;
    let high = upperAlpha;
    for (let iteration = 0; iteration < 42; iteration += 1) {
      const mid = (low + high) / 2;
      if (waistError(mid) < 0) low = mid;
      else high = mid;
    }
    alpha = (low + high) / 2;
  }

  const spread = evaluateSpread(alpha);
  const { thetaA, thetaB, halfA, halfB, averageHalf, cosA, cosB, sinA, sinB } = {
    ...spread,
    sinA: Math.sin(spread.thetaA),
    sinB: Math.sin(spread.thetaB),
  };
  const halfWidth = Math.min(halfA, halfB);

  // Narrow ribbons should breathe proportionally, not swing by a fixed number
  // of pixels. Clamp the scale so 4-6px bridges calm down and 14px+ bridges
  // keep their full momentum.
  const widthScale = Math.min(1.2, Math.max(0.5, baseWidth / 10));
  const scaledSag = sag * widthScale;
  const waistDenominator = (3 / 8) * (cosA + cosB);
  const sagHandle = waistDenominator > 0 ? -scaledSag / waistDenominator : 0;
  // Positive sag pinches; never let it push a control point past the
  // centerline. Negative sag bows outward and is always C1-safe.
  const maxSafeHandle = Math.min(
    radiusA * Math.tan(thetaA),
    radiusB * Math.tan(thetaB),
  );
  const handleWithSag = clamp(
    handle + sagHandle,
    -Math.max(handle, maxSafeHandle),
    Math.max(0, maxSafeHandle),
  );
  const waist = averageHalf - (3 / 8) * handleWithSag * (cosA + cosB);

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

  // Circle tangents: rotate the radial vector by +/- 90 degrees.
  const tangentATop: Point = { x: sinA * ux - cosA * nx, y: sinA * uy - cosA * ny };
  const tangentBForward: Point = { x: sinB * ux + cosB * nx, y: sinB * uy + cosB * ny };

  const cp1Top: Point = {
    x: aTop.x + handleWithSag * tangentATop.x,
    y: aTop.y + handleWithSag * tangentATop.y,
  };
  const cp2Top: Point = {
    x: bTop.x - handleWithSag * tangentBForward.x,
    y: bTop.y - handleWithSag * tangentBForward.y,
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
    waistWidth: Math.max(MIN_WAIST_WIDTH, Math.abs(waist) * 2),
    waist,
    handleForWaist,
    handle: handleWithSag,
    restDistance,
    sag,
  };
}
