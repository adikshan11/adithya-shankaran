import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Mood } from '../piano/arranger';

// The Learn coach "Tempo Cat": a cute ginger kitten (drawn after a reference photo the user chose: a wide fluffy
// head, huge dark glossy eyes, a tiny pink nose, big pink ears) that is also a metronome, after the cat-shaped metronomes
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
  idle: { arms: [], eyes: 'open', mouth: 'M56 69 q2 2.4 4 0 q2 2.4 4 0', ears: 0 },
  happy: { arms: ['M84 92 q12 -8 12 -24'], eyes: 'happy', mouth: 'M55 68 q5 7 10 0 z', ears: -4 },
  astonished: { arms: ['M36 92 q-12 -8 -12 -24', 'M84 92 q12 -8 12 -24'], eyes: 'wide', mouth: 'M60 71 m-3 0 a3 4 0 1 0 6 0 a3 4 0 1 0 -6 0', ears: -6 },
  upset: { arms: [], eyes: 'sad', mouth: 'M56 71 q4 -3 8 0', brows: 'M35 35 l10 3 M85 35 l-10 3', ears: 22 },
  angry: { arms: ['M36 96 q-10 -2 -8 10 q3 3 8 -1', 'M84 96 q10 -2 8 10 q-3 3 -8 -1'], eyes: 'cross', mouth: 'M55 71 q5 -4 10 0', brows: 'M34 32 l12 6 M86 32 l-12 6', ears: 30 },
  purr: { arms: [], eyes: 'closed', mouth: 'M56 69 q2 2.4 4 0 q2 2.4 4 0', ears: -6 },
  grumpy: { arms: ['M36 96 q-10 -2 -8 10 q3 3 8 -1'], eyes: 'drowsy', mouth: 'M56 71 q4 -2.5 8 0', brows: 'M34 38 l12 2 M86 38 l-12 2', ears: 24 },
  sleepy: { arms: [], eyes: 'drowsy', mouth: 'M60 71 m-3.5 0 a3.5 5 0 1 0 7 0 a3.5 5 0 1 0 -7 0', ears: 8 },
  asleep: { arms: [], eyes: 'closed', mouth: 'M57 70 q3 1.6 6 0', ears: 14 },
  // Ashamed: paws over its eyes, ears flat, a little frown.
  ashamed: { arms: ['M36 92 q-6 -24 8 -42', 'M84 92 q6 -24 -8 -42'], eyes: 'closed', mouth: 'M56 72 q4 -3 8 0', ears: 28 },
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
  // Big, dark, glossy kitten eyes (after the reference photo): a brown iris almost filled by the pupil, a warm amber
  // glow along the bottom, a large and a small shine, and a soft fur rim; set low and wide on the round face.
  const EYE_Y = 50;
  const eye = (x: number) => {
    if (pose.eyes === 'happy') return <path d={`M${x - 9} ${EYE_Y + 2} q9 -11 18 0`} className="co-stroke" strokeWidth={3.2} />;
    if (pose.eyes === 'closed') return <path d={`M${x - 9} ${EYE_Y - 1} q9 8 18 0`} className="co-stroke" strokeWidth={3.2} />;
    if (pose.eyes === 'drowsy') return <g><ellipse cx={x} cy={EYE_Y + 2} rx={10} ry={4.4} fill="#1a0f08" /><path d={`M${x - 11} ${EYE_Y} h22`} className="co-stroke" strokeWidth={2.8} /></g>;
    const rx = pose.eyes === 'wide' ? 12.4 : 11.4;
    const ry = pose.eyes === 'wide' ? 13.4 : 12.4;
    return (
      <g>
        <ellipse cx={x} cy={EYE_Y} rx={rx + 1.4} ry={ry + 1.4} fill="#f7c48a" opacity={0.55} />
        <ellipse cx={x} cy={EYE_Y} rx={rx} ry={ry} fill="#1a0f08" />
        <ellipse cx={x} cy={EYE_Y + 0.8} rx={rx - 1.3} ry={ry - 1.4} fill={`url(#${id}-iris)`} />
        <ellipse cx={x} cy={EYE_Y + 0.4} rx={rx - 3.6} ry={ry - 3.4} fill="#0c0604" />
        <ellipse cx={x} cy={EYE_Y + ry - 3.6} rx={rx - 4} ry={2.6} fill="#e9a65a" opacity={0.55} />
        <ellipse cx={x + 3.6} cy={EYE_Y - 4.8} rx={4.4} ry={4.8} fill="#fff" />
        <circle cx={x - 4.2} cy={EYE_Y + 4.2} r={2} fill="#fff" opacity={0.95} />
        <circle cx={x + 6} cy={EYE_Y + 3} r={1} fill="#fff" opacity={0.8} />
        {pose.eyes === 'sad' && <path d={`M${x - 13} ${EYE_Y - ry - 1.5} h26 v9 q-13 -4 -26 0 z`} fill={fur} />}
        {pose.eyes === 'cross' && <path d={`M${x - 13} ${EYE_Y - ry - 2} h26 v${x < 60 ? 12 : 6} l-26 ${x < 60 ? -7 : 7} z`} fill={fur} />}
      </g>
    );
  };
  const ear = (side: -1 | 1) => {
    const x = 60 + side * 28;
    return (
      <g className="co-ear" style={{ transformBox: 'view-box', transformOrigin: `${x}px 30px`, transform: `rotate(${side * pose.ears}deg)` }}>
        <path d={`M${x - 16} 34 Q${x + side * 10} -18 ${x + 16} 30 Z`} fill={fur} stroke="#e6914a" strokeWidth={0.8} strokeLinejoin="round" />
        <path d={`M${x - 10} 31 Q${x + side * 8} -6 ${x + 10} 29 Z`} fill={`url(#${id}-earpink)`} />
        <path d={`M${x - 4} 29 l${side * 1} -10 M${x} 30 l${side * 2.5} -13 M${x + 4} 29 l${side * 3} -9`} stroke="#fff6ea" strokeWidth={0.8} strokeLinecap="round" opacity={0.95} />
      </g>
    );
  };
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite" style={{ '--beat': `${(60 / Math.max(30, tempo)).toFixed(3)}s` } as CSSProperties}>
      <button type="button" className="pa-coach-pet" onClick={touch} aria-label="Pet the cat">
      <svg key={`w${woke}`} className={`pa-coach-figure ${woke ? 'co-woke' : ''}`} viewBox="0 -16 120 156" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-fur`} cx="45%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#ffe0b4" />
            <stop offset="50%" stopColor="#f7b06a" />
            <stop offset="100%" stopColor="#e58d40" />
          </radialGradient>
          <radialGradient id={`${id}-earpink`} cx="50%" cy="70%" r="70%">
            <stop offset="0%" stopColor="#ffb3a7" />
            <stop offset="100%" stopColor="#f08672" />
          </radialGradient>
          <radialGradient id={`${id}-cream`} cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffeed6" />
          </radialGradient>
          <radialGradient id={`${id}-iris`} cx="50%" cy="65%" r="70%">
            <stop offset="0%" stopColor="#c8843c" />
            <stop offset="60%" stopColor="#7a4a1e" />
            <stop offset="100%" stopColor="#3b2210" />
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
          <path d="M34 130 C26 104 38 80 60 78 C82 80 94 104 86 130 Q60 136 34 130 Z" fill={fur} stroke="#e6914a" strokeWidth={0.8} />
          <ellipse cx={37} cy={120} rx={12} ry={13} fill={fur} stroke="#e6914a" strokeWidth={0.8} />
          <ellipse cx={83} cy={120} rx={12} ry={13} fill={fur} stroke="#e6914a" strokeWidth={0.8} />
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
          <path d="M20 54 C17 28 38 11 60 11 C82 11 103 28 100 54 C101 62 99 68 96 72 L101 75 L93 76 C89 81 84 83 78 84 L80 87 L72 85 C66 87 54 87 48 85 L40 87 L42 84 C36 83 31 81 27 76 L19 75 L24 72 C21 68 19 62 20 54 Z" fill={fur} stroke="#e6914a" strokeWidth={0.8} strokeLinejoin="round" />
          {/* fluffy wisps along the cheeks and the crown, catching the light */}
          <path d="M21 58 l-7 1 M21 65 l-7 4 M25 72 l-6 6 M99 58 l7 1 M99 65 l7 4 M95 72 l6 6 M50 12 l-2 -6 M60 11 v-7 M70 12 l2 -6" stroke="#f6b46e" strokeWidth={1.8} strokeLinecap="round" />
          <path d="M22 60 l-6 2 M23 69 l-5 5 M98 60 l6 2 M97 69 l5 5 M55 12 l-1 -5 M65 12 l1 -5" stroke="#fff1dc" strokeWidth={0.7} strokeLinecap="round" opacity={0.9} />
          <path d="M51 19 q1.5 6 0 10 M60 17 q1.5 7 0 12 M69 19 q1.5 6 0 10 M24 46 q5 1 8 -1 M88 45 q5 2 8 1" className="co-stripe" />
          <path className="co-flush" d="M20 54 C17 28 38 11 60 11 C82 11 103 28 100 54 C101 62 99 68 96 72 L101 75 L93 76 C89 81 84 83 78 84 L80 87 L72 85 C66 87 54 87 48 85 L40 87 L42 84 C36 83 31 81 27 76 L19 75 L24 72 C21 68 19 62 20 54 Z" />
          {/* A little top hat for the musician: piano keys on its band and a gold note tucked in, tilted at a jaunty angle. */}
          <g className="co-hat" transform="translate(60 12) scale(0.84) translate(-60 -12) rotate(-10 60 14)">
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
          <ellipse cx={60} cy={70} rx={13} ry={9} fill={`url(#${id}-cream)`} />
          <ellipse cx={60} cy={80} rx={11} ry={5} fill={`url(#${id}-cream)`} opacity={0.9} />
          <ellipse cx={32} cy={64} rx={5.5} ry={3.4} className="co-cheek" />
          <ellipse cx={88} cy={64} rx={5.5} ry={3.4} className="co-cheek" />
          <path d="M48 67 C38 64 28 63 14 66 M48 70 C38 70 28 72 16 76 M72 67 C82 64 92 63 106 66 M72 70 C82 70 92 72 104 76" className="co-whisker" />
          {eye(42)}
          {eye(78)}
          {pose.brows && <path d={pose.brows} className="co-stroke" strokeWidth={2.4} />}
          <path d="M57.4 63.4 h5.2 q-0.6 2.6 -2.6 3 q-2 -0.4 -2.6 -3 z" fill="#f4908e" stroke="#d26b6b" strokeWidth={0.5} strokeLinejoin="round" />
          <path d="M60 66.4 v2" stroke="#d98d7a" strokeWidth={0.8} strokeLinecap="round" />
          <path d={pose.mouth} className={mood === 'happy' || mood === 'astonished' || mood === 'sleepy' ? 'co-mouth' : 'co-stroke'} strokeWidth={1.7} />
        </g>
        {/* Zzz while asleep, hearts while purring */}
        {mood === 'asleep' && ['Z', 'z', 'z'].map((letter, index) => (
          <text key={index} x={101 + index * 6} y={20 - index * 8} className="co-zzz" style={{ animationDelay: `${index * 0.6}s` } as CSSProperties}>{letter}</text>
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
