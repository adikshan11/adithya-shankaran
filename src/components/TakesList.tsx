import { useEffect, useRef, useState } from 'react';
import type { Take } from '../piano/recorder';
import { deleteTake, download, toMidi, toWav } from '../piano/recorder';

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const fileName = (take: Take) => `Adithya piano ${new Date(take.created).toISOString().slice(0, 16).replace('T', ' ').replace(':', '-')}`;

// The Recordings page on the touch screen: play a take, save it as WAV or MIDI, or delete it.
export default function TakesList({ takes, ctx, onChange, say }: { takes: Take[]; ctx: () => BaseAudioContext | null; onChange: () => void; say: (text: string) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => player.current?.pause(), []);

  const play = (take: Take) => {
    player.current?.pause();
    if (playing === take.id) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(URL.createObjectURL(take.audio));
    audio.onended = () => setPlaying(null);
    player.current = audio;
    void audio.play();
    setPlaying(take.id);
  };

  const saveWav = async (take: Take) => {
    const context = ctx();
    if (!context) return;
    say('Preparing the WAV file…');
    try {
      download(await toWav(take.audio, context), `${fileName(take)}.wav`);
      say(`Saved ${take.name} as a WAV file: it plays on any phone or computer.`);
    } catch {
      download(take.audio, `${fileName(take)}.${take.mime.includes('mp4') ? 'm4a' : 'webm'}`);
      say(`Saved ${take.name} in the browser's own audio format.`);
    }
  };

  if (!takes.length) return <p className="pa-take-empty">No recordings yet. Press Rec, play, then press Rec again to stop.</p>;
  return (
    <>
      {takes.map((take) => (
        <div key={take.id} className={`pa-take ${playing === take.id ? 'pa-take-on' : ''}`}>
          <span className="pa-take-name">
            {take.name}
            <small>{clock(take.duration)} · {take.events.filter((event) => event.type === 'on').length} notes</small>
          </span>
          <button type="button" className="pa-take-btn" onClick={() => play(take)}>{playing === take.id ? '■' : '▶'}</button>
          <button type="button" className="pa-take-btn" onClick={() => void saveWav(take)}>WAV</button>
          <button type="button" className="pa-take-btn" disabled={!take.events.length} onClick={() => download(toMidi(take.events, take.name), `${fileName(take)}.mid`)}>MIDI</button>
          <button
            type="button"
            className="pa-take-btn"
            aria-label={`Delete ${take.name}`}
            onClick={() => {
              if (playing === take.id) player.current?.pause();
              void deleteTake(take.id).then(onChange);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </>
  );
}
