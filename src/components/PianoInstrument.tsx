import { useEffect, useReducer, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Arranger, HIGH, KEYMAP, LOW, categories, isBlack, keyName, styleCategories } from '../piano/arranger';
import { songs } from '../piano/songs';

const keys = Array.from({ length: HIGH - LOW + 1 }, (_, index) => LOW + index);
const whiteKeys = keys.filter((key) => !isBlack(key));
const whiteWidth = 100 / whiteKeys.length;
const letterFor = Object.fromEntries(Object.entries(KEYMAP).map(([letter, offset]) => [60 + offset, letter.toUpperCase()]));
const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function PanelButton({ label, onClick, active, tone = 'grey', className = '' }: { label: string; onClick: () => void; active?: boolean; tone?: 'grey' | 'red' | 'green'; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`pa-btn pa-btn-${tone} ${className}`}>
      {active !== undefined && <span className={`pa-led ${active ? 'pa-led-on' : ''}`} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}

// Velocity from where the key is struck: nearer the front edge is a firmer press, as on a real keybed.
function velocityOf(event: ReactPointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const depth = box.height ? (event.clientY - box.top) / box.height : 0.7;
  return Math.min(1, Math.max(0.25, 0.3 + depth * 0.75));
}

export default function PianoInstrument() {
  const engine = useRef<Arranger | null>(null);
  engine.current ??= new Arranger();
  const arranger = engine.current;
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());
  const [message, setMessage] = useState('');
  const [beat, setBeat] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const [stick, setStick] = useState(0);
  const meter = useRef<HTMLSpanElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pointerDown = useRef(false);
  const dial = useRef<{ y: number; tempo: number } | null>(null);

  // Wire the engine to the panel, boot the screen, play a chime and centre the keyboard on middle C.
  useEffect(() => {
    arranger.onChange = refresh;
    arranger.onNote = (key, on) =>
      setPressed((previous) => {
        const next = new Set(previous);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      });
    arranger.onBeat = () => {
      setBeat(true);
      setTimeout(() => setBeat(false), 90);
      refresh();
    };
    arranger.chime();
    const greeting = 'Concert Grand ready. Play, or pick a style or a song.';
    let shown = 0;
    const typing = setInterval(() => {
      shown++;
      setMessage(greeting.slice(0, shown));
      if (shown >= greeting.length) clearInterval(typing);
    }, 35);
    const centre = setTimeout(() => {
      const element = scroller.current;
      if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    }, 50);
    return () => {
      clearInterval(typing);
      clearTimeout(centre);
      arranger.dispose();
    };
  }, [arranger]);

  // Computer keyboard: A to ; for white keys from middle C, W E T Y U O P for black keys, Z and X for octave, Space for sustain.
  useEffect(() => {
    const ignore = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      return event.metaKey || event.ctrlKey || event.altKey || target?.closest('input, textarea, select, [contenteditable="true"]');
    };
    const down = (event: KeyboardEvent) => {
      if (ignore(event)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        arranger.setPedal(true);
        return;
      }
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'x') {
        arranger.changeOctave(key === 'z' ? -1 : 1);
        return;
      }
      const offset = KEYMAP[key];
      if (offset === undefined) return;
      event.preventDefault();
      arranger.noteOn(60 + offset, 0.75);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        arranger.setPedal(false);
        return;
      }
      const offset = KEYMAP[event.key.toLowerCase()];
      if (offset !== undefined) arranger.noteOff(60 + offset);
    };
    const release = () => {
      pointerDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pointerup', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pointerup', release);
    };
  }, [arranger]);

  // Level meter, drawn straight to the DOM so the keyboard does not re-render every frame.
  useEffect(() => {
    if (typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    const draw = () => {
      if (meter.current) meter.current.style.transform = `scaleX(${Math.min(1, arranger.level() * 5)})`;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [arranger]);

  const say = (text: string) => setMessage(text);
  const sound = arranger.sound;
  const style = arranger.style;
  const song = arranger.song;

  // Pitch-bend joystick: drag sideways for up to two semitones; it springs back on release.
  const moveStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const box = event.currentTarget.getBoundingClientRect();
    const position = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
    setStick(position);
    arranger.setBend(position * 2);
  };

  return (
    <div role="region" aria-label="Piano" className="pa-instrument">
      <div className="pa-body">
        <div className="pa-top">
          <div className="pa-brand">
            <span className="pa-brand-name">ADITHYA</span>
            <span className="pa-brand-model">PRO ARRANGER · 61</span>
          </div>
          <span className="pa-grille" aria-hidden="true" />
          <span className="pa-badge">Grade 8 · Trinity College London</span>
        </div>

        <div className="pa-panel">
          <div className="pa-group">
            <span className="pa-label">Style</span>
            <div className="grid grid-cols-4 gap-1.5">
              {styleCategories.map((category) => (
                <PanelButton key={category} label={category} active={style.category === category} onClick={() => arranger.selectStyleCategory(category)} />
              ))}
            </div>
            <span className="pa-label mt-3">Variation</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((variation) => (
                <PanelButton key={variation} label={String(variation)} active={arranger.variation === variation} onClick={() => arranger.setVariation(variation)} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <PanelButton label="Intro" tone="red" active={arranger.intro} onClick={() => { arranger.startStyle(true); say('Intro: one bar count-in'); }} />
              <PanelButton label="Fill" tone="red" onClick={() => { arranger.fill(); say('Fill on the next bar'); }} />
              <PanelButton label="Ending" tone="red" onClick={() => { arranger.ending(); say('Ending on the next bar'); }} />
              <PanelButton label={arranger.running ? 'Stop' : 'Start'} tone="green" active={arranger.running} onClick={() => arranger.toggleStyle()} />
            </div>
          </div>

          <div className="pa-centre">
            <div className={`pa-screen ${beat ? 'pa-screen-beat' : ''}`}>
              <div className="pa-screen-bar">
                <span>{song ? 'SONG PLAY' : 'STYLE PLAY'}</span>
                <span>{song ? clock(arranger.songElapsed) : `♩ ${arranger.tempo}`}</span>
                <span>{song ? clock(arranger.songLength) : `${arranger.measure}.${arranger.beat || 1}`}</span>
              </div>
              {song ? (
                <div className="pa-screen-body">
                  <span className="pa-chip">SONG</span>
                  <p className="pa-big">{song.title}</p>
                  <p className="pa-sub">{song.composer} · {song.detail}</p>
                  <div className="pa-progress"><span style={{ width: `${arranger.songLength ? (100 * arranger.songElapsed) / arranger.songLength : 0}%` }} /></div>
                </div>
              ) : (
                <div className="pa-screen-body">
                  <div className="pa-row"><span className="pa-chip">UPPER</span><span className="pa-big">{sound.name}</span><span className="pa-dim">{sound.category}</span></div>
                  <div className="pa-row"><span className="pa-chip pa-chip-alt">STYLE</span><span className="flex-1">{style.name}</span><span className={arranger.running ? 'pa-play' : 'pa-dim'}>{arranger.running ? '▶ PLAY' : '■ STOP'}</span></div>
                  <div className="pa-cells">
                    <span>Chord<b>{arranger.running ? arranger.chordName : '–'}</b></span>
                    <span>Var<b>{arranger.variation}</b></span>
                    <span>Trans<b>{signed(arranger.transpose)}</b></span>
                    <span>Oct<b>{signed(arranger.octave)}</b></span>
                    <span>Pedal<b>{arranger.pedal ? 'On' : 'Off'}</b></span>
                  </div>
                </div>
              )}
              <div className="pa-meter" aria-hidden="true"><span ref={meter} /></div>
              <p className="pa-message" aria-live="polite">{arranger.loading || message}</p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <PanelButton label="Tempo −" onClick={() => arranger.changeTempo(-2)} />
              <div
                className="pa-dial"
                role="slider"
                tabIndex={0}
                aria-label="Tempo dial"
                aria-valuemin={40}
                aria-valuemax={240}
                aria-valuenow={arranger.tempo}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dial.current = { y: event.clientY, tempo: arranger.tempo };
                }}
                onPointerMove={(event) => {
                  if (dial.current) arranger.changeTempo(dial.current.tempo + (dial.current.y - event.clientY) / 2 - arranger.tempo);
                }}
                onPointerUp={() => {
                  dial.current = null;
                }}
                onWheel={(event) => arranger.changeTempo(event.deltaY < 0 ? 1 : -1)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp' || event.key === 'ArrowRight') arranger.changeTempo(1);
                  if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') arranger.changeTempo(-1);
                }}
              >
                <span className="pa-dial-cap" style={{ transform: `rotate(${(arranger.tempo - 40) * 1.5}deg)` }}>
                  <span className="pa-dial-mark" />
                </span>
              </div>
              <PanelButton label="Tempo +" onClick={() => arranger.changeTempo(2)} />
            </div>
          </div>

          <div className="pa-group">
            <span className="pa-label">Sound</span>
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map((category) => (
                <PanelButton key={category} label={category} active={sound.category === category} onClick={() => arranger.selectCategory(category)} />
              ))}
            </div>
            <span className="pa-label mt-3">Transpose and octave</span>
            <div className="grid grid-cols-4 gap-1.5">
              <PanelButton label="Trans −" onClick={() => arranger.changeTranspose(-1)} />
              <PanelButton label="Trans +" onClick={() => arranger.changeTranspose(1)} />
              <PanelButton label="Oct −" onClick={() => arranger.changeOctave(-1)} />
              <PanelButton label="Oct +" onClick={() => arranger.changeOctave(1)} />
            </div>
          </div>
        </div>

        <div className="pa-controls">
          <div className="flex items-center gap-3">
            <div
              className="pa-stick"
              role="slider"
              aria-label="Pitch bend"
              aria-valuemin={-2}
              aria-valuemax={2}
              aria-valuenow={Math.round(stick * 20) / 10}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                moveStick(event);
              }}
              onPointerMove={moveStick}
              onPointerUp={() => {
                setStick(0);
                arranger.setBend(0);
              }}
            >
              <span style={{ transform: `translateX(${stick * 20}px)` }} />
            </div>
            <button
              type="button"
              aria-pressed={arranger.pedal}
              className={`pa-pedal ${arranger.pedal ? 'pa-pedal-down' : ''}`}
              onPointerDown={() => arranger.setPedal(!arranger.pedal)}
              onClick={(event) => {
                if (event.detail === 0) arranger.setPedal(!arranger.pedal);
              }}
            >
              Sustain
            </button>
          </div>
          <label className="pa-volume">
            <span className="pa-label m-0">Master</span>
            <input type="range" min={0} max={1} step={0.01} value={arranger.volume} onChange={(event) => arranger.setVolume(Number(event.target.value))} />
          </label>
          <div className="flex gap-1.5">
            <PanelButton label="Metro" active={arranger.metronome} onClick={() => arranger.toggleMetronome()} />
            <PanelButton label="Reverb" active={arranger.reverb} onClick={() => arranger.toggleReverb()} />
            <PanelButton label="PC keys" active={showLetters} onClick={() => setShowLetters((value) => !value)} />
          </div>
        </div>

        <div className="pa-felt" aria-hidden="true" />
        <div className="pa-keybed" ref={scroller}>
          <div className="pa-keys" onPointerLeave={() => { pointerDown.current = false; }}>
            {keys.map((key) => {
              const black = isBlack(key);
              const whiteIndex = whiteKeys.filter((white) => white < key).length;
              const position = black
                ? { left: `${whiteIndex * whiteWidth - whiteWidth * 0.29}%`, width: `${whiteWidth * 0.58}%`, animationDelay: `${1.2 + whiteIndex * 0.012}s` }
                : { left: `${whiteIndex * whiteWidth}%`, width: `${whiteWidth}%`, animationDelay: `${1.15 + whiteIndex * 0.012}s` };
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`Play ${keyName(key)}`}
                  style={position}
                  className={`pa-key ${black ? 'pa-key-black' : 'pa-key-white'} ${pressed.has(key) ? 'pa-key-down' : ''}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    pointerDown.current = true;
                    arranger.noteOn(key, velocityOf(event));
                  }}
                  onPointerUp={() => arranger.noteOff(key)}
                  onPointerEnter={(event) => {
                    if (pointerDown.current && event.pointerType === 'mouse') arranger.noteOn(key, velocityOf(event));
                  }}
                  onPointerLeave={() => {
                    if (pressed.has(key)) arranger.noteOff(key);
                  }}
                  onClick={(event) => {
                    if (event.detail !== 0) return;
                    arranger.noteOn(key);
                    setTimeout(() => arranger.noteOff(key), 400);
                  }}
                >
                  {showLetters && letterFor[key] && <span className={`pa-key-label ${black ? 'pa-key-label-dark' : ''}`}>{letterFor[key]}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pa-songbook">
        <h3 className="pa-songbook-title">Song book</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {songs.map((item) => {
            const playing = song?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={playing}
                  onClick={() => (playing ? arranger.stopSong() : void arranger.playSong(item))}
                  className={`pa-song ${playing ? 'pa-song-on' : ''}`}
                >
                  <span className="pa-song-icon" aria-hidden="true">{playing ? '■' : '▶'}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.title}</span>
                    <span className="block truncate text-xs opacity-70">{item.composer}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <dl className="pa-guide">
        <div>
          <dt>Play</dt>
          <dd>Click or tap the keys. Strike lower on a key for a louder, brighter note.</dd>
        </div>
        <div>
          <dt>Pedal and bend</dt>
          <dd>Hold <kbd>Space</kbd> or press Sustain. Drag the joystick to bend the pitch.</dd>
        </div>
        <div>
          <dt>Computer keys</dt>
          <dd><kbd>A</kbd> to <kbd>;</kbd> from middle C, <kbd>W E T Y U O P</kbd> for sharps, <kbd>Z</kbd> and <kbd>X</kbd> for octave.</dd>
        </div>
        <div>
          <dt>Accompaniment</dt>
          <dd>Pick a style and press Start. Below middle C, your left hand sets the chord.</dd>
        </div>
      </dl>
      <p className="pa-credits">
        Piano: Salamander Grand Piano, a Yamaha C5 recorded by Alexander Holm. Other instruments: FluidR3 GM soundfont. Both CC BY 3.0.
        Scores: Mutopia Project, public domain. Raga pieces written for this page. Drums and tabla are synthesised.
      </p>
    </div>
  );
}
