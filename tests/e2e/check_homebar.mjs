// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9567', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9567/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
for (const [n, inset] of [['iPhone (home bar 21 px)', 21], ['Android (no inset)', 0]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: 852, height: 393, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: 59, bottom: inset, right: 59 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url }); await sleep(2500);
  await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600));`);
  console.log(n, await run(`const k=document.querySelector('.pa-keys').getBoundingClientRect(); const rail=getComputedStyle(document.querySelector('.pa-keyrow'),'::after'); return 'keys '+Math.round(k.top)+'-'+Math.round(k.bottom)+' of '+innerHeight+' | strip below the keys '+Math.round(innerHeight-k.bottom)+' px'`));
  await shot('homebar-'+inset);
  await run(`document.querySelector('.pa-fold').click(); ${W}800));`);
  console.log(n, 'keys only:', await run(`const k=document.querySelector('.pa-keys').getBoundingClientRect(); return 'keys '+Math.round(k.top)+'-'+Math.round(k.bottom)+' of '+innerHeight`));
}
ws.close(); chrome.kill();
