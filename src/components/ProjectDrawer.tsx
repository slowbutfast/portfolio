import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, GitBranch, X } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';
import { projects } from '../data/projects';
import { formatIndex } from '../utils/drafting';
import { TerminalSimulator } from './TerminalSimulator';
import { MediaView } from './MediaView';

type TabKind = 'terminal' | 'media';

interface DrawerTab {
  kind: TabKind;
  label: string;
}

interface ProjectDrawerProps {
  project: ProjectData;
  anchor?: { x: number; y: number } | null;
  onClose: () => void;
}

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#$%&*+=';
const SCRAMBLE_INTERVAL_MS = 83;
const SCRAMBLE_TOTAL_MS = 350;
/** Exponential tracking rate for the drawer's anchor lerp. */
const DRAWER_TRACK_LAMBDA = 18;
const DRAWER_SNAP_PX = 0.5;

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

export function ProjectDrawer({ project, anchor, onClose }: ProjectDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKind | null>(null);
  const [displayTitle, setDisplayTitle] = useState(project.title);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [isSheet, setIsSheet] = useState(false);
  const positionRef = useRef<{ left: number; top: number } | null>(null);
  const targetRef = useRef<{ left: number; top: number } | null>(null);
  const pointerRafRef = useRef(0);

  const catalogIndex = projects.findIndex((p) => p.id === project.id);
  const safeIndex = catalogIndex >= 0 ? catalogIndex : 0;
  const indexLabel = formatIndex(safeIndex);

  const tabs = useMemo<DrawerTab[]>(() => {
    const list: DrawerTab[] = [];
    // Terminal is a curated inspector for the Resume Builder only.
    if (project.id === 'agentic-resume-builder' && project.terminalDemo) {
      list.push({ kind: 'terminal', label: 'Terminal' });
    }
    if (project.previews.some((p) => p.kind === 'video' || p.kind === 'screenshot')) {
      list.push({ kind: 'media', label: 'Media' });
    }
    // The legacy Link tab is retired: Code and Visit live in the sticky header
    // and contextual linkouts render inside the Overview section.
    return list;
  }, [project]);

  useEffect(() => {
    if (!activeTab && tabs.length > 0) setActiveTab(tabs[0].kind);
  }, [tabs, activeTab]);

  // Stepped 12fps character decode, bounded to 350ms. Reduced motion renders
  // the final string immediately. All timers clear on unmount/project switch.
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

  // Anchor the HUD card beside the clicked node on desktop; on mobile the
  // drawer becomes a bottom sheet and clears the inline coordinates. Desktop
  // positions are tracked with a frame-rate independent exponential lerp and
  // snapped to integer pixels at rest.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let lastTime = performance.now();

    const apply = (next: { left: number; top: number }, snap: boolean) => {
      const value = snap
        ? { left: Math.round(next.left), top: Math.round(next.top) }
        : next;
      positionRef.current = value;
      setPosition(value);
    };

    const computeTarget = () => {
      if (window.innerWidth < 768) {
        setIsSheet(true);
        targetRef.current = null;
        return;
      }
      setIsSheet(false);
      const margin = 16;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const preferredLeft = anchor ? anchor.x + 32 : window.innerWidth / 2 - width / 2;
      const preferredTop = anchor ? anchor.y - 40 : window.innerHeight / 2 - height / 2;
      const maxLeft = Math.max(margin, window.innerWidth - width - margin);
      const maxTop = Math.max(margin, window.innerHeight - height - margin);
      targetRef.current = {
        left: Math.min(Math.max(margin, preferredLeft), maxLeft),
        top: Math.min(Math.max(margin, preferredTop), maxTop),
      };
    };

    const frame = (now: number) => {
      pointerRafRef.current = 0;
      if (disposed) return;
      const target = targetRef.current;
      const current = positionRef.current;
      if (!target) return;
      if (!current) {
        apply(target, true);
        return;
      }
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000)) || 1 / 60;
      lastTime = now;
      const alpha = 1 - Math.exp(-DRAWER_TRACK_LAMBDA * dt);
      const left = current.left + (target.left - current.left) * alpha;
      const top = current.top + (target.top - current.top) * alpha;
      if (Math.hypot(target.left - left, target.top - top) < DRAWER_SNAP_PX) {
        apply(target, true);
        return;
      }
      apply({ left, top }, false);
      schedule();
    };

    const schedule = () => {
      if (disposed || pointerRafRef.current !== 0) return;
      pointerRafRef.current = requestAnimationFrame(frame);
    };

    const place = () => {
      computeTarget();
      if (reduced) {
        if (targetRef.current) apply(targetRef.current, true);
        return;
      }
      schedule();
    };

    computeTarget();
    if (positionRef.current === null && targetRef.current) {
      apply(targetRef.current, true);
    }
    lastTime = performance.now();
    place();
    window.addEventListener('resize', place);
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(panel);
    return () => {
      disposed = true;
      cancelAnimationFrame(pointerRafRef.current);
      pointerRafRef.current = 0;
      window.removeEventListener('resize', place);
      resizeObserver.disconnect();
    };
  }, [anchor]);

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

  const panelClass = isSheet
    ? 'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] w-full flex-col overflow-y-auto rounded-t-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 text-[var(--color-text)] shadow-2xl backdrop-blur-md'
    : 'fixed z-50 flex max-h-[85dvh] w-[min(420px,calc(100vw-2rem))] flex-col overflow-y-auto rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 text-[var(--color-text)] shadow-2xl backdrop-blur-md';

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-transparent"
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
        style={
          isSheet
            ? undefined
            : position
              ? { left: position.left, top: position.top }
              : { left: 0, top: 0, visibility: 'hidden' }
        }
        className={panelClass}
      >
        <header className="sticky top-0 z-10 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/95 px-5 py-4 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full border border-[var(--color-outline)] px-2.5 py-0.5 font-secondary text-[10px] font-light uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {indexLabel}
              </span>

              <div className="mt-2 grid [grid-template-areas:'title']">
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

              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {project.summary}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {project.repo && (
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="drawer-code"
                    aria-label={`${project.title} source code, opens in new tab`}
                    className="fluid-pill min-h-11 gap-1.5 md:min-h-0"
                  >
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    Code <span aria-hidden="true">↗</span>
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="drawer-visit"
                    aria-label={`${project.title} live demo, opens in new tab`}
                    className="fluid-pill min-h-11 gap-1.5 md:min-h-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Visit <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              data-testid="drawer-close"
              onClick={onClose}
              aria-label="Close project drawer"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-outline)] p-2 text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="fluid-pill border-[var(--color-outline)]/40 font-light text-[var(--color-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>

          {tabs.length > 0 && (
            <div
              role="tablist"
              aria-label="Preview tabs"
              data-testid="preview-tabs-track"
              className="mt-4 inline-flex items-center gap-1 rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-container)] p-1"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.kind;
                return (
                  <button
                    key={tab.kind}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-testid={`preview-tab-${tab.kind}`}
                    onClick={() => setActiveTab(tab.kind)}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full px-3.5 py-1.5 text-xs transition-all md:min-h-9 ${
                      isActive
                        ? 'bg-[var(--color-surface)] font-medium text-[var(--color-text)] shadow-sm'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            {activeTab === 'terminal' && project.terminalDemo && (
              <TerminalSimulator demo={project.terminalDemo} />
            )}
            {activeTab === 'media' && mediaPreviews.length > 0 && (
              <MediaView previews={mediaPreviews} />
            )}
          </div>

          <section
            data-testid="drawer-overview"
            aria-labelledby="drawer-overview-heading"
            className="mt-5 border-t border-[var(--color-divider)] pt-4"
          >
            <h3
              id="drawer-overview-heading"
              className="font-secondary text-[10px] font-light uppercase tracking-[0.18em] text-[var(--color-muted)]"
            >
              Overview
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              {project.classification}
            </p>
            {linkPreviews.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {linkPreviews.map((preview, index) => (
                  <li key={`${preview.url}-${index}`}>
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`overview-link-${index}`}
                      className="fluid-pill min-h-11 gap-1.5 md:min-h-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {preview.label} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
