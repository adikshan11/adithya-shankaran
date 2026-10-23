// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9536', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9536/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
for (const [name, w, h] of [['land390', 844, 390], ['land330', 844, 330], ['land293', 844, 293]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url }); await sleep(3000);
  await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,2400));`);
  await run(`document.querySelector('.pa-phone-panel').click(); await new Promise(r=>setTimeout(r,700));`);
  await run(`[...document.querySelectorAll('.pa-ctl-row .pa-btn')].find(b=>b.textContent.includes('Learn')).click(); await new Promise(r=>setTimeout(r,900));`);
  await run(`[...document.querySelectorAll('.pa-screen .pa-item')].find(x=>x.textContent.includes('Twinkle')).click(); await new Promise(r=>setTimeout(r,1800));`);
  console.log(name, 'after choosing Twinkle from Panel > Learn:', await run(`const k=document.querySelector('.pa-keys').getBoundingClientRect(); return JSON.stringify({panelOpen: !!document.querySelector('.pa-drawer-open'), sheetOpen: !!document.querySelector('.pa-sheet-open'), staff: !!document.querySelector('.pa-stand .pa-staff-svg'), keys: Math.round(k.top)+'-'+Math.round(k.bottom), viewport: innerHeight, scrolls: document.querySelector('.pa-overlay').scrollHeight > innerHeight + 1, target: [...document.querySelectorAll('.pa-key-target')].map(x=>x.getAttribute('aria-label'))})`));
  console.log(name, 'learn page:', await run(`const s=document.querySelector('.pa-screen').getBoundingClientRect(); const g=document.querySelector('.pa-screen .pa-grid'); const k=document.querySelector('.pa-keys').getBoundingClientRect(); return JSON.stringify({screen: Math.round(s.top)+'-'+Math.round(s.bottom), list: g ? g.clientHeight+'/'+g.scrollHeight : 'none', keys: Math.round(k.top)+'-'+Math.round(k.bottom), viewport: innerHeight, overlayScrolls: document.querySelector('.pa-overlay').scrollHeight > innerHeight + 1})`));
  await shot(`panellearn-${name}`);
  const r0 = 0; const r = await run(`const cells=[...document.querySelectorAll('.pa-screen .pa-cell')].map(c=>c.getBoundingClientRect()); const scr=document.querySelector('.pa-screen').getBoundingClientRect(); const cl=document.querySelector('.pa-overlay-close').getBoundingClientRect(); const split=[...document.querySelectorAll('.pa-ctl-row .pa-btn')].find(b=>b.textContent.includes('Split')).getBoundingClientRect(); const less=document.querySelector('.pa-phone-panel').getBoundingClientRect(); const midi=[...document.querySelectorAll('.pa-ctl-row .pa-btn')].find(b=>b.textContent.includes('MIDI')).getBoundingClientRect(); const extra={cellsInside: cells.every(c=>c.bottom <= scr.bottom - 4), closeVsSplit: Math.round(cl.top+cl.height/2)+'/'+Math.round(split.top+split.height/2), lessVsMidiBottom: Math.round(less.bottom)+'/'+Math.round(midi.bottom)}; const k=document.querySelector('.pa-keys'); const kb=k.getBoundingClientRect(); const c=document.querySelector('.pa-overlay-close'); const cb=c.getBoundingClientRect(); const groups=[...document.querySelectorAll('.pa-ctl-group')].filter(g=>g.offsetParent).map(g=>g.querySelector('.pa-label').textContent+':'+Math.round(g.getBoundingClientRect().top)); const panel=document.querySelector('.pa-panel'); return JSON.stringify({...extra, keysShown: !!k.offsetParent && kb.height > 50, keys: Math.round(kb.top)+'-'+Math.round(kb.bottom), viewport: innerHeight, closeShown: getComputedStyle(c).display !== 'none', panelBorder: getComputedStyle(panel).borderTopWidth, groups, startButtons: [...document.querySelectorAll('.pa-screen button')].filter(b=>b.offsetParent && /Start/.test(b.textContent)).length})`);
  console.log(name, r);
  await shot(`inline-${name}`);
}
ws.close(); chrome.kill();
