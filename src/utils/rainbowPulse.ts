import type { ThemeMode } from '../types/portfolio';

export type RainbowVariant = 'vibrant' | 'muted';

const STATIC_REDUCED_MOTION_HUE = 285;
const HUE_DEGREES_PER_MS = 0.12;
const DARK_PILL_LUMINANCE = relativeLuminance([24, 25, 30]); // #18191e
const LIGHT_PILL_LUMINANCE = relativeLuminance([234, 233, 229]); // #eae9e5
const MIN_MUTED_CONTRAST = 4.55;

function hslToRgbTuple(hueDeg: number, sat: number, light: number): [number, number, number] {
  const h = (((hueDeg % 360) + 360) % 360) / 360;
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const hue2rgb = (t: number) => {
    let wrapped = t;
    if (wrapped < 0) wrapped += 1;
    if (wrapped > 1) wrapped -= 1;
    if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
    if (wrapped < 1 / 2) return q;
    if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h + 1 / 3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1 / 3) * 255),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * True when a node opts into rainbow pulsing and is either actively
 * hovered/selected or persisted in `visitedIds` (until canvas reset).
 */
export function isRainbowNodeActive(
  rainbowOnInteract: boolean | undefined,
  isActive: boolean,
  isVisited: boolean,
): boolean {
  return Boolean(rainbowOnInteract && (isActive || isVisited));
}

/**
 * Compute a continuous rainbow `rgb(r, g, b)` color for a given timestamp.
 * Under `reducedMotion`, returns a static deterministic hue. For `'muted'`
 * tag-pill text, lightness is solved per hue against the theme's pill
 * surface so WCAG AA (>= 4.5:1) holds across the entire spectrum.
 */
export function computeRainbowRgb(
  nowMs: number,
  reducedMotion: boolean,
  theme: ThemeMode,
  variant: RainbowVariant = 'vibrant',
): string {
  const hue = reducedMotion
    ? STATIC_REDUCED_MOTION_HUE
    : (nowMs * HUE_DEGREES_PER_MS) % 360;

  if (variant === 'vibrant') {
    const [r, g, b] = hslToRgbTuple(hue, 0.92, theme === 'dark' ? 0.64 : 0.46);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const saturation = theme === 'dark' ? 0.52 : 0.48;
  const pillLum = theme === 'dark' ? DARK_PILL_LUMINANCE : LIGHT_PILL_LUMINANCE;
  let lightness = theme === 'dark' ? 0.64 : 0.44;
  const step = theme === 'dark' ? 0.02 : -0.02;

  for (let i = 0; i < 25; i += 1) {
    const rgb = hslToRgbTuple(hue, saturation, lightness);
    if (contrastRatio(relativeLuminance(rgb), pillLum) >= MIN_MUTED_CONTRAST) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
    lightness = Math.min(0.96, Math.max(0.08, lightness + step));
  }

  const fallback = hslToRgbTuple(hue, saturation, lightness);
  return `rgb(${fallback[0]}, ${fallback[1]}, ${fallback[2]})`;
}
