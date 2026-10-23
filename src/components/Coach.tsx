import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Mood } from '../piano/arranger';

// The Learn coach "Tempo Cat": a ginger kitten that is also a metronome, after the cat-shaped metronomes teachers keep
// on the piano. A thin needle on its chest ticks at your practice tempo.
// The kitten is a set of generated images (Canva AI, made for this page): one per mood, the same kitten in each. Each
// image is split in two layers, the body and the tail (with blurred fur under the tail), so the tail can move.
// It behaves like a real cat between notes: it breathes, blinks every few seconds, and now and then flicks its tail,
// tilts its head, glances to the side or stretches up. Looks without their own image borrow the nearest one.
// What it does when you touch it, each different from its reaction to your playing:
//   a tap (a boop on the nose): it startles, eyes wide, tail puffed up ("Mew?");
//   a pat (stroke across it, or press and hold): it shuts its eyes and purrs, hearts float up, tail sways slowly;
//   four taps within two seconds: grumpy.
// A right note: it waves a paw, smiling. Then yawning after a while with nothing played, asleep after longer.
type Look = Mood | 'purr' | 'boop' | 'grumpy' | 'sleepy' | 'asleep';
type Habit = 'flick' | 'tilt' | 'glance' | 'stretch';
const SLEEPY_AFTER = 12000;
const ASLEEP_AFTER = 25000;

const PHOTO: Record<Look, keyof typeof TAIL> = {
  idle: 'idle', happy: 'happy', astonished: 'astonished', upset: 'upset', angry: 'angry',
  purr: 'idle', boop: 'astonished', grumpy: 'angry', sleepy: 'idle', asleep: 'idle', ashamed: 'upset',
};
// Where each tail layer sits in the 200 x 200 image, and where it joins the body (the point it swings from).
const TAIL = {
  idle: { x: 131, y: 140, w: 53, h: 53, px: 133, py: 182 },
  happy: { x: 132, y: 140, w: 44, h: 52, px: 134, py: 183 },
  astonished: { x: 121, y: 140, w: 42, h: 56, px: 123, py: 188 },
  upset: { x: 130, y: 135, w: 46, h: 51, px: 132, py: 178 },
  angry: { x: 136, y: 140, w: 46, h: 52, px: 138, py: 183 },
};
// Faces with a closed-eye photo (made from the same picture, the fur above each eye drawn down over it), used for
// blinks, purring and sleep.
const SHUT = new Set(['idle', 'upset']);
const HABITS: [Habit, number, number][] = [['flick', 0.34, 1000], ['tilt', 0.24, 1700], ['glance', 0.24, 1900], ['stretch', 0.18, 1300]];
const rand = (low: number, high: number) => low + Math.random() * (high - low);

