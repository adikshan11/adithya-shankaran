// A 61-key arranger keyboard in the browser, modelled on the panel of a Korg Pa300.
// Tones are recorded samples: the Salamander Grand Piano (a Yamaha C5, Alexander Holm, CC BY 3.0) and the
// FluidR3 GM soundfont (CC BY 3.0), served from /samples and loaded only when the piano opens or a sound is picked,
// middle octaves first. Drums, tabla, and any note played before its samples arrive are synthesised with the Web Audio API.
import { parseMidi } from './midi';
import type { Note } from './midi';
import type { Song } from './songs';

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

// Computer keyboard, two rows, one key per note, by physical key position (event.code) so any layout works.
// Bottom row: Z X C V B N M are the white keys of one octave from the base C, with S D and G H J as its black keys,
// laid out like a real keyboard. Top row: Q W E R T Y U I O P [ ] are the white keys from the next C up, with
// 2 3, 5 6 7, 9 0 and = as its black keys. Together they reach 32 notes. [code, offset, label]
export const PC_KEYS: [string, number, string][] = [
  ['KeyZ', 0, 'Z'], ['KeyS', 1, 'S'], ['KeyX', 2, 'X'], ['KeyD', 3, 'D'], ['KeyC', 4, 'C'], ['KeyV', 5, 'V'], ['KeyG', 6, 'G'],
  ['KeyB', 7, 'B'], ['KeyH', 8, 'H'], ['KeyN', 9, 'N'], ['KeyJ', 10, 'J'], ['KeyM', 11, 'M'],
  ['KeyQ', 12, 'Q'], ['Digit2', 13, '2'], ['KeyW', 14, 'W'], ['Digit3', 15, '3'], ['KeyE', 16, 'E'], ['KeyR', 17, 'R'], ['Digit5', 18, '5'],
  ['KeyT', 19, 'T'], ['Digit6', 20, '6'], ['KeyY', 21, 'Y'], ['Digit7', 22, '7'], ['KeyU', 23, 'U'], ['KeyI', 24, 'I'], ['Digit9', 25, '9'],
  ['KeyO', 26, 'O'], ['Digit0', 27, '0'], ['KeyP', 28, 'P'], ['BracketLeft', 29, '['], ['Equal', 30, '='], ['BracketRight', 31, ']'],
];
export const PC_KEY_OFFSET = Object.fromEntries(PC_KEYS.map(([code, offset]) => [code, offset]));
// The arrow keys move the base note an octave at a time, from C2 (the lowest key) to C5; keys that would land above C7 stay silent.
export const PC_BASE_MIN = 36;
export const PC_BASE_MAX = 72;

// Sample banks: every minor third, as recorded.
type Bank = { path: string; files: [string, number][]; loop: boolean; release: number };
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
const fluidMid = fluidFiles.filter(([, midi]) => midi >= 36 && midi <= 96);
const fluid = (name: string, loop: boolean, release: number, files = fluidFiles): Bank => ({ path: `/samples/fluidr3/${name}/`, files, loop, release });

const BANKS: Record<string, Bank> = {
  salamander: { path: '/samples/salamander/', files: salamanderFiles, loop: false, release: 0.32 },
  bright: fluid('bright_acoustic_piano', false, 0.3),
  honkytonk: fluid('honkytonk_piano', false, 0.3),
  tine: fluid('electric_piano_1', false, 0.4),
  fm: fluid('electric_piano_2', false, 0.4),
  drawbar: fluid('drawbar_organ', true, 0.08),
  church: fluid('church_organ', true, 0.5),
  nylon: fluid('acoustic_guitar_nylon', false, 0.3),
  steel: fluid('acoustic_guitar_steel', false, 0.3),
  strings: fluid('string_ensemble_1', true, 0.6),
  pizzicato: fluid('pizzicato_strings', false, 0.2),
  brass: fluid('brass_section', true, 0.2),
  horn: fluid('french_horn', true, 0.3),
  saw: fluid('lead_2_sawtooth', true, 0.2),
  square: fluid('lead_1_square', true, 0.2),
  pad: fluid('pad_2_warm', true, 1.2),
  choir: fluid('choir_aahs', true, 0.8),
  bass: fluid('electric_bass_finger', false, 0.1),
  accordion: fluid('accordion', true, 0.12, fluidMid),
  violin: fluid('violin', true, 0.3, fluidMid),
  cello: fluid('cello', true, 0.35, fluidMid),
  harp: fluid('orchestral_harp', false, 0.6, fluidMid),
  trumpet: fluid('trumpet', true, 0.15, fluidMid),
  flute: fluid('flute', true, 0.2, fluidMid),
  clarinet: fluid('clarinet', true, 0.15, fluidMid),
  sax: fluid('alto_sax', true, 0.15, fluidMid),
  harmonica: fluid('harmonica', true, 0.12, fluidMid),
  vibes: fluid('vibraphone', false, 0.8, fluidMid),
  marimba: fluid('marimba', false, 0.3, fluidMid),
  sitar: fluid('sitar', false, 0.6, fluidMid),
  shehnai: fluid('shanai', true, 0.15, fluidMid),
  santoor: fluid('dulcimer', false, 0.5, fluidMid),
  koto: fluid('koto', false, 0.4, fluidMid),
};

