export const ART_DISCOVERY_STORAGE_KEY = 'portfolio_art_state';
export const ART_COLOR_FADE_MS = 450;

export interface ArtDiscoveryState {
  unlocked: boolean;
  connectedIds: string[];
  maxConnections: number;
}

const DEFAULT_STATE: ArtDiscoveryState = {
  unlocked: false,
  connectedIds: [],
  maxConnections: 1,
};

export function loadArtDiscoveryState(): ArtDiscoveryState {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_STATE, connectedIds: [] };
    const raw = localStorage.getItem(ART_DISCOVERY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, connectedIds: [] };
    const parsed = JSON.parse(raw) as Partial<ArtDiscoveryState>;
    const connectedIds = Array.isArray(parsed.connectedIds)
      ? parsed.connectedIds.filter((id): id is string => typeof id === 'string')
      : [];
    const unlocked = Boolean(parsed.unlocked) || connectedIds.length > 0;
    const maxConnections =
      typeof parsed.maxConnections === 'number' && Number.isFinite(parsed.maxConnections)
        ? Math.min(4, Math.max(1, Math.floor(parsed.maxConnections)))
        : Math.min(4, 1 + connectedIds.length);
    return { unlocked, connectedIds, maxConnections };
  } catch {
    return { ...DEFAULT_STATE, connectedIds: [] };
  }
}

export function saveArtDiscoveryState(state: ArtDiscoveryState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ART_DISCOVERY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota/privacy-mode errors.
  }
}

export function clearArtDiscoveryState(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(ART_DISCOVERY_STORAGE_KEY);
  } catch {
    // Ignore storage privacy-mode errors.
  }
}

function parseColorChannels(color: string): [number, number, number] | null {
  const hex = color.trim();
  if (hex.startsWith('#')) {
    const raw = hex.slice(1);
    if (raw.length === 3) {
      return [
        parseInt(raw[0] + raw[0], 16),
        parseInt(raw[1] + raw[1], 16),
        parseInt(raw[2] + raw[2], 16),
      ];
    }
    if (raw.length === 6) {
      return [
        parseInt(raw.slice(0, 2), 16),
        parseInt(raw.slice(2, 4), 16),
        parseInt(raw.slice(4, 6), 16),
      ];
    }
  }
  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

export function blendHexWithRgb(fromColor: string, toRgb: string, t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  if (clamped >= 1) return toRgb;
  if (clamped <= 0) return fromColor;
  const from = parseColorChannels(fromColor);
  const to = parseColorChannels(toRgb);
  if (!from || !to) return clamped >= 0.5 ? toRgb : fromColor;
  const r = Math.round(from[0] + (to[0] - from[0]) * clamped);
  const g = Math.round(from[1] + (to[1] - from[1]) * clamped);
  const b = Math.round(from[2] + (to[2] - from[2]) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}
