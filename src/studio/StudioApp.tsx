import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { countSeedCrossings } from '../utils/graphPlanarity';
import { deriveEdges, type GraphEdge } from '../utils/graphTopology';
import type {
  CatalogPreview,
  CatalogProject,
  ProjectCatalog,
} from '../data/catalogSchema';
import { SeedMiniMap, type SeedMap } from './SeedMiniMap';
import { TagManager } from './TagManager';

interface StudioStateResponse {
  token: string;
  revision: string;
  catalog: ProjectCatalog;
  assetKeys: string[];
  capturedKeys: string[];
}

interface LinkResult {
  url: string;
  status: number;
  classification: 'pass' | 'warning' | 'fail';
  latencyMs: number;
  error?: string;
  blocked?: boolean;
}

interface StudioAppProps {
  onExit: () => void;
}

const RESERVED_PROJECT = 'art-wip';
const RESERVED_TAG = 'art';

type MobileTab = 'projects' | 'edit' | 'map';

const MOBILE_TABS: ReadonlyArray<{ id: MobileTab; label: string }> = [
  { id: 'projects', label: 'Projects' },
  { id: 'edit', label: 'Edit' },
  { id: 'map', label: 'Map & Tags' },
];

const inputClass =
  'min-h-11 w-full rounded border border-[var(--color-divider)] bg-transparent px-2 py-1 font-mono text-base outline-none focus:border-[var(--color-accent)] sm:min-h-0 sm:text-sm';
const buttonClass =
  'min-h-11 min-w-11 rounded border border-[var(--color-divider)] px-2 py-1 font-mono text-xs transition-colors hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:min-w-0';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof body.error === 'string' ? body.error : `${response.status} ${response.statusText}`,
    );
  }
  return body as T;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function defaultPreview(kind: CatalogPreview['kind'], assetKeys: string[]): CatalogPreview {
  switch (kind) {
    case 'screenshot':
      return { kind, assetKey: assetKeys[0] ?? '', caption: 'Preview' };
    case 'video':
      return { kind, assetKey: assetKeys[0] ?? '', caption: 'Walkthrough' };
    case 'linkout':
      return { kind, url: 'https://example.com/', label: 'Open link' };
    case 'wip':
      return { kind, label: 'WIP' };
    default:
      return { kind: 'terminal', label: 'Terminal' };
  }
}

function nonCrossingSeed(
  projects: CatalogProject[],
  seeds: SeedMap,
  hiddenTags: string[],
): { x: number; y: number } {
  const edges = deriveEdges(projects, new Set(hiddenTags));
  for (let y = 0.08; y <= 0.92; y += 0.06) {
    for (let x = 0.08; x <= 0.92; x += 0.06) {
      const candidate = { x, y };
      const positions = Object.fromEntries(
        Object.entries(seeds).map(([id, seed]) => [id, [seed.x, seed.y] as [number, number]]),
      ) as Record<string, [number, number]>;
      for (const project of projects) {
        if (!positions[project.id] && project.id !== 'candidate') {
          positions[project.id] = [candidate.x, candidate.y];
        }
      }
      try {
        if (countSeedCrossings(positions, edges, projects.map((project) => project.id)) === 0) {
          return candidate;
        }
      } catch {
        // A transient invalid draft: try the next candidate.
      }
    }
  }
  return { x: 0.5, y: 0.5 };
}

