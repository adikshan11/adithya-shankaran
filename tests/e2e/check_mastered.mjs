import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9621', '--user-data-dir=' + profile, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9621/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 300) : r.result?.result?.value; };
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url }); await sleep(3000);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) await new Promise(r=>setTimeout(r,50)); await new Promise(r=>setTimeout(r,2600));`);
for (const [name, wrong] of [['mastered', 0]]) {
  await run(`const done=document.querySelector('.pa-result .quiet'); if (done) done.click(); await new Promise(r=>setTimeout(r,200)); [...document.querySelectorAll('.pa-phone-btn')].find(b=>b.textContent.includes('Learn')).click(); await new Promise(r=>setTimeout(r,300)); const sp=[...document.querySelectorAll('.pa-screen button')].find(b=>b.textContent.trim()==='100%'); if (sp) sp.click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('.pa-item')].find(x=>x.textContent.includes('Twinkle')).click(); await new Promise(r=>setTimeout(r,1500));`);
  await run(`const press = async (k) => { k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:9})); await new Promise(r=>setTimeout(r,25)); k.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9})); await new Promise(r=>setTimeout(r,25)); };
    let wrong=${wrong};
    for (let i=0;i<200 && !document.querySelector('.pa-result');i++) { const t=document.querySelector('.pa-key-target'); if (!t) break; if (wrong > 0) { wrong--; await press(document.querySelector('[data-key="'+(Number(t.dataset.key)-1)+'"]')); continue; } await press(t); }
    await new Promise(r=>setTimeout(r,700));`);
  console.log(name, await run(`const c=document.querySelector('.pa-result'); return c ? c.className + ' | ' + c.querySelector('.pa-result-title').textContent + ' | stars ' + c.querySelectorAll('.pa-result-stars .on').length + ' | ' + c.querySelector('.pa-result-stats').innerText.split(String.fromCharCode(10)).join(' ') + ' | ' + (c.querySelector('.pa-result-reward, .pa-result-shame')?.textContent ?? '') + ' | buttons ' + [...c.querySelectorAll('button')].map(b=>b.textContent).join(', ') + ' | confetti ' + document.querySelectorAll('.pa-confetti i').length + ' | cat ' + document.querySelector('.pa-coach')?.className.replace('pa-coach pa-coach-','') : 'no result card'`));
  const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/result-${name}.png`, Buffer.from(s.result.data, 'base64'));
}
console.log('stars in the Learn list:', await run(`document.querySelector('.pa-result .quiet')?.click(); await new Promise(r=>setTimeout(r,200)); [...document.querySelectorAll('.pa-phone-btn')].find(b=>b.textContent.includes('Learn')).click(); await new Promise(r=>setTimeout(r,300)); return document.querySelector('.pa-item-stars')?.textContent ?? 'none'`));
ws.close(); chrome.kill();
