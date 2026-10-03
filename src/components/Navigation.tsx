import ThemeToggle from './ThemeToggle';

const sections = [
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export default function Navigation() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="glass flex w-full max-w-3xl items-center justify-between rounded-full py-1.5 pr-1.5 pl-5">
        <a href="#top" className="text-sm font-bold tracking-tight" aria-label="Adithya Shankaran, back to top">
          adithya<span className="text-accent">.</span>
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-full px-3 py-1.5 text-muted transition hover:bg-accent-soft hover:text-accent"
            >
              {section.label}
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
