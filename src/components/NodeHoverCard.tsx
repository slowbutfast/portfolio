import { ExternalLink, GitBranch } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Preview, ProjectData } from '../types/portfolio';
import {
  chooseBestPopoverPosition,
  type PopoverObstacles,
} from '../utils/popoverPlacement';

interface NodeHoverCardProps {
  project: ProjectData;
  position: { x: number; y: number };
  /** Canvas center used to project the card outward from the graph cluster. */
  canvasCenter?: { x: number; y: number };
  obstacles?: PopoverObstacles;
  showInspectHint?: boolean;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

type MediaPreview = Extract<Preview, { kind: 'video' | 'screenshot' | 'wip' }>;

/** Fallback measurements until the first ResizeObserver frame. */
const FALLBACK_WIDTH = 320;
const FALLBACK_HEIGHT = 330;
const VIEWPORT_MARGIN = 20;
const NODE_GAP = 36;

export function NodeHoverCard({
  project,
  position,
  canvasCenter,
  obstacles,
  showInspectHint = true,
  onPointerEnter,
  onPointerLeave,
}: NodeHoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT });

  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setSize((previous) =>
        Math.abs(previous.width - rect.width) < 0.5 &&
        Math.abs(previous.height - rect.height) < 0.5
          ? previous
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [project.id]);

  const cardWidth = size.width || FALLBACK_WIDTH;
  const cardHeight = size.height || FALLBACK_HEIGHT;
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const center = canvasCenter ?? { x: viewportWidth / 2, y: viewportHeight / 2 };
  const { left, top } = chooseBestPopoverPosition({
    anchor: position,
    size: { width: cardWidth, height: cardHeight },
    viewport: { width: viewportWidth, height: viewportHeight },
    canvasCenter: center,
    margin: VIEWPORT_MARGIN,
    topMargin: 72,
    gap: NODE_GAP,
    targetNodeId: project.id,
    obstacles,
  });

  const video = project.previews.find(
    (preview): preview is Extract<MediaPreview, { kind: 'video' }> => preview.kind === 'video',
  );
  const screenshot = project.previews.find(
    (preview): preview is Extract<MediaPreview, { kind: 'screenshot' }> =>
      preview.kind === 'screenshot',
  );
  const wipPreview = project.previews.find(
    (preview): preview is Extract<MediaPreview, { kind: 'wip' }> => preview.kind === 'wip',
  );

  return (
    <div
      ref={cardRef}
      data-testid="node-hover-card"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="pointer-events-auto fixed z-30 w-[320px] overflow-hidden rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 p-3.5 text-[var(--color-text)] shadow-2xl backdrop-blur-md"
      style={{ left, top }}
    >
      {video ? (
        <video
          src={video.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={`${project.title} preview`}
          className="h-32 w-full rounded-xl object-cover"
        />
      ) : screenshot ? (
        <img
          src={screenshot.src}
          alt={project.title}
          className="h-32 w-full rounded-xl object-cover"
        />
      ) : wipPreview ? (
        <div className="flex h-32 w-full items-center justify-center rounded-xl border border-[var(--color-divider)] bg-[var(--color-bg)]">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {wipPreview.label}
          </span>
        </div>
      ) : project.terminalDemo ? (
        <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-[var(--color-divider)] bg-[var(--color-bg)] p-3 font-mono text-[11px] text-[var(--color-muted)]">
          <span className="text-[var(--color-accent)]">&gt;_</span>
          <span className="truncate">{project.terminalDemo.prompt || project.title}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3
          data-testid="hover-card-title"
          className="text-sm font-bold leading-tight text-[var(--color-text)]"
        >
          {project.title}
        </h3>
        {showInspectHint && (
          <span className="shrink-0 font-secondary text-[10px] font-light text-[var(--color-accent)]">
            Click to inspect ↗
          </span>
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted)]">
        {project.summary}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--color-outline)] px-2 py-0.5 font-secondary text-[9px] font-light uppercase tracking-[0.12em] text-[var(--color-muted)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {project.repo && (
          <a
            href={project.repo}
            target="_blank"
            rel="noreferrer"
            data-testid="hover-code"
            aria-label={`${project.title} source code, opens in new tab`}
            className="fluid-pill min-h-11 gap-1 md:min-h-0"
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Code <span aria-hidden="true">↗</span>
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="hover-visit"
            aria-label={`${project.title} live demo, opens in new tab`}
            className="fluid-pill min-h-11 gap-1 md:min-h-0"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Visit <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </div>
  );
}
