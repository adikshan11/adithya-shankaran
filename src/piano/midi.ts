// Reads a Standard MIDI File into timed notes (seconds, following its tempo changes), with each note's position in
// semiquavers for the sheet music, and the score's time signature.
export type Note = { time: number; duration: number; midi: number; velocity: number; start16?: number; length16?: number };
export type Score = { notes: Note[]; meter: { beats: number; unit: number } };

export function parseMidi(buffer: ArrayBuffer): Note[] {
  return parseScore(buffer).notes;
}

export function parseScore(buffer: ArrayBuffer): Score {
  const data = new DataView(buffer);
  let at = 0;
  const text = (length: number) => String.fromCharCode(...new Uint8Array(buffer, (at += length) - length, length));
  const u32 = () => ((at += 4), data.getUint32(at - 4));
  const u16 = () => ((at += 2), data.getUint16(at - 2));
  const byte = () => data.getUint8(at++);
  const varLength = () => {
    let value = 0;
    let next = 0;
    do {
      next = byte();
      value = (value << 7) | (next & 0x7f);
    } while (next & 0x80);
    return value;
  };

  if (text(4) !== 'MThd') throw new Error('Not a MIDI file');
  const headerEnd = u32() + at;
  u16();
  const tracks = u16();
  const division = u16();
  at = headerEnd;

  const tempos: { tick: number; perQuarter: number }[] = [{ tick: 0, perQuarter: 500000 }];
  let meter = { beats: 4, unit: 4 };
  const events: { tick: number; midi: number; velocity: number }[] = [];
  for (let track = 0; track < tracks && at < buffer.byteLength; track++) {
    const id = text(4);
    const end = u32() + at;
    if (id !== 'MTrk') {
      at = end;
      continue;
    }
    let tick = 0;
    let status = 0;
    while (at < end) {
      tick += varLength();
      if (data.getUint8(at) & 0x80) status = byte();
      const type = status >> 4;
      if (type === 0x8 || type === 0x9) {
        const midi = byte();
        const velocity = byte();
        events.push({ tick, midi, velocity: type === 0x9 ? velocity : 0 });
      } else if (type === 0xa || type === 0xb || type === 0xe) at += 2;
      else if (type === 0xc || type === 0xd) at += 1;
      else if (status === 0xff) {
        const meta = byte();
        const length = varLength();
        if (meta === 0x51) tempos.push({ tick, perQuarter: (data.getUint8(at) << 16) | (data.getUint8(at + 1) << 8) | data.getUint8(at + 2) });
        if (meta === 0x58 && tick === 0) meter = { beats: data.getUint8(at), unit: 2 ** data.getUint8(at + 1) };
        at += length;
      } else if (status === 0xf0 || status === 0xf7) at += varLength();
      else break;
    }
    at = end;
  }

  tempos.sort((a, b) => a.tick - b.tick);
  const seconds = (tick: number) => {
    let time = 0;
    for (let i = 0; i < tempos.length; i++) {
      const start = tempos[i].tick;
      if (tick <= start) break;
      const stop = i + 1 < tempos.length ? Math.min(tick, tempos[i + 1].tick) : tick;
      time += ((stop - start) / division) * (tempos[i].perQuarter / 1e6);
    }
    return time;
  };

  events.sort((a, b) => a.tick - b.tick || a.velocity - b.velocity);
  const open = new Map<number, { tick: number; velocity: number }[]>();
  const notes: Note[] = [];
  for (const event of events) {
    const stack = open.get(event.midi) ?? [];
    if (event.velocity > 0) {
      stack.push({ tick: event.tick, velocity: event.velocity });
      open.set(event.midi, stack);
    } else {
      const start = stack.shift();
      if (!start) continue;
      const time = seconds(start.tick);
      const sixteenth = division / 4;
      notes.push({
        time,
        duration: Math.max(0.05, seconds(event.tick) - time),
        midi: event.midi,
        velocity: start.velocity / 127,
        start16: Math.round(start.tick / sixteenth),
        length16: Math.max(1, Math.round((event.tick - start.tick) / sixteenth)),
      });
    }
  }
  return { notes: notes.sort((a, b) => a.time - b.time), meter };
}
