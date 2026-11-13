export interface PopoverPoint {
  x: number;
  y: number;
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface PopoverViewport {
  width: number;
  height: number;
}

export interface PopoverNodeObstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface PopoverSegmentObstacle {
  source: string;
  target: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isFocal?: boolean;
}

export interface PopoverObstacles {
  nodes: PopoverNodeObstacle[];
  segments: PopoverSegmentObstacle[];
}

export interface PopoverPlacementOptions {
  anchor: PopoverPoint;
  size: PopoverSize;
  viewport: PopoverViewport;
  /** Screen-space center of the canvas, used only as an outward tie-breaker. */
  canvasCenter?: PopoverPoint;
  margin?: number;
  topMargin?: number;
  gap?: number;
  targetNodeId?: string;
  obstacles?: PopoverObstacles;
}

export interface PopoverPosition {
  left: number;
  top: number;
}

export interface PopoverPlacement extends PopoverPosition {
  candidate: string;
  score: number;
}

const TARGET_NODE_PENALTY = 5000;
const NEIGHBOR_NODE_PENALTY = 1000;
const SEGMENT_PENALTY = 700;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function circleIntersectsRect(
  circle: PopoverNodeObstacle,
  rect: Rect,
): boolean {
  const nearestX = Math.min(Math.max(circle.x, rect.left), rect.right);
  const nearestY = Math.min(Math.max(circle.y, rect.top), rect.bottom);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/** Liang-Barsky segment / axis-aligned rectangle intersection. */
function segmentIntersectsRect(
  segment: PopoverSegmentObstacle,
  rect: Rect,
): boolean {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  let t0 = 0;
  let t1 = 1;

  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const ratio = q / p;
    if (p < 0) {
      if (ratio > t1) return false;
      if (ratio > t0) t0 = ratio;
    } else {
      if (ratio < t0) return false;
      if (ratio < t1) t1 = ratio;
    }
    return true;
  };

  return (
    clip(-dx, segment.x1 - rect.left) &&
    clip(dx, rect.right - segment.x1) &&
    clip(-dy, segment.y1 - rect.top) &&
    clip(dy, rect.bottom - segment.y1)
  );
}

interface Candidate {
  name: string;
  left: number;
  top: number;
}

function candidateRect(
  anchor: PopoverPoint,
  size: PopoverSize,
  gap: number,
  viewport: PopoverViewport,
  margin: number,
  topMargin: number,
): Candidate[] {
  const right = anchor.x + gap;
  const left = anchor.x - gap - size.width;
  const top = anchor.y - gap - size.height;
  const bottom = anchor.y + gap;
  const centerX = anchor.x - size.width / 2;
  const centerY = anchor.y - size.height / 2;
  const maxLeft = Math.max(margin, viewport.width - size.width - margin);
  const maxTop = Math.max(topMargin, viewport.height - size.height - margin);

  return [
    { name: 'R', left: right, top: centerY },
    { name: 'L', left, top: centerY },
    { name: 'T', left: centerX, top },
    { name: 'B', left: centerX, top: bottom },
    { name: 'TR', left: right, top },
    { name: 'BR', left: right, top: bottom },
    { name: 'TL', left, top },
    { name: 'BL', left, top: bottom },
  ].map((candidate) => ({
    ...candidate,
    left: clamp(candidate.left, margin, maxLeft),
    top: clamp(candidate.top, topMargin, maxTop),
  }));
}

function candidateScore(
  candidate: Candidate,
  size: PopoverSize,
  options: PopoverPlacementOptions,
): number {
  const rect: Rect = {
    left: candidate.left,
    top: candidate.top,
    right: candidate.left + size.width,
    bottom: candidate.top + size.height,
  };
  let score = 0;
  for (const node of options.obstacles?.nodes ?? []) {
    if (!circleIntersectsRect(node, rect)) continue;
    score += node.id === options.targetNodeId ? TARGET_NODE_PENALTY : NEIGHBOR_NODE_PENALTY;
  }
  for (const segment of options.obstacles?.segments ?? []) {
    if (!segmentIntersectsRect(segment, rect)) continue;
    score += SEGMENT_PENALTY * (segment.isFocal ? 3 : 1);
  }
  return score;
}

function outwardProjection(
  candidate: Candidate,
  size: PopoverSize,
  anchor: PopoverPoint,
  canvasCenter: PopoverPoint,
): number {
  const ox = anchor.x - canvasCenter.x;
  const oy = anchor.y - canvasCenter.y;
  const length = Math.hypot(ox, oy) || 1;
  const ux = ox / length;
  const uy = oy / length;
  const cx = candidate.left + size.width / 2 - anchor.x;
  const cy = candidate.top + size.height / 2 - anchor.y;
  return cx * ux + cy * uy;
}

export function chooseBestPopoverPosition(
  options: PopoverPlacementOptions,
): PopoverPosition {
  const margin = options.margin ?? 20;
  const topMargin = options.topMargin ?? 72;
  const gap = options.gap ?? 36;
  const canvasCenter = options.canvasCenter ?? {
    x: options.viewport.width / 2,
    y: options.viewport.height / 2,
  };
  const candidates = candidateRect(
    options.anchor,
    options.size,
    gap,
    options.viewport,
    margin,
    topMargin,
  );

  let best: { candidate: Candidate; score: number; outward: number } | null =
    null;
  for (const candidate of candidates) {
    const score = candidateScore(candidate, options.size, options);
    const outward = outwardProjection(
      candidate,
      options.size,
      options.anchor,
      canvasCenter,
    );
    if (
      !best ||
      score < best.score ||
      (score === best.score && outward > best.outward)
    ) {
      best = { candidate, score, outward };
    }
  }

  return { left: best!.candidate.left, top: best!.candidate.top };
}
