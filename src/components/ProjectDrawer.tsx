import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, GitBranch, Link2, X } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';
import { projects } from '../data/projects';
import { formatIndex, formatPlate } from '../utils/drafting';
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

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#$%&*+=';
const SCRAMBLE_INTERVAL_MS = 83;
const SCRAMBLE_TOTAL_MS = 350;

function scrambleTitle(target: string, progress: number): string {
  const revealed = Math.floor(target.length * progress);
  let out = '';
  for (let i = 0; i < target.length; i += 1) {
    const char = target[i];
    if (i < revealed || char === ' ') {
      out += char;
    } else {
      out += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
    }
  }
  return out;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKind | null>(null);
  const [displayTitle, setDisplayTitle] = useState(project.title);

  const catalogIndex = projects.findIndex((p) => p.id === project.id);
  const safeIndex = catalogIndex >= 0 ? catalogIndex : 0;
  const indexLabel = formatIndex(safeIndex);
  const plateLabel = formatPlate(safeIndex);

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

  // Stepped 12fps character decode, bounded to 350ms. Reduced motion renders
  // the final string immediately. All timers are cleared on unmount/project
  // switch (App keys this component by project id).
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayTitle(project.title);
      return;
    }
    const started = performance.now();
    setDisplayTitle(scrambleTitle(project.title, 0));
    const interval = window.setInterval(() => {
      const elapsed = performance.now() - started;
      if (elapsed >= SCRAMBLE_TOTAL_MS) {
        setDisplayTitle(project.title);
        window.clearInterval(interval);
      } else {
        setDisplayTitle(scrambleTitle(project.title, elapsed / SCRAMBLE_TOTAL_MS));
      }
    }, SCRAMBLE_INTERVAL_MS);
    const timeout = window.setTimeout(() => {
      setDisplayTitle(project.title);
      window.clearInterval(interval);
    }, SCRAMBLE_TOTAL_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [project.id, project.title]);

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
    const focusable = el?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input, textarea, select',
    );
    focusable?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const mediaPreviews = project.previews.filter(
    (p): p is Extract<Preview, { kind: 'video' | 'screenshot' }> =>
      p.kind === 'video' || p.kind === 'screenshot',
  );
  const linkPreviews = project.previews.filter((p) => p.kind === 'linkout');

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
        className="absolute inset-x-0 bottom-0 top-24 overflow-y-auto overflow-x-hidden rounded-none border border-[#27272a] bg-[#111215] text-[#f4f4f5] shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:top-0 md:w-[520px] md:border-y-0 md:border-l"
      >
        <header className="sticky top-0 z-20 overflow-hidden border-b border-[#27272a] bg-[#111215]/95 px-5 py-4 backdrop-blur">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-1 top-0 select-none font-sans text-[96px] font-extrabold leading-none tracking-tighter text-[#f4f4f5] opacity-[0.08] md:text-[132px]"
          >
            {indexLabel}
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-[#a1a1aa]">
                {plateLabel} // BUILD // {__COMMIT_HASH__}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-[#a1a1aa]">
                {project.classification}
              </p>

              <div className="mt-3 grid [grid-template-areas:'title']">
                <h2 data-testid="drawer-heading" className="sr-only">
                  {project.title}
                </h2>
                <span
                  aria-hidden="true"
                  className="invisible text-xl font-semibold leading-tight [grid-area:title]"
                >
                  {project.title}
                </span>
                <span
                  aria-hidden="true"
                  data-testid="drawer-title"
                  className="text-xl font-semibold leading-tight [grid-area:title]"
                >
                  {displayTitle}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{project.summary}</p>
            </div>
            <button
              type="button"
              data-testid="drawer-close"
              onClick={onClose}
              aria-label="Close project drawer"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-none border border-[#71717a] p-2 text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="relative z-10 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="bracket-tag text-[#a1a1aa]">
                {tag}
              </span>
            ))}
          </div>

          {tabs.length > 1 && (
            <div
              role="tablist"
              aria-label="Preview tabs"
              className="mt-4 flex gap-1 border-b border-[#27272a]"
            >
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
                      ? 'min-h-11 rounded-none border-b-2 border-[#00f0ff] px-3 py-2 font-mono text-xs uppercase tracking-wider text-[#00f0ff] md:min-h-0'
                      : 'min-h-11 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider text-[#a1a1aa] transition-colors hover:text-[#f4f4f5] md:min-h-0'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            {activeTab === 'terminal' && project.terminalDemo && (
              <TerminalSimulator demo={project.terminalDemo} />
            )}
            {activeTab === 'media' && mediaPreviews.length > 0 && (
              <MediaView previews={mediaPreviews} />
            )}
            {activeTab === 'link' && (
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-none border border-[#71717a] px-3 py-2 font-mono text-xs text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] md:min-h-0"
                  >
                    <GitBranch className="h-4 w-4" aria-hidden="true" /> {project.repo}
                  </a>
                </li>
                {project.liveUrl && (
                  <li>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-none border border-[#71717a] px-3 py-2 font-mono text-xs text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] md:min-h-0"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" /> Launch live app
                    </a>
                  </li>
                )}
                {linkPreviews.map((p, i) => (
                  <li key={i}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-none border border-[#71717a] px-3 py-2 font-mono text-xs text-[#a1a1aa] transition-colors hover:border-[#00f0ff] hover:text-[#00f0ff] md:min-h-0"
                    >
                      <Link2 className="h-4 w-4" aria-hidden="true" /> {p.label}
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
