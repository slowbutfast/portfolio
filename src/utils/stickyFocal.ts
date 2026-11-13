/**
 * Tap policy for the sticky inspected focal highlight.
 *
 * Clicking the node that already owns the sticky focus — while no inspector is
 * open — dismisses that focus instead of reopening the drawer. Clicking any
 * other node, or the same node once the focus has cleared, opens the inspector.
 */
export function shouldClearStickyFocalOnTap(
  nodeId: string,
  selectedId: string | null,
  stickyFocalId: string | null,
): boolean {
  return selectedId === null && stickyFocalId === nodeId;
}