export default function StudioApp({ onExit }: StudioAppProps) {
  const [data, setData] = useState<StudioStateResponse | null>(null);
  const [draft, setDraft] = useState<ProjectCatalog | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [revision, setRevision] = useState('');
  const [links, setLinks] = useState<Record<string, LinkResult>>({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('projects');

  const load = useCallback(async () => {
    const next = await api<StudioStateResponse>('/__studio/api/state');
    setData(next);
    setDraft(next.catalog);
    setToken(next.token);
    setRevision(next.revision);
    setSelectedId((current) => current ?? next.catalog.projects[0]?.id ?? null);
    setNotice('Synced');
    setError('');
  }, []);

  useEffect(() => {
    load().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  }, [load]);

  const dirty = useMemo(
    () => Boolean(data && draft && JSON.stringify(draft) !== JSON.stringify(data.catalog)),
    [data, draft],
  );

  const edges = useMemo<GraphEdge[]>(
    () => (draft ? deriveEdges(draft.projects, new Set(draft.hiddenTags)) : []),
    [draft],
  );

  const baselineEdges = useMemo<GraphEdge[]>(
    () =>
      data ? deriveEdges(data.catalog.projects, new Set(data.catalog.hiddenTags)) : [],
    [data],
  );

  const crossings = useMemo(() => {
    if (!draft) return 0;
    const positions = Object.fromEntries(
      Object.entries(draft.seeds).map(([id, seed]) => [
        id,
        [seed.x, seed.y] as [number, number],
      ]),
    );
    try {
      return countSeedCrossings(positions, edges, draft.projects.map((project) => project.id));
    } catch {
      return 1;
    }
  }, [draft, edges]);

  const selected = draft?.projects.find((project) => project.id === selectedId) ?? null;

  const updateProject = (id: string, patch: Partial<CatalogProject>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            projects: current.projects.map((project) =>
              project.id === id ? { ...project, ...patch } : project,
            ),
          }
        : current,
    );
  };

  const renameProject = (from: string, rawTo: string) => {
    const to = rawTo.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (from === RESERVED_PROJECT || !to || to === from) return;
    setDraft((current) => {
      if (!current || current.projects.some((project) => project.id === to)) return current;
      const seeds: SeedMap = { ...current.seeds };
      const seed = seeds[from];
      delete seeds[from];
      if (seed) seeds[to] = seed;
      return {
        ...current,
        projects: current.projects.map((project) =>
          project.id === from ? { ...project, id: to } : project,
        ),
        seeds,
      };
    });
    setSelectedId(to);
  };

  const addProject = () => {
    if (!draft) return;
    let index = draft.projects.length + 1;
    let id = `project-${index}`;
    while (draft.projects.some((project) => project.id === id)) {
      index += 1;
      id = `project-${index}`;
    }
    const firstVisibleTag = draft.tags.find((tag) => !draft.hiddenTags.includes(tag));
    const project: CatalogProject = {
      id,
      title: 'New Project',
      shortTitle: 'New',
      summary: 'Draft project summary.',
      classification: 'NEW PROJECT // DRAFT',
      tags: firstVisibleTag ? [firstVisibleTag] : [],
      previews: [{ kind: 'terminal', label: 'Terminal' }],
    };
    const seed = nonCrossingSeed([...draft.projects, project], draft.seeds, draft.hiddenTags);
    setDraft({
      ...draft,
      projects: [...draft.projects, project],
      seeds: { ...draft.seeds, [id]: seed },
    });
    setSelectedId(id);
    setMobileTab('edit');
  };

  const selectProject = (id: string) => {
    setSelectedId(id);
    setMobileTab('edit');
  };

  const deleteProject = (id: string) => {
    if (!draft || id === RESERVED_PROJECT) return;
    const seeds = { ...draft.seeds };
    delete seeds[id];
    const projects = draft.projects.filter((project) => project.id !== id);
    setDraft({ ...draft, projects, seeds });
    if (selectedId === id) setSelectedId(projects[0]?.id ?? null);
  };

  const setPreview = (projectId: string, index: number, preview: CatalogPreview) => {
    const project = draft?.projects.find((item) => item.id === projectId);
    if (!project) return;
    updateProject(projectId, {
      previews: project.previews.map((item, itemIndex) =>
        itemIndex === index ? preview : item,
      ),
    });
  };

  const renameTag = (from: string, to: string) => {
    if (!draft || from === RESERVED_TAG) return;
    setDraft({
      ...draft,
      tags: draft.tags.map((tag) => (tag === from ? to : tag)),
      hiddenTags: draft.hiddenTags.map((tag) => (tag === from ? to : tag)),
      projects: draft.projects.map((project) => ({
        ...project,
        tags: project.tags.map((tag) => (tag === from ? to : tag)),
      })),
    });
  };

  const deleteTag = (tag: string) => {
    if (!draft || tag === RESERVED_TAG) return;
    setDraft({
      ...draft,
      tags: draft.tags.filter((item) => item !== tag),
      hiddenTags: draft.hiddenTags.filter((item) => item !== tag),
      projects: draft.projects.map((project) => ({
        ...project,
        tags: project.tags.filter((item) => item !== tag),
      })),
    });
  };

  const toggleHiddenTag = (tag: string) => {
    if (!draft || tag === RESERVED_TAG) return;
    setDraft({
      ...draft,
      hiddenTags: draft.hiddenTags.includes(tag)
        ? draft.hiddenTags.filter((item) => item !== tag)
        : [...draft.hiddenTags, tag],
    });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const result = await api<{ revision: string }>('/__studio/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Studio-Token': token,
        },
        body: JSON.stringify({ expectedRevision: revision, catalog: draft }),
      });
      setRevision(result.revision);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setSaving(false);
    }
  };

  const checkLinks = async () => {
    setChecking(true);
    setError('');
    try {
      const results = await api<LinkResult[]>('/__studio/api/audit-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Studio-Token': token,
        },
        body: '{}',
      });
      setLinks(Object.fromEntries(results.map((result) => [result.url, result])));
      setNotice(`Checked ${results.length} links`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setChecking(false);
    }
  };

  if (!draft) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]"
        data-testid="studio-loading"
      >
        <p className="font-mono text-sm">{error || 'Loading Project Studio…'}</p>
      </div>
    );
  }

  const saveBlocked = !dirty || saving || crossings > 0;
  const saveReason = crossings > 0 ? 'Fix crossing seeds first' : !dirty ? 'No changes' : '';

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]"
      data-testid="studio-app"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-divider)] px-4 py-3">
        <h1 className="font-mono text-sm uppercase tracking-[0.2em]">
          Project Studio // Dev
        </h1>
        <span
          data-testid="studio-dirty"
          className="rounded-full border border-[var(--color-divider)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]"
        >
          {dirty ? 'Unsaved changes' : 'Synced'}
        </span>
        <span className="font-mono text-[10px] text-[var(--color-muted)]">
          rev {revision.slice(0, 8)}
        </span>
        <div className="ml-auto hidden flex-wrap items-center gap-2 sm:flex">
          <button
            type="button"
            className={buttonClass}
            data-testid="studio-check-links"
            disabled={checking}
            onClick={checkLinks}
          >
            {checking ? 'Checking…' : 'Check Links'}
          </button>
          <button
            type="button"
            className={buttonClass}
            data-testid="studio-discard"
            disabled={!dirty}
            onClick={() => {
              if (data) setDraft(data.catalog);
              setNotice('Changes discarded');
            }}
          >
            Discard
          </button>
          <button
            type="button"
            className={buttonClass}
            data-testid="studio-save"
            disabled={saveBlocked}
            title={saveReason}
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className={buttonClass} onClick={onExit}>
            ← Portfolio
          </button>
        </div>
      </header>

      {(notice || error) && (
        <div
          role="status"
          className="border-b border-[var(--color-divider)] px-4 py-1 font-mono text-xs"
          style={{ color: error ? 'var(--color-error)' : 'var(--color-muted)' }}
        >
          {error || notice}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col pb-20 sm:pb-0 lg:grid lg:grid-cols-[minmax(180px,220px)_minmax(0,1fr)_minmax(240px,340px)]">
        <nav
          role="tablist"
          aria-label="Studio sections"
          className="flex shrink-0 gap-1 border-b border-[var(--color-divider)] p-2 lg:hidden"
        >
          {MOBILE_TABS.map((tab) => {
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`studio-tab-${tab.id}`}
                className={`min-h-11 flex-1 rounded border px-2 py-1 font-mono text-xs ${
                  active
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-[var(--color-divider)] text-[var(--color-muted)]'
                }`}
                onClick={() => setMobileTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'map' && crossings > 0 && (
                  <span
                    data-testid="studio-crossing-badge"
                    className="ml-1 rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-[10px] text-white"
                  >
                    {crossings}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <aside
          className={`${mobileTab === 'projects' ? 'flex' : 'hidden'} min-h-0 flex-col border-r border-[var(--color-divider)] lg:flex`}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Projects
            </h2>
            <button
              type="button"
              className={buttonClass}
              data-testid="studio-add-project"
              onClick={addProject}
            >
              + New
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {draft.projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  data-testid={`studio-project-${project.id}`}
                  className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                    project.id === selectedId
                      ? 'bg-[var(--color-surface-container)] text-[var(--color-text)]'
                      : 'text-[var(--color-muted)]'
                  }`}
                  onClick={() => selectProject(project.id)}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {project.id}
                  </span>
                  {project.id === RESERVED_PROJECT && (
                    <span title="Reserved project" aria-label="Reserved project">
                      🔒
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main
          className={`${mobileTab === 'edit' ? 'block' : 'hidden'} min-h-0 overflow-y-auto px-4 py-4 sm:px-5 lg:block`}
        >
          {selected ? (
            <div className="flex flex-col gap-5">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="ID">
                  <input
                    className={inputClass}
                    data-testid="studio-project-id"
                    value={selected.id}
                    disabled={selected.id === RESERVED_PROJECT}
                    onChange={(event) => renameProject(selected.id, event.target.value)}
                  />
                </Field>
                <Field label="Classification">
                  <input
                    className={inputClass}
                    value={selected.classification}
                    onChange={(event) =>
                      updateProject(selected.id, { classification: event.target.value })
                    }
                  />
                </Field>
                <Field label="Title">
                  <input
                    className={inputClass}
                    data-testid="studio-title"
                    value={selected.title}
                    onChange={(event) =>
                      updateProject(selected.id, { title: event.target.value })
                    }
                  />
                </Field>
                <Field label="Short title">
                  <input
                    className={inputClass}
                    value={selected.shortTitle}
                    onChange={(event) =>
                      updateProject(selected.id, { shortTitle: event.target.value })
                    }
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Summary">
                    <textarea
                      className={`${inputClass} min-h-16`}
                      data-testid="studio-summary"
                      value={selected.summary}
                      onChange={(event) =>
                        updateProject(selected.id, { summary: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Repository">
                  <input
                    className={inputClass}
                    data-testid="studio-repo"
                    value={selected.repo ?? ''}
                    placeholder="https://github.com/…"
                    onChange={(event) =>
                      updateProject(selected.id, {
                        repo: event.target.value || undefined,
                      })
                    }
                  />
                  <LinkBadge result={selected.repo ? links[selected.repo] : undefined} />
                </Field>
                <Field label="Live URL">
                  <input
                    className={inputClass}
                    data-testid="studio-live-url"
                    value={selected.liveUrl ?? ''}
                    placeholder="https://… or /art/"
                    onChange={(event) =>
                      updateProject(selected.id, {
                        liveUrl: event.target.value || undefined,
                      })
                    }
                  />
                  <LinkBadge result={selected.liveUrl ? links[selected.liveUrl] : undefined} />
                </Field>
              </section>

              <section>
                <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Behavior
                </h2>
                <div className="flex flex-wrap gap-4">
                  {(
                    [
                      'omitIndex',
                      'hideOverview',
                      'revealLabelOnInspect',
                      'rainbowOnInteract',
                    ] as const
                  ).map((flag) => (
                    <label key={flag} className="flex items-center gap-2 font-mono text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[flag])}
                        disabled={selected.id === RESERVED_PROJECT}
                        onChange={(event) =>
                          updateProject(selected.id, { [flag]: event.target.checked })
                        }
                      />
                      {flag}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {draft.tags.map((tag) => {
                    const checked = selected.tags.includes(tag);
                    return (
                      <label
                        key={tag}
                        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs ${
                          checked
                            ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                            : 'border-[var(--color-divider)] text-[var(--color-muted)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() =>
                            updateProject(selected.id, {
                              tags: checked
                                ? selected.tags.filter((item) => item !== tag)
                                : [...selected.tags, tag],
                            })
                          }
                        />
                        {tag}
                        {draft.hiddenTags.includes(tag) ? ' · hidden' : ''}
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Previews
                  </h2>
                  <div className="flex gap-1">
                    {(['screenshot', 'video', 'linkout', 'terminal'] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        className={buttonClass}
                        onClick={() =>
                          updateProject(selected.id, {
                            previews: [
                              ...selected.previews,
                              defaultPreview(kind, data?.assetKeys ?? []),
                            ],
                          })
                        }
                      >
                        + {kind}
                      </button>
                    ))}
                  </div>
                </div>
                {selected.previews.map((preview, index) => (
                  <div
                    key={`${preview.kind}-${index}`}
                    className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[110px_1fr_1fr_auto] rounded border border-[var(--color-divider)] p-2"
                  >
                    <Field label="Kind">
                      <select
                        className={inputClass}
                        value={preview.kind}
                        onChange={(event) =>
                          setPreview(
                            selected.id,
                            index,
                            defaultPreview(
                              event.target.value as CatalogPreview['kind'],
                              data?.assetKeys ?? [],
                            ),
                          )
                        }
                      >
                        <option value="screenshot">screenshot</option>
                        <option value="video">video</option>
                        <option value="linkout">linkout</option>
                        <option value="terminal">terminal</option>
                        <option value="wip">wip</option>
                      </select>
                    </Field>
                    {preview.kind === 'screenshot' || preview.kind === 'video' ? (
                      <>
                        <Field label="Asset">
                          <select
                            className={inputClass}
                            data-testid={`studio-asset-${index}`}
                            value={preview.assetKey}
                            onChange={(event) =>
                              setPreview(selected.id, index, {
                                ...preview,
                                assetKey: event.target.value,
                              })
                            }
                          >
                            {(data?.assetKeys ?? []).map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Caption">
                          <input
                            className={inputClass}
                            value={preview.caption}
                            onChange={(event) =>
                              setPreview(selected.id, index, {
                                ...preview,
                                caption: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </>
                    ) : preview.kind === 'linkout' ? (
                      <>
                        <Field label="URL">
                          <input
                            className={inputClass}
                            value={preview.url}
                            onChange={(event) =>
                              setPreview(selected.id, index, {
                                ...preview,
                                url: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Label">
                          <input
                            className={inputClass}
                            value={preview.label}
                            onChange={(event) =>
                              setPreview(selected.id, index, {
                                ...preview,
                                label: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <Field label="Label">
                          <input
                            className={inputClass}
                            value={preview.label}
                            onChange={(event) =>
                              setPreview(selected.id, index, {
                                kind: preview.kind,
                                label: event.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                    )}
                    <button
                      type="button"
                      className={buttonClass}
                      aria-label="Remove preview"
                      onClick={() =>
                        updateProject(selected.id, {
                          previews: selected.previews.filter(
                            (_item, itemIndex) => itemIndex !== index,
                          ),
                        })
                      }
                    >
                      remove
                    </button>
                  </div>
                ))}
              </section>

              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Terminal demo
                  </h2>
                  <button
                    type="button"
                    className={buttonClass}
                    data-testid="studio-toggle-terminal"
                    onClick={() =>
                      updateProject(selected.id, {
                        terminalDemo: selected.terminalDemo
                          ? undefined
                          : {
                              capturedKey: data?.capturedKeys[0] ?? '',
                              prompt: '$ ',
                            },
                      })
                    }
                  >
                    {selected.terminalDemo ? 'remove' : '+ demo'}
                  </button>
                </div>
                {selected.terminalDemo && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Field label="Captured demo">
                      <select
                        className={inputClass}
                        data-testid="studio-captured-key"
                        value={selected.terminalDemo.capturedKey}
                        onChange={(event) =>
                          updateProject(selected.id, {
                            terminalDemo: {
                              ...selected.terminalDemo!,
                              capturedKey: event.target.value,
                            },
                          })
                        }
                      >
                        {(data?.capturedKeys ?? []).map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Prompt">
                      <input
                        className={inputClass}
                        value={selected.terminalDemo.prompt}
                        onChange={(event) =>
                          updateProject(selected.id, {
                            terminalDemo: {
                              ...selected.terminalDemo!,
                              prompt: event.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
              </section>

              <button
                type="button"
                className="self-start rounded border border-[var(--color-error)] px-2 py-1 font-mono text-xs text-[var(--color-error)] disabled:opacity-40"
                data-testid="studio-delete-project"
                disabled={selected.id === RESERVED_PROJECT}
                title={
                  selected.id === RESERVED_PROJECT ? 'Reserved project cannot be deleted' : ''
                }
                onClick={() => deleteProject(selected.id)}
              >
                Delete project
              </button>
            </div>
          ) : (
            <p className="font-mono text-sm text-[var(--color-muted)]">Select a project.</p>
          )}
        </main>

        <aside
          className={`${mobileTab === 'map' ? 'flex' : 'hidden'} min-h-0 flex-col gap-4 overflow-y-auto border-l border-[var(--color-divider)] p-3 lg:flex`}
        >
          <section>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Planar seeds
            </h2>
            <SeedMiniMap
              seeds={draft.seeds}
              edges={edges}
              selectedId={selectedId}
              onMove={(id, x, y) => {
                setDraft((current) =>
                  current
                    ? { ...current, seeds: { ...current.seeds, [id]: { x, y } } }
                    : current,
                );
              }}
            />
            {crossings > 0 && (
              <p className="mt-1 font-mono text-xs text-[var(--color-error)]" role="alert">
                Save blocked: {crossings} edge crossing(s).
              </p>
            )}
          </section>

          <TagManager
            tags={draft.tags}
            hiddenTags={draft.hiddenTags}
            edges={edges}
            baselineEdges={baselineEdges}
            onAdd={(tag) => setDraft({ ...draft, tags: [...draft.tags, tag] })}
            onRename={renameTag}
            onDelete={deleteTag}
            onToggleHidden={toggleHiddenTag}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-[var(--color-divider)] bg-[var(--color-surface)] p-2 pb-[env(safe-area-inset-bottom)] sm:hidden">
        <button
          type="button"
          className={`${buttonClass} flex-1`}
          data-testid="studio-check-links-mobile"
          disabled={checking}
          onClick={checkLinks}
        >
          {checking ? 'Checking…' : 'Check Links'}
        </button>
        <button
          type="button"
          className={`${buttonClass} flex-1`}
          data-testid="studio-discard-mobile"
          disabled={!dirty}
          onClick={() => {
            if (data) setDraft(data.catalog);
            setNotice('Changes discarded');
          }}
        >
          Discard
        </button>
        <button
          type="button"
          className={`${buttonClass} flex-1`}
          data-testid="studio-save-mobile"
          disabled={saveBlocked}
          title={saveReason}
          onClick={save}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function LinkBadge({ result }: { result?: LinkResult }) {
  if (!result) return null;
  const color =
    result.classification === 'pass'
      ? 'var(--color-success)'
      : result.classification === 'warning'
        ? 'var(--color-amber)'
        : 'var(--color-error)';
  return (
    <span className="font-mono text-[10px]" style={{ color }}>
      {result.classification} · {result.status || 'ERR'} · {result.latencyMs}ms
      {result.blocked ? ' · blocked' : ''}
    </span>
  );
}