export default function Coach({ mood: coachMood, text: coachText, tick, tempo }: { mood: Mood; text: string; tick: number; tempo: number }) {
  const [rest, setRest] = useState<'awake' | 'sleepy' | 'asleep'>('awake');
  const [woke, setWoke] = useState(0); // bumps when a note startles it awake
  const [pet, setPet] = useState<{ look: 'purr' | 'boop' | 'grumpy'; text: string; key: number } | null>(null);
  const [blink, setBlink] = useState(false);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [nudge, setNudge] = useState(0); // bumps on every touch, which also keeps it awake
  const pokes = useRef<number[]>([]);
  const stroke = useRef<{ x: number; y: number; moved: number; at: number; patted: boolean; hold: number } | null>(null);
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
  }, [tick, nudge]);
  useEffect(() => {
    if (!pet) return;
    const done = setTimeout(() => setPet(null), pet.look === 'purr' ? 2200 : pet.look === 'boop' ? 1300 : 2400);
    return () => clearTimeout(done);
  }, [pet]);

  const mood: Look = pet?.look ?? (rest === 'asleep' ? 'asleep' : rest === 'sleepy' ? 'sleepy' : coachMood);
  const photo = PHOTO[mood] ?? 'idle';
  const calm = mood === 'idle' || mood === 'upset' || mood === 'sleepy';

  // Life between notes: a blink every 2.5 to 6 s (sometimes a double blink), and a habit every 2.5 to 5.5 s, only while
  // the kitten is calm, so it never fights a reaction.
  useEffect(() => {
    if (!calm || typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timers: number[] = [];
    const later = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    const blinkLoop = () => {
      later(rand(2500, 6000), () => {
        setBlink(true);
        later(mood === 'sleepy' ? rand(700, 1300) : 150, () => setBlink(false)); // sleepy: slow, heavy blinks
        if (Math.random() < 0.25) later(330, () => { setBlink(true); later(140, () => setBlink(false)); });
        blinkLoop();
      });
    };
    const habitLoop = () => {
      later(rand(2500, 5500), () => {
        let pick = Math.random();
        const [name, , length] = HABITS.find(([, weight]) => (pick -= weight) < 0) ?? HABITS[0];
        setHabit(name);
        later(length, () => setHabit(null));
        habitLoop();
      });
    };
    blinkLoop();
    if (mood !== 'sleepy') habitLoop();
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      setBlink(false);
      setHabit(null);
    };
  }, [calm, mood]);

  const wake = () => {
    setNudge((value) => value + 1);
    if (restRef.current !== 'awake') {
      setRest('awake');
      setWoke((value) => value + 1);
    }
  };
  const boop = () => {
    const now = performance.now();
    pokes.current = [...pokes.current.filter((at) => now - at < 2000), now];
    wake();
    if (pokes.current.length >= 4) setPet({ look: 'grumpy', text: 'Hey! Less poking, more playing.', key: now });
    else setPet({ look: 'boop', text: ['Mew? That was my nose.', 'Boop! Again?', 'Mrrp! Play me something.'][pokes.current.length - 1] ?? 'Mew?', key: now });
  };
  const purr = () => {
    pokes.current = [];
    wake();
    const now = performance.now();
    // Already purring: keep it going (a new object restarts the timer) and send up fresh hearts at most every 0.7 s.
    setPet((current) => current?.look === 'purr' ? { ...current, key: now - current.key > 700 ? now : current.key } : { look: 'purr', text: ['Purrr…', 'Purr… right there.', 'Prrr… that is nice.'][Math.floor(Math.random() * 3)], key: now });
  };
  // A pat is a stroke of 24 px or more across the kitten, or a press held for 0.45 s. A short tap is a boop.
  const down = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const hold = window.setTimeout(() => {
      if (stroke.current && !stroke.current.patted) {
        stroke.current.patted = true;
        purr();
      }
    }, 450);
    stroke.current = { x: event.clientX, y: event.clientY, moved: 0, at: performance.now(), patted: false, hold };
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = stroke.current;
    if (!current) return;
    current.moved += Math.hypot(event.clientX - current.x, event.clientY - current.y);
    current.x = event.clientX;
    current.y = event.clientY;
    if (current.moved >= 24) {
      current.moved = 0;
      current.patted = true;
      purr(); // every stroke keeps it purring
    }
  };
  const up = () => {
    const current = stroke.current;
    stroke.current = null;
    if (!current) return;
    clearTimeout(current.hold);
    if (!current.patted) boop();
  };

  const text = pet?.text ?? (rest === 'asleep' ? 'Zzz… play a note to wake me.' : rest === 'sleepy' ? '*yawn* … still there? Play the green key.' : coachText);
  const tail = TAIL[photo];
  const shut = SHUT.has(photo) && (mood === 'purr' || mood === 'asleep' || blink);
  return (
    <div className={`pa-coach pa-coach-${mood}`} role="status" aria-live="polite" style={{ '--beat': `${(60 / Math.max(30, tempo)).toFixed(3)}s` } as CSSProperties}>
      <button
        type="button"
        className="pa-coach-pet"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => { if (stroke.current) clearTimeout(stroke.current.hold); stroke.current = null; }}
        onClick={(event) => event.detail === 0 && boop() /* keyboard: Enter or Space boops */}
        aria-label="Pet the cat (tap to boop, stroke to pat)"
      >
      <svg key={`w${woke}`} className={`pa-coach-figure co-photo ${woke ? 'co-woke' : ''}`} viewBox="0 0 200 200" aria-hidden="true">
        <g className={`co-life ${habit ? `co-do-${habit}` : ''}`}>
        <g key={tick} className="co-act">
          <image href={`/coach/${photo}.webp`} x={0} y={0} width={200} height={200} className="co-img" />
          {SHUT.has(photo) && <image href={`/coach/${photo}-shut.webp`} x={0} y={0} width={200} height={200} className={`co-img co-shut ${shut ? 'co-shut-on' : ''}`} />}
          <image href={`/coach/${photo}-tail.webp`} x={tail.x} y={tail.y} width={tail.w} height={tail.h} className="co-tailimg" style={{ transformOrigin: `${tail.px}px ${tail.py}px` }} />
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
        </g>
        {/* Zzz while asleep, hearts while purring, a "?" when booped */}
        {mood === 'asleep' && ['Z', 'z', 'z'].map((letter, index) => (
          <text key={index} x={150 + index * 11} y={60 - index * 14} className="co-zzz" style={{ animationDelay: `${index * 0.6}s` } as CSSProperties}>{letter}</text>
        ))}
        {mood === 'purr' && [0, 1, 2].map((index) => (
          <path key={`${pet?.key}-${index}`} d="M0 3 C0 -1 5 -1 5 3 C5 -1 10 -1 10 3 C10 7 5 9 5 11 C5 9 0 7 0 3 Z" className="co-heart" transform={`translate(${50 + index * 45} ${28 + (index % 2) * 10}) scale(1.6)`} style={{ animationDelay: `${index * 0.15}s` } as CSSProperties} />
        ))}
        {mood === 'boop' && <text key={pet?.key} x={150} y={40} className="co-what">?</text>}
      </svg>
      </button>
      <p className="pa-coach-bubble"><span className="pa-coach-text">{text}</span></p>
    </div>
  );
}
