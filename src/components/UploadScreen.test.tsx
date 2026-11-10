import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/pdf', async () => {
  class NoTextLayerError extends Error {}
  return { NoTextLayerError, extractPdfText: vi.fn().mockRejectedValue(new NoTextLayerError()) };
});
import { UploadScreen } from '@/components/UploadScreen';
import { SAMPLE_RESUME } from '@/data/sampleResume';
import { MAX_RESUME_CHARS } from '@/lib/limits';

describe('UploadScreen', () => {
  it('renders a textarea, a PDF upload, the sample button and defaults to High', () => {
    render(<UploadScreen onStart={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByLabelText(/upload pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try the sample/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /high/i })).toBeChecked();
  });

  it('disables Start for empty text', () => {
    render(<UploadScreen onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /let's begin/i })).toBeDisabled();
  });

  it('starts with the sample resume at high intensity', async () => {
    const onStart = vi.fn();
    render(<UploadScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole('button', { name: /try the sample/i }));
    await userEvent.click(screen.getByRole('button', { name: /let's begin/i }));
    expect(onStart).toHaveBeenCalledWith(SAMPLE_RESUME, 'high');
  });

  it('passes the chosen intensity', async () => {
    const onStart = vi.fn();
    render(<UploadScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole('radio', { name: /mild/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '• Did a thing for many users' } });
    await userEvent.click(screen.getByRole('button', { name: /let's begin/i }));
    expect(onStart).toHaveBeenCalledWith('• Did a thing for many users', 'mild');
  });

  it('shows an error and disables Start when the text is over the limit', () => {
    render(<UploadScreen onStart={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(MAX_RESUME_CHARS + 1) } });
    expect(screen.getByRole('alert')).toHaveTextContent(/too long/i);
    expect(screen.getByRole('button', { name: /let's begin/i })).toBeDisabled();
  });

  it('shows the no-text-layer message for an image-only pdf', async () => {
    render(<UploadScreen onStart={() => {}} />);
    const input = screen.getByLabelText(/upload pdf/i);
    await userEvent.upload(input, new File(['x'], 'scan.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This PDF has no selectable text. Paste the text instead.',
    );
  });

  it('states the privacy line', () => {
    render(<UploadScreen onStart={() => {}} />);
    expect(
      screen.getByText("Your resume is sent to Groq to generate the roast. It isn't stored."),
    ).toBeInTheDocument();
  });
});
