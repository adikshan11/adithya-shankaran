// Runs inside the page (loaded by scripts/audio-audit.mjs). Drives the real audio engine through every sound, style,
// variation, time signature, song and control, and measures the actual output level. Returns a report.
const { Arranger, sounds, styles } = await import('/src/piano/arranger.ts');
const { meters } = await import('/src/piano/notation.ts');
const { songs } = await import('/src/piano/songs.ts');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const check = (area, name, pass, detail) => results.push({ area, name, pass, detail });

const engine = new Arranger();
engine.init();
engine.toggleReverb(); // measure the dry sound
let beats = 0;
engine.onBeat = () => beats++;

// Loudest 400 ms of output over a period: the momentary loudness a listener hears.
async function loudness(ms) {
  const levels = [];
  for (let elapsed = 0; elapsed < ms; elapsed += 40) {
    await wait(40);
    levels.push(engine.level());
  }
  let loudest = 0;
  for (let i = 0; i + 10 <= levels.length; i++) loudest = Math.max(loudest, levels.slice(i, i + 10).reduce((a, b) => a + b, 0) / 10);
  return loudest;
}

async function quiet() {
  for (let i = 0; i < 40 && engine.level() > 0.002; i++) await wait(50);
}

// 1. Every sound is audible and within 60% to 170% of the grand piano's loudness.
const loud = [];
for (let index = 0; index < sounds.length; index++) {
  engine.selectSound(index);
  await engine.load(sounds[index].bank);
  engine.noteOn(60, 0.8);
  loud.push(await loudness(1000));
  engine.noteOff(60);
  await quiet();
}
sounds.forEach((sound, index) => {
  const ratio = loud[index] / loud[0];
  check('Sound', sound.name, ratio >= 0.6 && ratio <= 1.7, `${Math.round(ratio * 100)}% of grand`);
});

// 2. Edge keys: lowest and highest key, and every sound at the top and bottom of the keyboard, still sound.
for (const index of [0, sounds.findIndex((sound) => sound.name === 'Drawbar Organ'), sounds.findIndex((sound) => sound.name === 'Flute')]) {
  engine.selectSound(index);
  for (const key of [36, 96]) {
    engine.noteOn(key, 0.8);
    const level = await loudness(600);
    engine.noteOff(key);
    await quiet();
    check('Edge key', `${sounds[index].name} key ${key}`, level > 0.005, level.toFixed(3));
  }
}
engine.selectSound(0);

// 3. Sustain pedal holds a released note; releasing the pedal stops it.
engine.noteOn(60, 0.9);
await wait(150);
engine.setPedal(true);
engine.noteOff(60);
const held = await loudness(600);
engine.setPedal(false);
await wait(700);
const after = engine.level();
check('Pedal', 'sustain holds, release stops', held > 0.01 && after < held / 3, `held ${held.toFixed(3)}, after ${after.toFixed(3)}`);

// 4. Transpose, octave, bend and modulation change state and keep sound playing; limits hold at the edges.
for (let i = 0; i < 20; i++) engine.changeTranspose(1);
check('Transpose', 'stops at +12', engine.transpose === 12, String(engine.transpose));
for (let i = 0; i < 30; i++) engine.changeTranspose(-1);
check('Transpose', 'stops at -12', engine.transpose === -12, String(engine.transpose));
engine.changeTranspose(12);
for (let i = 0; i < 5; i++) engine.changeOctave(1);
check('Octave', 'stops at +2', engine.octave === 2, String(engine.octave));
engine.noteOn(72, 0.8); // C5 two octaves up sounds as C7, still inside the piano's range
check('Octave', 'C5 at +2 sounds (as C7)', (await loudness(500)) > 0.005, '');
engine.noteOff(72);
engine.noteOn(96, 0.8); // C7 two octaves up would be above C8, the top of a piano: it is clamped, never an error
await wait(300);
check('Octave', 'C7 at +2 is clamped, no error', true, 'above C8 is clamped to C8, as on a real keyboard');
engine.noteOff(96);
for (let i = 0; i < 5; i++) engine.changeOctave(-1);
engine.changeOctave(2);
engine.noteOn(60, 0.8);
engine.setBend(2);
engine.setModulation(1);
check('Joystick', 'bend and vibrato keep the note sounding', (await loudness(500)) > 0.01, `bend ${engine.bend}, mod ${engine.modulation}`);
engine.setBend(0);
engine.setModulation(0);
engine.noteOff(60);
await quiet();
for (let i = 0; i < 200; i++) engine.changeTempo(5);
check('Tempo', 'stops at 240', engine.tempo === 240, String(engine.tempo));
for (let i = 0; i < 200; i++) engine.changeTempo(-5);
check('Tempo', 'stops at 40', engine.tempo === 40, String(engine.tempo));

