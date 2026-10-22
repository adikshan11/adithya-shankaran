import type { Mood } from '../piano/arranger';

// The Learn coach: a round little character in a piano-key cap. Its face follows the practice: happy on a right
// note, astonished on a long run or the last bar, upset on a wrong note and cross after three in a row. It is our
// own character, drawn in SVG; it says what went wrong and how to fix it.
const FACES: Record<Mood, { brows: string; mouth: string; eyes: 'open' | 'smile' | 'wide' | 'narrow' }> = {
  idle: { brows: 'M19 21 l7 -1 M38 20 l7 1', mouth: 'M26 43 q6 4 12 0', eyes: 'open' },
  happy: { brows: 'M19 19 l7 -2 M38 17 l7 2', mouth: 'M23 40 q9 10 18 0 z', eyes: 'smile' },
  astonished: { brows: 'M18 16 l8 -3 M38 13 l8 3', mouth: 'M32 41 m-5 0 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0', eyes: 'wide' },
  upset: { brows: 'M19 18 l7 3 M38 21 l7 -3', mouth: 'M25 46 q7 -6 14 0', eyes: 'open' },
  angry: { brows: 'M18 17 l9 5 M37 22 l9 -5', mouth: 'M24 46 q8 -7 16 0', eyes: 'narrow' },
};

export default function Coach({ mood, text, tick }: { mood: Mood; text: string; tick: number }) {
  const face = FACES[mood];
  const eye = (x: number) =>
    face.eyes === 'smile' ? (
      <path d={`M${x - 4} 30 q4 -5 8 0`} className="co-line" />
    ) : face.eyes === 'narrow' ? (
      <ellipse cx={x} cy={30} rx={3.6} ry={1.8} className="co-eye" />
    ) : (
      <g>
        <ellipse cx={x} cy={30} rx={face.eyes === 'wide' ? 4.6 : 3.8} ry={face.eyes === 'wide' ? 5.6 : 4.6} className="co-eye" />
        <circle cx={x + 1.2} cy={28.4} r={1.3} className="co-glint" />
      </g>
    );
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite">
      <svg key={tick} className="pa-coach-face" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx={32} cy={36} r={24} className="co-body" />
        {/* the piano-key cap */}
        <path d="M11 26 a21 17 0 0 1 42 0 z" className="co-cap" />
        {[18, 25, 39, 46].map((x) => <rect key={x} x={x} y={11} width={3.4} height={10} rx={1} className="co-cap-key" />)}
        <circle cx={18} cy={42} r={3.4} className="co-cheek" />
        <circle cx={46} cy={42} r={3.4} className="co-cheek" />
        {eye(26)}
        {eye(38)}
        <path d={face.brows} className="co-line" />
        <path d={face.mouth} className={mood === 'happy' ? 'co-mouth' : mood === 'astonished' ? 'co-mouth' : 'co-line'} />
      </svg>
      <p className="pa-coach-bubble">{text}</p>
    </div>
  );
}
