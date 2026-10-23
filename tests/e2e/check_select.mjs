// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9559', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9559/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
for (const [n,w,h] of [['sideways',852,393],['upright',393,852]]) {
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
console.log(n, await run(`
  const targets = ['.pa-key-white .pa-key-marks', '.pa-screen .pa-big', '.pa-phone-btn', '.pa-zoom-label', '.pa-chord'];
  const out = [];
  for (const sel of targets) {
    const e = document.querySelector(sel); if (!e) { out.push(sel+': none'); continue; }
    const css = getComputedStyle(e); 
    // try to select its text the way a long press would
    const ev = new Event('selectstart', { bubbles: true, cancelable: true }); const allowed = e.dispatchEvent(ev);
    const range = document.createRange(); range.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(range);
    await new Promise(r=>setTimeout(r,60));
    out.push(sel.split(' ').pop()+': user-select '+(css.webkitUserSelect||css.userSelect)+', callout '+css.webkitTouchCallout+', selectstart '+(allowed?'ALLOWED':'blocked')+', selection kept '+(getSelection().toString().length>0));
  }
  const ctx = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); const ctxAllowed = document.querySelector('.pa-key-white').dispatchEvent(ctx);
  out.push('contextmenu on a key: '+(ctxAllowed?'ALLOWED':'blocked'));
  return out.join(' || ');`));
}
ws.close(); chrome.kill();
