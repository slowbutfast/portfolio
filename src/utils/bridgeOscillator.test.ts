import { describe, expect, it } from 'vitest';
import {
  DAMPING_RATIO,
  MAX_FRAME_MS,
  MAX_SUBSTEP_MS,
  NATURAL_FREQUENCY,
  bridgeOscillatorAmplitude,
  createBridgeOscillatorState,
  decayEnvelope,
  isBridgeOscillatorAtRest,
  stepBridgeOscillator,
} from './bridgeOscillator';

describe('bridge oscillator constants', () => {
  it('uses the specified underdamped physical parameters', () => {
    expect(DAMPING_RATIO).toBe(0.35);
    expect(NATURAL_FREQUENCY).toBe(14);
    expect(MAX_SUBSTEP_MS).toBeLessThanOrEqual(16);
    expect(MAX_FRAME_MS).toBe(32);
  });
});

describe('decay envelope', () => {
  it('stays below the theoretical underdamped bound over the full response', () => {
    const initial = 10;
    const state = createBridgeOscillatorState();
    state.sag = initial;

    const dtMs = 1000 / 60;
    const totalSeconds = 2;
    const steps = Math.round((totalSeconds * 1000) / dtMs);
    for (let i = 1; i <= steps; i += 1) {
      stepBridgeOscillator(state, dtMs, 0);
      const t = (i * dtMs) / 1000;
      const bound = 1.1 * decayEnvelope(initial, t);
      expect(Math.abs(state.sag), `t=${t.toFixed(3)}s`).toBeLessThanOrEqual(bound + 1e-6);
    }
  });

  it('decays monotonically as a whole and is essentially still after one second', () => {
    const state = createBridgeOscillatorState();
    state.sag = 8;
    for (let i = 0; i < 60; i += 1) stepBridgeOscillator(state, 1000 / 60, 0);
    expect(bridgeOscillatorAmplitude(state)).toBeLessThan(1);
    expect(decayEnvelope(8, 1)).toBeLessThan(decayEnvelope(8, 0.5));
  });
});

describe('numerical stability under frame drops', () => {
  it('clamps giant frame deltas and keeps state finite', () => {
    const state = createBridgeOscillatorState();
    for (let i = 0; i < 120; i += 1) {
      stepBridgeOscillator(state, 500, 5000);
      expect(Number.isFinite(state.sag)).toBe(true);
      expect(Number.isFinite(state.sagVelocity)).toBe(true);
      expect(Math.abs(state.sag)).toBeLessThan(1000);
    }
  });

  it('ignores zero and negative deltas', () => {
    const state = createBridgeOscillatorState();
    state.sag = 3;
    stepBridgeOscillator(state, 0, 10);
    stepBridgeOscillator(state, -5, 10);
    expect(state.sag).toBe(3);
    expect(state.sagVelocity).toBe(0);
  });
});

describe('resting equilibrium', () => {
  it('stays at zero when no acceleration is applied', () => {
    const state = createBridgeOscillatorState();
    for (let i = 0; i < 600; i += 1) stepBridgeOscillator(state, 1000 / 60, 0);
    expect(Math.abs(state.sag)).toBeLessThan(0.001);
    expect(Math.abs(state.waistOffset)).toBeLessThan(0.001);
    expect(isBridgeOscillatorAtRest(state)).toBe(true);
  });

  it('settles back to a tiny amplitude after a short impulse', () => {
    const state = createBridgeOscillatorState();
    for (let i = 0; i < 8; i += 1) stepBridgeOscillator(state, 1000 / 60, 400);
    for (let i = 0; i < 600; i += 1) stepBridgeOscillator(state, 1000 / 60, 0);
    expect(Math.abs(state.sag)).toBeLessThan(0.001);
  });
});
