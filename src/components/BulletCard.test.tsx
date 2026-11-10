import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulletCard } from '@/components/BulletCard';
import { keepOriginalMock, ruleTip } from '@/lib/canned';
import type { GameCard } from '@/lib/game';

const base: GameCard = {
  bullet: { id: 0, text: 'Responsible for stuff', flags: [{ rule: 'weak-phrase', detail: 'x' }], score: 5 },
  status: 'ready', source: 'ai', roast: 'What are you DOING?', rewrite: 'Led a team of [N] engineers',
  choice: 'pending',
};

const props = () => ({
  intensity: 'high' as const,
  onChoose: vi.fn(),
  onEdit: vi.fn(),
  onNext: vi.fn(),
  reducedMotion: true,
});

describe('BulletCard', () => {
  it('shows the streaming roast and disables the choices while roasting', () => {
    render(<BulletCard card={{ ...base, status: 'roasting', rewrite: '', roast: 'What are' }} {...props()} />);
    expect(screen.getByText(/What are/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /keep rewrite/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /keep original/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
  });

  it('offers keyboard-focusable choices once ready and reports them', async () => {
    const p = props();
    render(<BulletCard card={base} {...p} />);
    const keep = screen.getByRole('button', { name: /keep rewrite/i });
    expect(keep).toBeEnabled();
    keep.focus();
    expect(keep).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: /keep original/i }));
    expect(p.onChoose).toHaveBeenCalledWith('original');
  });

  it('mocks the user after they keep the original', () => {
    render(<BulletCard card={{ ...base, choice: 'original' }} {...props()} />);
    expect(screen.getByText(keepOriginalMock('high'))).toBeInTheDocument();
  });

  it('lets the user save an inline edit', async () => {
    const p = props();
    render(<BulletCard card={base} {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    const box = screen.getByRole('textbox');
    await userEvent.clear(box);
    await userEvent.type(box, 'My version');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(p.onEdit).toHaveBeenCalledWith('My version');
  });

  it('shows the next button after a choice has been made', async () => {
    const p = props();
    render(<BulletCard card={{ ...base, choice: 'rewrite' }} {...p} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(p.onNext).toHaveBeenCalled();
  });

  it('labels a canned card as AI unavailable and shows the tip instead of a rewrite', () => {
    render(
      <BulletCard
        card={{ ...base, source: 'canned', rewrite: ruleTip('weak-phrase') }}
        {...props()}
      />,
    );
    expect(screen.getByText(/AI unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(ruleTip('weak-phrase'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /keep rewrite/i })).not.toBeInTheDocument();
  });

  it('marks the card as reduced-motion and applies no shake', () => {
    const { container } = render(<BulletCard card={base} {...props()} />);
    expect(container.querySelector('[data-reduced-motion="true"]')).not.toBeNull();
    expect(container.querySelector('[data-shake="true"]')).toBeNull();
  });
});
