/**
 * Second-order underdamped harmonic oscillator used to give ferrofluid
 * connection bridges inertia, sag, and viscous damping.
 *
 *   x'' + 2 zeta omega_n x' + omega_n^2 x = F
 *
 * Integration uses semi-implicit Euler inside a fixed-substep accumulator so a
 * dropped or throttled animation frame can never make the spring explode.
 */

export interface BridgeOscillatorState {
  /** Lateral displacement of the bridge midpoint, in canvas pixels. */
  sag: number;
  /** Lateral velocity, in canvas pixels per second. */
  sagVelocity: number;
  /** Extra waist displacement driven by the same spring. */
  waistOffset: number;
  waistVelocity: number;
}

export const DAMPING_RATIO = 0.35;
export const NATURAL_FREQUENCY = 14;
/** Never integrate a step longer than this. */
export const MAX_SUBSTEP_MS = 16;
/** A whole frame longer than this is clamped before subdivision. */
export const MAX_FRAME_MS = 32;
/** Acceleration input is clamped to keep a fling from injecting unbounded force. */
export const MAX_INPUT_ACCELERATION = 2400;

export function createBridgeOscillatorState(): BridgeOscillatorState {
  return { sag: 0, sagVelocity: 0, waistOffset: 0, waistVelocity: 0 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function integrateChannel(
  position: number,
  velocity: number,
  acceleration: number,
  stepSeconds: number,
): [number, number] {
  const spring = -NATURAL_FREQUENCY * NATURAL_FREQUENCY * position;
  const drag = -2 * DAMPING_RATIO * NATURAL_FREQUENCY * velocity;
  const nextVelocity = velocity + (spring + drag + acceleration) * stepSeconds;
  const nextPosition = position + nextVelocity * stepSeconds;
  return [nextPosition, nextVelocity];
}

/**
 * Advance an oscillator by a frame delta. The delta is clamped to
 * `MAX_FRAME_MS`, then split into fixed substeps no longer than
 * `MAX_SUBSTEP_MS`. Returns the same mutable state for convenient call sites.
 */
export function stepBridgeOscillator(
  state: BridgeOscillatorState,
  deltaMs: number,
  acceleration = 0,
): BridgeOscillatorState {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return state;
  const frameMs = Math.min(deltaMs, MAX_FRAME_MS);
  const force = clamp(acceleration, -MAX_INPUT_ACCELERATION, MAX_INPUT_ACCELERATION);

  let remaining = frameMs;
  while (remaining > 0) {
    const subMs = Math.min(MAX_SUBSTEP_MS, remaining);
    const h = subMs / 1000;
    // The waist channel is a lighter, slightly slower echo of the sag channel,
    // which prevents the two boundaries from moving in lockstep.
    const [sag, sagVelocity] = integrateChannel(
      state.sag,
      state.sagVelocity,
      force,
      h,
    );
    const [waistOffset, waistVelocity] = integrateChannel(
      state.waistOffset,
      state.waistVelocity,
      force * 0.45,
      h,
    );
    state.sag = sag;
    state.sagVelocity = sagVelocity;
    state.waistOffset = waistOffset;
    state.waistVelocity = waistVelocity;
    remaining -= subMs;
  }
  return state;
}

/** Peak absolute displacement across both spring channels. */
export function bridgeOscillatorAmplitude(state: BridgeOscillatorState): number {
  return Math.max(Math.abs(state.sag), Math.abs(state.waistOffset));
}

/** True once both channels are visually at rest. */
export function isBridgeOscillatorAtRest(
  state: BridgeOscillatorState,
  epsilon = 0.1,
): boolean {
  return bridgeOscillatorAmplitude(state) < epsilon &&
    Math.abs(state.sagVelocity) < epsilon &&
    Math.abs(state.waistVelocity) < epsilon;
}

/**
 * Theoretical decay envelope for the free underdamped response. Exposed so the
 * animation system and tests can reason about the same bound.
 */
export function decayEnvelope(
  initialAmplitude: number,
  elapsedSeconds: number,
): number {
  const peak = initialAmplitude / Math.sqrt(1 - DAMPING_RATIO * DAMPING_RATIO);
  return peak * Math.exp(-DAMPING_RATIO * NATURAL_FREQUENCY * elapsedSeconds);
}
