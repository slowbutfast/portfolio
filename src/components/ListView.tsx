import { MonitorPlay, Terminal, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';
import { formatIndex } from '../utils/drafting';

interface ListViewProps {
  projects: ProjectData[];
  dimmedIds: Set<string>;
  onSelect: (id: string) => void;
}

function previewIcons(project: ProjectData) {
  const icons = [];
  if (project.terminalDemo)
    icons.push(<Terminal key="term" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'video'))
    icons.push(<MonitorPlay key="video" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'screenshot'))
    icons.push(<ImageIcon key="shot" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'linkout') || project.liveUrl)
    icons.push(<ExternalLink key="link" className="h-3.5 w-3.5" aria-hidden="true" />);
  return icons;
}

function CardPreview({ project }: { project: ProjectData }) {
  const video = project.previews.find(
    (preview): preview is Extract<Preview, { kind: 'video' }> => preview.kind === 'video',
  );
  const screenshot = project.previews.find(
    (preview): preview is Extract<Preview, { kind: 'screenshot' }> =>
      preview.kind === 'screenshot',
  );
  const wipPreview = project.previews.find(
    (preview): preview is Extract<Preview, { kind: 'wip' }> => preview.kind === 'wip',
  );

  if (video) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-[var(--color-surface-container)]">
        <video
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${project.title} preview`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (screenshot) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-[var(--color-surface-container)]">
        <img
          src={screenshot.src}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (wipPreview || (!project.terminalDemo && project.previews.length === 0)) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-[var(--color-outline)] bg-[var(--color-bg)]">
        <span className="font-mono text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">
          {wipPreview?.label ?? project.summary}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid={`terminal-specimen-${project.id}`}
      className="flex aspect-video w-full flex-col justify-between rounded-xl border border-[#27272a] bg-[#08080a] p-4 text-[#7dd3fc]"
    >
      <div className="flex items-center font-secondary text-[10px] font-light uppercase tracking-[0.18em] text-[#a1a1aa]">
        <span>&gt;_ prompt</span>
      </div>
      <span className="truncate font-mono text-xs">
        {project.terminalDemo?.prompt ?? `${project.id} --help`}
      </span>
    </div>
  );
}

export function ListView({ projects, dimmedIds, onSelect }: ListViewProps) {
  return (
    <div className="h-full overflow-y-auto px-4 pb-8 pt-24 md:px-8 md:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--color-divider)] bg-[var(--color-divider)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {projects.map((project, i) => {
            const dimmed = dimmedIds.has(project.id);
            const index = formatIndex(i);
            // Every third entry stretches across both columns to create the
            // asymmetric Swiss rhythm while keeping a strict two-column grid.
            const wide = i % 3 === 0;
            return (
              <button
                key={project.id}
                type="button"
                data-testid={`card-${project.id}`}
                data-dimmed={dimmed ? 'true' : 'false'}
                onClick={() => onSelect(project.id)}
                className={`group relative flex min-h-11 flex-col bg-[var(--color-bg)] p-6 text-left transition-colors hover:bg-[var(--color-surface)] md:p-8 ${
                  wide ? 'md:col-span-2' : ''
                } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {!project.omitIndex && (
                      <span className="select-none font-mono text-lg text-[var(--color-muted)]">
                        {index}
                      </span>
                    )}
                    <h2 className="truncate text-xl font-semibold leading-tight text-[var(--color-text)]">
                      {project.title}
                    </h2>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-[var(--color-muted)]">
                    {previewIcons(project)}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                  {project.summary}
                </p>

                <div className="mt-4">
                  <CardPreview project={project} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--color-divider)] pt-3">
                  {project.tags.map((tag) => (
                    <span key={tag} className="fluid-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
