// Panel open on phones: landscape keeps the keys and swaps the controls beside the screen; portrait shows no panel box.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [, , url, outDir, profile] = process.argv;
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [...(process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), '--headless=new', '--remote-debugging-port=9555', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch('http://127.0.0.1:9555/json')).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true, userGesture: true }); return r.result?.exceptionDetails ? 'ERROR ' + r.result.exceptionDetails.exception?.description?.slice(0, 160) : r.result?.result?.value; };
const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(s.result.data, 'base64')); };
await send('Page.enable');
const W = 'await new Promise(r=>setTimeout(r,';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const DESK = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
// [name, w, h (portrait for phones/tablets), kind, ua, both orientations?]
const devices = [
  ['iPhone SE', 375, 667, 'phone', IPHONE, 1], ['iPhone 16', 393, 852, 'phone', IPHONE, 1], ['iPhone 16 Pro Max', 440, 956, 'phone', IPHONE, 1],
  ['Galaxy S25 Ultra', 412, 891, 'phone', ANDROID, 1], ['Galaxy Z Fold folded', 344, 882, 'phone', ANDROID, 1], ['Galaxy Z Fold open', 884, 1104, 'tablet', ANDROID, 1],
  ['Galaxy Z Flip open', 412, 997, 'phone', ANDROID, 1], ['Surface Duo single', 540, 720, 'phone', ANDROID, 1], ['Surface Duo dual', 1114, 720, 'tablet', ANDROID, 0],
  ['iPad mini', 744, 1133, 'tablet', IPAD, 1], ['iPad Air', 820, 1180, 'tablet', IPAD, 1], ['iPad Pro 11', 834, 1194, 'tablet', IPAD, 1], ['iPad Pro 13', 1032, 1376, 'tablet', IPAD, 1],
  ['Galaxy Tab S9', 800, 1280, 'tablet', ANDROID, 1], ['Xiaomi Pad 6', 750, 1200, 'tablet', ANDROID, 1],
  ['MacBook Air 13', 1470, 830, 'desk', DESK, 0], ['MacBook Pro 14', 1512, 860, 'desk', DESK, 0], ['MacBook Pro 16', 1728, 990, 'desk', DESK, 0], ['iMac 24', 2240, 1140, 'desk', DESK, 0],
  ['Windows 13in', 1280, 650, 'desk', DESK, 0], ['Windows 14in', 1536, 730, 'desk', DESK, 0], ['Windows 16in', 1536, 830, 'desk', DESK, 0], ['Windows 17in', 1920, 950, 'desk', DESK, 0], ['Monitor 27in', 2560, 1300, 'desk', DESK, 0],
];
const probe = `const vw=innerWidth, vh=innerHeight; const o=document.querySelector('.pa-overlay');
  const vis=(e)=>{ if(!e.offsetParent && getComputedStyle(e).position!=='fixed') return false; const r=e.getBoundingClientRect(); return r.width>2&&r.height>2; };
  const btns=[...document.querySelectorAll('.pa-btn, .pa-phone-btn, .pa-touch, .pa-tab, .pa-overlay-close, .pa-fold, .pa-zoom input')].filter(vis).filter(e=>!e.closest('.pa-tear'));
  const off=btns.filter(e=>{const r=e.getBoundingClientRect(); return r.right>vw+1||r.left<-1||r.top<-1;}).map(e=>(e.innerText||e.className).trim().slice(0,12));
  const rs=btns.map(e=>[e,e.getBoundingClientRect()]); const over=[];
  for(let i=0;i<rs.length;i++) for(let j=i+1;j<rs.length;j++){ const [a,ra]=rs[i],[b,rb]=rs[j]; if(a.contains(b)||b.contains(a)) continue; const x=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left), y=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top); if(x>3&&y>3) over.push((a.innerText||a.className).trim().slice(0,10)+'~'+(b.innerText||b.className).trim().slice(0,10)); }
  const k=document.querySelector('.pa-keys').getBoundingClientRect(); const wk=document.querySelector('.pa-key-white').getBoundingClientRect();
  const ov=document.querySelector('.pa-overlay'); return JSON.stringify({vscroll: ov.scrollHeight > ov.clientHeight + 2, layout: document.querySelector('.pa-instrument').dataset.layout, hscroll: Math.max(document.documentElement.scrollWidth, o.scrollWidth) > vw+1, keys: Math.round(k.top)+'-'+Math.round(k.bottom), keysOnScreen: k.bottom <= vh+1 && k.top < vh-80, white: Math.round(wk.width)+'x'+Math.round(wk.height), zoom: document.querySelector('.pa-stage').style.zoom||'1', offscreen: off, overlaps: over.slice(0,6)});`;
const results = [];
for (const [name, pw, ph, kind, ua, both] of devices) {
  const shapes = kind === 'desk' ? [[pw, ph, '']] : both ? [[pw, ph, 'portrait'], [ph, pw, 'landscape']] : [[pw, ph, '']];
  for (const [w, h, orient] of shapes) {
    await send('Network.setUserAgentOverride', { userAgent: ua });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: kind === 'desk' ? 1 : 2, mobile: kind !== 'desk', screenWidth: w, screenHeight: h });
    await send('Emulation.setTouchEmulationEnabled', { enabled: kind !== 'desk', maxTouchPoints: kind !== 'desk' ? 5 : 0 });
    await send('Page.navigate', { url }); await sleep(2500);
    await run(`document.querySelector('[aria-controls="piano-stage"]').click(); for (let i=0;i<120&&!document.querySelector('.pa-tear.pa-go');i++) ${W}50)); ${W}2400));`);
    const label = `${name}${orient ? ' ' + orient : ''} ${w}x${h}`;
    const r = await run(probe);
    results.push(label + ' ' + r);
    console.log(label, r);
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 60 }); writeFileSync(`${outDir}/${label.replace(/[^a-z0-9]+/gi, '_')}.jpg`, Buffer.from(s.result.data, 'base64'));
  }
}
ws.close(); chrome.kill();
