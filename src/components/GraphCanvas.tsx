import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { GraphEdge } from '../utils/graphTopology';
import type { GraphNode, ProjectData } from '../types/portfolio';
import { getProjectById } from '../data/projects';
import { createSimulation, type GraphSimulation } from '../physics/graphSimulation';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  dimmedIds: Set<string>;
  focusedId: string | null;
  visitedIds: Set<string>;
  initialSelectedId?: string | null;
  onHoverNode?: (
    project: ProjectData | null,
    position: { x: number; y: number } | null,
  ) => void;
  onResolveAnchor?: (id: string, anchor: { x: number; y: number }) => void;
  onSelect: (id: string, anchor?: { x: number; y: number }) => void;
}

interface Size {
  width: number;
  height: number;
  dpr: number;
}

interface FluidTokens {
  bg: string;
  surfaceContainer: string;
  text: string;
  muted: string;
  outline: string;
  accent: string;
  nodeUnvisited: string;
  nodeVisited: string;
  connection: string;
}

const DEFAULT_TOKENS: FluidTokens = {
  bg: '#0a0a0c',
  surfaceContainer: '#18191e',
  text: '#ffffff',
  muted: '#8e8e93',
  outline: '#71717a',
  accent: '#3d7fff',
  nodeUnvisited: '#ffffff',
  nodeVisited: '#3d7fff',
  connection: '#ffffff',
};

const MONO_FONT = '12px "JetBrains Mono Variable", monospace';
const BRIDGE_MAX_DISTANCE = 480;
const BRIDGE_MIN_HALF_WIDTH = 1.1;

function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function cacheTokens(): FluidTokens {
  return {
    bg: readToken('--color-bg', DEFAULT_TOKENS.bg),
    surfaceContainer: readToken('--color-surface-container', DEFAULT_TOKENS.surfaceContainer),
    text: readToken('--color-text', DEFAULT_TOKENS.text),
    muted: readToken('--color-muted', DEFAULT_TOKENS.muted),
    outline: readToken('--color-outline', DEFAULT_TOKENS.outline),
    accent: readToken('--color-accent', DEFAULT_TOKENS.accent),
    nodeUnvisited: readToken('--color-node-unvisited', DEFAULT_TOKENS.nodeUnvisited),
    nodeVisited: readToken('--color-node-visited', DEFAULT_TOKENS.nodeVisited),
    connection: readToken('--color-connection', DEFAULT_TOKENS.connection),
  };
}

