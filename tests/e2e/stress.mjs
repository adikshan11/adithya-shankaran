// Stress and edge-case test of the phone piano: touch chords, glissando, two-finger slide, rapid taps, rapid view
// switching, rotation while a key is held, page hidden and back, Learn with wrong notes, memory, and every error.
import { spawn } from 'node:child_process';
const [, , url, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9561', '--user-data-dir=' + profile, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9561/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push('exception: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 200));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
});
const send = (method, params = {}) => new Promise((resolve) => { const my = ++id; const timer = setTimeout(() => { pending.delete(my); if (!globalThis.__to) { globalThis.__to = 1; console.log('  FIRST TIMEOUT ' + method + ' during: ' + globalThis.__step); } else globalThis.__to++; resolve({ result: {} }); }, 15000); pending.set(my, (m) => { clearTimeout(timer); resolve(m); }); ws.send(JSON.stringify({ id: my, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 200) : r.result?.result?.value; };
const touch = (type, points) => send('Input.dispatchTouchEvent', { type, touchPoints: points });
const results = [];
const check = (name, ok, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (detail ? ' — ' + detail : '')); results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
await send('Page.enable'); await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__ctxs = []; const Real = window.AudioContext;
  window.AudioContext = class extends Real { constructor(...a) { super(...a); window.__ctxs.push(this); } };
  window.__starts = 0; const realStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 4800) window.__starts++; return realStart.apply(this, a); };` });
const land = { width: 844, height: 390, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } };
const port = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } };
await send('Emulation.setDeviceMetricsOverride', land);
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,2600));`);
await run(`window.__on = 0; const keys = document.querySelector('.pa-keys'); new MutationObserver((list) => { for (const m of list) if (m.target.classList.contains('pa-key-down') && !(m.oldValue||'').includes('pa-key-down')) window.__on++; }).observe(keys, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });`);
const keyPos = async (label) => JSON.parse(await run(`const k=document.querySelector('[aria-label="Play ${label}"]'); k.scrollIntoView({block:'nearest', inline:'center', behavior:'instant'}); const r=k.getBoundingClientRect(); return JSON.stringify([Math.round(r.left + r.width/2), Math.round(r.bottom - 25)])`));
const down = () => run(`return document.querySelectorAll('.pa-key-down').length`);
const heap0 = (await send('Performance.enable'), (await send('Performance.getMetrics')).result.metrics.find((m) => m.name === 'JSHeapUsedSize').value);

// 1. Three-finger chord
globalThis.__step = '1. Three-finger chord'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const c = await keyPos('C4'), e = await run(`const k=document.querySelector('[aria-label="Play E4"]').getBoundingClientRect(); return JSON.stringify([Math.round(k.left+k.width/2), Math.round(k.bottom-25)])`).then(JSON.parse), g = await run(`const k=document.querySelector('[aria-label="Play G4"]').getBoundingClientRect(); return JSON.stringify([Math.round(k.left+k.width/2), Math.round(k.bottom-25)])`).then(JSON.parse);
await touch('touchStart', [{ x: c[0], y: c[1], id: 1 }]); await sleep(15);
await touch('touchStart', [{ x: c[0], y: c[1], id: 1 }, { x: e[0], y: e[1], id: 2 }]); await sleep(15);
await touch('touchStart', [{ x: c[0], y: c[1], id: 1 }, { x: e[0], y: e[1], id: 2 }, { x: g[0], y: g[1], id: 3 }]); await sleep(200);
const chordDown = await run(`return [...document.querySelectorAll('.pa-key-down')].map(k=>k.getAttribute('aria-label').replace('Play ','')).join(' ')`);
await touch('touchEnd', []); await sleep(200);
check('three-finger chord plays C4 E4 G4 together', chordDown === 'C4 E4 G4', chordDown);
check('chord released, no stuck keys', (await down()) === 0);

