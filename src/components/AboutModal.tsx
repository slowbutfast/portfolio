import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { candidateProfile } from '../data/profile';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTACT_LINKS = [
  { testId: 'about-email', label: 'Email', href: candidateProfile.email, external: false },
  {
    testId: 'about-linkedin',
    label: 'LinkedIn',
    href: candidateProfile.linkedin,
    external: true,
  },
  { testId: 'about-github', label: 'GitHub', href: candidateProfile.github, external: true },
  { testId: 'about-resume', label: 'Resume', href: candidateProfile.resumeUrl, external: true },
];

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowResume(false);
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
          <h2 className="text-2xl font-bold tracking-tight">{candidateProfile.name}</h2>
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

        <div
          data-testid="about-contact-bar"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.testId}
              href={link.href}
              data-testid={link.testId}
              {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              aria-label={
                link.external
                  ? `${link.label}, opens in new tab`
                  : `${link.label} Gregory Lazatin`
              }
              className="fluid-pill hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)]">
          {candidateProfile.bio}
        </p>

        <div className="mt-6 border-t border-[var(--color-divider)] pt-4">
          <button
            type="button"
            data-testid="about-resume-preview-trigger"
            aria-expanded={showResume}
            aria-controls="resume-preview"
            onClick={() => setShowResume((value) => !value)}
            className="fluid-pill min-h-11 md:min-h-0"
          >
            {showResume ? 'Hide resume' : 'Preview resume'}
          </button>

          {showResume && (
            <div
              id="resume-preview"
              className="mt-3 overflow-hidden rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-container)]"
            >
              <iframe
                data-testid="resume-preview-iframe"
                src={candidateProfile.resumeEmbedUrl}
                title="Gregory Lazatin resume preview"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="h-[420px] w-full border-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
