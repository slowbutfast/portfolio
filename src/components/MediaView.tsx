import type { Preview } from '../types/portfolio';

type MediaPreview = Extract<Preview, { kind: 'video' | 'screenshot' }>;

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
