import { MonitorPlay, Terminal, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { ProjectData } from '../types/portfolio';

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
    <div className="h-full overflow-y-auto px-4 pb-8 pt-48 md:px-8 md:pt-36">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const dimmed = dimmedIds.has(project.id);
          return (
            <button
              key={project.id}
              type="button"
              data-testid={`card-${project.id}`}
              data-dimmed={dimmed ? 'true' : 'false'}
              onClick={() => onSelect(project.id)}
              className={`group flex flex-col rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md ${
                dimmed ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-stone-900">{project.title}</h2>
                <span className="flex items-center gap-1.5 text-stone-400">{previewIcons(project)}</span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{project.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-stone-300 px-2 py-0.5 text-[11px] text-stone-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}