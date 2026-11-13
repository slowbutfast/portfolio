import { describe, expect, it } from 'vitest';
import {
  chooseBestPopoverPosition,
  type PopoverObstacles,
} from './popoverPlacement';

const viewport = { width: 1200, height: 800 };
const size = { width: 320, height: 220 };

function placement(anchor: { x: number; y: number }, obstacles?: PopoverObstacles) {
  return chooseBestPopoverPosition({
    anchor,
    canvasCenter: { x: viewport.width / 2, y: viewport.height / 2 },
    size,
    viewport,
    margin: 20,
    topMargin: 72,
    gap: 36,
    obstacles,
  });
}

describe('chooseBestPopoverPosition', () => {
  it('clamps every candidate inside the viewport and below the header', () => {
    const forCorner = chooseBestPopoverPosition({
      anchor: { x: 8, y: 8 },
      canvasCenter: { x: 600, y: 400 },
      size,
      viewport: { width: 400, height: 420 },
      margin: 20,
      topMargin: 72,
      gap: 36,
    });
    expect(forCorner.left).toBeGreaterThanOrEqual(20);
    expect(forCorner.top).toBeGreaterThanOrEqual(72);
    expect(forCorner.left + size.width).toBeLessThanOrEqual(380);
    expect(forCorner.top + size.height).toBeLessThanOrEqual(400);
  });

  it('avoids a focal edge crossing the right quadrant', () => {
    const obstacles: PopoverObstacles = {
      nodes: [],
      segments: [
        {
          source: 'a',
          target: 'b',
          x1: 800,
          y1: 120,
          x2: 800,
          y2: 680,
          isFocal: true,
        },
      ],
    };
    const result = placement({ x: 600, y: 400 }, obstacles);
    expect(result.left + size.width).toBeLessThanOrEqual(636);
  });

  it('avoids a neighboring node circle occupying the right quadrant', () => {
    const obstacles: PopoverObstacles = {
      nodes: [{ id: 'neighbor', x: 760, y: 400, radius: 44 }],
      segments: [],
    };
    const result = placement({ x: 600, y: 400 }, obstacles);
    expect(result.left + size.width).toBeLessThanOrEqual(636);
  });

  it('prefers the only unobstructed quadrant in a dense center hub', () => {
    const obstacles: PopoverObstacles = {
      nodes: [],
      segments: [
        { source: 'a', target: 'b', x1: 600, y1: 400, x2: 1100, y2: 400, isFocal: true },
        { source: 'a', target: 'c', x1: 600, y1: 400, x2: 600, y2: 60, isFocal: true },
        { source: 'a', target: 'd', x1: 600, y1: 400, x2: 600, y2: 740, isFocal: true },
        { source: 'a', target: 'e', x1: 600, y1: 400, x2: 960, y2: 120, isFocal: true },
        { source: 'a', target: 'f', x1: 600, y1: 400, x2: 960, y2: 680, isFocal: true },
      ],
    };
    const result = placement({ x: 600, y: 400 }, obstacles);
    expect(result.left + size.width).toBeLessThanOrEqual(636);
  });

  it('allows the outward candidate to win a score tie', () => {
    const rightAnchor = placement({ x: 900, y: 400 });
    expect(rightAnchor.left + size.width / 2).toBeGreaterThan(900);
  });
});
