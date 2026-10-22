// A small arranger keyboard in the browser, modelled on the panel of a Korg Pa300.
// Every sound is synthesised with the Web Audio API (no samples), so the page stays light.

export const LOW = 36; // C2
export const HIGH = 96; // C7, 61 keys
export const SPLIT = 60; // middle C: keys below it play chords while a style runs

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SPOKEN = ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B'];

export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
export const keyName = (midi: number) => {
  const octave = Math.floor(midi / 12) - 1;
  return isBlack(midi) ? `${SPOKEN[midi % 12]} ${octave}` : `${SPOKEN[midi % 12]}${octave}`;
};
const mtof = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// Computer keys from middle C up: the home row is white keys, the row above is black keys.
export const KEYMAP: Record<string, number> = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };

type Kind = 'piano' | 'epiano' | 'organ' | 'pluck' | 'strings' | 'brass' | 'lead' | 'pad' | 'bass';
export type Sound = { category: string; name: string; kind: Kind; bright: number; detune?: number; wave?: OscillatorType; short?: boolean };

export const categories = ['Piano', 'E.Piano', 'Organ', 'Guitar', 'Strings', 'Brass', 'Synth', 'Pad'];

export const sounds: Sound[] = [
  { category: 'Piano', name: 'Grand Piano', kind: 'piano', bright: 1 },
  { category: 'Piano', name: 'Bright Piano', kind: 'piano', bright: 1.8 },
  { category: 'Piano', name: 'Honky-Tonk', kind: 'piano', bright: 1.3, detune: 16 },
  { category: 'E.Piano', name: 'Tine E.Piano', kind: 'epiano', bright: 1 },
  { category: 'E.Piano', name: 'Bell E.Piano', kind: 'epiano', bright: 2.2 },
  { category: 'Organ', name: 'Jazz Organ', kind: 'organ', bright: 1 },
  { category: 'Organ', name: 'Church Organ', kind: 'organ', bright: 2 },
  { category: 'Guitar', name: 'Nylon Guitar', kind: 'pluck', bright: 0.6 },
  { category: 'Guitar', name: 'Steel Guitar', kind: 'pluck', bright: 1.4 },
  { category: 'Strings', name: 'Warm Strings', kind: 'strings', bright: 1 },
  { category: 'Strings', name: 'Pizzicato', kind: 'pluck', bright: 0.8, short: true },
  { category: 'Brass', name: 'Brass Section', kind: 'brass', bright: 1 },
  { category: 'Brass', name: 'Soft Horns', kind: 'brass', bright: 0.6 },
  { category: 'Synth', name: 'Saw Lead', kind: 'lead', bright: 1 },
  { category: 'Synth', name: 'Square Lead', kind: 'lead', bright: 0.7, wave: 'square' },
  { category: 'Pad', name: 'Dream Pad', kind: 'pad', bright: 1 },
  { category: 'Pad', name: 'Choir Aahs', kind: 'pad', bright: 0.55 },
];

const sound = (name: string) => sounds.find((item) => item.name === name) ?? sounds[0];
const BASS: Sound = { category: 'Bass', name: 'Finger Bass', kind: 'bass', bright: 1 };

// 16 steps per bar. Bass entries are [step, interval from the chord root, length in steps]; comp entries are [step, length].
export type Style = {
  name: string;
  tempo: number;
  kick: number[];
  snare: number[];
  hat: number[];
  open?: number[];
  rim?: number[];
  bass: [number, number, number][];
  comp: [number, number][];
  compSound: Sound;
};

const eighths = [0, 2, 4, 6, 8, 10, 12, 14];

