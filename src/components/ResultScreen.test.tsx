import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultScreen } from '@/components/ResultScreen';
import type { GameCard } from '@/lib/game';

const card = (text: string, over: Partial<GameCard> = {}): GameCard => ({
  bullet: { id: 0, text, start: 0, end: text.length, flags: [{ rule: 'weak-phrase', detail: 'x' }], score: 5 },
  status: 'ready', source: 'ai', roast: 'r', rewrite: `Better ${text}`, choice: 'rewrite',
  ...over,
});

const props = (cards: GameCard[]) => ({
  cards,
  originalText: '• one\n• two',
  finalText: '• Better one\n• two',
  onReset: vi.fn(),
});

afterEach(() => vi.restoreAllMocks());

describe('ResultScreen', () => {
  it('shows before and after for a changed bullet, and just the text for one kept as written', () => {
    render(<ResultScreen {...props([card('one'), card('two', { choice: 'original' })])} />);
    expect(screen.getByText('Better one')).toBeInTheDocument();
    expect(screen.getAllByText('Before')).toHaveLength(1);
    expect(screen.getAllByText('After')).toHaveLength(1);
    expect(screen.getByText('Kept as written')).toBeInTheDocument();
    expect(screen.getAllByText('two')).toHaveLength(1);
  });

  it('does not strike through a bullet that was kept', () => {
    const { container } = render(<ResultScreen {...props([card('two', { choice: 'original' })])} />);
    expect(container.querySelector('.line-through')).toBeNull();
  });

  it('badges only ai rewrites that were kept, not canned or original', () => {
    render(
      <ResultScreen
        {...props([
          card('one'),
          card('two', { source: 'canned' }),
          card('three', { choice: 'original' }),
        ])}
      />,
    );
    expect(screen.getAllByText('AI rewrite')).toHaveLength(1);
  });

  it('copies the final text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ResultScreen {...props([card('one')])} />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(writeText).toHaveBeenCalledWith('• Better one\n• two');
  });

  it('downloads resume-roasted.txt', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<ResultScreen {...props([card('one')])} />);
    await userEvent.click(screen.getByRole('button', { name: /download \.txt/i }));
    expect(click).toHaveBeenCalled();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('resume-roasted.txt');
  });

  it('downloads resume-roasted.pdf', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<ResultScreen {...props([card('one')])} />);
    await userEvent.click(screen.getByRole('button', { name: /download pdf/i }));
    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    const anchor = click.mock.contexts.at(-1) as HTMLAnchorElement;
    expect(anchor.download).toBe('resume-roasted.pdf');
  });

  it('calls onReset from Start over', async () => {
    const p = props([card('one')]);
    render(<ResultScreen {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(p.onReset).toHaveBeenCalled();
  });

  it('skips the praise card and says there was nothing to fix when that is all there is', () => {
    const praise: GameCard = {
      bullet: { id: 0, text: 'Your resume, which turned out to be fine.', start: 0, end: 0, flags: [], score: 0 },
      status: 'ready', source: 'canned', roast: 'r', rewrite: 't', choice: 'pending',
    };
    render(<ResultScreen {...props([praise])} />);
    expect(screen.queryByText('Your resume, which turned out to be fine.')).not.toBeInTheDocument();
    expect(screen.getByText(/nothing to fix/i)).toBeInTheDocument();
  });

  it('stamps a verdict on a cover sheet with the counts', () => {
    render(<ResultScreen {...props([card('one'), card('two'), card('three'), card('four', { choice: 'original' })])} />);
    expect(screen.getByRole('img', { name: 'Verdict: Shortlisted' })).toBeInTheDocument();
    expect(screen.getByText(/3 of 4 bullets changed/i)).toBeInTheDocument();
  });

  it('stamps rejected when most originals were kept', () => {
    render(<ResultScreen {...props([card('one', { choice: 'original' }), card('two', { choice: 'original' })])} />);
    expect(screen.getByRole('img', { name: 'Verdict: Rejected' })).toBeInTheDocument();
  });
});
