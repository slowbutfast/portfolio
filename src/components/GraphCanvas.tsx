import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import type { GraphEdge } from '../utils/graphTopology';
import type { GraphNode } from '../types/portfolio';
import { createSimulation, type GraphSimulation } from '../physics/graphSimulation';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  dimmedIds: Set<string>;
  focusedId: string | null;
  coordTickerRef: RefObject<HTMLSpanElement | null>;
  onSelect: (id: string) => void;
}

interface Size {
  width: number;
  height: number;
  dpr: number;
}

interface DraftingTokens {
  bg: string;
  surfaceContainer: string;
  text: string;
  muted: string;
  outline: string;
  grid: string;
  cyan: string;
  amber: string;
}

const DEFAULT_TOKENS: DraftingTokens = {
  bg: '#0a0a0c',
  surfaceContainer: '#18191e',
  text: '#f4f4f5',
  muted: '#a1a1aa',
  outline: '#71717a',
  grid: '#27272a',
  cyan: '#00f0ff',
  amber: '#eab308',
};

const BRIDGE_PROXIMITY = 160;
const TICKER_IDLE = 'X: --- Y: ---';
const MONO_FONT = '12px "JetBrains Mono Variable", monospace';

function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function cacheTokens(): DraftingTokens {
  return {
    bg: readToken('--color-bg', DEFAULT_TOKENS.bg),
    surfaceContainer: readToken('--color-surface-container', DEFAULT_TOKENS.surfaceContainer),
    text: readToken('--color-text', DEFAULT_TOKENS.text),
    muted: readToken('--color-muted', DEFAULT_TOKENS.muted),
    outline: readToken('--color-outline', DEFAULT_TOKENS.outline),
    grid: readToken('--color-grid', DEFAULT_TOKENS.grid),
    cyan: readToken('--color-cyan', DEFAULT_TOKENS.cyan),
    amber: readToken('--color-amber', DEFAULT_TOKENS.amber),
  };
}

/**
 * Fuse two nearby circles with an organic meniscus bridge. The bridge meets
 * each circle tangentially and narrows toward a waist at the midpoint,
 * mimicking magnetic ferrofluid pulled by a field beneath the plane.
 */
function drawFluidBridge(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number,
  fillStyle: string,
  alpha: number,
): void {
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0 || distance >= BRIDGE_PROXIMITY) return;

  const ux = dx / distance;
  const uy = dy / distance;
  const px = -uy;
  const py = ux;

  const proximity = 1 - distance / BRIDGE_PROXIMITY;
  const halfWidth = Math.min(radius * 0.98, radius * 0.95 * Math.sqrt(proximity));
  if (halfWidth < 0.5) return;

  const reach = Math.sqrt(Math.max(0, radius * radius - halfWidth * halfWidth));
  const waist = halfWidth * 0.35;
  const third = distance / 3;

  const aTopX = ax + ux * reach + px * halfWidth;
  const aTopY = ay + uy * reach + py * halfWidth;
  const bTopX = bx - ux * reach + px * halfWidth;
  const bTopY = by - uy * reach + py * halfWidth;
  const aBottomX = ax + ux * reach - px * halfWidth;
  const aBottomY = ay + uy * reach - py * halfWidth;
  const bBottomX = bx - ux * reach - px * halfWidth;
  const bBottomY = by - uy * reach - py * halfWidth;

  ctx.beginPath();
  ctx.moveTo(aTopX, aTopY);
  ctx.bezierCurveTo(
    ax + ux * third + px * waist,
    ay + uy * third + py * waist,
    bx - ux * third + px * waist,
    by - uy * third + py * waist,
    bTopX,
    bTopY,
  );
  ctx.lineTo(bBottomX, bBottomY);
  ctx.bezierCurveTo(
    bx - ux * third - px * waist,
    by - uy * third - py * waist,
    ax + ux * third - px * waist,
    ay + uy * third - py * waist,
    aBottomX,
    aBottomY,
  );
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.globalAlpha = alpha;
  ctx.fill();
}

