import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('portfolio', () => {
  it('leads with the full name and working section links', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Adithya Shankaran' }).getAttribute('href')).toBe('#top');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('data foundations');
    for (const id of ['#experience', '#principles', '#projects', '#contact']) {
      expect(document.querySelector(id)).not.toBeNull();
    }
    for (const link of screen.getAllByRole('link', { name: 'Resume' })) {
      expect(link.getAttribute('href')).toContain('.pdf');
    }
  });

  it('opens the piano keys from the piano word', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'piano' }));
    expect(screen.getByRole('dialog', { name: 'Piano' })).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(13);
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