type Kind = 'piano' | 'epiano' | 'organ' | 'pluck' | 'strings' | 'brass' | 'lead' | 'pad' | 'bass';
export type Sound = { category: string; name: string; bank: string; kind: Kind; bright?: boolean };

export const categories = ['Piano', 'E.Piano', 'Organ', 'Guitar', 'Strings', 'Brass', 'Woodwind', 'Mallet', 'Ethnic', 'Synth', 'Pad', 'Bass'];

export const sounds: Sound[] = [
  { category: 'Piano', name: 'Grand Piano', bank: 'salamander', kind: 'piano' },
  { category: 'Piano', name: 'Bright Piano', bank: 'bright', kind: 'piano', bright: true },
  { category: 'Piano', name: 'Honky-Tonk', bank: 'honkytonk', kind: 'piano' },
  { category: 'E.Piano', name: 'Tine E.Piano', bank: 'tine', kind: 'epiano' },
  { category: 'E.Piano', name: 'FM E.Piano', bank: 'fm', kind: 'epiano' },
  { category: 'Organ', name: 'Drawbar Organ', bank: 'drawbar', kind: 'organ' },
  { category: 'Organ', name: 'Church Organ', bank: 'church', kind: 'organ' },
  { category: 'Organ', name: 'Accordion', bank: 'accordion', kind: 'organ' },
  { category: 'Guitar', name: 'Nylon Guitar', bank: 'nylon', kind: 'pluck' },
  { category: 'Guitar', name: 'Steel Guitar', bank: 'steel', kind: 'pluck' },
  { category: 'Strings', name: 'String Ensemble', bank: 'strings', kind: 'strings' },
  { category: 'Strings', name: 'Violin', bank: 'violin', kind: 'strings' },
  { category: 'Strings', name: 'Cello', bank: 'cello', kind: 'strings' },
  { category: 'Strings', name: 'Pizzicato', bank: 'pizzicato', kind: 'pluck' },
  { category: 'Strings', name: 'Concert Harp', bank: 'harp', kind: 'pluck' },
  { category: 'Brass', name: 'Brass Section', bank: 'brass', kind: 'brass' },
  { category: 'Brass', name: 'Trumpet', bank: 'trumpet', kind: 'brass' },
  { category: 'Brass', name: 'French Horn', bank: 'horn', kind: 'brass' },
  { category: 'Woodwind', name: 'Flute', bank: 'flute', kind: 'lead' },
  { category: 'Woodwind', name: 'Clarinet', bank: 'clarinet', kind: 'lead' },
  { category: 'Woodwind', name: 'Alto Sax', bank: 'sax', kind: 'lead' },
  { category: 'Woodwind', name: 'Harmonica', bank: 'harmonica', kind: 'lead' },
  { category: 'Mallet', name: 'Vibraphone', bank: 'vibes', kind: 'pluck' },
  { category: 'Mallet', name: 'Marimba', bank: 'marimba', kind: 'pluck' },
  { category: 'Ethnic', name: 'Sitar', bank: 'sitar', kind: 'pluck' },
  { category: 'Ethnic', name: 'Shehnai', bank: 'shehnai', kind: 'lead' },
  { category: 'Ethnic', name: 'Santoor', bank: 'santoor', kind: 'pluck' },
  { category: 'Ethnic', name: 'Koto', bank: 'koto', kind: 'pluck' },
  { category: 'Synth', name: 'Saw Lead', bank: 'saw', kind: 'lead' },
  { category: 'Synth', name: 'Square Lead', bank: 'square', kind: 'lead' },
  { category: 'Pad', name: 'Warm Pad', bank: 'pad', kind: 'pad' },
  { category: 'Pad', name: 'Choir Aahs', bank: 'choir', kind: 'pad' },
  { category: 'Bass', name: 'Finger Bass', bank: 'bass', kind: 'bass' },
];

