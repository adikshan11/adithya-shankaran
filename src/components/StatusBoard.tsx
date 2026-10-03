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
    <dl className="card mt-8 divide-y divide-line overflow-hidden">
      {profile.status.map((row) => (
        <div key={row.label} className="flex gap-4 px-5 py-3">
          <dt className="w-16 shrink-0 sm:w-20 font-mono text-xs leading-6 text-accent uppercase">{row.label}</dt>
          <dd className="text-[15px] leading-6">{row.text}</dd>
        </div>
      ))}
      {track && (
        <div className="flex items-center gap-4 px-5 py-3">
          <dt className="flex w-16 shrink-0 sm:w-20 items-center gap-1.5 font-mono text-xs text-accent uppercase">
            {track.playing && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />}
            {track.playing ? 'Playing' : 'Last'}
          </dt>
          <dd className="min-w-0">
            <a href={track.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-accent">
              {track.image && <img src={track.image} alt="" width={32} height={32} className="size-8 rounded" />}
              <span className="min-w-0 truncate text-[15px]">
                <span className="font-medium">{track.title}</span>
                <span className="text-muted"> · {track.artist}</span>
              </span>
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}
