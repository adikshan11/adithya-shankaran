import { Suspense, lazy, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { pianoStore } from '../piano/store';

// The instrument is its own download. It is fetched when the browser is idle after the page loads (or on hover),
// so opening the curtain rarely waits for the network.
const loadInstrument = () => import('./PianoInstrument');
const PianoInstrument = lazy(loadInstrument);

// A small grand piano whose lid lifts when the curtain is open and closes when it is shut.
function PianoIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 64 48" className={`pa-icon ${open ? 'pa-icon-open' : ''}`} aria-hidden="true">
      <path className="pa-icon-body" d="M6 30 C6 18 18 14 30 16 C44 18 46 26 58 26 L58 34 L6 34 Z" />
      <path className="pa-icon-lid" d="M6 29 L44 9" />
      <line className="pa-icon-prop" x1="30" y1="25" x2="34" y2="16" />
      <rect className="pa-icon-keys" x="8" y="34" width="48" height="6" rx="1" />
      {[14, 20, 26, 32, 38, 44, 50].map((x) => (
        <line key={x} className="pa-icon-key-line" x1={x} y1="34" x2={x} y2="40" />
      ))}
      <line className="pa-icon-leg" x1="12" y1="40" x2="12" y2="46" />
      <line className="pa-icon-leg" x1="52" y1="40" x2="52" y2="46" />
      <g className="pa-icon-notes">
        <text x="46" y="12">♪</text>
        <text x="54" y="18">♫</text>
      </g>
    </svg>
  );
}

export default function PianoRoom() {
  const open = useSyncExternalStore(pianoStore.subscribe, pianoStore.get, () => false);

  useEffect(() => {
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void) => number }).requestIdleCallback;
    const warm = () => void loadInstrument();
    if (idle) idle(warm);
    else setTimeout(warm, 2500);
  }, []);

  // The stage pops out over the page: the page behind stops scrolling, focus moves into the stage, Escape closes it,
  // and focus returns to the button that opened it.
  const trigger = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closer.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') pianoStore.set(false);
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', escape);
      (before ?? trigger.current)?.focus({ preventScroll: true });
    };
  }, [open]);

  // Part the curtain once the page is idle again, so the motion never shares a frame with heavy work. Stable, so the
  // instrument does not redraw when the curtain opens.
  const partCurtain = useCallback(() => {
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => document.querySelectorAll('.pa-tear, #piano-stage .pa-keys').forEach((element) => element.classList.add('pa-go'));
    if (idle) idle(go, { timeout: 400 });
    else setTimeout(go, 100);
  }, []);

  return (
    <section id="piano" aria-labelledby="piano-heading" className="py-8">
      <div className="card pa-card p-5">
        <span className="pa-seal pa-card-seal" aria-hidden="true">
          <span className="pa-seal-grade">8</span>
          <span className="pa-seal-word">GRADE</span>
        </span>
        <div className="pa-card-title">
          <h2 id="piano-heading" className="text-2xl font-bold tracking-tight">Off the clock</h2>
          <p className="mt-1 text-xs font-bold tracking-[0.14em] text-accent uppercase">Certificate</p>
        </div>
        <div className="pa-card-text">
          <p className="font-semibold text-ink">Grade 8 in Electronic Keyboard, Trinity Guildhall (Trinity College London)</p>
          <p className="mt-0.5 text-sm text-muted">Earned while learning piano as a child. Open the stage to play an arranger keyboard.</p>
        </div>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls="piano-stage"
          aria-label={open ? 'Close the piano stage' : 'Open the curtain'}
          title={open ? 'Close the piano stage' : 'Open the curtain'}
          onPointerEnter={() => void loadInstrument()}
          onFocus={() => void loadInstrument()}
          onClick={() => pianoStore.set(!open)}
          className="pa-handle pa-card-button"
        >
          <PianoIcon open={open} />
          <span className="pa-handle-text" aria-hidden="true">{open ? 'Close' : 'Play'}</span>
          <span className="pa-handle-wide" aria-hidden="true">{open ? 'Close the piano' : 'Play the piano'}</span>
        </button>
      </div>

      {open &&
        createPortal(
          <div className="pa-overlay" role="dialog" aria-modal="true" aria-label="Piano stage" onClick={(event) => event.target === event.currentTarget && pianoStore.set(false)}>
            <div className="pa-overlay-frame">
              <div className="pa-tear" aria-hidden="true">
                <span className="pa-tear-half pa-tear-left" />
                <span className="pa-tear-half pa-tear-right" />
                <span className="pa-tear-valance" />
                <span className="pa-tuning">
                  <span className="pa-tuning-dots"><span /><span /><span /></span>
                  Tuning the piano
                </span>
              </div>
              <button ref={closer} type="button" className="pa-overlay-close" aria-label="Close the curtain" onClick={() => pianoStore.set(false)}>
                <span aria-hidden="true">✕</span> Close <kbd>Esc</kbd>
              </button>
              <div id="piano-stage" className="pa-stage">
                <Suspense fallback={<div className="pa-stage-wait" />}>
                  <PianoInstrument onReady={partCurtain} />
                </Suspense>

              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
