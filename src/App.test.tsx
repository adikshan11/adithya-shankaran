import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { readFileSync } from 'node:fs';
import { PC_KEYS, detectChord } from './piano/arranger';
import { parseMidi, parseScore } from './piano/midi';
import { barLength, engrave, meterNamed } from './piano/notation';

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

  it('opens the 61-key arranger from the piano word and switches sounds', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'piano' }));
    const piano = await screen.findByRole('region', { name: 'Piano' }, { timeout: 8000 });
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(61);
    fireEvent.click(screen.getByRole('button', { name: 'Strings' }));
    expect(piano.textContent).toContain('String Ensemble');
    fireEvent.click(screen.getByRole('button', { name: 'Strings' }));
    expect(piano.textContent).toContain('Violin');
    fireEvent.click(screen.getByRole('button', { name: 'Indian' }));
    expect(piano.textContent).toContain('Keherwa');
    fireEvent.click(screen.getByRole('button', { name: 'Song' }));
    expect(piano.textContent).toContain('Song Book');
    expect(piano.textContent).toContain('Für Elise');
    expect(piano.textContent).toContain('Raga Hamsadhwani');
    fireEvent.click(screen.getByRole('button', { name: 'Close the curtain' }));
    expect(screen.queryByRole('region', { name: 'Piano' })).toBeNull();
  }, 20000);

  it('opens touch pages from the screen and sets any time signature', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'piano' }));
    const piano = await screen.findByRole('region', { name: 'Piano' }, { timeout: 8000 });
    fireEvent.click(screen.getByRole('button', { name: /UPPER/ }));
    expect(screen.getAllByRole('tab')).toHaveLength(12);
    fireEvent.click(screen.getByRole('tab', { name: 'Ethnic' }));
    fireEvent.click(screen.getByRole('button', { name: /Sitar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(piano.textContent).toContain('Sitar');
    fireEvent.click(screen.getByRole('button', { name: 'Metro' }));
    for (const label of ['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '3/8', '5/8', '6/8', '7/8', '9/8', '12/8']) {
      const button = [...piano.querySelectorAll('.pa-item')].find((item) => item.textContent === label)!;
      fireEvent.click(button);
      expect(piano.querySelector('.pa-screen-bar')!.textContent).toContain(`· ${label}`);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close the curtain' }));
  }, 20000);

  it('survives pressing every button on the panel and screen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'piano' }));
    const piano = await screen.findByRole('region', { name: 'Piano' }, { timeout: 8000 });
    for (const button of [...piano.querySelectorAll('button')]) fireEvent.click(button);
    for (const button of [...piano.querySelectorAll('button')]) fireEvent.click(button);
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(61);
    fireEvent.click(screen.getByRole('button', { name: 'Close the curtain' }));
  }, 20000);

  it('writes notes as semibreves, minims, crotchets, quavers and semiquavers, with ties and rests', () => {
    const four = meterNamed('4/4');
    expect(barLength(four)).toBe(16);
    expect(barLength(meterNamed('6/8'))).toBe(12);
    expect(barLength(meterNamed('12/8'))).toBe(24);
    expect(barLength(meterNamed('5/4'))).toBe(20);
    const values = (notes: { start: number; length: number; midi: number }[]) =>
      engrave(notes, 'treble', four, 0, 2).map((glyph) => `${glyph.kind}${glyph.value}${glyph.tie ? '~' : ''}`);
    expect(values([{ start: 0, length: 16, midi: 72 }])).toEqual(['note16', 'rest16']);
    expect(values([{ start: 0, length: 4, midi: 72 }, { start: 4, length: 8, midi: 74 }, { start: 12, length: 2, midi: 76 }, { start: 14, length: 1, midi: 77 }])).toEqual(['note4', 'note8', 'note2', 'note1', 'rest1', 'rest16']);
    expect(values([{ start: 0, length: 6, midi: 72 }, { start: 6, length: 3, midi: 74 }])).toEqual(['note6', 'note3', 'rest3', 'rest4', 'rest16']);
    expect(values([{ start: 12, length: 8, midi: 72 }])).toEqual(['rest8', 'rest4', 'note4~', 'note4', 'rest4', 'rest8']);
    expect(engrave([{ start: 0, length: 4, midi: 48 }], 'treble', four, 0, 1).every((glyph) => glyph.kind === 'rest')).toBe(true);
    expect(engrave([{ start: 0, length: 4, midi: 48 }], 'bass', four, 0, 1)[0]).toMatchObject({ kind: 'note', value: 4, midis: [48] });
  });

  it('reads the time signature from a score', () => {
    const file = readFileSync('public/songs/fur_Elise_WoO59.mid');
    const score = parseScore(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    expect(score.meter).toEqual({ beats: 3, unit: 8 });
  });

  it('reads public-domain MIDI scores into timed notes', () => {
    const file = readFileSync('public/songs/fur_Elise_WoO59.mid');
    const notes = parseMidi(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    expect(notes.length).toBeGreaterThan(200);
    expect(notes[0].midi).toBe(76);
    expect(notes[1].time).toBeGreaterThan(0.1);
    expect(notes[0].duration).toBeGreaterThan(0.1);
    expect(notes.at(-1)!.time).toBeGreaterThan(60);
  });

  it('maps two rows of computer keys to 32 consecutive notes', () => {
    const offsets = new Set(PC_KEYS.map(([, offset]) => offset));
    expect([...offsets].sort((a, b) => a - b)).toEqual(Array.from({ length: 32 }, (_, index) => index));
    expect(new Set(PC_KEYS.map(([code]) => code)).size).toBe(PC_KEYS.length);
    // , . / continue the bottom row on the same notes as Q W E
    const offsetOf = (code: string) => PC_KEYS.find(([key]) => key === code)?.[1];
    expect([offsetOf('Comma'), offsetOf('Period'), offsetOf('Slash')]).toEqual([offsetOf('KeyQ'), offsetOf('KeyW'), offsetOf('KeyE')]);
    // 3 and 4 are the black keys over Q W E, and L plays the same C# as 3
    expect([offsetOf('Digit3'), offsetOf('Digit4'), offsetOf('KeyL')]).toEqual([13, 15, 13]);
    expect(offsetOf('Digit2')).toBeUndefined();
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