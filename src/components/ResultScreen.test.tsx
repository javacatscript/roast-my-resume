import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultScreen } from '@/components/ResultScreen';
import type { GameCard } from '@/lib/game';

const card = (text: string, over: Partial<GameCard> = {}): GameCard => ({
  bullet: { id: 0, text, flags: [{ rule: 'weak-phrase', detail: 'x' }], score: 5 },
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
  it('shows before and after for every card', () => {
    render(<ResultScreen {...props([card('one'), card('two', { choice: 'original' })])} />);
    expect(screen.getAllByText('one').length).toBeGreaterThan(0);
    expect(screen.getByText('Better one')).toBeInTheDocument();
    expect(screen.getAllByText(/before/i)).toHaveLength(2);
    expect(screen.getAllByText(/after/i)).toHaveLength(2);
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
    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(click).toHaveBeenCalled();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('resume-roasted.txt');
  });

  it('calls onReset from Start over', async () => {
    const p = props([card('one')]);
    render(<ResultScreen {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(p.onReset).toHaveBeenCalled();
  });
});