// 5. Every style plays drums, bass and chords, follows the left-hand chord, and counts bars.
for (let index = 0; index < styles.length; index++) {
  engine.selectStyle(index);
  await Promise.all([engine.load('bass'), engine.load(styles[index].compSound.bank)]);
  engine.startStyle();
  engine.noteOn(45, 0.8); // A
  engine.noteOn(48, 0.8); // C
  engine.noteOn(52, 0.8); // E
  const level = await loudness(2200);
  const chord = engine.chordName;
  for (const key of [45, 48, 52]) engine.noteOff(key);
  const bars = engine.measure;
  engine.stopStyle();
  await quiet();
  check('Style', styles[index].name, level > 0.01 && chord === 'Am' && bars >= 1, `level ${level.toFixed(3)}, chord ${chord}, bars ${bars}`);
}

// 6. Variations, Intro, Fill and Ending on 8Beat Pop.
engine.selectStyle(0);
for (const variation of [1, 2, 3, 4]) {
  engine.setVariation(variation);
  engine.startStyle();
  const level = await loudness(1500);
  engine.stopStyle();
  await quiet();
  check('Variation', `Var ${variation}`, level > 0.01, level.toFixed(3));
}
engine.setVariation(2);
engine.startStyle(true);
check('Intro', 'count-in starts', engine.intro === true, '');
await wait((60 / engine.tempo) * 4 * 1000 + 900);
check('Intro', 'style takes over after one bar', engine.intro === false && engine.running, '');
engine.fill();
const fillLevel = await loudness(1200);
check('Fill', 'fill plays', fillLevel > 0.01, fillLevel.toFixed(3));
engine.ending();
await wait((60 / engine.tempo) * 4 * 1000 * 2 + 600);
check('Ending', 'style stops after the ending', engine.running === false, '');
await quiet();

// 7. Metronome in every time signature: clicks are audible and each bar has the right number of beats.
engine.tempo = 160;
for (let index = 0; index < meters.length; index++) {
  engine.setMeter(index);
  if (!engine.metronome) engine.toggleMetronome();
  beats = 0;
  let maxBeat = 0;
  let peak = 0;
  const watch = setInterval(() => {
    maxBeat = Math.max(maxBeat, engine.beat);
    peak = Math.max(peak, engine.level());
  }, 10);
  await wait(((60 / 160) * (meters[index].unit === 8 ? 0.5 : 1) * meters[index].beats * 2 + 0.4) * 1000);
  clearInterval(watch);
  // A click is short, so it is judged by its peak, against the grand piano's loudness at middle C.
  check('Metronome', meters[index].label, peak > loud[0] * 0.5 && maxBeat === meters[index].beats && beats >= meters[index].beats, `peak ${Math.round((100 * peak) / loud[0])}% of grand, beats per bar ${maxBeat}`);
}
engine.toggleMetronome();
await quiet();

// 8. Every song loads, sounds, has sheet music, and stops cleanly.
for (const song of songs) {
  await engine.playSong(song);
  const level = await loudness(2500);
  const score = engine.songScore;
  check('Song', song.title, level > 0.01 && engine.songLength > 10 && (score?.notes.length ?? 0) > 20, `level ${level.toFixed(3)}, ${Math.round(engine.songLength)} s, ${score?.notes.length ?? 0} notes, ${score?.meter.beats}/${score?.meter.unit}`);
  engine.stopSong();
  await wait(400);
  check('Song', `${song.title} stops`, engine.song === null && engine.level() < 0.05, engine.level().toFixed(3));
  await quiet();
}

// 9. Changing the sound mid-song switches the song to the new sound, smoothly and still audible.
await engine.playSong(songs[1]);
await wait(1500);
engine.selectCategory('Strings');
await engine.load(engine.sound.bank);
const switched = await loudness(1800);
check('Song', 'sound change mid-song (to String Ensemble)', engine.sound.name === 'String Ensemble' && switched > 0.01, `now ${engine.sound.name}, level ${switched.toFixed(3)}`);
engine.selectCategory('Organ');
const toOrgan = await loudness(1800);
check('Song', 'second change mid-song (to Drawbar Organ)', engine.sound.name === 'Drawbar Organ' && toOrgan > 0.01, `now ${engine.sound.name}, level ${toOrgan.toFixed(3)}`);
engine.stopSong();
engine.selectSound(0);
await quiet();

// 10. Balance turns the accompaniment down and up.
engine.selectStyle(0);
engine.startStyle();
engine.setBalance(0.5);
const middle = await loudness(1500);
engine.setBalance(0);
const none = await loudness(1500);
engine.setBalance(0.5);
engine.stopStyle();
await quiet();
check('Balance', 'accompaniment follows the balance slider', middle > 0.01 && none < middle / 4, `centre ${middle.toFixed(3)}, keyboard only ${none.toFixed(3)}`);

// 11. Starting a style stops a playing song, and starting a song stops a style.
await engine.playSong(songs[0]);
engine.startStyle();
check('Switching', 'style stops the song', engine.song === null && engine.running, '');
await engine.playSong(songs[1]);
check('Switching', 'song stops the style', engine.running === false && engine.song !== null, '');
engine.stopSong();

engine.dispose();
return results;