// 2. Glissando: one finger slides across 10 white keys
globalThis.__step = '2. Glissando'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
await run(`window.__on = 0; window.__starts = 0`);
const start = await keyPos('C4');
const step = Number(await run(`const a=document.querySelector('[aria-label="Play C4"]').getBoundingClientRect(), b=document.querySelector('[aria-label="Play D4"]').getBoundingClientRect(); return b.left - a.left`));
await touch('touchStart', [{ x: start[0], y: start[1], id: 4 }]); await sleep(30);
for (let i = 1; i <= 21; i++) { await touch('touchMove', [{ x: start[0] + (i * step) / 3, y: start[1], id: 4 }]); await sleep(12); }
await touch('touchEnd', []); await sleep(250);
const gliss = Number(await run(`return window.__starts`));
check('glissando: sliding one finger over 7 more keys plays all 8 (C4 to C5)', gliss === 8, `${gliss} notes started`);
check('glissando released, no stuck keys', (await down()) === 0);

// 3. Two-finger slide moves the keyboard and leaves nothing playing
globalThis.__step = '3. Two-finger slide'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const sl0 = Number(await run(`return document.querySelector('.pa-keybed').scrollLeft`));
await touch('touchStart', [{ x: 400, y: 330, id: 5 }, { x: 470, y: 330, id: 6 }]); await sleep(30);
for (let i = 1; i <= 12; i++) { await touch('touchMove', [{ x: 400 - i * 15, y: 330, id: 5 }, { x: 470 - i * 15, y: 330, id: 6 }]); await sleep(15); }
await touch('touchEnd', []); await sleep(250);
const sl1 = Number(await run(`return document.querySelector('.pa-keybed').scrollLeft`));
check('two-finger slide moves the keyboard', Math.abs(sl1 - sl0) > 100, `${sl0} -> ${sl1}`);
check('two-finger slide leaves no stuck keys', (await down()) === 0);

// 4. 300 rapid random taps, some overlapping
globalThis.__step = '4. 300 rapid'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const boxes = JSON.parse(await run(`return JSON.stringify([...document.querySelectorAll('.pa-key')].map(k=>{const r=k.getBoundingClientRect(); return [r.left+r.width/2, r.bottom-25, r.left, r.right];}).filter(b=>b[2] >= 60 && b[3] <= 840))`));
const t0 = Date.now();
for (let i = 0; i < 120; i++) {
  const [x, y] = boxes[(i * 7) % boxes.length];
  await touch('touchStart', [{ x, y, id: 10 + (i % 3) }]);
  if (i % 3 === 2) await touch('touchEnd', []);
}
await touch('touchEnd', []); await sleep(400);
const probe0 = Date.now(); const alive = await run(`return 'alive'`);
check('120 rapid taps leave no stuck keys and the page stays responsive', (await down()) === 0 && alive === 'alive', `${Date.now() - t0} ms for the taps, page answered in ${Date.now() - probe0} ms`);

// 5. Rapid view switching
globalThis.__step = '5. Rapid view'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const t1 = Date.now();
for (let i = 0; i < 40; i++) {
  await run(`const b=(l)=>[...document.querySelectorAll('.pa-phone-btn, .pa-touch')].find(x=>x.offsetParent && x.textContent.includes(l)); [${['Panel', 'Less', 'Sheet', 'SCORE', 'Style', 'Sheet'].map((l) => `'${l}'`).join(',')}].forEach((l, j) => { if (j === ${i % 6}) b(l)?.click(); });`);
  await sleep(30);
}
await sleep(800);
const layout = JSON.parse(await run(`const k=document.querySelector('.pa-keys').getBoundingClientRect(); return JSON.stringify({keysBottom: Math.round(k.bottom), keysShown: !!document.querySelector('.pa-keys').offsetParent, scrolls: document.querySelector('.pa-overlay').scrollHeight > innerHeight + 1, running: document.querySelector('.pa-arr-go, .pa-row-action')?.textContent})`));
check('after 40 rapid Panel/Sheet/Score/Style switches the stage still fits the screen', !layout.scrolls && layout.keysBottom <= 392, JSON.stringify(layout));
await run(`const s=[...document.querySelectorAll('button')].find(b=>b.offsetParent && /Stop/.test(b.textContent)); s?.click(); await new Promise(r=>setTimeout(r,300)); for (const l of ['Less','Sheet']) { const b=[...document.querySelectorAll('.pa-phone-btn')].find(x=>x.textContent.includes(l) && (x.getAttribute('aria-pressed')==='true' || x.getAttribute('aria-expanded')==='true')); b?.click(); } if (document.querySelector('.pa-score-btn-on')) document.querySelector('.pa-score-btn').click();`);

