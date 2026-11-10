import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamRoast, RoastError, STALL_MS } from '@/lib/client';
import type { RoastRequest } from '@/lib/limits';

const req: RoastRequest = { bullet: 'Responsible for stuff', flags: [], intensity: 'high' };

function streamOf(chunks: string[], status = 200, headers: Record<string, string> = {}) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      chunks.forEach((x) => c.enqueue(enc.encode(x)));
      c.close();
    },
  });
  return new Response(body, { status, headers });
}

afterEach(() => vi.unstubAllGlobals());

describe('streamRoast', () => {
  it('passes the accumulated text to onDelta and resolves with the full text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf(['Hel', 'lo ', 'there'])));
    const seen: string[] = [];
    const full = await streamRoast(req, (t) => seen.push(t));
    expect(seen).toEqual(['Hel', 'Hello ', 'Hello there']);
    expect(full).toBe('Hello there');
  });

  it('maps 429 to a rate-limit error with retryAfter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(streamOf([], 429, { 'Retry-After': '42' })),
    );
    await expect(streamRoast(req, () => {})).rejects.toMatchObject({
      kind: 'rate-limit',
      retryAfter: 42,
    });
  });

  it('maps 503 to unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf([], 503)));
    await expect(streamRoast(req, () => {})).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('maps a thrown fetch to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const err = await streamRoast(req, () => {}).catch((e) => e);
    expect(err).toBeInstanceOf(RoastError);
    expect(err.kind).toBe('network');
  });

  it('maps 400 to rejected, which is not an outage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamOf([], 400)));
    await expect(streamRoast(req, () => {})).rejects.toMatchObject({ kind: 'rejected' });
  });

  it('maps a stream that errors mid-way to interrupted', async () => {
    const body = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('Hel'));
        c.error(new TypeError('connection reset'));
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    await expect(streamRoast(req, () => {})).rejects.toMatchObject({ kind: 'interrupted' });
  });

  it('gives up with interrupted when nothing arrives for the stall window', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn((_u: string, init: RequestInit) =>
          Promise.resolve(
            new Response(
              new ReadableStream({
                start(c) {
                  init.signal!.addEventListener('abort', () =>
                    c.error(new DOMException('aborted', 'AbortError')),
                  );
                },
              }),
            ),
          ),
        ),
      );
      const outcome = expect(streamRoast(req, () => {})).rejects.toMatchObject({ kind: 'interrupted' });
      await vi.advanceTimersByTimeAsync(STALL_MS + 50);
      await outcome;
    } finally {
      vi.useRealTimers();
    }
  });

  it('still rethrows an abort from the caller as an AbortError', async () => {
    const ctl = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn((_u: string, init: RequestInit) => {
        return new Promise((_res, rej) =>
          init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))),
        );
      }),
    );
    const p = streamRoast(req, () => {}, ctl.signal);
    ctl.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });
});
