import { useRef } from 'react';

const notes = [
  { name: 'C', hz: 261.63 },
  { name: 'D', hz: 293.66 },
  { name: 'E', hz: 329.63 },
  { name: 'F', hz: 349.23 },
  { name: 'G', hz: 392.0 },
  { name: 'A', hz: 440.0 },
  { name: 'B', hz: 493.88 },
  { name: 'C', hz: 523.25 },
];

export default function PianoKeys() {
  const audio = useRef<AudioContext | null>(null);

  function play(hz: number) {
    audio.current ??= new AudioContext();
    const context = audio.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = hz;
    gain.gain.setValueAtTime(0.18, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.2);
  }

  return (
    <span role="group" aria-label="Play a note" title="Play me" className="ml-2 inline-flex translate-y-1 overflow-hidden rounded-b-[4px] border border-zinc-400 align-baseline shadow-sm">
      {notes.map((note, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Play ${note.name}`}
          onClick={() => play(note.hz)}
          className="h-6 w-3.5 border-r border-zinc-300 bg-zinc-50 transition last:border-r-0 hover:bg-zinc-200 active:bg-accent"
        />
      ))}
    </span>
  );
}
