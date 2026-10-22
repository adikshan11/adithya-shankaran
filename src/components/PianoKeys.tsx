import { useSyncExternalStore } from 'react';
import { pianoStore } from '../piano/store';

// The "piano" word in the intro: opens the piano stage.
export default function PianoKeys() {
  const open = useSyncExternalStore(pianoStore.subscribe, pianoStore.get, () => false);
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="piano"
      onClick={() => {
        pianoStore.set(true);
      }}
      className="underline decoration-accent/60 decoration-dotted underline-offset-4 transition hover:text-accent"
    >
      piano
    </button>
  );
}