export const styles: Style[] = [
  {
    name: '8Beat Pop', tempo: 100, kick: [0, 6, 8], snare: [4, 12], hat: eighths,
    bass: [[0, 0, 3], [6, 0, 2], [8, 7, 3], [14, 12, 2]], comp: [[0, 3], [4, 3], [8, 3], [12, 3]], compSound: sound('Tine E.Piano'),
  },
  {
    name: 'Slow Ballad', tempo: 72, kick: [0, 10], snare: [8], hat: eighths,
    bass: [[0, 0, 8], [8, 7, 6], [14, 0, 2]], comp: [[0, 16]], compSound: sound('Warm Strings'),
  },
  {
    name: 'Bossa Nova', tempo: 128, kick: [0, 3, 4, 8, 11, 12], snare: [], hat: eighths, rim: [0, 3, 6, 10, 12],
    bass: [[0, 0, 3], [3, 7, 1], [4, 7, 4], [8, 0, 3], [11, 7, 1], [12, 7, 4]], comp: [[0, 2], [3, 2], [6, 2], [10, 2], [12, 2]], compSound: sound('Nylon Guitar'),
  },
  {
    name: 'Classic Rock', tempo: 118, kick: [0, 3, 8, 10], snare: [4, 12], hat: eighths, open: [14],
    bass: eighths.map((step) => [step, 0, 2] as [number, number, number]), comp: [[0, 6], [8, 6]], compSound: sound('Jazz Organ'),
  },
];

