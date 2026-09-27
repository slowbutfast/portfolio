import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { GraphEdge } from '../utils/graphTopology';
import type { GraphNode } from '../types/portfolio';
import { createSimulation, type GraphSimulation } from '../physics/graphSimulation';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  dimmedIds: Set<string>;
  focusedId: string | null;
  onSelect: (id: string) => void;
}

interface Size {
  width: number;
  height: number;
  dpr: number;
}

const RING_COLOR = '#1c1917';
const LINK_COLOR = '#d6d3d1';
const LABEL_COLOR = '#78716c';
const FOCUS_COLOR = '#0e7490';
const HOVER_COLOR = '#a8a29e';

export function GraphCanvas({ nodes, edges, dimmedIds, focusedId, onSelect }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<GraphSimulation | null>(null);
  const sizeRef = useRef<Size>({ width: 1, height: 1, dpr: 1 });
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const targetRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);
  const staticPosRef = useRef<Map<string, [number, number]>>(new Map());
  const downPosRef = useRef<{ x: number; y: number } | null>(null);
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

    const render = () => {
      if (!ctx || disposed) return;
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

      for (const edge of edges) {
        const a = active.get(edge.source);
        const b = active.get(edge.target);
        if (!a || !b) continue;
        const isDim = dimmed.has(edge.source) && dimmed.has(edge.target);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = LINK_COLOR;
        ctx.globalAlpha = isDim ? 0.18 : 0.75;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (const n of sim.nodes) {
        const pos = active.get(n.id);
        if (!pos) continue;
        const isDim = dimmed.has(n.id);
        ctx.globalAlpha = isDim ? 0.2 : 1;

        ctx.beginPath();
        ctx.arc(pos[0], pos[1], n.radius, 0, Math.PI * 2);
        ctx.fillStyle = RING_COLOR;
        ctx.fill();

        if (focused === n.id) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], n.radius + 7, 0, Math.PI * 2);
          ctx.strokeStyle = FOCUS_COLOR;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], n.radius + 12, 0, Math.PI * 2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (sim.hovered?.id === n.id) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], n.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = HOVER_COLOR;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.fillStyle = LABEL_COLOR;
        ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, pos[0], pos[1] + n.radius + 16);
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
      }
      render();
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
      raf = requestAnimationFrame(loop);
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
    <div ref={containerRef} className="absolute inset-0">
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