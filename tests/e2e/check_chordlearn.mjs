// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9564', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9564/json')).json()).find((t) => t.type === 'page'); } catch {} }
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
await run(`[...document.querySelectorAll('.pa-btn')].find(b=>b.textContent.trim()==='Learn').click(); ${W}500)); [...document.querySelectorAll('.pa-tab')].find(t=>t.textContent.trim().startsWith('Left')).click(); ${W}300)); [...document.querySelectorAll('.pa-item')].find(x=>x.textContent.includes('Prelude in E')).click(); ${W}2500));`);
const helpers = `const down=(k,id)=>k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:id,pointerType:'mouse'})); const up=(k,id)=>k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:id,pointerType:'mouse'})); const targets=()=>[...document.querySelectorAll('.pa-key-target')]; const coach=()=>{const c=document.querySelector('.pa-coach'); return (c?.className.replace('pa-coach pa-coach-','')||'?')+': '+(document.querySelector('.pa-coach-bubble')?.textContent||'')}; const flag=()=>document.querySelector('.pa-learn-flag')?.textContent||'';`;
// play single-note steps correctly until a chord step comes up
console.log('reach a chord:', await run(`${helpers} for (let i=0;i<60;i++){ const t=targets(); if (t.length>=2) return 'chord of '+t.length+' at '+flag()+' -> '+t.map(k=>k.getAttribute('aria-label').replace('Play ','')).join('+'); const k=t[0]; if(!k) return 'no target'; down(k,1); ${W}60)); up(k,1); ${W}60)); } return 'no chord found';`));
console.log('A press one chord note and let go:', await run(`${helpers} const t=targets(); const n=t.length; down(t[0],1); ${W}120)); const mid=coach(); up(t[0],1); ${W}200)); return 'while held: '+mid+' || after letting go: green keys '+targets().length+'/'+n+', '+coach()+' || '+flag();`));
console.log('B press one and keep holding:', await run(`${helpers} const t=targets(); down(t[0],2); ${W}200)); const r='green keys left '+targets().length+', '+coach(); up(t[0],2); ${W}150)); return r;`));
console.log('C whole chord together:', await run(`${helpers} const before=flag(); const t=targets(); t.forEach((k,i)=>down(k,10+i)); ${W}250)); const r='step '+before+' -> '+flag()+', '+coach(); t.forEach((k,i)=>up(k,10+i)); ${W}150)); return r;`));
ws.close(); chrome.kill();
