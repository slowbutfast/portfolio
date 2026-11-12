/**
 * Procedural Web Audio ambient engine.
 *
 * The graph is synthesized entirely in the browser: a 65Hz sawtooth feeds two
 * cascaded 600Hz lowpass filters for the warm transformer drone, a subtle pink
 * noise bed adds circuit hiss, and a parallel 750Hz resonant bandpass provides
 * the hover swell. No network audio assets are requested.
 */
import {
  BANDPASS_Q,
  BANDPASS_REST_FREQ,
  BANDPASS_SWEEP_MAX,
  BANDPASS_SWEEP_MIN,
  BASE_DRONE_GAIN,
  BASE_FREQ,
  BASE_LOWPASS_FREQ,
  DEFAULT_SOUND_ENABLED,
  DRAG_VELOCITY_FULL_SCALE,
  HOVER_SWELL_GAIN,
  MASTER_GAIN,
  NOISE_FLOOR_GAIN,
  PAN_MAX,
  PAN_MIN,
  RAMP_TIME_CONSTANT,
  STORAGE_KEY,
} from './audioConstants';

export interface AudioParamLike {
  value: number;
  setTargetAtTime(target: number, startTime: number, timeConstant: number): unknown;
  setValueAtTime?(value: number, startTime: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
  disconnect?(): void;
  [key: string]: unknown;
}

export interface AudioContextLike {
  currentTime: number;
  state: string;
  sampleRate?: number;
  destination: AudioNodeLike;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close?(): Promise<void>;
  createOscillator(): AudioNodeLike & {
    type: string;
    frequency: AudioParamLike;
    start(): void;
    stop(): void;
  };
  createGain(): AudioNodeLike & { gain: AudioParamLike };
  createBiquadFilter(): AudioNodeLike & {
    type: string;
    frequency: AudioParamLike;
    Q: AudioParamLike;
    gain: AudioParamLike;
  };
  createStereoPanner(): AudioNodeLike & { pan: AudioParamLike };
  createBufferSource(): AudioNodeLike & {
    buffer: unknown;
    loop: boolean;
    start(): void;
    stop(): void;
  };
  createBuffer(channels: number, length: number, sampleRate: number): {
    getChannelData(channel: number): Float32Array;
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DocumentLike {
  visibilityState?: string;
  hidden?: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface AmbientSynthDeps {
  createContext?: () => AudioContextLike | null;
  storage?: StorageLike | null;
  document?: DocumentLike | null;
}

interface SynthNodes {
  master: ReturnType<AudioContextLike['createGain']>;
  droneGain: ReturnType<AudioContextLike['createGain']>;
  noiseGain: ReturnType<AudioContextLike['createGain']>;
  hoverGain: ReturnType<AudioContextLike['createGain']>;
  lowpassA: ReturnType<AudioContextLike['createBiquadFilter']>;
  lowpassB: ReturnType<AudioContextLike['createBiquadFilter']>;
  bandpass: ReturnType<AudioContextLike['createBiquadFilter']>;
  panner: ReturnType<AudioContextLike['createStereoPanner']>;
  oscillator: ReturnType<AudioContextLike['createOscillator']>;
  noise: ReturnType<AudioContextLike['createBufferSource']>;
}

const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function readSoundPreference(storage: StorageLike | null | undefined): boolean {
  if (!storage) return DEFAULT_SOUND_ENABLED;
  try {
    return storage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return DEFAULT_SOUND_ENABLED;
  }
}

export function writeSoundPreference(
  storage: StorageLike | null | undefined,
  enabled: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Storage denial is non-fatal; the in-memory preference still applies.
  }
}

function resolveStorage(deps: AmbientSynthDeps): StorageLike | null {
  if (deps.storage !== undefined) return deps.storage;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // Private browsing can throw on access.
  }
  return null;
}

function resolveDocument(deps: AmbientSynthDeps): DocumentLike | null {
  if (deps.document !== undefined) return deps.document;
  return typeof document !== 'undefined' ? (document as unknown as DocumentLike) : null;
}

function createBrowserContext(): AudioContextLike | null {
  const scope = globalThis as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function ramp(param: AudioParamLike, target: number, ctx: AudioContextLike): void {
  if (typeof param.setTargetAtTime === 'function') {
    param.setTargetAtTime(target, ctx.currentTime, RAMP_TIME_CONSTANT);
  } else {
    param.value = target;
  }
}

/** Pink-ish noise from filtered white noise; deterministic enough for ambience. */
function fillPinkNoise(data: Float32Array): void {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.02;
  }
}

export class AmbientSynth {
  private deps: AmbientSynthDeps;
  private ctx: AudioContextLike | null = null;
  private nodes: SynthNodes | null = null;
  private enabled = false;
  private sourcesStarted = false;
  private visibilityBound = false;
  private visibilityHandler: (() => void) | null = null;
  private gestureBound = false;
  private gestureHandler: (() => void) | null = null;