const CHORD_TYPES: [string, number[]][] = [
  ['', [0, 4, 7]],
  ['m', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['m7', [0, 3, 7, 10]],
  ['maj7', [0, 4, 7, 11]],
  ['dim', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['sus4', [0, 5, 7]],
];

export type Chord = { root: number; type: string };

// Recognises the chord in the held left-hand notes; one key alone plays its major chord (single-finger mode).
export function detectChord(notes: number[]): Chord | null {
  if (!notes.length) return null;
  const lowest = Math.min(...notes);
  const classes = [...new Set(notes.map((note) => note % 12))];
  if (classes.length === 1) return { root: lowest % 12, type: '' };
  for (const exact of [true, false]) {
    for (const root of [lowest % 12, ...classes]) {
      const relative = classes.map((pc) => (pc - root + 12) % 12);
      for (const [type, intervals] of CHORD_TYPES) {
        const covers = relative.every((interval) => intervals.includes(interval));
        if (covers && (!exact || relative.length === intervals.length)) return { root, type };
      }
    }
  }
  return { root: lowest % 12, type: classes.some((pc) => (pc - lowest + 12) % 12 === 3) ? 'm' : '' };
}

const chordTypes = Object.fromEntries(CHORD_TYPES);
function voicing(chord: Chord) {
  return (chordTypes[chord.type] ?? [0, 4, 7]).map((interval) => {
    let note = 48 + chord.root + interval;
    while (note < 55) note += 12;
    while (note > 67) note -= 12;
    return note;
  });
}

// Ode to Joy (Beethoven, public domain): [midi, length in 16th steps], 8 bars.
const ODE: [number, number][] = [
  ...[64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64].map((note) => [note, 4] as [number, number]),
  [64, 6], [62, 2], [62, 8],
  ...[64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64].map((note) => [note, 4] as [number, number]),
  [62, 6], [60, 2], [60, 8],
];
const DEMO_CHORDS = ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'C'];
const DEMO_STEPS = new Map<number, [number, number]>();
ODE.reduce((at, [note, length]) => (DEMO_STEPS.set(at, [note, length]), at + length), 0);

type Voice = { stop: (time: number) => void };

export class Arranger {
  ctx: AudioContext | null = null;
  soundIndex = 0;
  styleIndex = 0;
  tempo = styles[0].tempo;
  transpose = 0;
  octave = 0;
  volume = 0.8;
  reverb = true;
  metronome = false;
  running = false;
  demo = false;
  measure = 0;
  beat = 0;
  chord: Chord = { root: 0, type: '' };
  onChange: () => void = () => {};
  onNote: (key: number, on: boolean) => void = () => {};
  onBeat: () => void = () => {};

  private bus!: GainNode;
  private accompaniment!: GainNode;
  private drums!: GainNode;
  private master!: GainNode;
  private wet!: GainNode;
  private analyser: AnalyserNode | null = null;
  private noise!: AudioBuffer;
  private plucks = new Map<string, AudioBuffer>();
  private held = new Map<number, Voice>();
  private left = new Set<number>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private demoStep = 0;
  private fillNext = false;
  private inFill = false;
  private endNext = false;
  private crashNext = false;
  private meterData = new Float32Array(512);

  get sound() {
    return sounds[this.soundIndex];
  }

  get style() {
    return styles[this.styleIndex];
  }

  get chordName() {
    return NOTE_NAMES[this.chord.root] + this.chord.type;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return true;
    }
    if (typeof window === 'undefined') return false;
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return false;
    const ctx = new Context();
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.master.connect(limiter).connect(this.analyser).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(2.4);
    this.wet = ctx.createGain();
    this.wet.gain.value = this.reverb ? 0.3 : 0;
    reverb.connect(this.wet).connect(this.master);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    this.bus.connect(reverb);
    this.accompaniment = ctx.createGain();
    this.accompaniment.gain.value = 0.5;
    this.accompaniment.connect(this.bus);
    this.drums = ctx.createGain();
    this.drums.gain.value = 0.65;
    this.drums.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  dispose() {
    this.stopClock();
    void this.ctx?.close();
    this.ctx = null;
  }

  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.meterData);
    let sum = 0;
    for (const value of this.meterData) sum += value * value;
    return Math.sqrt(sum / this.meterData.length);
  }

  // Keys

  noteOn(key: number) {
    if (!this.init() || !this.ctx) return;
    const time = this.ctx.currentTime;
    if (this.running && key < SPLIT) {
      this.left.add(key);
      this.chord = detectChord([...this.left]) ?? this.chord;
      this.onNote(key, true);
      this.onChange();
      return;
    }
    this.held.get(key)?.stop(time);
    this.held.set(key, this.voice(key + this.transpose + this.octave * 12, this.sound, time, this.bus));
    this.onNote(key, true);
  }

  noteOff(key: number) {
    this.onNote(key, false);
    if (this.left.delete(key)) return;
    const voice = this.held.get(key);
    if (voice && this.ctx) voice.stop(this.ctx.currentTime);
    this.held.delete(key);
  }

  releaseAll() {
    for (const key of [...this.held.keys(), ...this.left]) this.noteOff(key);
  }

  chime() {
    if (!this.init() || !this.ctx) return;
    const start = this.ctx.currentTime + 0.05;
    [60, 64, 67, 72, 76, 79, 84].forEach((note, index) => {
      const time = start + index * 0.07;
      this.voice(note, sounds[0], time, this.bus, 0.7).stop(time + 1.2);
    });
  }

  // Panel

  selectCategory(category: string) {
    const options = sounds.map((item, index) => [item, index] as const).filter(([item]) => item.category === category);
    const position = options.findIndex(([, index]) => index === this.soundIndex);
    this.soundIndex = options[(position + 1) % options.length][1];
    this.onChange();
  }

  selectStyle(index: number) {
    this.styleIndex = index;
    if (!this.running) this.tempo = styles[index].tempo;
    this.onChange();
  }

  changeTempo(delta: number) {
    this.tempo = Math.min(240, Math.max(40, this.tempo + delta));
    this.onChange();
  }

  changeTranspose(delta: number) {
    this.releaseAll();
    this.transpose = Math.min(12, Math.max(-12, this.transpose + delta));
    this.onChange();
  }

  changeOctave(delta: number) {
    this.releaseAll();
    this.octave = Math.min(2, Math.max(-2, this.octave + delta));
    this.onChange();
  }

  setVolume(value: number) {
    this.volume = value;
    if (this.ctx) this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.03);
    this.onChange();
  }

  toggleReverb() {
    this.reverb = !this.reverb;
    if (this.ctx) this.wet.gain.setTargetAtTime(this.reverb ? 0.3 : 0, this.ctx.currentTime, 0.05);
    this.onChange();
  }

  toggleMetronome() {
    this.metronome = !this.metronome;
    if (this.metronome && this.init()) this.startClock(!this.running);
    if (!this.metronome && !this.running) this.stopClock();
    this.onChange();
  }

  toggleStyle() {
    if (this.running) this.stopStyle();
    else this.startStyle();
  }

  startStyle(demo = false) {
    if (!this.init()) return;
    this.running = true;
    this.demo = demo;
    this.demoStep = 0;
    this.fillNext = this.inFill = this.endNext = this.crashNext = false;
    this.startClock(true);
    this.onChange();
  }

  stopStyle() {
    this.running = false;
    this.demo = false;
    this.left.clear();
    if (!this.metronome) this.stopClock();
    this.measure = this.beat = 0;
    this.onChange();
  }

  fill() {
    if (this.running) this.fillNext = true;
  }

  ending() {
    if (this.running) this.endNext = true;
  }

  playDemo() {
    if (this.running) this.stopStyle();
    this.styleIndex = 0;
    this.tempo = 100;
    this.startStyle(true);
  }

  // Clock: a look-ahead scheduler, so timing comes from the audio clock and not from timers.

  private get stepTime() {
    return 60 / this.tempo / 4;
  }

  private startClock(reset: boolean) {
    if (!this.ctx || (this.timer && !reset)) return;
    this.stopClock();
    this.step = 0;
    this.measure = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 25);
  }

  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    if (!this.ctx) return;
    while (this.timer && this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepTime;
      this.step = (this.step + 1) % 16;
    }
  }

  private later(time: number, action: () => void) {
    const wait = this.ctx ? Math.max(0, (time - this.ctx.currentTime) * 1000) : 0;
    setTimeout(action, wait);
  }

  private playStep(step: number, time: number) {
    if (step === 0) {
      this.measure++;
      if (this.running) {
        if (this.endNext) return this.playEnding(time);
        this.inFill = this.fillNext;
        this.fillNext = false;
        if (this.crashNext) this.crash(time);
        this.crashNext = false;
      }
    }
    if (step % 4 === 0) {
      this.beat = step / 4 + 1;
      this.later(time, () => this.onBeat());
      if (this.metronome) this.click(time, step === 0);
    }
    if (!this.running) return;

    const style = this.style;
    if (this.inFill && step >= 8) {
      if (step === 8) this.kick(time, 1);
      this.tom(time, 230 - (step - 8) * 14, step % 2 ? 0.55 : 0.8);
      if (step === 15) this.crashNext = true;
    } else {
      if (style.kick.includes(step)) this.kick(time, step % 8 === 0 ? 1 : 0.8);
      if (style.snare.includes(step)) this.snare(time, 0.9);
      if (style.rim?.includes(step)) this.rim(time);
      if (style.hat.includes(step)) this.hat(time, step % 4 === 0 ? 0.6 : 0.4, Boolean(style.open?.includes(step)));
    }

    if (this.demo) this.playDemoStep(step, time);

    const root = this.chord.root;
    for (const [at, interval, length] of style.bass) {
      if (at === step) this.voice(36 + root + interval, BASS, time, this.accompaniment, 0.9).stop(time + length * this.stepTime * 0.92);
    }
    for (const [at, length] of style.comp) {
      if (at !== step) continue;
      for (const note of voicing(this.chord)) this.voice(note, style.compSound, time, this.accompaniment, 0.5).stop(time + length * this.stepTime * 0.9);
    }
  }

  private playDemoStep(step: number, time: number) {
    const bar = Math.floor(this.demoStep / 16);
    if (step === 0 && bar < DEMO_CHORDS.length) {
      this.chord = { root: NOTE_NAMES.indexOf(DEMO_CHORDS[bar]), type: '' };
      this.later(time, () => this.onChange());
    }
    const event = DEMO_STEPS.get(this.demoStep);
    if (event) {
      const [note, length] = event;
      const end = time + length * this.stepTime * 0.92;
      this.voice(note + this.transpose + this.octave * 12, this.sound, time, this.bus).stop(end);
      this.later(time, () => this.onNote(note, true));
      this.later(end, () => this.onNote(note, false));
    }
    this.demoStep++;
    if (this.demoStep === DEMO_CHORDS.length * 16) this.endNext = true;
  }

  private playEnding(time: number) {
    this.crash(time);
    this.kick(time, 1);
    const length = this.stepTime * 8;
    this.voice(36 + this.chord.root, BASS, time, this.accompaniment, 0.9).stop(time + length);
    for (const note of voicing(this.chord)) this.voice(note, this.style.compSound, time, this.accompaniment, 0.5).stop(time + length);
    this.running = false;
    this.demo = false;
    this.endNext = false;
    this.left.clear();
    if (!this.metronome) this.stopClock();
    this.later(time + length, () => {
      this.measure = this.beat = 0;
      this.onChange();
    });
  }

  // Drums

  private hit(time: number, peak: number, decay: number) {
    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    gain.connect(this.drums);
    return gain;
  }

  private noiseBurst(time: number, filter: BiquadFilterType, frequency: number, peak: number, decay: number) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const shape = ctx.createBiquadFilter();
    shape.type = filter;
    shape.frequency.value = frequency;
    source.connect(shape).connect(this.hit(time, peak, decay));
    source.start(time);
    source.stop(time + decay + 0.05);
  }

  private kick(time: number, velocity: number) {
    const osc = this.ctx!.createOscillator();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    osc.connect(this.hit(time, velocity, 0.38));
    osc.start(time);
    osc.stop(time + 0.4);
  }

  private snare(time: number, velocity: number) {
    this.noiseBurst(time, 'bandpass', 1800, velocity * 0.7, 0.18);
    const body = this.ctx!.createOscillator();
    body.type = 'triangle';
    body.frequency.value = 190;
    body.connect(this.hit(time, velocity * 0.4, 0.1));
    body.start(time);
    body.stop(time + 0.12);
  }

  private hat(time: number, velocity: number, open: boolean) {
    this.noiseBurst(time, 'highpass', 7500, velocity * 0.35, open ? 0.3 : 0.05);
  }

  private rim(time: number) {
    const click = this.ctx!.createOscillator();
    click.type = 'square';
    click.frequency.value = 1700;
    click.connect(this.hit(time, 0.12, 0.03));
    click.start(time);
    click.stop(time + 0.05);
  }

  private tom(time: number, frequency: number, velocity: number) {
    const osc = this.ctx!.createOscillator();
    osc.frequency.setValueAtTime(frequency, time);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.6, time + 0.25);
    osc.connect(this.hit(time, velocity * 0.8, 0.28));
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private crash(time: number) {
    this.noiseBurst(time, 'highpass', 5000, 0.35, 1.4);
  }

  private click(time: number, accent: boolean) {
    const osc = this.ctx!.createOscillator();
    osc.frequency.value = accent ? 1600 : 1000;
    osc.connect(this.hit(time, 0.3, 0.03));
    osc.start(time);
    osc.stop(time + 0.05);
  }

  // Tones

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    return buffer;
  }

  // Karplus-Strong: a burst of noise fed through a short damped delay sounds like a plucked string.
  private pluckBuffer(pitch: number, item: Sound) {
    const id = `${pitch}:${item.name}`;
    const cached = this.plucks.get(id);
    if (cached) return cached;
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const period = Math.max(2, Math.round(rate / mtof(pitch)));
    const length = Math.floor(rate * (item.short ? 0.7 : 2.6));
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < period; i++) {
      const random = Math.random() * 2 - 1;
      previous = item.bright < 1 ? previous * 0.55 + random * 0.45 : random;
      data[i] = previous * 0.8;
    }
    const damping = item.short ? 0.975 : Math.min(0.9985, 0.994 + item.bright * 0.003);
    for (let i = period; i < length; i++) data[i] = damping * 0.5 * (data[i - period] + data[Math.max(0, i - period - 1)]);
    for (let i = 0; i < 400; i++) data[length - 1 - i] *= i / 400;
    this.plucks.set(id, buffer);
    return buffer;
  }

  private voice(pitch: number, item: Sound, time: number, output: AudioNode, velocity = 1): Voice {
    const ctx = this.ctx!;
    pitch = Math.min(120, Math.max(12, pitch));
    const frequency = mtof(pitch);
    const sources: AudioScheduledSourceNode[] = [];
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    const amp = ctx.createGain();
    tone.connect(amp).connect(output);

    const envelope = (attack: number, peak: number, sustain: number, decay: number) => {
      amp.gain.setValueAtTime(0.0001, time);
      amp.gain.linearRampToValueAtTime(peak * velocity, time + attack);
      amp.gain.setTargetAtTime(Math.max(0.0001, sustain * velocity), time + attack, decay);
    };
    const osc = (type: OscillatorType, freq: number, level: number, detune = 0) => {
      const node = ctx.createOscillator();
      node.type = type;
      node.frequency.value = freq;
      node.detune.value = detune;
      const gain = ctx.createGain();
      gain.gain.value = level;
      node.connect(gain).connect(tone);
      node.start(time);
      sources.push(node);
      return node;
    };
    const vibrato = (rate: number, cents: number, delay: number, targets: OscillatorNode[]) => {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = rate;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, time);
      depth.gain.linearRampToValueAtTime(cents, time + delay);
      lfo.connect(depth);
      for (const target of targets) depth.connect(target.detune);
      lfo.start(time);
      sources.push(lfo);
    };

    let release = 0.2;
    let end = time + 30;
    const bright = item.bright;

    switch (item.kind) {
      case 'piano': {
        const decay = Math.min(3.4, Math.max(0.7, 3.4 - (pitch - 36) * 0.04));
        envelope(0.004, 0.42, 0.0001, decay / 4);
        tone.frequency.setValueAtTime(Math.min(14000, frequency * 6 * bright + 1200), time);
        tone.frequency.setTargetAtTime(Math.max(400, frequency * 2), time, 0.6);
        osc('triangle', frequency, 1);
        osc('sine', frequency * 2, 0.35);
        osc('sine', frequency * 3, 0.12);
        if (item.detune) osc('triangle', frequency, 0.7, item.detune);
        const hammer = ctx.createBufferSource();
        hammer.buffer = this.noise;
        const strike = ctx.createBiquadFilter();
        strike.type = 'bandpass';
        strike.frequency.value = frequency * 3;
        const strikeGain = ctx.createGain();
        strikeGain.gain.setValueAtTime(0.12 * velocity, time);
        strikeGain.gain.setTargetAtTime(0.0001, time, 0.008);
        hammer.connect(strike).connect(strikeGain).connect(amp);
        hammer.start(time);
        hammer.stop(time + 0.06);
        release = 0.25;
        end = time + decay * 1.6 + 0.3;
        break;
      }
      case 'epiano': {
        const decay = Math.min(3.2, Math.max(0.9, 3.2 - (pitch - 36) * 0.03));
        envelope(0.003, 0.36, 0.0001, decay / 4);
        tone.frequency.value = 9000;
        const carrier = osc('sine', frequency, 1);
        osc('sine', frequency * 2, 0.08);
        const modulator = ctx.createOscillator();
        modulator.frequency.value = frequency * (bright > 1.5 ? 3.5 : 1);
        const index = ctx.createGain();
        index.gain.setValueAtTime(frequency * 1.4 * bright, time);
        index.gain.setTargetAtTime(frequency * 0.1, time, 0.4);
        modulator.connect(index).connect(carrier.frequency);
        modulator.start(time);
        sources.push(modulator);
        release = 0.35;
        end = time + decay * 1.6 + 0.4;
        break;
      }
      case 'organ': {
        envelope(0.008, 0.2, 0.18, 0.05);
        tone.frequency.value = 7000;
        const stops: [number, number][] = bright > 1.5
          ? [[0.5, 0.5], [1, 1], [2, 0.7], [3, 0.25], [4, 0.5], [8, 0.3]]
          : [[1, 1], [2, 0.6], [3, 0.5], [4, 0.25], [6, 0.1]];
        const pipes = stops.map(([ratio, level]) => osc('sine', frequency * ratio, level / stops.length * 2));
        vibrato(6.2, 7, 0.01, pipes);
        release = 0.07;
        break;
      }
      case 'pluck': {
        const buffer = this.pluckBuffer(pitch, item);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(tone);
        source.start(time);
        sources.push(source);
        envelope(0.002, 0.6, 0.6, 1);
        tone.frequency.value = 5000 * bright;
        release = 0.15;
        end = time + buffer.duration;
        break;
      }
      case 'strings': {
        envelope(0.32, 0.16, 0.14, 0.4);
        tone.frequency.value = 2600 * bright;
        tone.Q.value = 0.6;
        vibrato(5.2, 9, 0.6, [osc('sawtooth', frequency, 0.6, -9), osc('sawtooth', frequency, 0.6), osc('sawtooth', frequency, 0.6, 8)]);
        release = 0.8;
        break;
      }
      case 'brass': {
        envelope(0.035, 0.24, 0.19, 0.2);
        tone.Q.value = 1.5;
        tone.frequency.setValueAtTime(350, time);
        tone.frequency.linearRampToValueAtTime(3000 * bright, time + 0.07);
        tone.frequency.setTargetAtTime(1500 * bright, time + 0.07, 0.15);
        vibrato(5.5, 6, 0.5, [osc('sawtooth', frequency, 0.7), osc('sawtooth', frequency, 0.5, 6)]);
        release = 0.14;
        break;
      }
      case 'lead': {
        envelope(0.006, 0.17, 0.14, 0.1);
        tone.frequency.value = 3800 * bright;
        tone.Q.value = 4;
        osc(item.wave ?? 'sawtooth', frequency, 0.6, -7);
        osc(item.wave ?? 'sawtooth', frequency, 0.6, 7);
        release = 0.18;
        break;
      }
      case 'pad': {
        envelope(0.65, 0.18, 0.16, 0.5);
        tone.frequency.value = 1500 * bright;
        const sweep = ctx.createOscillator();
        sweep.frequency.value = 0.25;
        const sweepDepth = ctx.createGain();
        sweepDepth.gain.value = 500 * bright;
        sweep.connect(sweepDepth).connect(tone.frequency);
        sweep.start(time);
        sources.push(sweep);
        osc('triangle', frequency, 0.6, -11);
        osc('triangle', frequency, 0.6);
        osc('triangle', frequency, 0.6, 12);
        osc('sine', frequency * 2, 0.25);
        release = 1.3;
        break;
      }
      case 'bass': {
        envelope(0.005, 0.5, 0.25, 0.25);
        tone.frequency.value = 700;
        osc('sine', frequency, 0.9);
        osc('sawtooth', frequency, 0.3);
        release = 0.08;
        break;
      }
    }

    for (const source of sources) source.stop(end);
    return {
      stop: (at: number) => {
        const gain = amp.gain;
        if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(at);
        else gain.cancelScheduledValues(at);
        gain.setTargetAtTime(0.0001, at, release / 4);
        for (const source of sources) {
          try {
            source.stop(Math.min(end, at + release * 1.6 + 0.05));
          } catch {
            // already stopped
          }
        }
      },
    };
  }
}
