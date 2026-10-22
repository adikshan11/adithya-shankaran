import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Mood } from '../piano/arranger';

// The Learn coach "Tempo Cat": a cute ginger tabby that is also a metronome, after the cat-shaped metronomes
// teachers keep on the piano. It sits with a big round head (chibi proportions), and wears the metronome on its
// chest: a white tempo scale whose needle ticks at your practice tempo, while its tail swings in time like a
// pendulum, because keeping time is the coach's job. Moods: it swings along while waiting, waves a paw on a right
// note, throws both paws up with the needle stopped when astonished, droops its ears and tail when upset, and
// flattens its ears, flushes and shakes when cross.
type Pose = { arms: string[]; eyes: 'open' | 'happy' | 'wide' | 'sad' | 'cross' | 'closed' | 'drowsy'; mouth: string; brows?: string; ears: number };
// The kitten's own states on top of the coach's moods: purring when petted, grumpy when poked too much, yawning
// after a while with nothing played, asleep after longer, and startled awake by the next note.
type Look = Mood | 'purr' | 'grumpy' | 'sleepy' | 'asleep';
const SLEEPY_AFTER = 12000;
const ASLEEP_AFTER = 25000;

const POSES: Record<Look, Pose> = {
  idle: { arms: [], eyes: 'open', mouth: 'M54 63 q3 3.5 6 0 q3 3.5 6 0', ears: 0 },
  happy: { arms: ['M84 92 q12 -8 12 -24'], eyes: 'happy', mouth: 'M53.5 62 q6.5 9 13 0 z', ears: -4 },
  astonished: { arms: ['M36 92 q-12 -8 -12 -24', 'M84 92 q12 -8 12 -24'], eyes: 'wide', mouth: 'M60 66 m-3.5 0 a3.5 4.5 0 1 0 7 0 a3.5 4.5 0 1 0 -7 0', ears: -6 },
  upset: { arms: [], eyes: 'sad', mouth: 'M55 66 q5 -4 10 0', brows: 'M39 34 l8 3 M81 34 l-8 3', ears: 22 },
  angry: { arms: ['M36 96 q-10 -2 -8 10 q3 3 8 -1', 'M84 96 q10 -2 8 10 q-3 3 -8 -1'], eyes: 'cross', mouth: 'M54 66 q6 -5 12 0', brows: 'M38 32 l10 6 M82 32 l-10 6', ears: 30 },
  purr: { arms: [], eyes: 'closed', mouth: 'M54 63 q3 3.5 6 0 q3 3.5 6 0', ears: -6 },
  grumpy: { arms: ['M36 96 q-10 -2 -8 10 q3 3 8 -1'], eyes: 'drowsy', mouth: 'M55 66 q5 -3 10 0', brows: 'M38 37 l10 2 M82 37 l-10 2', ears: 24 },
  sleepy: { arms: [], eyes: 'drowsy', mouth: 'M60 66 m-4 0 a4 5.5 0 1 0 8 0 a4 5.5 0 1 0 -8 0', ears: 8 },
  asleep: { arms: [], eyes: 'closed', mouth: 'M56 64 q4 2 8 0', ears: 14 },
};

