import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/ratelimit', () => ({ checkLimit: vi.fn() }));
import { checkLimit } from '@/lib/ratelimit';
import { POST } from '@/app/api/roast/route';

const body = {
  bullet: 'Responsible for managing team tasks',
  flags: [{ rule: 'weak-phrase', detail: 'uses "responsible for"' }],
  intensity: 'high',
};

const post = (b: unknown) =>
  POST(
    new Request('http://x/api/roast', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '9.9.9.9' },
      body: JSON.stringify(b),
    }),
  );

function groqSse(
  deltas: string[],
  opts: { finish?: boolean; trailingNewline?: boolean; errorAfter?: boolean } = {},
) {
  const { finish = true, trailingNewline = true, errorAfter = false } = opts;
  const enc = new TextEncoder();
  const events = deltas.map((d) => ({ choices: [{ delta: { content: d } }] }));
  if (errorAfter) events.push({ error: { message: 'overloaded' } } as never);
  if (finish) events.push({ choices: [{ delta: {}, finish_reason: 'stop' }] } as never);
  let text = events.map((e) => `data: ${JSON.stringify(e)}`).join('\n\n');
  text += trailingNewline ? '\n\ndata: [DONE]\n\n' : '';
  return new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(text));
        c.close();
      },
    }),
    { status: 200 },
  );
}

beforeEach(() => {
  process.env.GROQ_API_KEY = 'test-key';
  vi.mocked(checkLimit).mockResolvedValue({ ok: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GROQ_API_KEY;
});

describe('POST /api/roast', () => {
  it('streams the concatenated model deltas and sends stream:true with the built messages', async () => {
    const f = vi.fn().mockResolvedValue(groqSse(['Bad ', 'bullet.']));
    vi.stubGlobal('fetch', f);
    const res = await post(body);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Bad bullet.');
    const sent = JSON.parse(f.mock.calls[0][1].body);
    expect(sent.stream).toBe(true);
    expect(sent.messages[0].role).toBe('system');
    expect(sent.messages[1].content).toContain('<bullet>Responsible for managing team tasks</bullet>');
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer test-key');
  });

  it('returns 400 for an invalid body, without spending rate limit on it', async () => {
    expect((await post({ ...body, intensity: 'nuclear' })).status).toBe(400);
    expect(checkLimit).not.toHaveBeenCalled();
  });

  it('rejects a non-json content type with 415', async () => {
    const res = await POST(
      new Request('http://x/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(415);
  });

  it('rejects cross-site browser requests with 403', async () => {
    const res = await POST(
      new Request('http://x/api/roast', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' },
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('prefers x-real-ip over a client-supplied x-forwarded-for', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groqSse(['x'])));
    await POST(
      new Request('http://x/api/roast', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-real-ip': '7.7.7.7',
          'x-forwarded-for': '6.6.6.6, 5.5.5.5',
        },
        body: JSON.stringify(body),
      }),
    );
    expect(checkLimit).toHaveBeenCalledWith('7.7.7.7');
  });

  it('gives the upstream request an abort signal with a timeout', async () => {
    const f = vi.fn().mockResolvedValue(groqSse(['x']));
    vi.stubGlobal('fetch', f);
    await post(body);
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('errors the stream when Groq sends an in-band error event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groqSse(['Partial'], { errorAfter: true })));
    const res = await post(body);
    await expect(res.text()).rejects.toBeTruthy();
  });

  it('errors the stream when it ends without a stop finish_reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groqSse(['Partial'], { finish: false })));
    const res = await post(body);
    await expect(res.text()).rejects.toBeTruthy();
  });

  it('flushes a final data line that has no trailing newline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(groqSse(['Bad ', 'one.'], { trailingNewline: false })));
    const res = await post(body);
    expect(await res.text()).toBe('Bad one.');
  });

  it('returns 429 with Retry-After when rate limited', async () => {
    vi.mocked(checkLimit).mockResolvedValue({ ok: false, retryAfter: 30 });
    const res = await post(body);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('returns 503 when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;
    expect((await post(body)).status).toBe(503);
  });

  it('returns 503 when Groq fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    expect((await post(body)).status).toBe(503);
  });

  it('never logs the resume text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    const spies = (['log', 'info', 'warn', 'error'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    await post(body);
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    expect(logged).not.toContain('managing team tasks');
  });
});