/**
 * Fuse two nearby circles with an organic meniscus bridge. The cubic fillets
 * attach flush to each circumference, flare at the contact tangent, and pinch
 * toward a waist under distance tension — ferrofluid under a magnetic field.
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
  if (distance <= 0.001) return;

  const ux = dx / distance;
  const uy = dy / distance;
  const px = -uy;
  const py = ux;

  const tension = Math.max(0.12, 1 - distance / BRIDGE_MAX_DISTANCE);
  const halfWidth = Math.max(BRIDGE_MIN_HALF_WIDTH, radius * 0.92 * tension);
  const waist = halfWidth * tension;
  const theta = Math.asin(Math.min(1, halfWidth / radius));
  const reach = radius * Math.cos(theta);
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
  visitedIds,
  initialSelectedId,
  onHoverNode,
  onResolveAnchor,
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
  const tokensRef = useRef<FluidTokens>(DEFAULT_TOKENS);
  const staticPosRef = useRef<Map<string, [number, number]>>(new Map());
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const dimmedRef = useRef(dimmedIds);
  dimmedRef.current = dimmedIds;
  const focusedRef = useRef(focusedId);
  focusedRef.current = focusedId;
  const visitedRef = useRef(visitedIds);
  visitedRef.current = visitedIds;
  const onHoverNodeRef = useRef(onHoverNode);
  onHoverNodeRef.current = onHoverNode;
  const onResolveAnchorRef = useRef(onResolveAnchor);
  onResolveAnchorRef.current = onResolveAnchor;
  const hoveredProjectIdRef = useRef<string | null>(null);
  const canHoverRef = useRef(false);
  const renderRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    tokensRef.current = cacheTokens();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reduceMotionRef.current = reduceMotion;
    canHoverRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
      const visited = visitedRef.current;
      const focalId = focused ?? sim.hovered?.id ?? null;

      // Pure binary connections. No grayscale, no alpha fade on live edges;
      // only filtered-out pairs recede to 0.12.
      const nodesById = new Map(sim.nodes.map((n) => [n.id, n]));
      for (const edge of edges) {
        const a = active.get(edge.source);
        const b = active.get(edge.target);
        if (!a || !b) continue;
        const ra = nodesById.get(edge.source)?.radius ?? 22;
        const rb = nodesById.get(edge.target)?.radius ?? 22;
        const isDim = dimmed.has(edge.source) && dimmed.has(edge.target);
        const isFocal = focalId !== null && (edge.source === focalId || edge.target === focalId);
        drawFluidBridge(
          ctx,
          a[0],
          a[1],
          b[0],
          b[1],
          Math.min(ra, rb),
          isFocal ? tokens.accent : tokens.connection,
          isDim ? 0.12 : 1,
        );
      }

      // Pure circular primitives, with a background-matched pill behind each
      // title so connections can never obstruct the label.
      for (const n of sim.nodes) {
        const pos = active.get(n.id);
        if (!pos) continue;
        const [x, y] = pos;
        const isDim = dimmed.has(n.id);
        const isFocused = focused === n.id;
        const isHovered = !isFocused && sim.hovered?.id === n.id;
        const isActive = isFocused || isHovered;
        const isVisited = visited.has(n.id) || n.visited === true;

        ctx.globalAlpha = isDim ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isActive
          ? tokens.accent
          : isVisited
            ? tokens.nodeVisited
            : tokens.nodeUnvisited;
        ctx.fill();

        if (fontsReadyRef.current) {
          ctx.font = MONO_FONT;
          const labelWidth = ctx.measureText(n.label).width;
          const pillWidth = labelWidth + 16;
          const pillHeight = 20;
          const pillX = x - pillWidth / 2;
          const pillY = y + n.radius + 8;

          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
          ctx.fillStyle = tokens.bg;
          ctx.fill();

          ctx.fillStyle = isActive ? tokens.accent : tokens.text;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.label, x, pillY + pillHeight / 2);
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    };
    renderRef.current = render;

    // Theme switches re-read the CSS custom properties without restarting the
    // simulation or losing node positions.
    const themeObserver = new MutationObserver(() => {
      tokensRef.current = cacheTokens();
      render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const loop = () => {
      if (disposed) return;
      if (!reduceMotionRef.current) {
        const t = transformRef.current;
        const goal = targetRef.current;
        t.x += (goal.x - t.x) * 0.12;
        t.y += (goal.y - t.y) * 0.12;
        render();
      }
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

    // Canvas typography waits for the variable mono font; physics and bridges
    // start immediately and repaint the moment the face resolves.
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
      themeObserver.disconnect();
      cancelAnimationFrame(raf);
      sim.sim.on('tick', null);
      sim.destroy();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reduced motion pauses the rAF loop, so filtered dimming needs an explicit
  // repaint when dimmedIds changes.
  useEffect(() => {
    if (reduceMotionRef.current) renderRef.current();
  }, [dimmedIds]);

  // Deep links open immediately; keep the inspector anchored while the physics
  // settles from its initial ring positions.
  useEffect(() => {
    if (!initialSelectedId) return;
    const emit = () => {
      const sim = simRef.current;
      const canvas = canvasRef.current;
      if (!sim || !canvas) return;
      const node = sim.findNode(initialSelectedId);
      if (!node) return;
      const pos = reduceMotionRef.current
        ? staticPosRef.current.get(node.id)
        : ([node.x, node.y] as [number, number]);
      if (!pos) return;
      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      onResolveAnchorRef.current?.(initialSelectedId, {
        x: rect.left + pos[0] * t.scale + t.x,
        y: rect.top + pos[1] * t.scale + t.y,
      });
    };
    emit();
    const interval = window.setInterval(emit, 300);
    const stop = window.setTimeout(() => window.clearInterval(interval), 3000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [initialSelectedId]);

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

  const nodeScreenPoint = (node: GraphNode): { x: number; y: number } | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const pos = reduceMotionRef.current
      ? staticPosRef.current.get(node.id)
      : ([node.x, node.y] as [number, number]);
    if (!pos) return undefined;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: rect.left + pos[0] * t.scale + t.x,
      y: rect.top + pos[1] * t.scale + t.y,
    };
  };

  const emitHover = (node: GraphNode | null) => {
    const nextId = node?.id ?? null;
    if (nextId === hoveredProjectIdRef.current) return;
    hoveredProjectIdRef.current = nextId;
    if (!node) {
      onHoverNodeRef.current?.(null, null);
      return;
    }
    const project = getProjectById(node.id) ?? null;
    const anchor = nodeScreenPoint(node);
    if (project && anchor) onHoverNodeRef.current?.(project, anchor);
    else onHoverNodeRef.current?.(null, null);
  };

  const hitNode = (wx: number, wy: number): GraphNode | null => {
    const sim = simRef.current;
    if (!sim) return null;
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
    const sim = simRef.current;
    if (!sim) return;
    const p = worldPoint(e.clientX, e.clientY);
    if (sim.state === 'drag') {
      emitHover(null);
      sim.dragMove(p.x, p.y);
      return;
    }
    const node = hitNode(p.x, p.y);
    if (canHoverRef.current) emitHover(node);
    if (reduceMotionRef.current) return;
    if (sim.state === 'idle' || sim.state === 'hover') {
      sim.hover(node);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    emitHover(null);
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
      if (moved < 6) {
        const node = hitNode(p.x, p.y);
        if (node) onSelectRef.current(node.id, nodeScreenPoint(node));
      }
    } else if (sim.state === 'drag') {
      const node = sim.hovered ?? hitNode(p.x, p.y);
      sim.dragEnd();
      if (moved < 6 && node) {
        onSelectRef.current(node.id, nodeScreenPoint(node));
      }
    }
    downPosRef.current = null;
  };

  const onPointerLeave = () => {
    emitHover(null);
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
        className="canvas-interactive block h-full w-full touch-none"
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
