import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { categories, sounds, styleCategories, styleMeter, styles } from '../piano/arranger';
import type { Hand } from '../piano/arranger';
import type { Arranger } from '../piano/arranger';
import { meters } from '../piano/notation';
import { songs } from '../piano/songs';

// The colour touchscreen. The main page shows the sound, style, song, tempo, time signature, settings and the chord
// being played; tapping any of them opens its page, as on a Korg Pa300.
export type Page = 'main' | 'sound' | 'style' | 'song' | 'metro' | 'tune' | 'rec' | 'learn' | 'score';

type Props = {
  arranger: Arranger;
  page: Page;
  category: string;
  open: (page: Page, category?: string) => void;
  message: string;
  beat: boolean;
  meterRef: (element: HTMLSpanElement | null) => void;
  takes?: ReactNode;
  score?: ReactNode;
  onClear?: () => void;
  recording?: boolean;
  hand?: Hand;
  onHand?: (hand: Hand) => void;
  onLearn?: (songId: string) => void;
  speed?: number;
  onSpeed?: (speed: number) => void;
  stars?: Record<string, number>;
};

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// A select page: a header row (tabs or a title on the left, Exit on the right), then a scrolling list.
function SelectPage({ head, onExit, children, className = '' }: { head: ReactNode; onExit: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="pa-screen-body">
      <div className="pa-page-head">
        <div className="pa-page-head-main">{head}</div>
        <button type="button" className="pa-exit" onClick={onExit}>Exit</button>
      </div>
      <div className={`pa-grid ${className}`}>{children}</div>
    </div>
  );
}

