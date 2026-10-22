// A 61-key arranger keyboard in the browser, modelled on the panel of a Korg Pa300.
// Tones are recorded samples: the Salamander Grand Piano (a Yamaha C5, Alexander Holm, CC BY 3.0) and the
// FluidR3 GM soundfont (CC BY 3.0), served from /samples and loaded only when the piano opens or a sound is picked.
// Drums, and any note played before its samples finish loading, are synthesised with the Web Audio API.

export const LOW = 36; // C2
export const HIGH = 96; // C7, 61 keys
export const SPLIT = 60; // middle C: keys below it set the chord while a style runs

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

// Sample banks: every minor third, as recorded.
type Bank = { path: string; files: [string, number][]; loop: boolean; release: number; level: number };
const thirds = (names: [string, string, string, string]) => {
  const files: [string, number][] = [];
  for (let octave = 0; octave <= 8; octave++) {
    names.forEach((name, index) => {
      const midi = 12 * (octave + 1) + index * 3;
      if (midi >= 21 && midi <= 108) files.push([`${name}${octave}`, midi]);
    });
  }
  return files;
};
const salamanderFiles = thirds(['C', 'Ds', 'Fs', 'A']);
const fluidFiles = thirds(['C', 'Eb', 'Gb', 'A']).filter(([, midi]) => midi >= 24);
const fluid = (name: string, loop: boolean, release: number, level = 1): Bank => ({ path: `/samples/fluidr3/${name}/`, files: fluidFiles, loop, release, level });

const BANKS: Record<string, Bank> = {
  salamander: { path: '/samples/salamander/', files: salamanderFiles, loop: false, release: 0.32, level: 1.1 },
  honkytonk: fluid('honkytonk_piano', false, 0.3),
  tine: fluid('electric_piano_1', false, 0.4),
  fm: fluid('electric_piano_2', false, 0.4),
  drawbar: fluid('drawbar_organ', true, 0.08, 0.8),
  church: fluid('church_organ', true, 0.5, 0.8),
  nylon: fluid('acoustic_guitar_nylon', false, 0.3),
  steel: fluid('acoustic_guitar_steel', false, 0.3),
  strings: fluid('string_ensemble_1', true, 0.6, 0.9),
  pizzicato: fluid('pizzicato_strings', false, 0.2),
  brass: fluid('brass_section', true, 0.2, 0.8),
  horn: fluid('french_horn', true, 0.3, 0.9),
  saw: fluid('lead_2_sawtooth', true, 0.2, 0.6),
  square: fluid('lead_1_square', true, 0.2, 0.6),
  pad: fluid('pad_2_warm', true, 1.2, 0.9),
  choir: fluid('choir_aahs', true, 0.8, 0.9),
  bass: fluid('electric_bass_finger', false, 0.1, 1.1),
};

type Kind = 'piano' | 'epiano' | 'organ' | 'pluck' | 'strings' | 'brass' | 'lead' | 'pad' | 'bass';
export type Sound = { category: string; name: string; bank: string; kind: Kind; bright?: boolean };

export const categories = ['Piano', 'E.Piano', 'Organ', 'Guitar', 'Strings', 'Brass', 'Synth', 'Pad'];

