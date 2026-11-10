import { describe, it, expect } from 'vitest';
import { gameReducer, initialState, applyChoices, type GameCard, type GameState } from '@/lib/game';
import { scanResume } from '@/lib/scanner';
import { ruleTip } from '@/lib/canned';

const flaggedScan = () =>
  scanResume('• Responsible for managing the release process\n• Helped with improving website speed');

const playing = (): GameState =>
  gameReducer(
    gameReducer(initialState, { type: 'start-scan', intensity: 'high' }),
    { type: 'scan-done', result: flaggedScan() },
  );

const ready = (s: GameState, i = 0): GameState =>
  gameReducer(s, { type: 'card-ready', index: i, roast: 'Bad.', rewrite: 'Better.' });

describe('gameReducer', () => {
  it('start-scan enters the scanning phase with the chosen intensity', () => {
    const s = gameReducer(initialState, { type: 'start-scan', intensity: 'mild' });
    expect(s.phase).toBe('scanning');
    expect(s.intensity).toBe('mild');
  });

  it('scan-done with flagged bullets starts playing with queued cards at index 0', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.index).toBe(0);
    expect(s.cards).toHaveLength(2);
    expect(s.cards.every((c) => c.status === 'queued' && c.choice === 'pending')).toBe(true);
  });

  it('scan-done on a clean resume produces a single ready canned praise card', () => {
    const clean = scanResume('• Cut p95 latency 38% by caching hot queries');
    const s = gameReducer(
      gameReducer(initialState, { type: 'start-scan', intensity: 'high' }),
      { type: 'scan-done', result: clean },
    );
    expect(s.phase).toBe('playing');
    expect(s.cards).toHaveLength(1);
    expect(s.cards[0]).toMatchObject({ status: 'ready', source: 'canned' });
    expect(s.cards[0].roast.length).toBeGreaterThan(10);
  });

  it('delta updates the streaming text and marks the card roasting', () => {
    const s = gameReducer(playing(), { type: 'delta', index: 0, roast: 'Hel', rewrite: '' });
    expect(s.cards[0]).toMatchObject({ status: 'roasting', roast: 'Hel' });
  });

  it('card-ready stores an ai result', () => {
    const s = ready(playing());
    expect(s.cards[0]).toMatchObject({ status: 'ready', source: 'ai', roast: 'Bad.', rewrite: 'Better.' });
  });

  it('card-fallback with disableAi turns AI off, sets a notice and shows the rule tip', () => {
    const s = gameReducer(playing(), {
      type: 'card-fallback',
      index: 0,
      roast: 'Canned roast.',
      tip: ruleTip('weak-phrase'),
      disableAi: true,
      notice: 'AI is unavailable.',
    });
    expect(s.aiAvailable).toBe(false);
    expect(s.notice).toBe('AI is unavailable.');
    expect(s.cards[0]).toMatchObject({
      status: 'ready',
      source: 'canned',
      roast: 'Canned roast.',
      rewrite: ruleTip('weak-phrase'),
    });
  });

  it('card-fallback without disableAi keeps AI available', () => {
    const s = gameReducer(playing(), {
      type: 'card-fallback', index: 0, roast: 'x', tip: 'y', disableAi: false,
    });
    expect(s.aiAvailable).toBe(true);
  });

  it('choose is ignored until the card is ready', () => {
    const s = gameReducer(playing(), { type: 'choose', choice: 'original' });
    expect(s.cards[0].choice).toBe('pending');
  });

  it('keeps the first choice when choose is dispatched twice', () => {
    let s = ready(playing());
    s = gameReducer(s, { type: 'choose', choice: 'rewrite' });
    s = gameReducer(s, { type: 'choose', choice: 'original' });
    expect(s.cards[0].choice).toBe('rewrite');
  });

  it('edit records the text and marks the card edited', () => {
    let s = ready(playing());
    s = gameReducer(s, { type: 'edit', text: 'My own version' });
    expect(s.cards[0]).toMatchObject({ choice: 'edited', edited: 'My own version' });
  });

  it('next advances, and on the last card finishes the game', () => {
    let s = ready(playing());
    s = gameReducer(s, { type: 'next' });
    expect(s.index).toBe(1);
    expect(s.phase).toBe('playing');
    s = ready(s, 1);
    s = gameReducer(s, { type: 'next' });
    expect(s.phase).toBe('done');
  });

  it('reset returns to the initial state', () => {
    expect(gameReducer(ready(playing()), { type: 'reset' })).toEqual(initialState);
  });
});

describe('applyChoices', () => {
  const card = (text: string, over: Partial<GameCard>): GameCard => ({
    bullet: { id: 0, text, flags: [], score: 1 },
    status: 'ready', source: 'ai', roast: 'r', rewrite: 'NEW', choice: 'rewrite',
    ...over,
  });

  it('swaps in the ai rewrite when it was chosen', () => {
    expect(applyChoices('• Did a thing\n• Other', [card('Did a thing', {})])).toBe('• NEW\n• Other');
  });

  it('uses edited text for edited cards', () => {
    expect(applyChoices('• Did a thing', [card('Did a thing', { choice: 'edited', edited: 'Mine' })])).toBe('• Mine');
  });

  it('leaves original and pending choices alone', () => {
    const t = '• Did a thing';
    expect(applyChoices(t, [card('Did a thing', { choice: 'original' })])).toBe(t);
    expect(applyChoices(t, [card('Did a thing', { choice: 'pending' })])).toBe(t);
  });

  it('never swaps in a canned tip as if it were a rewrite', () => {
    const t = '• Did a thing';
    expect(applyChoices(t, [card('Did a thing', { source: 'canned', choice: 'rewrite' })])).toBe(t);
  });

  it('matches bullets that were wrapped across lines', () => {
    const t = '• Reduced the cost of cloud\n  infrastructure across regions';
    const c = card('Reduced the cost of cloud infrastructure across regions', {});
    expect(applyChoices(t, [c])).toBe('• NEW');
  });

  it('handles regex characters and $ patterns safely', () => {
    const t = '• Saved $1.5M (est.) [Q3]';
    const c = card('Saved $1.5M (est.) [Q3]', { rewrite: 'Saved $& more' });
    expect(applyChoices(t, [c])).toBe('• Saved $& more');
  });
});
