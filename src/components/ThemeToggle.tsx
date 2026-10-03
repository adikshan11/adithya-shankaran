import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export default function ThemeToggle() {
  const [preference, setPreference] = useState(savedTheme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const theme = preference ?? (systemDark ? 'dark' : 'light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function updateSystem(event: MediaQueryListEvent) {
      setSystemDark(event.matches);
    }
    media.addEventListener('change', updateSystem);
    return () => media.removeEventListener('change', updateSystem);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#181818' : '#fafafa',
    );
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setPreference(next);
    try {
      localStorage.setItem('theme', next);
    } catch {}
  }

  return (
    <button className="theme-toggle" type="button" aria-label="Dark theme"
      aria-pressed={theme === 'dark'} onClick={toggleTheme}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        {theme === 'dark' ? (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
        ) : <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />}
      </svg>
    </button>
  );
}