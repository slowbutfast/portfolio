import { describe, expect, it } from 'vitest';
import { computeRainbowRgb, isRainbowNodeActive } from './rainbowPulse';

function parseRgb(rgb: string): [number, number, number] {
  const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb.trim());
  if (!match) throw new Error(`Invalid rgb() color: ${rgb}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(parseRgb(a));
  const l2 = relativeLuminance(parseRgb(b));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('isRainbowNodeActive', () => {
  it('returns true only when rainbowOnInteract is enabled and node is active or visited', () => {
    expect(isRainbowNodeActive(true, true, false)).toBe(true);
    expect(isRainbowNodeActive(true, false, true)).toBe(true);
    expect(isRainbowNodeActive(true, true, true)).toBe(true);
    expect(isRainbowNodeActive(true, false, false)).toBe(false);
    expect(isRainbowNodeActive(false, true, true)).toBe(false);
    expect(isRainbowNodeActive(undefined, true, true)).toBe(false);
  });
});

describe('computeRainbowRgb', () => {
  it('cycles smoothly through rgb() values over time when motion is enabled', () => {
    const t0 = computeRainbowRgb(0, false, 'dark', 'vibrant');
    const t1 = computeRainbowRgb(750, false, 'dark', 'vibrant');
    const t2 = computeRainbowRgb(1500, false, 'dark', 'vibrant');

    expect(() => parseRgb(t0)).not.toThrow();
    expect(() => parseRgb(t1)).not.toThrow();
    expect(() => parseRgb(t2)).not.toThrow();
    expect(t0).not.toBe(t1);
    expect(t1).not.toBe(t2);
  });

  it('returns a deterministic static color when reducedMotion is true', () => {
    const a = computeRainbowRgb(0, true, 'dark', 'vibrant');
    const b = computeRainbowRgb(1250, true, 'dark', 'vibrant');
    const c = computeRainbowRgb(4999, true, 'light', 'muted');
    const d = computeRainbowRgb(999, true, 'light', 'muted');

    expect(a).toBe(b);
    expect(c).toBe(d);
  });

  it('maintains >= 4.5:1 WCAG AA contrast for muted tag-pill text across the full 360deg cycle', () => {
    const darkPillBg = 'rgb(24, 25, 30)'; // #18191e (--color-surface-container dark)
    const lightPillBg = 'rgb(234, 233, 229)'; // #eae9e5 (--color-surface-container light)

    for (let ms = 0; ms < 3000; ms += 100) {
      const darkMuted = computeRainbowRgb(ms, false, 'dark', 'muted');
      const lightMuted = computeRainbowRgb(ms, false, 'light', 'muted');
      expect(
        contrastRatio(darkMuted, darkPillBg),
        `dark muted at ${ms}ms (${darkMuted})`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(lightMuted, lightPillBg),
        `light muted at ${ms}ms (${lightMuted})`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    // Also verify reduced-motion static hue
    expect(
      contrastRatio(computeRainbowRgb(0, true, 'dark', 'muted'), darkPillBg),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(computeRainbowRgb(0, true, 'light', 'muted'), lightPillBg),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps stable theme foreground node outlines at >= 3:1 contrast against canvas backgrounds', () => {
    const darkBg = 'rgb(10, 10, 12)'; // #0a0a0c
    const darkFg = 'rgb(255, 255, 255)'; // #ffffff
    const lightBg = 'rgb(246, 246, 244)'; // #f6f6f4
    const lightFg = 'rgb(10, 10, 12)'; // #0a0a0c

    expect(contrastRatio(darkFg, darkBg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(lightFg, lightBg)).toBeGreaterThanOrEqual(3);
  });
});
