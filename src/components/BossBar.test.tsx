import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BossBar } from '@/components/BossBar';

describe('BossBar', () => {
  it('shows the level counter and exposes progress semantics', () => {
    render(<BossBar current={3} total={8} />);
    expect(screen.getByText('Bullet 3 of 8')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '8');
  });
});
