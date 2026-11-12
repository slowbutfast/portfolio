import { ChevronDown, Moon, RotateCcw, Search, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ParadigmTag, ThemeMode } from '../types/portfolio';

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
  theme: ThemeMode;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
}: ControlsOverlayProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handlePointer);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handlePointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-30">
      <div
        className="pointer-events-auto absolute"
        style={{ top: safe('top', '1rem'), right: safe('right', '1rem') }}
      >
        <button
          type="button"
          data-testid="controls-dropdown-trigger"
          aria-label="Filters & Navigation"
          aria-expanded={open}
          aria-controls="portfolio-controls"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-outline)] bg-[var(--color-surface)]/90 px-4 py-2 text-sm font-medium text-[var(--color-text)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <span>Filters</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            id="portfolio-controls"
            data-testid="controls-dropdown"
            className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 p-4 text-[var(--color-text)] shadow-2xl backdrop-blur-md"
          >
            <div
              role="group"
              aria-label="View mode"
              className="flex items-center gap-2"
            >
              <button
                type="button"
                data-testid="view-toggle-graph"
                aria-label="Graph"
                aria-pressed={view === 'graph'}
                onClick={() => {
                  onViewChange('graph');
                  setOpen(false);
                }}
                className={`fluid-pill min-h-11 justify-center md:min-h-0 ${
                  view === 'graph' ? 'fluid-pill-active' : ''
                }`}
              >
                Graph
              </button>
              <button
                type="button"
                data-testid="view-toggle-list"
                aria-label="List"
                aria-pressed={view === 'list'}
                onClick={() => {
                  onViewChange('list');
                  setOpen(false);
                }}
                className={`fluid-pill min-h-11 justify-center md:min-h-0 ${
                  view === 'list' ? 'fluid-pill-active' : ''
                }`}
              >
                List
              </button>
            </div>

            <label className="relative mt-4 flex items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                data-testid="search-input"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search projects…"
                aria-label="Search projects"
                className="min-h-11 w-full rounded-full border border-[var(--color-outline)] bg-[var(--color-bg)] py-2 pl-9 pr-3 font-mono text-xs text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] md:min-h-9"
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
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
                    className={`fluid-pill min-h-11 md:min-h-0 ${
                      active ? 'fluid-pill-active' : ''
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--color-divider)] pt-3">
              <button
                type="button"
                data-testid="theme-toggle"
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-pressed={theme === 'light'}
                onClick={onToggleTheme}
                className="fluid-pill min-h-11 md:min-h-0"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <button
                type="button"
                data-testid="reset-filters"
                onClick={onReset}
                aria-label="Reset filters"
                className="fluid-pill min-h-11 md:min-h-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
