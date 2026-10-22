import { useId } from 'react';
import type { CSSProperties } from 'react';
import type { Mood } from '../piano/arranger';

// The Learn coach "Tempo Cat": a metronome that is also a cat. The body is the metronome's pyramid with cat ears
// on its peak and the tempo scale on its tummy; the tail is the pendulum and swings at your practice tempo (one
// swing per beat), because keeping time is the coach's job. Bright ginger and cream with a gold bell on the collar.
// Moods: it swings along while waiting, waves a paw on a right note, freezes with the tail straight up and both
// paws raised when astonished, droops (ears and tail down) when upset, and flushes red and shakes when cross.
type Pose = { leftPaw: string; rightPaw: string; eyes: 'open' | 'happy' | 'wide' | 'sad' | 'cross'; mouth: string; brows?: string; ears: number };

const POSES: Record<Mood, Pose> = {
  idle: { leftPaw: 'M38 84 q-10 6 -10 16', rightPaw: 'M82 84 q10 6 10 16', eyes: 'open', mouth: 'M54 63 q3 4 6 0 q3 4 6 0', ears: 0 },
  happy: { leftPaw: 'M38 84 q-10 6 -10 16', rightPaw: 'M82 82 q14 -6 14 -24', eyes: 'happy', mouth: 'M53 62 q7 10 14 0 z', ears: 0 },
  astonished: { leftPaw: 'M38 82 q-14 -6 -14 -24', rightPaw: 'M82 82 q14 -6 14 -24', eyes: 'wide', mouth: 'M60 66 m-4 0 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0', ears: -4 },
  upset: { leftPaw: 'M39 86 q-5 10 -3 18', rightPaw: 'M81 86 q5 10 3 18', eyes: 'sad', mouth: 'M54 67 q6 -5 12 0', brows: 'M44 41 l8 3 M76 41 l-8 3', ears: 18 },
  angry: { leftPaw: 'M38 86 q-12 0 -9 11 q4 3 9 -2', rightPaw: 'M82 86 q12 0 9 11 q-4 3 -9 -2', eyes: 'cross', mouth: 'M53 67 q7 -6 14 0', brows: 'M43 39 l10 6 M77 39 l-10 6', ears: 10 },
};

