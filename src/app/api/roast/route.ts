import { checkLimit } from '@/lib/ratelimit';
import { validateRoastRequest } from '@/lib/limits';
import { buildMessages } from '@/lib/prompt';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Confirm the current free-tier model id in the Groq console; override with GROQ_MODEL.
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const UPSTREAM_TIMEOUT_MS = 20000;

const text = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(message, { status, headers: { 'content-type': 'text/plain', ...headers } });

function clientIp(req: Request): string {
  // x-real-ip is set by the platform (e.g. Vercel). A client-supplied x-forwarded-for is only a fallback.
  return (
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function POST(req: Request): Promise<Response> {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
    return text(415, 'Expected application/json');
  }
  if (req.headers.get('sec-fetch-site') === 'cross-site') return text(403, 'Cross-site requests are not allowed');

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return text(400, 'Invalid JSON');
  }
  const parsed = validateRoastRequest(json);
  if (!parsed.ok) return text(400, parsed.error);

  const key = process.env.GROQ_API_KEY;
  if (!key) return text(503, 'AI is not configured');

  const limit = await checkLimit(clientIp(req));
  if (!limit.ok) return text(429, 'Too many requests', { 'Retry-After': String(limit.retryAfter) });

  const { bullet, flags, intensity } = parsed.data;
  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        stream: true,
        temperature: 0.9,
        max_tokens: 400,
        messages: buildMessages(bullet, flags, intensity),
      }),
    });
  } catch {
    return text(503, 'AI is unavailable');
  }
  if (!upstream.ok || !upstream.body) return text(503, 'AI is unavailable');

  const reader = upstream.body.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buffer = '';
  let finished = false;

  /** Returns the content delta in one SSE line, or null. Throws if the line says the stream failed. */
  const readLine = (line: string): string | null => {
    const t = line.trim();
    if (!t.startsWith('data:')) return null;
    const data = t.slice(5).trim();
    if (data === '[DONE]') return null;
    let j: { error?: unknown; choices?: { delta?: { content?: string }; finish_reason?: string | null }[] };
    try {
      j = JSON.parse(data);
    } catch {
      return null; // partial or non-JSON line
    }
    if (j.error) throw new Error('Upstream error');
    const choice = j.choices?.[0];
    if (choice?.finish_reason) {
      if (choice.finish_reason !== 'stop') throw new Error('Upstream stream was cut off');
      finished = true;
    }
    return choice?.delta?.content || null;
  };

  const out = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const last = readLine(buffer);
          if (last) controller.enqueue(enc.encode(last));
          if (!finished) throw new Error('Upstream stream ended early');
          return controller.close();
        }
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        let emitted = false;
        for (const line of lines) {
          const delta = readLine(line);
          if (delta) {
            controller.enqueue(enc.encode(delta));
            emitted = true;
          }
        }
        if (emitted) return;
      }
    },
    cancel() {
      return reader.cancel();
    },
  });

  return new Response(out, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
