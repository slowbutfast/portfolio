import { describe, expect, it } from 'vitest';
import {
  bridgeBaseWidth,
  bridgeWaistWidth,
  computeBridgeGeometry,
  REST_WAIST_RATIO,
  SNAP_STRETCH_MULTIPLIER,
  type Point,
} from './bridgeGeometry';

const EPSILON = 1e-6;

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function axes(a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  return {
    u: { x: dx / distance, y: dy / distance },
    n: { x: -dy / distance, y: dx / distance },
  };
}

function axial(point: Point, origin: Point, u: Point): number {
  return dot(subtract(point, origin), u);
}

function normal(point: Point, origin: Point, n: Point): number {
  return dot(subtract(point, origin), n);
}

describe('computeBridgeGeometry bilateral reflection', () => {
  const cases: Array<{ label: string; a: Point; b: Point }> = [
    { label: 'horizontal', a: { x: 100, y: 200 }, b: { x: 400, y: 200 } },
    { label: 'diagonal up', a: { x: 120, y: 500 }, b: { x: 620, y: 210 } },
    { label: 'diagonal down', a: { x: 80, y: 90 }, b: { x: 360, y: 460 } },
    { label: 'steep', a: { x: 500, y: 40 }, b: { x: 470, y: 520 } },
    { label: 'reverse', a: { x: 700, y: 300 }, b: { x: 300, y: 300 } },
  ];

  it.each(cases)('mirrors the upper control handles across the axis ($label)', ({ a, b }) => {
    const geometry = computeBridgeGeometry(a, b, 22, 22);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const { u, n } = axes(a, b);

    expect(normal(geometry.cp1Bottom, a, n)).toBeCloseTo(-normal(geometry.cp1Top, a, n), 6);
    expect(normal(geometry.cp2Bottom, a, n)).toBeCloseTo(-normal(geometry.cp2Top, a, n), 6);
    expect(axial(geometry.cp1Bottom, a, u)).toBeCloseTo(axial(geometry.cp1Top, a, u), 6);
    expect(axial(geometry.cp2Bottom, a, u)).toBeCloseTo(axial(geometry.cp2Top, a, u), 6);

    expect(normal(geometry.aBottom, a, n)).toBeCloseTo(-normal(geometry.aTop, a, n), 6);
    expect(normal(geometry.bBottom, a, n)).toBeCloseTo(-normal(geometry.bTop, a, n), 6);
  });

  it('keeps both boundary curves on opposite sides of the centerline', () => {
    const a = { x: 140, y: 420 };
    const b = { x: 640, y: 260 };
    const geometry = computeBridgeGeometry(a, b, 22, 22);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const { n } = axes(a, b);
    expect(normal(geometry.aTop, a, n)).toBeGreaterThan(0);
    expect(normal(geometry.aBottom, a, n)).toBeLessThan(0);
    expect(normal(geometry.bTop, a, n)).toBeGreaterThan(0);
    expect(normal(geometry.bBottom, a, n)).toBeLessThan(0);
    expect(geometry.waist).toBeGreaterThan(0);
  });
});

describe('computeBridgeGeometry C1 tangent continuity', () => {
  const cases: Array<{ label: string; a: Point; b: Point; ra: number; rb: number }> = [
    { label: 'equal radii', a: { x: 100, y: 200 }, b: { x: 460, y: 200 }, ra: 22, rb: 22 },
    { label: 'different radii', a: { x: 120, y: 380 }, b: { x: 560, y: 140 }, ra: 18, rb: 30 },
    { label: 'rotated shallow', a: { x: 260, y: 100 }, b: { x: 620, y: 300 }, ra: 24, rb: 16 },
  ];

  it.each(cases)('leaves circle A along its perimeter tangent ($label)', ({ a, b, ra, rb }) => {
    const geometry = computeBridgeGeometry(a, b, ra, rb);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const handle = subtract(geometry.cp1Top, geometry.aTop);
    const radius = subtract(geometry.aTop, a);
    expect(Math.abs(dot(handle, radius))).toBeLessThan(EPSILON);
  });

  it.each(cases)('arrives at circle B along its perimeter tangent ($label)', ({ a, b, ra, rb }) => {
    const geometry = computeBridgeGeometry(a, b, ra, rb);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const handle = subtract(geometry.bTop, geometry.cp2Top);
    const radius = subtract(geometry.bTop, b);
    expect(Math.abs(dot(handle, radius))).toBeLessThan(EPSILON);
  });
});

