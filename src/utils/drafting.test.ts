import { describe, expect, it } from 'vitest';
import { CATALOG_INDEX_SIZE, catalogIndexFor, formatIndex, formatPlate } from './drafting';

/**
 * WCAG 1.4.11 relative luminance + contrast ratio helpers, implemented inline so
 * the test is self-contained and does not depend on the implementation.
 */
function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG 1.4.11 non-text contrast for interactive boundaries', () => {
  it('keeps #71717a at >= 3:1 against the #0a0a0c background', () => {
    expect(contrastRatio('#71717a', '#0a0a0c')).toBeGreaterThanOrEqual(3);
  });

  it('keeps #71717a at >= 3:1 against the #111215 surface', () => {
    expect(contrastRatio('#71717a', '#111215')).toBeGreaterThanOrEqual(3);
  });
});

describe('drafting index formatters', () => {
  it('zero-pads catalog indices to two digits', () => {
    expect(formatIndex(0)).toBe('01');
    expect(formatIndex(4)).toBe('05');
    expect(formatIndex(5)).toBe('06');
    expect(formatIndex(9)).toBe('10');
  });

  it('derives stable plate numbers from catalog indices', () => {
    expect(formatPlate(0)).toBe('PL-01');
    expect(formatPlate(5)).toBe('PL-06');
  });

  it('exposes the stable catalog size', () => {
    expect(CATALOG_INDEX_SIZE).toBe(6);
  });

  it('resolves a catalog index from a project id in stable order', () => {
    const catalog = [{ id: 'alpha' }, { id: 'beta' }, { id: 'gamma' }];
    expect(catalogIndexFor(catalog, 'alpha')).toBe(0);
    expect(catalogIndexFor(catalog, 'gamma')).toBe(2);
    expect(catalogIndexFor(catalog, 'missing')).toBe(-1);
  });
});