export default function Coach({ mood, text, tick, tempo }: { mood: Mood; text: string; tick: number; tempo: number }) {
  const id = useId().replace(/:/g, '');
  const pose = POSES[mood];
  const eye = (x: number) => {
    if (pose.eyes === 'happy') return <path d={`M${x - 5.5} 52 q5.5 -7 11 0`} className="co-stroke" strokeWidth={2.6} />;
    const ry = pose.eyes === 'wide' ? 8 : 7;
    return (
      <g>
        <ellipse cx={x} cy={50} rx={pose.eyes === 'wide' ? 7 : 6.2} ry={ry} fill="#2b1d16" />
        <ellipse cx={x} cy={50} rx={pose.eyes === 'wide' ? 4.6 : 3.6} ry={ry - 1.6} fill="#3d9c6a" />
        <ellipse cx={x} cy={50.5} rx={1.8} ry={ry - 2.2} fill="#1a1210" />
        <circle cx={x + 2.2} cy={46.6} r={2} fill="#fff" />
        <circle cx={x - 2} cy={53} r={0.9} fill="#fff" opacity={0.8} />
        {pose.eyes === 'sad' && <path d={`M${x - 8} ${50 - ry - 1} h16 v6 q-8 -2.5 -16 0 z`} fill={`url(#${id}-fur)`} />}
        {pose.eyes === 'cross' && <path d={`M${x - 8} 41 h16 v${x < 60 ? 9 : 4} l-16 ${x < 60 ? -5 : 5} z`} fill={`url(#${id}-fur)`} />}
      </g>
    );
  };
  const ear = (side: -1 | 1) => {
    const x = 60 + side * 19;
    return (
      <g style={{ transformBox: 'view-box', transformOrigin: `${x}px 30px`, transform: `rotate(${side * pose.ears}deg)` }} className="co-ear">
        <path d={`M${x - 10} 32 L${x + side * 3} 6 L${x + 10} 30 Z`} fill={`url(#${id}-fur)`} stroke="#c8641f" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={`M${x - 5} 29 L${x + side * 2.4} 13 L${x + 5} 28 Z`} fill="#ffb3c1" />
      </g>
    );
  };
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite" style={{ '--beat': `${(60 / Math.max(30, tempo)).toFixed(3)}s` } as CSSProperties}>
      <svg className="pa-coach-figure" viewBox="0 0 120 134" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd9a3" />
            <stop offset="45%" stopColor="#ffab4c" />
            <stop offset="100%" stopColor="#f07f2c" />
          </linearGradient>
          <linearGradient id={`${id}-cream`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="100%" stopColor="#ffeccb" />
          </linearGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff1b0" />
            <stop offset="55%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#c08a12" />
          </linearGradient>
        </defs>
        <ellipse cx={60} cy={129} rx={36} ry={4.5} className="co-shadow" />
        <g key={tick} className="co-act">
          {/* the tail is the pendulum: it swings behind the body at the practice tempo, a gold band as its weight */}
          <g className="co-pendulum">
            <path d="M60 112 C58 80 70 50 60 2" fill="none" stroke="#f07f2c" strokeWidth={8} strokeLinecap="round" />
            <path d="M60 112 C58 80 70 50 60 2" fill="none" stroke="#ffb35c" strokeWidth={3} strokeLinecap="round" strokeDasharray="6 9" />
            <rect x={56} y={14} width={10} height={6} rx={2} fill={`url(#${id}-gold)`} stroke="#9b6c0c" strokeWidth={0.8} />
          </g>
          {/* paws (behind the body) */}
          <path d={pose.leftPaw} className="co-paw" />
          <path d={pose.rightPaw} className="co-paw" />
          {ear(-1)}
          {ear(1)}
          {/* metronome body: a rounded pyramid in ginger fur, with a gloss line */}
          <path d="M24 118 L40 34 Q60 16 80 34 L96 118 Q60 124 24 118 Z" fill={`url(#${id}-fur)`} stroke="#c8641f" strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M42 38 L30 104" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
          <path className="co-flush" d="M24 118 L40 34 Q60 16 80 34 L96 118 Q60 124 24 118 Z" />
          {/* tummy: the cream tempo scale, with a pivot at the bottom like a real metronome */}
          <path d="M48 80 L72 80 L80 114 Q60 118 40 114 Z" fill={`url(#${id}-cream)`} />
          {[86, 92, 98, 104].map((y) => <line key={y} x1={56} x2={64} y1={y} y2={y} stroke="#f0a24a" strokeWidth={1.2} strokeLinecap="round" />)}
          <circle cx={60} cy={110} r={2.6} fill={`url(#${id}-gold)`} stroke="#9b6c0c" strokeWidth={0.8} />
          {/* collar and bell */}
          <path d="M40 74 Q60 82 80 74" fill="none" stroke="#e5484d" strokeWidth={4} strokeLinecap="round" />
          <circle cx={60} cy={80} r={4.2} fill={`url(#${id}-gold)`} stroke="#9b6c0c" strokeWidth={0.9} />
          <line x1={58} x2={62} y1={81.5} y2={81.5} stroke="#9b6c0c" strokeWidth={0.9} />
          {/* front feet */}
          <ellipse cx={45} cy={119} rx={8} ry={4.6} fill={`url(#${id}-cream)`} stroke="#e7b47a" strokeWidth={1} />
          <ellipse cx={75} cy={119} rx={8} ry={4.6} fill={`url(#${id}-cream)`} stroke="#e7b47a" strokeWidth={1} />
          {/* face: muzzle, whiskers, eyes, nose, mouth */}
          <ellipse cx={60} cy={62} rx={13} ry={9} fill={`url(#${id}-cream)`} />
          <circle cx={45} cy={60} r={4} className="co-cheek" />
          <circle cx={75} cy={60} r={4} className="co-cheek" />
          <path d="M44 61 l-14 -3 M44 64 l-14 2 M76 61 l14 -3 M76 64 l14 2" className="co-whisker" />
          {eye(50)}
          {eye(70)}
          {pose.brows && <path d={pose.brows} className="co-stroke" strokeWidth={2.4} />}
          <path d="M57.5 57.5 h5 l-2.5 3 z" fill="#ff7f9b" stroke="#c94d6a" strokeWidth={0.6} strokeLinejoin="round" />
          <path d={pose.mouth} className={mood === 'happy' || mood === 'astonished' ? 'co-mouth' : 'co-stroke'} strokeWidth={1.8} />
        </g>
      </svg>
      <p className="pa-coach-bubble">{text}</p>
    </div>
  );
}
