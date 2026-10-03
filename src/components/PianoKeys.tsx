import { useEffect, useRef, useState } from 'react';

const whiteKeys = [
  { name: 'C', hz: 261.63 },
  { name: 'D', hz: 293.66 },
  { name: 'E', hz: 329.63 },
  { name: 'F', hz: 349.23 },
  { name: 'G', hz: 392.0 },
  { name: 'A', hz: 440.0 },
  { name: 'B', hz: 493.88 },
  { name: 'C', hz: 523.25 },
];

const blackKeys = [
  { name: 'C sharp', hz: 277.18, after: 0 },
  { name: 'D sharp', hz: 311.13, after: 1 },
  { name: 'F sharp', hz: 369.99, after: 3 },
  { name: 'G sharp', hz: 415.3, after: 4 },
  { name: 'A sharp', hz: 466.16, after: 5 },
];

export default function PianoKeys() {
  const [open, setOpen] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', close);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', close);
    };
  }, [open]);

  function play(hz: number) {
    audio.current ??= new AudioContext();
    const context = audio.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = hz;
    gain.gain.setValueAtTime(0.2, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.4);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.4);
  }

  return (
    <span ref={wrapper}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent"
      >
        piano
      </button>
      {open && (
        <span role="dialog" aria-label="Piano" className="card absolute bottom-full left-0 z-40 mb-2 block w-64 p-4 shadow-xl">
          <span className="block text-sm font-semibold text-ink">Grade 8, Electronic Keyboard</span>
          <span className="block font-mono text-xs text-muted">Trinity College London</span>
          <span className="relative mt-3 flex h-20">
            {whiteKeys.map((key, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Play ${key.name}`}
                onClick={() => play(key.hz)}
                className="h-full flex-1 rounded-b-md border border-zinc-300 bg-white transition active:bg-zinc-200 not-first:-ml-px"
              />
            ))}
            {blackKeys.map((key) => (
              <button
                key={key.name}
                type="button"
                aria-label={`Play ${key.name}`}
                onClick={() => play(key.hz)}
                style={{ left: `calc(${((key.after + 1) / 8) * 100}% - 0.4rem)` }}
                className="absolute top-0 h-12 w-[0.8rem] rounded-b-sm bg-zinc-900 transition active:bg-zinc-600"
              />
            ))}
          </span>
          <span className="mt-2 block text-center text-xs text-muted">Tap a key</span>
        </span>
      )}
    </span>
  );
}
