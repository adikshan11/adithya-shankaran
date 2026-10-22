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
};

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

export const songs: Song[] = [
  { id: 'bach', title: 'Prelude in C major, BWV 846', composer: 'J. S. Bach', detail: 'The Well-Tempered Clavier, Book I', sound: 'Grand Piano', file: '/songs/wtk1-prelude1.mid' },
  { id: 'elise', title: 'Für Elise, WoO 59', composer: 'L. van Beethoven', detail: 'Bagatelle in A minor', sound: 'Grand Piano', file: '/songs/fur_Elise_WoO59.mid' },
  { id: 'turca', title: 'Rondo alla Turca, K. 331', composer: 'W. A. Mozart', detail: 'Piano Sonata No. 11, third movement', sound: 'Grand Piano', file: '/songs/KV331_3_RondoAllaTurca.mid' },
  { id: 'prelude4', title: 'Prelude in E minor, Op. 28 No. 4', composer: 'F. Chopin', detail: '24 Preludes', sound: 'Grand Piano', file: '/songs/Chop-28-4.mid' },
  { id: 'raindrop', title: '“Raindrop” Prelude, Op. 28 No. 15', composer: 'F. Chopin', detail: '24 Preludes', sound: 'Grand Piano', file: '/songs/Chop-28-15.mid' },
  { id: 'minute', title: '“Minute” Waltz, Op. 64 No. 1', composer: 'F. Chopin', detail: 'Waltz in D-flat major', sound: 'Grand Piano', file: '/songs/chopin_valse_op64_no1.mid' },
  { id: 'yaman', title: 'Raga Yaman', composer: 'Hindustani classical', detail: 'Alaap and taans on sitar, over tanpura', sound: 'Sitar', notes: yaman, drone: 61, beat: 0.55 },
  { id: 'hamsadhwani', title: 'Raga Hamsadhwani', composer: 'Carnatic classical', detail: 'Phrases and a tihai on flute (venu), over tanpura', sound: 'Flute', notes: hamsadhwani, drone: 62, beat: 0.5 },
];
