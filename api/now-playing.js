async function accessToken() {
  const credentials = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.SPOTIFY_REFRESH_TOKEN ?? '' }),
  });
  if (!response.ok) throw new Error(`token ${response.status}`);
  return (await response.json()).access_token;
}

function trackOf(item) {
  return {
    title: item.name,
    artist: item.artists.map((artist) => artist.name).join(', '),
    url: item.external_urls.spotify,
    image: item.album.images.at(-1)?.url,
  };
}

export async function GET() {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' };
  try {
    const token = await accessToken();
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const current = await fetch('https://api.spotify.com/v1/me/player/currently-playing', auth);
    if (current.status === 200) {
      const body = await current.json();
      if (body.item?.type === 'track') {
        return new Response(JSON.stringify({ playing: body.is_playing, ...trackOf(body.item) }), { headers });
      }
    }
    const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', auth);
    const item = (await recent.json()).items?.[0]?.track;
    if (!item) return new Response('null', { headers });
    return new Response(JSON.stringify({ playing: false, ...trackOf(item) }), { headers });
  } catch {
    return new Response('null', { status: 502, headers });
  }
}
