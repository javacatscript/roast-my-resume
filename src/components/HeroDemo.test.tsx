import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroDemo, DEMO } from '@/components/HeroDemo';

describe('HeroDemo', () => {
  it('describes the whole before and after for assistive tech', () => {
    render(<HeroDemo reducedMotion />);
    const img = screen.getByRole('img', { name: new RegExp(DEMO.bad.slice(0, 20)) });
    expect(img).toHaveAccessibleName(new RegExp(DEMO.rewrite.slice(0, 20)));
  });

  it('holds the finished frame under reduced motion: struck original, roast and rewrite all visible', () => {
    render(<HeroDemo reducedMotion />);
    expect(screen.getByText(DEMO.bad)).toBeInTheDocument();
    expect(screen.getByText(DEMO.roast)).toBeInTheDocument();
    expect(screen.getByText(DEMO.rewrite)).toBeInTheDocument();
  });

  it('starts clean when motion is allowed: no roast or rewrite yet', () => {
    render(<HeroDemo reducedMotion={false} />);
    expect(screen.queryByText(DEMO.rewrite)).not.toBeInTheDocument();
    expect(screen.queryByText(DEMO.roast)).not.toBeInTheDocument();
    expect(screen.getByText(DEMO.bad)).toBeInTheDocument();
  });

  it('sits square on the page, with no rotation', () => {
    const { container } = render(<HeroDemo reducedMotion />);
    expect(container.innerHTML).not.toMatch(/rotate-\[|-rotate-|\brotate-\d/);
  });
});
