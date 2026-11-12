/**
 * Centralized constants for the procedural ambient synthesizer. Keeping the
 * numbers in one module makes both the engine and its tests read from the same
 * source of truth.
 */
export const BASE_FREQ = 65;
export const BASE_LOWPASS_FREQ = 600;
export const BASE_DRONE_GAIN = 0.063;
export const NOISE_FLOOR_GAIN = 0.016;
export const BANDPASS_REST_FREQ = 750;
export const BANDPASS_SWEEP_MIN = 450;
export const BANDPASS_SWEEP_MAX = 1400;
export const BANDPASS_Q = 2.5;
export const HOVER_SWELL_GAIN = 2.0;
export const PAN_MIN = -0.75;
export const PAN_MAX = 0.75;
export const RAMP_TIME_CONSTANT = 0.05;
export const MASTER_GAIN = 1;
export const STORAGE_KEY = 'portfolio_sound_enabled';
/** Audio only begins after an explicit gesture; stored preferences arm it. */
export const DEFAULT_SOUND_ENABLED = false;
