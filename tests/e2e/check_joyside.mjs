// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9574', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9574/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
for (const [n, h, inset, ua] of [['Safari (page under the island)', 393, 59, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'], ['Google app (no inset, short)', 260, 0, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/380.0 Mobile/15E148 Safari/604.1']]) {
  await send('Network.setUserAgentOverride', { userAgent: ua });
  await send('Emulation.setDeviceMetricsOverride', { width: 852, height: h, deviceScaleFactor: 3, mobile: true, screenWidth: 852, screenHeight: 393, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, left: inset, bottom: inset ? 21 : 0, right: inset } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url }); await sleep(2500);
  await run(`Object.defineProperty(window, 'orientation', { value: 90, configurable: true }); document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600)); window.dispatchEvent(new Event('resize')); ${W}900));`);
  console.log(n, await run(`const r=(s)=>document.querySelector(s).getBoundingClientRect(); const j=r('.pa-joy'), s=[...document.querySelectorAll('.pa-left .pa-pedal, .pa-left button')].find(b=>/sustain/i.test(b.textContent))?.getBoundingClientRect(), k=r('.pa-keys'), bed=r('.pa-keybed'); const ov=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2; const sus=[...document.querySelectorAll('.pa-phone-sustain, .pa-pedal')].filter(e=>e.getClientRects().length>0).length; return 'sustain buttons shown '+sus+' | island '+(document.querySelector('.pa-instrument').dataset.island||'none')+' | joystick '+Math.round(j.left)+','+Math.round(j.top)+'-'+Math.round(j.bottom)+' | sustain '+(s?Math.round(s.left)+','+Math.round(s.top)+'-'+Math.round(s.bottom):'?')+' | keys from x '+Math.round(bed.left)+' | joystick over sustain '+ov(j,s)+' | joystick over keys '+ov(j,bed)+' | sustain over keys '+ov(s,bed)`));
  await shot('joyside-' + inset);
}
ws.close(); chrome.kill();
