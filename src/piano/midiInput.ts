// A real keyboard over USB or Bluetooth MIDI plays this piano (Web MIDI: Chrome, Edge, Opera and Firefox on
// computers and Android; Safari and iPhone do not have it). Notes keep their velocity; the sustain pedal (CC 64),
// pitch bend and the modulation wheel (CC 1) drive the same controls as the joystick and Sustain button.
import type { Arranger } from './arranger';

export const midiSupported = () => typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

export async function connectMidi(arranger: Arranger, onDevices: (names: string[]) => void) {
  const access = await navigator.requestMIDIAccess({ sysex: false });
  const listen = (event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 2) return;
    const kind = data[0] & 0xf0;
    const [, first, second = 0] = data;
    if (kind === 0x90 && second > 0) arranger.noteOn(first, second / 127);
    else if (kind === 0x80 || (kind === 0x90 && second === 0)) arranger.noteOff(first);
    else if (kind === 0xb0 && first === 64) arranger.setPedal(second >= 64);
    else if (kind === 0xb0 && first === 1) arranger.setModulation(second / 127);
    else if (kind === 0xe0) arranger.setBend((((second << 7) | first) - 8192) / 4096);
  };
  const attach = () => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      input.onmidimessage = listen;
      if (input.state === 'connected') names.push(input.name ?? 'MIDI keyboard');
    });
    onDevices(names);
  };
  attach();
  access.onstatechange = attach; // plugged in or out while the page is open
  return () => {
    access.onstatechange = null;
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
  };
}
