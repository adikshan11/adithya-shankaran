import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Mood } from '../piano/arranger';

// The Learn coach "Tempo Cat": a cute ginger kitten (drawn after a reference photo the user chose: a wide fluffy
// head, huge dark glossy eyes, a tiny pink nose, big pink ears) that is also a metronome, after the cat-shaped metronomes
// teachers keep on the piano. It sits with a big round head (chibi proportions), and wears the metronome on its
// chest: a white tempo scale whose needle ticks at your practice tempo, while its tail swings in time like a
// pendulum, because keeping time is the coach's job. Moods: it swings along while waiting, waves a paw on a right
// note, throws both paws up with the needle stopped when astonished, droops its ears and tail when upset, and
// flattens its ears, flushes and shakes when cross.
// The kitten is a set of generated images (Canva AI, made for this page): one per mood, the same kitten in each.
// Looks without their own image borrow the nearest one (purring uses the happy face with its eyes closed; sleepy and
// asleep use the calm one, dimmed; ashamed uses the upset one; grumpy the cross one).
// The kitten's own states on top of the coach's moods: purring when petted, grumpy when poked too much, yawning
// after a while with nothing played, asleep after longer, and startled awake by the next note.
type Look = Mood | 'purr' | 'grumpy' | 'sleepy' | 'asleep';
const SLEEPY_AFTER = 12000;
const ASLEEP_AFTER = 25000;

const PHOTO: Record<Look, string> = {
  idle: 'idle', happy: 'happy', astonished: 'astonished', upset: 'upset', angry: 'angry',
  purr: 'happy', grumpy: 'angry', sleepy: 'idle', asleep: 'idle', ashamed: 'upset',
};

export default function Coach({ mood: coachMood, text: coachText, tick, tempo }: { mood: Mood; text: string; tick: number; tempo: number }) {
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
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite" style={{ '--beat': `${(60 / Math.max(30, tempo)).toFixed(3)}s` } as CSSProperties}>
      <button type="button" className="pa-coach-pet" onClick={touch} aria-label="Pet the cat">
      <svg key={`w${woke}`} className={`pa-coach-figure co-photo ${woke ? 'co-woke' : ''}`} viewBox="0 0 200 200" aria-hidden="true">
        <g key={tick} className="co-act">
          <image href={`/coach/${PHOTO[mood] ?? 'idle'}.webp`} x={0} y={0} width={200} height={200} className="co-img" />
          {/* the metronome on its chest: a thin needle and gold weight ticking at the practice tempo */}
          <g className="co-pendulum">
            <line x1={100} y1={158} x2={100} y2={112} stroke="#6b5a4a" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
            <rect x={96} y={122} width={8} height={6} rx={1.8} fill="#f5c542" stroke="#9b6c0c" strokeWidth={0.8} />
          </g>
          <circle cx={100} cy={158} r={2.6} fill="#f5c542" stroke="#9b6c0c" strokeWidth={0.8} />
          {/* a little top hat for the musician, tilted between the ears */}
          <g className="co-hat" transform="translate(100 30) scale(1.25) translate(-60 -12) rotate(-10 60 14)">
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
        </g>
        {/* Zzz while asleep, hearts while purring */}
        {mood === 'asleep' && ['Z', 'z', 'z'].map((letter, index) => (
          <text key={index} x={150 + index * 11} y={60 - index * 14} className="co-zzz" style={{ animationDelay: `${index * 0.6}s` } as CSSProperties}>{letter}</text>
        ))}
        {mood === 'purr' && [0, 1, 2].map((index) => (
          <path key={`${pet?.key}-${index}`} d="M0 3 C0 -1 5 -1 5 3 C5 -1 10 -1 10 3 C10 7 5 9 5 11 C5 9 0 7 0 3 Z" className="co-heart" transform={`translate(${50 + index * 45} ${28 + (index % 2) * 10}) scale(1.6)`} style={{ animationDelay: `${index * 0.15}s` } as CSSProperties} />
        ))}
      </svg>
      </button>
      <p className="pa-coach-bubble"><span className="pa-coach-text">{text}</span></p>
    </div>
  );
}