export const soundNamed = (name: string) => sounds.find((item) => item.name === name) ?? sounds[0];
const sound = soundNamed;
const BASS = sound('Finger Bass');

// Each bar has `steps` sixteenth steps (16 for 4/4, 12 for 3/4 and 6/8). Bass entries are [step, interval from the chord
// root, length in steps]; comp entries are [step, length]. `swing` delays the off-beat eighths; `tabla` lists [step, bol].
type Bol = 'dha' | 'dhin' | 'ge' | 'na' | 'tin' | 'ka' | 'ti';
export type Style = {
  name: string;
  category: string;
  tempo: number;
  steps: number;
  beatSteps: number;
  swing?: number;
  kick: number[];
  snare: number[];
  hat: number[];
  open?: number[];
  rim?: number[];
  tabla?: [number, Bol][];
  bass: [number, number, number][];
  comp: [number, number][];
  compSound: Sound;
};

const eighths = [0, 2, 4, 6, 8, 10, 12, 14];
const quarters = [0, 4, 8, 12];
const sixteenths = Array.from({ length: 16 }, (_, step) => step);
const four = { steps: 16, beatSteps: 4 };

export const styleCategories = ['Pop', 'Ballad', 'Rock', 'Dance', 'Jazz', 'Latin', 'World', 'Indian'];

