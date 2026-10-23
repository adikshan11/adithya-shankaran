// Records three notes, saves WAV and MIDI, inspects both files; then plays from a simulated MIDI keyboard.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9441', '--user-data-dir=' + profile, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9441/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => (await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;
const key = async (code, k, vk, ms) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key: k, windowsVirtualKeyCode: vk }); await sleep(ms); await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key: k, windowsVirtualKeyCode: vk }); await sleep(120); };
await send('Page.enable');
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: outDir.replace(/\//g, '\\') });
// A pretend USB keyboard: requestMIDIAccess returns one input whose messages the test sends.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  const input = { name: 'Test Piano', state: 'connected', onmidimessage: null };
  window.__midi = (bytes) => input.onmidimessage && input.onmidimessage({ data: new Uint8Array(bytes) });
  navigator.requestMIDIAccess = async () => ({ inputs: new Map([['1', input]]), onstatechange: null });` });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,2500));`);
const button = (label) => `[...document.querySelectorAll('.pa-btn')].find(b=>b.textContent.trim().endsWith('${label}'))`;
await run(`${button('Rec')}.click(); await new Promise(r=>setTimeout(r,300));`);
const flag = await run(`return document.querySelector('.pa-rec-flag')?.textContent + ' | ' + document.querySelector('.pa-message')?.textContent`);
await run(`document.body.focus()`);
await key('KeyZ', 'z', 90, 400); await key('KeyC', 'c', 67, 400); await key('KeyB', 'b', 66, 600);
await run(`${button('Rec')}.click(); await new Promise(r=>setTimeout(r,1500));`);
const list = await run(`return [...document.querySelectorAll('.pa-take')].map(t=>t.querySelector('.pa-take-name').textContent).join(' / ') + ' | ' + document.querySelector('.pa-message')?.textContent`);
console.log('while recording:', flag);
console.log('after stop:', list);
await run(`[...document.querySelectorAll('.pa-take-btn')].find(b=>b.textContent==='WAV').click(); await new Promise(r=>setTimeout(r,2500)); [...document.querySelectorAll('.pa-take-btn')].find(b=>b.textContent==='MIDI').click(); await new Promise(r=>setTimeout(r,1500));`);
await sleep(1000);
for (const file of readdirSync(outDir)) {
  const bytes = readFileSync(`${outDir}/${file}`);
  if (file.endsWith('.wav')) console.log(`WAV ${file}: ${bytes.length} bytes, header ${bytes.subarray(0, 4)}/${bytes.subarray(8, 12)}, ${bytes.readUInt16LE(22)} channels, ${bytes.readUInt32LE(24)} Hz, ${(bytes.readUInt32LE(40) / bytes.readUInt32LE(28)).toFixed(2)} s`);
  if (file.endsWith('.mid')) { let ons = []; for (let i = 0; i < bytes.length - 2; i++) if (bytes[i] === 0x90) ons.push(bytes[i + 1]); console.log(`MIDI ${file}: ${bytes.length} bytes, header ${bytes.subarray(0, 4)}, note-ons ${ons.join(' ')}`); }
}
const reload = await run(`location.reload(); return 1`);
await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,2500)); ${button('Takes')}.click(); await new Promise(r=>setTimeout(r,500));`);
console.log('after a reload, saved takes:', await run(`return [...document.querySelectorAll('.pa-take-name')].map(t=>t.textContent).join(' / ') || 'none'`));
await run(`${button('MIDI')}.click(); await new Promise(r=>setTimeout(r,400)); window.__midi([0x90, 64, 100]); await new Promise(r=>setTimeout(r,200));`);
const midi = await run(`return JSON.stringify({message: document.querySelector('.pa-message').textContent, down: [...document.querySelectorAll('.pa-key-down')].map(k=>k.getAttribute('aria-label'))})`);
await run(`window.__midi([0xb0, 64, 127]); await new Promise(r=>setTimeout(r,200));`);
const pedal = await run(`return document.querySelector('.pa-pedal').getAttribute('aria-pressed')`);
await run(`window.__midi([0x80, 64, 0]); await new Promise(r=>setTimeout(r,200));`);
const up = await run(`return [...document.querySelectorAll('.pa-key-down')].length`);
console.log('MIDI keyboard:', midi, '| pedal after CC64:', pedal, '| keys down after note-off:', up);
ws.close(); chrome.kill();
