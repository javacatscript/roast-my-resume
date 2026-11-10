import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ThemeToggle';

beforeEach(() => {
  document.documentElement.dataset.theme = 'dark';
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe('ThemeToggle', () => {
  it('offers to switch to light when the page is dark', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it('switches the theme, stores it, and updates its label', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('rr-theme')).toBe('light');
    expect(await screen.findByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('still switches when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
