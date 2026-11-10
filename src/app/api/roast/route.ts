import { checkLimit } from '@/lib/ratelimit';
import { validateRoastRequest } from '@/lib/limits';
import { buildMessages } from '@/lib/prompt';

export const runtime = 'nodejs';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Confirm the current free-tier model id in the Groq console; override with GROQ_MODEL.
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const text = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(message, { status, headers: { 'content-type': 'text/plain', ...headers } });

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = await checkLimit(ip);
  if (!limit.ok) return text(429, 'Too many requests', { 'Retry-After': String(limit.retryAfter) });

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

  const { bullet, flags, intensity } = parsed.data;
  let upstream: Response;
  try {
    upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
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

  const out = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return controller.close();
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        let emitted = false;
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const data = t.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(enc.encode(delta));
              emitted = true;
            }
          } catch {
            /* ignore partial or non-JSON lines */
          }
        }
        if (emitted) return;
      }
    },
    cancel() {
      return reader.cancel();
    },
  });

  return new Response(out, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
