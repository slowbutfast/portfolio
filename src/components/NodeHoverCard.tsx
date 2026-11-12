import { ExternalLink, GitBranch } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';

interface NodeHoverCardProps {
  project: ProjectData;
  position: { x: number; y: number };
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

type MediaPreview = Extract<Preview, { kind: 'video' | 'screenshot' }>;

export function NodeHoverCard({
  project,
  position,
  onPointerEnter,
  onPointerLeave,
}: NodeHoverCardProps) {
  const cardWidth = 320;
  const cardHeight = 330;
  const margin = 20;
  const left = Math.min(
    Math.max(margin, position.x + 28),
    Math.max(margin, window.innerWidth - cardWidth - margin),
  );
  const top = Math.min(
    Math.max(margin, position.y - 40),
    Math.max(margin, window.innerHeight - cardHeight - margin),
  );

  const video = project.previews.find(
    (preview): preview is Extract<MediaPreview, { kind: 'video' }> => preview.kind === 'video',
  );
  const screenshot = project.previews.find(
    (preview): preview is Extract<MediaPreview, { kind: 'screenshot' }> =>
      preview.kind === 'screenshot',
  );

  return (
    <div
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
      ) : (
        <div className="flex h-32 w-full flex-col justify-between rounded-xl border border-[var(--color-divider)] bg-[var(--color-bg)] p-3 font-mono text-[11px] text-[var(--color-muted)]">
          <span className="text-[var(--color-accent)]">&gt;_</span>
          <span className="truncate">{project.terminalDemo?.prompt || project.title}</span>
          <span className="text-[10px] uppercase tracking-[0.18em]">CLI specimen</span>
        </div>
      )}

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3
          data-testid="hover-card-title"
          className="text-sm font-bold leading-tight text-[var(--color-text)]"
        >
          {project.title}
        </h3>
        <span className="shrink-0 font-secondary text-[10px] font-light text-[var(--color-accent)]">
          Click to inspect ↗
        </span>
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
