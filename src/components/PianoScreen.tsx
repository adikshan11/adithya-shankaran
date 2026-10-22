import { categories, sounds, styleCategories, styleMeter, styles } from '../piano/arranger';
import type { Arranger } from '../piano/arranger';
import { meters } from '../piano/notation';
import { songs } from '../piano/songs';

// The colour touchscreen. The main page shows the sound, style, song, tempo, time signature and the chord being
// played; tapping any of them opens its select page, as on a Korg Pa300.
export type Page = 'main' | 'sound' | 'style' | 'song' | 'metro';

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

export default function PianoScreen({ arranger, page, category, open, message, beat, meterRef }: Props) {
  const sound = arranger.sound;
  const style = arranger.style;
  const song = arranger.song;
  const meter = song && arranger.songScore ? `${arranger.songScore.meter.beats}/${arranger.songScore.meter.unit}` : arranger.running ? styleMeter(style) : arranger.meter.label;
  const beats = arranger.running ? arranger.beatsPerBar : arranger.meter.beats;
  const groupStarts = arranger.running ? [0] : arranger.meter.groups.reduce<number[]>((starts, size) => [...starts, (starts.at(-1) ?? 0) + size], [0]);

  const header = (
    <div className="pa-screen-bar">
      <button type="button" className="pa-touch" onClick={() => open('main')}>{song ? 'SONG PLAY' : 'STYLE PLAY'}</button>
      <button type="button" className="pa-touch" onClick={() => open('metro')}>♩ {arranger.tempo} · {meter}</button>
      <span>{song ? `${clock(arranger.songElapsed)} / ${clock(arranger.songLength)}` : `${arranger.measure}.${arranger.beat || 1}`}</span>
    </div>
  );

  return (
    <div className={`pa-screen ${beat ? 'pa-screen-beat' : ''}`}>
      {header}
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
              <span>Var<b>{arranger.variation}</b></span>
              <span>Trans<b>{signed(arranger.transpose)}</b></span>
              <span>Oct<b>{signed(arranger.octave)}</b></span>
              <span>Pedal<b>{arranger.pedal ? 'On' : 'Off'}</b></span>
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

      {(page === 'sound' || page === 'style') && (
        <div className="pa-screen-body">
          <div className="pa-tabs" role="tablist">
            {(page === 'sound' ? categories : styleCategories).map((name) => (
              <button key={name} type="button" role="tab" aria-selected={name === category} className={`pa-tab ${name === category ? 'pa-tab-on' : ''}`} onClick={() => open(page, name)}>
                {name}
              </button>
            ))}
          </div>
          <div className="pa-grid">
            {page === 'sound'
              ? sounds.map((item, index) =>
                  item.category !== category ? null : (
                    <button key={item.name} type="button" className={`pa-item ${arranger.soundIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectSound(index)}>
                      <span className="pa-item-number">P{String(index + 1).padStart(2, '0')}</span>
                      {item.name}
                    </button>
                  ),
                )
              : styles.map((item, index) =>
                  item.category !== category ? null : (
                    <button key={item.name} type="button" className={`pa-item ${arranger.styleIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.selectStyle(index)}>
                      <span className="pa-item-number">{styleMeter(item)} · ♩{item.tempo}</span>
                      {item.name}
                    </button>
                  ),
                )}
          </div>
          <button type="button" className="pa-exit" onClick={() => open('main')}>Exit</button>
        </div>
      )}

      {page === 'song' && (
        <div className="pa-screen-body">
          <p className="pa-page-title">Song Book</p>
          <div className="pa-grid pa-grid-songs">
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
                  <span className="pa-item-number">{playing ? '■ Stop' : '▶'} · {item.composer}</span>
                  {item.title}
                </button>
              );
            })}
          </div>
          <button type="button" className="pa-exit" onClick={() => open('main')}>Exit</button>
        </div>
      )}

      {page === 'metro' && (
        <div className="pa-screen-body">
          <p className="pa-page-title">Metronome · time signature</p>
          <div className="pa-grid pa-grid-meters">
            {meters.map((item, index) => (
              <button key={item.label} type="button" className={`pa-item pa-item-center ${arranger.meterIndex === index ? 'pa-item-on' : ''}`} onClick={() => arranger.setMeter(index)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="pa-metro-row">
            <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(-1)}>Tempo −</button>
            <span className="pa-big text-center">♩ {arranger.tempo}</span>
            <button type="button" className="pa-item pa-item-center" onClick={() => arranger.changeTempo(1)}>Tempo +</button>
            <button type="button" className={`pa-item pa-item-center ${arranger.metronome ? 'pa-item-on' : ''}`} onClick={() => arranger.toggleMetronome()}>
              {arranger.metronome ? 'Click on' : 'Click off'}
            </button>
          </div>
          <button type="button" className="pa-exit" onClick={() => open('main')}>Exit</button>
        </div>
      )}

      <div className="pa-meter" aria-hidden="true"><span ref={meterRef} /></div>
      <p className="pa-message" aria-live="polite">{arranger.loading || message}</p>
    </div>
  );
}
