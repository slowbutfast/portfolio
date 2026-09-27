import { List, Network, RotateCcw, Search } from 'lucide-react';
import type { ParadigmTag } from '../types/portfolio';

type ViewMode = 'graph' | 'list';

interface ControlsOverlayProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableTags: ParadigmTag[];
  activeTags: Set<ParadigmTag>;
  onToggleTag: (tag: ParadigmTag) => void;
  search: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

export function ControlsOverlay({
  view,
  onViewChange,
  availableTags,
  activeTags,
  onToggleTag,
  search,
  onSearchChange,
  onReset,
}: ControlsOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 md:p-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/85 p-2 shadow-sm backdrop-blur md:gap-3">
        <div className="flex items-center gap-2 px-1">
          <span className="h-3 w-3 rounded-full bg-stone-900" aria-hidden="true" />
          <h1 className="text-sm font-semibold tracking-tight text-stone-900">Node Portfolio Graph</h1>
        </div>

        <div
          className="ml-auto flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            data-testid="view-toggle-graph"
            aria-pressed={view === 'graph'}
            onClick={() => onViewChange('graph')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition ${
              view === 'graph'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Network className="h-4 w-4" /> Graph
          </button>
          <button
            type="button"
            data-testid="view-toggle-list"
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition ${
              view === 'list'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/85 p-2 shadow-sm backdrop-blur">
        {availableTags.map((tag) => {
          const active = activeTags.has(tag);
          return (
            <button
              key={tag}
              type="button"
              data-testid={`tag-pill-${tag}`}
              aria-pressed={active}
              onClick={() => onToggleTag(tag)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                active
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900'
              }`}
            >
              {tag}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-stone-400" />
            <input
              type="search"
              data-testid="search-input"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects…"
              aria-label="Search projects"
              className="w-44 rounded-lg border border-stone-300 bg-white py-1.5 pl-8 pr-3 text-sm text-stone-800 outline-none transition focus:border-stone-500"
            />
          </label>
          <button
            type="button"
            data-testid="reset-filters"
            onClick={onReset}
            aria-label="Reset filters"
            title="Reset filters"
            className="rounded-lg border border-stone-300 p-1.5 text-stone-500 transition hover:border-stone-500 hover:text-stone-800"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}