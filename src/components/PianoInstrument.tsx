export { prefetchGrand } from '../piano/arranger';
import { memo, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { songs } from '../piano/songs';
import type { Hand } from '../piano/arranger';
import TakesList from './TakesList';
import Coach from './Coach';
import LearnResult, { bestStars, saveStars } from './LearnResult';
import { connectMidi, midiSupported } from '../piano/midiInput';
import { TakeRecorder, listTakes, saveTake } from '../piano/recorder';
import type { Take } from '../piano/recorder';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Arranger, HIGH, LOW, PC_BASE_MAX, PC_BASE_MIN, PC_KEYS, PC_KEY_OFFSET, SPLIT, categories, isBlack, keyName, sounds, styleCategories, styleMeter } from '../piano/arranger';
import { barLength, meterNamed, meters } from '../piano/notation';
import type { ScoreNote } from '../piano/notation';
import PianoScreen from './PianoScreen';
import type { Page } from './PianoScreen';
import Staff, { CROP_HEIGHT, STAFF_BAR, STAFF_LEFT } from './Staff';

const keys = Array.from({ length: HIGH - LOW + 1 }, (_, index) => LOW + index);
const whiteKeys = keys.filter((key) => !isBlack(key));
const whiteWidth = 100 / whiteKeys.length;
const noteLabel = (midi: number) => `${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
const IDLE_MS = 7000; // a select page returns to the main page after this long untouched

// A panel button. With `repeat`, holding it steps again and again, faster the longer it is held (Tempo, Transpose).
function PanelButton({ label, onClick, active, tone = 'grey', className = '', repeat = false }: { label: string; onClick: () => void; active?: boolean; tone?: 'grey' | 'red' | 'green'; className?: string; repeat?: boolean }) {
  const timer = useRef<number | undefined>(undefined);
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  useEffect(() => stop, []);
  const hold = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!repeat || event.button !== 0) return;
    event.preventDefault();
    onClick();
    let gap = 140;
    const step = () => {
      onClick();
      gap = Math.max(35, gap * 0.85);
      timer.current = window.setTimeout(step, gap);
    };
    timer.current = window.setTimeout(step, 400);
  };
  return (
    <button
      type="button"
      onClick={(event) => {
        // A held press already stepped on pointer down; Enter and Space (detail 0) step here.
        if (!repeat || event.detail === 0) onClick();
      }}
      onPointerDown={hold}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => repeat && event.preventDefault()}
      aria-pressed={active}
      className={`pa-btn pa-btn-${tone} ${className}`}
    >
      {active !== undefined && <span className={`pa-led ${active ? 'pa-led-on' : ''}`} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}

// Pointer capture keeps a drag on the joystick or dial even when the pointer leaves it; some synthetic or assistive
// pointers have nothing to capture, which must not throw.
function capture(event: ReactPointerEvent<HTMLElement>) {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    // no active pointer to capture
  }
}

// Velocity from where the key is struck: nearer the front edge is a firmer press, as on a real keybed.
function velocityOf(event: ReactPointerEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  const depth = box.height ? (event.clientY - box.top) / box.height : 0.7;
  return Math.min(1, Math.max(0.25, 0.3 + depth * 0.75));
}

type KeysProps = { arranger: Arranger; pressed: Set<number>; showLetters: boolean; pcBase: number; pointerDown: { current: boolean }; splitShown: boolean; targets: Set<number> };

// The 61 keys, drawn only when a key goes up or down, the letters are toggled, or the computer-key range moves.
const Keys = memo(function Keys({ arranger, pressed, showLetters, pcBase, pointerDown, splitShown, targets }: KeysProps) {
  // One letter per key; when a second computer key plays the same note, the main letter gets a * instead of both.
  const labelFor = new Map<number, string>();
  for (const [code, offset, label] of PC_KEYS) {
    if (SPARE_CODES.has(code)) continue;
    labelFor.set(pcBase + offset, label);
  }
  for (const [code, offset, label] of PC_KEYS) {
    if (!SPARE_CODES.has(code)) continue;
    const main = labelFor.get(pcBase + offset);
    labelFor.set(pcBase + offset, main ? (main.endsWith('*') ? main : `${main}*`) : label);
  }
  const windowStart = whiteKeys.filter((white) => white < Math.max(LOW, pcBase - 1)).length * whiteWidth; // from A's B
  const windowEnd = whiteKeys.filter((white) => white <= Math.min(HIGH, pcBase + 31)).length * whiteWidth;
  return (
    <div className="pa-keys" onPointerLeave={() => { pointerDown.current = false; }}>
      <span className="pa-pc-window" aria-hidden="true" style={{ left: `${windowStart}%`, width: `${windowEnd - windowStart}%` }} />
      {splitShown && (
        <span className="pa-split" aria-hidden="true" style={{ width: `${whiteKeys.filter((white) => white < SPLIT).length * whiteWidth}%` }}>
          <span className="pa-split-tag">Chord · Lower</span>
        </span>
      )}
      {keys.map((key) => {
        const black = isBlack(key);
        const whiteIndex = whiteKeys.filter((white) => white < key).length;
        const position = black
          ? { left: `${whiteIndex * whiteWidth - whiteWidth * 0.29}%`, width: `${whiteWidth * 0.58}%` }
          : { left: `${whiteIndex * whiteWidth}%`, width: `${whiteWidth}%` };
        return (
          <button
            key={key}
            type="button"
            aria-label={`Play ${keyName(key)}`}
            data-key={key}
            style={position}
            className={`pa-key ${black ? 'pa-key-black' : 'pa-key-white'} ${pressed.has(key) ? 'pa-key-down' : ''} ${targets.has(key) ? 'pa-key-target' : ''}`}
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
            {/* The labels are drawn by CSS (data-t), not written as text: iOS shows its magnifier and selection on a
                long press over any text, even text that cannot be selected, and a held key is a long press. */}
            <span className="pa-key-marks" aria-hidden="true">
              {showLetters && labelFor.has(key) && (
                <span className={`pa-key-label ${black ? 'pa-key-label-dark' : ''}`} data-t={labelFor.get(key)!.replace('*', '')}>
                  {labelFor.get(key)!.endsWith('*') && <sup className="pa-key-star" data-t="*" />}
                </span>
              )}
              {black ? (
                <span className={`pa-key-note pa-note-sharp pa-sharp-${NOTE_LETTERS[(key - 1) % 12]}`} data-t={SHARP_NAMES[key % 12]} />
              ) : (
                <span className={`pa-key-note pa-note-${NOTE_LETTERS[key % 12]}`} data-t={key % 12 === 0 ? keyName(key) : NOTE_LETTERS[key % 12]} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// Extra computer keys that repeat a note another key already plays (, . / L ; F K); on the keys they show as a *.
const SPARE_CODES = new Set(['Comma', 'Period', 'Slash', 'KeyL', 'Semicolon', 'KeyF', 'KeyK']);
// Note letter of each pitch class for the coloured note badges on the white keys (C carries its octave, as C4).
const NOTE_LETTERS = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
// Names on the black keys (sharps, as the chord display writes them).
const SHARP_NAMES = ['', 'C♯', '', 'D♯', '', '', 'F♯', '', 'G♯', '', 'A♯', ''];

// A drawn computer keyboard: which key plays which note. Black-key rows sit between the white keys, as on a piano.
const MAP_ROWS: { white: [string, string][]; black: (string | null)[] }[] = [
  { white: [['Q', 'C'], ['W', 'D'], ['E', 'E'], ['R', 'F'], ['T', 'G'], ['Y', 'A'], ['U', 'B'], ['I', 'C'], ['O', 'D'], ['P', 'E'], ['[', 'F'], [']', 'G']], black: ['3', '4', null, '5', '6', '7', null, '9', '0', null, '='] },
  { white: [['A', 'B'], ['Z', 'C'], ['X', 'D'], ['C', 'E'], ['V/F', 'F'], ['B', 'G'], ['N', 'A'], ['M', 'B'], [',/K', 'C'], ['.', 'D'], ['/', 'E']], black: [null, 'S', 'D', null, 'G', 'H', 'J', null, 'L', ';'] },
];

function KeyMap() {
  return (
    <figure className="pa-keymap">
      <figcaption>Computer keyboard</figcaption>
      {MAP_ROWS.map((row, index) => (
        <div key={index} className="pa-keymap-row">
          <div className="pa-keymap-black">
            {row.black.map((key, position) => (key ? <kbd key={position} style={{ left: `calc(${position + 1} * var(--cap) - var(--cap) / 2 + 1px)` }}>{key}</kbd> : null))}
          </div>
          <div className="pa-keymap-white">
            {row.white.map(([key, note], position) => (
              <kbd key={position}>
                {key}
                <small>{note}</small>
              </kbd>
            ))}
          </div>
        </div>
      ))}
      <p className="pa-keymap-note"><kbd>←</kbd> <kbd>→</kbd> move an octave · <kbd>Shift</kbd> louder · top row starts one octave above the bottom row</p>
    </figure>
  );
}

// Time-signature picker: a themed popover with simple metres (crotchet beats) and quaver metres in two rows.
// floating: the list opens in the middle of the screen, above everything (on the phone's music stand it is too short
// to hold it and the keys would cover it). Phones always use it.
function MeterPicker({ value, disabled, onPick, floating = false }: { value: string; disabled: boolean; onPick: (label: string) => void; floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node) && !pop.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', escape, true);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', escape, true);
    };
  }, [open]);
  const groups = [
    { name: 'Crotchet beats', items: meters.filter((item) => item.unit === 4) },
    { name: 'Quaver beats', items: meters.filter((item) => item.unit === 8) },
  ];
  const list = open && (
    <div ref={pop} className="pa-meter-pop" role="listbox" aria-label="Time signature">
      {groups.map((group) => (
        <div key={group.name} className="pa-meter-group">
          <span className="pa-meter-group-name">{group.name}</span>
          <div className="pa-meter-options">
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="option"
                aria-selected={item.label === value}
                className={`pa-meter-option ${item.label === value ? 'pa-meter-option-on' : ''}`}
                onClick={() => {
                  onPick(item.label);
                  setOpen(false);
                }}
              >
                <span className="pa-meter-frac"><b>{item.beats}</b><b>{item.unit}</b></span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="pa-meter-picker" ref={box}>
      <span className="pa-meter-picker-label">Time</span>
      <button
        type="button"
        className="pa-meter-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? 'The style sets the time signature while it plays' : 'Time signature for what you write'}
        onClick={() => setOpen((current) => !current)}
      >
        {value}
        <span aria-hidden="true">▾</span>
      </button>
      {/* Phones always float it: above the sheet bar it would open off the top of the screen. */}
      {list && (floating || window.matchMedia('(max-width: 760px), (max-width: 1100px) and (orientation: portrait), (max-height: 560px) and (orientation: landscape)').matches ? createPortal(<div className="pa-meter-float">{list}</div>, document.body) : list)}
    </div>
  );
}

// Smallest key height worth playing on a phone held sideways.
const KEYS_MIN = 175;

type Played = { midi: number; start: number; end?: number };

function PianoInstrument({ onReady }: { onReady?: () => void }) {
  const engine = useRef<Arranger | null>(null);
  engine.current ??= new Arranger();
  const arranger = engine.current;
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [pressed, setPressed] = useState<Set<number>>(() => new Set());
  const [message, setMessage] = useState('');
  const [beat, setBeat] = useState(false);
  const [showLetters, setShowLetters] = useState(false);
  const stick = useRef<HTMLSpanElement>(null);
  const joyBox = useRef<HTMLDivElement>(null);
  const [pcBase, setPcBase] = useState(48);
  const [page, setPage] = useState<Page>('main');
  const [category, setCategory] = useState('Piano');
  const [bars, setBars] = useState(4);
  const base = useRef(48);
  const typed = useRef(new Map<string, number>());
  const meter = useRef<HTMLSpanElement | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // The upper keyboard of the two-row view (phone or tablet upright, keys only), as in Perfect Piano's dual mode.
  const scroller2 = useRef<HTMLDivElement>(null);
  const pointerDown = useRef(false);
  const dial = useRef<{ x: number; y: number; angle: number; tempo: number } | null>(null);
  const refit = useRef<() => void>(() => undefined);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const take = useRef<{ origin: number; last: number; notes: Played[] }>({ origin: 0, last: 0, notes: [] });
  const downbeat = useRef(0);
  const [showSheet, setShowSheet] = useState(false);
  const [drawer, setDrawer] = useState(false);
  // Phones: keys only. The fold button hides everything above the keys (the screen, the quick bar, the strip) so the
  // keys take the whole screen, and brings it all back on the next tap.
  const [keysOnly, setKeysOnly] = useState(false);
  // Two keyboards: keys only on a phone or tablet held upright. The upper row exists only then (not hidden in the
  // page the rest of the time), so the piano has one set of 61 keys everywhere else.
  const [upright, setUpright] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1100px) and (orientation: portrait)');
    const update = () => setUpright(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const dual = keysOnly && upright;
  // Help: how to play, the computer-keyboard map and the credits, in a pop-up on demand (not under the piano, so no
  // device ever scrolls the page). Escape closes it before it would close the piano.
  const [helpOpen, setHelpOpen] = useState(false);
  // An instrument, not a page of text: no text selection and no Copy / Look Up / Translate menu from a long press
  // anywhere in the piano or its pop-ups (iOS can still start one through CSS alone). Text boxes stay editable.
  useEffect(() => {
    const inPiano = (node: Node | null) => {
      const element = node instanceof Element ? node : node?.parentElement;
      return Boolean(element?.closest('.pa-overlay, .pa-help, .pa-meter-float, .pa-result, .pa-confetti') && !element.closest('input, textarea'));
    };
    const stop = (event: Event) => {
      if (inPiano(event.target as Node)) event.preventDefault();
    };
    const clear = () => {
      const selection = document.getSelection();
      if (selection && selection.rangeCount && inPiano(selection.anchorNode)) selection.removeAllRanges();
    };
    document.addEventListener('selectstart', stop, true);
    document.addEventListener('contextmenu', stop, true);
    document.addEventListener('selectionchange', clear);
    return () => {
      document.removeEventListener('selectstart', stop, true);
      document.removeEventListener('contextmenu', stop, true);
      document.removeEventListener('selectionchange', clear);
    };
  }, []);
  useEffect(() => {
    if (!helpOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      event.preventDefault();
      setHelpOpen(false);
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [helpOpen]);
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('.pa-overlay');
    if (stage) stage.scrollTop = 0; // start at the top: the strip and slider in view
    const frame = requestAnimationFrame(() => {
      refit.current();
      const lower = scroller.current;
      const upper = scroller2.current;
      if (keysOnly && lower && upper && upper.offsetParent) upper.scrollLeft = lower.scrollLeft + (lower.scrollWidth / whiteKeys.length) * 7;
    });
    return () => cancelAnimationFrame(frame);
  }, [keysOnly, dual]);
  const [hand, setHand] = useState<Hand>('right');
  // Bars on the screen's Score page, from its card's shape: bars that make the staff as wide (for its height) as the card.
  const [screenBars, setScreenBars] = useState(3);
  const scoreObserver = useRef<ResizeObserver | null>(null);
  // The same for the music stand on a phone held sideways.
  const [stageBars, setStageBars] = useState(4);
  const stageObserver = useRef<ResizeObserver | null>(null);
  const measureStand = (element: HTMLDivElement | null) => {
    stageObserver.current?.disconnect();
    if (!element || typeof ResizeObserver === 'undefined') return;
    stageObserver.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const next = Math.max(2, Math.min(8, Math.round(((width / height) * CROP_HEIGHT - STAFF_LEFT) / STAFF_BAR)));
      setStageBars((current) => (current === next ? current : next));
    });
    stageObserver.current.observe(element);
  };
  const [phoneLandscape, setPhoneLandscape] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-height: 560px) and (orientation: landscape)');
    const update = () => setPhoneLandscape(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const measureScore = (element: HTMLDivElement | null) => {
    scoreObserver.current?.disconnect();
    if (!element || typeof ResizeObserver === 'undefined') return;
    scoreObserver.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const next = Math.max(2, Math.min(8, Math.round(((width / height) * CROP_HEIGHT - STAFF_LEFT) / STAFF_BAR)));
      setScreenBars((current) => (current === next ? current : next));
    });
    scoreObserver.current.observe(element);
  };
  const [speed, setSpeed] = useState(0.5);
  const recorder = useRef(new TakeRecorder());
  const [recording, setRecording] = useState(false);
  const [takes, setTakes] = useState<Take[]>([]);
  const [midiDevices, setMidiDevices] = useState<string[] | null>(null);
  const midiOff = useRef<(() => void) | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  // Keys slider (as in Perfect Piano): how many white keys fit the screen. Kept in this browser; until it is moved,
  // the layout's own key size applies and the slider shows how many keys that gives.
  const [shownKeys, setShownKeys] = useState(15);
  const [zoomKeys, setZoomKeys] = useState<number | null>(() => {
    try {
      const saved = Number(localStorage.getItem('piano-keys-shown'));
      return saved >= 7 && saved <= whiteKeys.length ? saved : null;
    } catch {
      return null;
    }
  });
  const zoomRef = useRef(zoomKeys);
  zoomRef.current = zoomKeys;
  const setZoom = (count: number) => {
    setZoomKeys(count);
    try {
      localStorage.setItem('piano-keys-shown', String(count));
    } catch {
      // storage blocked: the setting lasts until the page closes
    }
  };
  // Resize the keys and keep the same notes in the middle of the screen.
  useEffect(() => {
    const bed = scroller.current;
    const keys = bed?.querySelector<HTMLElement>('.pa-keys');
    if (!bed || !keys || zoomKeys === null) return;
    const middle = (bed.scrollLeft + bed.clientWidth / 2) / bed.scrollWidth;
    for (const row of [keys, scroller2.current?.querySelector<HTMLElement>('.pa-keys')]) {
      if (!row) continue;
      row.style.minWidth = `${(100 * whiteKeys.length) / zoomKeys}%`;
      row.style.width = row.style.minWidth;
    }
    bed.scrollLeft = middle * bed.scrollWidth - bed.clientWidth / 2;
    bed.dispatchEvent(new Event('scroll'));
  }, [zoomKeys]);
  const minimapWindow = useRef<HTMLSpanElement>(null);

  // Screen pages; a select page closes itself after a while, like the Pa300's auto-exit.
  const open = (next: Page, nextCategory?: string) => {
    setPage(next);
    if (nextCategory) setCategory(nextCategory);
    if (idle.current) clearTimeout(idle.current);
    if (next !== 'main') idle.current = setTimeout(() => setPage('main'), IDLE_MS);
  };

  // Wire the engine to the panel, boot the screen, play a chime and centre the keyboard on middle C.
  useEffect(() => {
    arranger.onChange = refresh;
    arranger.onNote = (key, on) => {
      setPressed((previous) => {
        const next = new Set(previous);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      });
      // Capture what is played for the music stand (not the song player's notes), like writing on one page until
      // Clear. With the metronome or a style running, bar 1 starts on its last downbeat so barlines match the clicks.
      if (arranger.song) return;
      const now = performance.now();
      const current = take.current;
      if (on) {
        if (!current.notes.length) {
          const clocked = (arranger.metronome || arranger.running) && now - downbeat.current < 4000;
          take.current = { origin: clocked ? downbeat.current : now, last: now, notes: [] };
        }
        take.current.notes.push({ midi: key, start: now });
        if (take.current.notes.length > 400) take.current.notes.shift();
        take.current.last = now;
      } else {
        const note = [...current.notes].reverse().find((item) => item.midi === key && item.end === undefined);
        if (note) note.end = now;
        current.last = now;
      }
    };
    arranger.onBeat = () => {
      if (arranger.beat === 1) downbeat.current = performance.now();
      setBeat(true);
      setTimeout(() => setBeat(false), 90);
      refresh();
    };
    // Tell the stage the instrument is ready once the grand piano's middle notes have loaded (the 3 nearest middle C; the rest stream in while you play), or after 1.5 s at most.
    let told = false;
    const ready = () => {
      if (told) return;
      told = true;
      arranger.pauseLoading(2400); // let the curtain part without decoding competing for the CPU
      onReady?.();
    };
    const fallback = setTimeout(ready, 1500);
    void arranger.loadFirst('salamander', 3).then(ready);
    arranger.chime();
    const greeting = 'Concert Grand ready. Tap the screen to choose sounds, styles and songs.';
    setMessage(greeting);
    const centre = setTimeout(() => {
      const element = scroller.current;
      if (element) element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    }, 50);
    const fit = () => {
      setBars(window.innerWidth < 700 ? 2 : window.innerWidth < 1000 ? 3 : 4);
      const root = scroller.current?.closest<HTMLElement>('.pa-instrument');
      if (!root) return;
      // Until the Keys slider is moved, each layout uses its own key width (a tablet upright sets one below).
      // Key width for each row, changed only when it differs: clearing and re-setting it would snap a scrolled row
      // back to the start.
      const sizeRows = (width: string) => {
        if (zoomRef.current !== null) return;
        for (const row of root.querySelectorAll<HTMLElement>('.pa-keys')) {
          if (row.style.minWidth === width) continue;
          row.style.minWidth = width;
          row.style.width = width;
        }
      };
      const portrait = window.matchMedia('(max-width: 1100px) and (orientation: portrait)').matches;
      if (!portrait) sizeRows('');
      if (window.matchMedia('(max-height: 560px) and (orientation: landscape)').matches) {
        // A phone on its side reports the same safe-area inset left and right, but the notch or Dynamic Island is
        // only on one side: the top of the phone. Keep the keys clear of that side only, so they run to the other
        // edge. The turn decides the side: 90 degrees (turned left) puts the top of the phone on the left.
        const turn = (window as Window & { orientation?: number }).orientation ?? screen.orientation?.angle;
        const island = turn === 90 ? 'left' : turn === -90 || turn === 270 ? 'right' : 'both';
        root.style.setProperty('--island-l', island === 'right' ? '0px' : 'env(safe-area-inset-left)');
        root.style.setProperty('--island-r', island === 'left' ? '0px' : 'env(safe-area-inset-right)');
        root.dataset.island = island;
        // The joystick and Sustain sit in the island's strip, centred in the space between the bottom of the Dynamic
        // Island and the bottom of the screen. In landscape the island is centred on that edge and about 126 pt long;
        // the page starts below Safari's bars, so convert from screen to page by the difference in heights.
        const shortSide = Math.min(screen.width, screen.height);
        const pageTop = Math.max(0, shortSide - window.innerHeight);
        const islandBottom = shortSide / 2 + 63 - pageTop;
        const stack = 92; // joystick 54 + gap 6 + Sustain 28 + padding
        const keysTop = root.querySelector<HTMLElement>('.pa-keys')?.getBoundingClientRect().top ?? 0;
        const free = Math.max(islandBottom + 6, keysTop);
        const joyTop = Math.min(window.innerHeight - stack - 4, free + Math.max(0, (window.innerHeight - free - stack) / 2));
        root.style.setProperty("--joy-top", `${Math.round(joyTop)}px`);
        // Nothing is scaled down: the panel opens as its own full-size view (keys step aside), and the sheet music
        // sits at full size above the keys, which take the height that is left.
        root.style.removeProperty('--fit');
        const keys = root.querySelector<HTMLElement>('.pa-keys');
        const stage = root.closest<HTMLElement>('.pa-overlay');
        if (!keys || !keys.offsetParent) return;
        const top = keys.getBoundingClientRect().top + (stage?.scrollTop ?? 0);
        const first = [...root.querySelectorAll<HTMLElement>('.pa-ctl-row .pa-btn, .pa-phone-btn')].find((element) => element.offsetParent);
        if (first && stage) {
          const box = first.getBoundingClientRect();
          stage.style.setProperty('--close-top', `${Math.max(4, Math.round(box.top + box.height / 2 - 16 + stage.scrollTop))}px`);
        }
        const homeBar = stage ? parseFloat(getComputedStyle(stage).paddingBottom) || 0 : 0; // iPhone home indicator inset
        // Landscape: the keys run to the bottom edge (the note names sit above the home bar, in CSS).
        void homeBar;
        root.style.setProperty('--keys-h', `${Math.max(KEYS_MIN - 55, Math.floor(window.innerHeight - top - 2))}px`);
      } else if (window.matchMedia('(max-width: 1100px) and (orientation: portrait)').matches) {
        // Portrait phone: the keys take the rest of the screen below the touch screen and quick bar.
        root.style.removeProperty('--fit');
        const keys = root.querySelector<HTMLElement>('.pa-keys');
        const stage = root.closest<HTMLElement>('.pa-overlay');
        if (!keys) return;
        // Two rows (keys only): they share the height from the top of the upper row down.
        const upperRow = root.querySelector<HTMLElement>('.pa-keyrow2');
        const dual = Boolean(upperRow?.offsetParent);
        const top = (dual && upperRow ? upperRow : keys).getBoundingClientRect().top + (stage?.scrollTop ?? 0);
        // The keys stop just above the browser's toolbar (keys under it cannot be tapped); the instrument's casing
        // continues below them to the bottom edge, so the glass toolbar floats over the piano, not a bare band.
        // Portrait: stop above the browser's floating toolbar. 100svh is the height with the browser's bars showing,
        // which window.innerHeight does not give on iPhone (it includes the area under the toolbar).
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;height:100svh;width:0;visibility:hidden';
        document.body.append(probe);
        const small = probe.getBoundingClientRect().height || window.innerHeight;
        probe.remove();
        // iOS 26 Safari: the toolbar floats over the page and even 100svh is the whole screen, so leave room for the
        // toolbar itself (131 pt on an iPhone 15/16 in portrait, measured from a screenshot, 23 Oct 2026).
        const floatingBar = /iPhone/.test(navigator.userAgent) && small >= window.screen.height - 4;
        const below = floatingBar ? 132 : 8;
        const room = Math.floor(Math.min(window.innerHeight - 30, small - below) - top);
        const keysHeight = dual ? Math.max(110, Math.floor((room - 22) / 2)) : Math.max(window.innerHeight <= 700 ? 120 : 150, room);
        root.style.setProperty('--keys-h', `${keysHeight}px`);
        // Until the Keys slider is moved: a tablet upright shows about ten keys and the two-row view about seven per
        // row, each nearer a real key's shape (about 6 to 6.5 times taller than wide) than a phone's narrow default.
        if (window.innerWidth >= 600 || dual) {
          const across = keys.parentElement?.clientWidth ?? window.innerWidth;
          const width = Math.max(44, dual ? Math.min(across / 7, keysHeight / 6) : Math.min(across / 10, keysHeight / 6.5));
          sizeRows(`${Math.round(whiteKeys.length * width)}px`);
        } else sizeRows('');
      } else {
        root.style.removeProperty('--fit');
        root.style.removeProperty('--keys-h');
        // Laptops, monitors and tablets held sideways: the instrument is laid out for a 1440 px wide window and scaled
        // as one piece (keys, text and buttons together) to fit the window exactly: up to twice the size on a big
        // monitor, smaller on a short laptop screen, so it never needs scrolling. The current scale is divided out,
        // so measuring never resets it.
        root.dataset.layout = 'desk';
        const stage = root.closest<HTMLElement>('.pa-stage');
        const body = root.querySelector<HTMLElement>('.pa-body');
        if (stage && body) {
          const current = Number(stage.style.zoom) || 1;
          const natural = body.getBoundingClientRect().height / current;
          const scale = Math.max(0.5, Math.min(2, window.innerWidth / 1440, (window.innerHeight - 24) / natural));
          stage.style.zoom = Math.abs(scale - 1) > 0.01 ? scale.toFixed(3) : '';
          const close = stage.parentElement?.querySelector<HTMLElement>('.pa-overlay-close');
          if (close) close.style.zoom = stage.style.zoom; // Close grows with the piano
        }
        return;
      }
      root.dataset.layout = 'phone';
      root.closest<HTMLElement>('.pa-stage')?.style.removeProperty('zoom'); // phones keep their own layouts
      root.closest('.pa-overlay-frame')?.querySelector<HTMLElement>('.pa-overlay-close')?.style.removeProperty('zoom');
    };
    fit();
    refit.current = fit;
    const settle = setTimeout(fit, 400); // again once fonts and the stage have settled
    window.addEventListener('resize', fit);
    // Again whenever a part above the keys changes size (a message wraps, a page or the Panel opens), so the keys
    // always end where they should instead of where they were first measured.
    const above = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
    const host = scroller.current?.closest<HTMLElement>('.pa-instrument');
    for (const part of host?.querySelectorAll('.pa-top, .pa-drawer, .pa-phonebar') ?? []) above?.observe(part);
    return () => {
      clearTimeout(fallback);
      clearTimeout(centre);
      clearTimeout(settle);
      above?.disconnect();
      window.removeEventListener('resize', fit);
      if (idle.current) clearTimeout(idle.current);
      arranger.dispose();
    };
  }, [arranger]);

  // Redraw the music stand while notes sound or a song plays, so held notes grow and the cursor moves.
  useEffect(() => {
    if (!pressed.size && !arranger.song) return;
    const timer = setInterval(refresh, 120);
    return () => clearInterval(timer);
  }, [pressed.size, arranger.song, arranger]);

  // Phones: refit the panel and keys when the sheet music or the panel opens or closes.
  useEffect(() => {
    const first = requestAnimationFrame(() => refit.current());
    const after = setTimeout(() => refit.current(), 400); // after the sheet's open animation
    return () => {
      cancelAnimationFrame(first);
      clearTimeout(after);
    };
  }, [showSheet, drawer, page]);

  // Computer keyboard: two rows from C (see PC_KEYS), arrows move them an octave, Shift plays louder, Space sustains.
  useEffect(() => {
    const ignore = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest('textarea, select, [contenteditable="true"], input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"])');
      return event.metaKey || event.ctrlKey || event.altKey || Boolean(typing);
    };
    const down = (event: KeyboardEvent) => {
      if (ignore(event)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        arranger.setPedal(true);
        return;
      }
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        if (event.repeat) return;
        const next = Math.min(PC_BASE_MAX, Math.max(PC_BASE_MIN, base.current + (event.code === 'ArrowLeft' ? -12 : 12)));
        base.current = next;
        setPcBase(next);
        setMessage(`Computer keys: ${noteLabel(next)} to ${noteLabel(Math.min(HIGH, next + 31))}`);
        return;
      }
      const offset = PC_KEY_OFFSET[event.code];
      if (offset === undefined) return;
      event.preventDefault();
      if (event.repeat || typed.current.has(event.code)) return;
      const key = base.current + offset;
      if (key > HIGH || key < LOW) return;
      typed.current.set(event.code, key);
      arranger.noteOn(key, event.shiftKey ? 1 : 0.75);
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        arranger.setPedal(false);
        return;
      }
      const key = typed.current.get(event.code);
      if (key === undefined) return;
      typed.current.delete(event.code);
      arranger.noteOff(key);
    };
    // A key held while the window loses focus would never get its keyup, so let everything go.
    const blur = () => {
      for (const key of typed.current.values()) arranger.noteOff(key);
      typed.current.clear();
      arranger.setPedal(false);
    };
    const release = () => {
      pointerDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pointerup', release);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pointerup', release);
    };
  }, [arranger]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollWidth, clientWidth } = element;
      // iOS reports a negative or too-large scrollLeft while it bounces at either end; keep the window inside the map.
      const scrollLeft = Math.min(Math.max(element.scrollLeft, 0), scrollWidth - clientWidth);
      const span = minimapWindow.current;
      if (span) {
        span.style.left = `${(100 * scrollLeft) / scrollWidth}%`;
        span.style.width = `${(100 * clientWidth) / scrollWidth}%`;
      }
      setShownKeys(Math.max(7, Math.min(whiteKeys.length, Math.round((clientWidth / scrollWidth) * whiteKeys.length))));
      const next = { left: scrollLeft > 4, right: scrollLeft + clientWidth < scrollWidth - 4 };
      setEdges((previous) => (previous.left === next.left && previous.right === next.right ? previous : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    element.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      element.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  // One octave of white keys, for the ‹ › buttons.
  const octave = () => {
    const element = scroller.current;
    return element ? (element.scrollWidth / whiteKeys.length) * 7 : 300;
  };
  const scrollKeys = (direction: number) => scroller.current?.scrollBy({ left: direction * octave(), behavior: 'smooth' });
  const minimapTo = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = scroller.current;
    if (!element) return;
    const box = event.currentTarget.getBoundingClientRect();
    element.scrollLeft = ((event.clientX - box.left) / box.width) * element.scrollWidth - element.clientWidth / 2;
  };

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

  // Rec: records the output (keyboard, style and song) and the notes played; press again to stop and keep the take.
  // left: the page was hidden mid-take (another app, the lock screen). The take stops and is saved there and then,
  // before the audio is parked, so nothing recorded is lost and no take carries on into a silent context.
  const toggleRecord = async (left = false) => {
    if (recorder.current.recording) {
      arranger.onPlayed = () => {};
      const take = await recorder.current.stop(`Take ${(await listTakes()).length + 1}`);
      setRecording(false);
      if (!take) return;
      await saveTake(take);
      setTakes(await listTakes());
      open('rec');
      say(left
        ? `${take.name} was saved when you left the app (recording stops there). Press Rec to record again.`
        : `${take.name} saved. Play it here, or save it as WAV (any device) or MIDI (any DAW).`);
      return;
    }
    if (left) return;
    if (!TakeRecorder.supported()) {
      say('This browser cannot record audio.');
      return;
    }
    const output = arranger.tap();
    if (!output || !arranger.ctx) return;
    setTakes(await listTakes());
    recorder.current.start(arranger.ctx, output);
    arranger.onPlayed = (event) => recorder.current.mark(event);
    setRecording(true);
    say('● Recording. Play, then press Rec again to stop.');
  };

  const saveOnLeave = useRef<() => void>(() => undefined);
  saveOnLeave.current = () => {
    if (recorder.current.recording) void toggleRecord(true);
  };

  // MIDI: plays this piano from a real keyboard connected by USB or Bluetooth.
  const toggleMidi = async () => {
    if (midiOff.current) {
      midiOff.current();
      midiOff.current = null;
      setMidiDevices(null);
      say('MIDI keyboard disconnected.');
      return;
    }
    if (!midiSupported()) {
      say('This browser has no MIDI input. Use Chrome or Edge on a computer or Android.');
      return;
    }
    try {
      arranger.init();
      midiOff.current = await connectMidi(arranger, (names) => {
        setMidiDevices(names);
        say(names.length ? `MIDI: ${names.join(', ')} plays the piano.` : 'MIDI is on. Connect your keyboard by USB and play.');
      });
    } catch {
      say('MIDI access was blocked. Allow it in the browser and press MIDI again.');
    }
  };
  useEffect(() => () => midiOff.current?.(), []);

  // Phone held sideways: the Panel button steps aside while the Panel is open, so the stage's ✕ first goes back to the
  // blue screen; from the screen it closes the piano. Caught before the stage's own handler runs. Upright, the Panel
  // and Sheet buttons stay under the thumb and close their own views, so Close at the top only closes the piano.
  const SIDEWAYS = '(max-height: 560px) and (orientation: landscape)';
  const views = useRef({ drawer, showSheet });
  views.current = { drawer, showSheet };
  useEffect(() => {
    const phone = window.matchMedia(SIDEWAYS);
    const intercept = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('.pa-overlay-close') : null;
      const { drawer: panelOpen, showSheet: sheetOpen } = views.current;
      if (!target || !phone.matches || (!panelOpen && !sheetOpen)) return;
      event.preventDefault();
      event.stopPropagation();
      setDrawer(false);
      setShowSheet(false);
    };
    window.addEventListener('click', intercept, true);
    return () => window.removeEventListener('click', intercept, true);
  }, []);
  useEffect(() => {
    const close = document.querySelector('.pa-overlay-close');
    if (close) close.setAttribute('aria-label', (drawer || showSheet) && window.matchMedia(SIDEWAYS).matches ? 'Back to the screen' : 'Close the curtain');
  }, [drawer, showSheet]);

  // Phones: any touch, tap, click or key press unlocks the audio if the browser still holds it back, and coming back
  // to the page (after another app, a call or the lock screen) wakes it again.
  useEffect(() => {
    const wake = () => arranger.unlockAudio();
    const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'] as const;
    for (const name of events) window.addEventListener(name, wake, { capture: true, passive: true });
    // Leaving parks the audio; coming back wakes it at once on a computer, and on the first tap on a phone (iOS
    // only lets a tap start sound again).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const back = () => {
      if (document.visibilityState === 'hidden') {
        saveOnLeave.current();
        arranger.park();
      } else if (!touch) arranger.unlockAudio();
    };
    const away = () => {
      saveOnLeave.current();
      arranger.park();
    };
    // A sheet or another app over Safari takes the focus (and the audio) without hiding the page.
    const blurred = () => {
      if (touch) arranger.markStale();
    };
    window.addEventListener('blur', blurred);
    document.addEventListener('visibilitychange', back);
    window.addEventListener('pageshow', back);
    window.addEventListener('pagehide', away);
    return () => {
      for (const name of events) window.removeEventListener(name, wake, { capture: true });
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('pageshow', back);
      window.removeEventListener('pagehide', away);
      window.removeEventListener('blur', blurred);
    };
  }, [arranger]);

  // Touch on the keys. Each finger is followed across the keys: sliding onto a new key plays it and lets the last
  // one go (glissandos and slid trills; a browser keeps a touch on the key it started on, so this is done here).
  // Two fingers that move sideways together slide the keyboard instead; fingers held still play chords.
  useEffect(() => {
    const beds = [scroller.current, scroller2.current].filter((element): element is HTMLDivElement => Boolean(element));
    const cleanups = beds.map((bed) => attachTouch(bed));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [arranger, dual]); // eslint-disable-line react-hooks/exhaustive-deps
  function attachTouch(bed: HTMLDivElement) {
    const touches = new Map<number, { x: number; y: number; key: number | null; first: number | null }>();
    let sliding = false;
    let startX = 0;
    let lastX = 0;
    const average = () => [...touches.values()].reduce((sum, touch) => sum + touch.x, 0) / Math.max(1, touches.size);
    const keyAt = (x: number, y: number) => {
      const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-key]');
      return element ? Number(element.dataset.key) : null;
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      const key = keyAt(event.clientX, event.clientY);
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY, key, first: key });
      startX = lastX = average();
    };
    const move = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      if (!touch) return;
      const fromX = touch.x;
      const fromY = touch.y;
      touch.x = event.clientX;
      touch.y = event.clientY;
      if (touches.size >= 2) {
        const x = average();
        if (!sliding && Math.abs(x - startX) > 24) {
          sliding = true;
          arranger.releaseAll();
          for (const other of touches.values()) other.key = null;
          lastX = x;
        }
        if (sliding) {
          bed.scrollLeft -= x - lastX;
          lastX = x;
          event.stopPropagation();
          return;
        }
      }
      // Walk the path from the last point to this one in small steps (a fast slide skips keys between the move
      // events the browser sends), playing each key the finger crosses.
      const distance = Math.hypot(event.clientX - fromX, event.clientY - fromY);
      const steps = Math.max(1, Math.ceil(distance / 6));
      for (let step = 1; step <= steps; step++) {
        const key = keyAt(fromX + ((event.clientX - fromX) * step) / steps, fromY + ((event.clientY - fromY) * step) / steps);
        if (key === null || key === touch.key) continue;
        if (touch.key !== null && ![...touches.values()].some((other) => other !== touch && other.key === touch.key)) arranger.noteOff(touch.key);
        touch.key = key;
        arranger.noteOn(key, 0.7);
      }
    };
    const up = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      if (!touch) return;
      touches.delete(event.pointerId);
      // The key under the finger now (if the finger slid off the first key, the first key's own handler releases only that one).
      if (touch.key !== null && touch.key !== touch.first && ![...touches.values()].some((other) => other.key === touch.key)) arranger.noteOff(touch.key);
      startX = lastX = average();
      if (!touches.size) sliding = false;
    };
    // iOS: a finger held on a key would start the text loupe (magnifier) and selection; cancelling the touch's
    // default stops that. Keys play from pointer events, which still arrive, and sliding is handled above.
    const noLoupe = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };
    bed.addEventListener('touchstart', noLoupe, { passive: false });
    bed.addEventListener('pointerdown', down, true);
    bed.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    return () => {
      bed.removeEventListener('touchstart', noLoupe);
      bed.removeEventListener('pointerdown', down, true);
      bed.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('pointercancel', up, true);
    };
  }

  // Learn: choose a piece and a hand; the keys to press glow green and the music waits until they are played.
  const learn = arranger.learn;
  const startLearn = (songId: string, chosen = hand, pace = speed) => {
    const song = songs.find((item) => item.id === songId);
    if (!song) return;
    // Bonus speeds (150%, 200%) open for a piece once it is mastered: every note right at 100% with this hand.
    if (pace > 1 && (bestStars()[`${song.id}:${chosen}`] ?? 0) < 4) {
      say(`Master ${song.short ?? song.title} at 100% first (every note right); then ${Math.round(pace * 100)}% opens as a bonus.`);
      return;
    }
    say(`Loading ${song.title}…`);
    void arranger.startLearn(song, chosen, pace).then(() => {
      setDrawer(false); // one view at a time: the sheet music replaces the Panel
      setShowSheet(true);
      open('main');
      say(`Learn: ${song.title}, ${chosen === 'both' ? 'both hands' : `${chosen} hand`}, ${Math.round(pace * 100)}% speed. Play the green keys; the music waits for you.`);
    });
  };
  const targetList = [...arranger.learnTargets].map((pitch) => pitch - arranger.transpose - arranger.octave * 12).sort((a, b) => a - b);
  const targetKey = targetList.join(',');
  const targets = useMemo(() => new Set(targetKey ? targetKey.split(',').map(Number) : []), [targetKey]);
  const finished = Boolean(learn && learn.at >= learn.steps.length);
  useEffect(() => {
    if (finished && learn?.result) saveStars(`${learn.song.id}:${learn.hand}`, learn.result.grade === 'perfect' && learn.speed >= 1 ? 4 : learn.result.stars); // 4: mastered
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  // Keep the next keys in view on a narrow screen.
  useEffect(() => {
    const first = targetKey.split(',')[0];
    const element = first ? scroller.current?.querySelector<HTMLElement>(`[aria-label$="${keyName(Number(first))}"]`) : null;
    const box = scroller.current?.getBoundingClientRect();
    if (!element || !box) return;
    const rect = element.getBoundingClientRect();
    if (rect.left < box.left + 20 || rect.right > box.right - 20) scroller.current?.scrollBy({ left: rect.left - box.left - box.width / 3, behavior: 'smooth' });
  }, [targetKey]);

  // Song play: when the song's notes sound off screen (the keyboard was slid elsewhere, or the tune moved), slide
  // the keys to where they are playing. A slide by hand is left alone for 2 seconds so the two do not fight.
  const follow = useRef({ auto: 0, manual: 0 });
  useEffect(() => {
    const bed = scroller.current;
    if (!bed) return;
    const scrolled = () => {
      if (performance.now() > follow.current.auto) follow.current.manual = performance.now();
    };
    bed.addEventListener('scroll', scrolled, { passive: true });
    return () => bed.removeEventListener('scroll', scrolled);
  }, []);
  useEffect(() => {
    const bed = scroller.current;
    if (!arranger.song || learn || !pressed.size || !bed) return;
    const now = performance.now();
    if (now - follow.current.manual < 2000 || now < follow.current.auto) return;
    const box = bed.getBoundingClientRect();
    const rects = [...pressed].map((key) => bed.querySelector<HTMLElement>(`[data-key="${key}"]`)?.getBoundingClientRect()).filter((rect): rect is DOMRect => Boolean(rect));
    if (!rects.length || rects.every((rect) => rect.left >= box.left && rect.right <= box.right)) return;
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    // Centre the sounding notes; if they span more than the screen, keep the top (the tune) in view.
    const middle = right - left < box.width - 40 ? (left + right) / 2 : right - box.width / 2 + 20;
    follow.current.auto = now + 900;
    bed.scrollBy({ left: middle - (box.left + box.width / 2), behavior: 'smooth' });
  }, [pressed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Music stand: the song's sheet music while a song plays, otherwise what you play, written to the current tempo.
  const songScore = arranger.songScore;
  let standNotes: ScoreNote[];
  let standMeter: { beats: number; unit: number };
  let cursor: number | undefined;
  if (songScore) {
    standNotes = songScore.notes;
    standMeter = songScore.meter;
    cursor = arranger.songPosition16();
  } else {
    standMeter = meterNamed(arranger.running ? styleMeter(arranger.style) : arranger.meter.label);
    const sixteenth = 60 / arranger.tempo / 4;
    const now = performance.now();
    const { origin, notes } = take.current;
    standNotes = notes.map((note) => ({
      midi: note.midi,
      start: Math.round((note.start - origin) / 1000 / sixteenth),
      length: Math.max(1, Math.round(((note.end ?? now) - note.start) / 1000 / sixteenth)),
    }));
  }
  const bar = barLength(standMeter);
  const latest = cursor ?? standNotes.reduce((end, note) => Math.max(end, note.start), 0);
  const fromBar = Math.max(0, Math.floor(latest / bar) - (cursor !== undefined ? 1 : bars - 1));

  // Clear: wipes what you played from the sheet (not shown for a song's own score).
  const clearTake = () => {
    take.current = { origin: 0, last: 0, notes: [] };
    refresh();
  };
  // Keys only: in the strip row (its own slot), which stays in both views so the Keys slider is always at hand.
  // The arrow shows where the keys go: up (grow to fill the screen), then down (the controls come back over them).
  const foldButton = (
    <button
      type="button"
      className="pa-fold"
      aria-pressed={keysOnly}
      aria-label={keysOnly ? 'Show the controls' : 'Keys only: hide the controls'}
      title={keysOnly ? 'Show the controls' : 'Keys only'}
      onClick={() => setKeysOnly((value) => !value)}
    >
      <svg viewBox="0 0 20 12" aria-hidden="true"><path d={keysOnly ? 'M3 2 L10 9 L17 2' : 'M3 10 L10 3 L17 10'} /></svg>
    </button>
  );

  // Phones have no sheet bar, so the stand carries the time signature picker and Clear beside the staff.
  const clearButton = !songScore && (
    <div className="pa-stand-tools">
      <MeterPicker
        floating
        value={`${standMeter.beats}/${standMeter.unit}`}
        disabled={arranger.running}
        onPick={(label) => arranger.setMeter(meters.findIndex((item) => item.label === label))}
      />
      <button type="button" className="pa-stand-clear" onClick={clearTake} aria-label="Clear the sheet">
        Clear
      </button>
    </div>
  );

  // The screen's Score page shows as many bars as fit the display's shape (a wide, short display shows more bars),
  // so the staff fills it at the same note size instead of shrinking into the middle.
  const screenFromBar = Math.max(0, Math.floor(latest / bar) - (cursor !== undefined ? 1 : screenBars - 1));
  const scoreView = (
    <>
      {learn && <Coach mood={arranger.coach.mood} text={arranger.coach.text} tick={arranger.coach.tick} tempo={arranger.tempo} />}
      {clearButton}
      <Staff
        notes={standNotes}
        meter={standMeter}
        fromBar={screenFromBar}
        bars={screenBars}
        cursor={cursor}
        recent={pressed}
        learnAt={learn ? cursor : undefined}
        crop
        version={`screen${screenBars}:${learn ? `learn${learn.at}` : ''}${songScore ? 'song' : 'live'}:${standNotes.length}:${standNotes.reduce((sum, note) => sum + note.start + note.length * 3, 0)}:${screenFromBar}:${standMeter.beats}/${standMeter.unit}:${cursor === undefined ? '' : Math.round(cursor * 2)}:${[...pressed].join(',')}`}
      />
    </>
  );

  // What the music stand shows (the coach while learning, then the staff). On a phone held sideways the stand is
  // short and wide, so it shows as many bars as fit its shape (the same note size, filling the width).
  const standFit = phoneLandscape;
  const standBars = standFit ? stageBars : bars;
  const standFrom = standFit ? Math.max(0, Math.floor(latest / bar) - (cursor !== undefined ? 1 : standBars - 1)) : fromBar;
  const standView = (
    <>
      {learn && <Coach mood={arranger.coach.mood} text={arranger.coach.text} tick={arranger.coach.tick} tempo={arranger.tempo} />}
      {clearButton}
      <Staff
        crop={standFit}
        notes={standNotes}
        meter={standMeter}
        fromBar={standFrom}
        bars={standBars}
        cursor={cursor}
        recent={pressed}
        learnAt={learn ? cursor : undefined}
        version={`${standFit ? 'fit' : ''}${learn ? `learn${learn.at}` : ''}${songScore ? 'song' : 'live'}:${standNotes.length}:${standNotes.reduce((sum, note) => sum + note.start + note.length * 3, 0)}:${standFrom}:${standBars}:${standMeter.beats}/${standMeter.unit}:${cursor === undefined ? '' : Math.round(cursor * 2)}:${[...pressed].join(',')}`}
      />
    </>
  );

  // Joystick, left of the keys as on the Pa300: sideways bends the pitch (up to two semitones), up adds vibrato.
  const placeStick = (x: number, y: number, held: boolean) => {
    const element = stick.current;
    if (element) {
      element.classList.toggle('pa-joy-held', held);
      element.style.transform = `translate(${x * 14}px, ${-y * 14}px) rotate(${x * 18}deg)`;
    }
    joyBox.current?.setAttribute('aria-valuenow', String(Math.round(x * 20) / 10));
  };
  const moveJoy = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.type === 'pointermove' && !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
    const y = Math.max(0, Math.min(1, 1 - ((event.clientY - box.top) / box.height) * 2));
    placeStick(x, y, true);
    arranger.setBend(x * 2);
    arranger.setModulation(y);
  };
  const releaseJoy = () => {
    placeStick(0, 0, false);
    arranger.setBend(0);
    arranger.setModulation(0);
  };

  return (
    <div role="region" aria-label="Piano" className={`pa-instrument ${keysOnly ? 'pa-keys-only' : ''}`}>
      {learn?.result && (
        <LearnResult
          result={learn.result}
          title={learn.song.title}
          speed={learn.speed}
          onAgain={() => startLearn(learn.song.id, learn.hand, learn.speed)}
          onSpeed={(next) => {
            setSpeed(next);
            startLearn(learn.song.id, learn.hand, next);
          }}
          onDone={() => {
            arranger.stopLearn();
            setShowSheet(false);
          }}
        />
      )}
      <div className="pa-body">
        <div className="pa-top">
          <div className="pa-brand">
            <span className="pa-brand-name">ADITHYA</span>
            <span className="pa-brand-model">PRO ARRANGER · 61</span>
          </div>
          <span className="pa-grille" aria-hidden="true" />
          <span className="pa-badge">Touch screen · 33 sounds · 13 styles</span>
          <button type="button" className="pa-help-btn" aria-label="Help: how to play" onClick={() => setHelpOpen(true)}>?</button>
        </div>

        <div className={`pa-drawer ${drawer ? 'pa-drawer-open' : ''}`}>
        <div className="pa-panel">
          <div className="pa-centre">
            <PianoScreen
              arranger={arranger}
              page={page}
              category={category}
              open={open}
              message={message}
              beat={beat}
              meterRef={(element) => {
                meter.current = element;
              }}
              recording={recording}
              onClear={songScore ? undefined : clearTake}
              score={<div ref={measureScore} className="pa-stand pa-stand-screen" aria-label="Score">{scoreView}</div>}
              hand={hand}
              onHand={(next) => {
                setHand(next);
                if (arranger.learn) startLearn(arranger.learn.song.id, next);
              }}
              onLearn={(songId) => startLearn(songId)}
              stars={bestStars()}
              speed={speed}
              onSpeed={(next) => {
                setSpeed(next);
                if (arranger.learn) startLearn(arranger.learn.song.id, hand, next);
              }}
              takes={<TakesList takes={takes} ctx={() => arranger.ctx} onChange={() => void listTakes().then(setTakes)} say={say} />}
            />
            <div className="pa-dial-row mt-3 flex items-center justify-center gap-4">
              <PanelButton label="Tempo −" repeat onClick={() => arranger.changeTempo(-2)} />
              <div
                className="pa-dial"
                role="slider"
                tabIndex={0}
                aria-label="Tempo dial"
                aria-valuemin={40}
                aria-valuemax={240}
                aria-valuenow={arranger.tempo}
                onPointerDown={(event) => {
                  event.preventDefault(); // no text selection or native drag while turning
                  capture(event);
                  const box = event.currentTarget.getBoundingClientRect();
                  const x = box.left + box.width / 2;
                  const y = box.top + box.height / 2;
                  dial.current = { x, y, angle: Math.atan2(event.clientY - y, event.clientX - x), tempo: arranger.tempo };
                }}
                onPointerMove={(event) => {
                  // Turn like a real knob: the mark follows the finger round the centre, clockwise is faster.
                  const turn = dial.current;
                  if (!turn) return;
                  const angle = Math.atan2(event.clientY - turn.y, event.clientX - turn.x);
                  let step = ((angle - turn.angle) * 180) / Math.PI;
                  if (step > 180) step -= 360;
                  if (step < -180) step += 360;
                  turn.angle = angle;
                  turn.tempo = Math.min(240, Math.max(40, turn.tempo + step / 1.5));
                  const next = Math.round(turn.tempo);
                  if (next !== arranger.tempo) arranger.changeTempo(next - arranger.tempo);
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
                <span className="pa-dial-cap" style={{ transform: `rotate(${(Math.min(240, Math.max(40, arranger.tempo)) - 40) * 1.5}deg)` }}>
                  <span className="pa-dial-mark" />
                </span>
              </div>
              <PanelButton label="Tempo +" repeat onClick={() => arranger.changeTempo(2)} />
            </div>
          </div>

          {/* Style and Sound groups: either side of the screen on a desktop (grid areas), swipeable pages on a
              phone held upright. */}
          <div className="pa-pages">
            <div className="pa-group pa-group-style">
              <span className="pa-label">Style</span>
              <div className="grid grid-cols-4 gap-1.5">
                {styleCategories.map((name) => (
                  <PanelButton key={name} label={name} active={arranger.style.category === name} onClick={() => { arranger.selectStyleCategory(name); open('style', name); }} />
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

            <div className="pa-group pa-group-sound">
              <span className="pa-label">Sound</span>
              <div className="grid grid-cols-4 gap-1.5">
                {categories.map((name) => (
                  <PanelButton key={name} label={name} active={arranger.sound.category === name} onClick={() => { arranger.selectCategory(name); open('sound', name); }} />
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
        </div>

        <div className="pa-controls">
          <div className="pa-faders">
            <label className="pa-fader">
              <span className="pa-fader-label"><span className="pa-fader-master">Master </span>volume</span>
              <input type="range" min={0} max={1} step={0.01} value={arranger.volume} onChange={(event) => arranger.setVolume(Number(event.target.value))} />
              <span className="pa-fader-scale" aria-hidden="true"><span>Min</span><span>Max</span></span>
            </label>
            <label className="pa-fader">
              <span className="pa-fader-label">Balance</span>
              <input type="range" min={0} max={1} step={0.01} value={arranger.balance} onChange={(event) => arranger.setBalance(Number(event.target.value))} />
              <span className="pa-fader-scale" aria-hidden="true"><span>Keyboard</span><span>Style · Song</span></span>
            </label>
          </div>
          <div className="pa-ctl-groups">
            <div className="pa-ctl-group">
              <span className="pa-label">Keyboard</span>
              <div className="pa-ctl-row">
            <PanelButton label="Split" active={arranger.split} onClick={() => { arranger.toggleSplit(); say(arranger.split ? 'Split: left of middle C plays chords and strings' : 'Full keyboard: chords from three or more notes'); }} />
            <PanelButton label="Reverb" active={arranger.reverb} onClick={() => arranger.toggleReverb()} />
            <PanelButton label="Metro" active={arranger.metronome} onClick={() => { arranger.toggleMetronome(); open('metro'); }} />
              </div>
            </div>
            <div className="pa-ctl-group">
              <span className="pa-label">Player</span>
              <div className="pa-ctl-row">
            <PanelButton label="Song" active={Boolean(arranger.song) && !learn} onClick={() => open('song')} />
            <PanelButton
              label="Learn"
              className="pa-btn-learn"
              tone="green"
              active={Boolean(learn)}
              onClick={() => {
                if (arranger.learn) {
                  arranger.stopLearn();
                  say('Learn stopped.');
                } else open('learn');
              }}
            />
              </div>
            </div>
            <div className="pa-ctl-group">
              <span className="pa-label">Record</span>
              <div className="pa-ctl-row">
            <PanelButton label={recording ? '■ Rec' : '● Rec'} tone="red" active={recording} onClick={() => void toggleRecord()} />
            <PanelButton
              label="Takes"
              onClick={() => {
                void listTakes().then(setTakes);
                open('rec');
              }}
            />
              </div>
            </div>
            <div className="pa-ctl-group">
              <span className="pa-label">Connect</span>
              <div className="pa-ctl-row">
            <PanelButton label="MIDI" active={Boolean(midiDevices?.length)} onClick={() => void toggleMidi()} />
            <PanelButton label="PC keys" className="pa-btn-pckeys" active={showLetters} onClick={() => setShowLetters((value) => !value)} />
            <PanelButton label="Help" className="pa-btn-help" active={helpOpen} onClick={() => setHelpOpen(true)} />
              </div>
            </div>
          </div>
        </div>

        <div className={`pa-sheet ${showSheet ? 'pa-sheet-open' : ''}`}>
          <div className="pa-sheet-bar">
            <button type="button" className="pa-sheet-toggle" aria-expanded={showSheet} aria-controls="pa-sheet-body" onClick={() => setShowSheet((value) => !value)}>
              <span className="pa-sheet-chevron" aria-hidden="true">▸</span>
              Sheet music
              <span className="pa-sheet-hint">{songScore ? arranger.song?.title : take.current.notes.length ? `${take.current.notes.length} notes written` : 'writes what you play'}</span>
            </button>
            {!songScore && (
              <>
                <MeterPicker
                  value={`${standMeter.beats}/${standMeter.unit}`}
                  disabled={arranger.running}
                  onPick={(label) => arranger.setMeter(meters.findIndex((item) => item.label === label))}
                />
                <button
                  type="button"
                  className="pa-sheet-clear"
                  onClick={() => {
                    take.current = { origin: 0, last: 0, notes: [] };
                    refresh();
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>
          <div id="pa-sheet-body" className="pa-sheet-body">
            <div className="pa-sheet-inner">
              {showSheet && (
                <div ref={measureStand} className="pa-stand" aria-label="Music stand">
                  {standView}
                </div>
              )}
            </div>
          </div>
        </div>

        </div>

        <div className="pa-phonebar" role="toolbar" aria-label="Quick controls">
          <button type="button" className="pa-phone-btn" aria-label="Previous sound" onClick={() => arranger.selectSound((arranger.soundIndex + sounds.length - 1) % sounds.length)}>‹</button>
          <span className="pa-phone-sound">{arranger.sound.name}</span>
          <button type="button" className="pa-phone-btn" aria-label="Next sound" onClick={() => arranger.selectSound((arranger.soundIndex + 1) % sounds.length)}>›</button>
          <button type="button" className={`pa-phone-btn pa-phone-wide ${arranger.running ? 'pa-phone-on' : ''}`} onClick={() => arranger.toggleStyle()}>
            {arranger.running ? '■ Stop' : '▶ Style'}
          </button>
          <button
            type="button"
            aria-pressed={arranger.pedal}
            className={`pa-phone-btn pa-phone-wide ${arranger.pedal ? 'pa-phone-on' : ''}`}
            onPointerDown={(event) => {
              event.preventDefault();
              arranger.setPedal(!arranger.pedal);
            }}
            onClick={(event) => {
              if (event.detail === 0) arranger.setPedal(!arranger.pedal);
            }}
          >
            <span className="pa-phone-led" aria-hidden="true" />
            Sustain
          </button>
          <button type="button" className={`pa-phone-btn pa-phone-wide ${showSheet ? 'pa-phone-on' : ''}`} aria-pressed={showSheet} onClick={() => { setShowSheet((value) => !value); setDrawer(false); }}>
            ♪ Sheet
          </button>
          <button type="button" className="pa-phone-btn pa-phone-wide pa-phone-panel" aria-expanded={drawer} onClick={() => { setDrawer((value) => !value); setShowSheet(false); }}>{drawer ? '✕ Panel' : '☰ Panel'}</button>
          <button
            type="button"
            className={`pa-phone-btn pa-phone-wide ${learn ? 'pa-phone-on' : ''}`}
            aria-pressed={Boolean(learn)}
            onClick={() => {
              if (arranger.learn) {
                arranger.stopLearn();
                setShowSheet(false);
                say('Learn stopped.');
                return;
              }
              setDrawer(false);
              setShowSheet(false);
              open('learn');
            }}
          >
            {learn ? '■ Learn' : '♫ Learn'}
          </button>
          <span className="pa-rotate-hint">↻ Turn sideways for a bigger keyboard</span>
        </div>

        <div className="pa-felt" aria-hidden="true" />
        <div className="pa-mapbar">
          {foldButton}
          <div className={`pa-minimap ${edges.left || edges.right ? '' : 'pa-minimap-hidden'}`} onPointerDown={(event) => { capture(event); minimapTo(event); }} onPointerMove={(event) => { if (event.buttons) minimapTo(event); }} aria-hidden="true">
            <span ref={minimapWindow} className="pa-minimap-window" />
          </div>
          <label className="pa-zoom" title="How many white keys fit the screen">
            <span className="pa-zoom-label">Keys</span>
            <input
              type="range"
              min={7}
              max={whiteKeys.length}
              step={1}
              value={zoomKeys ?? shownKeys}
              aria-label="Number of white keys shown"
              onChange={(event) => setZoom(Number(event.currentTarget.value))}
            />
            <b className="pa-zoom-count">{zoomKeys ?? shownKeys}</b>
          </label>
        </div>
        <div className="pa-keyrow">
          <div className="pa-left">
            <div
              ref={joyBox}
              className="pa-joy"
              role="slider"
              aria-label="Pitch bend and modulation joystick"
              aria-valuemin={-2}
              aria-valuemax={2}
              aria-valuenow={0}
              onPointerDown={(event) => {
                event.preventDefault(); // no text selection or native drag (the browser's no-drop cursor)
                capture(event);
                moveJoy(event);
              }}
              onDragStart={(event) => event.preventDefault()}
              onPointerMove={moveJoy}
              onPointerUp={releaseJoy}
              onPointerCancel={releaseJoy}
              onLostPointerCapture={releaseJoy}
            >
              <span className="pa-joy-boot" aria-hidden="true" />
              <span ref={stick} className="pa-joy-stick" aria-hidden="true" />
              <span className="pa-joy-arrow pa-joy-arrow-left" aria-hidden="true">◀</span>
              <span className="pa-joy-arrow pa-joy-arrow-right" aria-hidden="true">▶</span>
              <span className="pa-joy-arrow pa-joy-arrow-up" aria-hidden="true">▲</span>
            </div>
            <span className="pa-left-label">PITCH ◀ ▶<br />MOD ▲</span>
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
          <div className="pa-keybed-wrap">
            <div className="pa-keybed" ref={scroller}>
              <Keys arranger={arranger} pressed={pressed} showLetters={showLetters} pcBase={pcBase} pointerDown={pointerDown} splitShown={arranger.running && arranger.split} targets={targets} />
            </div>
            {edges.left && <button type="button" className="pa-edge pa-edge-left" aria-label="Show lower keys" onClick={() => scrollKeys(-1)}>‹</button>}
            {edges.right && <button type="button" className="pa-edge pa-edge-right" aria-label="Show higher keys" onClick={() => scrollKeys(1)}>›</button>}
          </div>
        </div>
        {dual && (
        <div className="pa-keyrow2" role="group" aria-label="Upper keyboard">
          <div className="pa-keybed-wrap">
            <div className="pa-keybed" ref={scroller2}>
              <Keys arranger={arranger} pressed={pressed} showLetters={showLetters} pcBase={pcBase} pointerDown={pointerDown} splitShown={false} targets={targets} />
            </div>
            <button type="button" className="pa-edge pa-edge-left" aria-label="Upper keyboard: lower keys" onClick={() => scroller2.current?.scrollBy({ left: -octave(), behavior: 'smooth' })}>‹</button>
            <button type="button" className="pa-edge pa-edge-right" aria-label="Upper keyboard: higher keys" onClick={() => scroller2.current?.scrollBy({ left: octave(), behavior: 'smooth' })}>›</button>
          </div>
        </div>
        )}
      </div>

      {helpOpen &&
        createPortal(
          <div className="pa-help" role="dialog" aria-modal="true" aria-label="How to play" onClick={(event) => event.target === event.currentTarget && setHelpOpen(false)}>
            <div className="pa-help-card">
              <div className="pa-help-head">
                <b>How to play</b>
                <button type="button" className="pa-help-close" aria-label="Close help" onClick={() => setHelpOpen(false)}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4 L12 12 M12 4 L4 12" /></svg>
                </button>
              </div>
              <div className="pa-help-tips">
                <ul className="pa-howto-list">
                  <li><b>Play</b> Click or tap the keys. Strike lower on a key for a louder note. Slide a finger for a glissando; two fingers sideways move along the keyboard.</li>
                  <li><b>Choose</b> Tap the screen: the sound, style, song or tempo.</li>
                  <li><b>Accompany</b> Press Start. Your left hand, below middle C, picks the chord.</li>
                  <li><b>Express</b> Hold <kbd>Space</kbd> (or Sustain) for the pedal. Push the joystick sideways to bend, up for vibrato.</li>
                  <li><b>Learn</b> Pick a piece, a hand and a speed; play the green keys and the cat coaches you. Master it at 100% to open the bonus speeds.</li>
                  <li><b>Keys</b> The Keys slider sets how many keys fit the screen; the arrow beside the strip shows the keys alone.</li>
                </ul>
                <KeyMap />
              </div>
              <p className="pa-help-credits">
                Piano: Salamander Grand Piano, a Yamaha C5 recorded by Alexander Holm. Other instruments: FluidR3 GM soundfont. Both CC BY 3.0.
                Scores: Mutopia Project, public domain. Raga pieces written for this page. Drums and tabla are synthesised.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// Memoised: opening the curtain re-renders the stage, not the 61 keys, screen and score.
export default memo(PianoInstrument);
