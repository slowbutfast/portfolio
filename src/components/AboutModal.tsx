import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOCUS_AREAS = [
  'LLM agent tooling',
  'Interactive physics & graphics',
  'Generative AI systems',
  'Audio computing',
];

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => {
      const panel = panelRef.current;
      if (!panel) return [] as HTMLElement[];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null);
    };

    focusables()[0]?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-bg)]/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        data-testid="about-backdrop"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="About Gregory Lazatin"
        data-testid="about-modal"
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)]/95 p-6 text-[var(--color-text)] shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gregory Lazatin</h2>
            <p className="mt-1 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-[var(--color-accent)]">
              Creative Technologist &amp; Software Engineer
            </p>
          </div>
          <button
            type="button"
            data-testid="about-close"
            aria-label="Close about modal"
            onClick={onClose}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-outline)] p-2 text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
          Building systems at the intersection of autonomous agents, generative media,
          interactive physics, and audio computing.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          This portfolio explores organic constructivism—using structural mechanics,
          mathematical vector tension, and pure typography as the primary aesthetic.
        </p>

        <div className="mt-6">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Focus areas
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => (
              <li key={area} className="fluid-pill">
                {area}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--color-divider)] pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Contact
          </span>
          <a
            href="https://github.com/slowbutfast"
            target="_blank"
            rel="noreferrer"
            data-testid="about-github"
            className="fluid-pill hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Open to collaborations
          </span>
        </div>
      </div>
    </div>
  );
}
