import { MonitorPlay, Terminal, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { ProjectData } from '../types/portfolio';
import { formatIndex, formatPlate } from '../utils/drafting';

interface ListViewProps {
  projects: ProjectData[];
  dimmedIds: Set<string>;
  onSelect: (id: string) => void;
}

function previewIcons(project: ProjectData) {
  const icons = [];
  if (project.terminalDemo) icons.push(<Terminal key="term" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'video'))
    icons.push(<MonitorPlay key="video" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'screenshot'))
    icons.push(<ImageIcon key="shot" className="h-3.5 w-3.5" aria-hidden="true" />);
  if (project.previews.some((p) => p.kind === 'linkout') || project.liveUrl)
    icons.push(<ExternalLink key="link" className="h-3.5 w-3.5" aria-hidden="true" />);
  return icons;
}

export function ListView({ projects, dimmedIds, onSelect }: ListViewProps) {
  return (
    <div className="h-full overflow-y-auto px-4 pb-8 pt-60 md:px-8 md:pt-44">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
          <span>PROJECT INDEX // 06 ENTRIES</span>
          <span>ASYMMETRIC PUBLICATION</span>
        </div>

        <div className="grid gap-px border border-[#27272a] bg-[#27272a] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {projects.map((project, i) => {
            const dimmed = dimmedIds.has(project.id);
            const index = formatIndex(i);
            const plate = formatPlate(i);
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
                className={`group relative flex min-h-11 flex-col rounded-none bg-[#0a0a0c] p-6 text-left transition-colors hover:bg-[#111215] md:p-8 ${
                  wide ? 'md:col-span-2' : ''
                } ${dimmed ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="select-none font-sans text-[64px] font-extrabold leading-none tracking-tighter text-[#27272a] transition-colors group-hover:text-[#3f3f46] md:text-[96px]"
                  >
                    {index}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#a1a1aa]">
                    {previewIcons(project)}
                  </span>
                </div>

                <p className="mt-4 font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-[#a1a1aa]">
                  {plate} // {project.classification}
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight text-[#f4f4f5]">
                  {project.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#a1a1aa]">
                  {project.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#27272a] pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
                    {plate}
                  </span>
                  {project.tags.map((tag) => (
                    <span key={tag} className="bracket-tag text-[#a1a1aa]">
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
