import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline/promises';

const redirect = 'http://127.0.0.1:8888/callback';
const scope = 'user-read-currently-playing user-read-recently-played';

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const id = (await prompt.question('Spotify Client ID: ')).trim();
const secret = (await prompt.question('Spotify Client secret: ')).trim();
prompt.close();

const server = createServer(async (request, response) => {
  const code = new URL(request.url, redirect).searchParams.get('code');
  if (!code) return response.end('No code');
  const token = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }),
  }).then((result) => result.json());
  response.end(token.refresh_token ? 'Connected. You can close this tab.' : 'Spotify did not return a token; check the terminal.');
  server.close();
  if (!token.refresh_token) {
    console.error('Spotify error:', token.error_description ?? token.error);
    process.exit(1);
  }
  const values = { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: token.refresh_token };
  for (const [name, value] of Object.entries(values)) {
    try {
      execSync(`npx --yes vercel@latest env rm ${name} production --yes`, { stdio: 'ignore' });
    } catch {}
    execSync(`npx --yes vercel@latest env add ${name} production`, { input: value, stdio: ['pipe', 'ignore', 'inherit'] });
    console.log(`Saved ${name} to Vercel`);
  }
  console.log('Redeploying...');
  execSync('npx --yes vercel@latest deploy --prod --yes', { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('Done. Check https://adithya-shankaran.vercel.app/api/now-playing');
});

server.listen(8888, '127.0.0.1', () => {
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: redirect, scope }).toString();
  console.log('Opening Spotify; click Agree.');
  execSync(`start "" "${url}"`, { shell: 'cmd.exe' });
});
