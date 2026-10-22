import type { Note } from './midi';

// The song book. Western pieces are public-domain scores from the Mutopia Project, played from their MIDI files.
// The two raga pieces are short improvisations written for this page in each raga's scale.
export type Song = {
  id: string;
  title: string;
  composer: string;
  detail: string;
  sound: string;
  file?: string;
  notes?: () => Note[];
  drone?: number;
  beat?: number; // seconds per beat, for the sheet music of generated pieces
  meter?: { beats: number; unit: number }; // time signature of a generated piece (4/4 if not given)
  shift16?: number; // semiquavers that put the first note in its place in the bar (a pickup), for generated pieces
  easy?: boolean; // a beginner's piece: listed first in Learn
  short?: string; // a name that fits a small screen
};

// A tune from [MIDI note, beats] pairs, one crotchet beat lasting `beat` seconds.
function tune(beat: number, notes: [number, number][], startAt = 0.6) {
  let time = startAt;
  return notes.map(([midi, beats]) => {
    const note = { time, duration: beats * beat * 0.95, midi, velocity: 0.7 };
    time += beats * beat;
    return note;
  });
}
const [C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5, G5] = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79];
// Twinkle, Twinkle, Little Star (traditional, the French tune "Ah! vous dirai-je, maman"), in C, 4/4.
const twinkle = () =>
  tune(0.6, [
    [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
    [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
    [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
    [G4, 1], [G4, 1], [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 2],
    [C4, 1], [C4, 1], [G4, 1], [G4, 1], [A4, 1], [A4, 1], [G4, 2],
    [F4, 1], [F4, 1], [E4, 1], [E4, 1], [D4, 1], [D4, 1], [C4, 2],
  ]);
// Happy Birthday to You (Mildred and Patty Hill's tune, public domain), in C, 3/4, starting on a one-beat pickup.
const birthday = () =>
  tune(0.55, [
    [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
    [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
    [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 1],
    [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 3],
  ]);

// Builds notes from [swara, beats] phrases. Swaras are semitones above Sa; a trailing glide bends into the note (meend or gamaka).
type Phrase = [number, number, number?][];
function phrases(sa: number, beat: number, parts: Phrase[], startAt = 0.6) {
  const notes: (Note & { glide?: number })[] = [];
  let time = startAt;
  for (const part of parts) {
    for (const [swara, beats, glide] of part) {
      const duration = beats * beat;
      if (swara !== -99) notes.push({ time, duration: duration * 0.98, midi: sa + swara, velocity: 0.62 + (beats >= 2 ? 0.08 : 0), glide });
      time += duration;
    }
  }
  return notes;
}

const REST = -99;

// Raga Yaman (Hindustani, evening): S R G M# P D N, with tivra Ma. Slow alaap, then faster taans and a tihai.
const yaman = () => {
  const [S, R, G, M, P, D, N] = [0, 2, 4, 6, 7, 9, 11];
  const low = (x: number) => x - 12;
  const high = (x: number) => x + 12;
  const alaap: Phrase[] = [
    [[low(N), 1.5, -1], [R, 1], [G, 2, -2], [R, 1], [S, 3]],
    [[low(N), 1], [low(D), 1], [low(N), 1], [R, 1.5], [G, 2], [M, 1, -1], [G, 1], [R, 1.5], [S, 2.5]],
    [[G, 1], [M, 1], [P, 2.5, -1], [M, 1], [G, 1], [R, 1], [G, 1.5], [R, 1], [S, 2]],
    [[M, 1], [D, 1], [N, 2, -1], [high(S), 3], [N, 1], [D, 1], [P, 2], [M, 1], [G, 1, -2], [R, 1], [S, 3], [REST, 1]],
  ];
  const run = [low(N), R, G, M, P, D, N, high(S), high(S), N, D, P, M, G, R, S];
  const taans: Phrase[] = [
    run.map((swara) => [swara, 0.25] as [number, number]),
    run.map((swara) => [swara, 0.25] as [number, number]),
    [[low(N), 0.5], [R, 0.5], [S, 1], [REST, 0.5], [low(N), 0.5], [R, 0.5], [S, 1], [REST, 0.5], [low(N), 0.5], [R, 0.5], [S, 3]],
  ];
  const alaapBeats = alaap.flat().reduce((total, [, beats]) => total + beats, 0);
  return [...phrases(61, 0.55, alaap), ...phrases(61, 0.4, taans, 0.6 + 0.55 * alaapBeats + 0.4)];
};

// Raga Hamsadhwani (Carnatic): S R2 G3 P N3, no Ma or Dha. Phrases in Adi talam, then a kalpanaswaram-style run and a tihai.
const hamsadhwani = () => {
  const [S, R, G, P, N] = [0, 2, 4, 7, 11];
  const high = (x: number) => x + 12;
  const low = (x: number) => x - 12;
  const parts: Phrase[] = [
    [[S, 1], [R, 1], [G, 1, 1], [P, 1], [N, 1, 1], [high(S), 3]],
    [[high(S), 1], [N, 1, 1], [P, 1], [G, 1, 1], [R, 1], [S, 3]],
    [[G, 0.5], [P, 0.5], [N, 0.5], [high(S), 0.5], [high(R), 1], [high(S), 0.5], [N, 0.5], [P, 1, 1], [G, 1], [R, 0.5], [S, 0.5], [low(N), 1], [S, 2]],
    [[P, 0.5], [N, 0.5], [high(S), 0.5], [high(R), 0.5], [high(G), 1, 1], [high(R), 0.5], [high(S), 0.5], [N, 0.5], [P, 0.5], [G, 0.5], [R, 0.5], [S, 2]],
    [[G, 0.5], [R, 0.5], [S, 1], [REST, 0.5], [G, 0.5], [R, 0.5], [S, 1], [REST, 0.5], [G, 0.5], [R, 0.5], [S, 4]],
  ];
  return phrases(62, 0.5, parts);
};

// Jana Gana Mana, the national anthem of India (Rabindranath Tagore, public domain): the melody in C, 4/4, sung
// to Sa = C. Taken from the flutetunes.com melody file and checked line by line against two published sargam
// versions; at its two disagreements (the fifth note of "Punjab Sindhu" and the last "jaya he") it follows the
// two sargams, which agree with each other. At 0.48 s a beat it lasts about 52 seconds, the official full version.
const janaGanaMana = () => tune(0.48, [[72, 0.5], [74, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [76, 1], [76, 0.5], [76, 0.5], [74, 0.5], [76, 0.5], [77, 1], [76, 1], [76, 0.5], [76, 0.5], [74, 1], [74, 0.5], [74, 0.5], [71, 0.5], [74, 0.5], [72, 2], [72, 1], [79, 1], [79, 0.5], [79, 0.5], [79, 0.5], [79, 0.5], [79, 0.5], [79, 0.5], [79, 1], [79, 0.5], [78, 0.5], [79, 0.5], [78, 0.5], [79, 1], [77, 1], [77, 0.5], [77, 0.5], [77, 1], [77, 0.5], [76, 0.5], [74, 0.5], [77, 0.5], [76, 3], [76, 1], [76, 0.5], [76, 0.5], [76, 1], [76, 0.5], [74, 0.5], [79, 0.5], [79, 0.5], [79, 0.5], [77, 0.5], [77, 1], [77, 1], [76, 1], [76, 0.5], [76, 0.5], [74, 1], [74, 0.5], [74, 0.5], [71, 0.5], [74, 0.5], [72, 3], [76, 0.5], [76, 0.5], [76, 0.5], [76, 0.5], [76, 1], [76, 0.5], [77, 0.5], [74, 0.5], [76, 0.5], [77, 3], [76, 0.5], [77, 0.5], [79, 0.5], [79, 0.5], [79, 1], [77, 0.5], [76, 0.5], [74, 0.5], [77, 0.5], [76, 3], [76, 1], [76, 1], [74, 0.5], [74, 0.5], [74, 0.5], [74, 0.5], [71, 0.5], [74, 0.5], [72, 3], [79, 0.5], [79, 0.5], [79, 0.5], [79, 0.5], [79, 1], [79, 0.5], [78, 0.5], [79, 1], [79, 0.5], [79, 0.5], [78, 0.5], [81, 0.5], [79, 1], [77, 1], [77, 0.5], [77, 0.5], [76, 1], [76, 0.5], [76, 0.25], [77, 0.25], [74, 0.5], [77, 0.5], [76, 2], [83, 0.5], [83, 0.5], [84, 3], [83, 0.5], [81, 0.5], [83, 3], [81, 0.5], [79, 0.5], [81, 4], [72, 0.5], [72, 0.5], [74, 0.5], [74, 0.5], [76, 0.5], [76, 0.5], [74, 0.5], [76, 0.5], [77, 4]]);

export const songs: Song[] = [
  { id: 'twinkle', short: 'Twinkle Twinkle', title: 'Twinkle, Twinkle, Little Star', composer: 'Traditional', detail: 'A first piece: one hand, five notes', sound: 'Grand Piano', notes: twinkle, beat: 0.6, easy: true },
  { id: 'anthem', short: 'Jana Gana Mana', title: 'Jana Gana Mana', composer: 'Rabindranath Tagore', detail: 'The national anthem of India, full version', sound: 'Grand Piano', notes: janaGanaMana, beat: 0.48, shift16: 0, easy: true },
  { id: 'birthday', short: 'Happy Birthday', title: 'Happy Birthday to You', composer: 'Mildred & Patty Hill', detail: 'In 3/4, with a pickup and a dotted rhythm', sound: 'Grand Piano', notes: birthday, beat: 0.55, meter: { beats: 3, unit: 4 }, shift16: 8, easy: true },
  { id: 'bach', short: 'Bach Prelude', title: 'Prelude in C major, BWV 846', composer: 'J. S. Bach', detail: 'The Well-Tempered Clavier, Book I', sound: 'Grand Piano', file: '/songs/wtk1-prelude1.mid' },
  { id: 'elise', short: 'Für Elise', title: 'Für Elise, WoO 59', composer: 'L. van Beethoven', detail: 'Bagatelle in A minor', sound: 'Grand Piano', file: '/songs/fur_Elise_WoO59.mid' },
  { id: 'turca', short: 'Rondo alla Turca', title: 'Rondo alla Turca, K. 331', composer: 'W. A. Mozart', detail: 'Piano Sonata No. 11, third movement', sound: 'Grand Piano', file: '/songs/KV331_3_RondoAllaTurca.mid' },
  { id: 'prelude4', short: 'Prelude E minor', title: 'Prelude in E minor, Op. 28 No. 4', composer: 'F. Chopin', detail: '24 Preludes', sound: 'Grand Piano', file: '/songs/Chop-28-4.mid' },
  { id: 'raindrop', short: 'Raindrop Prelude', title: '“Raindrop” Prelude, Op. 28 No. 15', composer: 'F. Chopin', detail: '24 Preludes', sound: 'Grand Piano', file: '/songs/Chop-28-15.mid' },
  { id: 'minute', short: 'Minute Waltz', title: '“Minute” Waltz, Op. 64 No. 1', composer: 'F. Chopin', detail: 'Waltz in D-flat major', sound: 'Grand Piano', file: '/songs/chopin_valse_op64_no1.mid' },
  { id: 'yaman', short: 'Raga Yaman', title: 'Raga Yaman', composer: 'Hindustani classical', detail: 'Alaap and taans on sitar, over tanpura', sound: 'Sitar', notes: yaman, drone: 61, beat: 0.55 },
  { id: 'hamsadhwani', short: 'Hamsadhwani', title: 'Raga Hamsadhwani', composer: 'Carnatic classical', detail: 'Phrases and a tihai on flute (venu), over tanpura', sound: 'Flute', notes: hamsadhwani, drone: 62, beat: 0.5 },
];
