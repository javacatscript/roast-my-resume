import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntensityToggle } from '@/components/IntensityToggle';

describe('IntensityToggle', () => {
  it('shows only the level names, with no hint text', () => {
    render(<IntensityToggle value="high" onChange={() => {}} />);
    for (const r of screen.getAllByRole('radio')) {
      expect(['Mild', 'Medium', 'High']).toContain(r.textContent);
    }
  });
});
