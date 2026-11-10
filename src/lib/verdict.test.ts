import { describe, it, expect } from 'vitest';
import { verdict } from '@/lib/verdict';
import type { GameCard } from '@/lib/game';

const card = (over: Partial<GameCard> = {}): GameCard => ({
  bullet: { id: 0, text: 'x', start: 0, end: 1, flags: [{ rule: 'no-metric', detail: '' }], score: 2 },
  status: 'ready', source: 'ai', roast: 'r', rewrite: 'w', choice: 'rewrite', ...over,
});
const many = (n: number, over: Partial<GameCard>) => Array.from({ length: n }, () => card(over));

describe('verdict', () => {
  it('calls an empty or praise-only run clean paper', () => {
    expect(verdict([]).label).toBe('Clean paper');
    const praise = card({ bullet: { id: 0, text: 'x', start: 0, end: 0, flags: [], score: 0 }, source: 'canned', choice: 'pending' });
    expect(verdict([praise]).label).toBe('Clean paper');
    expect(verdict([praise]).total).toBe(0);
  });

  it('rejects when half or more of the originals were kept', () => {
    const v = verdict([...many(2, { choice: 'original' }), ...many(2, { choice: 'rewrite' })]);
    expect(v).toMatchObject({ label: 'Rejected', tone: 'bad', total: 4, changed: 2 });
  });

  it('shortlists when at least three quarters changed', () => {
    const v = verdict([...many(3, { choice: 'rewrite' }), ...many(1, { choice: 'original' })]);
    expect(v).toMatchObject({ label: 'Shortlisted', tone: 'good', changed: 3 });
  });

  it('puts the middle in the maybe pile', () => {
    const v = verdict([...many(2, { choice: 'rewrite' }), ...many(1, { choice: 'pending' }), ...many(1, { choice: 'original' })]);
    expect(v.label).toBe('Maybe pile');
    expect(v.tone).toBe('mid');
  });

  it('counts edits as changes but not a canned tip chosen as a rewrite', () => {
    const v = verdict([card({ choice: 'edited', edited: 'mine' }), card({ source: 'canned', choice: 'rewrite' })]);
    expect(v.changed).toBe(1);
    expect(v.total).toBe(2);
  });
});
