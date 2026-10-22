import { memo } from 'react';
import { barLength, engrave, isSharp, stepOf } from '../piano/notation';
import type { Glyph, ScoreNote, TimeSignature } from '../piano/notation';

// A grand staff drawn in SVG: treble and bass clefs, time signature, bars, notes with stems, flags, dots,
// sharps, ledger lines and ties, and rests. Notes are spaced in proportion to their time.
const SPACE = 8; // distance between staff lines
const HALF = SPACE / 2;
const LEFT = 64; // clefs and time signature
const BAR_WIDTH = 230;
const TREBLE_BOTTOM = 70; // y of the treble staff's bottom line (E4)
const BASS_BOTTOM = 146; // y of the bass staff's bottom line (G2)
const HEIGHT = 178;

// `version` sums up what is shown; the staff redraws only when it changes.
type Props = { notes: ScoreNote[]; meter: TimeSignature; fromBar: number; bars: number; cursor?: number; recent?: Set<number>; version: string };

function staffY(staff: 'treble' | 'bass', step: number) {
  return staff === 'treble' ? TREBLE_BOTTOM - (step - 30) * HALF : BASS_BOTTOM - (step - 18) * HALF;
}

function Rest({ x, top, value }: { x: number; top: number; value: number }) {
  // top: y of the staff's top line
  if (value >= 12 && value !== 12) return <rect x={x - 5} y={top + SPACE} width={10} height={4} className="st-ink" />;
  if (value === 8 || value === 12)
    return (
      <g>
        <rect x={x - 5} y={top + SPACE * 2 - 4} width={10} height={4} className="st-ink" />
        {value === 12 && <circle cx={x + 9} cy={top + SPACE * 2 - 2} r={1.5} className="st-ink" />}
      </g>
    );
  if (value === 4 || value === 6)
    return (
      <g>
        <path d={`M${x - 2} ${top + 6} l5 6 l-4 5 l5 6 q-6 -2 -4 5`} className="st-line" strokeWidth={2.2} fill="none" />
        {value === 6 && <circle cx={x + 8} cy={top + SPACE * 2} r={1.5} className="st-ink" />}
      </g>
    );
  const flags = value === 1 ? 2 : 1;
  return (
    <g>
      {Array.from({ length: flags }, (_, index) => (
        <circle key={index} cx={x - 2 + index * 2} cy={top + SPACE * 1.5 + index * SPACE} r={2.2} className="st-ink" />
      ))}
      <path d={`M${x + 4} ${top + SPACE * 1.3} L${x - 1} ${top + SPACE * (2.8 + flags - 1)}`} className="st-line" strokeWidth={1.3} />
      {value === 3 && <circle cx={x + 8} cy={top + SPACE * 2} r={1.5} className="st-ink" />}
    </g>
  );
}

type Beam = { up: boolean; end: number };

