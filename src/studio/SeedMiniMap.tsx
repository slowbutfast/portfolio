import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { segmentsCross, type GraphEdgeLike } from '../utils/graphPlanarity';

export interface SeedMap {
  [id: string]: { x: number; y: number };
}

interface SeedMiniMapProps {
  seeds: SeedMap;
  edges: readonly GraphEdgeLike[];
  selectedId: string | null;
  onMove: (id: string, x: number, y: number) => void;
}

const SIZE = 100;

function edgeKey(edge: GraphEdgeLike): string {
  return `${edge.source}\u0000${edge.target}`;
}

/** Interactive normalized [0..1] x [0..1] planar embedding preview. */
export function SeedMiniMap({ seeds, edges, selectedId, onMove }: SeedMiniMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showCoordinates, setShowCoordinates] = useState(false);

  const selectedSeed = selectedId ? seeds[selectedId] : undefined;

  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const setCoordinate = (axis: 'x' | 'y', raw: string) => {
    if (!selectedId) return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const seed = seeds[selectedId];
    if (!seed) return;
    const next = { ...seed, [axis]: clamp(value) };
    onMove(selectedId, next.x, next.y);
  };
  const nudge = (axis: 'x' | 'y', delta: number) => {
    if (!selectedId) return;
    const seed = seeds[selectedId];
    if (!seed) return;
    const next = { ...seed, [axis]: clamp(seed[axis] + delta) };
    onMove(selectedId, next.x, next.y);
  };

  const crossingEdges = useMemo(() => {
    const crossing = new Set<string>();
    for (let i = 0; i < edges.length; i += 1) {
      for (let j = i + 1; j < edges.length; j += 1) {
        const left = edges[i];
        const right = edges[j];
        if (
          left.source === right.source ||
          left.source === right.target ||
          left.target === right.source ||
          left.target === right.target
        ) {
          continue;
        }
        const a = seeds[left.source];
        const b = seeds[left.target];
        const c = seeds[right.source];
        const d = seeds[right.target];
        if (!a || !b || !c || !d) continue;
        if (
          segmentsCross(
            [a.x * SIZE, a.y * SIZE],
            [b.x * SIZE, b.y * SIZE],
            [c.x * SIZE, c.y * SIZE],
            [d.x * SIZE, d.y * SIZE],
          )
        ) {
          crossing.add(edgeKey(left));
          crossing.add(edgeKey(right));
        }
      }
    }
    return crossing;
  }, [edges, seeds]);

  const moveFromEvent = (event: ReactPointerEvent<SVGSVGElement>, id: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    onMove(id, x, y);
  };

  const startDrag = (event: ReactPointerEvent<SVGCircleElement>, id: string) => {
    event.preventDefault();
    event.currentTarget.ownerSVGElement?.setPointerCapture?.(event.pointerId);
    setDragging(id);
  };

  return (
    <div className="flex flex-col gap-2">
      <svg
        ref={svgRef}
        data-testid="seed-minimap"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto aspect-square w-full max-w-[360px] touch-none rounded border border-[var(--color-divider)] bg-[var(--color-surface)]"
        onPointerMove={(event) => {
          if (dragging) moveFromEvent(event, dragging);
        }}
        onPointerUp={(event) => {
          if (dragging) event.currentTarget.releasePointerCapture?.(event.pointerId);
          setDragging(null);
        }}
        onPointerLeave={() => setDragging(null)}
      >
        <rect x="0" y="0" width={SIZE} height={SIZE} fill="transparent" />
        {edges.map((edge) => {
          const a = seeds[edge.source];
          const b = seeds[edge.target];
          if (!a || !b) return null;
          const isCrossing = crossingEdges.has(edgeKey(edge));
          return (
            <line
              key={edgeKey(edge)}
              data-crossing={isCrossing ? 'true' : 'false'}
              x1={a.x * SIZE}
              y1={a.y * SIZE}
              x2={b.x * SIZE}
              y2={b.y * SIZE}
              stroke={isCrossing ? '#e5484d' : 'var(--color-muted)'}
              strokeWidth={isCrossing ? 0.8 : 0.4}
              strokeOpacity={isCrossing ? 1 : 0.5}
            />
          );
        })}
        {Object.entries(seeds).map(([id, seed]) => {
          const isSelected = id === selectedId;
          return (
            <g key={id}>
              <circle
                data-testid={`seed-${id}`}
                data-node-id={id}
                cx={seed.x * SIZE}
                cy={seed.y * SIZE}
                r={isSelected ? 3.2 : 2.4}
                fill={isSelected ? 'var(--color-accent)' : 'var(--color-text)'}
                pointerEvents="none"
              />
              <circle
                data-testid={`seed-hit-${id}`}
                cx={seed.x * SIZE}
                cy={seed.y * SIZE}
                r={7}
                fill="transparent"
                pointerEvents="all"
                className="cursor-grab touch-none"
                onPointerDown={(event) => startDrag(event, id)}
              />
              <text
                x={seed.x * SIZE}
                y={seed.y * SIZE - 4}
                textAnchor="middle"
                fontSize="3"
                fill="var(--color-muted)"
                pointerEvents="none"
              >
                {id}
              </text>
            </g>
          );
        })}
      </svg>

      {selectedId && selectedSeed && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-testid="seed-coordinate-toggle"
            aria-expanded={showCoordinates}
            className="min-h-11 rounded border border-[var(--color-divider)] px-2 py-1 font-mono text-xs sm:min-h-0"
            onClick={() => setShowCoordinates((visible) => !visible)}
          >
            {showCoordinates ? 'Hide coordinates' : 'Edit coordinates'}
          </button>

          {showCoordinates && (
            <div
              data-testid="seed-coordinates"
              className="grid grid-cols-2 gap-2 rounded border border-[var(--color-divider)] p-2"
            >
              <label className="flex flex-col gap-1 font-mono text-[10px] uppercase text-[var(--color-muted)]">
                x
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="1"
                  step="0.01"
                  data-testid="seed-x"
                  value={Number(selectedSeed.x.toFixed(3))}
                  onChange={(event) => setCoordinate('x', event.target.value)}
                  className="min-h-11 w-full rounded border border-[var(--color-divider)] bg-transparent px-2 py-1 font-mono text-base text-[var(--color-text)] sm:min-h-0 sm:text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 font-mono text-[10px] uppercase text-[var(--color-muted)]">
                y
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="1"
                  step="0.01"
                  data-testid="seed-y"
                  value={Number(selectedSeed.y.toFixed(3))}
                  onChange={(event) => setCoordinate('y', event.target.value)}
                  className="min-h-11 w-full rounded border border-[var(--color-divider)] bg-transparent px-2 py-1 font-mono text-base text-[var(--color-text)] sm:min-h-0 sm:text-sm"
                />
              </label>
              <div className="col-span-2 grid grid-cols-4 gap-1">
                <button
                  type="button"
                  data-testid="seed-nudge-x-down"
                  aria-label="Decrease x by 0.02"
                  className="min-h-11 rounded border border-[var(--color-divider)] font-mono text-xs sm:min-h-0"
                  onClick={() => nudge('x', -0.02)}
                >
                  x −
                </button>
                <button
                  type="button"
                  data-testid="seed-nudge-x-up"
                  aria-label="Increase x by 0.02"
                  className="min-h-11 rounded border border-[var(--color-divider)] font-mono text-xs sm:min-h-0"
                  onClick={() => nudge('x', 0.02)}
                >
                  x +
                </button>
                <button
                  type="button"
                  data-testid="seed-nudge-y-down"
                  aria-label="Decrease y by 0.02"
                  className="min-h-11 rounded border border-[var(--color-divider)] font-mono text-xs sm:min-h-0"
                  onClick={() => nudge('y', -0.02)}
                >
                  y −
                </button>
                <button
                  type="button"
                  data-testid="seed-nudge-y-up"
                  aria-label="Increase y by 0.02"
                  className="min-h-11 rounded border border-[var(--color-divider)] font-mono text-xs sm:min-h-0"
                  onClick={() => nudge('y', 0.02)}
                >
                  y +
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="font-mono text-xs text-[var(--color-muted)]">
        {crossingEdges.size === 0
          ? 'Planar: 0 crossings'
          : `Crossing edges highlighted: ${crossingEdges.size / 2} pair(s)`}
      </p>
    </div>
  );
}
