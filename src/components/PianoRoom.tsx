import { Suspense, lazy, useSyncExternalStore } from 'react';
import { pianoStore } from '../piano/store';

// The instrument is its own download, fetched only when the curtain opens (or warmed on hover), so the page stays light.
const loadInstrument = () => import('./PianoInstrument');
const PianoInstrument = lazy(loadInstrument);

export default function PianoRoom() {
  const open = useSyncExternalStore(pianoStore.subscribe, pianoStore.get, () => false);

  return (
    <section id="piano" aria-labelledby="piano-heading" className="py-8">
      <div className="card flex flex-wrap items-center justify-between gap-5 p-5">
        <div className="flex items-center gap-4">
          <span className="pa-seal" aria-hidden="true">
            <span>8</span>
          </span>
          <div>
            <h2 id="piano-heading" className="text-2xl font-bold tracking-tight">Off the clock</h2>
            <p className="mt-0.5 font-semibold text-ink">Grade 8 Electronic Keyboard, Trinity College London</p>
            <p className="mt-0.5 text-sm text-muted">Behind the curtain: a playable arranger keyboard with a recorded concert grand.</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="piano-stage"
          onPointerEnter={() => void loadInstrument()}
          onFocus={() => void loadInstrument()}
          onClick={() => pianoStore.set(!open)}
          className="pa-handle"
        >
          {open ? 'Close the curtain' : 'Open the curtain ✦'}
        </button>
      </div>

      {open && (
        <div id="piano-stage" className="pa-stage mt-5">
          <Suspense fallback={<div className="pa-stage-wait">Setting the stage…</div>}>
            <PianoInstrument />
          </Suspense>
          <div className="pa-curtains" aria-hidden="true">
            <span className="pa-curtain pa-curtain-left" />
            <span className="pa-curtain pa-curtain-right" />
            <span className="pa-valance" />
          </div>
        </div>
      )}
    </section>
  );
}
