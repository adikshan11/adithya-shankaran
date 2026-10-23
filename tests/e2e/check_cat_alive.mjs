// The Learn cat: a tap boops it, a stroke makes it purr with its eyes shut, and between notes it blinks and keeps habits.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9611', '--user-data-dir=' + profile, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9611/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => (await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true })).result?.result?.value;
const box = async () => JSON.parse(await run(`const b=document.querySelector('.pa-coach-figure').getBoundingClientRect(); return JSON.stringify([b.left,b.top,b.width,b.height])`));
const shot = async (name) => { const r = await box(); const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: r[0] - 10, y: r[1] - 10, width: r[2] + 20, height: r[3] + 20, scale: 3 } }); writeFileSync(`${outDir}/alive-${name}.png`, Buffer.from(s.result.data, 'base64')); };
const look = () => run(`const c=document.querySelector('.pa-coach'); return c.className.replace('pa-coach pa-coach-','') + ': ' + c.querySelector('.pa-coach-bubble').textContent + ' | hearts ' + c.querySelectorAll('.co-heart').length + ' ? ' + c.querySelectorAll('.co-what').length + ' eyes ' + (c.querySelector('.co-shut-on') ? 'shut' : 'open')`);
const touch = async (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<160&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,3000)); [...document.querySelectorAll('.pa-btn')].find(b=>b.textContent.includes('Learn')).click(); await new Promise(r=>setTimeout(r,400)); [...document.querySelectorAll('.pa-item')].find(x=>x.textContent.includes('Twinkle')).click(); await new Promise(r=>setTimeout(r,1500));`);
let [x, y, w, h] = await box(); const cx = x + w / 2, cy = y + h / 2;
console.log('start:', await look());
// the tail swings in time with the practice tempo: sample its angle for 3 s and count the turns
console.log('tail on the beat:', await run(`const t=document.querySelector('.co-tailimg'); const beat=getComputedStyle(document.querySelector('.pa-coach')).getPropertyValue('--beat'); const a=[]; for(let i=0;i<60;i++){ const m=new DOMMatrix(getComputedStyle(t).transform); a.push(Math.atan2(m.b,m.a)*180/Math.PI); await new Promise(r=>setTimeout(r,50)); } let turns=0; for(let i=2;i<a.length;i++) if((a[i]-a[i-1])*(a[i-1]-a[i-2])<0) turns++; return 'beat '+beat+' | range '+(Math.max(...a)-Math.min(...a)).toFixed(1)+' deg | turns in 3 s '+turns`)); await shot('idle');
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await touch('touchStart', cx, cy); await sleep(60); await touch('touchEnd'); await sleep(250);
console.log('tap:', await look()); await shot('boop');
await sleep(1800);
await touch('touchStart', cx - 25, cy); for (let i = 0; i < 6; i++) { await sleep(40); await touch('touchMove', cx - 25 + i * 10, cy + (i % 2)); } await sleep(150);
console.log('stroke (finger still down):', await look()); await shot('purr');
await touch('touchEnd'); await sleep(2600);
console.log('after the pat:', await look());
console.log('10 s of idle life:', await run(`const c=document.querySelector('.pa-coach'); const log={blinks:0,habits:[],moods:new Set()}; const mo=new MutationObserver(()=>{ const shut=!!c.querySelector('.co-shut-on'); if(shut&&!log.prev) log.blinks++; log.prev=shut; const m0=(c.querySelector('.co-life').getAttribute('class').split('co-do-')[1]||'').trim(); const m=m0?[0,m0]:null; if(m) log.habits.push(m[1]); else log.habits.push('-'); log.moods.add(c.className); }); mo.observe(c,{subtree:true,attributes:true,attributeFilter:['class']}); await new Promise(r=>setTimeout(r,11000)); mo.disconnect(); return JSON.stringify({blinks:log.blinks,habits:log.habits.filter((h,i,a)=>h!==a[i-1]).join(' '),moods:[...log.moods]})`));
ws.close(); chrome.kill();
