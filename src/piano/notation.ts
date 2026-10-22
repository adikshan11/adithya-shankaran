// Turns timed notes into engraved symbols on a grand staff: semibreves to semiquavers, dotted values, ties across
// barlines and rests. Times are in semiquavers (sixteenths) from the start of bar 1.

export type ScoreNote = { start: number; length: number; midi: number };
export type Meter = { label: string; beats: number; unit: 4 | 8; groups: number[] };

export const meters: Meter[] = [
  { label: '2/4', beats: 2, unit: 4, groups: [2] },
  { label: '3/4', beats: 3, unit: 4, groups: [3] },
  { label: '4/4', beats: 4, unit: 4, groups: [4] },
  { label: '5/4', beats: 5, unit: 4, groups: [3, 2] },
  { label: '6/4', beats: 6, unit: 4, groups: [3, 3] },
  { label: '7/4', beats: 7, unit: 4, groups: [4, 3] },
  { label: '3/8', beats: 3, unit: 8, groups: [3] },
  { label: '5/8', beats: 5, unit: 8, groups: [3, 2] },
  { label: '6/8', beats: 6, unit: 8, groups: [3, 3] },
  { label: '7/8', beats: 7, unit: 8, groups: [2, 2, 3] },
  { label: '9/8', beats: 9, unit: 8, groups: [3, 3, 3] },
  { label: '12/8', beats: 12, unit: 8, groups: [3, 3, 3, 3] },
];

export const meterNamed = (label: string) => meters.find((meter) => meter.label === label) ?? meters[2];
export type TimeSignature = { beats: number; unit: number };
export const barLength = (meter: TimeSignature) => (meter.beats * 16) / meter.unit;

// Note values in sixteenths, largest first: semibreve, dotted minim, minim, dotted crotchet, crotchet,
// dotted quaver, quaver, semiquaver.
const VALUES = [16, 12, 8, 6, 4, 3, 2, 1];
export const VALUE_NAMES: Record<number, string> = { 16: 'semibreve', 12: 'dotted minim', 8: 'minim', 6: 'dotted crotchet', 4: 'crotchet', 3: 'dotted quaver', 2: 'quaver', 1: 'semiquaver' };

function pieces(length: number) {
  const out: number[] = [];
  let left = Math.max(1, Math.round(length));
  while (left > 0) {
    const value = VALUES.find((candidate) => candidate <= left)!;
    out.push(value);
    left -= value;
  }
  return out;
}

export type Glyph = { kind: 'note' | 'rest'; start: number; value: number; midis: number[]; tie: boolean };

// One staff's symbols for bars [fromBar, fromBar + bars): chords where notes start together, rests in the gaps,
// notes split at barlines and tied.
export function engrave(notes: ScoreNote[], staff: 'treble' | 'bass', meter: TimeSignature, fromBar: number, bars: number) {
  const bar = barLength(meter);
  // Beat length in semiquavers: a crotchet in x/4, a dotted crotchet in 6/8, 9/8 and 12/8, a quaver in 5/8 and 7/8.
  const beat = meter.unit === 8 ? (meter.beats % 3 === 0 ? 6 : 2) : 16 / meter.unit;
  const windowStart = fromBar * bar;
  const windowEnd = windowStart + bars * bar;
  const mine = notes.filter((note) => (staff === 'treble' ? note.midi >= 60 : note.midi < 60) && note.start < windowEnd && note.start >= windowStart);
  const onsets = new Map<number, { midis: number[]; length: number }>();
  for (const note of mine) {
    const slot = onsets.get(note.start) ?? { midis: [], length: Infinity };
    if (!slot.midis.includes(note.midi)) slot.midis.push(note.midi);
    slot.length = Math.min(slot.length, Math.max(1, note.length));
    onsets.set(note.start, slot);
  }
  const starts = [...onsets.keys()].sort((a, b) => a - b);
  const glyphs: Glyph[] = [];
  let time = windowStart;
  let index = 0;
  while (time < windowEnd) {
    const barEnd = (Math.floor(time / bar) + 1) * bar;
    if (index < starts.length && starts[index] === time) {
      const slot = onsets.get(time)!;
      const next = index + 1 < starts.length ? starts[index + 1] : Infinity;
      const stop = time + Math.min(slot.length, next - time, windowEnd - time);
      const midis = [...slot.midis].sort((a, b) => a - b);
      let at = time;
      while (at < stop) {
        const segmentEnd = Math.min(stop, (Math.floor(at / bar) + 1) * bar);
        for (const value of pieces(segmentEnd - at)) {
          glyphs.push({ kind: 'note', start: at, value, midis, tie: true });
          at += value;
        }
      }
      glyphs[glyphs.length - 1].tie = false;
      time = stop;
      index++;
    } else {
      const nextOnset = index < starts.length ? starts[index] : windowEnd;
      const end = Math.min(nextOnset, barEnd, windowEnd);
      const barStart = barEnd - bar;
      if (time === barStart && end === barEnd) {
        // A whole empty bar takes a semibreve rest, whatever the time signature.
        glyphs.push({ kind: 'rest', start: time, value: 16, midis: [], tie: false });
        time = end;
        continue;
      }
      // Rests fill up to the next beat first, then go beat by beat; in 4/4, beats 1-2 or 3-4 join into a minim rest.
      while (time < end) {
        const into = time - barStart;
        const nextBeat = barStart + (Math.floor(into / beat) + 1) * beat;
        const span = into % beat !== 0 ? Math.min(nextBeat, end) - time : beat === 4 && into % 8 === 0 && end - time >= 8 && bar % 8 === 0 ? 8 : Math.min(beat, end - time);
        for (const value of pieces(span)) {
          glyphs.push({ kind: 'rest', start: time, value, midis: [], tie: false });
          time += value;
        }
      }
    }
  }
  return glyphs;
}

// Staff positions: diatonic steps (C0 = 0), spelled with sharps.
const LETTER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
export const isSharp = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
export const stepOf = (midi: number) => Math.floor(midi / 12) * 7 + LETTER[midi % 12] - 7;
