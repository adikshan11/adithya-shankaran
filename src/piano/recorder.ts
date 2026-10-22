// Recorder: like the Record button on an arranger keyboard. It captures what you hear (keyboard, style and song,
// through the same output as the speakers) as audio, and what you play as notes, so a take can be saved both as a
// WAV file (plays on any phone or computer) and as a standard MIDI file (opens in any DAW). Takes are kept in this
// browser (IndexedDB) so they survive a reload; saving a file puts it on the device.

export type PlayedEvent = { t: number; type: 'on' | 'off' | 'pedal'; note?: number; velocity?: number; down?: boolean };
export type Take = { id: string; name: string; created: number; duration: number; audio: Blob; mime: string; events: PlayedEvent[] };

export class TakeRecorder {
  private media: MediaRecorder | null = null;
  private target: MediaStreamAudioDestinationNode | null = null;
  private source: AudioNode | null = null;
  private chunks: Blob[] = [];
  private events: PlayedEvent[] = [];
  private started = 0;

  static supported() {
    return typeof window !== 'undefined' && 'MediaRecorder' in window;
  }

  get recording() {
    return this.media?.state === 'recording';
  }

  get elapsed() {
    return this.recording ? (performance.now() - this.started) / 1000 : 0;
  }

  start(ctx: AudioContext, source: AudioNode) {
    this.target = ctx.createMediaStreamDestination();
    this.source = source;
    source.connect(this.target);
    const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find((type) => MediaRecorder.isTypeSupported(type));
    this.media = new MediaRecorder(this.target.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.events = [];
    this.media.ondataavailable = (event) => {
      if (event.data.size) this.chunks.push(event.data);
    };
    this.media.start(1000);
    this.started = performance.now();
  }

  // Notes and the pedal as played, in milliseconds from the start of the take.
  mark(event: Omit<PlayedEvent, 't'>) {
    if (this.recording) this.events.push({ ...event, t: performance.now() - this.started });
  }

  stop(name: string): Promise<Take | null> {
    const media = this.media;
    if (!media || media.state !== 'recording') return Promise.resolve(null);
    const duration = (performance.now() - this.started) / 1000;
    return new Promise((resolve) => {
      media.onstop = () => {
        if (this.source && this.target) this.source.disconnect(this.target);
        this.media = null;
        const mime = media.mimeType || this.chunks[0]?.type || 'audio/webm';
        const audio = new Blob(this.chunks, { type: mime });
        resolve({ id: `${Date.now()}`, name, created: Date.now(), duration, audio, mime, events: this.events });
      };
      media.stop();
    });
  }
}

// WAV (16-bit PCM): decoded from the recording, so every system plays it without a codec.
export async function toWav(audio: Blob, ctx: BaseAudioContext) {
  const buffer = await ctx.decodeAudioData(await audio.arrayBuffer());
  const channels = Math.min(2, buffer.numberOfChannels);
  const frames = buffer.length;
  const bytes = frames * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + bytes));
  const text = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + bytes, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, bytes, true);
  const data = Array.from({ length: channels }, (_, index) => buffer.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (const channel of data) {
      const sample = Math.max(-1, Math.min(1, channel[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view.buffer], { type: 'audio/wav' });
}

// Standard MIDI file, format 0: one track at 120 bpm and 480 ticks per beat, so 1 ms is 0.96 ticks.
export function toMidi(events: PlayedEvent[], name: string) {
  const PPQ = 480;
  const tick = (ms: number) => Math.round((ms * PPQ) / 500);
  const variable = (value: number) => {
    const out = [value & 0x7f];
    while ((value >>= 7)) out.unshift((value & 0x7f) | 0x80);
    return out;
  };
  const title = [...new TextEncoder().encode(name)];
  const body: number[] = [0x00, 0xff, 0x03, ...variable(title.length), ...title, 0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, 0x00, 0xc0, 0x00];
  let last = 0;
  for (const event of [...events].sort((a, b) => a.t - b.t)) {
    const at = tick(event.t);
    body.push(...variable(Math.max(0, at - last)));
    last = Math.max(last, at);
    const note = Math.max(0, Math.min(127, event.note ?? 60));
    if (event.type === 'on') body.push(0x90, note, Math.max(1, Math.min(127, Math.round((event.velocity ?? 0.8) * 127))));
    else if (event.type === 'off') body.push(0x80, note, 0x40);
    else body.push(0xb0, 64, event.down ? 127 : 0);
  }
  body.push(0x00, 0xff, 0x2f, 0x00);
  const length = body.length;
  const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, PPQ >> 8, PPQ & 0xff];
  const track = [0x4d, 0x54, 0x72, 0x6b, (length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff];
  return new Blob([new Uint8Array([...header, ...track, ...body])], { type: 'audio/midi' });
}

export function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Saved takes, in this browser's IndexedDB. If storage is blocked (private mode), takes live until the page closes.
const memory: Take[] = [];
function database(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('piano-takes', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('takes', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await database();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = work(db.transaction('takes', mode).objectStore('takes'));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}
export async function listTakes(): Promise<Take[]> {
  const stored = await run<Take[]>('readonly', (store) => store.getAll() as IDBRequest<Take[]>);
  return (stored ?? memory).slice().sort((a, b) => b.created - a.created);
}
export async function saveTake(take: Take) {
  if ((await run('readwrite', (store) => store.put(take))) === null) memory.push(take);
}
export async function deleteTake(id: string) {
  if ((await run('readwrite', (store) => store.delete(id))) === null) memory.splice(memory.findIndex((take) => take.id === id), 1);
}
