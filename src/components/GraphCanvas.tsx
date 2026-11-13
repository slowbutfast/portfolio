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
import {
  ambientDriftOffset,
  createSimulation,
  RECOIL_MS,
  type GraphSimulation,
} from '../physics/graphSimulation';
import type { PopoverObstacles } from '../utils/popoverPlacement';
import { shouldClearStickyFocalOnTap } from '../utils/stickyFocal';
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
    obstacles?: PopoverObstacles,
  ) => void;
  onCanvasDragStart?: () => void;
  onResolveAnchor?: (
    id: string,
    anchor: { x: number; y: number },
    obstacles?: PopoverObstacles,
  ) => void;
  onSelect: (
    id: string,
    anchor?: { x: number; y: number },
    obstacles?: PopoverObstacles,
  ) => void;
  /** Bumped by the 3-dot menu's "Reset layout" action. */
  layoutResetVersion?: number;
  /** Measured canvas-container center for peripheral hover-card anchoring. */
  onCanvasCenterChange?: (center: { x: number; y: number }) => void;
  /** Highlighted node retained after the inspector closes. */
  stickyFocalId?: string | null;
  /** Clears the sticky focal highlight (empty-canvas tap, Reset, Grid view). */
  onClearFocal?: () => void;
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
const LABEL_FONT_SIZE = 12;
const LABEL_FONT = `500 ${LABEL_FONT_SIZE}px "Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
/** Edge-tag rows use 1.15 line spacing inside one contiguous rounded rect. */
const EDGE_TAG_LINE_SPACING = 1.15;
const EDGE_TAG_VERTICAL_PADDING = 4;

/** Unified hover gate shared by simulation pinning and the DOM preview card. */
const HOVER_DWELL_MS = 250;
/** Proximity-only webbing appears for non-edge pairs inside this distance. */
const PROXIMITY_MAX_DIST = 96;

function edgeKey(source: string, target: string): string {
  return [source, target].sort().join('\u0000');
}

function smoothstep01(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function easeOutCubic(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return 1 - Math.pow(1 - clamped, 3);
}

function readToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Mobile GPUs pay for every backing-store pixel. Touch-first devices are capped
 * at 2 even when the display reports 2.6x/3x, which is visually
 * indistinguishable for these hairlines and circles.
 */
function getEffectiveDpr(): number {
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse ? Math.min(dpr, 2) : dpr;
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
  fillStyle: string | CanvasGradient,
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

/**
 * Retracting droplet tips left behind when a bridge snaps. The tips recede into
 * both endpoint circles over the bridge's `220ms` recoil window.
 */
function drawRecoilTips(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
  radiusA: number,
  radiusB: number,
  color: string,
  alpha: number,
  progress: number,
): void {
  if (progress <= 0) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.0001) return;
  const ux = dx / distance;
  const uy = dy / distance;
  const tipLength = 2 + 10 * progress;
  const halfWidth = 1.5 + 2.5 * progress;

  ctx.globalAlpha = alpha * 0.9 * progress;
  ctx.fillStyle = color;
  for (const [origin, direction, radius] of [
    [a, { x: ux, y: uy }, radiusA],
    [b, { x: -ux, y: -uy }, radiusB],
  ] as const) {
    // A teardrop whose tip points along the severed bridge and retracts toward
    // the live endpoint as progress falls from 1 to 0.
    const baseX = origin.x + direction.x * radius;
    const baseY = origin.y + direction.y * radius;
    const tipX = baseX + direction.x * tipLength;
    const tipY = baseY + direction.y * tipLength;
    const nx = -direction.y;
    const ny = direction.x;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(
      baseX + nx * halfWidth,
      baseY + ny * halfWidth,
      baseX,
      baseY,
    );
    ctx.quadraticCurveTo(
      baseX - nx * halfWidth,
      baseY - ny * halfWidth,
      tipX,
      tipY,
    );
    ctx.closePath();
    ctx.fill();
  }
}

/** Stacked shared-tag labels drawn inside one contiguous rounded rectangle. */
function drawEdgeTagPills(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tags: string[],
  tokens: FluidTokens,
): number {
  if (tags.length === 0) return 0;
  const visible = tags.slice(0, 3);
  const lineHeight = LABEL_FONT_SIZE * EDGE_TAG_LINE_SPACING;
  const totalHeight =
    visible.length * lineHeight + EDGE_TAG_VERTICAL_PADDING * 2;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 1;

  const width =
    Math.max(...visible.map((tag) => ctx.measureText(tag).width)) + 16;
  const left = x - width / 2;
  const top = y - totalHeight / 2;
  ctx.beginPath();
  ctx.roundRect(left, top, width, totalHeight, 10);
  ctx.fillStyle = tokens.surfaceContainer;
  ctx.fill();

  ctx.fillStyle = tokens.accent;
  for (let index = 0; index < visible.length; index += 1) {
    ctx.fillText(
      visible[index],
      x,
      top + EDGE_TAG_VERTICAL_PADDING + lineHeight / 2 + index * lineHeight,
    );
  }
  return visible.length;
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
  layoutResetVersion = 0,
  onCanvasCenterChange,
  stickyFocalId = null,
  onClearFocal,
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
  const downNodeIdRef = useRef<string | null>(null);
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
  const onCanvasCenterChangeRef = useRef(onCanvasCenterChange);
  onCanvasCenterChangeRef.current = onCanvasCenterChange;
  const selectedIdRef = useRef<string | null>(initialSelectedId ?? null);
  selectedIdRef.current = initialSelectedId ?? null;
  const stickyFocalRef = useRef<string | null>(stickyFocalId);
  stickyFocalRef.current = stickyFocalId;
  const onClearFocalRef = useRef(onClearFocal);
  onClearFocalRef.current = onClearFocal;
  const buildObstacleSnapshotRef = useRef<
    () => PopoverObstacles | undefined
  >(() => undefined);
  const ambientOffsetRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastAmbientAtRef = useRef(0);
  const lastRenderAtRef = useRef(0);
  const activePositionsRef = useRef<Map<string, [number, number]>>(new Map());
  const lastDimmedSetRef = useRef<Set<string> | null>(null);
  const dimmedEdgesRef = useRef('');
  const visibleRef = useRef(true);
  const hoveredProjectIdRef = useRef<string | null>(null);
  const canHoverRef = useRef(false);
  const renderRef = useRef<() => void>(() => {});
  const wakeRef = useRef<() => void>(() => {});
  const synthRef = useRef<AmbientSynth | null>(null);
  synthRef.current = synth ?? null;
  const lastDragPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const hoverDwellTimerRef = useRef<number | null>(null);
  const hoverCandidateRef = useRef<GraphNode | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    tokensRef.current = cacheTokens();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reduceMotionRef.current = reduceMotion;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    canHoverRef.current =
      !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const simNodes = nodes.map((n) => ({ id: n.id, label: n.label }));
    const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));

    let width = Math.max(1, Math.round(container.getBoundingClientRect().width));
    let height = Math.max(1, Math.round(container.getBoundingClientRect().height));

    const dpr = getEffectiveDpr();
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

    // Node ids and permanent-edge keys never change for this mount; hoist them
    // out of the 60fps render loop.
    const sortedNodeIds = sim.nodes.map((node) => node.id).sort();
    const permanentEdgeKeys = new Set(edges.map((edge) => edgeKey(edge.source, edge.target)));
    const nodesById = new Map(sim.nodes.map((node) => [node.id, node]));

    const ctx = canvas.getContext('2d');
    let raf = 0;
    let idleTimer = 0;
    let disposed = false;

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
        lastAmbientAtRef.current = 0;
        wakeRef.current();
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(container);
    const handleVisibilityChange = () => {
      lastAmbientAtRef.current = 0;
      wakeRef.current();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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

      const now = performance.now();
      const ambientActive =
        !reduceMotionRef.current && visibleRef.current && !document.hidden;
      const ambientOffsets = ambientOffsetRef.current;
      if (ambientActive) {
        if (now - lastAmbientAtRef.current >= 1000 / 30) {
          ambientOffsets.clear();
          for (const node of sim.nodes) {
            ambientOffsets.set(node.id, ambientDriftOffset(node.id, now));
          }
          lastAmbientAtRef.current = now;
        }
      } else if (ambientOffsets.size > 0) {
        ambientOffsets.clear();
      }

      let active: Map<string, [number, number]>;
      if (reduceMotionRef.current) {
        active = staticPosRef.current;
      } else {
        const positions = activePositionsRef.current;
        for (const node of sim.nodes) {
          const offset = ambientActive
            ? ambientOffsets.get(node.id) ?? { x: 0, y: 0 }
            : { x: 0, y: 0 };
          const entry = positions.get(node.id);
          if (entry) {
            entry[0] = node.x + offset.x;
            entry[1] = node.y + offset.y;
          } else {
            positions.set(node.id, [node.x + offset.x, node.y + offset.y]);
          }
        }
        active = positions;
      }

      const dimmed = dimmedRef.current;
      const focused = focusedRef.current;
      const visited = visitedRef.current;
      const focalId =
        focused ??
        sim.hovered?.id ??
        selectedIdRef.current ??
        stickyFocalRef.current ??
        null;

      if (dimmed !== lastDimmedSetRef.current) {
        lastDimmedSetRef.current = dimmed;
        dimmedEdgesRef.current = edges
          .filter((edge) => dimmed.has(edge.source) || dimmed.has(edge.target))
          .map((edge) => edgeKey(edge.source, edge.target))
          .sort()
          .join(',');
      }
      if (canvas.dataset.dimmedEdges !== dimmedEdgesRef.current) {
        canvas.dataset.dimmedEdges = dimmedEdgesRef.current;
      }
      if (canvas.dataset.simState !== sim.state) {
        canvas.dataset.simState = sim.state;
      }
      const camera = transformRef.current;
      canvas.dataset.cameraX = camera.x.toFixed(1);
      canvas.dataset.cameraY = camera.y.toFixed(1);
      canvas.dataset.renderDpr = String(d);
      canvas.dataset.renderCount = String(
        (Number(canvas.dataset.renderCount) || 0) + 1,
      );
      if (selectedIdRef.current) {
        const selectedPos = active.get(selectedIdRef.current);
        if (selectedPos) {
          canvas.dataset.selectedScreenY = (
            selectedPos[1] * camera.scale +
            camera.y
          ).toFixed(1);
        }
      } else if (canvas.dataset.selectedScreenY !== undefined) {
        delete canvas.dataset.selectedScreenY;
      }

      const nodeColor = (id: string): string => {
        if (focused === id) return tokens.accent;
        if (!focused && sim.hovered?.id === id) return tokens.accent;
        if (visited.has(id) || nodesById.get(id)?.visited === true) return tokens.nodeVisited;
        return tokens.nodeUnvisited;
      };

      // Zero-force proximity-only webbing for non-edge pairs. This pass paints
      // beneath permanent bridges and nodes, in deterministic sorted-pair order,
      // and skips every permanent edge so a detached bridge never duplicates.
      for (let i = 0; i < sortedNodeIds.length; i += 1) {
        for (let j = i + 1; j < sortedNodeIds.length; j += 1) {
          const sourceId = sortedNodeIds[i];
          const targetId = sortedNodeIds[j];
          if (permanentEdgeKeys.has(edgeKey(sourceId, targetId))) continue;
          const a = active.get(sourceId);
          const b = active.get(targetId);
          if (!a || !b) continue;
          const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
          const ra = nodesById.get(sourceId)?.radius ?? 22;
          const rb = nodesById.get(targetId)?.radius ?? 22;
          const contactDistance = ra + rb;
          if (distance <= contactDistance || distance >= PROXIMITY_MAX_DIST) continue;
          const fadeIn = smoothstep01((distance - contactDistance) / 12);
          const taper = 1 - distance / PROXIMITY_MAX_DIST;
          if (fadeIn <= 0) continue;
          drawFluidBridge(
            ctx,
            { x: a[0], y: a[1] },
            { x: b[0], y: b[1] },
            ra,
            rb,
            tokens.connection,
            0.22 * fadeIn * taper,
            { restDistance: distance, sharedTagCount: 1, sag: 0 },
          );
        }
      }

      // Pure binary connections. No grayscale, no alpha fade on live edges;
      // only filtered-out pairs recede to 0.12. Bridge fills blend the endpoint
      // node colors along the center-to-center axis through `connection`.
      for (const edge of edges) {
        const a = active.get(edge.source);
        const b = active.get(edge.target);
        if (!a || !b) continue;
        const link = sim.findLink(edge.source, edge.target);
        const ra = nodesById.get(edge.source)?.radius ?? 22;
        const rb = nodesById.get(edge.target)?.radius ?? 22;
        const isDim = dimmed.has(edge.source) || dimmed.has(edge.target);
        const isFocal = focalId !== null && (edge.source === focalId || edge.target === focalId);
        const sourceColor = nodeColor(edge.source);
        const targetColor = nodeColor(edge.target);
        if (link?.isDetached && !reduceMotionRef.current) {
          const age = link.detachedAt == null ? Number.POSITIVE_INFINITY : now - link.detachedAt;
          const progress =
            age >= RECOIL_MS ? 0 : 1 - easeOutCubic(age / RECOIL_MS);
          drawRecoilTips(
            ctx,
            { x: a[0], y: a[1] },
            { x: b[0], y: b[1] },
            ra,
            rb,
            isFocal ? tokens.accent : tokens.connection,
            isDim ? 0.12 : 1,
            progress,
          );
          continue;
        }
        let fill: string | CanvasGradient;
        if (sourceColor === targetColor) {
          fill = sourceColor;
        } else {
          const gradient = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
          gradient.addColorStop(0, sourceColor);
          gradient.addColorStop(0.5, tokens.connection);
          gradient.addColorStop(1, targetColor);
          fill = gradient;
        }
        drawFluidBridge(
          ctx,
          { x: a[0], y: a[1] },
          { x: b[0], y: b[1] },
          ra,
          rb,
          fill,
          isDim ? 0.12 : 1,
          {
            restDistance: link?.restDistance,
            sharedTagCount: link?.sharedTagCount ?? edge.tags.length,
            sag: reduceMotionRef.current ? 0 : link?.oscillator.sag ?? 0,
          },
        );
      }

      // Focal-only shared-tag labels ride above the bridges and beneath nodes.
      let focalTagCount = 0;
      if (focalId !== null) {
        for (const edge of edges) {
          if (edge.source !== focalId && edge.target !== focalId) continue;
          const isDim = dimmed.has(edge.source) || dimmed.has(edge.target);
          if (isDim) continue;
          const link = sim.findLink(edge.source, edge.target);
          if (link?.isDetached && !reduceMotionRef.current) continue;
          const a = active.get(edge.source);
          const b = active.get(edge.target);
          if (!a || !b) continue;
          focalTagCount += drawEdgeTagPills(
            ctx,
            (a[0] + b[0]) / 2,
            (a[1] + b[1]) / 2,
            edge.tags,
            tokens,
          );
        }
      }
      const focalTagValue = String(focalTagCount);
      if (canvas.dataset.focalTagPills !== focalTagValue) {
        canvas.dataset.focalTagPills = focalTagValue;
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

    // A live reduced-motion transition cancels any pending dwell and dismisses
    // the card immediately, even if the page has already mounted.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverCapabilityQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleMotionChange = () => {
      const reduced = motionQuery.matches;
      reduceMotionRef.current = reduced;
      canHoverRef.current = !reduced && hoverCapabilityQuery.matches;

      if (reduced) {
        if (hoverDwellTimerRef.current !== null) {
          window.clearTimeout(hoverDwellTimerRef.current);
          hoverDwellTimerRef.current = null;
        }
        hoverCandidateRef.current = null;
        if (hoveredProjectIdRef.current !== null) {
          hoveredProjectIdRef.current = null;
          synthRef.current?.onNodeHover(false);
          onHoverNodeRef.current?.(null, null);
        }
        if (sim.state === 'drag') {
          sim.dragEnd();
          lastDragPointRef.current = null;
          synthRef.current?.onDragVelocity(0, 0);
        }
        sim.hover(null);
        // Freeze the current graph in place, not the original planar seeds.
        staticPosRef.current = new Map(
          sim.nodes.map((node) => [node.id, [node.x, node.y] as [number, number]]),
        );
        ambientOffsetRef.current = new Map();
        sim.sim.stop();
        cancelAnimationFrame(raf);
        raf = 0;
        if (idleTimer !== 0) {
          window.clearTimeout(idleTimer);
          idleTimer = 0;
        }
        render();
        return;
      }

      // Returning to standard motion resumes from the frozen frame and restarts
      // both the physics timer and the render loop.
      for (const node of sim.nodes) {
        const frozen = staticPosRef.current.get(node.id);
        if (frozen) {
          node.x = frozen[0];
          node.y = frozen[1];
        }
      }
      staticPosRef.current = new Map();
      lastAmbientAtRef.current = 0;
      sim.sim.alpha(Math.max(sim.sim.alpha(), 0.2)).restart();
      render();
      wakeRef.current();
    };
    motionQuery.addEventListener('change', handleMotionChange);

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
      if (idleTimer !== 0) {
        window.clearTimeout(idleTimer);
        idleTimer = 0;
      }
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
      const now = performance.now();
      const t = transformRef.current;
      const goal = targetRef.current;
      const dx = goal.x - t.x;
      const dy = goal.y - t.y;
      const cameraMoving = Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05;
      const ambientRunning =
        !reduceMotionRef.current && visibleRef.current && !document.hidden;
      if (!reduceMotionRef.current) {
        t.x += dx * 0.12;
        t.y += dy * 0.12;
        const idleAmbientOnly =
          ambientRunning && !cameraMoving && sim.isIdle;
        if (
          !idleAmbientOnly ||
          now - lastRenderAtRef.current >= 1000 / 30
        ) {
          render();
          lastRenderAtRef.current = now;
        }
        if (idleAmbientOnly && coarsePointer) {
          // Touch devices: stop both the d3 timer and the rAF loop between
          // ambient frames. The timed 15fps tick keeps the ferrofluid breathing
          // while cutting idle wakeups by ~75-87%.
          idleSuspended = true;
          sim.sim.stop();
          idleTimer = window.setTimeout(() => {
            idleTimer = 0;
            loop();
          }, 1000 / 15);
          return;
        }
      }
      if (
        !reduceMotionRef.current &&
        !ambientRunning &&
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
      onCanvasCenterChangeRef.current?.({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const d = getEffectiveDpr();
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
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      themeObserver.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
      cancelAnimationFrame(raf);
      if (idleTimer !== 0) window.clearTimeout(idleTimer);
      if (hoverDwellTimerRef.current !== null) {
        window.clearTimeout(hoverDwellTimerRef.current);
        hoverDwellTimerRef.current = null;
      }
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
      onResolveAnchorRef.current?.(
        initialSelectedId,
        {
          x: rect.left + pos[0] * t.scale + t.x,
          y: rect.top + pos[1] * t.scale + t.y,
        },
        buildObstacleSnapshotRef.current(),
      );
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

  // On sheet viewports the camera lifts the inspected node into the visible
  // strip between the measured header bottom and the drawer's top edge. The
  // strip is re-measured on viewport resize and while the sheet changes height
  // (drag or detent snap), then released to (0, 0) as soon as the sheet closes
  // — even when the sticky focal highlight persists.
  useEffect(() => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return;
    const goal = targetRef.current;
    let frame = 0;
    let retry: number | null = null;
    let disposed = false;

    const sheetViewport = () =>
      window.innerWidth < 768 ||
      (window.matchMedia('(pointer: coarse)').matches &&
        window.innerHeight < 500);

    const reset = () => {
      goal.x = 0;
      goal.y = 0;
      wakeRef.current();
    };

    if (!initialSelectedId) {
      // Selecting a semantic nav entry owns the camera; otherwise closing the
      // sheet returns the graph to its resting transform.
      if (!focusedId) reset();
      return;
    }
    if (!sheetViewport() || focusedId) return;

    const measure = () => {
      if (disposed) return;
      if (!sheetViewport()) {
        reset();
        return;
      }
      const node = simRef.current?.findNode(initialSelectedId);
      const sheet = document.querySelector<HTMLElement>(
        '[data-testid="project-drawer"]',
      );
      const brand = document.querySelector<HTMLElement>(
        '[data-testid="brand-home"]',
      );
      if (!node) return;
      if (!sheet) {
        // The drawer mounts in the same commit, but keep a short retry window
        // for deep links that hydrate the selection after first paint.
        if (retry === null) {
          retry = window.setTimeout(() => {
            retry = null;
            measure();
          }, 80);
        }
        return;
      }
      const headerBottom =
        brand?.closest('header')?.getBoundingClientRect().bottom ?? 0;
      const sheetTop = sheet.getBoundingClientRect().top;
      const targetY = headerBottom + (sheetTop - headerBottom) / 2;
      const rect = canvas.getBoundingClientRect();
      const scale = transformRef.current.scale;
      goal.x = rect.width / 2 - node.x * scale;
      goal.y = targetY - rect.top - node.y * scale;
      wakeRef.current();
    };

    const scheduleMeasure = () => {
      if (disposed || frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    measure();
    const sheet = document.querySelector<HTMLElement>(
      '[data-testid="project-drawer"]',
    );
    let sheetObserver: ResizeObserver | null = null;
    if (sheet) {
      sheetObserver = new ResizeObserver(scheduleMeasure);
      sheetObserver.observe(sheet);
    }
    window.addEventListener('resize', scheduleMeasure);
    const orientation = window.matchMedia('(orientation: landscape)');
    orientation.addEventListener('change', scheduleMeasure);
    // CSS detent transitions may not emit a usable ResizeObserver sample on
    // every frame (and dynamic viewport units can settle late). A light poll
    // keeps the target in sync while the sheet is open; it disappears on close.
    const geometryPoll = window.setInterval(measure, 120);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearInterval(geometryPoll);
      if (retry !== null) window.clearTimeout(retry);
      sheetObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      orientation.removeEventListener('change', scheduleMeasure);
    };
  }, [initialSelectedId, focusedId]);

  // Focusing a semantic nav entry immediately cancels any pending hover dwell
  // and dismisses an open preview card.
  useEffect(() => {
    if (hoverDwellTimerRef.current !== null) {
      window.clearTimeout(hoverDwellTimerRef.current);
      hoverDwellTimerRef.current = null;
    }
    hoverCandidateRef.current = null;
    if (hoveredProjectIdRef.current !== null) {
      hoveredProjectIdRef.current = null;
      synthRef.current?.onNodeHover(false);
      onHoverNodeRef.current?.(null, null);
    }
    simRef.current?.hover(null);
  }, [focusedId]);

  useEffect(() => {
    if (layoutResetVersion <= 0) return;
    simRef.current?.resetLayout();
    renderRef.current();
    wakeRef.current();
  }, [layoutResetVersion]);

  // Inspector close/open and sticky-highlight changes must repaint a graph that
  // may already be idle-suspended.
  useEffect(() => {
    renderRef.current();
    wakeRef.current();
  }, [stickyFocalId, initialSelectedId]);

  const worldPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - t.x) / t.scale,
      y: (clientY - rect.top - t.y) / t.scale,
    };
  };

  /** Same live position used by the renderer, hit testing, and card anchors. */
  const nodeVisualPosition = (node: GraphNode): { x: number; y: number } | undefined => {
    const base = reduceMotionRef.current
      ? staticPosRef.current.get(node.id)
      : ([node.x, node.y] as [number, number]);
    if (!base) return undefined;
    const ambientActive =
      !reduceMotionRef.current && visibleRef.current && !document.hidden;
    const offset = ambientActive
      ? ambientOffsetRef.current.get(node.id) ?? { x: 0, y: 0 }
      : { x: 0, y: 0 };
    return { x: base[0] + offset.x, y: base[1] + offset.y };
  };

  const nodeScreenPoint = (node: GraphNode): { x: number; y: number } | undefined => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const pos = nodeVisualPosition(node);
    if (!pos) return undefined;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: rect.left + pos.x * t.scale + t.x,
      y: rect.top + pos.y * t.scale + t.y,
    };
  };

  const buildObstacleSnapshot = (): PopoverObstacles | undefined => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const nodes: PopoverObstacles['nodes'] = [];
    for (const node of sim.nodes) {
      const pos = nodeVisualPosition(node);
      if (!pos) continue;
      nodes.push({
        id: node.id,
        x: rect.left + pos.x * t.scale + t.x,
        y: rect.top + pos.y * t.scale + t.y,
        radius: node.radius * t.scale,
      });
    }

    const focal =
      focusedRef.current ??
      sim.hovered?.id ??
      selectedIdRef.current ??
      stickyFocalRef.current ??
      null;
    const segments: PopoverObstacles['segments'] = [];
    for (const edge of edges) {
      const link = sim.findLink(edge.source, edge.target);
      if (link?.isDetached && !reduceMotionRef.current) continue;
      const source = sim.findNode(edge.source);
      const target = sim.findNode(edge.target);
      if (!source || !target) continue;
      const a = nodeVisualPosition(source);
      const b = nodeVisualPosition(target);
      if (!a || !b) continue;
      segments.push({
        source: edge.source,
        target: edge.target,
        x1: rect.left + a.x * t.scale + t.x,
        y1: rect.top + a.y * t.scale + t.y,
        x2: rect.left + b.x * t.scale + t.x,
        y2: rect.top + b.y * t.scale + t.y,
        isFocal: focal !== null && (edge.source === focal || edge.target === focal),
      });
    }
    return { nodes, segments };
  };
  buildObstacleSnapshotRef.current = buildObstacleSnapshot;

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
    if (project && anchor) {
      onHoverNodeRef.current?.(project, anchor, buildObstacleSnapshot());
    } else {
      onHoverNodeRef.current?.(null, null);
    }
  };

  const clearHoverDwell = () => {
    if (hoverDwellTimerRef.current !== null) {
      window.clearTimeout(hoverDwellTimerRef.current);
      hoverDwellTimerRef.current = null;
    }
    hoverCandidateRef.current = null;
  };

  /**
   * Single 200ms gate for both simulation hover physics and the DOM card. Fast
   * sweeps across nodes never open a card; a stationary dwell does both at once.
   */
  const beginHoverDwell = (node: GraphNode | null) => {
    const sim = simRef.current;
    if (!sim) return;
    clearHoverDwell();
    if (!node) {
      emitHover(null);
      if (!reduceMotionRef.current) sim.hover(null);
      return;
    }
    if (
      !canHoverRef.current ||
      reduceMotionRef.current ||
      sim.state === 'coasting' ||
      sim.state === 'drag'
    ) {
      emitHover(null);
      return;
    }
    if (hoveredProjectIdRef.current === node.id) return;
    if (hoverCandidateRef.current?.id === node.id) return;

    hoverCandidateRef.current = node;
    // Close any previous card immediately; the dwell timer re-opens on the new
    // candidate only if the pointer stays put.
    emitHover(null);
    if (sim.state === 'hover') sim.hover(null);
    hoverDwellTimerRef.current = window.setTimeout(() => {
      hoverDwellTimerRef.current = null;
      const currentSim = simRef.current;
      const candidate = hoverCandidateRef.current;
      hoverCandidateRef.current = null;
      if (!currentSim || !candidate || reduceMotionRef.current) return;
      const current = currentSim.findNode(candidate.id);
      if (!current || currentSim.state === 'coasting' || currentSim.state === 'drag') return;
      onClearFocalRef.current?.();
      currentSim.hover(current);
      emitHover(current);
    }, HOVER_DWELL_MS);
  };

  const hitNode = (wx: number, wy: number): GraphNode | null => {
    const sim = simRef.current;
    if (!sim) return null;
    for (const n of sim.nodes) {
      const pos = nodeVisualPosition(n);
      if (pos && Math.hypot(wx - pos.x, wy - pos.y) <= n.radius) return n;
    }
    return null;
  };

  /**
   * A clean tap either opens the inspector or, when it lands on the node that
   * already owns the sticky focal highlight, dismisses that highlight instead.
   */
  const activateNode = (node: GraphNode) => {
    if (
      shouldClearStickyFocalOnTap(
        node.id,
        selectedIdRef.current,
        stickyFocalRef.current,
      )
    ) {
      onClearFocalRef.current?.();
      return;
    }
    onSelectRef.current(node.id, nodeScreenPoint(node), buildObstacleSnapshot());
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

  const setCanvasCursor = (cursor: 'default' | 'crosshair') => {
    const canvas = canvasRef.current;
    if (canvas && canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    wakeRef.current();
    emitAudioPointer(e.clientX, e.clientY);
    const p = worldPoint(e.clientX, e.clientY);
    if (sim.state === 'drag') {
      setCanvasCursor('crosshair');
      const last = lastDragPointRef.current;
      if (last) {
        const dtS = Math.max(0.004, (e.timeStamp - last.t) / 1000);
        synthRef.current?.onDragVelocity((p.x - last.x) / dtS, (p.y - last.y) / dtS);
      }
      lastDragPointRef.current = { x: p.x, y: p.y, t: e.timeStamp };
      clearHoverDwell();
      emitHover(null);
      sim.dragMove(p.x, p.y);
      return;
    }
    const node = hitNode(p.x, p.y);
    setCanvasCursor(node ? 'crosshair' : 'default');
    beginHoverDwell(node);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim) return;
    wakeRef.current();
    emitAudioPointer(e.clientX, e.clientY);
    clearHoverDwell();
    emitHover(null);
    if (sim.state === 'hover') sim.hover(null);
    const p = worldPoint(e.clientX, e.clientY);
    const node = hitNode(p.x, p.y);
    setCanvasCursor(node ? 'crosshair' : 'default');
    downPosRef.current = { x: p.x, y: p.y };
    downNodeIdRef.current = node?.id ?? null;
    lastDragPointRef.current = { x: p.x, y: p.y, t: e.timeStamp };
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
    const downNodeId = downNodeIdRef.current;
    const releasedNode = hitNode(p.x, p.y);
    if (sim.state === 'drag') {
      sim.dragEnd();
      if (!reduceMotionRef.current && moved < 6 && releasedNode) {
        activateNode(releasedNode);
      }
    } else if (reduceMotionRef.current && moved < 6 && releasedNode) {
      activateNode(releasedNode);
    }
    // A tap that starts and ends on empty canvas clears the sticky highlight.
    // Requiring `downNodeId === null` prevents a finger slipping off a node's
    // edge from being misread as an empty-canvas tap.
    if (moved < 6 && downNodeId === null && !releasedNode) {
      onClearFocalRef.current?.();
    }
    downPosRef.current = null;
    downNodeIdRef.current = null;
    setCanvasCursor(releasedNode ? 'crosshair' : 'default');
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    wakeRef.current();
    clearHoverDwell();
    emitHover(null);
    const sim = simRef.current;
    if (sim?.state === 'drag') {
      sim.dragEnd({ cancel: true });
    }
    synthRef.current?.onDragVelocity(0, 0);
    downPosRef.current = null;
    downNodeIdRef.current = null;
    lastDragPointRef.current = null;
    const canvas = e.currentTarget;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setCanvasCursor('default');
  };

  const onPointerLeave = () => {
    wakeRef.current();
    setCanvasCursor('default');
    clearHoverDwell();
    emitHover(null);
    const sim = simRef.current;
    if (!sim) return;
    downPosRef.current = null;
    downNodeIdRef.current = null;
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
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
}
