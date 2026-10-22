import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Arranger, HIGH, KEYMAP, LOW, categories, isBlack, keyName, sounds, styles } from '../piano/arranger';
import { pianoStore } from '../piano/store';

const keys = Array.from({ length: HIGH - LOW + 1 }, (_, index) => LOW + index);
const whiteKeys = keys.filter((key) => !isBlack(key));
const whiteWidth = 100 / whiteKeys.length;
const letterFor = Object.fromEntries(Object.entries(KEYMAP).map(([letter, offset]) => [60 + offset, letter.toUpperCase()]));
const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
const notes = ['♪', '♫', '♩', '♬', '♪', '♫', '♬', '♩', '♪', '♫'];

function PanelButton({ label, onClick, active, tone = 'cream', className = '' }: { label: string; onClick: () => void; active?: boolean; tone?: 'cream' | 'wine' | 'brass'; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`pa-btn pa-btn-${tone} ${className}`}>
      {active !== undefined && <span className={`pa-led ${active ? 'pa-led-on' : ''}`} aria-hidden="true" />}
      {label}
    </button>
  );
}

// Velocity from where the key is struck: nearer the front edge is a firmer press, as on a real keybed.
function velocityOf(event: ReactPointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const depth = box.height ? (event.clientY - box.top) / box.height : 0.7;
  return Math.min(1, Math.max(0.25, 0.3 + depth * 0.75));
}

