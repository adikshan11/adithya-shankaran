import { useEffect, useRef, useState } from 'react';
import type { Take } from '../piano/recorder';
import { deleteTake, download, saveTake, toMidi, toWav } from '../piano/recorder';

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
// Files carry the take's name (as renamed) and its date, with characters no file system accepts removed.
const fileName = (take: Take) => `${take.name.replace(/[\\/:*?"<>|]/g, '').trim() || 'Take'} ${new Date(take.created).toISOString().slice(0, 10)}`;

// The Recordings page on the touch screen: play a take, save it as WAV or MIDI, or delete it.
export default function TakesList({ takes, ctx, onChange, say }: { takes: Take[]; ctx: () => BaseAudioContext | null; onChange: () => void; say: (text: string) => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const rename = (take: Take, name: string) => {
    setEditing(null);
    const clean = name.trim().slice(0, 60);
    if (!clean || clean === take.name) return;
    void saveTake({ ...take, name: clean }).then(onChange);
  };
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
      await download(await toWav(take.audio, context), `${fileName(take)}.wav`);
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
            {editing === take.id ? (
              <input
                className="pa-take-input"
                defaultValue={take.name}
                aria-label="Name of this recording"
                autoFocus
                maxLength={60}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => rename(take, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') rename(take, event.currentTarget.value);
                  if (event.key === 'Escape') setEditing(null);
                }}
              />
            ) : (
              <button type="button" className="pa-take-title" title="Tap to rename" onClick={() => setEditing(take.id)}>
                {take.name} <span aria-hidden="true">✎</span>
              </button>
            )}
            <small>{clock(take.duration)} · {take.events.filter((event) => event.type === 'on').length} notes</small>
          </span>
          <button type="button" className="pa-take-btn" onClick={() => play(take)}>{playing === take.id ? '■' : '▶'}</button>
          <button type="button" className="pa-take-btn" onClick={() => void saveWav(take)}>WAV</button>
          <button type="button" className="pa-take-btn" disabled={!take.events.length} onClick={() => void download(toMidi(take.events, take.name), `${fileName(take)}.mid`)}>MIDI</button>
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