export const sounds: Sound[] = [
  { category: 'Piano', name: 'Grand Piano', bank: 'salamander', kind: 'piano' },
  { category: 'Piano', name: 'Bright Grand', bank: 'salamander', kind: 'piano', bright: true },
  { category: 'Piano', name: 'Honky-Tonk', bank: 'honkytonk', kind: 'piano' },
  { category: 'E.Piano', name: 'Tine E.Piano', bank: 'tine', kind: 'epiano' },
  { category: 'E.Piano', name: 'FM E.Piano', bank: 'fm', kind: 'epiano' },
  { category: 'Organ', name: 'Drawbar Organ', bank: 'drawbar', kind: 'organ' },
  { category: 'Organ', name: 'Church Organ', bank: 'church', kind: 'organ' },
  { category: 'Guitar', name: 'Nylon Guitar', bank: 'nylon', kind: 'pluck' },
  { category: 'Guitar', name: 'Steel Guitar', bank: 'steel', kind: 'pluck' },
  { category: 'Strings', name: 'String Ensemble', bank: 'strings', kind: 'strings' },
  { category: 'Strings', name: 'Pizzicato', bank: 'pizzicato', kind: 'pluck' },
  { category: 'Brass', name: 'Brass Section', bank: 'brass', kind: 'brass' },
  { category: 'Brass', name: 'French Horn', bank: 'horn', kind: 'brass' },
  { category: 'Synth', name: 'Saw Lead', bank: 'saw', kind: 'lead' },
  { category: 'Synth', name: 'Square Lead', bank: 'square', kind: 'lead' },
  { category: 'Pad', name: 'Warm Pad', bank: 'pad', kind: 'pad' },
  { category: 'Pad', name: 'Choir Aahs', bank: 'choir', kind: 'pad' },
];

const sound = (name: string) => sounds.find((item) => item.name === name) ?? sounds[0];
const BASS: Sound = { category: 'Bass', name: 'Finger Bass', bank: 'bass', kind: 'bass' };

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
const quarters = [0, 4, 8, 12];
const sixteenths = Array.from({ length: 16 }, (_, step) => step);

