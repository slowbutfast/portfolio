import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { GraphEdge } from '../utils/graphTopology';
import type { GraphNode, ProjectData } from '../types/portfolio';
import { getProjectById } from '../data/projects';
import { PLANAR_NODE_SEEDS, scaleSeeds } from '../data/graphSeeds';
import { computeBridgeGeometry, type BridgeOptions } from '../utils/bridgeGeometry';
import { createSimulation, type GraphSimulation } from '../physics/graphSimulation';
import type { AmbientSynth } from '../audio/ambientSynth';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  dimmedIds: Set<string>;
  focusedId: string | null;
  visitedIds: Set<string>;
  initialSelectedId?: string | null;
  synth?: AmbientSynth | null;
  onHoverNode?: (
    project: ProjectData | null,
    position: { x: number; y: number } | null,
  ) => void;
  onCanvasDragStart?: () => void;
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
  bg: '#f6f6f4',
  surfaceContainer: '#eae9e5',
  text: '#0a0a0c',
  muted: '#525257',
  outline: '#71717a',
  accent: '#003399',
  nodeUnvisited: '#0a0a0c',
  nodeVisited: '#003399',
  connection: '#000000',
};

/** Canvas node labels use the same Swiss sans stack as the DOM interface. */
const LABEL_FONT =
  '500 12px "Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif';

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
 * Draw a bilateral ferrofluid bridge. The geometry is computed in pure math
 * (`computeBridgeGeometry`); a null result means the circles touch or overlap,
 * so the bridge is omitted instead of drawing inverted, crossing curves.
 */
