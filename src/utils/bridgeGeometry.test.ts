import { describe, expect, it } from 'vitest';
import { computeBridgeGeometry, type Point } from './bridgeGeometry';

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