export const styles: Style[] = [
  {
    name: '8Beat Pop', tempo: 100, kick: [0, 6, 8], snare: [4, 12], hat: eighths,
    bass: [[0, 0, 3], [6, 0, 2], [8, 7, 3], [14, 12, 2]], comp: [[0, 3], [4, 3], [8, 3], [12, 3]], compSound: sound('Tine E.Piano'),
  },
  {
    name: 'Slow Ballad', tempo: 72, kick: [0, 10], snare: [8], hat: eighths,
    bass: [[0, 0, 8], [8, 7, 6], [14, 0, 2]], comp: [[0, 16]], compSound: sound('String Ensemble'),
  },
  {
    name: 'Bossa Nova', tempo: 128, kick: [0, 3, 4, 8, 11, 12], snare: [], hat: eighths, rim: [0, 3, 6, 10, 12],
    bass: [[0, 0, 3], [3, 7, 1], [4, 7, 4], [8, 0, 3], [11, 7, 1], [12, 7, 4]], comp: [[0, 2], [3, 2], [6, 2], [10, 2], [12, 2]], compSound: sound('Nylon Guitar'),
  },
  {
    name: 'Classic Rock', tempo: 118, kick: [0, 3, 8, 10], snare: [4, 12], hat: eighths, open: [14],
    bass: eighths.map((step) => [step, 0, 2] as [number, number, number]), comp: [[0, 6], [8, 6]], compSound: sound('Drawbar Organ'),
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

// J. S. Bach, Prelude in C major, BWV 846 (public domain), bars 1 to 19: each bar is five notes, low to high,
// played as Bach wrote it: low, middle, then the upper three twice, and the whole pattern twice per bar.
const n = (name: string) => {
  const match = name.match(/^([A-G])(#|b)?(\d)$/)!;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1] as 'C'];
  return 12 * (Number(match[3]) + 1) + base + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
};
const PRELUDE = [
  'C4 E4 G4 C5 E5', 'C4 D4 A4 D5 F5', 'B3 D4 G4 D5 F5', 'C4 E4 G4 C5 E5', 'C4 E4 A4 E5 A5', 'C4 D4 F#4 A4 D5',
  'B3 D4 G4 D5 G5', 'B3 C4 E4 G4 C5', 'A3 C4 E4 G4 C5', 'D3 A3 D4 F#4 C5', 'G3 B3 D4 G4 B4', 'G3 Bb3 E4 G4 C#5',
  'F3 A3 D4 A4 D5', 'F3 Ab3 D4 F4 B4', 'E3 G3 C4 G4 C5', 'E3 F3 A3 C4 F4', 'D3 F3 A3 C4 F4', 'G2 D3 G3 B3 F4', 'C3 E3 G3 C4 E4',
].map((bar) => bar.split(' ').map(n));
const PRELUDE_FIGURE = [0, 1, 2, 3, 4, 2, 3, 4];
const PRELUDE_END = ['C2', 'C3', 'G3', 'C4', 'E4', 'G4', 'C5'].map(n);

type Voice = { stop: (time: number) => void };
type Playing = { voice: Voice; sources: AudioBufferSourceNode[] };

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
  pedal = false;
  bend = 0;
  variation = 2;
  running = false;
  recital = false;
  intro = false;
  measure = 0;
  beat = 0;
  loading = '';
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
  private banks = new Map<string, Map<number, AudioBuffer>>();
  private bankLoads = new Map<string, Promise<void>>();
  private held = new Map<number, Playing>();
  private down = new Set<number>();
  private left = new Set<number>();
  private live = new Set<AudioBufferSourceNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private recitalStep = 0;
  private savedTempo = 0;
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
    const ctx = new Context({ latencyHint: 'interactive' });
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.master.connect(limiter).connect(this.analyser).connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(2.6);
    this.wet = ctx.createGain();
    this.wet.gain.value = this.reverb ? 0.22 : 0;
    reverb.connect(this.wet).connect(this.master);

    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    this.bus.connect(reverb);
    this.accompaniment = ctx.createGain();
    this.accompaniment.gain.value = 0.55;
    this.accompaniment.connect(this.bus);
    this.drums = ctx.createGain();
    this.drums.gain.value = 0.6;
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
    this.banks.clear();
    this.bankLoads.clear();
  }

  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.meterData);
    let sum = 0;
    for (const value of this.meterData) sum += value * value;
    return Math.sqrt(sum / this.meterData.length);
  }

  // Samples

  load(bankId: string) {
    if (!this.init() || !this.ctx) return Promise.resolve();
    const existing = this.bankLoads.get(bankId);
    if (existing) return existing;
    const ctx = this.ctx;
    const bank = BANKS[bankId];
    const buffers = new Map<number, AudioBuffer>();
    let done = 0;
    const promise = Promise.all(
      bank.files.map(async ([file, midi]) => {
        try {
          const response = await fetch(`${bank.path}${file}.mp3`);
          buffers.set(midi, await ctx.decodeAudioData(await response.arrayBuffer()));
        } catch {
          // a missing sample falls back to its neighbours
        }
        done++;
        if (done % 6 === 0 || done === bank.files.length) {
          this.loading = done === bank.files.length ? '' : `LOADING ${done}/${bank.files.length}`;
          this.onChange();
        }
      }),
    ).then(() => {
      this.banks.set(bankId, buffers);
    });
    this.loading = `LOADING 0/${bank.files.length}`;
    this.bankLoads.set(bankId, promise);
    this.onChange();
    return promise;
  }

  private sampled(pitch: number, item: Sound, time: number, output: AudioNode, velocity: number): Playing | null {
    const buffers = this.banks.get(item.bank);
    if (!buffers?.size || !this.ctx) return null;
    const ctx = this.ctx;
    const bank = BANKS[item.bank];
    let nearest = -1;
    for (const midi of buffers.keys()) if (nearest < 0 || Math.abs(midi - pitch) < Math.abs(nearest - pitch)) nearest = midi;
    const buffer = buffers.get(nearest)!;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 2 ** ((pitch - nearest) / 12);
    source.detune.value = this.bend * 100;
    if (bank.loop && buffer.duration > 2.5) {
      source.loop = true;
      source.loopStart = 1.0;
      source.loopEnd = 2.3;
    }

    // Soft notes are darker as well as quieter, as on an acoustic piano.
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = item.kind === 'piano' ? 1400 + velocity * velocity * 17000 : 18000;
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 3000;
    shelf.gain.value = item.bright ? 7 : 0;
    const amp = ctx.createGain();
    const level = bank.level * (0.18 + 0.82 * velocity * velocity) * 0.6;
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(level, time + 0.004);
    source.connect(tone).connect(shelf).connect(amp).connect(output);
    source.start(time);
    this.live.add(source);
    source.onended = () => this.live.delete(source);

    const release = bank.release;
    return {
      sources: [source],
      voice: {
        stop: (at: number) => {
          const gain = amp.gain;
          if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(at);
          else gain.cancelScheduledValues(at);
          gain.setTargetAtTime(0, at, release / 4);
          try {
            source.stop(at + release * 2 + 0.05);
          } catch {
            // already stopped
          }
        },
      },
    };
  }

  private play(pitch: number, item: Sound, time: number, output: AudioNode, velocity = 0.8): Playing {
    pitch = Math.min(108, Math.max(21, pitch));
    const sampled = this.sampled(pitch, item, time, output, velocity);
    if (sampled) return sampled;
    void this.load(item.bank);
    return { voice: this.synth(pitch, item.kind, time, output, velocity), sources: [] };
  }

  // Keys and controllers

  noteOn(key: number, velocity = 0.8) {
    if (!this.init() || !this.ctx) return;
    const time = this.ctx.currentTime;
    if (this.running && !this.recital && key < SPLIT) {
      this.left.add(key);
      this.chord = detectChord([...this.left]) ?? this.chord;
      this.onNote(key, true);
      this.onChange();
      return;
    }
    this.held.get(key)?.voice.stop(time);
    this.down.add(key);
    this.held.set(key, this.play(key + this.transpose + this.octave * 12, this.sound, time, this.bus, velocity));
    this.onNote(key, true);
  }

  noteOff(key: number) {
    this.onNote(key, false);
    if (this.left.delete(key)) return;
    this.down.delete(key);
    if (this.pedal) return;
    const playing = this.held.get(key);
    if (playing && this.ctx) playing.voice.stop(this.ctx.currentTime);
    this.held.delete(key);
  }

  setPedal(down: boolean) {
    if (this.pedal === down) return;
    this.pedal = down;
    if (!down && this.ctx) {
      for (const [key, playing] of this.held) {
        if (this.down.has(key)) continue;
        playing.voice.stop(this.ctx.currentTime);
        this.held.delete(key);
      }
    }
    this.onChange();
  }

  setBend(semitones: number) {
    this.bend = semitones;
    if (this.ctx) for (const source of this.live) source.detune.setTargetAtTime(semitones * 100, this.ctx.currentTime, 0.01);
  }

  releaseAll() {
    this.setPedal(false);
    for (const key of [...this.held.keys(), ...this.left]) this.noteOff(key);
  }

  chime() {
    if (!this.init() || !this.ctx) return;
    void this.load(this.sound.bank).then(() => {
      if (!this.ctx) return;
      const start = this.ctx.currentTime + 0.05;
      [48, 55, 60, 64, 67, 72, 76, 79, 84].forEach((note, index) => {
        const time = start + index * 0.075;
        this.play(note, sounds[0], time, this.bus, 0.55 + index * 0.03).voice.stop(time + 2.4);
      });
    });
  }

  // Panel

  selectCategory(category: string) {
    const options = sounds.map((item, index) => [item, index] as const).filter(([item]) => item.category === category);
    const position = options.findIndex(([, index]) => index === this.soundIndex);
    this.soundIndex = options[(position + 1) % options.length][1];
    void this.load(this.sound.bank);
    this.onChange();
  }

  selectStyle(index: number) {
    this.styleIndex = index;
    if (!this.running) this.tempo = styles[index].tempo;
    void this.load(styles[index].compSound.bank);
    this.onChange();
  }

  setVariation(variation: number) {
    this.variation = variation;
    this.onChange();
  }

  changeTempo(delta: number) {
    this.tempo = Math.min(240, Math.max(40, Math.round(this.tempo + delta)));
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
    if (this.ctx) this.wet.gain.setTargetAtTime(this.reverb ? 0.22 : 0, this.ctx.currentTime, 0.05);
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

  startStyle(withIntro = false) {
    if (!this.init()) return;
    if (this.recital) this.stopStyle();
    void this.load(BASS.bank);
    void this.load(this.style.compSound.bank);
    this.running = true;
    this.intro = withIntro;
    this.fillNext = this.inFill = this.endNext = this.crashNext = false;
    this.startClock(true);
    this.onChange();
  }

  stopStyle() {
    if (this.recital) this.tempo = this.savedTempo;
    this.running = false;
    this.recital = false;
    this.intro = false;
    this.left.clear();
    if (!this.metronome) this.stopClock();
    this.measure = this.beat = 0;
    this.onChange();
  }

  fill() {
    if (this.running && !this.recital) this.fillNext = true;
  }

  ending() {
    if (this.running) this.endNext = true;
  }

  playRecital() {
    if (this.running) this.stopStyle();
    if (!this.init()) return;
    this.soundIndex = 0;
    void this.load('salamander').then(() => {
      this.savedTempo = this.tempo;
      this.tempo = 66;
      this.recital = true;
      this.running = true;
      this.recitalStep = 0;
      this.endNext = false;
      this.startClock(true);
      this.onChange();
    });
    this.onChange();
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
    this.nextTime = this.ctx.currentTime + 0.1;
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
    if (this.recital) return this.playRecitalStep(step, time);
    if (step === 0) {
      this.measure++;
      if (this.running) {
        if (this.endNext) return this.playEnding(time);
        if (this.intro && this.measure > 1) {
          this.intro = false;
          this.later(time, () => this.onChange());
        }
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
    if (this.intro) {
      if (step % 4 === 0) this.sticks(time);
      return;
    }

    const style = this.style;
    const variation = this.variation;
    if (this.inFill && step >= 8) {
      if (step === 8) this.kick(time, 1);
      this.tom(time, 230 - (step - 8) * 14, step % 2 ? 0.55 : 0.8);
      if (step === 15) this.crashNext = true;
    } else {
      const kicks = variation === 4 ? [...style.kick, 10, 14] : style.kick;
      const hats = variation === 1 ? quarters : variation >= 3 ? sixteenths : style.hat;
      if (kicks.includes(step)) this.kick(time, step % 8 === 0 ? 1 : 0.8);
      if (style.snare.includes(step)) this.snare(time, variation === 1 ? 0.6 : 0.9);
      if (variation > 1 && style.rim?.includes(step)) this.rim(time);
      if (hats.includes(step)) this.hat(time, step % 4 === 0 ? 0.6 : step % 2 === 0 ? 0.42 : 0.26, Boolean(style.open?.includes(step)) || (variation === 4 && step === 6));
    }

    const root = this.chord.root;
    for (const [at, interval, length] of style.bass) {
      if (at !== step || (variation === 1 && at % 8 !== 0)) continue;
      this.play(36 + root + interval, BASS, time, this.accompaniment, 0.85).voice.stop(time + length * this.stepTime * 0.92);
    }
    for (const [at, length] of style.comp) {
      if (at !== step || (variation === 1 && at % 8 !== 0)) continue;
      const notes = variation === 4 ? [...voicing(this.chord), voicing(this.chord)[0] + 12] : voicing(this.chord);
      for (const note of notes) this.play(note, style.compSound, time, this.accompaniment, 0.6).voice.stop(time + length * this.stepTime * 0.9);
    }
  }

  private playRecitalStep(step: number, time: number) {
    if (step === 0) {
      this.measure++;
      this.later(time, () => this.onChange());
    }
    if (step % 4 === 0) {
      this.beat = step / 4 + 1;
      this.later(time, () => this.onBeat());
    }
    const bar = Math.floor(this.recitalStep / 16);
    const at = this.recitalStep % 16;
    this.recitalStep++;
    if (bar === PRELUDE.length) {
      if (at === 0) {
        PRELUDE_END.forEach((note, index) => this.recitalNote(note, time + index * 0.06, this.stepTime * 24, 0.5 + index * 0.04));
        this.later(time + this.stepTime * 24, () => this.stopStyle());
        this.stopClock();
      }
      return;
    }
    const notes = PRELUDE[bar];
    const figure = PRELUDE_FIGURE[at % 8];
    const length = figure === 0 ? 16 - at : figure === 1 ? 15 - at : 2.2;
    const velocity = (figure === 0 ? 0.6 : figure === 1 ? 0.5 : 0.42 + (at % 8 === 2 ? 0.08 : 0)) * (0.92 + Math.sin(bar / 3) * 0.08);
    if (figure > 1 || at === figure || at === figure + 8) this.recitalNote(notes[figure], time, length * this.stepTime, velocity);
  }

  private recitalNote(note: number, time: number, length: number, velocity: number) {
    const playing = this.play(note + this.transpose, sounds[0], time, this.bus, velocity);
    playing.voice.stop(time + length);
    this.later(time, () => this.onNote(note, true));
    this.later(time + Math.min(length, 0.5), () => this.onNote(note, false));
  }

  private playEnding(time: number) {
    this.crash(time);
    this.kick(time, 1);
    const length = this.stepTime * 8;
    this.play(36 + this.chord.root, BASS, time, this.accompaniment, 0.85).voice.stop(time + length);
    for (const note of voicing(this.chord)) this.play(note, this.style.compSound, time, this.accompaniment, 0.6).voice.stop(time + length);
    this.running = false;
    this.endNext = false;
    this.left.clear();
    if (!this.metronome) this.stopClock();
    this.later(time + length, () => {
      this.measure = this.beat = 0;
      this.onChange();
    });
  }

  // Drums (synthesised)

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
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.1);
    osc.connect(this.hit(time, velocity, 0.34));
    osc.start(time);
    osc.stop(time + 0.36);
    this.noiseBurst(time, 'lowpass', 2500, velocity * 0.08, 0.012);
  }

  private snare(time: number, velocity: number) {
    this.noiseBurst(time, 'bandpass', 2200, velocity * 0.55, 0.17);
    this.noiseBurst(time, 'highpass', 4500, velocity * 0.2, 0.09);
    const body = this.ctx!.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(220, time);
    body.frequency.exponentialRampToValueAtTime(170, time + 0.05);
    body.connect(this.hit(time, velocity * 0.35, 0.08));
    body.start(time);
    body.stop(time + 0.1);
  }

  private hat(time: number, velocity: number, open: boolean) {
    this.noiseBurst(time, 'highpass', 8000, velocity * 0.28, open ? 0.32 : 0.045);
  }

  private rim(time: number) {
    this.noiseBurst(time, 'bandpass', 3200, 0.25, 0.025);
  }

  private sticks(time: number) {
    this.noiseBurst(time, 'bandpass', 2600, 0.35, 0.03);
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
    this.noiseBurst(time, 'highpass', 5000, 0.3, 1.6);
  }

  private click(time: number, accent: boolean) {
    const osc = this.ctx!.createOscillator();
    osc.frequency.value = accent ? 1600 : 1000;
    osc.connect(this.hit(time, 0.3, 0.03));
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.5;
    }
    return buffer;
  }

  // Fallback tone while a sample bank is still loading.
  private synth(pitch: number, kind: Kind, time: number, output: AudioNode, velocity: number): Voice {
    const ctx = this.ctx!;
    const frequency = mtof(pitch);
    const sustained = ['organ', 'strings', 'brass', 'lead', 'pad'].includes(kind);
    const osc = ctx.createOscillator();
    osc.type = kind === 'lead' || kind === 'brass' || kind === 'strings' ? 'sawtooth' : 'triangle';
    osc.frequency.value = frequency;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(9000, frequency * 6);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(0.25 * velocity, time + 0.005);
    amp.gain.setTargetAtTime(sustained ? 0.15 * velocity : 0.0001, time + 0.005, sustained ? 0.2 : 0.6);
    osc.connect(tone).connect(amp).connect(output);
    osc.start(time);
    osc.stop(time + 20);
    return {
      stop: (at: number) => {
        amp.gain.cancelScheduledValues(at);
        amp.gain.setTargetAtTime(0, at, 0.06);
        try {
          osc.stop(at + 0.4);
        } catch {
          // already stopped
        }
      },
    };
  }
}
