import { Suspense, lazy, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { primeAudio } from '../piano/audioPrime';
import type { CSSProperties } from 'react';

// Each curtain half is drawn as velvet strips: they slide different distances and bunch at the side like real
// fabric being drawn, using transform only (squashing one big layer with scaleX re-rasterised it every frame).
const STRIPS = 4;
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
    const warm = () => void loadInstrument().then((module) => module.prefetchGrand());
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
    // Lock the page on both html and body: iOS Safari still scrolls and bounces the page when only body is locked.
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Tint the browser's bars to the stage while it is open, and put the page's colour back after.
    const tint = document.querySelector('meta[name="theme-color"]');
    const pageTint = tint?.getAttribute('content');
    tint?.setAttribute('content', '#26282d');
    closer.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') pianoStore.set(false);
    };
    window.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      if (pageTint) tint?.setAttribute('content', pageTint);
      window.removeEventListener('keydown', escape);
      (before ?? trigger.current)?.focus({ preventScroll: true });
    };
  }, [open]);

  // Part the curtain once the page is idle again, so the motion never shares a frame with heavy work. Stable, so the
  // instrument does not redraw when the curtain opens.
  const partCurtain = useCallback(() => {
    const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => document.querySelectorAll('.pa-tear, #piano-stage .pa-keys').forEach((element) => element.classList.add('pa-go'));
    // Start only after the main thread has been quiet for three frames in a row (audio start-up can block it for over
    // a second on Windows), so the curtain never stalls mid-motion. Give up waiting after 2.5 s.
    const started = performance.now();
    let calm = 0;
    let last = started;
    const watch = (now: number) => {
      calm = now - last < 25 ? calm + 1 : 0;
      last = now;
      if (calm >= 3 || now - started > 2500) {
        if (idle) idle(go, { timeout: 200 });
        else go();
      } else requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }, []);

  return (
    <section id="piano" aria-labelledby="piano-heading" className="py-8">
      <div className="card pa-card p-5">
        <span className="pa-seal pa-card-seal" aria-hidden="true">
          <span className="pa-seal-grade">8</span>
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
          onClick={() => {
            if (!open) primeAudio(); // start phone audio inside this tap, so the piano can sound at once
            pianoStore.set(!open);
          }}
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
                {(['left', 'right'] as const).map((side) => (
                  <span key={side} className={`pa-drape pa-drape-${side}`}>
                    {Array.from({ length: STRIPS }, (_, index) => (
                      <span key={index} className={`pa-strip ${index === STRIPS - 1 ? 'pa-strip-edge' : ''}`} style={{ '--i': index } as CSSProperties} />
                    ))}
                  </span>
                ))}
                <span className="pa-tear-valance" />
                {/* While the piano loads: a tuner whose needle swings and settles on pitch (the green lamp lights), over
                    an octave of keys pressed one after another, as a tuner tests each note. */}
                <span className="pa-tuning">
                  <svg className="pa-tuner" viewBox="0 0 120 66" aria-hidden="true">
                    <path className="tu-arc" d="M16 58 A44 44 0 0 1 104 58" />
                    {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((angle) => (
                      <line key={angle} className={angle === 0 ? 'tu-tick tu-tick-mid' : 'tu-tick'} x1="60" y1="18" x2="60" y2={angle % 30 === 0 ? 25 : 22} transform={`rotate(${angle} 60 58)`} />
                    ))}
                    <text className="tu-flat" x="14" y="44">♭</text>
                    <text className="tu-sharp" x="100" y="44">♯</text>
                    <circle className="tu-lamp" cx="60" cy="9" r="3.2" />
                    <line className="tu-needle" x1="60" y1="58" x2="60" y2="20" />
                    <circle className="tu-hub" cx="60" cy="58" r="4" />
                  </svg>
                  <span className="pa-tuning-keys">
                    {Array.from({ length: 8 }, (_, index) => <span key={index} style={{ '--k': index } as CSSProperties} />)}
                    {[0, 1, 3, 4, 5].map((index) => <i key={index} style={{ '--b': index } as CSSProperties} />)}
                  </span>
                  Tuning the piano
                </span>
              </div>
              <button ref={closer} type="button" className="pa-overlay-close" aria-label="Close the curtain" onClick={() => pianoStore.set(false)}>
                {/* A drawn cross: the ✕ character renders thin and off-centre in some phone fonts. */}
                <svg className="pa-close-icon" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4 L12 12 M12 4 L4 12" />
                </svg>
                <span className="pa-close-label">Close</span> <kbd>Esc</kbd>
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
