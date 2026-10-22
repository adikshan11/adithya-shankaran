import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { detectChord } from './piano/arranger';

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

  it('opens the 61-key arranger from the piano word and switches sounds', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'piano' }));
    const piano = screen.getByRole('region', { name: 'Piano' });
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(61);
    fireEvent.click(screen.getByRole('button', { name: 'Strings' }));
    expect(piano.textContent).toContain('String Ensemble');
    fireEvent.click(screen.getByRole('button', { name: 'Strings' }));
    expect(piano.textContent).toContain('Pizzicato');
    fireEvent.click(screen.getByRole('button', { name: 'Close the lid' }));
    expect(screen.queryByRole('region', { name: 'Piano' })).toBeNull();
  });

  it('recognises chords from the left hand', () => {
    expect(detectChord([57, 60, 64])).toEqual({ root: 9, type: 'm' });
    expect(detectChord([43, 47, 50, 53])).toEqual({ root: 7, type: '7' });
    expect(detectChord([50])).toEqual({ root: 2, type: '' });
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