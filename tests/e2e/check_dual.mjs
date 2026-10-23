// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9565', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9565/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
for (const [n,w,h,ua] of [['iPhone 16',393,852,IPHONE],['Galaxy S25',412,891,''],['iPad Air',820,1180,''],['iPhone SE',375,667,IPHONE],['sideways',852,393,'']]) {
  await send('Network.setUserAgentOverride', { userAgent: ua || 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36' });
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url }); await sleep(2500);
  await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2600));`);
  const rows = `const r=[...document.querySelectorAll('.pa-keybed')].filter(b=>b.offsetParent).map(b=>{const k=b.querySelector('.pa-keys').getBoundingClientRect(); const wk=b.querySelector('.pa-key-white').getBoundingClientRect(); const first=[...b.querySelectorAll('.pa-key-white')].find(e=>e.getBoundingClientRect().left>=b.getBoundingClientRect().left-1); return Math.round(k.top)+'-'+Math.round(k.bottom)+' keys '+Math.round(wk.width)+'x'+Math.round(wk.height)+' from '+(first?.getAttribute('aria-label')||'').replace('Play ','')}); return r.length+' row(s): '+r.join(' | ')+' (screen '+innerHeight+')'`;
  console.log(n.padEnd(11), 'normal   ', await run(rows));
  await run(`document.querySelector('.pa-fold').click(); ${W}900));`);
  console.log(n.padEnd(11), 'keys only', await run(rows));
  if (n === 'iPhone 16') {
    await shot('dual-iphone');
    const p = JSON.parse(await run(`const k=document.querySelector('.pa-keyrow2 .pa-key-white'); const all=[...document.querySelectorAll('.pa-keyrow2 .pa-key-white')]; const b=document.querySelector('.pa-keyrow2 .pa-keybed').getBoundingClientRect(); const v=all.find(e=>{const r=e.getBoundingClientRect(); return r.left>b.left+20&&r.right<b.right-20}); const r=v.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height*0.85,label:v.getAttribute('aria-label')})`));
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] }); await sleep(150);
    console.log('  tap upper row on', p.label, '-> lit:', await run(`return [...new Set([...document.querySelectorAll('.pa-key-down')].map(k=>k.getAttribute('aria-label')))].join(',')`));
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(150);
  }
}
ws.close(); chrome.kill();
