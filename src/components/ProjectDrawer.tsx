import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ExternalLink, GitBranch, X } from 'lucide-react';
import type { Preview, ProjectData } from '../types/portfolio';
import { projects } from '../data/projects';
import { formatIndex } from '../utils/drafting';
import {
  chooseBestPopoverPosition,
  type PopoverObstacles,
} from '../utils/popoverPlacement';
import { TerminalSimulator } from './TerminalSimulator';
import { MediaView } from './MediaView';

type TabKind = 'terminal' | 'media';
type SheetDetent = 'peek' | 'half' | 'full';

const SHEET_DETENT_VH: Record<SheetDetent, number> = {
  peek: 28,
  half: 56,
  full: 86,
};
/** Dragging the sheet below this fraction of the viewport dismisses it. */
const SHEET_DISMISS_VH = 16;
/** Minimum visible graph strip before the sheet falls back to Peek. */
const SHEET_MIN_STRIP_PX = 120;
/** Flick velocity (px/ms) that advances a detent without waiting for distance. */
const SHEET_FLICK_VELOCITY = 0.35;

interface DrawerTab {
  kind: TabKind;
  label: string;
}

interface ProjectDrawerProps {
  project: ProjectData;
  anchor?: { x: number; y: number } | null;
  canvasCenter?: { x: number; y: number };
  obstacles?: PopoverObstacles;
  onClose: () => void;
}

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#$%&*+=';
const SCRAMBLE_INTERVAL_MS = 83;
const SCRAMBLE_TOTAL_MS = 350;
/** Exponential tracking rate for the drawer's anchor lerp. */
const DRAWER_TRACK_LAMBDA = 18;
const DRAWER_SNAP_PX = 0.5;
/** Desktop panel border thickness that starts a move drag. */
const DRAWER_EDGE_PX = 8;

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

function computeIsSheet(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 768 ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerHeight < 500)
  );
}

/** Bottom edge of the ControlsOverlay header, in viewport coordinates. */
function measureHeaderBottom(): number {
  const brand = document.querySelector<HTMLElement>('[data-testid="brand-home"]');
  return brand?.closest('header')?.getBoundingClientRect().bottom ?? 0;
}

function defaultSheetDetent(): SheetDetent {
  if (typeof window === 'undefined') return 'half';
  const halfTop = window.innerHeight * (1 - SHEET_DETENT_VH.half / 100);
  return halfTop - measureHeaderBottom() < SHEET_MIN_STRIP_PX ? 'peek' : 'half';
}