describe('computeBridgeGeometry close-node guard', () => {
  it('returns null when the circles touch exactly', () => {
    expect(computeBridgeGeometry({ x: 100, y: 100 }, { x: 144, y: 100 }, 22, 22)).toBeNull();
  });

  it('returns null when the circles overlap during a drag', () => {
    expect(computeBridgeGeometry({ x: 100, y: 100 }, { x: 120, y: 110 }, 22, 22)).toBeNull();
  });

  it('returns null when the centers coincide', () => {
    expect(computeBridgeGeometry({ x: 100, y: 100 }, { x: 100, y: 100 }, 22, 22)).toBeNull();
  });

  it('returns geometry once the centers are farther apart than the radii sum', () => {
    const geometry = computeBridgeGeometry({ x: 100, y: 100 }, { x: 145, y: 100 }, 22, 22);
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    expect(geometry.distance).toBeGreaterThan(44);
    expect(geometry.waist).toBeGreaterThan(0);
  });
});

describe('semantic base width from shared tags', () => {
  it('clamps min radius * 0.85 to 6 + 4(n - 1)', () => {
    expect(bridgeBaseWidth(22, 22, 1)).toBe(6);
    expect(bridgeBaseWidth(22, 22, 2)).toBe(10);
    expect(bridgeBaseWidth(22, 22, 3)).toBe(14);
    expect(bridgeBaseWidth(22, 22, 4)).toBe(18);
    expect(bridgeBaseWidth(18, 30, 1)).toBe(Math.min(18 * 0.85, 6));
  });
});

describe('rest hourglass silhouette', () => {
  it('exposes the 0.58 rest waist ratio and 1.6x snap stretch', () => {
    expect(REST_WAIST_RATIO).toBe(0.58);
    expect(SNAP_STRETCH_MULTIPLIER).toBe(1.6);
  });

  const restCases: Array<{
    label: string;
    distance: number;
    rest: number;
    sharedTagCount: number;
  }> = [
    { label: 'short gap', distance: 60, rest: 60, sharedTagCount: 1 },
    { label: 'natural long gap', distance: 600, rest: 600, sharedTagCount: 1 },
    { label: 'degree-5 hub', distance: 420, rest: 420, sharedTagCount: 5 },
    { label: 'degree-6 hub', distance: 420, rest: 420, sharedTagCount: 6 },
  ];

  it.each(restCases)(
    'produces a concave $C^1$ waist at rest ($label)',
    ({ distance, rest, sharedTagCount }) => {
      const a = { x: 100, y: 200 };
      const geometry = computeBridgeGeometry(
        a,
        { x: a.x + distance, y: a.y },
        22,
        22,
        { restDistance: rest, sharedTagCount },
      );
      expect(geometry).not.toBeNull();
      if (!geometry) return;

      // The attachment half-width is the larger of the two perimeter spreads,
      // so a concave waist must be narrower than twice that spread.
      expect(geometry.waistWidth).toBeLessThan(2 * geometry.halfWidth);
      expect(geometry.handleForWaist).toBeGreaterThan(0);
      expect(geometry.handle).toBeGreaterThan(0);
      expect(geometry.waist).toBeGreaterThan(0);
    },
  );

  it('targets 0.58 of the perimeter spread on a natural gap', () => {
    const a = { x: 100, y: 200 };
    const distance = 400;
    const geometry = computeBridgeGeometry(a, { x: a.x + distance, y: a.y }, 22, 22, {
      restDistance: distance,
      sharedTagCount: 3,
    });
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    expect(geometry.waistWidth).toBeCloseTo(2 * geometry.halfWidth * REST_WAIST_RATIO, 5);
  });

  it('keeps the short-gap handle inside the C1 baseHandle bound', () => {
    const a = { x: 100, y: 200 };
    // 45px center distance leaves a 1px free gap between the 22px circles.
    const geometry = computeBridgeGeometry(a, { x: a.x + 45, y: a.y }, 22, 22, {
      restDistance: 45,
      sharedTagCount: 6,
    });
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const minRadius = 22;
    const maxHandle = 1 * 0.45; // gap * HANDLE_GAP_RATIO
    expect(geometry.handleForWaist).toBeGreaterThan(0);
    expect(geometry.handle).toBeGreaterThan(0);
    expect(geometry.handle).toBeLessThanOrEqual(maxHandle + 1e-9);
    expect(geometry.handle).toBeLessThanOrEqual(minRadius * 1.2 + 1e-9);
    expect(geometry.waistWidth).toBeLessThan(2 * geometry.halfWidth);
  });

  it('thins from the rest waist to the 2px floor at 1.6x rest distance', () => {
    const a = { x: 100, y: 200 };
    const rest = 200;
    const restGeometry = computeBridgeGeometry(a, { x: a.x + rest, y: a.y }, 22, 22, {
      restDistance: rest,
      sharedTagCount: 3,
    });
    const stretched = computeBridgeGeometry(
      a,
      { x: a.x + rest * SNAP_STRETCH_MULTIPLIER, y: a.y },
      22,
      22,
      { restDistance: rest, sharedTagCount: 3 },
    );
    expect(restGeometry).not.toBeNull();
    expect(stretched).not.toBeNull();
    if (!restGeometry || !stretched) return;
    expect(restGeometry.waistWidth).toBeGreaterThan(2);
    expect(stretched.waistWidth).toBeCloseTo(2, 5);
  });
});

