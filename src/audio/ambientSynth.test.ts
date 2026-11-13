import { describe, expect, it, vi } from 'vitest';
import {
  BANDPASS_Q,
  BANDPASS_REST_FREQ,
  BANDPASS_SWEEP_MAX,
  BANDPASS_SWEEP_MIN,
  BASE_DRONE_GAIN,
  BASE_FREQ,
  BASE_LOWPASS_FREQ,
  DEFAULT_SOUND_VOLUME,
  HOVER_SWELL_GAIN,
  MASTER_GAIN,
  NOISE_FLOOR_GAIN,
  PAN_MAX,
  PAN_MIN,
  RAMP_TIME_CONSTANT,
  STORAGE_KEY,
  VOLUME_STORAGE_KEY,
} from './audioConstants';
import {
  AmbientSynth,
  readSoundPreference,
  readVolumePreference,
  type AudioContextLike,
  type AudioNodeLike,
  type AudioParamLike,
  type DocumentLike,
  type StorageLike,
} from './ambientSynth';

class FakeParam implements AudioParamLike {
  value = 0;
  ramps: { target: number; startTime: number; timeConstant: number }[] = [];
  setTargetAtTime(target: number, startTime: number, timeConstant: number): unknown {
    this.value = target;
    this.ramps.push({ target, startTime, timeConstant });
    return this;
  }
}

class FakeNode implements AudioNodeLike {
  connections: AudioNodeLike[] = [];
  connect(destination: AudioNodeLike): unknown {
    this.connections.push(destination);
    return destination;
  }
  disconnect(): void {
    this.connections = [];
  }
  [key: string]: unknown;
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
  Q = new FakeParam();
  gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  started = 0;
  start(): void {
    this.started += 1;
  }
  stop(): void {}
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  started = 0;
  start(): void {
    this.started += 1;
  }
  stop(): void {}
}

class FakePanner extends FakeNode {
  pan = new FakeParam();
}

class FakeContext implements AudioContextLike {
  currentTime = 4;
  state = 'suspended';
  sampleRate = 8000;
  destination = new FakeNode();
  osc: FakeOscillator | null = null;
  filters: FakeFilter[] = [];
  gains: FakeGain[] = [];
  panner: FakePanner | null = null;
  noise: FakeBufferSource | null = null;
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  close = vi.fn(async () => {});
  createOscillator(): FakeOscillator {
    this.osc = new FakeOscillator();
    return this.osc;
  }
  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  createBiquadFilter(): FakeFilter {
    const filter = new FakeFilter();
    this.filters.push(filter);
    return filter;
  }
  createStereoPanner(): FakePanner {
    this.panner = new FakePanner();
    return this.panner;
  }
  createBufferSource(): FakeBufferSource {
    this.noise = new FakeBufferSource();
    return this.noise;
  }
  createBuffer(_channels: number, length: number): { getChannelData(): Float32Array } {
    return { getChannelData: () => new Float32Array(length) };
  }
}

class FakeStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