function Chord({ glyph, staff, x, nextX, recent, beam }: { glyph: Glyph; staff: 'treble' | 'bass'; x: number; nextX: number; recent: boolean; beam?: Beam }) {
  const steps = glyph.midis.map(stepOf);
  const middle = staff === 'treble' ? 34 : 22;
  const average = steps.reduce((sum, step) => sum + step, 0) / steps.length;
  const up = beam ? beam.up : average < middle;
  const hollow = glyph.value >= 8;
  const dotted = [12, 6, 3].includes(glyph.value);
  const flags = beam ? 0 : glyph.value === 1 ? 2 : glyph.value === 2 || glyph.value === 3 ? 1 : 0;
  const ys = steps.map((step) => staffY(staff, step));
  const low = Math.max(...ys);
  const high = Math.min(...ys);
  const stemX = up ? x + 4.6 : x - 4.6;
  const stemEnd = beam ? beam.end : up ? high - 27 : low + 27;
  const bottomStep = staff === 'treble' ? 30 : 18;
  const ledgers = new Set<number>();
  for (const step of steps) {
    for (let s = bottomStep - 2; s >= step; s -= 2) ledgers.add(s);
    for (let s = bottomStep + 10; s <= step; s += 2) ledgers.add(s);
  }
  const tone = recent ? 'st-recent' : 'st-ink';
  return (
    <g>
      {[...ledgers].map((step) => (
        <line key={step} x1={x - 8} x2={x + 8} y1={staffY(staff, step)} y2={staffY(staff, step)} className="st-line" strokeWidth={1} />
      ))}
      {glyph.midis.map((midi, index) => (
        <g key={midi}>
          <ellipse cx={x} cy={ys[index]} rx={4.8} ry={3.5} transform={`rotate(-20 ${x} ${ys[index]})`} className={hollow ? 'st-hollow' : tone} strokeWidth={hollow ? 1.5 : 0} />
          {isSharp(midi) && <text x={x - 15} y={ys[index] + 4} className="st-text" fontSize={12}>♯</text>}
          {dotted && <circle cx={x + 9} cy={ys[index] - ((steps[index] % 2 === 0) ? HALF : 0)} r={1.5} className="st-ink" />}
          {glyph.tie && <path d={`M${x + 4} ${ys[index] + (up ? 5 : -5)} Q${(x + nextX) / 2} ${ys[index] + (up ? 12 : -12)} ${nextX - 4} ${ys[index] + (up ? 5 : -5)}`} className="st-line" fill="none" strokeWidth={1.2} />}
        </g>
      ))}
      {glyph.value < 16 && <line x1={stemX} x2={stemX} y1={up ? low : high} y2={stemEnd} className="st-line" strokeWidth={1.3} />}
      {Array.from({ length: flags }, (_, index) => {
        const y = stemEnd + (up ? index * 8 : -index * 8);
        return <path key={index} d={up ? `M${stemX} ${y} q7 6 5 15` : `M${stemX} ${y} q7 -6 5 -15`} className="st-line" fill="none" strokeWidth={1.8} />;
      })}
    </g>
  );
}

// Consecutive quavers and semiquavers inside one beat (a dotted crotchet in 6/8, a crotchet in 4/4) are beamed.
function beamGroups(glyphs: Glyph[], bar: number, beat: number) {
  const groups: Glyph[][] = [];
  let current: Glyph[] = [];
  let key = '';
  for (const glyph of glyphs) {
    const flagged = glyph.kind === 'note' && glyph.value <= 3;
    const beatKey = `${Math.floor(glyph.start / bar)}:${Math.floor((glyph.start % bar) / beat)}`;
    if (flagged && beatKey === key) current.push(glyph);
    else {
      if (current.length > 1) groups.push(current);
      current = flagged ? [glyph] : [];
      key = flagged ? beatKey : '';
    }
  }
  if (current.length > 1) groups.push(current);
  return groups;
}

// One stem direction for a beamed group, and a level beam just past the furthest note.
function beamOf(staff: 'treble' | 'bass', group: Glyph[]): Beam {
  const steps = group.flatMap((glyph) => glyph.midis.map(stepOf));
  const middle = staff === 'treble' ? 34 : 22;
  const up = steps.reduce((sum, step) => sum + step, 0) / steps.length < middle;
  const ys = steps.map((step) => staffY(staff, step));
  return { up, end: up ? Math.min(...ys) - 28 : Math.max(...ys) + 28 };
}

