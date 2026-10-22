import type { CSSProperties } from 'react';
import type { LearnResult as Result } from '../piano/arranger';

// Best stars per piece and hand, kept in this browser so the Learn list can show what has been earned.
const KEY = 'piano-learn-best';
export function bestStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}
export function saveStars(id: string, stars: number) {
  try {
    const best = bestStars();
    if ((best[id] ?? -1) < stars) localStorage.setItem(KEY, JSON.stringify({ ...best, [id]: stars }));
  } catch {
    // storage blocked: the stars just are not remembered
  }
}

const TITLES = { perfect: 'Perfect!', great: 'Excellent!', good: 'Well played', practice: 'Needs practice', poor: 'Oh dear…' } as const;
const COLORS = ['#f5b800', '#ff6b8a', '#59d0ff', '#5ef08f', '#b18cff', '#ff9f43'];

// The card at the end of a piece: stars, the numbers, a reward or a penalty, and what to do next.
export default function LearnResult({ result, title, speed, onAgain, onSpeed, onDone }: {
  result: Result;
  title: string;
  speed: number;
  onAgain: () => void;
  onSpeed: (speed: number) => void;
  onDone: () => void;
}) {
  const { grade, stars, accuracy, misses, notes, seconds, steady } = result;
  // The last stage: every note right at full speed. Nothing faster to unlock, so it says the piece is mastered.
  const mastered = grade === 'perfect' && speed >= 1;
  // Past mastery: bonus speeds of 150% and 200%, for fun, after the piece is right at its own tempo.
  const bonus = speed > 1;
  const faster = speed < 0.75 ? 0.75 : speed < 1 ? 1 : 0;
  const bonusNext = grade === 'perfect' ? (speed < 1.5 ? 1.5 : speed < 2 ? 2 : 0) : 0;
  const slower = speed > 0.75 ? 0.75 : speed > 0.5 ? 0.5 : 0;
  const note = {
    perfect: bonus
      ? `${title} at ${Math.round(speed * 100)}% of its own tempo, without a wrong note.${speed < 2 ? ' 200% is next, if you dare.' : ' That is double speed: top of the bonus ladder.'}`
      : mastered
      ? `You have mastered ${title}: every note right at full speed${steady ? ', in a steady rhythm' : ''}. Want to experiment at high speed? 150% and 200% are now open.`
      : `Every note of ${title} right${steady ? ', in a steady rhythm' : ''}. That is concert standard.`,
    great: `Only ${misses} slip${misses === 1 ? '' : 's'} in ${notes} notes${steady ? ', and a steady pulse' : ''}.`,
    good: `${misses} slips in ${notes} notes. Play the bars where you slipped slowly a few times, then go again.`,
    practice: `${misses} wrong notes. Try one hand at a time, at a slower speed, and watch the green keys.`,
    poor: `${misses} wrong notes out of ${notes}. Slow right down and get every note before any speed.`,
  }[grade];
  return (
    <>
      {(grade === 'perfect' || grade === 'great') && (
        <div className="pa-confetti" aria-hidden="true">
          {Array.from({ length: grade === 'perfect' ? 70 : 30 }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${(index * 37) % 100}%`,
                background: COLORS[index % COLORS.length],
                animationDelay: `${(index % 14) * 0.08}s`,
                '--drift': `${((index * 53) % 120) - 60}px`,
                '--spin': `${(index % 2 ? 1 : -1) * (360 + ((index * 41) % 540))}deg`,
              } as CSSProperties}
            />
          ))}
        </div>
      )}
      <div className={`pa-result pa-result-${grade}`} role="dialog" aria-label="Result">
        <div className="pa-result-card">
          <p className="pa-result-title">{bonus && grade === 'perfect' ? `Bonus ${Math.round(speed * 100)}% cleared!` : mastered ? 'Mastered!' : TITLES[grade]}</p>
          <div className="pa-result-stars" aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map((index) => <span key={index} className={index < stars ? 'on' : 'off'}>★</span>)}
          </div>
          <div className="pa-result-stats">
            <span><b>{Math.round(accuracy * 100)}%</b>right</span>
            <span><b>{misses}</b>wrong</span>
            <span><b>{Math.round(seconds)} s</b>time</span>
            <span><b>{Math.round(speed * 100)}%</b>speed</span>
          </div>
          <p className="pa-result-note">{note}</p>
          {mastered && !bonus && <span className="pa-result-reward pa-result-mastered">♛ Song mastered: a crown beside it in the Learn list</span>}
          {mastered && bonus && <span className="pa-result-reward pa-result-mastered">⚡ Bonus speed cleared</span>}
          {grade === 'perfect' && !mastered && <span className="pa-result-reward">Reward: a gold star badge and the next speed unlocked</span>}
          {grade === 'great' && <span className="pa-result-reward">Reward: a fish treat for the cat</span>}
          {grade === 'poor' && <span className="pa-result-shame">No treat this time. Replay slower to earn it back.</span>}
          <div className="pa-result-actions">
            {grade === 'poor' && slower > 0 ? (
              <button type="button" onClick={() => onSpeed(slower)}>Again at {slower * 100}%</button>
            ) : (
              <button type="button" onClick={onAgain}>Play again</button>
            )}
            {(grade === 'perfect' || grade === 'great') && faster > 0 && <button type="button" onClick={() => onSpeed(faster)}>Try {faster * 100}%</button>}
            {bonusNext > 0 && <button type="button" className="bonus" onClick={() => onSpeed(bonusNext)}>⚡ Bonus: try {bonusNext * 100}%</button>}
            <button type="button" className="quiet" onClick={onDone}>Done</button>
          </div>
        </div>
      </div>
    </>
  );
}
