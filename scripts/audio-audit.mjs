// Audio audit: starts the dev server, opens it in headless Chrome with real audio processing, runs
// scripts/audio-audit.page.js against the real engine, prints every result, and exits 1 if anything fails.
// Usage: npm run audit:audio   (needs Google Chrome; set CHROME to its path if it is elsewhere)
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome');
const port = 5199;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { shell: true, stdio: 'ignore' });
const profile = mkdtempSync(join(tmpdir(), 'audio-audit-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9399', `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });

let exitCode = 1;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/`)).ok) break;
    } catch {}
    await sleep(500);
  }
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      target = (await (await fetch('http://127.0.0.1:9399/json')).json()).find((item) => item.type === 'page');
    } catch {}
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve));
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    pending.set(++id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:${port}/` });
  await sleep(3000);
  const code = readFileSync(new URL('./audio-audit.page.js', import.meta.url), 'utf8');
  const reply = await send('Runtime.evaluate', { expression: `(async () => {${code}})()`, awaitPromise: true, returnByValue: true, userGesture: true, timeout: 600000 });
  const results = reply.result?.result?.value;
  if (!Array.isArray(results)) {
    console.error('Audit did not finish:', JSON.stringify(reply.result?.exceptionDetails ?? reply).slice(0, 1500));
  } else {
    let area = '';
    for (const item of results) {
      if (item.area !== area) console.log(`\n${(area = item.area)}`);
      console.log(`  ${item.pass ? 'pass' : 'FAIL'}  ${item.name}${item.detail ? `  (${item.detail})` : ''}`);
    }
    const failed = results.filter((item) => !item.pass);
    console.log(`\n${results.length - failed.length} of ${results.length} checks pass`);
    exitCode = failed.length ? 1 : 0;
  }
  socket.close();
} finally {
  chrome.kill();
  server.kill();
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
process.exit(exitCode);