export function GraphCanvas({
  nodes,
  edges,
  dimmedIds,
  focusedId,
  coordTickerRef,
  onSelect,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<GraphSimulation | null>(null);
  const sizeRef = useRef<Size>({ width: 1, height: 1, dpr: 1 });
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const targetRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);
  const fontsReadyRef = useRef(false);
  const tokensRef = useRef<DraftingTokens>(DEFAULT_TOKENS);
  const staticPosRef = useRef<Map<string, [number, number]>>(new Map());
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const dimmedRef = useRef(dimmedIds);
  dimmedRef.current = dimmedIds;
  const focusedRef = useRef(focusedId);
  focusedRef.current = focusedId;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    tokensRef.current = cacheTokens();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reduceMotionRef.current = reduceMotion;

    const simNodes = nodes.map((n) => ({ id: n.id }));
    const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));

    let width = Math.max(1, Math.round(container.getBoundingClientRect().width));
    let height = Math.max(1, Math.round(container.getBoundingClientRect().height));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    sizeRef.current = { width, height, dpr };

    const sim = createSimulation({
      nodes: simNodes,
      links: simLinks,
      width,
      height,
      initialPositions: reduceMotion ? staticRing(width, height, nodes) : undefined,
    });
    simRef.current = sim;

    const ctx = canvas.getContext('2d');

    let raf = 0;
    let disposed = false;

    const writeTicker = () => {
      const ticker = coordTickerRef.current;
      if (!ticker) return;
      const pointer = pointerPosRef.current;
      if (!pointer) return;
      const x = Math.round(pointer.x).toString().padStart(3, '0');
      const y = Math.round(pointer.y).toString().padStart(3, '0');
      ticker.textContent = `X: ${x} Y: ${y}`;
    };

    const render = () => {
      if (!ctx || disposed) return;
      const tokens = tokensRef.current;
      const { width: w, height: h, dpr: d } = sizeRef.current;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      const active = reduceMotionRef.current
        ? staticPosRef.current
        : new Map(sim.nodes.map((n) => [n.id, [n.x, n.y] as [number, number]]));

      const dimmed = dimmedRef.current;
      const focused = focusedRef.current;
      const focalId = focused ?? sim.hovered?.id ?? null;

      // Ferrofluid meniscus bridges: connected nodes in proximity fuse into a
      // single organic fluid mass. No straight hairlines, casts, or contours.
      const nodesById = new Map(sim.nodes.map((n) => [n.id, n]));
      for (const edge of edges) {
        const a = active.get(edge.source);
        const b = active.get(edge.target);
        if (!a || !b) continue;
        const ra = nodesById.get(edge.source)?.radius ?? 18;
        const rb = nodesById.get(edge.target)?.radius ?? 18;
        const isDim = dimmed.has(edge.source) && dimmed.has(edge.target);
        const isFocal = focalId !== null && (edge.source === focalId || edge.target === focalId);
        drawFluidBridge(
          ctx,
          a[0],
          a[1],
          b[0],
          b[1],
          Math.min(ra, rb),
          isFocal ? tokens.cyan : tokens.text,
          isDim ? (isFocal ? 0.3 : 0.16) : isFocal ? 0.95 : 0.8,
        );
      }

      // Pure circular primitives: flat filled discs with crisp edges. Hit
      // testing remains invariant at the canonical radius (r = 18px).
      for (const n of sim.nodes) {
        const pos = active.get(n.id);
        if (!pos) continue;
        const [x, y] = pos;
        const isDim = dimmed.has(n.id);
        const isFocused = focused === n.id;
        const isHovered = !isFocused && sim.hovered?.id === n.id;
        const isActive = isFocused || isHovered;

        ctx.globalAlpha = isDim ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? tokens.cyan : tokens.text;
        ctx.fill();

        if (fontsReadyRef.current) {
          ctx.font = MONO_FONT;
          ctx.fillStyle = isActive ? tokens.cyan : tokens.muted;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(n.label, x, y + n.radius + 18);
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (disposed) return;
      if (!reduceMotionRef.current) {
        const t = transformRef.current;
        const goal = targetRef.current;
        t.x += (goal.x - t.x) * 0.12;
        t.y += (goal.y - t.y) * 0.12;
        render();
      }
      writeTicker();
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      const ring = staticRing(width, height, nodes);
      staticPosRef.current = new Map(nodes.map((n) => [n.id, ring[n.id]]));
      for (const n of sim.nodes) {
        const p = ring[n.id];
        if (p) {
          n.x = p[0];
          n.y = p[1];
        }
      }
      render();
    } else {
      sim.sim.alpha(1).restart();
    }
    raf = requestAnimationFrame(loop);

    sim.sim.on('tick', () => {
      sim.poll();
      render();
    });

    // Gate canvas typography on the actual variable font file. Physics and
    // vector geometry animate immediately; text paints on resolution.
    document.fonts
      .load(MONO_FONT)
      .then(() => {
        fontsReadyRef.current = true;
        render();
      })
      .catch(() => {
        fontsReadyRef.current = true;
        render();
      });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * d);
      canvas.height = Math.round(height * d);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sizeRef.current = { width, height, dpr: d };
      if (reduceMotionRef.current) {
        const ring = staticRing(width, height, nodes);
        staticPosRef.current = new Map(nodes.map((n) => [n.id, ring[n.id]]));
        for (const n of sim.nodes) {
          const p = ring[n.id];
          if (p) {
            n.x = p[0];
            n.y = p[1];
          }
        }
      } else {
        sim.resize(width, height);
      }
      render();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(raf);
      sim.sim.on('tick', null);
      sim.destroy();
      simRef.current = null;
      pointerPosRef.current = null;
      if (coordTickerRef.current) coordTickerRef.current.textContent = TICKER_IDLE;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const goal = targetRef.current;
    const sim = simRef.current;
    if (!sim) return;
    const { width, height } = sizeRef.current;
    if (focusedId) {
      const n = sim.findNode(focusedId);
      if (n) {
        goal.x = width / 2 - n.x;
        goal.y = height / 2 - n.y;
      }
    } else {
      goal.x = 0;
      goal.y = 0;
    }
  }, [focusedId]);

  const worldPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.scale,
      y: (clientY - rect.top - t.y) / t.scale,
    };
  };

  const hitNode = (wx: number, wy: number): GraphNode | null => {
    const sim = simRef.current;
    if (!sim) return null;
    // Reduced-motion layout is static and lives in staticPosRef; the sim's
    // live coordinates are not advanced in that mode, so hit-test the ring.
    if (reduceMotionRef.current) {
      for (const n of sim.nodes) {
        const p = staticPosRef.current.get(n.id);
        if (p && Math.hypot(wx - p[0], wy - p[1]) <= n.radius) return n;
      }
      return null;
    }
    for (const n of sim.nodes) {
      if (Math.hypot(wx - n.x, wy - n.y) <= n.radius) return n;
    }
    return null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      pointerPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const sim = simRef.current;
    if (!sim) return;
    // Reduced motion pauses the simulation; pointer hover/drag would only
    // mutate pinned forces that are never consumed.
    if (reduceMotionRef.current) return;
    const p = worldPoint(e.clientX, e.clientY);
    if (sim.state === 'drag') {
      sim.dragMove(p.x, p.y);
    } else if (sim.state === 'idle' || sim.state === 'hover') {
      // Re-evaluate while already hovering so moving from one node straight
      // onto another pins the new node and unpins the old one.
      sim.hover(hitNode(p.x, p.y));
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    const p = worldPoint(e.clientX, e.clientY);
    const node = hitNode(p.x, p.y);
    downPosRef.current = { x: p.x, y: p.y };
    if (node) {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      if (!reduceMotionRef.current) sim.dragStart(node);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    const p = worldPoint(e.clientX, e.clientY);
    const start = downPosRef.current;
    const moved = start ? Math.hypot(p.x - start.x, p.y - start.y) : 10;
    if (reduceMotionRef.current) {
      // Static layout: a tap still selects a node, but nothing is dragged.
      if (moved < 6) {
        const node = hitNode(p.x, p.y);
        if (node) onSelectRef.current(node.id);
      }
    } else if (sim.state === 'drag') {
      const node = sim.hovered ?? hitNode(p.x, p.y);
      sim.dragEnd();
      if (moved < 6 && node) {
        onSelectRef.current(node.id);
      }
    }
    downPosRef.current = null;
  };

  const onPointerLeave = () => {
    pointerPosRef.current = null;
    if (coordTickerRef.current) coordTickerRef.current.textContent = TICKER_IDLE;
    const sim = simRef.current;
    if (!sim) return;
    if (reduceMotionRef.current) return;
    if (sim.state === 'drag') {
      sim.dragEnd();
    } else {
      sim.hover(null);
    }
  };

  return (
    <div ref={containerRef} className="drafting-grid absolute inset-0">
      <canvas
        ref={canvasRef}
        data-testid="graph-canvas"
        className="block h-full w-full touch-none"
        aria-label="Interactive project force graph. Each node represents a project."
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
}

function staticRing(
  width: number,
  height: number,
  nodeList: GraphNode[],
): Record<string, [number, number]> {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.3;
  const ids = nodeList.map((n) => n.id);
  const out: Record<string, [number, number]> = {};
  ids.forEach((id, i) => {
    const angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
    out[id] = [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  return out;
}