export default function PianoRoom() {
  const open = useSyncExternalStore(pianoStore.subscribe, pianoStore.get, () => false);
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
    return () => arranger.dispose();
  }, [arranger]);

  // Opening: boot the screen, load the grand piano, play a chime and centre the keyboard on middle C.
  useEffect(() => {
    if (!open) {
      arranger.releaseAll();
      if (arranger.running) arranger.stopStyle();
      if (arranger.metronome) arranger.toggleMetronome();
      setPressed(new Set());
      return;
    }
    arranger.chime();
    const greeting = 'Grand Piano ready. Press START, or just play.';
    let shown = 0;
    setMessage('');
    const typing = setInterval(() => {
      shown++;
      setMessage(greeting.slice(0, shown));
      if (shown >= greeting.length) clearInterval(typing);
    }, 40);
    const centre = setTimeout(() => {
      const element = scroller.current;
      if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    }, 50);
    return () => {
      clearInterval(typing);
      clearTimeout(centre);
    };
  }, [open, arranger]);

  // Computer keyboard: A to ; for white keys from middle C, W E T Y U O P for black keys, Z and X for octave, Space for sustain.
  useEffect(() => {
    if (!open) return;
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
  }, [open, arranger]);

  // Level meter, drawn straight to the DOM so the keyboard does not re-render every frame.
  useEffect(() => {
    if (!open || typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    const draw = () => {
      if (meter.current) meter.current.style.transform = `scaleX(${Math.min(1, arranger.level() * 5)})`;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [open, arranger]);

  const say = (text: string) => setMessage(text);
  const sound = arranger.sound;
  const soundNumber = String(arranger.soundIndex + 1).padStart(2, '0');

  // Pitch-bend joystick: drag sideways for up to two semitones; it springs back on release.
  const moveStick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const box = event.currentTarget.getBoundingClientRect();
    const position = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
    setStick(position);
    arranger.setBend(position * 2);
  };

  return (
    <section id="piano" aria-labelledby="piano-heading" className="py-8">
      <div className="card flex flex-wrap items-center justify-between gap-5 p-5">
        <div className="flex items-center gap-4">
          <span className="pa-seal" aria-hidden="true">
            <span>8</span>
          </span>
          <div>
            <h2 id="piano-heading" className="text-2xl font-bold tracking-tight">Off the clock</h2>
            <p className="mt-0.5 font-semibold text-ink">Grade 8, Electronic Keyboard · Trinity College London</p>
            <p className="mt-0.5 text-sm text-muted">The top grade. Below is a playable arranger keyboard with recorded grand piano samples.</p>
          </div>
        </div>
        <button type="button" aria-expanded={open} aria-controls="piano-instrument" onClick={() => pianoStore.set(!open)} className="pa-handle">
          {open ? 'Close the lid' : 'Lift the lid ✦'}
        </button>
      </div>

      {open && (
        <div id="piano-instrument" role="region" aria-label="Piano" className="piano-unfold mt-5">
          <div className="pa-body">
            <div className="pa-top">
              <span className="pa-grille" aria-hidden="true" />
              <span className="pa-plate">
                <span className="pa-plate-name">Adithya</span>
                <span className="pa-plate-model">Professional Arranger · 61 keys</span>
              </span>
              <span className="pa-grille" aria-hidden="true" />
            </div>

            <div className="pa-panel">
              <div className="pa-group">
                <span className="pa-label">Style</span>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map((style, index) => (
                    <PanelButton key={style.name} label={style.name} active={arranger.styleIndex === index} onClick={() => arranger.selectStyle(index)} />
                  ))}
                </div>
                <span className="pa-label mt-3">Variation</span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((variation) => (
                    <PanelButton key={variation} label={`Var ${variation}`} active={arranger.variation === variation} onClick={() => arranger.setVariation(variation)} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <PanelButton label="Intro" tone="wine" active={arranger.intro} onClick={() => { arranger.startStyle(true); say('Intro: one bar count-in'); }} />
                  <PanelButton label={arranger.running && !arranger.recital ? 'Stop' : 'Start'} tone="wine" active={arranger.running && !arranger.recital} onClick={() => arranger.toggleStyle()} />
                  <PanelButton label="Fill" tone="wine" onClick={() => { arranger.fill(); say('Fill on the next bar'); }} />
                  <PanelButton label="Ending" tone="wine" onClick={() => { arranger.ending(); say('Ending on the next bar'); }} />
                </div>
              </div>

              <div>
                <div className={`pa-screen ${beat ? 'pa-screen-beat' : ''}`}>
                  <div className="pa-screen-bar">
                    <span>{arranger.recital ? 'RECITAL' : 'STYLE PLAY'}</span>
                    <span>♩={arranger.tempo}</span>
                    <span>M{String(arranger.measure).padStart(3, '0')}:{arranger.beat || '-'}</span>
                  </div>
                  <div className="pa-screen-line">
                    <span className="pa-tag">UP1</span>
                    <span className="pa-big">{sound.name}</span>
                    <span>P{soundNumber}</span>
                  </div>
                  <div className="pa-screen-line">
                    <span className="pa-tag">STY</span>
                    <span className="flex-1">{arranger.style.name} · Var {arranger.variation}</span>
                    <span className={arranger.running ? 'pa-blink' : undefined}>{arranger.running ? '▶ PLAY' : '■ STOP'}</span>
                  </div>
                  <div className="pa-screen-grid">
                    <span>CHORD <b>{arranger.running && !arranger.recital ? arranger.chordName : '--'}</b></span>
                    <span>TRANS <b>{signed(arranger.transpose)}</b></span>
                    <span>OCT <b>{signed(arranger.octave)}</b></span>
                    <span>PEDAL <b>{arranger.pedal ? 'ON' : 'OFF'}</b></span>
                  </div>
                  <div className="pa-meter" aria-hidden="true">
                    <span ref={meter} />
                  </div>
                  <p className="pa-message" aria-live="polite">
                    {arranger.loading || message}
                    <span className="pa-cursor">▌</span>
                  </p>
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
                    style={{ transform: `rotate(${(arranger.tempo - 40) * 1.5}deg)` }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      dial.current = { y: event.clientY, tempo: arranger.tempo };
                    }}
                    onPointerMove={(event) => {
                      if (!dial.current) return;
                      arranger.changeTempo(dial.current.tempo + (dial.current.y - event.clientY) / 2 - arranger.tempo);
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
                    <span className="pa-dial-mark" />
                  </div>
                  <PanelButton label="Tempo +" onClick={() => arranger.changeTempo(2)} />
                </div>
              </div>

              <div className="pa-group">
                <span className="pa-label">Sound</span>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <PanelButton key={category} label={category} active={sound.category === category} onClick={() => arranger.selectCategory(category)} />
                  ))}
                </div>
                <span className="pa-label mt-3">Transpose · Octave</span>
                <div className="grid grid-cols-4 gap-2">
                  <PanelButton label="Trans −" tone="brass" onClick={() => arranger.changeTranspose(-1)} />
                  <PanelButton label="Trans +" tone="brass" onClick={() => arranger.changeTranspose(1)} />
                  <PanelButton label="Oct −" tone="brass" onClick={() => arranger.changeOctave(-1)} />
                  <PanelButton label="Oct +" tone="brass" onClick={() => arranger.changeOctave(1)} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <PanelButton label="Metro" active={arranger.metronome} onClick={() => arranger.toggleMetronome()} />
                  <PanelButton label="Reverb" active={arranger.reverb} onClick={() => arranger.toggleReverb()} />
                  <PanelButton
                    label="Recital"
                    tone="wine"
                    active={arranger.recital}
                    onClick={() => {
                      if (arranger.recital) arranger.stopStyle();
                      else {
                        arranger.playRecital();
                        say('Bach, Prelude in C major, BWV 846');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pa-panel-row">
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
                <span className="pa-label m-0">Bend</span>
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
                <span className="pa-label m-0">Master volume</span>
                <input type="range" min={0} max={1} step={0.01} value={arranger.volume} onChange={(event) => arranger.setVolume(Number(event.target.value))} />
              </label>
              <PanelButton label="PC keys" active={showLetters} onClick={() => setShowLetters((value) => !value)} />
            </div>

            <div className="pa-felt" aria-hidden="true" />
            <div className="pa-keybed" ref={scroller}>
              <div className="pa-keys" onPointerLeave={() => { pointerDown.current = false; }}>
                {keys.map((key) => {
                  const black = isBlack(key);
                  const whiteIndex = whiteKeys.filter((white) => white < key).length;
                  const style = black
                    ? { left: `${whiteIndex * whiteWidth - whiteWidth * 0.29}%`, width: `${whiteWidth * 0.58}%`, animationDelay: `${0.5 + whiteIndex * 0.012}s` }
                    : { left: `${whiteIndex * whiteWidth}%`, width: `${whiteWidth}%`, animationDelay: `${0.45 + whiteIndex * 0.012}s` };
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={`Play ${keyName(key)}`}
                      style={style}
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
              <div className="pa-fallboard" aria-hidden="true">
                <span className="pa-fallboard-plate">Adithya</span>
              </div>
              <div className="pa-notes" aria-hidden="true">
                {notes.map((note, index) => (
                  <span key={index} style={{ left: `${8 + index * 9}%`, animationDelay: `${0.9 + (index % 5) * 0.18}s` }}>{note}</span>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            Touch-sensitive: strike nearer the front of a key to play louder. Hold <kbd>Space</kbd> or press Sustain for the pedal; drag the joystick to bend.
            On a computer keyboard, <kbd>A</kbd> to <kbd>;</kbd> play from middle C (black keys on <kbd>W E T Y U O P</kbd>, octave on <kbd>Z</kbd> <kbd>X</kbd>).
            With a style running, keys left of middle C play the chord.
          </p>
          <p className="mt-1 text-xs text-muted">
            Modelled on the Korg Pa300 panel. Piano: Salamander Grand Piano, a Yamaha C5 recorded by Alexander Holm (CC BY 3.0). Other sounds: FluidR3 GM soundfont (CC BY 3.0). Drums are synthesised.
          </p>
        </div>
      )}
    </section>
  );
}
