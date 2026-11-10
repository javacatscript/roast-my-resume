import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeatPicker, HEAT_SAMPLE } from '@/components/HeatPicker';
import { cannedRoast } from '@/lib/canned';

describe('HeatPicker', () => {
  it('starts on high and shows that roast for the sample bullet', () => {
    render(<HeatPicker />);
    expect(screen.getByRole('radio', { name: /high/i })).toBeChecked();
    expect(screen.getByText(cannedRoast(HEAT_SAMPLE, 'high'))).toBeInTheDocument();
  });

  it('swaps the roast when another level is picked', async () => {
    render(<HeatPicker />);
    await userEvent.click(screen.getByRole('radio', { name: /mild/i }));
    expect(screen.getByText(cannedRoast(HEAT_SAMPLE, 'mild'))).toBeInTheDocument();
    expect(screen.queryByText(cannedRoast(HEAT_SAMPLE, 'high'))).not.toBeInTheDocument();
    expect(cannedRoast(HEAT_SAMPLE, 'mild')).not.toBe(cannedRoast(HEAT_SAMPLE, 'high'));
  });
});
