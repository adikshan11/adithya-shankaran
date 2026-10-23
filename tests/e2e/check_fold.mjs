// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9546', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9546/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
for (const [name,w,h] of [['land',844,390],['port',390,844],['land293',844,293]]) {
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
const st = `const k=document.querySelector('.pa-keys').getBoundingClientRect(); const f=document.querySelector('.pa-fold').getBoundingClientRect(); const o=document.querySelector('.pa-overlay'); return JSON.stringify({keys: Math.round(k.top)+'-'+Math.round(k.bottom), vp: innerHeight, fold: [Math.round(f.left+f.width/2), Math.round(f.top), Math.round(f.bottom)], close: !!document.querySelector('.pa-overlay-close')?.offsetParent, screen: !!document.querySelector('.pa-screen')?.offsetParent, scrolls: o.scrollHeight > o.clientHeight + 1, scrollTop: o.scrollTop, overflow: getComputedStyle(o).overflowY, strip: Math.round(document.querySelector('.pa-mapbar').getBoundingClientRect().top)})`;
console.log(name, 'normal', await run(st)); await run(`document.querySelector('.pa-overlay').scrollTop = 300; 300));`);
await shot('fold-'+name+'-normal');
await run(`document.querySelector('.pa-fold').click(); ${W}700));`);
console.log(name, 'keys only', await run(st));
await shot('fold-'+name+'-keys');
await run(`document.querySelector('.pa-fold').click(); ${W}700));`);
console.log(name, 'back', await run(st));
}
ws.close(); chrome.kill();
