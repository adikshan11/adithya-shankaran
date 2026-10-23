// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9573', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9573/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(2500);
await run(`localStorage.removeItem('piano-keys-shown'); localStorage.removeItem('piano-keys-shown-upper');`);
await send('Page.reload'); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600)); document.querySelector('.pa-fold').click(); ${W}1000));`);
const state = `const vis=(e)=>e.getClientRects().length>0; const folds=[...document.querySelectorAll('.pa-fold')].filter(vis).length; const parts=[...document.querySelectorAll('.pa-mapbar-upper, .pa-keyrow2, .pa-mapbar:not(.pa-mapbar-upper), .pa-keyrow')].filter(vis).map(e=>({n:e.className.includes('upper')?'upper strip':e.className.includes('keyrow2')?'upper keys':e.className.includes('mapbar')?'lower strip':'lower keys', t:Math.round(e.getBoundingClientRect().top)})).sort((a,b)=>a.t-b.t).map(p=>p.n+'@'+p.t).join(' > '); const w=(sel)=>Math.round(document.querySelector(sel+' .pa-key-white').getBoundingClientRect().width); const start=(sel)=>{const b=document.querySelector(sel+' .pa-keybed'); const r=b.getBoundingClientRect(); return [...b.querySelectorAll('.pa-key-white')].find(k=>k.getBoundingClientRect().left>=r.left-1)?.getAttribute('aria-label')?.replace('Play ','')}; return JSON.stringify({folds, order: parts, upper: w('.pa-keyrow2')+'px from '+start('.pa-keyrow2'), lower: w('.pa-keyrow')+'px from '+start('.pa-keyrow'), sliders: [...document.querySelectorAll('.pa-zoom-count')].filter(vis).map(e=>e.textContent).join('/')})`;
console.log('default        :', await run(state));
const setSlider = (sel, v) => run(`const i=document.querySelector('${sel} .pa-zoom input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${v}'); i.dispatchEvent(new Event('input',{bubbles:true})); ${W}500));`);
await setSlider('.pa-mapbar-upper', 12);
console.log('upper slider 12:', await run(state));
await setSlider('.pa-mapbar:not(.pa-mapbar-upper)', 10);
console.log('lower slider 10:', await run(state));
// drag the upper strip to its right end
const r = JSON.parse(await run(`const m=document.querySelector('.pa-mapbar-upper .pa-minimap').getBoundingClientRect(); return JSON.stringify({x:m.right-4,y:m.top+m.height/2})`));
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] }); await sleep(80); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(500);
console.log('tap upper strip right end:', await run(state));
await shot('tworow-controls');
ws.close(); chrome.kill();