  constructor(deps: AmbientSynthDeps = {}) {
    this.deps = deps;
    this.enabled = readSoundPreference(this.storage);
  }

  private get storage(): StorageLike | null {
    return resolveStorage(this.deps);
  }

  private get document(): DocumentLike | null {
    return resolveDocument(this.deps);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isRunning(): boolean {
    return this.ctx?.state === 'running';
  }

  private ensureContext(): AudioContextLike | null {
    if (this.ctx) return this.ctx;
    const created = this.deps.createContext
      ? this.deps.createContext()
      : createBrowserContext();
    if (!created) return null;
    this.ctx = created;
    this.buildGraph(created);
    this.bindVisibility(created);
    return created;
  }

  private buildGraph(ctx: AudioContextLike): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    const panner = ctx.createStereoPanner();
    panner.pan.value = 0;
    master.connect(panner);
    panner.connect(ctx.destination);

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = BASE_FREQ;

    const lowpassA = ctx.createBiquadFilter();
    lowpassA.type = 'lowpass';
    lowpassA.frequency.value = BASE_LOWPASS_FREQ;
    lowpassA.Q.value = 0.707;
    const lowpassB = ctx.createBiquadFilter();
    lowpassB.type = 'lowpass';
    lowpassB.frequency.value = BASE_LOWPASS_FREQ;
    lowpassB.Q.value = 0.707;

    const droneGain = ctx.createGain();
    droneGain.gain.value = BASE_DRONE_GAIN;
    oscillator.connect(lowpassA);
    lowpassA.connect(lowpassB);
    lowpassB.connect(droneGain);
    droneGain.connect(master);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = BANDPASS_REST_FREQ;
    bandpass.Q.value = BANDPASS_Q;
    const hoverGain = ctx.createGain();
    hoverGain.gain.value = 0;
    oscillator.connect(bandpass);
    bandpass.connect(hoverGain);
    hoverGain.connect(master);

    const noise = ctx.createBufferSource();
    const sampleRate = ctx.sampleRate ?? 48000;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * 2), sampleRate);
    fillPinkNoise(buffer.getChannelData(0));
    noise.buffer = buffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = NOISE_FLOOR_GAIN;
    noise.connect(noiseGain);
    noiseGain.connect(master);

    this.nodes = {
      master,
      droneGain,
      noiseGain,
      hoverGain,
      lowpassA,
      lowpassB,
      bandpass,
      panner,
      oscillator,
      noise,
    };
  }

  private startSources(): void {
    if (this.sourcesStarted || !this.nodes) return;
    this.nodes.oscillator.start();
    this.nodes.noise.start();
    this.sourcesStarted = true;
  }

  private bindVisibility(ctx: AudioContextLike): void {
    if (this.visibilityBound) return;
    const doc = this.document;
    if (!doc) return;
    this.visibilityBound = true;
    const handler = () => {
      const hidden = doc.hidden ?? doc.visibilityState === 'hidden';
      if (hidden) {
        void ctx.suspend();
      } else if (this.enabled) {
        void ctx.resume();
      }
    };
    this.visibilityHandler = handler;
    doc.addEventListener('visibilitychange', handler);
  }

