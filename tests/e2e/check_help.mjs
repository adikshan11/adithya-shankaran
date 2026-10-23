// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9557', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9557/json')).json()).find((t) => t.type === 'page'); } catch {} }
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
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
const r = JSON.parse(await run(`const b=document.querySelector('.pa-help-btn').getBoundingClientRect(); return JSON.stringify({x:b.left+b.width/2,y:b.top+b.height/2})`));
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await sleep(500);
console.log('after ? click:', await run(`const c=document.querySelector('.pa-help-card'); return c ? 'help open, '+c.querySelectorAll('li').length+' tips, keymap '+!!c.querySelector('.pa-keymap')+', fits '+(c.getBoundingClientRect().bottom<=innerHeight) : 'no help'`));
await shot('help-desk');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(400);
console.log('after Esc:', await run(`return 'help '+!!document.querySelector('.pa-help')+', piano open '+!!document.querySelector('.pa-overlay')`));
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ';', code: 'Semicolon', windowsVirtualKeyCode: 186 }); await sleep(200);
console.log('; plays:', await run(`return [...document.querySelectorAll('.pa-key-down')].map(k=>k.getAttribute('aria-label')).join(',')`));
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ';', code: 'Semicolon', windowsVirtualKeyCode: 186 }); await sleep(200);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: '4', code: 'Digit4', windowsVirtualKeyCode: 52 }); await sleep(200);
console.log('4 plays:', await run(`return [...document.querySelectorAll('.pa-key-down')].map(k=>k.getAttribute('aria-label')).join(',')`));
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: '4', code: 'Digit4', windowsVirtualKeyCode: 52 }); await sleep(200);
// landscape phone: Help from the Panel
await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url }); await sleep(2500);
await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400)); document.querySelector('.pa-phone-panel').click(); ${W}700));`);
const h = JSON.parse(await run(`const b=[...document.querySelectorAll('.pa-btn-help')].find(e=>e.offsetParent); if(!b) return 'null'; const r=b.getBoundingClientRect(); return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2})`));
if (h) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: h.x, y: h.y }] }); await sleep(60); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(600); }
console.log('phone landscape Panel > Help:', h ? await run(`const c=document.querySelector('.pa-help-card'); return c ? 'help open, '+c.querySelectorAll('li').length+' tips, keymap '+!!c.querySelector('.pa-keymap kbd')?.offsetParent+', fits '+(c.getBoundingClientRect().bottom<=innerHeight+1)+', card scrolls inside '+(c.scrollHeight>c.clientHeight) : 'no help'`) : 'Help button not visible');
await shot('help-phone');
ws.close(); chrome.kill();
