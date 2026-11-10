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

  it('scan-done on an empty scan returns to input with a message, not a praise card', () => {
    const s = gameReducer(
      gameReducer(initialState, { type: 'start-scan', intensity: 'mild' }),
      { type: 'scan-done', result: scanResume('hello world') },
    );
    expect(s.phase).toBe('input');
    expect(s.cards).toEqual([]);
    expect(s.notice).toMatch(/couldn't find any bullets/i);
    expect(s.intensity).toBe('mild');
  });

  it('reset returns to the initial state', () => {
    expect(gameReducer(ready(playing()), { type: 'reset' })).toEqual(initialState);
  });
});

describe('applyChoices', () => {
  const build = (text: string, chosen: Record<number, string>): GameCard[] =>
    scanResume(text).all.map((bullet) => ({
      bullet, status: 'ready', source: 'ai', roast: 'r',
      rewrite: chosen[bullet.id] ?? 'unused',
      choice: bullet.id in chosen ? 'rewrite' : 'pending',
    }));

  it('swaps in the ai rewrite when it was chosen and keeps the bullet marker', () => {
    const t = '• Did a thing for many users\n• Other thing here for users';
    expect(applyChoices(t, build(t, { 0: 'NEW' }))).toBe('• NEW\n• Other thing here for users');
  });

  it('uses edited text for edited cards', () => {
    const t = '• Did a thing for many users';
    const cards = build(t, {}).map((c) => ({ ...c, choice: 'edited' as const, edited: 'Mine' }));
    expect(applyChoices(t, cards)).toBe('• Mine');
  });

  it('leaves original and pending choices alone', () => {
    const t = '• Did a thing for many users';
    expect(applyChoices(t, build(t, {}))).toBe(t);
    const orig = build(t, {}).map((c) => ({ ...c, choice: 'original' as const }));
    expect(applyChoices(t, orig)).toBe(t);
  });

  it('never swaps in a canned tip as if it were a rewrite', () => {
    const t = '• Did a thing for many users';
    const cards = build(t, { 0: 'TIP' }).map((c) => ({ ...c, source: 'canned' as const }));
    expect(applyChoices(t, cards)).toBe(t);
  });

  it('replaces a whole wrapped bullet', () => {
    const t = '• Reduced the cost of cloud\n  infrastructure across regions';
    expect(applyChoices(t, build(t, { 0: 'NEW' }))).toBe('• NEW');
  });

  it('replaces the right one of two identical bullets', () => {
    const t = '• Managed vendor contracts for the team\n• Managed vendor contracts for the team';
    expect(applyChoices(t, build(t, { 1: 'NEW' }))).toBe(
      '• Managed vendor contracts for the team\n• NEW',
    );
  });

  it('does not touch a longer line that merely contains the bullet text', () => {
    const t = [
      '• Built dashboards for the sales team',
      'Built dashboards for the sales team using React and D3 at scale',
    ].join('\n');
    const out = applyChoices(t, build(t, { 0: 'NEW' }));
    expect(out).toContain('Built dashboards for the sales team using React and D3 at scale');
    expect(out.startsWith('• NEW\n')).toBe(true);
  });

  it('does not match inside a rewrite that was already inserted', () => {
    const t = '• First bullet about many things here\n• Second bullet about other things there';
    const out = applyChoices(t, build(t, { 0: 'FIRST mentions Second bullet about other things there', 1: 'SECOND' }));
    expect(out).toBe('• FIRST mentions Second bullet about other things there\n• SECOND');
  });

  it('normalizes CRLF and handles $ patterns in the replacement', () => {
    const t = '• Saved money for many users\r\n• Other thing here for users';
    const out = applyChoices(t, build(t, { 0: 'Saved $& more' }));
    expect(out).toBe('• Saved $& more\n• Other thing here for users');
  });
});