  private armRecovery(): void {
    if (this.gestureBound || this.isRunning()) return;
    const doc = this.document;
    if (!doc) return;
    this.gestureBound = true;
    const handler = () => {
      void this.resumeFromGesture();
    };
    this.gestureHandler = handler;
    for (const event of GESTURE_EVENTS) doc.addEventListener(event, handler);
  }

  private disarmRecovery(): void {
    if (!this.gestureBound) return;
    const doc = this.document;
    const handler = this.gestureHandler;
    if (doc && handler) {
      for (const event of GESTURE_EVENTS) doc.removeEventListener(event, handler);
    }
    this.gestureHandler = null;
    this.gestureBound = false;
  }

  private async resumeFromGesture(): Promise<void> {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      await ctx.resume();
      // Resuming the context is not enough: the stored-preference path built
      // the graph but never started the sources or opened the master gain.
      if (this.enabled && this.nodes) {
        this.startSources();
        ramp(this.nodes.master.gain, MASTER_GAIN, ctx);
      }
      this.disarmRecovery();
    } catch {
      // Autoplay policy can still refuse; remain armed for the next gesture.
    }
  }

  /** Start the synthesizer. Safe to call repeatedly. */
  start(): void {
    this.enabled = true;
    const ctx = this.ensureContext();
    if (!ctx || !this.nodes) return;
    this.startSources();
    ramp(this.nodes.master.gain, MASTER_GAIN, ctx);
    if (ctx.state === 'running') {
      // Already unlocked by a prior gesture.
    } else {
      this.armRecovery();
      void this.resumeFromGesture();
    }
  }

  /** Ramp the master gain to silence. */
  stop(): void {
    this.enabled = false;
    if (!this.ctx || !this.nodes) return;
    ramp(this.nodes.master.gain, 0, this.ctx);
  }

  setSoundEnabled(enabled: boolean): void {
    this.enabled = enabled;
    writeSoundPreference(this.storage, enabled);
    if (enabled) this.start();
    else this.stop();
  }

  /** Resume after the first user gesture when a stored preference armed audio. */
  armIfNeeded(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state !== 'running') this.armRecovery();
  }

  onPointerMove(xNorm: number, yNorm: number): void {
    if (!this.ctx || !this.nodes) return;
    const x = clamp(xNorm, 0, 1);
    const y = clamp(yNorm, 0, 1);
    ramp(this.nodes.panner.pan, PAN_MIN + x * (PAN_MAX - PAN_MIN), this.ctx);
    ramp(
      this.nodes.bandpass.frequency,
      BANDPASS_SWEEP_MIN + y * (BANDPASS_SWEEP_MAX - BANDPASS_SWEEP_MIN),
      this.ctx,
    );
  }

  onNodeHover(isHovered: boolean): void {
    if (!this.ctx || !this.nodes) return;
    ramp(this.nodes.hoverGain.gain, isHovered ? HOVER_SWELL_GAIN : 0, this.ctx);
  }

  onDragVelocity(vx: number, vy: number): void {
    if (!this.ctx || !this.nodes) return;
    const speed = Math.hypot(vx, vy);
    const modulation = clamp(speed / DRAG_VELOCITY_FULL_SCALE, 0, 1) * 0.05;
    ramp(this.nodes.oscillator.frequency, BASE_FREQ * (1 + modulation), this.ctx);
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.suspend();
    }
    const doc = this.document;
    if (doc && this.visibilityHandler) {
      doc.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.visibilityHandler = null;
    this.disarmRecovery();
    this.enabled = false;
    this.ctx = null;
    this.nodes = null;
    this.sourcesStarted = false;
    this.visibilityBound = false;
  }
}

let singleton: AmbientSynth | null = null;

/** Browser-wide singleton so React remounts never stack audio graphs. */
export function getAmbientSynth(): AmbientSynth {
  if (!singleton) singleton = new AmbientSynth();
  return singleton;
}

export function resetAmbientSynthForTests(): void {
  singleton?.dispose();
  singleton = null;
}