export const styles: Style[] = [
  {
    name: '8Beat Pop', category: 'Pop', tempo: 100, ...four, kick: [0, 6, 8], snare: [4, 12], hat: eighths,
    bass: [[0, 0, 3], [6, 0, 2], [8, 7, 3], [14, 12, 2]], comp: [[0, 3], [4, 3], [8, 3], [12, 3]], compSound: sound('Tine E.Piano'),
  },
  {
    name: '16Beat Pop', category: 'Pop', tempo: 94, ...four, kick: [0, 7, 8, 10], snare: [4, 12], hat: sixteenths,
    bass: [[0, 0, 2], [3, 0, 1], [6, 0, 2], [8, 7, 2], [10, 7, 2], [14, 12, 2]], comp: [[0, 2], [3, 2], [6, 2], [8, 2], [11, 2], [14, 2]], compSound: sound('Steel Guitar'),
  },
  {
    name: 'Slow Ballad', category: 'Ballad', tempo: 72, ...four, kick: [0, 10], snare: [8], hat: eighths,
    bass: [[0, 0, 8], [8, 7, 6], [14, 0, 2]], comp: [[0, 16]], compSound: sound('String Ensemble'),
  },
  {
    name: 'Viennese Waltz', category: 'Ballad', tempo: 150, steps: 12, beatSteps: 4, kick: [0], snare: [], hat: [4, 8],
    bass: [[0, 0, 4]], comp: [[4, 3], [8, 3]], compSound: sound('Grand Piano'),
  },
  {
    name: 'Classic Rock', category: 'Rock', tempo: 118, ...four, kick: [0, 3, 8, 10], snare: [4, 12], hat: eighths, open: [14],
    bass: eighths.map((step) => [step, 0, 2] as [number, number, number]), comp: [[0, 6], [8, 6]], compSound: sound('Drawbar Organ'),
  },
  {
    name: 'Disco', category: 'Dance', tempo: 120, ...four, kick: quarters, snare: [4, 12], hat: eighths, open: [2, 6, 10, 14],
    bass: eighths.map((step, index) => [step, index % 2 ? 12 : 0, 1] as [number, number, number]), comp: [[2, 1], [6, 1], [10, 1], [14, 1]], compSound: sound('String Ensemble'),
  },
  {
    name: 'Funk', category: 'Dance', tempo: 100, ...four, kick: [0, 3, 6, 10], snare: [4, 12], rim: [7, 9, 15], hat: sixteenths,
    bass: [[0, 0, 1], [3, 12, 1], [6, 0, 1], [7, 10, 1], [10, 7, 1], [13, 0, 1]], comp: [[2, 1], [5, 1], [9, 1], [13, 1]], compSound: sound('Tine E.Piano'),
  },
  {
    name: 'Swing Jazz', category: 'Jazz', tempo: 140, ...four, swing: 0.34, kick: [0, 8], snare: [], hat: [0, 4, 6, 8, 12, 14], rim: [4, 12],
    bass: [[0, 0, 4], [4, 4, 4], [8, 7, 4], [12, 9, 4]], comp: [[6, 2], [12, 3]], compSound: sound('Grand Piano'),
  },
  {
    name: 'Bossa Nova', category: 'Latin', tempo: 128, ...four, kick: [0, 3, 4, 8, 11, 12], snare: [], hat: eighths, rim: [0, 3, 6, 10, 12],
    bass: [[0, 0, 3], [3, 7, 1], [4, 7, 4], [8, 0, 3], [11, 7, 1], [12, 7, 4]], comp: [[0, 2], [3, 2], [6, 2], [10, 2], [12, 2]], compSound: sound('Nylon Guitar'),
  },
  {
    name: 'Reggae One Drop', category: 'World', tempo: 76, ...four, kick: [8], snare: [], rim: [8], hat: eighths,
    bass: [[0, 0, 3], [6, 7, 2], [10, 0, 2]], comp: [[4, 1], [12, 1]], compSound: sound('Drawbar Organ'),
  },
  {
    name: 'Bhangra', category: 'World', tempo: 160, ...four, kick: [0, 3, 6, 8, 11, 14], snare: [4, 12], hat: eighths,
    bass: [[0, 0, 2], [3, 0, 2], [6, 7, 2], [8, 0, 2], [11, 0, 2], [14, 7, 2]], comp: [[0, 2], [3, 2], [8, 2], [11, 2]], compSound: sound('Sitar'),
  },
  {
    name: 'Keherwa (8 beats)', category: 'Indian', tempo: 84, steps: 16, beatSteps: 2, kick: [], snare: [], hat: [],
    tabla: [[0, 'dha'], [2, 'ge'], [4, 'na'], [6, 'tin'], [8, 'na'], [10, 'ka'], [12, 'dhin'], [14, 'na']],
    bass: [[0, 0, 4], [8, 7, 4]], comp: [[0, 4], [6, 2], [8, 4], [14, 2]], compSound: sound('Accordion'),
  },
  {
    name: 'Dadra (6 beats)', category: 'Indian', tempo: 90, steps: 12, beatSteps: 2, kick: [], snare: [], hat: [],
    tabla: [[0, 'dha'], [2, 'dhin'], [4, 'na'], [6, 'dha'], [8, 'tin'], [10, 'na']],
    bass: [[0, 0, 4], [6, 7, 4]], comp: [[0, 6], [6, 6]], compSound: sound('Accordion'),
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

// Every sample set was recorded at its own level, so each bank is scaled to the same loudness: the RMS of the first
// 1.5 seconds of its middle sample (the first one loaded) is brought to a common target. The target keeps the grand
// piano where it was (its middle C measures 0.039) and lifts quieter sets, such as honky-tonk at 0.011, to match.
const TARGET_RMS = 0.045;
function loudnessGain(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0);
  const length = Math.min(data.length, Math.floor(buffer.sampleRate * 1.5));
  let sum = 0;
  for (let i = 0; i < length; i++) sum += data[i] * data[i];
  const rms = Math.sqrt(sum / Math.max(1, length));
  return rms > 0 ? Math.min(8, Math.max(0.2, TARGET_RMS / rms)) : 1;
}

type Voice = { stop: (time: number) => void };
type Playing = { voice: Voice; sources: AudioBufferSourceNode[] };
type SongNote = Note & { glide?: number };

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
  intro = false;
  measure = 0;
  beat = 0;
  loading = '';
  chord: Chord = { root: 0, type: '' };
  song: Song | null = null;
  songLength = 0;
  songElapsed = 0;
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
  private loudness = new Map<string, number>();
  private held = new Map<number, Playing>();
  private down = new Set<number>();
  private left = new Set<number>();
  private live = new Set<AudioBufferSourceNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private fillNext = false;
  private inFill = false;
  private endNext = false;
  private crashNext = false;
  private songTimer: ReturnType<typeof setInterval> | null = null;
  private songNotes: SongNote[] = [];
  private songAt = 0;
  private songStart = 0;
  private songVoices: Voice[] = [];
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

  get beatsPerBar() {
    return this.style.steps / this.style.beatSteps;
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
    this.stopSong();
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

  // Samples: fetched nearest-to-middle-C first, six at a time, so the keys in use sound real within a moment.

  load(bankId: string) {
    if (!this.init() || !this.ctx) return Promise.resolve();
    const existing = this.bankLoads.get(bankId);
    if (existing) return existing;
    const ctx = this.ctx;
    const bank = BANKS[bankId];
    const buffers = new Map<number, AudioBuffer>();
    this.banks.set(bankId, buffers);
    const queue = [...bank.files].sort((a, b) => Math.abs(a[1] - 62) - Math.abs(b[1] - 62));
    const total = queue.length;
    let done = 0;
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const [file, midi] = next;
        try {
          const response = await fetch(`${bank.path}${file}.mp3`);
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          buffers.set(midi, buffer);
          if (!this.loudness.has(bankId)) this.loudness.set(bankId, loudnessGain(buffer));
        } catch {
          // a missing sample falls back to its neighbours
        }
        done++;
        if (done % 5 === 0 || done === total) {
          this.loading = done === total ? '' : `Loading sounds ${Math.round((done / total) * 100)}%`;
          this.onChange();
        }
      }
    };
    this.loading = 'Loading sounds 0%';
    const promise = Promise.all(Array.from({ length: 6 }, worker)).then(() => undefined);
    this.bankLoads.set(bankId, promise);
    this.onChange();
    return promise;
  }

  private sampled(pitch: number, item: Sound, time: number, output: AudioNode, velocity: number, glide = 0): Playing | null {
    const buffers = this.banks.get(item.bank);
    if (!buffers?.size || !this.ctx) return null;
    const ctx = this.ctx;
    const bank = BANKS[item.bank];
    let nearest = -1;
    for (const midi of buffers.keys()) if (nearest < 0 || Math.abs(midi - pitch) < Math.abs(nearest - pitch)) nearest = midi;
    if (Math.abs(nearest - pitch) > 7) return null;
    const buffer = buffers.get(nearest)!;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 2 ** ((pitch - nearest) / 12);
    if (glide) {
      source.detune.setValueAtTime(glide * 100 + this.bend * 100, time);
      source.detune.linearRampToValueAtTime(this.bend * 100, time + 0.14);
    } else source.detune.value = this.bend * 100;
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
    const level = (this.loudness.get(item.bank) ?? 1) * (0.18 + 0.82 * velocity * velocity) * 0.6;
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

  private play(pitch: number, item: Sound, time: number, output: AudioNode, velocity = 0.8, glide = 0): Playing {
    pitch = Math.min(108, Math.max(21, pitch));
    const sampled = this.sampled(pitch, item, time, output, velocity, glide);
    if (sampled) return sampled;
    void this.load(item.bank);
    return { voice: this.synth(pitch, item.kind, time, output, velocity), sources: [] };
  }

  // Keys and controllers

  noteOn(key: number, velocity = 0.8) {
    if (!this.init() || !this.ctx) return;
    const time = this.ctx.currentTime;
    if (this.running && key < SPLIT) {
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

  selectStyleCategory(category: string) {
    const options = styles.map((item, index) => [item, index] as const).filter(([item]) => item.category === category);
    const position = options.findIndex(([, index]) => index === this.styleIndex);
    this.selectStyle(options[(position + 1) % options.length][1]);
  }

  selectStyle(index: number) {
    const restart = this.running && styles[index].steps !== this.style.steps;
    this.styleIndex = index;
    if (!this.running) this.tempo = styles[index].tempo;
    void this.load(styles[index].compSound.bank);
    if (restart) this.startStyle();
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
    this.stopSong();
    void this.load(BASS.bank);
    void this.load(this.style.compSound.bank);
    this.running = true;
    this.intro = withIntro;
    this.fillNext = this.inFill = this.endNext = this.crashNext = false;
    this.startClock(true);
    this.onChange();
  }

  stopStyle() {
    this.running = false;
    this.intro = false;
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

  // Song player: notes are booked on the audio clock a little ahead of time, like the style clock.

  async playSong(song: Song) {
    if (!this.init() || !this.ctx) return;
    if (this.running) this.stopStyle();
    this.stopSong();
    this.song = song;
    this.songElapsed = 0;
    this.songLength = 0;
    this.onChange();
    const item = soundNamed(song.sound);
    const [notes] = await Promise.all([
      song.file ? fetch(song.file).then((response) => response.arrayBuffer()).then(parseMidi) : Promise.resolve(song.notes?.() ?? []),
      this.load(item.bank),
      song.drone !== undefined ? this.load('sitar') : Promise.resolve(),
    ]);
    if (this.song !== song || !this.ctx) return;
    this.songNotes = notes;
    this.songLength = notes.reduce((end, note) => Math.max(end, note.time + note.duration), 0);
    this.songAt = 0;
    this.songStart = this.ctx.currentTime + 0.25;
    if (song.drone !== undefined) this.drone(song.drone, this.songStart, this.songLength + 1.5);
    this.songTimer = setInterval(() => this.songTick(item), 30);
    this.onChange();
  }

  stopSong() {
    if (this.songTimer) clearInterval(this.songTimer);
    this.songTimer = null;
    if (this.ctx) for (const voice of this.songVoices) voice.stop(this.ctx.currentTime);
    this.songVoices = [];
    if (this.song) {
      this.song = null;
      this.onChange();
    }
  }

  private songTick(item: Sound) {
    if (!this.ctx) return;
    const horizon = this.ctx.currentTime + 0.2;
    while (this.songAt < this.songNotes.length && this.songStart + this.songNotes[this.songAt].time < horizon) {
      const note = this.songNotes[this.songAt++];
      const time = this.songStart + note.time;
      const end = time + note.duration + 0.06;
      const playing = this.play(note.midi + this.transpose, item, time, this.bus, 0.35 + note.velocity * 0.6, note.glide ?? 0);
      playing.voice.stop(end);
      this.songVoices.push(playing.voice);
      if (this.songVoices.length > 96) this.songVoices.shift();
      this.later(time, () => this.onNote(note.midi, true));
      this.later(Math.min(end, time + 0.6), () => this.onNote(note.midi, false));
    }
    const elapsed = Math.max(0, this.ctx.currentTime - this.songStart);
    if (Math.floor(elapsed) !== Math.floor(this.songElapsed)) {
      this.songElapsed = elapsed;
      this.onChange();
    }
    if (this.songAt >= this.songNotes.length && elapsed > this.songLength + 1.5) this.stopSong();
  }

  // Tanpura: Pa, Sa, Sa, low Sa, plucked softly in a slow cycle under the raga.
  private drone(sa: number, start: number, length: number) {
    const item = soundNamed('Sitar');
    const cycle = [sa - 5, sa, sa, sa - 12];
    for (let time = start, index = 0; time < start + length; time += 0.75, index++) {
      const playing = this.play(cycle[index % 4] - 12, item, time, this.accompaniment, 0.3);
      playing.voice.stop(time + 2.6);
    }
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
      const swing = this.style.swing && this.step % 4 === 2 ? this.style.swing * this.stepTime * 2 : 0;
      this.playStep(this.step, this.nextTime + swing);
      this.nextTime += this.stepTime;
      this.step = (this.step + 1) % this.style.steps;
    }
  }

  private later(time: number, action: () => void) {
    const wait = this.ctx ? Math.max(0, (time - this.ctx.currentTime) * 1000) : 0;
    setTimeout(action, wait);
  }

  private playStep(step: number, time: number) {
    const style = this.style;
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
    if (step % style.beatSteps === 0) {
      this.beat = step / style.beatSteps + 1;
      this.later(time, () => this.onBeat());
      if (this.metronome) this.click(time, step === 0);
    }
    if (!this.running) return;
    if (this.intro) {
      if (step % style.beatSteps === 0) this.sticks(time);
      return;
    }

    const variation = this.variation;
    const half = style.steps / 2;
    if (this.inFill && step >= half) {
      if (step === half) this.kick(time, 1);
      if (style.tabla) this.tabla(time, step % 2 ? 'na' : 'dha');
      else this.tom(time, 230 - (step - half) * 14, step % 2 ? 0.55 : 0.8);
      if (step === style.steps - 1) this.crashNext = true;
    } else {
      const kicks = variation === 4 && style.kick.length ? [...style.kick, 10, 14] : style.kick;
      const hats = !style.hat.length ? [] : variation === 1 ? quarters : variation >= 3 && style.steps === 16 ? sixteenths : style.hat;
      if (kicks.includes(step)) this.kick(time, step % 8 === 0 ? 1 : 0.8);
      if (style.snare.includes(step)) this.snare(time, variation === 1 ? 0.6 : 0.9);
      if (variation > 1 && style.rim?.includes(step)) this.rim(time);
      if (hats.includes(step)) this.hat(time, step % 4 === 0 ? 0.6 : step % 2 === 0 ? 0.42 : 0.26, Boolean(style.open?.includes(step)) || (variation === 4 && step === 6));
      for (const [at, bol] of style.tabla ?? []) {
        if (at === step && (variation > 1 || at % (style.beatSteps * 2) === 0)) this.tabla(time, bol);
        if (variation >= 3 && at + 1 === step) this.tabla(time, 'ti');
      }
    }

    const root = this.chord.root;
    for (const [at, interval, length] of style.bass) {
      if (at !== step || (variation === 1 && at % half !== 0)) continue;
      this.play(36 + root + interval, BASS, time, this.accompaniment, 0.85).voice.stop(time + length * this.stepTime * 0.92);
    }
    for (const [at, length] of style.comp) {
      if (at !== step || (variation === 1 && at % half !== 0)) continue;
      const notes = variation === 4 ? [...voicing(this.chord), voicing(this.chord)[0] + 12] : voicing(this.chord);
      for (const note of notes) this.play(note, style.compSound, time, this.accompaniment, 0.6).voice.stop(time + length * this.stepTime * 0.9);
    }
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

  // Drums and tabla (synthesised)

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

  private tone(time: number, from: number, to: number, glideTime: number, peak: number, decay: number, type: OscillatorType = 'sine') {
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, time);
    osc.frequency.exponentialRampToValueAtTime(to, time + glideTime);
    osc.connect(this.hit(time, peak, decay));
    osc.start(time);
    osc.stop(time + decay + 0.05);
  }

  private kick(time: number, velocity: number) {
    this.tone(time, 130, 45, 0.1, velocity, 0.34);
    this.noiseBurst(time, 'lowpass', 2500, velocity * 0.08, 0.012);
  }

  private snare(time: number, velocity: number) {
    this.noiseBurst(time, 'bandpass', 2200, velocity * 0.55, 0.17);
    this.noiseBurst(time, 'highpass', 4500, velocity * 0.2, 0.09);
    this.tone(time, 220, 170, 0.05, velocity * 0.35, 0.08, 'triangle');
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
    this.tone(time, frequency, frequency * 0.6, 0.25, velocity * 0.8, 0.28);
  }

  private crash(time: number) {
    this.noiseBurst(time, 'highpass', 5000, 0.3, 1.6);
  }

  private click(time: number, accent: boolean) {
    this.tone(time, accent ? 1600 : 1000, accent ? 1600 : 1000, 0.01, 0.3, 0.03);
  }

  // Tabla bols: the bayan (left drum) is a low boom that glides up; the dayan (right) rings at a tuned pitch.
  private tabla(time: number, bol: Bol) {
    const bayan = () => this.tone(time, 85, 125, 0.18, 0.75, 0.5);
    const dayan = (ring: number) => {
      this.tone(time, 540, 520, 0.05, 0.32, ring);
      this.tone(time, 1090, 1050, 0.05, 0.1, ring * 0.6);
      this.noiseBurst(time, 'bandpass', 3000, 0.12, 0.015);
    };
    if (bol === 'dha' || bol === 'dhin') bayan();
    if (bol === 'dha' || bol === 'na') dayan(bol === 'dha' ? 0.3 : 0.22);
    if (bol === 'dhin' || bol === 'tin') dayan(0.55);
    if (bol === 'ge') bayan();
    if (bol === 'ti') this.noiseBurst(time, 'bandpass', 1800, 0.18, 0.04);
    if (bol === 'ka') this.noiseBurst(time, 'lowpass', 600, 0.4, 0.05);
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
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(9000, frequency * 6);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, time);
    amp.gain.linearRampToValueAtTime(0.25 * velocity, time + 0.005);
    amp.gain.setTargetAtTime(sustained ? 0.15 * velocity : 0.0001, time + 0.005, sustained ? 0.2 : 0.6);
    osc.connect(filter).connect(amp).connect(output);
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