describe('per-edge rest-normalized waist cinching', () => {
  const rest = 200;
  const a = { x: 100, y: 200 };
  const cases = [200, 240, 280, 320, 360, 400];

  it('starts from the concave rest waist at or inside the rest distance', () => {
    for (const distance of [120, 160, 200]) {
      const geometry = computeBridgeGeometry(
        a,
        { x: a.x + distance, y: a.y },
        22,
        22,
        { restDistance: rest, sharedTagCount: 3 },
      );
      expect(geometry).not.toBeNull();
      if (!geometry) continue;
      expect(geometry.baseWidth).toBe(14);
      expect(geometry.waistWidth).toBeCloseTo(
        2 * geometry.halfWidth * REST_WAIST_RATIO,
        4,
      );
      expect(geometry.waistWidth).toBeLessThan(2 * geometry.halfWidth);
    }
  });

  it('thins monotonically beyond the rest distance and never below 2px', () => {
    let previous = Number.POSITIVE_INFINITY;
    for (const distance of cases) {
      const geometry = computeBridgeGeometry(
        a,
        { x: a.x + distance, y: a.y },
        22,
        22,
        { restDistance: rest, sharedTagCount: 3 },
      );
      expect(geometry).not.toBeNull();
      if (!geometry) continue;
      expect(geometry.waistWidth).toBeLessThanOrEqual(previous + 1e-6);
      expect(geometry.waistWidth).toBeGreaterThanOrEqual(2 - 1e-6);
      previous = geometry.waistWidth;
    }
    expect(previous).toBeLessThan(14);
  });

  it('matches the analytic cinching curve at a mid-drag distance', () => {
    const distance = 260;
    const geometry = computeBridgeGeometry(
      a,
      { x: a.x + distance, y: a.y },
      22,
      22,
      { restDistance: rest, sharedTagCount: 3 },
    );
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const expected = bridgeWaistWidth(14, distance, rest, geometry.halfWidth);
    expect(geometry.waistWidth).toBeCloseTo(expected, 4);
  });
});

