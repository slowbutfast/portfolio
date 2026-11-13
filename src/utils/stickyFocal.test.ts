import { describe, expect, it } from 'vitest';
import { shouldClearStickyFocalOnTap } from './stickyFocal';

describe('shouldClearStickyFocalOnTap', () => {
  it('clears the sticky focus when the focused node is tapped while the inspector is closed', () => {
    expect(shouldClearStickyFocalOnTap('node-a', null, 'node-a')).toBe(true);
  });

  it('opens the inspector for the same node once the sticky focus is cleared', () => {
    expect(shouldClearStickyFocalOnTap('node-a', null, null)).toBe(false);
  });

  it('opens the inspector for a different node without an extra tap', () => {
    expect(shouldClearStickyFocalOnTap('node-b', null, 'node-a')).toBe(false);
  });

  it('never swallows a node click while an inspector is open', () => {
    expect(shouldClearStickyFocalOnTap('node-a', 'node-a', 'node-a')).toBe(false);
    expect(shouldClearStickyFocalOnTap('node-b', 'node-a', 'node-a')).toBe(false);
  });
});
