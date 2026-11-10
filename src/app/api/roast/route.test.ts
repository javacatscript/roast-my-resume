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

function groqSse(deltas: string[]) {
  const enc = new TextEncoder();
  const lines = deltas.map((d) => `data: ${JSON.stringify({ choices: [{ delta: { content: d } }] })}\n\n`);
  lines.push('data: [DONE]\n\n');
  return new Response(
    new ReadableStream({
      start(c) {
        lines.forEach((l) => c.enqueue(enc.encode(l)));
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

  it('returns 400 for an invalid body', async () => {
    expect((await post({ ...body, intensity: 'nuclear' })).status).toBe(400);
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
