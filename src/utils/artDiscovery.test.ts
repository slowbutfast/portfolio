import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ART_DISCOVERY_STORAGE_KEY,
  blendHexWithRgb,
  loadArtDiscoveryState,
  saveArtDiscoveryState,
} from './artDiscovery';

describe('artDiscovery', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to locked with 0 connections and maxConnections=1', () => {
    expect(loadArtDiscoveryState()).toEqual({
      unlocked: false,
      connectedIds: [],
      maxConnections: 1,
    });
  });

  it('persists and restores unlocked state and connectedIds', () => {
    saveArtDiscoveryState({
      unlocked: true,
      connectedIds: ['open-dungeon', 'sandwave-sim'],
      maxConnections: 3,
    });
    expect(loadArtDiscoveryState()).toEqual({
      unlocked: true,
      connectedIds: ['open-dungeon', 'sandwave-sim'],
      maxConnections: 3,
    });
  });

  it('recovers cleanly from malformed localStorage JSON', () => {
    localStorage.setItem(ART_DISCOVERY_STORAGE_KEY, '{not-json');
    expect(loadArtDiscoveryState()).toEqual({
      unlocked: false,
      connectedIds: [],
      maxConnections: 1,
    });
  });

  it('blends hex/rgb colors smoothly across t in [0, 1]', () => {
    expect(blendHexWithRgb('#000000', 'rgb(100, 200, 50)', 0)).toBe('#000000');
    expect(blendHexWithRgb('#000000', 'rgb(100, 200, 50)', 0.5)).toBe('rgb(50, 100, 25)');
    expect(blendHexWithRgb('#000000', 'rgb(100, 200, 50)', 1)).toBe('rgb(100, 200, 50)');
  });
});