function drawFluidBridge(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  radiusA: number,
  radiusB: number,
  fillStyle: string,
  alpha: number,
  options: BridgeOptions,
): void {
  const geometry = computeBridgeGeometry(a, b, radiusA, radiusB, options);
  if (!geometry) return;

  const {
    aTop,
    aBottom,
    bTop,
    bBottom,
    cp1Top,
    cp2Top,
    cp1Bottom,
    cp2Bottom,
  } = geometry;

  ctx.beginPath();
  ctx.moveTo(aTop.x, aTop.y);
  ctx.bezierCurveTo(cp1Top.x, cp1Top.y, cp2Top.x, cp2Top.y, bTop.x, bTop.y);
  ctx.lineTo(bBottom.x, bBottom.y);
  ctx.bezierCurveTo(cp2Bottom.x, cp2Bottom.y, cp1Bottom.x, cp1Bottom.y, aBottom.x, aBottom.y);
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
  synth,
  onHoverNode,
  onCanvasDragStart,
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
  const onCanvasDragStartRef = useRef(onCanvasDragStart);
  onCanvasDragStartRef.current = onCanvasDragStart;
  const onResolveAnchorRef = useRef(onResolveAnchor);
  onResolveAnchorRef.current = onResolveAnchor;
  const hoveredProjectIdRef = useRef<string | null>(null);
  const canHoverRef = useRef(false);
  const renderRef = useRef<() => void>(() => {});
  const wakeRef = useRef<() => void>(() => {});
  const synthRef = useRef<AmbientSynth | null>(null);
  synthRef.current = synth ?? null;
  const lastDragPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    tokensRef.current = cacheTokens();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reduceMotionRef.current = reduceMotion;
    canHoverRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const simNodes = nodes.map((n) => ({ id: n.id, label: n.label }));
    const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));

    let width = Math.max(1, Math.round(container.getBoundingClientRect().width));
    let height = Math.max(1, Math.round(container.getBoundingClientRect().height));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    sizeRef.current = { width, height, dpr };

    // Both the first animation frame and the reduced-motion static layout start
    // from the same authoritative planar embedding, scaled to the viewport.
    const scaledSeeds = scaleSeeds(PLANAR_NODE_SEEDS, width, height);

    const sim = createSimulation({
      nodes: simNodes,
      links: simLinks,
      width,
      height,
      seeds: PLANAR_NODE_SEEDS,
      initialPositions: scaledSeeds,
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
        const link = sim.findLink(edge.source, edge.target);
        // Detached bridges are a transient drag-only visual. The topological
        // edge remains in the model and reappears on release.
        if (link?.isDetached && !reduceMotionRef.current) continue;
        const ra = nodesById.get(edge.source)?.radius ?? 22;
        const rb = nodesById.get(edge.target)?.radius ?? 22;
        const isDim = dimmed.has(edge.source) && dimmed.has(edge.target);
        const isFocal = focalId !== null && (edge.source === focalId || edge.target === focalId);
        drawFluidBridge(
          ctx,
          { x: a[0], y: a[1] },
          { x: b[0], y: b[1] },
          ra,
          rb,
          isFocal ? tokens.accent : tokens.connection,
          isDim ? 0.12 : 1,
          {
            restDistance: link?.restDistance,
            sharedTagCount: link?.sharedTagCount ?? edge.tags.length,
            sag: reduceMotionRef.current ? 0 : link?.oscillator.sag ?? 0,
          },
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

        ctx.font = LABEL_FONT;
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

      ctx.restore();
      ctx.globalAlpha = 1;
    };
    renderRef.current = render;

    // Theme switches re-read the CSS custom properties without restarting the
    // simulation or losing node positions.
    const themeObserver = new MutationObserver(() => {
      tokensRef.current = cacheTokens();
      render();
      wakeRef.current();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    let idleSuspended = false;

    const wake = () => {
      if (disposed) return;
      if (idleSuspended) {
        idleSuspended = false;
        // A small alpha re-heats homing and oscillator integration just enough
        // to respond without a visible jump.
        sim.sim.alpha(Math.max(sim.sim.alpha(), 0.05)).restart();
      }
      if (raf === 0) raf = requestAnimationFrame(loop);
    };
    wakeRef.current = wake;

    const loop = () => {
      if (disposed) return;
      raf = 0;
      const t = transformRef.current;
      const goal = targetRef.current;
      const dx = goal.x - t.x;
      const dy = goal.y - t.y;
      const cameraMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
      if (!reduceMotionRef.current) {
        t.x += dx * 0.12;
        t.y += dy * 0.12;
        render();
      }
      if (
        !reduceMotionRef.current &&
        !cameraMoving &&
        sim.isIdle
      ) {
        // Everything has converged: stop the render loop and the d3 timer.
        // Pointer, resize, theme, filter, and focus events call wake().
        idleSuspended = true;
        sim.sim.stop();
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      staticPosRef.current = new Map(nodes.map((n) => [n.id, scaledSeeds[n.id]]));
      for (const n of sim.nodes) {
        const p = scaledSeeds[n.id];
        if (p) {
          n.x = p[0];
          n.y = p[1];
        }
      }
      render();
    } else {
      sim.sim.alpha(1).restart();
      wake();
    }

    sim.sim.on('tick', () => {
      sim.poll();
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
        const resizedSeeds = scaleSeeds(PLANAR_NODE_SEEDS, width, height);
        staticPosRef.current = new Map(nodes.map((n) => [n.id, resizedSeeds[n.id]]));
        for (const n of sim.nodes) {
          const p = resizedSeeds[n.id];
          if (p) {
            n.x = p[0];
            n.y = p[1];
          }
        }
      } else {
        sim.resize(width, height);
      }
      render();
      wakeRef.current();
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
      wakeRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter changes must wake a suspended loop (and repaint immediately when
  // reduced motion keeps the loop off).
  useEffect(() => {
    renderRef.current();
    wakeRef.current();
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
    wakeRef.current();
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
    wakeRef.current();
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
      synthRef.current?.onNodeHover(false);
      onHoverNodeRef.current?.(null, null);
      return;
    }
    synthRef.current?.onNodeHover(true);
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

  const emitAudioPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const synth = synthRef.current;
    if (!canvas || !synth) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    synth.onPointerMove(
      (clientX - rect.left) / rect.width,
      (clientY - rect.top) / rect.height,
    );
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    wakeRef.current();
    emitAudioPointer(e.clientX, e.clientY);
    const p = worldPoint(e.clientX, e.clientY);
    if (sim.state === 'drag') {
      const last = lastDragPointRef.current;
      if (last) synthRef.current?.onDragVelocity((p.x - last.x) * 60, (p.y - last.y) * 60);
      lastDragPointRef.current = { x: p.x, y: p.y };
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
    wakeRef.current();
    emitAudioPointer(e.clientX, e.clientY);
    emitHover(null);
    const p = worldPoint(e.clientX, e.clientY);
    const node = hitNode(p.x, p.y);
    downPosRef.current = { x: p.x, y: p.y };
    lastDragPointRef.current = { x: p.x, y: p.y };
    if (node) {
      onCanvasDragStartRef.current?.();
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      if (!reduceMotionRef.current) sim.dragStart(node);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    wakeRef.current();
    synthRef.current?.onDragVelocity(0, 0);
    lastDragPointRef.current = null;
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
    wakeRef.current();
    emitHover(null);
    const sim = simRef.current;
    if (!sim) return;
    if (reduceMotionRef.current) return;
    if (sim.state === 'drag') {
      sim.dragEnd();
    } else {
      sim.hover(null);
    }
    lastDragPointRef.current = null;
    synthRef.current?.onDragVelocity(0, 0);
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
