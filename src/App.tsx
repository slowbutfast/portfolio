import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getProjectById, projects } from './data/projects';
import { deriveEdges } from './utils/graphTopology';
import type {
  GraphNode,
  HoverState,
  ParadigmTag,
  ProjectData,
  ThemeMode,
} from './types/portfolio';
import { GraphCanvas } from './components/GraphCanvas';
import { ListView } from './components/ListView';
import { ControlsOverlay } from './components/ControlsOverlay';
import { ProjectDrawer } from './components/ProjectDrawer';
import { AboutModal } from './components/AboutModal';
import { NodeHoverCard } from './components/NodeHoverCard';
import { getAmbientSynth } from './audio/ambientSynth';

type ViewMode = 'graph' | 'list';
type CanvasAnchor = { x: number; y: number };

const ALL_TAGS = Array.from(new Set<ParadigmTag>(projects.flatMap((p) => p.tags)));

function readStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem('portfolio_theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readStoredVisited(): Set<string> {
  try {
    const raw = localStorage.getItem('portfolio_visited');
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [view, setView] = useState<ViewMode>('graph');
  const [activeTags, setActiveTags] = useState<Set<ParadigmTag>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(readStoredVisited);
  const [drawerAnchor, setDrawerAnchor] = useState<CanvasAnchor | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [hoverState, setHoverState] = useState<HoverState>(null);
  const synth = useMemo(() => getAmbientSynth(), []);
  const [soundEnabled, setSoundEnabled] = useState(() => synth.isEnabled());
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const triggerRef = useRef<HTMLElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const hoverDismissRef = useRef<number | null>(null);

  const selected = selectedId ? getProjectById(selectedId) ?? null : null;

  const edges = useMemo(() => deriveEdges(projects), []);
  const graphNodes: GraphNode[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: project.shortTitle,
        radius: 22,
        x: 0,
        y: 0,
      })),
    [],
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('portfolio_theme', theme);
    } catch {
      // Private browsing / storage denial: the in-memory theme still applies.
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('portfolio_visited', JSON.stringify([...visitedIds]));
    } catch {
      // Non-fatal: visited styling still works for this session.
    }
  }, [visitedIds]);

  const matchesFilters = useCallback(
    (project: ProjectData): boolean => {
      const tagOk = activeTags.size === 0 || project.tags.some((t) => activeTags.has(t));
      const query = search.trim().toLowerCase();
      const searchOk =
        query === '' ||
        project.title.toLowerCase().includes(query) ||
        project.summary.toLowerCase().includes(query) ||
        project.tags.some((t) => t.toLowerCase().includes(query));
      return tagOk && searchOk;
    },
    [activeTags, search],
  );

  const dimmedIds = useMemo(() => {
    const dimmed = new Set<string>();
    for (const project of projects) {
      if (!matchesFilters(project)) dimmed.add(project.id);
    }
    return dimmed;
  }, [matchesFilters]);

  const clearHoverDismissal = useCallback(() => {
    if (hoverDismissRef.current !== null) {
      window.clearTimeout(hoverDismissRef.current);
      hoverDismissRef.current = null;
    }
  }, []);

  const scheduleHoverDismiss = useCallback(() => {
    clearHoverDismissal();
    hoverDismissRef.current = window.setTimeout(() => {
      hoverDismissRef.current = null;
      setHoverState(null);
    }, 150);
  }, [clearHoverDismissal]);

  const dismissHover = useCallback(() => {
    clearHoverDismissal();
    setHoverState(null);
  }, [clearHoverDismissal]);

  useEffect(() => clearHoverDismissal, [clearHoverDismissal]);

  const openAbout = useCallback(() => {
    setIsAboutOpen(true);
    clearHoverDismissal();
    setHoverState(null);
    if (window.location.hash !== '#/about') {
      window.location.hash = '#/about';
    }
  }, [clearHoverDismissal]);

  const closeAbout = useCallback(() => {
    setIsAboutOpen(false);
    if (window.location.hash === '#/about') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleHoverNode = useCallback(
    (project: ProjectData | null, position: CanvasAnchor | null) => {
      if (project && position) {
        clearHoverDismissal();
        setHoverState({ project, position });
        return;
      }
      // A 150ms grace period lets the pointer travel from a node into the
      // interactive hover card before the card is dismissed.
      scheduleHoverDismiss();
    },
    [clearHoverDismissal, scheduleHoverDismiss],
  );

  const handleResolveAnchor = useCallback((id: string, anchor: CanvasAnchor) => {
    if (selectedIdRef.current === id) setDrawerAnchor(anchor);
  }, []);

  const openProject = useCallback(
    (id: string, anchor?: CanvasAnchor) => {
      if (!getProjectById(id)) return;
      setIsAboutOpen(false);
      dismissHover();
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        triggerRef.current = document.activeElement;
      }
      setVisitedIds((previous) => {
        if (previous.has(id)) return previous;
        const next = new Set(previous);
        next.add(id);
        return next;
      });
      selectedIdRef.current = id;
      setSelectedId(id);
      setDrawerAnchor(anchor ?? null);
      if (window.location.hash !== `#/p/${id}`) {
        window.location.hash = `#/p/${id}`;
      }
    },
    [dismissHover],
  );

  const closeDrawer = useCallback(() => {
    selectedIdRef.current = null;
    setSelectedId(null);
    setDrawerAnchor(null);
    // Clear the hash without adding a history entry, so the browser Back
    // button doesn't reopen the drawer the user just dismissed.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const parseHash = () => {
      if (window.location.hash === '#/about') {
        setIsAboutOpen(true);
        setHoverState(null);
        selectedIdRef.current = null;
        setSelectedId(null);
        setDrawerAnchor(null);
        return;
      }
      setIsAboutOpen(false);
      const match = window.location.hash.match(/^#\/p\/(.+)$/);
      const id = match ? decodeURIComponent(match[1]) : null;
      if (id && getProjectById(id)) {
        if (selectedIdRef.current !== id) setDrawerAnchor(null);
        selectedIdRef.current = id;
        setSelectedId(id);
      } else {
        selectedIdRef.current = null;
        setSelectedId(null);
        setDrawerAnchor(null);
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const toggleTag = useCallback((tag: ParadigmTag) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveTags(new Set());
    setSearch('');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  // A stored `true` preference arms the engine; the first gesture then resumes
  // the AudioContext without surprising the visitor with autoplay.
  useEffect(() => {
    if (soundEnabled) synth.armIfNeeded();
  }, [soundEnabled, synth]);

  const toggleSound = useCallback(() => {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    synth.setSoundEnabled(next);
    setSoundEnabled(next);
  }, [synth]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <h1 className="sr-only">Portfolio</h1>

      <ControlsOverlay
        view={view}
        onViewChange={setView}
        availableTags={ALL_TAGS}
        activeTags={activeTags}
        onToggleTag={toggleTag}
        search={search}
        onSearchChange={setSearch}
        onReset={resetFilters}
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenAbout={openAbout}
      />

      <main className="absolute inset-0">
        {view === 'graph' ? (
          <GraphCanvas
            nodes={graphNodes}
            edges={edges}
            dimmedIds={dimmedIds}
            focusedId={view === 'graph' ? focusedId : null}
            visitedIds={visitedIds}
            initialSelectedId={selectedId}
            synth={synth}
            onHoverNode={handleHoverNode}
            onCanvasDragStart={dismissHover}
            onResolveAnchor={handleResolveAnchor}
            onSelect={openProject}
          />
        ) : (
          <ListView
            projects={projects}
            dimmedIds={dimmedIds}
            onSelect={(id) => openProject(id)}
          />
        )}
      </main>

      <nav
        aria-label="Projects"
        className="sr-only"
        onFocus={(event) => {
          if (view !== 'graph') return;
          const id = (event.target as HTMLElement).dataset.projectId;
          setFocusedId(id ?? null);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusedId(null);
          }
        }}
      >
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            data-project-id={project.id}
            data-testid={`nav-${project.id}`}
            data-dimmed={dimmedIds.has(project.id) ? 'true' : 'false'}
            onClick={() => openProject(project.id)}
          >
            {project.title}
          </button>
        ))}
      </nav>

      {hoverState && !selectedId && !isAboutOpen && (
        <NodeHoverCard
          project={hoverState.project}
          position={hoverState.position}
          onPointerEnter={clearHoverDismissal}
          onPointerLeave={scheduleHoverDismiss}
        />
      )}

      <AboutModal isOpen={isAboutOpen} onClose={closeAbout} />

      {selected && (
        <ProjectDrawer
          key={selected.id}
          project={selected}
          anchor={drawerAnchor}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
