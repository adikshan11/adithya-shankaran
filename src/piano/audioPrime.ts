// Phones (Safari above all) only let a page start sound from a completed tap (finger up) or a click, and iOS mutes
// web audio with the ring/silent switch unless the page asks to be treated as media playback. This tiny module
// (kept out of the piano's own code so the page can load it at once) starts the audio on the tap that opens the
// piano, and can unlock it again on any later tap.

type Session = { audioSession?: { type: string } };

// Ask iOS (17 and later) to play like a music app: audible with the silent switch on. Elsewhere it does nothing.
export function preferPlayback() {
  try {
    const session = (navigator as Navigator & Session).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch {
    // not supported
  }
}

// Resume a context and play one silent sample, inside the tap that called it: that is what unlocks iOS audio.
export function unlock(ctx: AudioContext) {
  preferPlayback();
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  try {
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start();
  } catch {
    // closed context
  }
}

let primed: AudioContext | null = null;

// Called from the tap that opens the piano, on touch screens: create the audio there, so it is already allowed to
// play when the instrument loads a moment later. (On a desktop the click needs no help, and creating the context
// can take a second on Windows, so it is left to the instrument.)
export function primeAudio() {
  if (primed || typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches) return;
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  try {
    primed = new Context({ latencyHint: 'interactive' });
    unlock(primed);
  } catch {
    primed = null;
  }
}

// Warm the audio before the click, on a computer: the first audio context in a browser session starts the browser's
// audio service, which blocks the page for about a second (measured 970 ms, then about 100 ms for any later one).
// Done when the pointer reaches (or focus lands on) the Play button, that second passes before the curtain moves.
// The context starts suspended (no sound) and the instrument takes it over; the first tap or key resumes it.
export function warmAudio() {
  if (primed || typeof window === 'undefined') return;
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  try {
    primed = new Context({ latencyHint: 'interactive' });
  } catch {
    primed = null;
  }
}

// The instrument takes the primed context once, if there is one.
export function takePrimed() {
  const ctx = primed;
  primed = null;
  return ctx && ctx.state !== 'closed' ? ctx : null;
}
