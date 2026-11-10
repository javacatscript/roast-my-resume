import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamRoast, RoastError } from '@/lib/client';
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
});