class FakeDocument implements DocumentLike {
  hidden = false;
  visibilityState = 'visible';
  listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, listener: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function setup(stored: string | null = null, storedVolume: string | null = null) {
  const ctx = new FakeContext();
  const storage = new FakeStorage();
  if (stored !== null) storage.setItem(STORAGE_KEY, stored);
  if (storedVolume !== null) storage.setItem(VOLUME_STORAGE_KEY, storedVolume);
  const doc = new FakeDocument();
  const synth = new AmbientSynth({
    createContext: () => ctx,
    storage,
    document: doc,
  });
  return { ctx, storage, doc, synth };
}

describe('audio constants', () => {
  it('exposes the specified synthesizer topology', () => {
    expect(BASE_FREQ).toBe(65);
    expect(BASE_LOWPASS_FREQ).toBe(600);
    expect(BASE_DRONE_GAIN).toBe(0.063);
    expect(NOISE_FLOOR_GAIN).toBe(0.016);
    expect(BANDPASS_REST_FREQ).toBe(750);
    expect(BANDPASS_SWEEP_MIN).toBe(450);
    expect(BANDPASS_SWEEP_MAX).toBe(1400);
    expect(BANDPASS_Q).toBe(2.5);
    expect(HOVER_SWELL_GAIN).toBe(2.0);
    expect(PAN_MIN).toBe(-0.75);
    expect(PAN_MAX).toBe(0.75);
    expect(RAMP_TIME_CONSTANT).toBe(0.05);
    expect(STORAGE_KEY).toBe('portfolio_sound_enabled');
    expect(VOLUME_STORAGE_KEY).toBe('portfolio_sound_volume');
    expect(DEFAULT_SOUND_VOLUME).toBe(1);
  });
});

describe('sound volume preference', () => {
  it('reads, clamps, and persists volume in [0, 1]', () => {
    const storage = new FakeStorage();
    storage.setItem(VOLUME_STORAGE_KEY, '0.35');
    expect(readVolumePreference(storage)).toBeCloseTo(0.35, 6);
    storage.setItem(VOLUME_STORAGE_KEY, 'not-a-number');
    expect(readVolumePreference(storage)).toBe(DEFAULT_SOUND_VOLUME);

    const { storage: liveStorage, synth } = setup();
    expect(synth.getVolume()).toBe(DEFAULT_SOUND_VOLUME);
    synth.setVolume(0.35);
    expect(synth.getVolume()).toBeCloseTo(0.35, 6);
    expect(liveStorage.getItem(VOLUME_STORAGE_KEY)).toBe('0.35');
    synth.setVolume(2);
    expect(synth.getVolume()).toBe(1);
    synth.setVolume(-1);
    expect(synth.getVolume()).toBe(0);
    expect(liveStorage.getItem(VOLUME_STORAGE_KEY)).toBe('0');
  });

  it('scales master gain and keeps Sound enabled at zero volume', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);
    synth.setVolume(0);
    expect(synth.isEnabled()).toBe(true);
    expect(ctx.gains[0].gain.ramps.at(-1)?.target).toBe(0);

    synth.setVolume(0.4);
    expect(ctx.gains[0].gain.ramps.at(-1)?.target).toBeCloseTo(
      0.4 * MASTER_GAIN,
      6,
    );
    expect(synth.isEnabled()).toBe(true);
  });

  it('restores stored volume and applies it when starting audio', () => {
    const { ctx, synth } = setup('true', '0.25');
    expect(synth.getVolume()).toBeCloseTo(0.25, 6);
    synth.setSoundEnabled(true);
    expect(ctx.gains[0].gain.ramps.at(-1)?.target).toBeCloseTo(
      0.25 * MASTER_GAIN,
      6,
    );
  });
});

describe('ambient synth graph construction', () => {
  it('defers AudioContext creation until explicit activation', () => {
    const createContext = vi.fn(() => new FakeContext());
    const synth = new AmbientSynth({
      createContext,
      storage: new FakeStorage(),
      document: new FakeDocument(),
    });
    expect(createContext).not.toHaveBeenCalled();
    synth.setSoundEnabled(true);
    expect(createContext).toHaveBeenCalledTimes(1);
  });

  it('builds sawtooth, cascaded lowpass, pink noise, bandpass, and panner nodes', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);

    expect(ctx.osc?.type).toBe('sawtooth');
    expect(ctx.osc?.frequency.value).toBe(BASE_FREQ);
    expect(ctx.osc?.started).toBe(1);

    const lowpasses = ctx.filters.filter((filter) => filter.type === 'lowpass');
    expect(lowpasses).toHaveLength(2);
    for (const filter of lowpasses) {
      expect(filter.frequency.value).toBe(BASE_LOWPASS_FREQ);
    }

    const bandpass = ctx.filters.find((filter) => filter.type === 'bandpass');
    expect(bandpass?.frequency.value).toBe(BANDPASS_REST_FREQ);
    expect(bandpass?.Q.value).toBe(BANDPASS_Q);

    expect(ctx.noise?.loop).toBe(true);
    expect(ctx.noise?.started).toBe(1);
    const noiseGain = ctx.gains.find((gain) => gain.gain.value === NOISE_FLOOR_GAIN);
    expect(noiseGain).toBeDefined();
    expect(ctx.panner).not.toBeNull();
  });

  it('uses setTargetAtTime for every parameter ramp', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);
    synth.onNodeHover(true);
    synth.onPointerMove(0.25, 0.75);
    synth.onDragVelocity(20, 10);

    const params = [
      ...ctx.gains.map((gain) => gain.gain),
      ...ctx.filters.map((filter) => filter.frequency),
      ctx.panner!.pan,
      ctx.osc!.frequency,
    ];
    const ramps = params.flatMap((param) => param.ramps);
    expect(ramps.length).toBeGreaterThan(0);
    for (const ramp of ramps) {
      expect(ramp.timeConstant).toBe(RAMP_TIME_CONSTANT);
      expect(ramp.startTime).toBe(ctx.currentTime);
    }
  });
});

