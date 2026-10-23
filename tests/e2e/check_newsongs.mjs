// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9566', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9566/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
await send('Emulation.setDeviceMetricsOverride', { width: 1470, height: 830, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600));`);
for (const name of ['Ode to Joy', 'Moonlight', 'Clair de Lune', 'Gnossienne']) {
  await run(`[...document.querySelectorAll('.pa-btn')].find(b=>b.textContent.trim()==='Song').click(); ${W}500)); const it=[...document.querySelectorAll('.pa-screen .pa-item')].find(x=>x.textContent.includes('${name}')); it?.click(); ${W}9000));`);
  console.log(name.padEnd(14), await run(`const bar=document.querySelector('.pa-screen-bar')?.innerText.split(String.fromCharCode(10)).join(' '); const lit=document.querySelectorAll('.pa-key-down').length; return 'bar: '+bar+' | keys lit now: '+lit`));
  await run(`const stop=[...document.querySelectorAll('.pa-screen button')].find(b=>/Stop/.test(b.textContent)); stop?.click(); ${W}400));`);
}
// Learn Ode to Joy perfectly
await run(`[...document.querySelectorAll('.pa-btn')].find(b=>b.textContent.trim()==='Learn').click(); ${W}500)); [...document.querySelectorAll('.pa-tab')].find(t=>t.textContent.trim()==='Right').click(); ${W}200)); [...document.querySelectorAll('.pa-item')].find(x=>x.textContent.includes('Ode to Joy')).click(); ${W}2000));`);
console.log('Learn Ode to Joy:', await run(`let n=0; for (let i=0;i<200 && !document.querySelector('.pa-result');i++) { const t=document.querySelector('.pa-key-target'); if (!t) break; t.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:9})); ${W}25)); t.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9})); ${W}25)); n++; } ${W}700)); return n+' notes played -> '+(document.querySelector('.pa-result-title')?.textContent ?? 'no result')`));
ws.close(); chrome.kill();
