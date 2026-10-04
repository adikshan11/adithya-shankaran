import { useRef } from 'react';
import GlassFilter, { useLens } from './GlassFilter';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const bar = useRef<HTMLDivElement>(null);
  const lens = useLens(bar);

  return (
    <header className="segment fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
      <GlassFilter lens={lens} />
      <div ref={bar} data-lens={lens ? '' : undefined} className="glass mx-auto flex max-w-[calc(64rem-2.5rem)] items-center justify-between rounded-[1.75rem] py-2 pr-2 pl-5 sm:pl-6">
        <a href="#top" className="text-lg font-semibold tracking-tight whitespace-nowrap sm:text-2xl">
          Adithya Shankaran
        </a>
        <div className="flex items-center gap-1 text-sm">
          <a href="#principles" className="hidden rounded-full px-3 py-1.5 font-medium text-ink/80 transition hover:bg-accent-soft hover:text-accent sm:block">
            How I build
          </a>
          <a href="#contact" className="hidden rounded-full px-3 py-1.5 font-medium text-ink/80 transition hover:bg-accent-soft hover:text-accent sm:block">
            Let’s connect
          </a>
          <a href="/Adithya_Shankaran_Resume.pdf" className="rounded-full px-3 py-1.5 font-medium text-ink/80 transition hover:bg-accent-soft hover:text-accent">
            Resume
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