export default function Coach({ mood: coachMood, text: coachText, tick, tempo }: { mood: Mood; text: string; tick: number; tempo: number }) {
  const id = useId().replace(/:/g, '');
  const [rest, setRest] = useState<'awake' | 'sleepy' | 'asleep'>('awake');
  const [woke, setWoke] = useState(0); // bumps when a note startles it awake
  const [pet, setPet] = useState<{ look: 'purr' | 'grumpy'; text: string; key: number } | null>(null);
  const pokes = useRef<number[]>([]);
  const restRef = useRef(rest);
  restRef.current = rest;
  // Every coach message means a note was played: wake up (with a start if it was dozing) and restart the timers.
  useEffect(() => {
    if (restRef.current !== 'awake') setWoke((value) => value + 1);
    setRest('awake');
    const sleepy = setTimeout(() => setRest('sleepy'), SLEEPY_AFTER);
    const asleep = setTimeout(() => setRest('asleep'), ASLEEP_AFTER);
    return () => {
      clearTimeout(sleepy);
      clearTimeout(asleep);
    };
  }, [tick]);
  useEffect(() => {
    if (!pet) return;
    const done = setTimeout(() => setPet(null), pet.look === 'purr' ? 1800 : 2400);
    return () => clearTimeout(done);
  }, [pet]);
  // Tap or click: a purr and hearts; four taps within two seconds make it grumpy. Tapping a sleeping kitten wakes it.
  const touch = () => {
    const now = performance.now();
    pokes.current = [...pokes.current.filter((at) => now - at < 2000), now];
    if (rest !== 'awake') {
      setRest('awake');
      setWoke((value) => value + 1);
    }
    if (pokes.current.length >= 4) setPet({ look: 'grumpy', text: 'Hey! Less poking, more playing.', key: now });
    else setPet({ look: 'purr', text: ['Purrr…', 'Mrrow! Again?', 'Purr… now play me something.'][pokes.current.length - 1] ?? 'Purrr…', key: now });
  };
  const mood: Look = pet?.look ?? (rest === 'asleep' ? 'asleep' : rest === 'sleepy' ? 'sleepy' : coachMood);
  const text = pet?.text ?? (rest === 'asleep' ? 'Zzz… play a note to wake me.' : rest === 'sleepy' ? '*yawn* … still there? Play the green key.' : coachText);
  const pose = POSES[mood];
  const fur = `url(#${id}-fur)`;
  // Big, glossy kitten eyes: a large green iris, a big and a small shine, a soft lower glow and a lash flick.
  const eye = (x: number) => {
    const side = x < 60 ? -1 : 1;
    const lash = <path d={`M${x + side * 8.5} 40 l${side * 3.5} -3`} className="co-stroke" strokeWidth={1.8} />;
    if (pose.eyes === 'happy') return <g><path d={`M${x - 7} 47 q7 -9 14 0`} className="co-stroke" strokeWidth={3} />{lash}</g>;
    if (pose.eyes === 'closed') return <g><path d={`M${x - 7} 45 q7 7 14 0`} className="co-stroke" strokeWidth={3} />{lash}</g>;
    if (pose.eyes === 'drowsy') return <g><ellipse cx={x} cy={48} rx={8} ry={3.6} fill="#24150e" /><path d={`M${x - 9} 46 h18`} className="co-stroke" strokeWidth={2.6} />{lash}</g>;
    const rx = pose.eyes === 'wide' ? 10 : 9;
    const ry = pose.eyes === 'wide' ? 11.5 : 10.5;
    return (
      <g>
        <ellipse cx={x} cy={46} rx={rx} ry={ry} fill="#24150e" />
        <ellipse cx={x} cy={47.5} rx={rx - 1.6} ry={ry - 1.8} fill={`url(#${id}-iris)`} />
        <ellipse cx={x} cy={48} rx={rx - 4.8} ry={ry - 4.4} fill="#1b100b" />
        <ellipse cx={x} cy={53.5} rx={rx - 3.5} ry={2.6} fill="#c8ff9e" opacity={0.45} />
        <ellipse cx={x + 3} cy={41.5} rx={3.8} ry={4.2} fill="#fff" />
        <circle cx={x - 3.6} cy={51} r={1.8} fill="#fff" />
        <circle cx={x + 5.2} cy={49.5} r={0.9} fill="#fff" opacity={0.9} />
        {lash}
        {pose.eyes === 'sad' && <path d={`M${x - 11} ${46 - ry - 1} h22 v8 q-11 -3.5 -22 0 z`} fill={fur} />}
        {pose.eyes === 'cross' && <path d={`M${x - 11} 34 h22 v${x < 60 ? 10 : 5} l-22 ${x < 60 ? -6 : 6} z`} fill={fur} />}
      </g>
    );
  };
  const ear = (side: -1 | 1) => {
    const x = 60 + side * 22;
    return (
      <g className="co-ear" style={{ transformBox: 'view-box', transformOrigin: `${x}px 30px`, transform: `rotate(${side * pose.ears}deg)` }}>
        <path d={`M${x - 12} 30 Q${x + side * 4} -2 ${x + 12} 26 Z`} fill={fur} stroke="#d9732a" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={`M${x - 6} 27 Q${x + side * 3} 7 ${x + 6} 25 Z`} fill="#ffb8c6" />
      </g>
    );
  };
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite" style={{ '--beat': `${(60 / Math.max(30, tempo)).toFixed(3)}s` } as CSSProperties}>
      <button type="button" className="pa-coach-pet" onClick={touch} aria-label="Pet the cat">
      <svg key={`w${woke}`} className={`pa-coach-figure ${woke ? 'co-woke' : ''}`} viewBox="0 -16 120 156" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-fur`} cx="40%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffd59a" />
            <stop offset="55%" stopColor="#ffa94d" />
            <stop offset="100%" stopColor="#f08a2c" />
          </radialGradient>
          <radialGradient id={`${id}-cream`} cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffeed6" />
          </radialGradient>
          <radialGradient id={`${id}-iris`} cx="45%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#8fdc6c" />
            <stop offset="100%" stopColor="#2f8f4e" />
          </radialGradient>
        </defs>
        <ellipse cx={60} cy={135} rx={34} ry={4.5} className="co-shadow" />
        <g key={tick} className="co-act">
          {/* the tail, swinging in time like a pendulum */}
          <g className="co-tail">
            <path d="M80 124 C104 120 108 96 98 76" fill="none" stroke="#f08a2c" strokeWidth={9} strokeLinecap="round" />
            <path d="M80 124 C104 120 108 96 98 76" fill="none" stroke="#d9661e" strokeWidth={9} strokeLinecap="butt" strokeDasharray="4 8" />
            <circle cx={98} cy={76} r={4.6} fill="#fff3e2" />
          </g>
          {/* sitting body and haunches */}
          <path d="M34 130 C26 104 38 80 60 78 C82 80 94 104 86 130 Q60 136 34 130 Z" fill={fur} stroke="#d9732a" strokeWidth={1.4} />
          <ellipse cx={37} cy={120} rx={12} ry={13} fill={fur} stroke="#d9732a" strokeWidth={1.2} />
          <ellipse cx={83} cy={120} rx={12} ry={13} fill={fur} stroke="#d9732a" strokeWidth={1.2} />
          <path d="M30 108 q5 2 8 0 M82 108 q5 2 8 0 M29 116 q5 2 8 0 M83 116 q5 2 8 0" className="co-stripe" />
          {/* the metronome on its chest: a white scale with a needle ticking at the practice tempo */}
          <path d="M60 82 C69 92 71 112 66 128 L54 128 C49 112 51 92 60 82 Z" fill={`url(#${id}-cream)`} stroke="#e8c49a" strokeWidth={1} />
          {[94, 101, 108, 115].map((y) => <line key={y} x1={56.5} x2={63.5} y1={y} y2={y} stroke="#f0a24a" strokeWidth={1.1} strokeLinecap="round" />)}
          <g className="co-pendulum">
            <line x1={60} y1={125} x2={60} y2={88} stroke="#7a828c" strokeWidth={1.6} strokeLinecap="round" />
            <rect x={57} y={96} width={6} height={4.5} rx={1.4} fill="#f5c542" stroke="#9b6c0c" strokeWidth={0.6} />
          </g>
          <circle cx={60} cy={125} r={2.2} fill="#f5c542" stroke="#9b6c0c" strokeWidth={0.6} />
          {/* front paws, and raised paws for the moods that wave */}
          <ellipse cx={49} cy={131} rx={8} ry={5} fill={`url(#${id}-cream)`} stroke="#e8c49a" strokeWidth={1} />
          <ellipse cx={71} cy={131} rx={8} ry={5} fill={`url(#${id}-cream)`} stroke="#e8c49a" strokeWidth={1} />
          <path d="M47 133 v-3 M51 133 v-3 M69 133 v-3 M73 133 v-3" stroke="#e0b88a" strokeWidth={0.9} strokeLinecap="round" />
          {pose.arms.map((arm) => (
            <g key={arm}>
              <path d={arm} className="co-paw-edge" />
              <path d={arm} className="co-paw" />
            </g>
          ))}
          {/* the head: big and round, ears, tabby stripes, cheek tufts */}
          {ear(-1)}
          {ear(1)}
          <path d="M26 50 C24 26 42 14 60 14 C78 14 96 26 94 50 C96 60 90 72 82 74 L86 77 L76 76 C70 79 50 79 44 76 L34 77 L38 74 C30 72 24 60 26 50 Z" fill={fur} stroke="#d9732a" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M53 18 q1 7 0 10 M60 16 q1 8 0 12 M67 18 q1 7 0 10 M30 44 q5 1 7 0 M83 44 q5 1 7 0" className="co-stripe" />
          <path className="co-flush" d="M26 50 C24 26 42 14 60 14 C78 14 96 26 94 50 C96 60 90 72 82 74 L86 77 L76 76 C70 79 50 79 44 76 L34 77 L38 74 C30 72 24 60 26 50 Z" />
          {/* A little top hat for the musician: piano keys on its band and a gold note tucked in, tilted at a jaunty angle. */}
          <g className="co-hat" transform="rotate(-10 60 14)">
            <ellipse cx={60} cy={16} rx={24} ry={5} fill="#1d1e23" stroke="#0b0b0d" strokeWidth={1} />
            <path d="M44 15 L46 -8 Q60 -12 74 -8 L76 15 Q60 19 44 15 Z" fill="#26272d" stroke="#0b0b0d" strokeWidth={1} />
            <path d="M45 9 Q60 13 75 9 L75.6 15 Q60 19 44.4 15 Z" fill="#f6f4ee" />
            {[49, 54, 63, 68].map((x) => <rect key={x} x={x} y={9.6} width={2.4} height={4} rx={0.5} fill="#16171a" />)}
            <path d="M50 -6 Q54 -9 58 -7" stroke="#fff" strokeOpacity={0.25} strokeWidth={1.5} fill="none" strokeLinecap="round" />
            <g transform="translate(70 -4)">
              <path d="M4 0 V12" stroke="#d9a520" strokeWidth={1.6} strokeLinecap="round" />
              <path d="M4 0 Q9 2 9 6" stroke="#d9a520" strokeWidth={1.6} fill="none" strokeLinecap="round" />
              <ellipse cx={2} cy={12.5} rx={2.8} ry={2.1} fill="#f5c542" stroke="#9b6c0c" strokeWidth={0.6} transform="rotate(-20 2 12.5)" />
            </g>
          </g>
          <ellipse cx={60} cy={62} rx={15} ry={10} fill={`url(#${id}-cream)`} />
          <ellipse cx={38} cy={58} rx={5.5} ry={3.6} className="co-cheek" />
          <ellipse cx={82} cy={58} rx={5.5} ry={3.6} className="co-cheek" />
          <path d="M45 61 l-15 -3 M45 64 l-15 1 M45 67 l-13 4 M75 61 l15 -3 M75 64 l15 1 M75 67 l13 4" className="co-whisker" />
          {eye(45)}
          {eye(75)}
          {pose.brows && <path d={pose.brows} className="co-stroke" strokeWidth={2.4} />}
          <path d="M57 56.5 h6 q-1 3.2 -3 3.6 q-2 -0.4 -3 -3.6 z" fill="#ff7f9b" stroke="#c94d6a" strokeWidth={0.6} strokeLinejoin="round" />
          <path d={pose.mouth} className={mood === 'happy' || mood === 'astonished' || mood === 'sleepy' ? 'co-mouth' : 'co-stroke'} strokeWidth={1.7} />
        </g>
        {/* Zzz while asleep, hearts while purring */}
        {mood === 'asleep' && ['Z', 'z', 'z'].map((letter, index) => (
          <text key={index} x={92 + index * 7} y={34 - index * 9} className="co-zzz" style={{ animationDelay: `${index * 0.6}s` } as CSSProperties}>{letter}</text>
        ))}
        {mood === 'purr' && [0, 1, 2].map((index) => (
          <path key={`${pet?.key}-${index}`} d="M0 3 C0 -1 5 -1 5 3 C5 -1 10 -1 10 3 C10 7 5 9 5 11 C5 9 0 7 0 3 Z" className="co-heart" transform={`translate(${30 + index * 26} ${14 + (index % 2) * 6})`} style={{ animationDelay: `${index * 0.15}s` } as CSSProperties} />
        ))}
      </svg>
      </button>
      <p className="pa-coach-bubble"><span className="pa-coach-text">{text}</span></p>
    </div>
  );
}
