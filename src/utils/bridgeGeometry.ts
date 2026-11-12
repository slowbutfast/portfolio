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
  /** Signed clearance of the upper curve at its midpoint (positive = open waist). */
  waist: number;
}

/** Fraction of the smaller radius used for the perimeter attachment spread. */
const HALF_WIDTH_RATIO = 0.65;
/** Keep adjacent bridges around the 5-degree hub from merging. */
const MAX_SPREAD_ANGLE = Math.PI / 6.5;
/** Base handle length fraction of the free gap between the circles. */
const HANDLE_GAP_RATIO = 0.45;
/** Upper bound on handle length relative to the smaller radius. */
const HANDLE_RADIUS_RATIO = 1.2;
/** Never let the control handles collapse the waist through the centerline. */
const MIN_WAIST = 1.5;

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
): BridgeGeometry | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.0001 || distance <= radiusA + radiusB) return null;

  const ux = dx / distance;
  const uy = dy / distance;

  const targetHalf = Math.min(radiusA, radiusB) * HALF_WIDTH_RATIO;
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
    x: a.x + radiusA * (cosA * ux + sinA * -uy),
    y: a.y + radiusA * (cosA * uy + sinA * ux),
  };
  const aBottom = mirrorAcrossAxis(aTop, a, ux, uy);
  const bTop: Point = {
    x: b.x - radiusB * (cosB * ux - sinB * -uy),
    y: b.y - radiusB * (cosB * uy - sinB * ux),
  };
  const bBottom = mirrorAcrossAxis(bTop, a, ux, uy);

  const gap = distance - radiusA - radiusB;
  const baseHandle = Math.min(
    gap * HANDLE_GAP_RATIO,
    Math.min(radiusA, radiusB) * HANDLE_RADIUS_RATIO,
  );
  // The midpoint normal offset of a cubic is
  //   (hA + hB) / 2 - (3L / 8)(cosA + cosB).
  // Clamp L so the waist stays open rather than crossing the axis.
  const averageHalf = (halfA + halfB) / 2;
  const waistDenominator = (3 / 8) * (cosA + cosB);
  const maxHandleForWaist =
    waistDenominator > 0 ? Math.max(0, (averageHalf - MIN_WAIST) / waistDenominator) : baseHandle;
  const handle = Math.min(baseHandle, maxHandleForWaist);
  const waist = averageHalf - (3 / 8) * handle * (cosA + cosB);

  // Circle tangents: rotate the radial vector by +/- 90 degrees.
  const tangentATop: Point = { x: sinA * ux - cosA * -uy, y: sinA * uy - cosA * ux };
  const tangentBForward: Point = { x: sinB * ux + cosB * -uy, y: sinB * uy + cosB * ux };

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
    waist,
  };
}