function Staff({ notes, meter, fromBar, bars, cursor, recent }: Props) {
  const bar = barLength(meter);
  const width = LEFT + bars * BAR_WIDTH + 6;
  const xOf = (time: number) => {
    const barIndex = Math.floor(time / bar) - fromBar;
    const within = (time - Math.floor(time / bar) * bar) / bar;
    return LEFT + barIndex * BAR_WIDTH + 18 + within * (BAR_WIDTH - 30);
  };
  const staves = (['treble', 'bass'] as const).map((staff) => ({ staff, glyphs: engrave(notes, staff, meter, fromBar, bars) }));
  const tops = { treble: TREBLE_BOTTOM - SPACE * 4, bass: BASS_BOTTOM - SPACE * 4 };
  const beat = meter.unit === 8 ? (meter.beats % 3 === 0 ? 6 : 2) : 16 / meter.unit;
  const beamed = new Map<string, Beam>();
  for (const { staff, glyphs } of staves) for (const group of beamGroups(glyphs, bar, beat)) for (const glyph of group) beamed.set(`${staff}${glyph.start}`, beamOf(staff, group));

  return (
    <svg className="pa-staff-svg" viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label="Sheet music of what is playing">
      {(['treble', 'bass'] as const).map((staff) =>
        Array.from({ length: 5 }, (_, line) => (
          <line key={`${staff}${line}`} x1={8} x2={width - 4} y1={tops[staff] + line * SPACE} y2={tops[staff] + line * SPACE} className="st-line" strokeWidth={1} />
        )),
      )}
      <line x1={8} x2={8} y1={tops.treble} y2={BASS_BOTTOM} className="st-line" strokeWidth={2} />
      <text x={12} y={TREBLE_BOTTOM + 6} className="st-clef" fontSize={44}>𝄞</text>
      <text x={12} y={tops.bass + 25} className="st-clef" fontSize={30}>𝄢</text>
      {/* Time signature: each number fills half the staff, the top one from the top line to the middle line, the
          bottom one from the middle line to the bottom line, centred on each other. */}
      {(['treble', 'bass'] as const).map((staff) => (
        <g key={staff} className="st-timesig" textAnchor="middle" fontSize={SPACE * 2.9}>
          <text x={48} y={tops[staff] + SPACE * 2 - 0.5}>{meter.beats}</text>
          <text x={48} y={tops[staff] + SPACE * 4 - 0.5}>{meter.unit}</text>
        </g>
      ))}
      {Array.from({ length: bars }, (_, index) => (
        <g key={index}>
          <line x1={LEFT + (index + 1) * BAR_WIDTH} x2={LEFT + (index + 1) * BAR_WIDTH} y1={tops.treble} y2={BASS_BOTTOM} className="st-line" strokeWidth={1} />
          <text x={LEFT + index * BAR_WIDTH + 4} y={tops.treble - 6} className="st-num" fontSize={9}>{fromBar + index + 1}</text>
        </g>
      ))}
      {staves.map(({ staff, glyphs }) =>
        beamGroups(glyphs, bar, beat).map((group) => {
          const xs = group.map((glyph) => xOf(glyph.start) + (beamOf(staff, group).up ? 4.6 : -4.6));
          const { up, end } = beamOf(staff, group);
          const step = up ? 7 : -7;
          return (
            <g key={`${staff}beam${group[0].start}`} className="st-ink">
              <rect x={xs[0]} y={up ? end : end - 4} width={xs.at(-1)! - xs[0]} height={4} />
              {group.map((glyph, index) => {
                if (glyph.value !== 1) return null;
                const next = group[index + 1];
                const previous = group[index - 1];
                const from = xs[index];
                const to = next?.value === 1 ? xs[index + 1] : previous?.value === 1 ? from : from + (index === group.length - 1 ? -7 : 7);
                if (to === from) return null;
                return <rect key={glyph.start} x={Math.min(from, to)} y={(up ? end : end - 4) + step} width={Math.abs(to - from)} height={4} />;
              })}
            </g>
          );
        }),
      )}
      {staves.map(({ staff, glyphs }) =>
        glyphs.map((glyph, index) => {
          const x = xOf(glyph.start);
          const nextX = index + 1 < glyphs.length ? xOf(glyphs[index + 1].start) : x + 20;
          return glyph.kind === 'rest' ? (
            <Rest key={`${staff}${glyph.start}`} x={x} top={tops[staff]} value={glyph.value} />
          ) : (
            <Chord
              key={`${staff}${glyph.start}`}
              glyph={glyph}
              staff={staff}
              x={x}
              nextX={nextX}
              beam={beamed.get(`${staff}${glyph.start}`)}
              recent={Boolean(recent && glyph.midis.some((midi) => recent.has(midi)) && index === glyphs.length - 1)}
            />
          );
        }),
      )}
      {cursor !== undefined && cursor >= fromBar * bar && <line x1={xOf(cursor)} x2={xOf(cursor)} y1={tops.treble - 4} y2={BASS_BOTTOM + 4} className="st-cursor" strokeWidth={2} />}
    </svg>
  );
}

export default memo(Staff, (before, after) => before.version === after.version);
