import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/client', async (orig) => ({
  ...(await orig<typeof import('@/lib/client')>()),
  streamRoast: vi.fn(),
}));
import { streamRoast, RoastError } from '@/lib/client';
import { useRoastGame } from '@/hooks/useRoastGame';
import { REWRITE_MARK, TAGS_MARK } from '@/lib/streamFormat';
import { ruleTip } from '@/lib/canned';

const TEXT = '• Responsible for managing the release process\n• Helped with improving website speed';
const VALID = `Bad.${REWRITE_MARK}Led releases for [N] teams.${TAGS_MARK}weak-phrase`;
const mock = vi.mocked(streamRoast);

const validStream = async (_r: unknown, onDelta: (raw: string) => void) => {
  onDelta(VALID.slice(0, 5));
  onDelta(VALID);
  return VALID;
};

function setup() {
  const hook = renderHook(() => useRoastGame({ scanDelayMs: 0 }));
  act(() => hook.result.current.start(TEXT, 'high'));
  return hook;
}
const card0Ready = (h: ReturnType<typeof setup>) =>
  waitFor(() => expect(h.result.current.state.cards[0]?.status).toBe('ready'));

beforeEach(() => {
  mock.mockReset();
});

describe('useRoastGame', () => {
  it('turns a valid stream into a ready ai card', async () => {
    mock.mockImplementation(validStream as never);
    const h = setup();
    await card0Ready(h);
    expect(h.result.current.state.cards[0]).toMatchObject({
      source: 'ai', roast: 'Bad.', rewrite: 'Led releases for [N] teams.',
    });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('retries once on invalid output, then falls back without showing the invalid text', async () => {
    mock.mockResolvedValue('garbage with no delimiters');
    const h = setup();
    await card0Ready(h);
    expect(mock).toHaveBeenCalledTimes(2);
    const c = h.result.current.state.cards[0];
    expect(c.source).toBe('canned');
    expect(c.rewrite).toBe(ruleTip('weak-phrase'));
    expect(c.roast + c.rewrite).not.toContain('garbage');
    expect(h.result.current.state.aiAvailable).toBe(true);
  });

  it('recovers when the retry produces a valid card', async () => {
    mock.mockResolvedValueOnce('garbage').mockImplementationOnce(validStream as never);
    const h = setup();
    await card0Ready(h);
    expect(mock).toHaveBeenCalledTimes(2);
    expect(h.result.current.state.cards[0].source).toBe('ai');
  });

  it('falls back immediately on a rate limit, turns ai off, and skips ai for later cards', async () => {
    mock.mockRejectedValue(new RoastError('rate-limit', 'limited', 30));
    const h = setup();
    await card0Ready(h);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(h.result.current.state.aiAvailable).toBe(false);
    expect(h.result.current.state.notice).toBeTruthy();
    act(() => h.result.current.next());
    await waitFor(() => expect(h.result.current.state.cards[1].status).toBe('ready'));
    expect(h.result.current.state.cards[1].source).toBe('canned');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('keeps the first choice when choose is called twice quickly', async () => {
    mock.mockImplementation(validStream as never);
    const h = setup();
    await card0Ready(h);
    act(() => {
      h.result.current.choose('rewrite');
      h.result.current.choose('original');
    });
    expect(h.result.current.state.cards[0].choice).toBe('rewrite');
  });

  it('finalText swaps in the chosen ai rewrite', async () => {
    mock.mockImplementation(validStream as never);
    const h = setup();
    await card0Ready(h);
    act(() => h.result.current.choose('rewrite'));
    const out = h.result.current.finalText(TEXT);
    expect(out).toContain('Led releases for [N] teams.');
    expect(out).not.toContain('Responsible for managing the release process');
  });

  it('reset returns to the input phase', async () => {
    mock.mockImplementation(validStream as never);
    const h = setup();
    await card0Ready(h);
    act(() => h.result.current.reset());
    expect(h.result.current.state.phase).toBe('input');
  });
});
