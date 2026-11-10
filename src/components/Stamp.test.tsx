import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stamp } from '@/components/Stamp';

describe('Stamp', () => {
  it('is announced as a verdict', () => {
    render(<Stamp label="Maybe pile" tone="mid" reducedMotion />);
    expect(screen.getByRole('img', { name: 'Verdict: Maybe pile' })).toBeInTheDocument();
  });

  it('shows its label text', () => {
    render(<Stamp label="Rejected" tone="bad" reducedMotion />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('records whether motion is reduced', () => {
    const { container, rerender } = render(<Stamp label="Rejected" tone="bad" reducedMotion />);
    expect(container.querySelector('[data-reduced-motion="true"]')).not.toBeNull();
    rerender(<Stamp label="Rejected" tone="bad" reducedMotion={false} />);
    expect(container.querySelector('[data-reduced-motion="false"]')).not.toBeNull();
  });
});
