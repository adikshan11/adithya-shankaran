// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9553', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9553/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
const tap = async (sel, label) => {
  const r = JSON.parse(await run(`const e=[...document.querySelectorAll('${sel}')].find(b=>b.textContent.includes('${label}')); if(!e) return 'null'; const r=e.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2,top:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.className})`) || 'null');
  if (!r) return 'not found';
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); await sleep(60);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
  return JSON.stringify(r);
};
for (const [w,h] of [[844,390],[390,844]]) {
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(3000);
await run(`localStorage.setItem('piano-learn-best', JSON.stringify({'twinkle:right': 4}));`);
await send('Page.reload'); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
console.log(w, 'tap Learn:', await tap('.pa-phone-btn', 'Learn'));
console.log(w, 'tabs:', await run(`return [...document.querySelectorAll('.pa-tab')].map(t=>t.textContent).join(',')`));
await shot('tabs-'+w); console.log(w, 'tap 150 tab:', await tap('.pa-tab', '150'));
console.log(w, 'selected:', await run(`return document.querySelector('.pa-tab-on:last-child, .pa-tab.pa-tab-on.pa-tab-bonus')?.textContent ?? [...document.querySelectorAll('.pa-tab-on')].map(t=>t.textContent).join(',')`));
await shot('bonustap-'+w);
console.log(w, 'tap Twinkle:', await tap('.pa-item', 'Twinkle'));
await run(`const press = async (k) => { k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:9})); await new Promise(r=>setTimeout(r,25)); k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9})); await new Promise(r=>setTimeout(r,25)); }; for (let i=0;i<200 && !document.querySelector('.pa-result');i++) { const t=document.querySelector('.pa-key-target'); if (!t) break; await press(t); } await new Promise(r=>setTimeout(r,800));`);
console.log(w, 'card:', await run(`return document.querySelector('.pa-result-title')?.textContent ?? 'no card'`));
console.log(w, 'tap card Bonus:', await tap('.pa-result button', 'Bonus'));
console.log(w, 'after tap:', await run(`return (document.querySelector('.pa-result') ? 'card still open' : 'card closed') + ' | ' + (document.querySelector('.pa-learn-flag')?.textContent ?? '')`));
console.log(w, 'learn flag:', await run(`return document.querySelector('.pa-learn-flag')?.textContent ?? document.querySelector('.pa-message')?.textContent ?? 'none'`));
}
ws.close(); chrome.kill();