describe('lateral oscillator sag', () => {
  it('preserves bilateral reflection symmetry when sag is non-zero', () => {
    const a = { x: 140, y: 420 };
    const b = { x: 640, y: 260 };
    const sag = 12;
    const geometry = computeBridgeGeometry(a, b, 22, 22, {
      restDistance: Math.hypot(b.x - a.x, b.y - a.y),
      sharedTagCount: 2,
      sag,
    });
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const { n } = axes(a, b);
    expect(normal(geometry.cp1Bottom, a, n)).toBeCloseTo(-normal(geometry.cp1Top, a, n), 6);
    expect(normal(geometry.cp2Bottom, a, n)).toBeCloseTo(-normal(geometry.cp2Top, a, n), 6);
    expect(axial(geometry.cp1Bottom, a, axes(a, b).u)).toBeCloseTo(
      axial(geometry.cp1Top, a, axes(a, b).u),
      6,
    );
  });

  it('retains C1 tangent continuity with sag applied', () => {
    const a = { x: 100, y: 200 };
    const b = { x: 460, y: 200 };
    const geometry = computeBridgeGeometry(a, b, 22, 22, { sag: 9 });
    expect(geometry).not.toBeNull();
    if (!geometry) return;
    const handle = subtract(geometry.cp1Top, geometry.aTop);
    const radius = subtract(geometry.aTop, a);
    expect(Math.abs(dot(handle, radius))).toBeLessThan(EPSILON);
    const endHandle = subtract(geometry.bTop, geometry.cp2Top);
    const endRadius = subtract(geometry.bTop, b);
    expect(Math.abs(dot(endHandle, endRadius))).toBeLessThan(EPSILON);
  });

  it('translates the midpoint normal offset with width-scaled sag', () => {
    const a = { x: 100, y: 200 };
    const b = { x: 500, y: 200 };
    const flat = computeBridgeGeometry(a, b, 22, 22, { sag: 0 });
    const sagged = computeBridgeGeometry(a, b, 22, 22, { sag: 10 });
    expect(flat).not.toBeNull();
    expect(sagged).not.toBeNull();
    if (!flat || !sagged) return;
    // One shared tag -> 6px base width -> 0.6 width scale.
    expect(sagged.waist - flat.waist).toBeCloseTo(6, 5);
  });

  it.each([
    ['narrow 6px ribbon', 1, 6],
    ['medium 10px ribbon', 2, 10],
    ['wide 14px ribbon', 3, 12],
  ])('scales sag proportionally for a %s', (_label, sharedTagCount, expectedShift) => {
    const a = { x: 100, y: 200 };
    const b = { x: 500, y: 200 };
    const base = { restDistance: 400, sharedTagCount };
    const flat = computeBridgeGeometry(a, b, 22, 22, { ...base, sag: 0 });
    const sagged = computeBridgeGeometry(a, b, 22, 22, { ...base, sag: 10 });
    expect(flat).not.toBeNull();
    expect(sagged).not.toBeNull();
    if (!flat || !sagged) return;
    expect(sagged.waist - flat.waist).toBeCloseTo(expectedShift, 5);
  });

  it('never pinches below the 2px minimum', () => {
    const a = { x: 100, y: 200 };
    const b = { x: 400, y: 200 };
    const pinched = computeBridgeGeometry(a, b, 22, 22, {
      restDistance: 300,
      sharedTagCount: 1,
      sag: -10,
    });
    expect(pinched).not.toBeNull();
    if (!pinched) return;
    expect(pinched.waist).toBeGreaterThanOrEqual(1);
    expect(pinched.waistWidth).toBeGreaterThanOrEqual(2);

    const bulged = computeBridgeGeometry(a, b, 22, 22, {
      restDistance: 300,
      sharedTagCount: 1,
      sag: 10,
    });
    expect(bulged).not.toBeNull();
    if (!bulged) return;
    expect(Number.isFinite(bulged.waist)).toBe(true);
    expect(Number.isFinite(bulged.waistWidth)).toBe(true);
  });
});
