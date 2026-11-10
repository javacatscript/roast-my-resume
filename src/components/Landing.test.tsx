import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/pdf', () => ({ NoTextLayerError: class extends Error {}, extractPdfText: vi.fn() }));
import { Landing } from '@/components/Landing';
import { SCANNER_CHECKS } from '@/data/checks';

describe('Landing', () => {
  it('has exactly one h1 and a labelled navigation', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: /main/i })).toBeInTheDocument();
  });

  it('keeps the upload form in the hero', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    expect(screen.getByRole('textbox', { name: /resume text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /let's begin/i })).toBeInTheDocument();
  });

  it('links to the public repo', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    const links = screen.getAllByRole('link', { name: /github/i });
    expect(links[0]).toHaveAttribute('href', 'https://github.com/javacatscript/roast-my-resume');
  });

  it('lists one real before and after example per scanner rule', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    expect(SCANNER_CHECKS).toHaveLength(5);
    for (const c of SCANNER_CHECKS) {
      expect(screen.getByText(c.after)).toBeInTheDocument();
      expect(c.before).toContain(c.hit);
    }
  });

  it('shows the four steps as an ordered list', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    const list = screen.getByRole('list', { name: /how it works/i });
    expect(list.tagName).toBe('OL');
    expect(list.children).toHaveLength(4);
  });

  it('still discloses that the text goes to Groq and is not stored', () => {
    render(<Landing onStart={() => {}} reducedMotion />);
    expect(screen.getByText(/sent to Groq to write the roast/i)).toBeInTheDocument();
  });

  it('shows the sample message passed in from a failed scan above the form', () => {
    render(<Landing onStart={() => {}} reducedMotion message="Couldn't find any bullets in that." />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't find any bullets/i);
  });

  it('vertically centers the hero demo against the headline and form column', () => {
    const { container } = render(<Landing onStart={() => {}} reducedMotion />);
    const grid = container.querySelector('h1')!.closest('section')!.firstElementChild!;
    expect(grid.className).toContain('lg:items-center');
    expect(grid.className).not.toContain('lg:items-start');
  });
});
