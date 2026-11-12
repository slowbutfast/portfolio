import { LayoutGrid, MoreHorizontal, RotateCcw, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { candidateProfile } from '../data/profile';
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
  onResetLayout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAbout: () => void;
}

const safe = (side: 'top' | 'right' | 'bottom' | 'left', offset: string) =>
  `calc(env(safe-area-inset-${side}) + ${offset})`;

const bareTextBase =
  'inline-flex min-h-11 items-center transition-colors hover:text-[var(--color-text)] md:min-h-0';
const bareText = `${bareTextBase} text-[var(--color-muted)]`;

export function ControlsOverlay({
  view,
  onViewChange,
  availableTags,
  activeTags,
  onToggleTag,
  search,
  onSearchChange,
  onReset,
  onResetLayout,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenAbout,
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
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-40">
      {/* Progressive scrim keeps header text legible when Grid cards scroll under it. */}
      <div
        aria-hidden="true"
        data-testid="top-scrim"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent md:h-28"
      />
      <header
        className="pointer-events-auto absolute inset-x-0 top-0 flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{
          paddingTop: safe('top', '1rem'),
          paddingLeft: safe('left', '1rem'),
          paddingRight: safe('right', '1rem'),
        }}
      >
        <button
          type="button"
          data-testid="brand-home"
          onClick={() => {
            onReset();
            onViewChange('graph');
          }}
          className="text-base font-bold tracking-tight text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)] md:text-lg"
        >
          {candidateProfile.name}
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-secondary text-xs font-light md:gap-x-6">
          <button type="button" data-testid="nav-about" onClick={onOpenAbout} className={bareText}>
            About
          </button>
          <a
            href={candidateProfile.github}
            target="_blank"
            rel="noreferrer"
            data-testid="nav-github"
            className={`${bareText} gap-1`}
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            data-testid="view-toggle"
            aria-label={view === 'graph' ? 'Switch to list view' : 'Switch to graph view'}
            onClick={() => onViewChange(view === 'graph' ? 'list' : 'graph')}
            className={bareText}
          >
            {view === 'graph' ? 'Grid' : 'Graph'}
          </button>
          <button
            type="button"
            data-testid="audio-toggle"
            aria-pressed={soundEnabled}
            onClick={onToggleSound}
            className={`${bareTextBase} ${
              soundEnabled
                ? 'text-[var(--color-accent)] underline underline-offset-4'
                : 'text-[var(--color-muted)]'
            }`}
          >
            Sound
          </button>
          <button
            type="button"
            data-testid="theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
            onClick={onToggleTheme}
            className={bareText}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          <div className="relative">
            <button
              type="button"
              data-testid="controls-dropdown-trigger"
              aria-label="Filters & Layout"
              aria-expanded={open}
              aria-controls="portfolio-controls"
              onClick={() => setOpen((value) => !value)}
              className={`${bareText} min-w-11 justify-center md:min-w-0`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>

            {open && (
              <div
                id="portfolio-controls"
                data-testid="controls-dropdown"
                className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 p-4 text-[var(--color-text)] shadow-2xl backdrop-blur-md"
              >
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  Filters
                </h2>
                <label className="relative flex items-center">
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
                    className="min-h-11 w-full rounded-full border border-[var(--color-outline)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] md:min-h-9"
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

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--color-divider)] pt-3">
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
                  <button
                    type="button"
                    data-testid="reset-layout"
                    onClick={onResetLayout}
                    aria-label="Reset layout"
                    className="fluid-pill min-h-11 md:min-h-0"
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    Reset layout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
