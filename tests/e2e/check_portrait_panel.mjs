// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9544', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9544/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
await run(`document.querySelector('.pa-phone-panel').click(); ${W}800));`);
const st = `return JSON.stringify({piano: !!document.querySelector('.pa-overlay'), panel: !!document.querySelector('.pa-drawer-open'), label: document.querySelector('.pa-phone-panel')?.innerText, shown: !!document.querySelector('.pa-phone-panel')?.offsetParent, keysTop: Math.round(document.querySelector('.pa-keys')?.getBoundingClientRect().top ?? -1)})`;
console.log('panel open:', await run(st)); console.log('row:', await run(`const b=[...document.querySelectorAll('.pa-drawer-open .pa-ctl-groups .pa-btn')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect()); const g=document.querySelector('.pa-drawer-open .pa-faders').getBoundingClientRect(); return JSON.stringify({n:b.length, first:Math.round(b[0].left), last:Math.round(b.at(-1).right), groupL:Math.round(g.left), groupR:Math.round(g.right), tops:[...new Set(b.map(r=>Math.round(r.top)))]})`)); await shot('row-open');
await run(`document.querySelector('.pa-phone-panel').click(); ${W}600));`);
console.log('after tapping the Panel button again:', await run(st));
await run(`document.querySelector('.pa-phone-panel').click(); ${W}600)); document.querySelector('.pa-overlay-close').click(); ${W}1500));`);
console.log('top Close with Panel open:', await run(st));
ws.close(); chrome.kill();