describe('user consent and preference persistence', () => {
  it('defaults to disabled and maps the stored string exactly', () => {
    const storage = new FakeStorage();
    expect(readSoundPreference(storage)).toBe(false);
    storage.setItem(STORAGE_KEY, 'true');
    expect(readSoundPreference(storage)).toBe(true);
  });

  it('synchronizes toggles with localStorage', () => {
    const { storage, synth } = setup();
    expect(synth.isEnabled()).toBe(false);
    synth.setSoundEnabled(true);
    expect(storage.getItem(STORAGE_KEY)).toBe('true');
    synth.setSoundEnabled(false);
    expect(storage.getItem(STORAGE_KEY)).toBe('false');
  });
});

describe('parameter modulation', () => {
  it('maps pointer position to pan and bandpass sweep', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);

    synth.onPointerMove(0, 0);
    expect(ctx.panner?.pan.value).toBe(PAN_MIN);
    const bandpass = ctx.filters.find((filter) => filter.type === 'bandpass')!;
    expect(bandpass.frequency.value).toBe(BANDPASS_SWEEP_MIN);

    synth.onPointerMove(1, 1);
    expect(ctx.panner?.pan.value).toBe(PAN_MAX);
    expect(bandpass.frequency.value).toBe(BANDPASS_SWEEP_MAX);
  });

  it('swells the hover bandpass gain by +6dB and returns to zero', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);
    synth.onNodeHover(true);
    const hoverGain = ctx.gains.find((gain) => gain.gain.value === HOVER_SWELL_GAIN);
    expect(hoverGain).toBeDefined();
    synth.onNodeHover(false);
    expect(hoverGain?.gain.value).toBe(0);
  });

  it('modulates the base oscillator by at most 5% during a drag', () => {
    const { ctx, synth } = setup();
    synth.setSoundEnabled(true);
    synth.onDragVelocity(10000, 10000);
    expect(ctx.osc!.frequency.value).toBeCloseTo(BASE_FREQ * 1.05, 6);
    synth.onDragVelocity(0, 0);
    expect(ctx.osc!.frequency.value).toBeCloseTo(BASE_FREQ, 6);
  });
});

describe('autoplay and visibility recovery', () => {
  it('suspends when hidden and resumes when visible while enabled', () => {
    const { ctx, doc, synth } = setup();
    synth.setSoundEnabled(true);
    ctx.suspend.mockClear();
    ctx.resume.mockClear();

    doc.hidden = true;
    doc.visibilityState = 'hidden';
    doc.emit('visibilitychange');
    expect(ctx.suspend).toHaveBeenCalledTimes(1);

    doc.hidden = false;
    doc.visibilityState = 'visible';
    doc.emit('visibilitychange');
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('arms recovery for a stored preference and starts audio on the first gesture', async () => {
    const { ctx, doc, synth } = setup('true');
    expect(synth.isEnabled()).toBe(true);
    // The engine starts from the stored preference but the fake context is
    // still suspended until resume settles.
    ctx.state = 'suspended';
    synth.armIfNeeded();
    expect(doc.listeners.get('pointerdown')?.size ?? 0).toBeGreaterThan(0);
    expect(ctx.osc?.started ?? 0).toBe(0);

    doc.emit('pointerdown');
    await Promise.resolve();
    await Promise.resolve();

    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.osc?.started).toBe(1);
    expect(ctx.noise?.started).toBe(1);
    expect(ctx.gains[0].gain.ramps.at(-1)?.target).toBe(MASTER_GAIN);
  });

  it('does not start sources when toggled off before the gesture', () => {
    const { ctx, doc, synth } = setup('true');
    synth.setSoundEnabled(false);
    synth.armIfNeeded();
    expect(doc.listeners.get('pointerdown')?.size ?? 0).toBe(0);

    doc.emit('pointerdown');
    expect(ctx.osc).toBeNull();
    expect(ctx.resume).not.toHaveBeenCalled();
  });
});
