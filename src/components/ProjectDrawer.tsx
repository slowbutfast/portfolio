import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, GitBranch, Link2, X } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';
import { TerminalSimulator } from './TerminalSimulator';
import { MediaView } from './MediaView';

type TabKind = 'terminal' | 'media' | 'link';

interface DrawerTab {
  kind: TabKind;
  label: string;
}

interface ProjectDrawerProps {
  project: ProjectData;
  onClose: () => void;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKind | null>(null);

  const tabs = useMemo<DrawerTab[]>(() => {
    const list: DrawerTab[] = [];
    if (project.terminalDemo) list.push({ kind: 'terminal', label: 'Terminal' });
    if (project.previews.some((p) => p.kind === 'video' || p.kind === 'screenshot')) {
      list.push({ kind: 'media', label: 'Media' });
    }
    if (project.previews.some((p) => p.kind === 'linkout') || project.liveUrl) {
      list.push({ kind: 'link', label: 'Link' });
    }
    return list;
  }, [project]);

  useEffect(() => {
    if (!activeTab && tabs.length > 0) setActiveTab(tabs[0].kind);
  }, [tabs, activeTab]);

  useLayoutEffect(() => {
    const el = panelRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && el) {
        const focusables = Array.from(
          el.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((n) => n.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    const focusable = el?.querySelector<HTMLElement>('button:not([disabled]), a[href], input, textarea, select');
    focusable?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const mediaPreviews = project.previews.filter(
    (p): p is Extract<Preview, { kind: 'video' | 'screenshot' }> => p.kind === 'video' || p.kind === 'screenshot',
  );
  const linkPreviews = project.previews.filter((p) => p.kind === 'linkout');

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        data-testid="drawer-backdrop"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} project details`}
        data-testid="project-drawer"
        className="absolute inset-x-0 bottom-0 top-24 overflow-y-auto rounded-t-2xl border border-stone-800 bg-stone-900 text-stone-100 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:top-0 md:w-[520px] md:rounded-none md:rounded-l-2xl md:border-y-0 md:border-l"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="mt-1 text-sm text-stone-400">{project.summary}</p>
          </div>
          <button
            type="button"
            data-testid="drawer-close"
            onClick={onClose}
            aria-label="Close project drawer"
            className="rounded-full p-2 text-stone-400 transition hover:bg-stone-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone-700 px-2.5 py-0.5 text-xs text-stone-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {tabs.length > 1 && (
            <div role="tablist" aria-label="Preview tabs" className="mt-4 flex gap-1 border-b border-stone-800">
              {tabs.map((tab) => (
                <button
                  key={tab.kind}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.kind}
                  data-testid={`preview-tab-${tab.kind}`}
                  onClick={() => setActiveTab(tab.kind)}
                  className={
                    activeTab === tab.kind
                      ? 'border-b-2 border-emerald-400 px-3 py-2 text-sm font-medium text-emerald-400'
                      : 'border-b-2 border-transparent px-3 py-2 text-sm text-stone-400 transition hover:text-stone-200'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            {activeTab === 'terminal' && project.terminalDemo && <TerminalSimulator demo={project.terminalDemo} />}
            {activeTab === 'media' && mediaPreviews.length > 0 && <MediaView previews={mediaPreviews} />}
            {activeTab === 'link' && (
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-200 transition hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <GitBranch className="h-4 w-4" /> {project.repo}
                  </a>
                </li>
                {project.liveUrl && (
                  <li>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-200 transition hover:border-emerald-500 hover:text-emerald-400"
                    >
                      <ExternalLink className="h-4 w-4" /> Launch live app
                    </a>
                  </li>
                )}
                {linkPreviews.map((p, i) => (
                  <li key={i}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-200 transition hover:border-emerald-500 hover:text-emerald-400"
                    >
                      <Link2 className="h-4 w-4" /> {p.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}