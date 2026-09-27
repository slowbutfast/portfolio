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
              className="max-h-72 w-full rounded-lg border border-stone-800 bg-black"
              poster={preview.poster}
            >
              <source src={preview.src} type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
            <figcaption className="mt-2 text-sm text-stone-400">{preview.caption}</figcaption>
          </figure>
        ) : (
          <figure key={i}>
            <img
              src={preview.src}
              alt={preview.caption}
              loading="lazy"
              className="w-full rounded-lg border border-stone-800"
            />
            <figcaption className="mt-2 text-sm text-stone-400">{preview.caption}</figcaption>
          </figure>
        ),
      )}
    </div>
  );
}