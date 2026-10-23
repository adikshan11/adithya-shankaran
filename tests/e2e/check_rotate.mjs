// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9569', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9569/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0 Mobile/15E148 Safari/604.1';
await send('Network.setUserAgentOverride', { userAgent: IPHONE });
const turn = async (w, h, angle) => { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 3, mobile: true, screenWidth: w, screenHeight: h, screenOrientation: { type: angle ? 'landscapePrimary' : 'portraitPrimary', angle } }); await run(`window.dispatchEvent(new Event('orientationchange'))`); await sleep(1200); };
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await turn(393, 852, 0);
await send('Page.navigate', { url }); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600)); document.querySelector('.pa-fold').click(); ${W}900));`);
const rows = `const r=[...document.querySelectorAll('.pa-keybed')].filter(b=>b.offsetParent).map(b=>{const k=b.querySelector('.pa-keys').getBoundingClientRect(); const wk=b.querySelector('.pa-key-white').getBoundingClientRect(); const bk=b.querySelector('.pa-key-black').getBoundingClientRect(); return Math.round(k.top)+'-'+Math.round(k.bottom)+' white '+Math.round(wk.width)+'x'+Math.round(wk.height)+' black h'+Math.round(bk.height)}); const o=document.querySelector('.pa-overlay'); return r.length+' row(s): '+r.join(' | ')+' | screen '+innerWidth+'x'+innerHeight+(o.scrollHeight>o.clientHeight+1?' OVERFLOW':'')`;
console.log('upright, keys only  :', await run(rows));
await turn(852, 393, 90);
console.log('turned sideways     :', await run(rows));
await turn(393, 852, 0);
console.log('turned back upright :', await run(rows));
await shot('rotate-back');
// a bumpy rotation: an in-between size first, as iOS reports during the turn
await send('Emulation.setDeviceMetricsOverride', { width: 852, height: 393, deviceScaleFactor: 3, mobile: true, screenWidth: 852, screenHeight: 393, screenOrientation: { type: 'landscapePrimary', angle: 90 } }); await sleep(1200);
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 600, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852, screenOrientation: { type: 'portraitPrimary', angle: 0 } }); await sleep(40);
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true, screenWidth: 393, screenHeight: 852, screenOrientation: { type: 'portraitPrimary', angle: 0 } }); await sleep(1500);
console.log('bumpy turn back     :', await run(rows));
ws.close(); chrome.kill();
