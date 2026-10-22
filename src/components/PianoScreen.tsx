import type { ReactNode } from 'react';
import { categories, sounds, styleCategories, styleMeter, styles } from '../piano/arranger';
import type { Arranger } from '../piano/arranger';
import { meters } from '../piano/notation';
import { songs } from '../piano/songs';

// The colour touchscreen. The main page shows the sound, style, song, tempo, time signature, settings and the chord
// being played; tapping any of them opens its page, as on a Korg Pa300.
export type Page = 'main' | 'sound' | 'style' | 'song' | 'metro' | 'tune';

type Props = {
  arranger: Arranger;
  page: Page;
  category: string;
  open: (page: Page, category?: string) => void;
  message: string;
  beat: boolean;
  meterRef: (element: HTMLSpanElement | null) => void;
};

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// A select page: a header row (tabs or a title on the left, Exit on the right), then a scrolling list.
function SelectPage({ head, onExit, children, className = '' }: { head: ReactNode; onExit: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="pa-screen-body">
      <div className="pa-page-head">
        <div className="pa-page-head-main">{head}</div>
        <button type="button" className="pa-exit" onClick={onExit}>Exit</button>
      </div>
      <div className={`pa-grid ${className}`}>{children}</div>
    </div>
  );
}

export default function PianoScreen({ arranger, page, category, open, message, beat, meterRef }: Props) {
  const sound = arranger.sound;
  const style = arranger.style;
  const song = arranger.song;
  const meter = song && arranger.songScore ? `${arranger.songScore.meter.beats}/${arranger.songScore.meter.unit}` : arranger.running ? styleMeter(style) : arranger.meter.label;
  const beats = arranger.running ? arranger.beatsPerBar : arranger.meter.beats;
  const groupStarts = arranger.running ? [0] : arranger.meter.groups.reduce<number[]>((starts, size) => [...starts, (starts.at(-1) ?? 0) + size], [0]);
  const exit = () => open('main');

  const tabs = (names: string[]) => (
    <div className="pa-tabs" role="tablist">
      {names.map((name) => (
        <button key={name} type="button" role="tab" aria-selected={name === category} className={`pa-tab ${name === category ? 'pa-tab-on' : ''}`} onClick={() => open(page, name)}>
          {name}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`pa-screen ${beat ? 'pa-screen-beat' : ''}`}>
      <div className="pa-screen-bar">
        <button type="button" className="pa-touch" onClick={exit}>{song ? 'SONG PLAY' : 'STYLE PLAY'}</button>
        <button type="button" className="pa-touch" onClick={() => open('metro')}>♩ {arranger.tempo} · {meter}</button>
        <span>{song ? `${clock(arranger.songElapsed)} / ${clock(arranger.songLength)}` : `${arranger.measure}.${arranger.beat || 1}`}</span>
      </div>

      {page === 'main' && (
        <div className="pa-screen-body pa-main">
          <div className="pa-main-left">
            <button type="button" className="pa-row pa-touch" onClick={() => open('sound', sound.category)}>
              <span className="pa-chip">UPPER</span>
              <span className="pa-big">{sound.name}</span>
              <span className="pa-dim">{sound.category}</span>
            </button>
            <button type="button" className="pa-row pa-touch" onClick={() => open('style', style.category)}>
              <span className="pa-chip pa-chip-alt">STYLE</span>
              <span className="flex-1 truncate">{style.name}</span>
              <span className={arranger.running ? 'pa-play' : 'pa-dim'}>{arranger.running ? '▶ PLAY' : '■ STOP'}</span>
            </button>
            <button type="button" className="pa-row pa-touch" onClick={() => open('song')}>
              <span className="pa-chip pa-chip-song">SONG</span>
              <span className="flex-1 truncate">{song ? song.title : 'Tap to choose a song'}</span>
              {song && <span className="pa-play">▶</span>}
            </button>
            {song && (
              <div className="pa-progress">
                <span style={{ width: `${arranger.songLength ? (100 * arranger.songElapsed) / arranger.songLength : 0}%` }} />
              </div>
            )}
            <div className="pa-cells">
              <button type="button" className="pa-cell" aria-label={`Variation ${arranger.variation}, tap for the next`} onClick={() => arranger.setVariation((arranger.variation % 4) + 1)}>
                Var<b>{arranger.variation}</b>
              </button>
              <button type="button" className="pa-cell" aria-label={`Transpose ${signed(arranger.transpose)}, tap to change`} onClick={() => open('tune')}>
                Trans<b>{signed(arranger.transpose)}</b>
              </button>
              <button type="button" className="pa-cell" aria-label={`Octave ${signed(arranger.octave)}, tap to change`} onClick={() => open('tune')}>
                Oct<b>{signed(arranger.octave)}</b>
              </button>
              <button type="button" className={`pa-cell ${arranger.pedal ? 'pa-cell-on' : ''}`} aria-label={`Sustain pedal ${arranger.pedal ? 'on' : 'off'}, tap to switch`} onClick={() => arranger.setPedal(!arranger.pedal)}>
                Pedal<b>{arranger.pedal ? 'On' : 'Off'}</b>
              </button>
            </div>
          </div>
          <div className="pa-chord" aria-label="Chord">
            <span className="pa-chord-label">CHORD</span>
            <span className="pa-chord-name">{arranger.displayChord || '–'}</span>
            <div className="pa-beats" aria-hidden="true">
              {Array.from({ length: beats }, (_, index) => (
                <span key={index} className={`${arranger.beat === index + 1 ? 'pa-beat-on' : ''} ${groupStarts.includes(index) ? 'pa-beat-accent' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {page === 'sound' && (
        <SelectPage head={tabs(categories)} onExit={exit}>
          {sounds.map((item, index) =>
            item.category !== category ? null : (
              <button key={item.name} type="button" className={`pa-item ${arranger.soundIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectSound(index)}>
                <span className="pa-item-number">P{String(index + 1).padStart(2, '0')}</span>
                {item.name}
              </button>
            ),
          )}
        </SelectPage>
      )}

      {page === 'style' && (
        <SelectPage head={tabs(styleCategories)} onExit={exit}>
          {styles.map((item, index) =>
            item.category !== category ? null : (
              <button key={item.name} type="button" className={`pa-item ${arranger.styleIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectStyle(index)}>
                <span className="pa-item-number">{styleMeter(item)} · ♩{item.tempo}</span>
                {item.name}
              </button>
            ),
          )}
        </SelectPage>
      )}

      {page === 'song' && (
        <SelectPage head={<p className="pa-page-title">Song Book</p>} onExit={exit}>
          {songs.map((item) => {
            const playing = song?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`pa-item ${playing ? 'pa-item-on' : ''}`}
                onClick={() => {
                  if (playing) arranger.stopSong();
                  else void arranger.playSong(item);
                }}
              >
                <span className="pa-item-number">{playing ? '■ Stop' : '▶ Play'} · {item.composer}</span>
                {item.title}
              </button>
            );
          })}
        </SelectPage>
      )}

      {page === 'metro' && (
        <SelectPage head={<p className="pa-page-title">Metronome · time signature</p>} onExit={exit} className="pa-grid-meters">
          {meters.map((item, index) => (
            <button key={item.label} type="button" className={`pa-item pa-item-center ${arranger.meterIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.setMeter(index)}>
              {item.label}
            </button>
          ))}
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(-1)}>Tempo −</button>
          <span className="pa-item pa-item-center pa-item-static">♩ {arranger.tempo}</span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(1)}>Tempo +</button>
          <button type="button" className={`pa-item pa-item-center pa-item-wide ${arranger.metronome ? 'pa-item-on' : ''}`} onClick={() => arranger.toggleMetronome()}>
            {arranger.metronome ? 'Click on' : 'Click off'}
          </button>
        </SelectPage>
      )}

      {page === 'tune' && (
        <SelectPage head={<p className="pa-page-title">Transpose and octave</p>} onExit={exit} className="pa-grid-tune">
          <span className="pa-item pa-item-center pa-item-static">Transpose <b>{signed(arranger.transpose)}</b></span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(-1)}>−1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(1)}>+1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTranspose(-arranger.transpose)}>Reset</button>
          <span className="pa-item pa-item-center pa-item-static">Octave <b>{signed(arranger.octave)}</b></span>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(-1)}>−1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(1)}>+1</button>
          <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeOctave(-arranger.octave)}>Reset</button>
        </SelectPage>
      )}

      <div className="pa-meter" aria-hidden="true"><span ref={meterRef} /></div>
      <p key={arranger.loading ? 'loading' : message} className={`pa-message ${arranger.loading ? '' : 'pa-message-type'}`} aria-live="polite">
        {arranger.loading || message}
      </p>
    </div>
  );
}
