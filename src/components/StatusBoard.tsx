import { useEffect, useState } from 'react';
import { profile } from '../content';

type Track = { playing: boolean; title: string; artist: string; url: string; image?: string };

export default function StatusBoard() {
  const [track, setTrack] = useState<Track | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/now-playing')
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => active && setTrack(data))
        .catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <dl className="mt-8 space-y-3 rounded-2xl bg-now px-5 py-4 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_1px_1.5px_0_-0.5px_rgb(255_255_255/0.35)]">
      {profile.status.map((row, index) => (
        <div key={row.label}>
          <dt className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75 uppercase">
            {index === 0 && <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" aria-hidden="true" />}
            {row.label}
          </dt>
          <dd className="mt-0.5 leading-relaxed font-medium">{row.text}</dd>
        </div>
      ))}
      {track && (
        <div>
          <dt className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/75 uppercase">
            {track.playing && <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" aria-hidden="true" />}
            {track.playing ? 'Listening' : 'Last played'}
          </dt>
          <dd className="mt-1">
            <a href={track.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 hover:underline">
              {track.image && <img src={track.image} alt="" width={32} height={32} className="size-8 rounded" />}
              <span className="min-w-0 truncate">
                <span className="font-medium">{track.title}</span>
                <span className="text-white/75"> · {track.artist}</span>
              </span>
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}
