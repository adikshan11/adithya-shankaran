import { useEffect, useRef, useState } from 'react';
import GlassFilter, { useLens } from './GlassFilter';
import { MenuIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

const sections = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const lens = useLens(bar);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  return (
    <header className="segment fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
      <GlassFilter lens={lens} />
      <div ref={bar} data-lens={lens ? '' : undefined} className="glass mx-auto max-w-[calc(48rem-2.5rem)] rounded-[1.75rem] py-1.5 pr-1.5 pl-5">
        <div className="flex items-center justify-between">
          <a href="#top" className="text-sm font-bold tracking-tight" aria-label="Adithya Shankaran, back to top">
            adithya<span className="text-accent">.</span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm">
            <div className="hidden items-center gap-1 sm:flex">
              {sections.map((section) => (
                <a
                  key={section.href}
                  href={section.href}
                  className="rounded-full px-3 py-1.5 text-ink/75 transition hover:bg-accent-soft hover:text-accent"
                >
                  {section.label}
                </a>
              ))}
            </div>
            <ThemeToggle />
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-accent-soft hover:text-accent sm:hidden"
              aria-label="Menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
            >
              <MenuIcon open={open} className="size-5" />
            </button>
          </nav>
        </div>
        {open && (
          <nav id="mobile-menu" aria-label="Mobile navigation" className="flex flex-col pt-2 pb-2 pr-3 sm:hidden">
            {sections.map((section) => (
              <a
                key={section.href}
                href={section.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] text-ink transition hover:bg-accent-soft hover:text-accent"
              >
                {section.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
