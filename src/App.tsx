import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProjectById, projects } from './data/projects';
import { deriveEdges } from './utils/graphTopology';
import type { GraphNode, ParadigmTag, ProjectData } from './types/portfolio';
import { GraphCanvas } from './components/GraphCanvas';
import { ListView } from './components/ListView';
import { ControlsOverlay } from './components/ControlsOverlay';
import { ProjectDrawer } from './components/ProjectDrawer';

type ViewMode = 'graph' | 'list';

const ALL_TAGS = Array.from(new Set<ParadigmTag>(projects.flatMap((p) => p.tags)));

export default function App() {
  const [view, setView] = useState<ViewMode>('graph');
  const [activeTags, setActiveTags] = useState<Set<ParadigmTag>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const selected = selectedId ? getProjectById(selectedId) ?? null : null;

  const edges = useMemo(() => deriveEdges(projects), []);
  const graphNodes: GraphNode[] = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.title, radius: 18, x: 0, y: 0 })),
    [],
  );

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

  const openProject = useCallback((id: string) => {
    if (!getProjectById(id)) return;
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      triggerRef.current = document.activeElement;
    }
    setSelectedId(id);
    if (window.location.hash !== `#/p/${id}`) {
      window.location.hash = `#/p/${id}`;
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedId(null);
    // Clear the hash without adding a history entry, so the browser Back
    // button doesn't reopen the drawer the user just dismissed.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const parseHash = () => {
      const match = window.location.hash.match(/^#\/p\/(.+)$/);
      const id = match ? decodeURIComponent(match[1]) : null;
      if (id && getProjectById(id)) {
        setSelectedId(id);
      } else {
        setSelectedId(null);
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fafaf8] text-stone-900">
      <ControlsOverlay
        view={view}
        onViewChange={setView}
        availableTags={ALL_TAGS}
        activeTags={activeTags}
        onToggleTag={toggleTag}
        search={search}
        onSearchChange={setSearch}
        onReset={resetFilters}
      />

      <main className="absolute inset-0">
        {view === 'graph' ? (
          <GraphCanvas
            nodes={graphNodes}
            edges={edges}
            dimmedIds={dimmedIds}
            focusedId={view === 'graph' ? focusedId : null}
            onSelect={openProject}
          />
        ) : (
          <ListView projects={projects} dimmedIds={dimmedIds} onSelect={openProject} />
        )}
      </main>

      <nav
        aria-label="Projects"
        className="sr-only"
        onFocus={(e) => {
          if (view !== 'graph') return;
          const id = (e.target as HTMLElement).dataset.projectId;
          setFocusedId(id ?? null);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedId(null);
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

      {selected && <ProjectDrawer key={selected.id} project={selected} onClose={closeDrawer} />}
    </div>
  );
}