export function ProjectDrawer({
  project,
  anchor,
  canvasCenter,
  obstacles,
  onClose,
}: ProjectDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKind | null>(null);
  const [displayTitle, setDisplayTitle] = useState(project.title);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [isSheet, setIsSheet] = useState(computeIsSheet);
  const [sheetDetent, setSheetDetent] = useState<SheetDetent>('half');
  const [liveSheetHeightPx, setLiveSheetHeightPx] = useState<number | null>(null);
  const positionRef = useRef<{ left: number; top: number } | null>(null);
  const targetRef = useRef<{ left: number; top: number } | null>(null);
  const sheetDragRef = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  const pointerRafRef = useRef(0);
  const hasUserDraggedRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const catalogIndex = projects.findIndex((p) => p.id === project.id);
  const safeIndex = catalogIndex >= 0 ? catalogIndex : 0;
  const indexLabel = formatIndex(safeIndex);

  const tabs = useMemo<DrawerTab[]>(() => {
    const list: DrawerTab[] = [];
    // Terminal is a curated inspector for the Resume Builder only.
    if (project.id === 'agentic-resume-builder' && project.terminalDemo) {
      list.push({ kind: 'terminal', label: 'Terminal' });
    }
    if (
      project.previews.some(
        (p) => p.kind === 'video' || p.kind === 'screenshot' || p.kind === 'wip',
      )
    ) {
      list.push({ kind: 'media', label: 'Media' });
    }
    // The legacy Link tab is retired: Code and Visit live in the sticky header
    // and contextual linkouts render inside the Overview section.
    return list;
  }, [project]);

  useEffect(() => {
    if (!activeTab && tabs.length > 0) setActiveTab(tabs[0].kind);
  }, [tabs, activeTab]);

  // The Half detent must leave a usable graph strip. On short viewports (for
  // example 320x568 with a wrapped header) fall back to Peek before first paint.
  useLayoutEffect(() => {
    if (!isSheet) return;
    setSheetDetent(defaultSheetDetent());
    setLiveSheetHeightPx(null);
  }, [isSheet, project.id]);

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
      if (computeIsSheet()) {
        setIsSheet(true);
        targetRef.current = null;
        if (panel.style.cursor !== '') panel.style.cursor = '';
        const halfTop =
          window.innerHeight * (1 - SHEET_DETENT_VH.half / 100);
        if (halfTop - measureHeaderBottom() < SHEET_MIN_STRIP_PX) {
          setSheetDetent((current) => (current === 'half' ? 'peek' : current));
        }
        return;
      }
      setIsSheet(false);
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      if (hasUserDraggedRef.current) {
        const current = positionRef.current;
        if (current) {
          const maxLeft = Math.max(16, viewport.width - panel.offsetWidth - 16);
          const maxTop = Math.max(72, viewport.height - panel.offsetHeight - 16);
          targetRef.current = {
            left: Math.min(Math.max(16, current.left), maxLeft),
            top: Math.min(Math.max(72, current.top), maxTop),
          };
        }
        return;
      }
      const resolvedAnchor = anchor ?? canvasCenter ?? {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };
      targetRef.current = chooseBestPopoverPosition({
        anchor: resolvedAnchor,
        size: { width: panel.offsetWidth, height: panel.offsetHeight },
        viewport,
        canvasCenter: canvasCenter ?? {
          x: viewport.width / 2,
          y: viewport.height / 2,
        },
        margin: 16,
        topMargin: 72,
        gap: 36,
        targetNodeId: project.id,
        obstacles,
      });
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
  }, [anchor, canvasCenter, obstacles, project.id]);

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

  const isOnDragBorder = (
    panel: HTMLDivElement,
    clientX: number,
    clientY: number,
  ): boolean => {
    const rect = panel.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return (
      x <= DRAWER_EDGE_PX ||
      x >= rect.width - DRAWER_EDGE_PX ||
      y <= DRAWER_EDGE_PX ||
      y >= rect.height - DRAWER_EDGE_PX
    );
  };

  const updateBorderCursor = (
    panel: HTMLDivElement,
    clientX: number,
    clientY: number,
  ) => {
    if (isSheet) {
      if (panel.style.cursor !== '') panel.style.cursor = '';
      return;
    }
    const nextCursor = isOnDragBorder(panel, clientX, clientY) ? 'move' : '';
    if (panel.style.cursor !== nextCursor) panel.style.cursor = nextCursor;
  };

  const handlePanelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSheet || event.button !== 0) return;
    const panel = panelRef.current;
    const current = positionRef.current;
    if (
      !panel ||
      !current ||
      !isOnDragBorder(panel, event.clientX, event.clientY)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    hasUserDraggedRef.current = true;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: current.left,
      startTop: current.top,
    };
    panel.style.cursor = 'move';
    panel.setPointerCapture(event.pointerId);
  };

  const handlePanelPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) {
      updateBorderCursor(panel, event.clientX, event.clientY);
      return;
    }
    event.preventDefault();
    const margin = 16;
    const maxLeft = Math.max(margin, window.innerWidth - panel.offsetWidth - margin);
    const maxTop = Math.max(72, window.innerHeight - panel.offsetHeight - 16);
    const left = Math.min(
      Math.max(margin, state.startLeft + event.clientX - state.startX),
      maxLeft,
    );
    const top = Math.min(
      Math.max(72, state.startTop + event.clientY - state.startY),
      maxTop,
    );
    const next = { left: Math.round(left), top: Math.round(top) };
    positionRef.current = next;
    targetRef.current = next;
    setPosition(next);
    panel.style.cursor = 'move';
  };

  const handlePanelPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    const panel = panelRef.current;
    if (!state || !panel || state.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    if (panel.hasPointerCapture(event.pointerId)) {
      panel.releasePointerCapture(event.pointerId);
    }
    updateBorderCursor(panel, event.clientX, event.clientY);
  };

  const handlePanelPointerLeave = () => {
    if (dragStateRef.current) return;
    const panel = panelRef.current;
    if (panel && panel.style.cursor !== '') panel.style.cursor = '';
  };

  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSheet) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    sheetDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: panel.getBoundingClientRect().height,
      lastY: event.clientY,
      lastT: now,
      velocity: 0,
    };
    setLiveSheetHeightPx(panel.getBoundingClientRect().height);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = sheetDragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    event.preventDefault();
    const now = performance.now();
    const dy = event.clientY - state.lastY;
    const dt = Math.max(1, now - state.lastT);
    // Positive velocity means the pointer is moving up (expanding the sheet).
    state.velocity = -dy / dt;
    state.lastY = event.clientY;
    state.lastT = now;
    const nextHeight = Math.max(
      0,
      Math.min(
        window.innerHeight,
        state.startHeight - (event.clientY - state.startY),
      ),
    );
    setLiveSheetHeightPx(nextHeight);
  };

  const handleSheetPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = sheetDragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    sheetDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const height = Math.max(
      0,
      Math.min(
        window.innerHeight,
        state.startHeight - (event.clientY - state.startY),
      ),
    );
    if (height < window.innerHeight * (SHEET_DISMISS_VH / 100)) {
      setLiveSheetHeightPx(null);
      onClose();
      return;
    }
    const detents = Object.entries(SHEET_DETENT_VH) as [SheetDetent, number][];
    let next = detents.reduce((best, entry) =>
      Math.abs(entry[1] - (height / window.innerHeight) * 100) <
      Math.abs(best[1] - (height / window.innerHeight) * 100)
        ? entry
        : best,
    )[0];
    if (Math.abs(state.velocity) >= SHEET_FLICK_VELOCITY) {
      const order: SheetDetent[] = ['peek', 'half', 'full'];
      const index = order.indexOf(next);
      const step = state.velocity > 0 ? 1 : -1;
      next = order[Math.min(order.length - 1, Math.max(0, index + step))];
    }
    setSheetDetent(next);
    setLiveSheetHeightPx(null);
  };

  const mediaPreviews = project.previews.filter(
    (p): p is Extract<Preview, { kind: 'video' | 'screenshot' | 'wip' }> =>
      p.kind === 'video' || p.kind === 'screenshot' || p.kind === 'wip',
  );
  const linkPreviews = project.previews.filter((p) => p.kind === 'linkout');

  const actionLinks = (
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
  );

  const summaryParagraph = (
    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
      {project.summary}
    </p>
  );

  const panelClass = isSheet
    ? `fixed inset-x-0 bottom-0 z-50 flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 text-[var(--color-text)] shadow-2xl backdrop-blur-md ${
        liveSheetHeightPx === null
          ? 'transition-[height] duration-200 ease-out'
          : ''
      }`
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
        data-sheet-detent={isSheet ? sheetDetent : undefined}
        style={
          isSheet
            ? {
                height:
                  liveSheetHeightPx !== null
                    ? `${liveSheetHeightPx}px`
                    : `${SHEET_DETENT_VH[sheetDetent]}dvh`,
              }
            : position
              ? { left: position.left, top: position.top }
              : { left: 0, top: 0, visibility: 'hidden' }
        }
        className={panelClass}
        onPointerDown={handlePanelPointerDown}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={handlePanelPointerUp}
        onPointerCancel={handlePanelPointerUp}
        onPointerLeave={handlePanelPointerLeave}
      >
        <header
          className={
            isSheet
              ? 'sticky top-0 z-10 shrink-0 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/95 px-4 pb-2 pt-0 backdrop-blur-md'
              : 'sticky top-0 z-10 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/95 px-5 py-4 backdrop-blur-md'
          }
        >
          {isSheet && (
            <div
              data-testid="sheet-drag-handle"
              aria-hidden="true"
              className="flex min-h-8 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerUp}
              onPointerCancel={handleSheetPointerUp}
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-outline)]" />
            </div>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {!project.omitIndex && (
                <span className="inline-flex items-center rounded-full border border-[var(--color-outline)] px-2.5 py-0.5 font-secondary text-[10px] font-light uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {indexLabel}
                </span>
              )}

              <div
                className={`grid [grid-template-areas:'title'] ${
                  isSheet ? 'mt-1' : 'mt-2'
                }`}
              >
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

              {!isSheet && summaryParagraph}
              {!isSheet && actionLinks}
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

        <div
          className={
            isSheet
              ? 'flex-1 overflow-y-auto px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'
              : 'px-5 py-4'
          }
        >
          {isSheet && (
            <div className="mb-4">
              {summaryParagraph}
              {actionLinks}
            </div>
          )}
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

          {!project.hideOverview && (
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
          )}
        </div>
      </div>
    </div>
  );
}
