import { RotateCcw, Search } from 'lucide-react';
import type { RefObject } from 'react';
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
  coordTickerRef: RefObject<HTMLSpanElement | null>;
}

const safe = (side: 'top' | 'right' | 'bottom' | 'left', offset: string) =>
  `calc(env(safe-area-inset-${side}) + ${offset})`;

export function ControlsOverlay({
  view,
  onViewChange,
  availableTags,
  activeTags,
  onToggleTag,
  search,
  onSearchChange,
  onReset,
  coordTickerRef,
}: ControlsOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Peripheral margin HUD: identity, view toggle, tag matrix, search. */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col gap-2"
        style={{
          paddingTop: safe('top', '0.75rem'),
          paddingLeft: safe('left', '0.75rem'),
          paddingRight: safe('right', '0.75rem'),
        }}
      >
        <div className="pointer-events-auto flex flex-wrap items-start gap-2 md:gap-3">
          <div className="flex min-h-11 items-center px-1 md:min-h-0">
            <h1 className="text-base font-bold leading-none tracking-tight text-[#f4f4f5] md:text-[28px]">
              SYS.PORTFOLIO
            </h1>
          </div>

          <div
            className="ml-auto flex items-center gap-1 rounded-none"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              data-testid="view-toggle-graph"
              aria-label="Graph"
              aria-pressed={view === 'graph'}
              onClick={() => onViewChange('graph')}
              className={`flex min-h-11 items-center gap-1.5 rounded-none px-1 py-1 text-sm transition-colors md:min-h-0 ${
                view === 'graph'
                  ? 'bg-[#18191e] text-[#f4f4f5]'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
              }`}
            >
              <span className={`bracket-tag ${view === 'graph' ? 'bracket-tag-active' : ''}`}>
                Graph
              </span>
            </button>
            <button
              type="button"
              data-testid="view-toggle-list"
              aria-label="List"
              aria-pressed={view === 'list'}
              onClick={() => onViewChange('list')}
              className={`flex min-h-11 items-center gap-1.5 rounded-none px-1 py-1 text-sm transition-colors md:min-h-0 ${
                view === 'list'
                  ? 'bg-[#18191e] text-[#f4f4f5]'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
              }`}
            >
              <span className={`bracket-tag ${view === 'list' ? 'bracket-tag-active' : ''}`}>
                List
              </span>
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 rounded-none border border-[#27272a] bg-[#111215]/90 p-2 backdrop-blur md:flex-row md:flex-wrap md:items-center">
          <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible">
            {availableTags.map((tag) => {
              const active = activeTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  data-testid={`tag-pill-${tag}`}
                  aria-label={tag}
                  aria-pressed={active}
                  onClick={() => onToggleTag(tag)}
                  className={`flex min-h-11 shrink-0 items-center rounded-none p-0 md:min-h-0 ${
                    active ? 'text-[#00f0ff]' : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                  }`}
                >
                  <span className={`bracket-tag ${active ? 'bracket-tag-active' : ''}`}>{tag}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <label className="relative flex flex-1 items-center md:flex-none">
              <Search
                className="pointer-events-none absolute left-2.5 h-4 w-4 text-[#71717a]"
                aria-hidden="true"
              />
              <input
                type="search"
                data-testid="search-input"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search projects…"
                aria-label="Search projects"
                className="min-h-11 w-full rounded-none border border-[#71717a] bg-[#0a0a0c] py-1.5 pl-8 pr-3 font-mono text-xs text-[#f4f4f5] outline-none transition-colors placeholder:text-[#71717a] focus:border-[#00f0ff] focus-visible:outline-[#00f0ff] md:min-h-9 md:w-44"
              />
            </label>
            <button
              type="button"
              data-testid="reset-filters"
              onClick={onReset}
              aria-label="Reset filters"
              title="Reset filters"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-none border border-[#71717a] p-1.5 text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] md:min-h-9 md:min-w-9"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Margin coordinate ticker: mutated imperatively by GraphCanvas' rAF. */}
      <div
        className="pointer-events-none absolute flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]"
        style={{ left: safe('left', '1rem'), bottom: safe('bottom', '2rem') }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#71717a]" aria-hidden="true" />
        <span ref={coordTickerRef} data-testid="coord-ticker" aria-hidden="true">
          X: --- Y: ---
        </span>
      </div>
    </div>
  );
}