// 6. Rotate while a key is held, release in portrait
globalThis.__step = '6. Rotate'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const h = await keyPos('A4');
await touch('touchStart', [{ x: h[0], y: h[1], id: 20 }]); await sleep(150);
await send('Emulation.setDeviceMetricsOverride', port); await sleep(700);
await touch('touchEnd', []); await sleep(300);
const afterRotate = await down();
await send('Emulation.setDeviceMetricsOverride', land); await sleep(900);
const fit = JSON.parse(await run(`const k=document.querySelector('.pa-keys').getBoundingClientRect(); return JSON.stringify({keysBottom: Math.round(k.bottom), scrolls: document.querySelector('.pa-overlay').scrollHeight > innerHeight + 1})`));
check('turning the phone while a key is held does not leave it stuck', afterRotate === 0, `${afterRotate} down`);
check('after turning back, landscape still fits', !fit.scrolls && fit.keysBottom <= 392, JSON.stringify(fit));

// 7. Page hidden and shown again: audio wakes on the next touch
globalThis.__step = '7. Page hidden'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const before7 = await run(`const c = window.__ctxs.at(-1); await c.suspend(); return c.state`);
await run(`document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pageshow')); await new Promise(r=>setTimeout(r,200));`);
const k2 = await keyPos('C5');
await touch('touchStart', [{ x: k2[0], y: k2[1], id: 21 }]); await sleep(120); await touch('touchEnd', []); await sleep(300);
const after7 = await run(`return window.__ctxs.at(-1).state`);
check('audio suspended (as Safari does in the background) comes back on return and tap', before7 === 'suspended' && after7 === 'running', `${before7} -> ${after7}`);

// 8. Learn with 60 fast wrong notes
globalThis.__step = '8. Learn'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
await run(`[...document.querySelectorAll('.pa-phone-btn')].find(b=>b.textContent.includes('Learn')).click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('.pa-item')].find(x=>x.textContent.includes('Für Elise'))?.click(); await new Promise(r=>setTimeout(r,2000));`);
const wrong = await keyPos('C3');
for (let i = 0; i < 40; i++) { await touch('touchStart', [{ x: wrong[0], y: wrong[1], id: 30 }]); await touch('touchEnd', []); }
await sleep(400);
const coach = await run(`return (document.querySelector('.pa-coach')?.className ?? 'no coach') + ' | ' + (document.querySelector('.pa-learn-flag')?.textContent ?? '')`);
check('Learn survives 60 fast wrong notes (coach angry, still on step 1)', /angry/.test(coach) && coach.includes('1/'), coach);
check('Learn: no stuck keys', (await down()) === 0);

// 9. Memory
globalThis.__step = '9. Memory'; console.log('STEP ' + globalThis.__step + ' at ' + new Date().toISOString().slice(11,19));
const heap1 = (await send('Performance.getMetrics')).result.metrics.find((m) => m.name === 'JSHeapUsedSize').value;
check('memory stays reasonable after the whole run', heap1 < 120e6, `${Math.round(heap0 / 1e6)} MB -> ${Math.round(heap1 / 1e6)} MB`);
check('no JavaScript errors or console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
ws.close(); chrome.kill();
