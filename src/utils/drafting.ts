/** Number of entries in the stable project catalog (01–06). */
export const CATALOG_INDEX_SIZE = 6;

/** Zero-padded, one-based catalog index: 0 → "01", 5 → "06". */
export function formatIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** Deterministic drafting plate number derived from a zero-based index. */
export function formatPlate(index: number): string {
  return `PL-${formatIndex(index)}`;
}

/**
 * Resolve the zero-based catalog index for a project id from the stable
 * catalog order. Returns -1 when the id is not present.
 */
export function catalogIndexFor(
  catalog: ReadonlyArray<{ id: string }>,
  id: string,
): number {
  return catalog.findIndex((entry) => entry.id === id);
}
