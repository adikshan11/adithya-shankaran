// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new --autoplay-policy=no-user-gesture-required', '--remote-debugging-port=9561', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9561/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
await send('Emulation.setDeviceMetricsOverride', { width: 852, height: 393, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__ctxs = []; window.__an = new Map();
  const Orig = window.AudioContext;
  window.AudioContext = class extends Orig { constructor(...a) { super(...a); window.__ctxs.push(this); } };
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (target, ...rest) {
    const out = connect.call(this, target, ...rest);
    if (target instanceof AudioDestinationNode) {
      const ctx = this.context; let an = window.__an.get(ctx);
      if (!an) { an = ctx.createAnalyser(); an.fftSize = 2048; window.__an.set(ctx, an); }
      try { connect.call(this, an); } catch {}
    }
    return out;
  };
  window.__level = () => { const ctx = window.__ctxs.at(-1); const an = ctx && window.__an.get(ctx); if (!an) return -1; const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let m = 0; for (const v of d) m = Math.max(m, Math.abs(v)); return m; };
` });
await send('Page.navigate', { url }); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}3000));`);
const tapKey = async () => {
  const p = JSON.parse(await run(`const k=document.querySelector('.pa-key[aria-label="Play C4"]'); const r=k.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height*0.8})`));
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  let peak = 0;
  for (let i = 0; i < 12; i++) { await sleep(40); const v = await run(`return window.__level()`); peak = Math.max(peak, Number(v) || 0); }
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(300);
  const info = await run(`const c=window.__ctxs.at(-1); return 'contexts made '+window.__ctxs.length+', current '+c?.state`);
  return Math.round(peak*1000)/1000 + ' (' + info + ')';
};
const setVis = (state) => run(`Object.defineProperty(document, 'visibilityState', { value: '${state}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${state === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange'));`);
const clickBtn = (label) => run(`const b=[...document.querySelectorAll('.pa-btn, .pa-phone-btn')].find(e=>e.textContent.includes('${label}') && e.offsetParent); if (b) b.click(); return !!b`);
await run(`document.querySelector('.pa-phone-panel').click(); await new Promise(r=>setTimeout(r,500));`);
console.log('Rec pressed:', await clickBtn('Rec'));
await run(`document.querySelector('.pa-phone-panel').click(); await new Promise(r=>setTimeout(r,500));`);
console.log('recording, notes:', await tapKey(), await tapKey(), await tapKey());
await setVis('hidden'); await sleep(1500);
console.log('after leaving mid-take:', await run(`return 'Rec button: ' + ([...document.querySelectorAll('.pa-btn')].find(e=>e.textContent.includes('Rec'))?.textContent ?? '?') + ' | message: ' + (document.querySelector('.pa-message')?.textContent ?? document.querySelector('.pa-screen')?.innerText.slice(0,120))`));
const takes = await run(`const db = await new Promise(r => { const q = indexedDB.open('piano-takes', 1); q.onsuccess = () => r(q.result); }); const all = await new Promise(r => { const q = db.transaction('takes').objectStore('takes').getAll(); q.onsuccess = () => r(q.result); }); return all.map(t => t.name + ': ' + t.events.filter(e=>e.type==='on').length + ' notes, ' + t.audio.size + ' bytes audio, ' + t.duration.toFixed(1) + ' s').join(' | ')`);
console.log('saved takes:', takes);
await setVis('visible'); await sleep(500);
console.log('back, first tap:', await tapKey());
ws.close(); chrome.kill();
