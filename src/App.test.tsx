import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('portfolio', () => {
  it('leads with the full name and working section links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Adithya Shankaran');
    for (const label of ['Experience', 'Projects', 'Contact']) {
      const link = screen.getByRole('link', { name: label });
      expect(document.querySelector(link.getAttribute('href')!)).not.toBeNull();
    }
    expect(screen.getByRole('link', { name: 'Resume' }).getAttribute('href')).toContain('.pdf');
  });

  it('persists the theme and restores it on the next visit', () => {
    const view = render(<App />);
    const toggle = screen.getByRole('button', { name: 'Dark theme' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    view.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Dark theme' }).getAttribute('aria-pressed')).toBe('true');
  });
});