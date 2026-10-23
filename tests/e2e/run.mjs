// Runs the piano's browser checks against the built site and fails if any check fails. Used by the GitHub Actions
// workflow (.github/workflows/piano-checks.yml) before a deploy, and runnable locally after `npm run build`:
//   node tests/e2e/run.mjs            (Chrome from CHROME_PATH, or the usual Windows install)
// Each check is a headless-Chrome script in this folder that prints what it measured; the rules below decide pass
// or fail from that output, the same rules the deploy gate used by hand.
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(here, 'out');
mkdirSync(out, { recursive: true });
const url = 'http://localhost:4321/?piano=1';
const count = (text, pattern) => (text.match(new RegExp(pattern, 'gm')) ?? []).length;

// [name, script, takes an output folder, pass rule, minutes allowed]
const checks = [
  ['Stress: chords, glissando, slides, rapid taps, rotation, audio return', 'stress.mjs', false, (t) => count(t, '^PASS') > 0 && count(t, '^FAIL') === 0, 6],
  ['Learn chosen from the Panel fits the screen (3 heights)', 'check_panellearn2.mjs', true, (t) => count(t, 'after choosing.*"scrolls":false') === 3, 4],
  ['Result cards: perfect, good, poor', 'check_result.mjs', true, (t) => count(t, 'pa-result pa-result-') === 3 && t.includes('Perfect!'), 4],
  ['Mastered at 100% speed', 'check_mastered.mjs', true, (t) => t.includes('Mastered!'), 4],
  ['Bonus speeds by touch (sideways and upright)', 'check_bonustap.mjs', true, (t) => count(t, 'after tap: card closed \\| LEARN 1/42 · 200%') === 2, 6],
  ['Chords count only when held together', 'check_chordlearn.mjs', true, (t) => t.includes('Together!') && t.includes('Good!'), 3],
  ['Two keyboards (upright keys-only)', 'check_dual.mjs', true, (t) => count(t, '2 row\\(s\\)') >= 4, 4],
  ['Each keyboard has its own strip and slider', 'check_tworow_ctl.mjs', true, (t) => count(t, '"folds":1') === 4, 3],
  ['Turning sideways and back keeps two keyboards', 'check_rotate.mjs', true, (t) => count(t, '2 row\\(s\\)') === 3, 3],
  ['Keys fill the screen even when the browser misreports its height', 'check_gsa.mjs', true, (t) => count(t, 'overflow false') === 2 && count(t, '2 row\\(s\\)') === 2 && !t.includes('overflow true'), 3],
  ['Keys stop above the home bar strip', 'check_homebar.mjs', true, (t) => count(t, 'strip below the keys 2\\d px') === 2, 3],
  ['Joystick and Sustain never overlap the keys', 'check_joyside.mjs', true, (t) => count(t, 'sustain buttons shown 1 .*joystick over sustain false \\| joystick over keys false \\| sustain over keys false') === 2, 3],
  ['Keys-only view (3 sizes)', 'check_fold.mjs', true, (t) => count(t, 'keys only') === 3 && !t.includes('"scrolls":true'), 4],
  ['Close closes the Panel first (sideways)', 'check_panelx.mjs', true, (t) => t.includes('piano open false'), 3],
  ['Upright Panel opens and closes from its own button', 'check_portrait_panel.mjs', true, (t) => t.includes('"piano":false'), 3],
  ['One way to open Help in every layout', 'check_onehelp.mjs', true, (t) => count(t, 'total ways to open Help: 1') === 5, 4],
  ['Help pop-up, Escape, and the ; key', 'check_help.mjs', true, (t) => count(t, 'help open, 6 tips') >= 1 && t.includes('piano open true') && t.includes('; plays: Play D sharp 4'), 3],
  ['No text selection on the instrument', 'check_select.mjs', true, (t) => count(t, 'selection kept false') >= 4 && !t.includes('ALLOWED') && !t.includes('selection kept true'), 3],
  ['Recording, WAV and MIDI files, MIDI keyboard', 'check_rec.mjs', true, (t) => t.includes('RIFF/WAVE') && t.includes('saved takes: Take 1'), 3],
  ['Recording saved when leaving the app', 'check_recleave.mjs', true, (t) => /saved takes: Take 1: 3 notes/.test(t), 3],
  ['Sound comes back after share sheets and interruptions', 'check_heal.mjs', true, (t) => count(t, 'current running') >= 4, 3],
  ['New songs play and Ode to Joy can be learned', 'check_newsongs.mjs', true, (t) => count(t, '0:0\\d / \\d:\\d\\d') === 4 && t.includes('Perfect!'), 5],
  ['38 device sizes: keys on screen, nothing off screen or overlapping', 'check_devices.mjs', true, (t) => {
    const rows = t.split('\n').filter((line) => line.includes('"keysOnScreen"'));
    return rows.length === 38 && rows.every((line) => line.includes('"keysOnScreen":true') && line.includes('"offscreen":[]') && line.includes('"overlaps":[]'));
  }, 15],
];

const run = (command, args, minutes, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd: here, shell: process.platform === 'win32', ...options });
    let text = '';
    child.stdout?.on('data', (chunk) => (text += chunk));
    child.stderr?.on('data', (chunk) => (text += chunk));
    const timer = setTimeout(() => {
      text += `\nTIMED OUT after ${minutes} min`;
      child.kill('SIGKILL');
    }, minutes * 60000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, text });
    });
  });

// Serve the built site.
const server = spawn('npx', ['vite', 'preview', '--port', '4321', '--strictPort'], { cwd: root, shell: process.platform === 'win32', stdio: 'ignore' });
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const results = [];
for (const [name, script, wantsOut, pass, minutes] of checks) {
  const profile = join(tmpdir(), `piano-${script}-${Date.now()}`);
  const args = wantsOut ? [script, url, out, profile] : [script, url, profile];
  const started = Date.now();
  const { text } = await run(process.execPath, args, minutes);
  rmSync(profile, { recursive: true, force: true });
  const ok = (() => {
    try {
      return pass(text);
    } catch {
      return false;
    }
  })();
  const seconds = Math.round((Date.now() - started) / 1000);
  results.push({ name, ok, seconds, text });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${seconds} s)`);
  if (!ok) {
    const tail = text.split('\n').filter((line) => line.trim()).slice(-14).join('\n');
    console.log(tail);
    // On GitHub, a failure also becomes an annotation: readable on the run page (and through the public API).
    if (process.env.GITHUB_ACTIONS) console.log(`::error title=${name.replace(/[:,]/g, ' ')}::${tail.slice(-1800).replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A')}`);
  }
}
server.kill();

const failed = results.filter((result) => !result.ok);
const table = ['| Check | Result | Time |', '| --- | --- | --- |', ...results.map((r) => `| ${r.name} | ${r.ok ? 'pass' : '**FAIL**'} | ${r.seconds} s |`)].join('\n');
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Piano browser checks\n\n${table}\n\n${results.length - failed.length} of ${results.length} passed\n`);
process.exit(failed.length ? 1 : 0);
