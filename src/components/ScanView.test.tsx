import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScanView } from '@/components/ScanView';

const text = '• Responsible for managing the release process\n• Helped with speed';

describe('ScanView', () => {
  it('announces the scan', () => {
    render(<ScanView text={text} reducedMotion />);
    expect(screen.getByRole('status')).toHaveTextContent(/scanning/i);
  });

  it('burns up the page when motion is allowed', () => {
    const { container } = render(<ScanView text={text} reducedMotion={false} />);
    expect(container.querySelector('[data-burn]')).not.toBeNull();
  });

  it('shows the plain page, with no burn, under reduced motion', () => {
    const { container } = render(<ScanView text={text} reducedMotion />);
    expect(container.querySelector('[data-burn]')).toBeNull();
    expect(container).toHaveTextContent('Responsible for managing the release process');
  });
});
