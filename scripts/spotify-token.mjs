import { createServer } from 'node:http';

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
const redirect = 'http://127.0.0.1:8888/callback';
const scope = 'user-read-currently-playing user-read-recently-played';

if (!id || !secret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.');
  process.exit(1);
}

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
  console.log(`\nSPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`);
  response.end('Done. Copy the refresh token from the terminal.');
  server.close();
});

server.listen(8888, '127.0.0.1', () => {
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: redirect, scope }).toString();
  console.log(`Open this URL and approve:\n${url}`);
});
