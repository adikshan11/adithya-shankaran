import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { Arranger, HIGH, KEYMAP, LOW, categories, isBlack, keyName, sounds, styles } from '../piano/arranger';
import { pianoStore } from '../piano/store';

const keys = Array.from({ length: HIGH - LOW + 1 }, (_, index) => LOW + index);
const whiteKeys = keys.filter((key) => !isBlack(key));
const whiteWidth = 100 / whiteKeys.length;
const letterFor = Object.fromEntries(Object.entries(KEYMAP).map(([letter, offset]) => [60 + offset, letter.toUpperCase()]));
const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
const notes = ['♪', '♫', '♩', '♬', '♪', '♫', '♬', '♩', '♪', '♫'];

function PanelButton({ label, onClick, active, tone = 'cream', wide = false }: { label: string; onClick: () => void; active?: boolean; tone?: 'cream' | 'wine' | 'brass'; wide?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`pa-btn pa-btn-${tone} ${wide ? 'col-span-2' : ''}`}>
      {active !== undefined && <span className={`pa-led ${active ? 'pa-led-on' : ''}`} aria-hidden="true" />}
      {label}
    </button>
  );
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
  const meter = useRef<HTMLSpanElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pointerDown = useRef(false);

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

  // Opening: boot the screen, play a chime and centre the keyboard on middle C.
  useEffect(() => {
    if (!open) {
      arranger.releaseAll();
      if (arranger.running) arranger.stopStyle();
      if (arranger.metronome) arranger.toggleMetronome();
      setPressed(new Set());
      return;
    }
    arranger.chime();
    const greeting = 'Hello. Press START, or just play.';
    let shown = 0;
    setMessage('');
    const typing = setInterval(() => {
      shown++;
      setMessage(greeting.slice(0, shown));
      if (shown >= greeting.length) clearInterval(typing);
    }, 45);
    const centre = setTimeout(() => {
      const element = scroller.current;
      if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    }, 50);
    return () => {
      clearInterval(typing);
      clearTimeout(centre);
    };
  }, [open, arranger]);

  // Computer keyboard: A to ; play white keys from middle C, W E T Y U O P the black keys, Z and X move the octave.
  useEffect(() => {
    if (!open) return;
    const typing = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      return event.metaKey || event.ctrlKey || event.altKey || target?.closest('input, textarea, select, [contenteditable="true"]');
    };
    const down = (event: KeyboardEvent) => {
      if (typing(event) || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'x') {
        arranger.changeOctave(key === 'z' ? -1 : 1);
        return;
      }
      const offset = KEYMAP[key];
      if (offset === undefined) return;
      event.preventDefault();
      arranger.noteOn(60 + offset);
    };
    const up = (event: KeyboardEvent) => {
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

  return (
    <section id="piano" aria-labelledby="piano-heading" className="py-8">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 id="piano-heading" className="flex items-baseline gap-3 text-2xl font-bold tracking-tight">
            <span className="font-mono text-sm font-medium text-accent">♪</span>
            Off the clock
          </h2>
          <p className="mt-1 text-muted">Grade 8 Electronic Keyboard, Trinity College London. There’s an arranger keyboard behind this lid.</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="piano-instrument"
          onClick={() => pianoStore.set(!open)}
          className="pa-handle"
        >
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
                <span className="pa-plate-model">Arranger · 61 keys</span>
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
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <PanelButton label={arranger.running ? 'Stop' : 'Start'} tone="wine" active={arranger.running} onClick={() => arranger.toggleStyle()} />
                  <PanelButton label="Fill" tone="wine" onClick={() => { arranger.fill(); say('Fill on the next bar'); }} />
                  <PanelButton label="Ending" tone="wine" onClick={() => { arranger.ending(); say('Ending on the next bar'); }} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="pa-label m-0">Tempo</span>
                  <PanelButton label="−" onClick={() => arranger.changeTempo(-4)} />
                  <PanelButton label="+" onClick={() => arranger.changeTempo(4)} />
                </div>
              </div>

              <div className={`pa-screen ${beat ? 'pa-screen-beat' : ''}`}>
                <div className="pa-screen-bar">
                  <span>{arranger.demo ? 'DEMO' : 'STYLE PLAY'}</span>
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
                  <span className="flex-1">{arranger.style.name}</span>
                  <span className={arranger.running ? 'pa-blink' : undefined}>{arranger.running ? '▶ PLAY' : '■ STOP'}</span>
                </div>
                <div className="pa-screen-grid">
                  <span>CHORD <b>{arranger.running ? arranger.chordName : '--'}</b></span>
                  <span>TRANS <b>{signed(arranger.transpose)}</b></span>
                  <span>OCT <b>{signed(arranger.octave)}</b></span>
                  <span>REV <b>{arranger.reverb ? 'ON' : 'OFF'}</b></span>
                </div>
                <div className="pa-meter" aria-hidden="true">
                  <span ref={meter} />
                </div>
                <p className="pa-message" aria-live="polite">{message}<span className="pa-cursor">▌</span></p>
              </div>

              <div className="pa-group">
                <span className="pa-label">Sound</span>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <PanelButton key={category} label={category} active={sound.category === category} onClick={() => arranger.selectCategory(category)} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <PanelButton label="Trans −" tone="brass" onClick={() => arranger.changeTranspose(-1)} />
                  <PanelButton label="Trans +" tone="brass" onClick={() => arranger.changeTranspose(1)} />
                  <PanelButton label="Oct −" tone="brass" onClick={() => arranger.changeOctave(-1)} />
                  <PanelButton label="Oct +" tone="brass" onClick={() => arranger.changeOctave(1)} />
                </div>
              </div>
            </div>

            <div className="pa-panel-row">
              <label className="pa-volume">
                <span className="pa-label m-0">Master volume</span>
                <input type="range" min={0} max={1} step={0.01} value={arranger.volume} onChange={(event) => arranger.setVolume(Number(event.target.value))} />
              </label>
              <div className="flex flex-wrap gap-2">
                <PanelButton label="Metro" active={arranger.metronome} onClick={() => arranger.toggleMetronome()} />
                <PanelButton label="Reverb" active={arranger.reverb} onClick={() => arranger.toggleReverb()} />
                <PanelButton label="Demo" tone="wine" active={arranger.demo} onClick={() => { arranger.playDemo(); say('Demo: Ode to Joy, Beethoven'); }} />
              </div>
            </div>

            <div className="pa-felt" aria-hidden="true" />
            <div className="pa-keybed" ref={scroller}>
              <div className="pa-keys" onPointerLeave={() => { pointerDown.current = false; }}>
                {keys.map((key) => {
                  const black = isBlack(key);
                  const whiteIndex = whiteKeys.filter((white) => white < key).length;
                  const style = black
                    ? { left: `${whiteIndex * whiteWidth - whiteWidth * 0.3}%`, width: `${whiteWidth * 0.6}%`, animationDelay: `${0.5 + whiteIndex * 0.012}s` }
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
                        arranger.noteOn(key);
                      }}
                      onPointerUp={() => arranger.noteOff(key)}
                      onPointerEnter={(event) => {
                        if (pointerDown.current && event.pointerType === 'mouse') arranger.noteOn(key);
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
                      {!black && (key === 60 || letterFor[key]) && (
                        <span className="pa-key-label">{key === 60 && <span className="block text-[0.5rem] opacity-70">C4</span>}{letterFor[key]}</span>
                      )}
                      {black && letterFor[key] && <span className="pa-key-label pa-key-label-dark">{letterFor[key]}</span>}
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
            Click or tap the keys, or type <kbd>A</kbd> to <kbd>;</kbd> (black keys on <kbd>W E T Y U O P</kbd>, octave on <kbd>Z</kbd> <kbd>X</kbd>).
            With a style running, keys left of middle C play the chord. Press a sound button again for its variations. Inspired by the Korg Pa300; every sound is synthesised in your browser.
          </p>
        </div>
      )}
    </section>
  );
}
