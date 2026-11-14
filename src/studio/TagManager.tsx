import { useState } from 'react';
import type { GraphEdge } from '../utils/graphTopology';

interface TagManagerProps {
  tags: string[];
  hiddenTags: string[];
  edges: GraphEdge[];
  baselineEdges: GraphEdge[];
  onAdd: (tag: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (tag: string) => void;
  onToggleHidden: (tag: string) => void;
}

function edgeKey(edge: GraphEdge): string {
  return [edge.source, edge.target].sort().join('<->');
}

export function TagManager({
  tags,
  hiddenTags,
  edges,
  baselineEdges,
  onAdd,
  onRename,
  onDelete,
  onToggleHidden,
}: TagManagerProps) {
  const [newTag, setNewTag] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const baseline = new Set(baselineEdges.map(edgeKey));
  const current = new Set(edges.map(edgeKey));
  const added = [...current].filter((key) => !baseline.has(key)).length;
  const removed = [...baseline].filter((key) => !current.has(key)).length;

  const submitNew = () => {
    const name = newTag.trim();
    if (!name || tags.includes(name)) return;
    onAdd(name);
    setNewTag('');
  };

  const commitRename = (tag: string) => {
    const next = draftName.trim();
    setEditing(null);
    if (!next || next === tag || tags.includes(next)) return;
    onRename(tag, next);
  };

  return (
    <section className="flex flex-col gap-3" aria-label="Tag manager">
      <header className="flex items-baseline justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Tags
        </h2>
        <span
          data-testid="edge-diff"
          className="font-mono text-xs text-[var(--color-muted)]"
        >
          {added > 0 ? `+${added} ` : ''}
          {removed > 0 ? `-${removed} ` : ''}
          {added === 0 && removed === 0 ? 'no edge change' : 'edges'}
        </span>
      </header>

      <ul className="flex flex-col gap-1">
        {tags.map((tag) => {
          const reserved = tag === 'art';
          const hidden = hiddenTags.includes(tag);
          return (
            <li
              key={tag}
              className="flex items-center gap-2 rounded border border-[var(--color-divider)] px-2 py-1 text-sm"
            >
              {editing === tag ? (
                <input
                  aria-label={`Rename ${tag}`}
                  className="min-w-0 flex-1 bg-transparent font-mono outline-none"
                  value={draftName}
                  autoFocus
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={() => commitRename(tag)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(tag);
                    if (event.key === 'Escape') setEditing(null);
                  }}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate">
                  {tag}
                  {hidden ? (
                    <span className="ml-2 font-mono text-[10px] uppercase text-[var(--color-muted)]">
                      hidden
                    </span>
                  ) : null}
                </span>
              )}
              <button
                type="button"
                aria-label={`Toggle hidden ${tag}`}
                title={reserved ? "'art' must remain hidden" : 'Toggle hidden tag'}
                className="font-mono text-xs disabled:opacity-40"
                disabled={reserved}
                onClick={() => onToggleHidden(tag)}
              >
                {hidden ? 'show' : 'hide'}
              </button>
              <button
                type="button"
                aria-label={`Rename tag ${tag}`}
                className="font-mono text-xs disabled:opacity-40"
                disabled={reserved}
                onClick={() => {
                  setEditing(tag);
                  setDraftName(tag);
                }}
              >
                rename
              </button>
              <button
                type="button"
                aria-label={`Delete tag ${tag}`}
                className="font-mono text-xs text-[#e5484d] disabled:opacity-40"
                disabled={reserved}
                onClick={() => onDelete(tag)}
              >
                delete
              </button>
            </li>
          );
        })}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitNew();
        }}
      >
        <input
          aria-label="New tag"
          placeholder="new-tag"
          className="min-w-0 flex-1 rounded border border-[var(--color-divider)] bg-transparent px-2 py-1 font-mono text-sm outline-none focus:border-[var(--color-accent)]"
          value={newTag}
          onChange={(event) => setNewTag(event.target.value)}
        />
        <button
          type="submit"
          className="rounded border border-[var(--color-divider)] px-2 py-1 font-mono text-xs"
        >
          Add tag
        </button>
      </form>
    </section>
  );
}