export default function PianoScreen({ arranger, page, category, open, message, beat, meterRef, takes, score, onClear, recording, hand = 'right', onHand, onLearn, speed = 0.5, onSpeed, stars = {} }: Props) {
  const learn = arranger.learn;
  // The power-on flicker plays once, when the piano opens. (A CSS animation restarts whenever a hidden element is
  // shown again, so on a phone it replayed each time the sheet music gave the screen back.)
  const [booting, setBooting] = useState(true);
  // Names longer than their box slide sideways to show the whole title (like a scrolling display), then back.
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const measure = () => {
      for (const item of screenRef.current?.querySelectorAll<HTMLElement>('.pa-grid .pa-item') ?? []) {
        // Measure only when the name or its box changes: re-measuring restarts the slide, and the screen redraws on
        // every note played, so a name never got to the end while someone played.
        const key = `${item.textContent}|${item.clientWidth}`;
        if (item.dataset.marquee === key) continue;
        item.dataset.marquee = key;
        item.classList.remove('pa-marquee');
        const over = item.scrollWidth - item.clientWidth;
        if (over > 2) {
          item.style.setProperty('--shift', `${-over - 6}px`);
          item.style.setProperty('--slide', `${Math.max(3, Math.min(9, over / 18 + 2)).toFixed(1)}s`);
          item.classList.add('pa-marquee');
        }
      }
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  });
  useEffect(() => {
    const done = setTimeout(() => setBooting(false), 1100);
    return () => clearTimeout(done);
  }, []);
  const sound = arranger.sound;
  const style = arranger.style;
  const song = arranger.song;
  const meter = song && arranger.songScore ? `${arranger.songScore.meter.beats}/${arranger.songScore.meter.unit}` : arranger.running ? styleMeter(style) : arranger.meter.label;
  const beats = arranger.running ? arranger.beatsPerBar : arranger.meter.beats;
  const groupStarts = arranger.running ? [0] : arranger.meter.groups.reduce<number[]>((starts, size) => [...starts, (starts.at(-1) ?? 0) + size], [0]);
  const exit = () => open('main');

  const tabs = (names: string[]) => (
    <div className="pa-tabs" role="tablist">
      {names.map((name) => (
        <button key={name} type="button" role="tab" aria-selected={name === category} className={`pa-tab ${name === category ? 'pa-tab-on' : ''}`} onClick={() => open(page, name)}>
          {name}
        </button>
      ))}
    </div>
  );

  const anyMastered = Object.entries(stars).some(([key, value]) => key.endsWith(`:${hand}`) && value >= 4);

  return (
    <div ref={screenRef} className={`pa-screen ${booting ? 'pa-screen-booting' : ''} ${beat ? 'pa-screen-beat' : ''}`}>
      <div className="pa-screen-bar">
        {/* Style Play / Song Play switch, as on the Pa300: from the main page it opens the Song Book; from any page it
            comes back to the main page. */}
        <button type="button" className="pa-touch pa-mode" aria-label={page === 'main' ? 'Song Play: open the Song Book' : 'Back to the main page'} onClick={() => open(page === 'main' ? 'song' : 'main')}>
          {song || page === 'song' ? 'SONG' : 'STYLE'}<span className="pa-long"> PLAY</span> <span aria-hidden="true" className="pa-mode-mark">⇄</span>
        </button>
        <button type="button" className="pa-touch" onClick={() => open('metro')}>♩ {arranger.tempo} · {meter}</button>
        {/* Score: the music on the display itself, as the Pa300's Score page shows it. */}
        <button type="button" className={`pa-touch pa-score-btn ${page === 'score' ? 'pa-score-btn-on' : ''}`} aria-pressed={page === 'score'} onClick={() => open(page === 'score' ? 'main' : 'score')} aria-label="Score">♪<span className="pa-long"> SCORE</span></button>
        {learn ? (
          <button type="button" className="pa-touch pa-learn-flag" onClick={() => open('learn')}><span className="pa-long">LEARN </span>{Math.min(learn.at + 1, learn.steps.length)}/{learn.steps.length} · {Math.round(learn.speed * 100)}%</button>
        ) : page === 'score' && onClear ? (
          <button type="button" className="pa-touch pa-bar-clear" onClick={onClear}>CLEAR</button>
        ) : recording ? (
          <button type="button" className="pa-touch pa-rec-flag" onClick={() => open('rec')}>● REC</button>
        ) : (
          <span>{song ? `${clock(arranger.songElapsed)} / ${clock(arranger.songLength)}` : `${arranger.measure}.${arranger.beat || 1}`}</span>
        )}
      </div>

      {page === 'main' && (
        <div className="pa-screen-body pa-main">
          <div className="pa-main-left">
            <button type="button" className="pa-row pa-touch" onClick={() => open('sound', sound.category)}>
              <span className="pa-chip">UPPER</span>
              <span className="pa-big">{sound.name}</span>
              <span className="pa-dim">{sound.category}</span>
            </button>
            {/* Name opens its page; the button on the right is the action (Start or Stop), not a status. */}
            <div className="pa-row pa-row-split">
              <button type="button" className="pa-row pa-touch pa-row-main" onClick={() => open('style', style.category)}>
                <span className="pa-chip pa-chip-alt">STYLE</span>
                <span className="flex-1 truncate">{style.name}</span>
              </button>
              <button type="button" className={`pa-row-action ${arranger.running ? 'pa-row-action-on' : ''}`} onClick={() => arranger.toggleStyle()}>
                {arranger.running ? '■ Stop' : '▶ Start'}
              </button>
            </div>
            <div className="pa-row pa-row-split">
              <button type="button" className="pa-row pa-touch pa-row-main" onClick={() => open('song')}>
                <span className="pa-chip pa-chip-song">SONG</span>
                <span className="flex-1 truncate">{song ? song.title : 'Tap to choose a song'}</span>
              </button>
              {song && (
                <button type="button" className="pa-row-action pa-row-action-on" onClick={() => (arranger.learn ? arranger.stopLearn() : arranger.stopSong())}>
                  {arranger.learn ? '■ End' : '■ Stop'}
                </button>
              )}
            </div>
            {song && (
              <div className="pa-progress">
                <span style={{ width: `${arranger.songLength ? (100 * arranger.songElapsed) / arranger.songLength : 0}%` }} />
              </div>
            )}
            {/* Phones: the arranger's Intro, Fill, Ending and Start on the screen itself (a laptop has the panel). */}
            <div className="pa-arr-row" role="group" aria-label="Style controls">
              <button type="button" className={`pa-arr ${arranger.intro ? 'pa-arr-on' : ''}`} onClick={() => arranger.startStyle(true)}>Intro</button>
              <button type="button" className="pa-arr" onClick={() => arranger.fill()}>Fill</button>
              <button type="button" className="pa-arr" onClick={() => arranger.ending()}>Ending</button>
              <button type="button" className={`pa-arr pa-arr-go ${arranger.running ? 'pa-arr-on' : ''}`} onClick={() => arranger.toggleStyle()}>{arranger.running ? '■ Stop' : '▶ Start'}</button>
            </div>
            <div className="pa-cells">
              <button type="button" className="pa-cell" aria-label={`Variation ${arranger.variation}, tap for the next`} onClick={() => arranger.setVariation((arranger.variation % 4) + 1)}>
                Var<b>{arranger.variation}</b>
              </button>
              <button type="button" className="pa-cell" aria-label={`Transpose ${signed(arranger.transpose)}, tap to change`} onClick={() => open('tune')}>
                Trans<b>{signed(arranger.transpose)}</b>
              </button>
              <button type="button" className="pa-cell" aria-label={`Octave ${signed(arranger.octave)}, tap to change`} onClick={() => open('tune')}>
                Oct<b>{signed(arranger.octave)}</b>
              </button>
              <button type="button" className={`pa-cell ${arranger.pedal ? 'pa-cell-on' : ''}`} aria-label={`Sustain pedal ${arranger.pedal ? 'on' : 'off'}, tap to switch`} onClick={() => arranger.setPedal(!arranger.pedal)}>
                Pedal<b>{arranger.pedal ? 'On' : 'Off'}</b>
              </button>
            </div>
          </div>
          <div className="pa-chord" aria-label="Chord">
            <span className="pa-chord-label">CHORD</span>
            {(() => {
              // Root large, chord quality smaller (A♯ then maj7), so long names stay inside the box.
              const [, rootName = '–', quality = ''] = (arranger.displayChord || '–').match(/^([A-G][#b]?|–)(.*)$/) ?? [];
              return (
                <span className="pa-chord-name">
                  {rootName.replace('#', '♯').replace(/b$/, '♭')}
                  {quality && <span className="pa-chord-type">{quality.replace('b5', '♭5')}</span>}
                </span>
              );
            })()}
            <div className="pa-beats" aria-hidden="true">
              {Array.from({ length: beats }, (_, index) => (
                <span key={index} className={`${arranger.beat === index + 1 ? 'pa-beat-on' : ''} ${groupStarts.includes(index) ? 'pa-beat-accent' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'sound' && (
        <SelectPage head={tabs(categories)} onExit={exit}>
          {sounds.map((item, index) =>
            item.category !== category ? null : (
              <button key={item.name} type="button" className={`pa-item ${arranger.soundIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectSound(index)}>
                <span className="pa-item-number">P{String(index + 1).padStart(2, '0')}</span>
                {item.name}
              </button>
            ),
          )}
        </SelectPage>
      )}

      {page === 'style' && (
        <SelectPage head={tabs(styleCategories)} onExit={exit}>
          {styles.map((item, index) =>
            item.category !== category ? null : (
              <button key={item.name} type="button" className={`pa-item ${arranger.styleIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectStyle(index)}>
                <span className="pa-item-number">{styleMeter(item)} · ♩{item.tempo}</span>
                {item.name}
              </button>
            ),
          )}
        </SelectPage>
      )}

      {page === 'song' && (
        <SelectPage head={<p className="pa-page-title">Song Book</p>} onExit={exit}>
          {songs.map((item) => {
            const playing = song?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`pa-item ${playing ? 'pa-item-on' : ''}`}
                onClick={() => {
                  if (playing) arranger.stopSong();
                  else void arranger.playSong(item);
                }}
              >
                <span className="pa-item-number">{playing ? '■ Stop' : '▶ Play'} · {item.composer}</span>
                <span className="pa-t-full">{item.title}</span><span className="pa-t-short">{item.short ?? item.title}</span>
              </button>
            );
          })}
        </SelectPage>
      )}

      {page === 'metro' && (
        <SelectPage head={<p className="pa-page-title">Metronome · time signature</p>} onExit={exit} className="pa-grid-meters">
          {meters.map((item, index) => (
            <button key={item.label} type="button" className={`pa-item pa-item-center ${arranger.meterIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.setMeter(index)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(-1)} aria-label="Tempo down"><span className="pa-t-full">Tempo −</span><span className="pa-t-short">♩ −</span></button>
          <span className="pa-item pa-item-center pa-item-static">♩ {arranger.tempo}</span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(1)} aria-label="Tempo up"><span className="pa-t-full">Tempo +</span><span className="pa-t-short">♩ +</span></button>
          <button type="button" className={`pa-item pa-item-center pa-item-wide ${arranger.metronome ? 'pa-item-on' : ''}`} onClick={() => arranger.toggleMetronome()}>
            {arranger.metronome ? 'Click on' : 'Click off'}
          </button>
        </SelectPage>
      )}

      {page === 'tune' && (
        <SelectPage head={<p className="pa-page-title">Transpose and octave</p>} onExit={exit} className="pa-grid-tune">
          <span className="pa-item pa-item-center pa-item-static">Transpose <b>{signed(arranger.transpose)}</b></span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(-1)}>−1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(1)}>+1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(-arranger.transpose)}>Reset</button>
          <span className="pa-item pa-item-center pa-item-static">Octave <b>{signed(arranger.octave)}</b></span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(-1)}>−1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(1)}>+1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(-arranger.octave)}>Reset</button>
        </SelectPage>
      )}

      {page === 'learn' && (
        <SelectPage
          head={
            <div className="pa-tabs" role="tablist" aria-label="Hand">
              {(['right', 'left', 'both'] as Hand[]).map((name) => (
                <button key={name} type="button" role="tab" aria-selected={name === hand} aria-label={name === 'both' ? 'Both hands' : name === 'right' ? 'Right hand' : 'Left hand'} className={`pa-tab ${name === hand ? 'pa-tab-on' : ''}`} onClick={() => onHand?.(name)}>
                  {name === 'both' ? 'Both' : name === 'right' ? 'Right' : 'Left'}
                </button>
              ))}
              {/* 150% and 200%: bonus speeds, shown once a piece is mastered (every note right at 100%) with this hand. */}
              {[0.5, 0.75, 1, ...(anyMastered ? [1.5, 2] : [])].map((value) => (
                <button key={value} type="button" role="tab" aria-selected={value === speed} className={`pa-tab ${value === speed ? 'pa-tab-on' : ''} ${value > 1 ? 'pa-tab-bonus' : ''}`} onClick={() => onSpeed?.(value)} title={value === 0.5 ? 'Beginner speed' : value === 1 ? 'The piece at its own tempo' : value > 1 ? 'Bonus speed, for pieces you have mastered' : 'Practice speed'}>
                  {value > 1 ? '⚡' : ''}{value * 100}%
                </button>
              ))}
            </div>
          }
          onExit={exit}
        >
          {[...songs.filter((item) => item.easy), ...songs.filter((item) => item.file)].map((item) => (
            <button key={item.id} type="button" className={`pa-item ${learn?.song.id === item.id ? 'pa-item-on' : ''} ${speed > 1 && (stars[`${item.id}:${hand}`] ?? 0) < 4 ? 'pa-item-locked' : ''}`} onClick={() => onLearn?.(item.id)}>
              <span className="pa-item-number">{learn?.song.id === item.id ? 'Learning' : speed > 1 && (stars[`${item.id}:${hand}`] ?? 0) < 4 ? 'Master it first' : item.easy ? 'Easy' : 'Learn'} · {item.composer}</span>
              <span className="pa-t-full">{item.title}</span><span className="pa-t-short">{item.short ?? item.title}</span>
              {(stars[`${item.id}:${hand}`] ?? 0) > 0 && (
                <span className="pa-item-stars" aria-label={stars[`${item.id}:${hand}`] > 3 ? 'mastered' : `best ${stars[`${item.id}:${hand}`]} stars`}>
                  {stars[`${item.id}:${hand}`] > 3 ? '♛' : '★'.repeat(stars[`${item.id}:${hand}`])}
                </span>
              )}
            </button>
          ))}
        </SelectPage>
      )}

      {page === 'score' && (
        <SelectPage head={<p className="pa-page-title">Score{arranger.song ? ` · ${arranger.song.title}` : ' · what you play'}</p>} onExit={exit} className="pa-grid-score">
          {score}
        </SelectPage>
      )}

      {page === 'rec' && (
        <SelectPage head={<p className="pa-page-title">Recordings · saved in this browser</p>} onExit={exit} className="pa-grid-takes">
          {takes}
        </SelectPage>
      )}

      <div className="pa-meter" aria-hidden="true"><span ref={meterRef} /></div>
      <p key={arranger.loading ? 'loading' : message} className={`pa-message ${arranger.loading ? '' : 'pa-message-type'}`} aria-live="polite">
        {arranger.loading || message}
      </p>
    </div>
  );
}
