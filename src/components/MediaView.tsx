import type { Preview } from '../types/portfolio';

type MediaPreview = Extract<Preview, { kind: 'video' | 'screenshot' | 'wip' }>;

interface MediaViewProps {
  previews: MediaPreview[];
}

export function MediaView({ previews }: MediaViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {previews.map((preview, i) =>
        preview.kind === 'video' ? (
          <figure key={i}>
            <video
              controls
              preload="metadata"
              aria-label={preview.caption}
              className="max-h-72 w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-bg)]"
              poster={preview.poster}
            >
              <source src={preview.src} type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </figure>
        ) : preview.kind === 'wip' ? (
          <figure
            key={i}
            className="flex aspect-video w-full items-center justify-center rounded-xl border border-[var(--color-outline)] bg-[var(--color-bg)]"
          >
            <span className="font-mono text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">
              {preview.label}
            </span>
          </figure>
        ) : (
          <figure key={i}>
            <img
              src={preview.src}
              alt={preview.caption}
              loading="lazy"
              className="w-full rounded-xl border border-[var(--color-outline)]"
            />
          </figure>
        ),
      )}
    </div>
  );
}
